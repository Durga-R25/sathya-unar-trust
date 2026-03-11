# 🎓 ArivAI — Tamil AI Learning Platform for TN Government Schools

A Khanmigo-inspired AI tutoring platform for Tamil Nadu government school students (Class 8 & 9), built mobile-first for 360px screens, bilingual (Tamil + English), and deployed on Railway.

> **ArivAI** (அறிவு + AI) — "Arivu" means knowledge/wisdom in Tamil. ArivAI brings AI-powered knowledge to every government school student.

![ArivAI Banner](https://via.placeholder.com/1200x300/2563EB/ffffff?text=ArivAI+%E2%80%94+Tamil+AI+Learning+Platform)

**Live App:** https://sathya-unar-trust-production.up.railway.app

---

## 🌟 Features

### For Students
- 📹 **Video Lessons** — Embedded KalviTV YouTube videos, lesson-specific
- 🤖 **AI Tutor (Avvai)** — Socratic AI tutor, never gives direct answers; always guides with questions
- 🎤 **Voice Chat** — Speak in Tamil or English; auto-transcribed and sent to ArivAI
- 📝 **Checkpoints** — MCQ questions mid-lesson before AI chat unlocks
- 📊 **Evaluation** — Auto-generated MCQ + essay after every lesson, AI-graded
- 🏅 **Badges** — Effort-based badges: Curious Learner, Creative Writer, Lesson Complete
- 🌐 **Bilingual** — Full Tamil + English UI; Tamil subject always in Tamil

### For Teachers
- 📊 **Progress Dashboard** — Bar charts for lessons done and AI chat turns per student
- 🏆 **Leaderboard** — Anonymised rankings (gold / silver / bronze) per class
- ✏️ **Lesson Editor** — Edit YouTube IDs, lesson summaries, checkpoint MCQs live
- 🔍 **Student Detail** — Per-student lesson-by-lesson breakdown with scores

### For Admins
- 🏫 **School Management** — Add and list schools with codes
- 👨‍🏫 **Teacher Management** — Add teachers, assign to schools
- 📚 **Student Management** — Filter by class, bulk import via CSV
- 👥 **All Users** — Full user list with delete (admin protected)

---

## 🤖 AI Tutor — Avvai (அவ்வை)

Avvai is a Socratic AI tutor inspired by Khan Academy's Khanmigo, named after Avvaiyar — the ancient Tamil poetess who taught children wisdom through simple verses (Aathichudi, Konraivendhan):

- **Tamil-only** for Tamil subject; **bilingual** for Science, Maths, Social, English
- **Never gives direct answers** — always redirects with a follow-up question
- **Guardrails** — restricted to the current lesson topic; off-topic questions are gently redirected
- **Voice input** — students can speak in Tamil (`ta-IN`) or English (`en-IN`); transcribed via Google STT
- **Encouraging** — wrong answers get "நல்ல முயற்சி!" before correction, never scolding
- **Concise** — max 3–5 lines per response, every reply ends with a question

---

## 🚀 Quick Start (Local)

### Prerequisites

- Python 3.11+
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Setup

```bash
# Clone the repository
git clone https://github.com/Durga-R25/sathya-unar-trust.git
cd sathya-unar-trust/AITutor

# Create virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
# Windows
set ANTHROPIC_API_KEY=your-key-here
# macOS/Linux
export ANTHROPIC_API_KEY=your-key-here

# Run the app
streamlit run streamlit_app.py
```

The app opens at http://localhost:8501

### Default Login Credentials (seeded)

| Role | Name | PIN / Password |
|------|------|----------------|
| Student | Any seeded student name | `1234` |
| Teacher | Teacher name | PIN set during add |
| Admin | `Admin` | `admin123` |

---

## 🏗️ Project Structure

```
AITutor/
├── streamlit_app.py              # Main app — router, all pages, language toggle
│
├── backend/
│   ├── ai/
│   │   ├── tutor_prompt.py       # Tamil + English Socratic system prompts + guardrails
│   │   └── tutor_test.py         # Prompt testing script
│   └── db/
│       ├── db.py                 # SQLite — all DB functions (30+)
│       └── seed.py               # Auto-seed: school, teachers, students, admin
│
├── frontend/
│   ├── i18n.py                   # Translation service — all UI strings (en + ta)
│   └── components/
│       ├── video_player.py       # YouTube embed with lesson metadata
│       ├── chat_ui.py            # AI chat + voice input + evaluation (MCQ + essay)
│       ├── admin_panel.py        # Admin: schools, teachers, students, CSV import
│       ├── lesson_editor.py      # Teacher: edit lessons, YouTube IDs, checkpoints
│       └── progress_charts.py    # Teacher: progress charts + leaderboard
│
├── data/
│   ├── class8_lessons.json       # Class 8 lesson metadata
│   ├── class9_lessons.json       # Class 9 lesson metadata
│   └── all_chapters.json         # Compiled chapter list (committed for Railway)
│
├── .streamlit/
│   └── config.toml               # Blue theme, headless server config
│
└── requirements.txt              # Python dependencies
```

---

## 🎨 Design Principles

### Mobile-First
- Designed for Android phones (360–480px screens)
- Tamil font minimum 18px, `Noto Sans Tamil` throughout
- Touch-friendly tap targets (44px+)
- Tested on low-bandwidth connections

### Blue Theme
- Primary: `#2563EB` — trustworthy blue
- Background: `#F0F7FF` — soft sky
- Secondary BG: `#DBEAFE` — light blue
- Text: `#1E293B` — near-black

### Bilingual Architecture
- `T(key, lang)` — single translation function, all strings in `frontend/i18n.py`
- `_ui_lang()` — returns user's chosen language from session state (default: `ta`)
- `_lang(lesson)` — Tamil subject always `ta`; other subjects follow `_ui_lang()`

---

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Streamlit 1.40 |
| AI | Claude Haiku (`claude-haiku-4-5-20251001`) via Anthropic API |
| Voice STT | Google Speech Recognition (`SpeechRecognition` library, `ta-IN` / `en-IN`) |
| Database | SQLite (auto-seeded on Railway restart) |
| Video | YouTube embed — KalviTV official channel |
| Deployment | Railway (Nixpacks, auto-deploy from GitHub) |
| Auth | PIN-based student login, password for teachers/admin |

---

## 📱 Lesson Flow (3 Stages)

```
1️⃣ Video          2️⃣ Chat with AI        3️⃣ Evaluation
─────────         ────────────────        ──────────────
Watch KalviTV  →  Checkpoint MCQ    →     3 MCQ questions
YouTube video     (must pass)             1 Essay question
                  ↓                       AI-graded feedback
                  AI Chat (Avvai)         Lesson Complete badge
                  Voice or text input
```

---

## 🚂 Deployment (Railway)

The app is deployed on Railway with auto-deploy from the `main` branch.

### Environment Variables (set in Railway dashboard)

```
ANTHROPIC_API_KEY=sk-ant-...
```

### Procfile

```
web: cd AITutor && streamlit run streamlit_app.py --server.port $PORT --server.address 0.0.0.0 --theme.primaryColor "#2563EB" --theme.backgroundColor "#F0F7FF" --theme.secondaryBackgroundColor "#DBEAFE" --theme.textColor "#1E293B"
```

### Notes on Railway
- SQLite is ephemeral — `auto_seed_if_empty()` re-seeds the DB on every container restart
- `all_chapters.json` is committed to git so Railway has lesson data without running yt-dlp
- To reset the DB (pick up new seed users): **Restart** the Railway service

---

## ✅ Phase Completion

### Phase 1 — Core Learning Flow ✅
- Login page (Student / Teacher / Admin tabs) with language toggle
- Home screen with subject cards and chapter list
- Video lesson page with KalviTV embed
- Khanmigo-style AI chat (Avvai) — Tamil + English
- AI guardrails — restricted to current lesson
- MCQ + Essay evaluation with AI grading
- Effort-based badges

### Phase 2 — Platform & Management ✅
- Admin panel: school/teacher/student management, CSV bulk import
- Teacher lesson editor: YouTube IDs, summaries, checkpoint MCQs
- Progress charts and leaderboard per class
- Checkpoint gate — MCQ must be answered before AI chat unlocks
- Bilingual refactor — all strings via `T(key, lang)` in `i18n.py`
- Blue theme throughout

### Phase 3 — Voice & Accessibility ✅
- Voice input in AI chat — tap to record, auto-transcribe, auto-send
- Tamil STT (`ta-IN`) and English STT (`en-IN`)
- Graceful fallbacks for unclear speech and offline

### Phase 4 — Planned
- [ ] Parent progress alerts (WhatsApp / SMS)
- [ ] React frontend migration (mobile PWA)
- [ ] PostgreSQL migration for production scale
- [ ] Multi-school rollout

---

## 🔐 Security

- PIN-based student auth (no passwords stored in plain text — hashed in production)
- Role-based access: students can't access teacher/admin routes
- AI guardrails prevent off-topic or harmful conversations
- Admin account protected from deletion in the UI
- `ANTHROPIC_API_KEY` stored as Railway environment variable, never in code

---

## 🌍 Target Users

| User | Context |
|------|---------|
| Students | Class 8 & 9, Tamil Nadu government schools, Android phones, low bandwidth |
| Teachers | 1 pilot school, manage lessons and track student progress |
| Admin | Sathya Unar Charitable Trust staff, manage all schools and users |

---

## 📄 License

MIT License — see [LICENSE](../LICENSE) for details.

---

**Built with ❤️ for Tamil Nadu government school students**

**App Name:** ArivAI (அறிவு AI)
**Version:** 2.0 (Phase 3 complete)
**Deployed:** https://sathya-unar-trust-production.up.railway.app
**Last Updated:** March 2026
