const output = document.getElementById('output');
const input = document.getElementById('user-input');
const btn = document.getElementById('send-btn');
const stopBtn = document.getElementById('stop-btn');
const langSelect = document.getElementById('lang-select');

let gameStarted = false;

async function playGame() {
    let text = input.value.trim();
    if (!text) return;

    if (gameStarted) {
        let cleanText = text.replace(/[^a-zA-Z]/g, "").toUpperCase();
        if (!['A', 'B', 'C'].includes(cleanText)) {
            output.innerHTML += `\n> ${text}\n[ SYSTEM ]: Vyberte A, B nebo C.\n`;
            input.value = '';
            return;
        }
        text = cleanText;
    }

    output.innerHTML += `\n> ${text}\n`;
    const isStart = !gameStarted;
    const currentLang = langSelect.value;
    input.value = '';
    input.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: text, 
                is_start: isStart,
                lang: currentLang 
            })
        });

        const data = await response.json();
        output.innerHTML += `\n${data.response}\n--------------------------\n`;
        gameStarted = true;
    } catch (err) {
        output.innerHTML += `\n[ ERROR ]\n`;
    } finally {
        input.disabled = false;
        input.focus();
        output.scrollTop = output.scrollHeight;
    }
}

stopBtn.onclick = () => {
    location.reload(); // Nejrychlejší reset i s vymazáním paměti
};

btn.onclick = playGame;
input.onkeypress = (e) => { if (e.key === 'Enter') playGame(); };
