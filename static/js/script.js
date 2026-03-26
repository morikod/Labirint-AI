const output = document.getElementById('output');
const input = document.getElementById('user-input');
const btn = document.getElementById('send-btn');
const stopBtn = document.getElementById('stop-btn');

let gameStarted = false; // Sleduje, jestli už proběhl úvod

function typeText(element, text, speed = 15) {
    return new Promise((resolve) => {
        let i = 0;
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                output.scrollTop = output.scrollHeight;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
}

async function playGame() {
    const text = input.value.trim();
    if (!text) return;

    // VALIDACE: Pokud hra běží, povolíme jen A, B, C
    if (gameStarted) {
        const check = text.toUpperCase();
        if (check !== 'A' && check !== 'B' && check !== 'C') {
            output.innerHTML += `\n> ${text}\n<span class="error-msg">[SYSTÉM]: Neplatný vstup. Vyberte A, B nebo C.</span>\n`;
            input.value = '';
            output.scrollTop = output.scrollHeight;
            return;
        }
    }

    output.innerHTML += `\n> ${text}\n`;
    const isStartTurn = !gameStarted;
    input.value = '';
    input.disabled = true;
    btn.disabled = true;

    const typingMsg = document.createElement('div');
    typingMsg.className = 'system-msg';
    typingMsg.innerText = '[ AI přemýšlí... ]';
    output.appendChild(typingMsg);

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: text,
                is_start: isStartTurn 
            })
        });

        const data = await response.json();
        typingMsg.remove();
        
        const responseContainer = document.createElement('span');
        output.appendChild(responseContainer);
        await typeText(responseContainer, data.response);
        
        output.innerHTML += `\n--------------------------\n`;
        gameStarted = true; // Hra oficiálně začala
        
    } catch (err) {
        if(typingMsg) typingMsg.remove();
        output.innerHTML += `\n<span class="error-msg">[CHYBA]: Server neodpovídá.</span>\n`;
    } finally {
        input.disabled = false;
        btn.disabled = false;
        input.focus();
        output.scrollTop = output.scrollHeight;
    }
}

// Funkce pro ukončení/reset hry
stopBtn.onclick = () => {
    output.innerHTML = "[ SYSTEM ]: Hra byla restartována.\nZadejte 3 slova pro začátek příběhu...\n--------------------------";
    gameStarted = false;
    input.value = '';
    input.focus();
};

btn.onclick = playGame;
input.onkeypress = (e) => { if (e.key === 'Enter') playGame(); };
