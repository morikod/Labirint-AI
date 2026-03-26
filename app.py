import os
from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import httpx

app = Flask(__name__, static_folder='static', template_folder='templates')

# Klient pro AI
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url=os.environ.get("OPENAI_BASE_URL", "https://kurim.ithope.eu/v1"),
    http_client=httpx.Client(verify=False)
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.json
    user_prompt = data.get('prompt', '')
    
    # Jednoduché instrukce
    instructions = (
        "Jsi vypravěč textové mini-hry. Tvé odpovědi musí být velmi KRÁTKÉ (max 2 věty příběhu).\n"
        "1. Pokud je is_start=True, vezmi 3 slova a vytvoř úvod, malý ASCII art a volby A, B, C.\n"
        "2. Pokud is_start=False, uživatel SMÍ zadat pouze 'A', 'B' nebo 'C'.\n"
        "3. Pokud uživatel napíše cokoli jiného než A, B nebo C, odpověz POUZE větou: 'Prosím, vyberte si z variant A, B nebo C.'\n"
        "4. ASCII art dělej velmi malý (max 5 řádků)."
    )

    try:
        response = client.chat.completions.create(
            model="gemma3:27b",
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": user_prompt}
            ]
        )
        return jsonify({"response": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"response": f"Chyba AI: {str(e)}"}), 500

if __name__ == '__main__':
    # Zásadní pro školní hosting: Dynamický port
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
