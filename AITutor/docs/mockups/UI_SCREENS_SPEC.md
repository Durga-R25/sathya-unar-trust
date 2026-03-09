# AITutor — UI Screen Specifications
## Scope: Class 8 & 9 | One School | Tamil Nadu

---

## Design Principles
- Mobile-first (480px primary target — students use phones)
- Tamil script prominent, large font (18px minimum)
- High contrast (works in sunlight, low-quality screens)
- Minimal clicks to reach learning content
- Feels encouraging, never exam-like

---

## Screen 1 — Login Screen

```
┌─────────────────────────────┐
│                             │
│        🎓 கல்வி AI          │
│   Tamil Learning Assistant  │
│                             │
│  ┌─────────────────────┐   │
│  │  பெயர் / Name       │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  வகுப்பு / Class ▼  │   │
│  │  [8A / 8B / 9A / 9B]│   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  கடவுச்சொல்         │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │   உள்நுழை (Login)   │   │
│  └─────────────────────┘   │
│                             │
│  ──── Teacher Login ────    │
└─────────────────────────────┘
```

**Notes:**
- Student selects class from dropdown (8A, 8B, 9A, 9B)
- Simple 4-digit PIN instead of password for young students
- "Teacher Login" link goes to separate teacher auth
- School code pre-configured (no student entry needed)

---

## Screen 2 — Student Home Dashboard

```
┌─────────────────────────────┐
│ வணக்கம், அர்ஜுன்! 👋        │
│ வகுப்பு 8A                  │
├─────────────────────────────┤
│                             │
│  இன்றைய பாடம்               │
│  ┌─────────────────────┐   │
│  │ 📚 Unit 2 - இயற்கை  │   │
│  │    வளங்கள்           │   │
│  │  [பாடம் தொடங்கு ▶]  │   │
│  └─────────────────────┘   │
│                             │
│  உன் முன்னேற்றம்             │
│  ████████░░  4/5 பாடங்கள்   │
│                             │
│  கடந்த பாடம்                 │
│  ✅ Unit 1 - முடிந்தது       │
│                             │
│  உன் சாதனைகள் 🏅            │
│  🌟 ஆர்வம்   🔥 தொடர்ச்சி   │
│                             │
└─────────────────────────────┘
│ 🏠 Home  📚 Lessons  👤 Me  │
└─────────────────────────────┘
```

---

## Screen 3 — Lesson Entry Screen

```
┌─────────────────────────────┐
│ ← Unit 2: இயற்கை வளங்கள்   │
├─────────────────────────────┤
│                             │
│  இந்த பாடத்தில் நீ கற்பாய்: │
│                             │
│  ✦ இயற்கை வளங்களின் வகைகள் │
│  ✦ நீர் மேலாண்மை           │
│  ✦ வனங்களின் முக்கியத்துவம் │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   [YouTube Video]   │   │
│  │   KalviTV - 12 min  │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  💡 பார்க்கும்போது யோசி:    │
│  "இயற்கை வளங்களை நாம்      │
│   ஏன் பாதுகாக்க வேண்டும்?" │
│                             │
│  ┌─────────────────────┐   │
│  │  ▶ வீடியோ பார்       │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**Interaction Design:**
- Thinking prompt shown BEFORE video starts (primes curiosity)
- Video pauses automatically at 2 checkpoint timestamps
- No scrubbing forward until checkpoint is answered

---

## Screen 4 — Checkpoint Question (Mid-Video Pause)

```
┌─────────────────────────────┐
│ ⏸ வீடியோ நிறுத்தப்பட்டது   │
├─────────────────────────────┤
│                             │
│  🤔 யோசிக்கலாமா?            │
│                             │
│  "இதுவரை பார்த்ததில்,       │
│   மழை நீர் எவ்வாறு          │
│   சேகரிக்கப்படுகிறது?"     │
│                             │
│  ┌─────────────────────┐   │
│  │  உன் எண்ணம்...      │   │
│  │                     │   │
│  │  (type here)        │   │
│  └─────────────────────┘   │
│                             │
│  ┌──────────┐ ┌──────────┐ │
│  │ 🎤 பேசு  │ │ ✍️ எழுது │ │
│  └──────────┘ └──────────┘ │
│                             │
│  ┌─────────────────────┐   │
│  │  சமர்ப்பி (Submit)  │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**Key Design:**
- Voice OR text input (inclusive for low-literacy)
- No "right/wrong" shown — AI tutor responds conversationally
- Cannot skip checkpoint

---

## Screen 5 — AI Tutor Chat (CORE SCREEN — Khanmigo Style)

```
┌─────────────────────────────┐
│ 🧑‍🏫 கல்வி AI - உன் நண்பன் │
│ Unit 2: இயற்கை வளங்கள்     │
├─────────────────────────────┤
│                             │
│  ┌─── கல்வி AI ───────┐    │
│  │ சரியான முயற்சி!    │    │
│  │ நீ சொன்னது சரிதான். │    │
│  │ இப்போது ஒரு        │    │
│  │ கேள்வி — உன் ஊரில் │    │
│  │ மழை நீர் எங்கே     │    │
│  │ போகிறது என்று      │    │
│  │ நினைக்கிறாய்?      │    │
│  └────────────────────┘    │
│                             │
│          ┌──────────────┐   │
│          │ நான் நினைக்  │   │
│          │ கிறேன் அது   │   │
│          │ ஆற்றில்      │   │
│          │ போகுது       │   │
│          └──────────────┘   │
│                             │
│  ┌─── கல்வி AI ───────┐    │
│  │ அருமை! ஆறு         │    │
│  │ சொன்னாய். ஆற்றில்  │    │
│  │ போவதற்கு முன்பு    │    │
│  │ நிலத்தில் என்ன     │    │
│  │ நடக்கும் என்று     │    │
│  │ யோசித்திருக்கிறாயா?│    │
│  └────────────────────┘    │
│                             │
├─────────────────────────────┤
│ ┌──────────────────────┐   │
│ │ உன் பதில்...          │   │
│ └──────────────────────┘   │
│ [🎤 பேசு]  [📤 அனுப்பு]   │
└─────────────────────────────┘
```

**Khanmigo-style Rules Encoded in UI:**
- AI bubble on LEFT (teacher side)
- Student bubble on RIGHT
- AI NEVER shows ✅ or ❌
- AI always ends with a question
- "Think with me" not "Learn from me" tone

---

## Screen 6 — Post-Lesson Summary

```
┌─────────────────────────────┐
│  🎉 நல்லா கத்துக்கிட்டே!  │
├─────────────────────────────┤
│                             │
│  இன்று நீ கற்றது:          │
│                             │
│  ✅ இயற்கை வளங்கள் வகைகள்  │
│  ✅ நீர் சேகரிப்பு முறைகள் │
│  🔄 வனங்கள் (மேலும் படி)   │
│                             │
│  AI துடன் பேசினாய்: 8 முறை │
│                             │
│  🏅 புதிய சாதனை!            │
│  ┌─────────────────────┐   │
│  │  🌟 ஆர்வமுள்ள       │   │
│  │     மாணவன்!         │   │
│  │  (8 கேள்விகள் கேட்ட │   │
│  │   தனக்கு)           │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  அடுத்த பாடம் →     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  மீண்டும் பேசு (AI) │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

---

## Screen 7 — Teacher Dashboard

```
┌─────────────────────────────┐
│ 🏫 8A வகுப்பு - ஆசிரியர்   │
│ இன்று: March 9, 2026        │
├─────────────────────────────┤
│                             │
│  வகுப்பு முன்னேற்றம்        │
│  ████████░░  32/40 மாணவர்   │
│                             │
│  கவலைப்படும் மாணவர்கள் ⚠️  │
│  ┌─────────────────────┐   │
│  │ 👤 முத்துலக்ஷ்மி    │   │
│  │    3 நாட்கள் login  │   │
│  │    இல்லை            │   │
│  │    [தொடர்பு கொள்]   │   │
│  ├─────────────────────┤   │
│  │ 👤 கார்த்திக்       │   │
│  │    Checkpoint < 40% │   │
│  │    [குறிப்பு சேர்]  │   │
│  └─────────────────────┘   │
│                             │
│  திறன் வரைபடம்              │
│  படிப்பு     ████████  85%  │
│  இலக்கணம்   ██████░░  70%  │
│  சொல்வளம்   ███████░  78%  │
│  எழுத்து     ████░░░░  55%  │
│                             │
└─────────────────────────────┘
```

---

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Primary (CTAs) | Deep Saffron | `#FF6B35` |
| Secondary | Tamil Blue | `#1B4F8A` |
| Success | Green | `#27AE60` |
| Background | Off-white | `#FFF8F0` |
| AI Bubble | Light Blue | `#EBF5FB` |
| Student Bubble | Light Orange | `#FEF5E7` |
| Text | Near Black | `#2C3E50` |

## Typography
- **Tamil Text:** Latha / Noto Sans Tamil — 18px minimum
- **Headings:** Bold, 22px
- **Chat bubbles:** 16px, relaxed line-height 1.8

---

## Mobile Breakpoints
- Primary: 360–480px (budget Android phones)
- Secondary: 768px (tablets in smart classrooms)
- Tertiary: 1024px+ (teacher laptop view)
