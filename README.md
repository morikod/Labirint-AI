# 🌀 Labirint-AI: School System Breach v2.5

![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-00ff41?style=for-the-badge)
![Docker](https://img.shields.io/badge/DOCKER-ENABLED-blue?style=for-the-badge&logo=docker)
![AI](https://img.shields.io/badge/AI-GEMMA--3-purple?style=for-the-badge)

**Labirint-AI** je interaktivní kybernetická simulace. Cílem hráče je v roli studenta nabourat školní databázi (Cyber-Lincoln High, USA) a upravit své známky. Příběh a bezpečnostní protokoly jsou dynamicky generovány pomocí LLM modelu Gemma 3.

---

## 🕹️ Herní Mechaniky

Hra kombinuje textové RPG s prvky **RAG (Retrieval-Augmented Generation)** a časovým tlakem:

* **Neural Injection**: Na začátku zadáte 3 klíčová slova, která definují téma vašich hackerských testů.
* **Security Queries**: AI generuje vědomostní otázky na základě vybraných témat.
* **Time Attack**: Každý průnik do systému je monitorován. Hráč má omezený čas na správnou odpověď, jinak je spojení ukončeno.
* **RAG Knowledge**: Simulace využívá lokální lore uložený v `/data/game_info.txt` pro autentický zážitek ze školního prostředí.

---

## 🛠️ Technický Stack

| Komponenta | Technologie | Funkce |
| :--- | :--- | :--- |
| **Backend** | Python / Flask | API endpointy a správa herní logiky. |
| **AI Engine** | OpenAI API (Gemma 3) | Generování příběhu, ASCII artu a úkolů. |
| **Frontend** | HTML5 / CSS3 / JS | CRT vizuál, typewriter efekt a systémový časovač. |
| **Kontejnerizace** | Docker & Compose | Automatizace nasazení a správa portů. |

---

## 📂 Struktura Projektu

```text
├── app.py              # Flask server a RAG logika
├── Dockerfile          # Definice Docker obrazu
├── docker-compose.yml  # Orchestrace kontejneru a portů
├── requirements.txt    # Python závislosti
├── data/
│   └── game_info.txt   # Lokální RAG databáze (Lore školy)
├── static/
│   ├── css/style.css   # Cyberpunk design a CRT efekty
│   └── js/script.js    # Klientská logika, validace a timer
└── templates/
    └── index.html      # Hlavní terminálové rozhraní
```
🚀 Rychlé Spuštění
Pro spuštění simulace v lokálním prostředí vyžadujete nainstalovaný Docker.

1.Klonování repozitáře:
git clone [https://github.com/morikod/Labirint-AI.git](https://github.com/morikod/Labirint-AI.git)
cd Labirint-AI
Sestavení a spuštění pomocí Docker Compose:

Bash
docker-compose up --build
Přístup k terminálu:
Otevřete prohlížeč na adrese http://localhost:5000.

⚙️ Konfigurace Simulace
Před spuštěním se ujistěte, že máte v systému (nebo v .env souboru) nastaveny proměnné prostředí:

OPENAI_API_KEY: Váš API klíč pro přístup k modelu.

OPENAI_BASE_URL: URL adresa AI serveru (např. https://kurim.ithope.eu/v1).

CRITICAL WARNING: Neautorizovaný přístup do školní databáze je v reálném světě trestným činem. Tato aplikace slouží pouze pro vzdělávací účely.
