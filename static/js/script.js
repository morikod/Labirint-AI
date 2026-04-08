const App = (() => {

  // ── Stav ──────────────────────────────────────────────
  let currentScreen = 'screen-landing';
  let previousScreen = 'screen-landing';
  let messages = [];          // [{role, content}]
  let activeProfile = null;   // objekt profilu
  let profiles = [];          // načtené profily
  let starRating = 0;
  let sidebarOpen = false;

  const TAGS = [
    '🎮 Hry', '⚽ Sport', '🎵 Hudba', '📚 Knihy', '🎬 Filmy', '🍕 Vaření',
    '✈️ Cestování', '🎨 Tvoření', '💻 Technologie', '👔 Móda',
    '🏠 Domov & DIY', '🐕 Zvířata', '🧘 Wellness', '🌱 Ekologie',
    '📷 Fotografie', '🎭 Divadlo', '🍷 Gastronomie', '🚴 Cyklistika',
    '🏔️ Turistika', '🎲 Společenské hry',
  ];

  // ── Inicializace ───────────────────────────────────────
  function init() {
    buildTagGrid();
    loadProfiles();
    const greeting = 'Ahoj! Jsem Labyrint 🎁 Pomůžu ti najít dokonalý dárek. Chceš rychle vybrat hned teď, nebo vytvoříme profil příjemce pro přesnější doporučení?';
    typewriterEffect('greeting-text', greeting, 35, () => {
      document.getElementById('landing-buttons').classList.remove('hidden');
    });
  }

  // ── Typewriter ─────────────────────────────────────────
  function typewriterEffect(elemId, text, speed, cb) {
    const el = document.getElementById(elemId);
    el.textContent = '';
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(t); if (cb) cb(); }
    }, speed);
  }

  // ── Obrazovky ──────────────────────────────────────────
  function showScreen(id) {
    previousScreen = currentScreen;
    document.getElementById(currentScreen).classList.remove('active');
    currentScreen = id;
    const el = document.getElementById(id);
    el.classList.add('active');
    if (id === 'screen-history') loadHistory();
  }

  function goBack() { showScreen(previousScreen); }

  // ── Quick mode ─────────────────────────────────────────
  function startQuick() {
    activeProfile = null;
    messages = [];
    document.getElementById('active-profile-name').textContent = 'Rychlý režim';
    document.getElementById('active-profile-badge').classList.add('hidden');
    document.getElementById('btn-save-gift').classList.add('hidden');
    showScreen('screen-chat');
    clearMessages();
    setTimeout(() => {
      appendAiMessage('Skvěle! Řekni mi o koho jde a k jaké příležitosti hledáš dárek. Třeba: „Hledám dárek pro kamaráda k narozeninám, miluje hory a vaření."');
    }, 300);
  }

  // ── Sidebar ────────────────────────────────────────────
  function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sidebarOpen = !sidebarOpen;
    sb.classList.toggle('open', sidebarOpen);
  }

  // ── Tagy ───────────────────────────────────────────────
  function buildTagGrid() {
    const grid = document.getElementById('tag-grid');
    if (!grid) return;
    grid.innerHTML = '';
    TAGS.forEach(tag => {
      const chip = document.createElement('div');
      chip.className = 'tag-chip';
      chip.textContent = tag;
      chip.onclick = () => chip.classList.toggle('selected');
      grid.appendChild(chip);
    });
  }

  function getSelectedTags() {
    return [...document.querySelectorAll('.tag-chip.selected')].map(c => c.textContent);
  }

  // ── Profily ────────────────────────────────────────────
  async function loadProfiles() {
    try {
      const res = await fetch('/api/profiles');
      profiles = await res.json();
      renderProfileList();
    } catch (e) { profiles = []; }
  }

  function renderProfileList() {
    const list = document.getElementById('profile-list');
    list.innerHTML = '';
    if (!profiles.length) {
      list.innerHTML = '<div style="color:var(--text2);font-size:.82rem;padding:8px 4px">Zatím žádné profily</div>';
      return;
    }
    profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'profile-card' + (activeProfile?.id === p.id ? ' active' : '');
      card.innerHTML = `<div class="profile-card-name">${p.name}</div>
        <div class="profile-card-meta">${p.relation || ''} ${p.age ? '· ' + p.age + ' let' : ''}</div>`;
      card.onclick = () => selectProfile(p);
      list.appendChild(card);
    });
  }

  function selectProfile(p) {
    activeProfile = p;
    messages = [];
    document.getElementById('active-profile-name').textContent = p.name;
    document.getElementById('active-profile-badge').textContent = p.relation || '';
    document.getElementById('active-profile-badge').classList.remove('hidden');
    document.getElementById('btn-save-gift').classList.remove('hidden');
    renderProfileList();
    showScreen('screen-chat');
    clearMessages();
    if (sidebarOpen) toggleSidebar();
    setTimeout(() => {
      appendAiMessage(`Výborně! Mám profil pro **${p.name}**. K jaké příležitosti hledáš dárek a jaký je tvůj přibližný rozpočet?`);
    }, 300);
  }

  async function saveProfile() {
    const name = document.getElementById('p-name').value.trim();
    if (!name) { alert('Zadej prosím jméno příjemce.'); return; }

    const profile = {
      name,
      age: document.getElementById('p-age').value || '',
      gender: document.getElementById('p-gender').value || '',
      relation: document.getElementById('p-relation').value || '',
      interests: [
        ...getSelectedTags(),
        ...document.getElementById('p-custom-interests').value
          .split(',').map(s => s.trim()).filter(Boolean)
      ].join(', '),
      notes: document.getElementById('p-notes').value.trim(),
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      profiles.push(data.profile);
      renderProfileList();
      selectProfile(data.profile);
    } catch (e) {
      alert('Chyba při ukládání profilu.');
    }
  }

  // ── Chat ───────────────────────────────────────────────
  function clearMessages() {
    document.getElementById('chat-messages').innerHTML = '';
    messages = [];
  }

  function appendAiMessage(text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.innerHTML = `
      <div class="msg-avatar">🎁</div>
      <div class="msg-bubble">${formatText(text)}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function appendUserMessage(text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'msg user';
    div.innerHTML = `<div class="msg-bubble">${escHtml(text)}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function showTyping() {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'msg ai'; div.id = 'typing-indicator';
    div.innerHTML = `<div class="msg-avatar">🎁</div>
      <div class="msg-bubble"><div class="typing-dots">
        <span></span><span></span><span></span>
      </div></div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    appendUserMessage(text);
    messages.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, profile: activeProfile }),
      });
      const data = await res.json();
      removeTyping();
      appendAiMessage(data.reply);
      messages.push({ role: 'assistant', content: data.reply });
    } catch (e) {
      removeTyping();
      appendAiMessage('Omlouvám se, nastala chyba připojení. Zkus to prosím znovu.');
    }
  }

  function handleKey(e) {
    const input = document.getElementById('chat-input');
    // auto-resize
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Uložit dárek ──────────────────────────────────────
  function showSaveGift() {
    starRating = 0;
    renderStars();
    document.getElementById('sg-name').value = '';
    document.getElementById('sg-comment').value = '';
    document.getElementById('modal-save-gift').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modal-save-gift').classList.add('hidden');
  }

  function setStar(v) {
    starRating = v;
    renderStars();
  }

  function renderStars() {
    document.querySelectorAll('#sg-stars .star').forEach(s => {
      s.classList.toggle('on', parseInt(s.dataset.v) <= starRating);
    });
  }

  async function confirmSaveGift() {
    const name = document.getElementById('sg-name').value.trim();
    if (!name) { alert('Zadej název dárku.'); return; }

    const gift = {
      name,
      occasion: document.getElementById('sg-occasion').value,
      budget: document.getElementById('sg-budget').value || 0,
      my_rating: starRating,
      my_comment: document.getElementById('sg-comment').value,
      profile_id: activeProfile?.id || null,
      profile_name: activeProfile?.name || 'Bez profilu',
    };

    try {
      await fetch('/api/gift', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gift),
      });
      closeModal();
      appendAiMessage(`✅ Dárek **${name}** byl uložen do historie! Chceš hledat další dárek, nebo s tím mohu nějak dál pomoci?`);
    } catch (e) {
      alert('Chyba při ukládání.');
    }
  }

  // ── Historie ───────────────────────────────────────────
  async function showHistory() {
    showScreen('screen-history');
  }

  async function loadHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '<div class="empty-state">Načítám…</div>';
    try {
      const res = await fetch('/api/gifts');
      const gifts = await res.json();
      if (!gifts.length) {
        list.innerHTML = '<div class="empty-state">Zatím žádné uložené dárky.</div>';
        return;
      }
      list.innerHTML = '';
      gifts.reverse().forEach(g => {
        const stars = '★'.repeat(g.my_rating || 0) + '☆'.repeat(5 - (g.my_rating || 0));
        const date = g.created_at ? new Date(g.created_at).toLocaleDateString('cs-CZ') : '—';
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          <div class="history-card-title">${escHtml(g.name)}</div>
          <div class="history-card-meta">
            <span>📅 ${date}</span>
            <span>🎉 ${g.occasion || '—'}</span>
            ${g.budget ? `<span>💰 ${g.budget} Kč</span>` : ''}
            ${g.profile_name ? `<span>👤 ${escHtml(g.profile_name)}</span>` : ''}
          </div>
          ${g.my_rating ? `<div class="history-stars">${stars}</div>` : ''}
          ${g.my_comment ? `<div style="font-size:.85rem;color:var(--text2);margin-top:6px">${escHtml(g.my_comment)}</div>` : ''}`;
        list.appendChild(card);
      });
    } catch (e) {
      list.innerHTML = '<div class="empty-state">Nepodařilo se načíst historii.</div>';
    }
  }

  // ── Pomocné funkce ─────────────────────────────────────
  function formatText(t) {
    return escHtml(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Public API ─────────────────────────────────────────
  return { init, showScreen, goBack, startQuick, toggleSidebar,
           saveProfile, sendMessage, handleKey,
           showSaveGift, closeModal, setStar, confirmSaveGift,
           showHistory };
})();

document.addEventListener('DOMContentLoaded', App.init);
