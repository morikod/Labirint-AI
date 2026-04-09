import os
import uuid
import re
import time
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from sqlalchemy import create_engine, text

app = Flask(__name__)

API_KEY  = os.environ.get("OPENAI_API_KEY", "")
BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://kurim.ithope.eu/v1")
MODEL    = "gemma3:27b"
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///local.db")

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

SYSTEM_PROMPT = """Jsi GiftMind, přátelský AI asistent pro výběr dárků.
Pomáháš najít ideální dárek tím, že kladeš chytré otázky.

Pravidla:
- Komunikuj česky, přátelsky a s lehkým humorem
- Pokládej vždy jen jednu otázku najednou
- Vyhýbej se banálním dárkům (ponožky, generické sady, nudné věci)
- Zohledni zájmy, věk, příležitost a rozpočet
- Jakmile máš dostatek informací, navrhni přesně 3 konkrétní dárky
- Každý dárek formátuj takto:

🎁 **Název dárku**
📝 Proč se hodí: [vysvětlení]
💰 Cena: [rozsah v Kč]
🛒 Kde koupit: [konkrétní obchody / weby]

- Po navržení dárků se zeptej: "Který z návrhů se ti líbí nejvíc? Nebo chceš něco upřesnit?"
- Pokud máš k dispozici profil příjemce, využij ta data co nejvíc"""

TOKEN_RE = re.compile(r'^[a-zA-Z0-9\-]{8,64}$')

# ── DB setup ────────────────────────────────────────────
engine = None

def init_db():
    global engine
    for i in range(15):
        try:
            engine = create_engine(DATABASE_URL)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            break
        except Exception as e:
            print(f"Čekám na databázi... pokus {i+1} ({e})")
            time.sleep(3)

    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS profiles (
                id          TEXT PRIMARY KEY,
                owner       TEXT NOT NULL,
                name        TEXT NOT NULL,
                age         TEXT,
                gender      TEXT,
                relation    TEXT,
                interests   TEXT,
                notes       TEXT,
                created_at  TEXT
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS gifts (
                id           TEXT PRIMARY KEY,
                owner        TEXT NOT NULL,
                profile_id   TEXT,
                profile_name TEXT,
                name         TEXT NOT NULL,
                occasion     TEXT,
                budget       TEXT,
                my_rating    INTEGER,
                my_comment   TEXT,
                created_at   TEXT
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS gift_insights (
                id          TEXT PRIMARY KEY,
                occasion    TEXT,
                interests   TEXT,
                gift_name   TEXT,
                rating      INTEGER,
                created_at  TEXT
            )
        """))
        conn.commit()
    print("✅ Databáze připravena")

# ── Helpers ─────────────────────────────────────────────
def get_user_id():
    token = request.headers.get('X-Session-Token', '').strip()
    if token and TOKEN_RE.match(token):
        return token
    return 'anon-' + str(uuid.uuid4())

def row_to_profile(row):
    return {
        "id": row.id, "owner": row.owner, "name": row.name,
        "age": row.age, "gender": row.gender, "relation": row.relation,
        "interests": row.interests, "notes": row.notes,
        "created_at": row.created_at,
    }

def row_to_gift(row):
    return {
        "id": row.id, "owner": row.owner, "profile_id": row.profile_id,
        "profile_name": row.profile_name, "name": row.name,
        "occasion": row.occasion, "budget": row.budget,
        "my_rating": row.my_rating, "my_comment": row.my_comment,
        "created_at": row.created_at,
    }

# ── Routes ───────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    body     = request.get_json()
    messages = body.get("messages", [])
    profile  = body.get("profile", None)

    system = SYSTEM_PROMPT

    if profile:
        system += (
            f"\n\nProfil příjemce dárku:\n"
            f"Jméno: {profile.get('name','—')}\n"
            f"Věk: {profile.get('age','—')}\n"
            f"Vztah: {profile.get('relation','—')}\n"
            f"Zájmy: {profile.get('interests','—')}\n"
            f"Poznámky: {profile.get('notes','—')}"
        )

    # ⭐ Подгружаем топ подарков из общей базы знаний
    try:
        with engine.connect() as conn:
            rows = conn.execute(text("""
                SELECT gift_name, occasion, interests, rating
                FROM gift_insights
                ORDER BY rating DESC, created_at DESC
                LIMIT 20
            """)).fetchall()

        if rows:
            system += "\n\nOsvědčené dárky od jiných uživatelů (hodnocení 4-5⭐):\n"
            for r in rows:
                system += f"- {r.gift_name}"
                if r.occasion:  system += f" (příležitost: {r.occasion})"
                if r.interests: system += f" (zájmy: {r.interests})"
                system += f" — {r.rating}⭐\n"
            system += "\nTyto dárky se osvědčily — preferuj podobné nápady pokud se hodí."
    except:
        pass

    api_messages = [{"role": "system", "content": system}] + messages

    try:
        response = client.chat.completions.create(
            model=MODEL, messages=api_messages,
            max_tokens=1000, temperature=0.8,
        )
        return jsonify({"reply": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"reply": f"Chyba připojení k AI: {e}"}), 500


@app.route("/api/profile", methods=["POST"])
def save_profile():
    uid  = get_user_id()
    data = request.get_json()
    pid  = str(uuid.uuid4())
    now  = datetime.now().isoformat()

    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO profiles
              (id, owner, name, age, gender, relation, interests, notes, created_at)
            VALUES
              (:id,:owner,:name,:age,:gender,:relation,:interests,:notes,:created_at)
        """), {
            "id": pid, "owner": uid,
            "name": data.get("name",""), "age": data.get("age",""),
            "gender": data.get("gender",""), "relation": data.get("relation",""),
            "interests": data.get("interests",""), "notes": data.get("notes",""),
            "created_at": now,
        })
        conn.commit()

    profile = {"id": pid, "owner": uid, "created_at": now, **{
        k: data.get(k,"") for k in ["name","age","gender","relation","interests","notes"]
    }}
    return jsonify({"success": True, "profile": profile})


@app.route("/api/profiles", methods=["GET"])
def get_profiles():
    uid = get_user_id()
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM profiles WHERE owner=:uid ORDER BY created_at"),
            {"uid": uid}
        ).fetchall()
    return jsonify([row_to_profile(r) for r in rows])


@app.route("/api/profile/<profile_id>", methods=["DELETE"])
def delete_profile(profile_id):
    uid = get_user_id()
    with engine.connect() as conn:
        result = conn.execute(
            text("DELETE FROM profiles WHERE id=:id AND owner=:uid"),
            {"id": profile_id, "uid": uid}
        )
        conn.execute(
            text("DELETE FROM gifts WHERE profile_id=:id AND owner=:uid"),
            {"id": profile_id, "uid": uid}
        )
        conn.commit()
    return jsonify({"success": result.rowcount > 0})


@app.route("/api/gift", methods=["POST"])
def save_gift():
    uid  = get_user_id()
    data = request.get_json()
    gid  = str(uuid.uuid4())
    now  = datetime.now().isoformat()

    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO gifts
              (id,owner,profile_id,profile_name,name,occasion,budget,my_rating,my_comment,created_at)
            VALUES
              (:id,:owner,:profile_id,:profile_name,:name,:occasion,:budget,:my_rating,:my_comment,:created_at)
        """), {
            "id": gid, "owner": uid,
            "profile_id":   data.get("profile_id"),
            "profile_name": data.get("profile_name",""),
            "name":         data.get("name",""),
            "occasion":     data.get("occasion",""),
            "budget":       data.get("budget",""),
            "my_rating":    data.get("my_rating", 0),
            "my_comment":   data.get("my_comment",""),
            "created_at":   now,
        })

        # ⭐ Если оценка 4 или 5 — сохраняем в общую базу знаний
        if data.get("my_rating", 0) >= 4:
            conn.execute(text("""
                INSERT INTO gift_insights (id, occasion, interests, gift_name, rating, created_at)
                VALUES (:id, :occasion, :interests, :gift_name, :rating, :created_at)
            """), {
                "id":         str(uuid.uuid4()),
                "occasion":   data.get("occasion", ""),
                "interests":  data.get("profile_interests", ""),
                "gift_name":  data.get("name", ""),
                "rating":     data.get("my_rating", 0),
                "created_at": now,
            })
        conn.commit()

    gift = {"id": gid, "owner": uid, "created_at": now, **{
        k: data.get(k) for k in
        ["profile_id","profile_name","name","occasion","budget","my_rating","my_comment"]
    }}
    return jsonify({"success": True, "gift": gift})


@app.route("/api/gifts", methods=["GET"])
def get_gifts():
    uid        = get_user_id()
    profile_id = request.args.get("profile_id")
    with engine.connect() as conn:
        if profile_id:
            rows = conn.execute(
                text("SELECT * FROM gifts WHERE owner=:uid AND profile_id=:pid ORDER BY created_at"),
                {"uid": uid, "pid": profile_id}
            ).fetchall()
        else:
            rows = conn.execute(
                text("SELECT * FROM gifts WHERE owner=:uid ORDER BY created_at"),
                {"uid": uid}
            ).fetchall()
    return jsonify([row_to_gift(r) for r in rows])


@app.route("/api/gift/<gift_id>", methods=["DELETE"])
def delete_gift(gift_id):
    uid = get_user_id()
    with engine.connect() as conn:
        conn.execute(
            text("DELETE FROM gifts WHERE id=:id AND owner=:uid"),
            {"id": gift_id, "uid": uid}
        )
        conn.commit()
    return jsonify({"success": True})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
