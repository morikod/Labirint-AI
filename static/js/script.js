document.addEventListener('DOMContentLoaded', () => {
    // Экраны
    const landing = document.getElementById('landing');
    const profileSetup = document.getElementById('profile-setup');
    const chatInterface = document.getElementById('chat-interface');
    
    // Элементы
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const currentModeBadge = document.getElementById('current-mode');

    // Состояние
    let mode = 'quick';
    let profileData = {};
    let messages = [];

    // Навигация
    document.getElementById('btn-quick').onclick = () => {
        mode = 'quick';
        currentModeBadge.innerText = '⚡ Quick Mode';
        landing.classList.remove('active');
        chatInterface.classList.add('active');
        addMessage('ai', 'Отлично! Расскажи вкратце, кому ищем подарок и по какому поводу?');
    };

    document.getElementById('btn-full').onclick = () => {
        mode = 'full';
        landing.classList.remove('active');
        profileSetup.classList.add('active');
    };

    document.getElementById('btn-save-profile').onclick = () => {
        profileData = {
            name: document.getElementById('prof-name').value || 'Аноним',
            relation: document.getElementById('prof-relation').value || 'Близкий',
            interests: document.getElementById('prof-interests').value || 'Разное'
        };
        currentModeBadge.innerText = '👤 Profile Mode';
        profileSetup.classList.remove('active');
        chatInterface.classList.add('active');
        addMessage('ai', `Профиль для ${profileData.name} сохранен! Что мы ищем сегодня?`);
    };

    // Чат логика
    function addMessage(role, text) {
        const div = document.createElement('div');
        div.className = `msg ${role}`;
        div.innerText = text;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        if(role !== 'system') {
            messages.push({role: role === 'ai' ? 'assistant' : 'user', content: text});
        }
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typing';
        div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function removeTyping() {
        const typing = document.getElementById('typing');
        if (typing) typing.remove();
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage('user', text);
        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        showTyping();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, mode, profile: profileData })
            });
            const data = await response.json();
            removeTyping();
            addMessage('ai', data.reply);
        } catch (e) {
            removeTyping();
            addMessage('ai', 'Ошибка соединения с сервером.');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    sendBtn.onclick = sendMessage;
    userInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
});
