const output = document.getElementById('output');
const input = document.getElementById('user-input');
const btn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const bossUi = document.getElementById('boss-ui');

let gameStarted = false;

async function typeWriter(text) {
    const div = document.createElement('div');
    div.className = 'ai-response';
    div.style.whiteSpace = 'pre-wrap'; // Чтобы работали переносы строк
    output.appendChild(div);
    for (let char of text) {
        div.innerHTML += char;
        output.scrollTop = output.scrollHeight;
        await new Promise(r => setTimeout(r, 10)); 
    }
}

async function playGame() {
    let rawText = input.value.trim();
    if (!rawText && !gameStarted) return;

    if (gameStarted && !['A', 'B', 'C'].includes(rawText.toUpperCase())) {
        await typeWriter("\n[ ERROR ]: Zadejte pouze A, B nebo C.");
        input.value = '';
        return;
    }

    const processedText = rawText;
    input.value = '';
    input.disabled = true;

    try {
        let response;
        if (!gameStarted) {
            const formData = new FormData();
            formData.append('topic', processedText || "General IT");
            if (fileInput.files[0]) formData.append('file', fileInput.files[0]);
            response = await fetch('/api/start', { method: 'POST', body: formData });
        } else {
            response = await fetch('/api/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: processedText })
            });
        }

        const data = await response.json();

        if (data.status === "game") {
            gameStarted = true;
            let msg = "";
            if (data.wrong_answer) {
                msg += `\n[ CHYBA ]: Správně bylo: ${data.last_correct}\n`;
                msg += `------------------------------------------\n`;
            }
            
            const q = data.data;
            msg += `\n[ OTÁZKA ${data.progress}/10 ]\n${q.q}\n\n`;
            msg += ` A) ${q.a}\n`;
            msg += ` B) ${q.b}\n`;
            msg += ` C) ${q.c}\n\n`;
            msg += `> Vaše volba:`;
            
            await typeWriter(msg);
        } 
        else if (data.status === "boss_fight") {
            await typeWriter("\n[ !!! ] SECURITY ALERT: Spouštím Boss Fight!");
            startBossFight();
        }
        else if (data.status === "win") {
            await typeWriter("\n[ ACCESS GRANTED ]: Systém hacknut! Všechny otázky dokončeny.");
        }

    } catch (err) {
        await typeWriter("\n[ ERROR ]: Spojení se serverem selhalo.");
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function startBossFight() {
    bossUi.style.display = 'block';
    let wins = 0;
    const target = document.getElementById('target-char');
    const progress = document.getElementById('boss-progress');
    
    function nextChar() {
        if (wins >= 5) {
            bossUi.style.display = 'none';
            fetch('/api/boss_success', { method: 'POST' }).then(() => {
                typeWriter("\n[ BOSS DEFEATED ]: Přístup obnoven. Pokračuj v testu...");
            });
            return;
        }
        target.innerText = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    }

    window.onkeydown = (e) => {
        if (bossUi.style.display === 'block' && e.key.toUpperCase() === target.innerText) {
            wins++;
            progress.innerText = `Sync: ${wins} / 5`;
            nextChar();
        }
    };
    nextChar();
}

btn.onclick = playGame;
input.onkeydown = (e) => { if (e.key === 'Enter') playGame(); };

// Уведомление о файле
fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
        const info = document.createElement('div');
        info.innerHTML = `\n[ INFO ]: Soubor ${fileInput.files[0].name} připraven.`;
        info.style.color = "#00ff41";
        output.appendChild(info);
    }
};
