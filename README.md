# 🧠 Labirint-AI

Interaktivní AI hra, která kombinuje **učení + hacking simulaci + mini-game mechaniky**.

---

## 🎮 O projektu

Labirint-AI je mini hra, kde hráč komunikuje s AI terminálem.

Můžeš:

* 📄 nahrát dokument (např. poznámky)
* 💬 nebo jen napsat téma (např. `DNS, DHCP, IPv4, IPv6`)

AI následně vytvoří **interaktivní test ve stylu "hacking terminálu"**.

---

## 🕹️ Jak hra funguje

1. Zadáš téma nebo dokument
2. AI spustí simulaci "hackování systému"
3. Dostaneš otázku + 3 možnosti:

   * A
   * B
   * C
4. Musíš projít všechny otázky

---

## 💀 Když selžeš

Pokud test neprojdeš:

* 🎮 dostaneš možnost zahrát mini-hru
* ⚔️ porazíš "bosse"
* 🔓 získáš druhou šanci

---

## 🧠 Po úspěšném dokončení

AI ti zobrazí:

* detailní analýzu odpovědí
* kde jsi udělal chyby
* vysvětlení správných odpovědí
* doporučení co se doučit

---

## 🚀 Deploy (ITHope server)

Projekt je připraven na jednoduchý deploy přes Docker.

### Požadavky:

* Dockerfile v rootu
* aplikace musí běžet na PORT z env

---

## ⚙️ Environment variables

Nikdy nedávej do Gitu reálné klíče!

Vytvoř `.env` lokálně:

```
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://kurim.ithope.eu/v1
```

---

## 🐳 Dockerfile (example)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "app.py"]
```

---

## 🧩 Použití AI API (example)

```python
from openai import OpenAI
import httpx

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url=os.environ.get("OPENAI_BASE_URL"),
    http_client=httpx.Client(verify=False)
)
```

---

## 📁 Struktura projektu (doporučená)

```
/app.py
/game/
  logic.py
  questions.py
/api/
  routes.py
/static/
README.md
requirements.txt
Dockerfile
.gitignore
```

---

## 🧠 Nápad projektu

Cíl projektu:

> Udělat učení zábavnější pomocí AI, gamifikace a simulace hackování.

---

## 🔮 Možná vylepšení

* 🌐 Web UI (React / jednoduchý HTML)
* 🧾 historie pokusů
* 🧑‍💻 multiplayer (soutěžení)
* 📊 score systém
* 🎯 různé obtížnosti

---

## ⚠️ Bezpečnost

* nikdy necommituj `.env`
* nikdy nesdílej API klíč veřejně
* používej environment variables

---

## 👨‍💻 Autor

Projekt vytvořen jako experiment kombinující:

* AI
* hry
* vzdělávání
