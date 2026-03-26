const output = document.getElementById('output');
const input = document.getElementById('user-input');
const btn = document.getElementById('send-btn');
const stopBtn = document.getElementById('stop-btn');

let gameStarted = false;

function typeText(element, text, speed = 10) {
    return new Promise((resolve) => {
        let i = 0;
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                output.scrollTop = output.scrollHeight;
                setTimeout(type, speed);
            } else { resolve(); }
        }
        type();
    });
}

async function playGame() {
    let text = input.value.trim();
    if (!text) return;

    // Pokud hra běží, vyčistíme vstup (např. z "A)" uděláme jen "A")
    if (gameStarted) {
        let cleanText = text.replace(/[^a-zA-Z]/g, "").toUpperCase(); // Odstraní závorky, tečky atd.
        if (cleanText !== 'A' && cleanText !== 'B' && cleanText !== 'C') {
            output.innerHTML += `\n> ${text}\n<span class="error-msg">[SYSTÉM]: Neplatný vstup. Napište pouze A, B nebo C.</span>\n`;
            input.value = '';
            output.scrollTop = output.scrollHeight;
            return;
        }
        text = cleanText; // Pošleme na server jen čisté písmeno
    }

    output.innerHTML += `\n> ${text}\n`;
    const isStartTurn = !gameStarted;
    input.value = '';
    input.disabled = true;

    const typingMsg = document.createElement('div');
    typingMsg.className = 'system-msg';
    typingMsg.innerText = '[ AI generuje pokračování... ]';
    output.appendChild(typingMsg);

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text, is_start: isStartTurn })
        });

        const data = await response.json();
        typingMsg.remove();
        
        const responseContainer = document.createElement('span');
        output.appendChild(responseContainer);
        await typeText(responseContainer, data.response);
        
        output.innerHTML += `\n--------------------------\n`;
        gameStarted = true;
        
    } catch (err) {
        if(typingMsg) typingMsg.remove();
        output.innerHTML += `\n<span class="error-msg">[CHYBA]: Spojení se serverem selhalo.</span>\n`;
    } finally {
        input.disabled = false;
        input.focus();
        output.scrollTop = output.scrollHeight;
    }
}

stopBtn.onclick = () => {
    output.innerHTML = "[ SYSTEM ]: Hra restartována.\nZadejte 3 slova...\n--------------------------";
    gameStarted = false;
    input.value = '';
};

btn.onclick = playGame;
input.onkeypress = (e) => { if (e.key === 'Enter') playGame(); };
