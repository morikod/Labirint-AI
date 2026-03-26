import os
from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import httpx

app = Flask(__name__, static_folder='static', template_folder='templates')

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
    user_prompt = data.get('prompt', '').strip().upper()
    is_start = data.get('is_start', False)
    
    # UPRAVENÉ INSTRUKCE: AI teď musí generovat příběh!
    instructions = (
        "Jsi vypravěč textové hry. Piš česky a buď stručný (2 věty).\n"
        "1. Pokud is_start=True: Vytvoř úvod ze 3 slov, malý ASCII art a volby A, B, C.\n"
        "2. Pokud is_start=False: Uživatel si vybral možnost (A, B nebo C). "
        "TY MUSÍŠ: Pokračovat v příběhu podle té volby, nakreslit nový ASCII art a dát DALŠÍ 3 volby (A, B, C).\n"
        "3. Pokud uživatel napíše nesmysl, slušně ho vrať k volbě A, B, C."
    )

    try:
        response = client.chat.completions.create(
            model="gemma3:27b",
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": f"{'START HRY: ' if is_start else 'HRÁČ VOLÍ: '}{user_prompt}"}
            ]
        )
        return jsonify({"response": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"response": f"Chyba: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
