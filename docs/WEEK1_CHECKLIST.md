# Week 1 Checklist — AITutor Pilot
## Class 8 & 9 | One Government School

---

## Day 1–2: Setup & Mockups

### Technical Setup
- [ ] Clone/create project folder structure (DONE ✅)
- [ ] Copy .env.example to .env, add ANTHROPIC_API_KEY
- [ ] Run: `pip install anthropic python-dotenv`
- [ ] Test: `python backend/ai/tutor_test.py` — verify Tamil AI responses
- [ ] Create free Figma account → import UI_SCREENS_SPEC.md as wireframes

### Figma Mockup Screens to Create
- [ ] Screen 1 — Student Login
- [ ] Screen 2 — Home Dashboard
- [ ] Screen 3 — Lesson Entry
- [ ] Screen 4 — Checkpoint Question (mid-video pause)
- [ ] Screen 5 — AI Tutor Chat ⭐ (most important screen)
- [ ] Screen 6 — Post-Lesson Summary + Badges
- [ ] Screen 7 — Teacher Dashboard

---

## Day 3–4: School Visit & Interviews

### Before Visit
- [ ] Print mockup screenshots (A4, color)
- [ ] Identify the school for pilot
- [ ] Get principal permission / introduce project
- [ ] Schedule 30-min slots with 2 Tamil teachers

### During Visit
- [ ] Complete Teacher Interview (docs/TEACHER_INTERVIEW_GUIDE.md)
- [ ] Watch a student type Tamil on their phone
- [ ] Identify: Voice-first or Text-first?
- [ ] Get teacher WhatsApp for ongoing feedback
- [ ] Photograph classroom setup (with permission)

### Post-Visit Decisions
- [ ] Confirm: Input method (voice / text / both)
- [ ] Confirm: Top 2 units per class to start
- [ ] Confirm: Session length target
- [ ] Confirm: Teacher dashboard format preference

---

## Day 4–5: KalviTV Video Curation

### Priority Videos (must find this week)
- [ ] Class 8 Unit 2 — நீர் வளம் (YouTube ID: ________)
- [ ] Class 9 Unit 1 — திருக்குறள் அன்பு (YouTube ID: ________)

### For Each Video
- [ ] Verify it's official KalviTV / govt channel
- [ ] Note duration
- [ ] Choose checkpoint timestamps (2 per video)
- [ ] Update data/class8_lessons.json and data/class9_lessons.json with real IDs

---

## Day 5: AI Tutor Validation

### Tamil Prompt Testing
- [ ] Run tutor_test.py — check all responses in Tamil
- [ ] Test with 3 wrong-answer scenarios — verify no shaming
- [ ] Test "don't know" response — verify gentle guidance
- [ ] Verify every AI response ends with a question
- [ ] Adjust prompts in backend/ai/tutor_prompt.py if needed

### Share with Teachers
- [ ] Show 1 Tamil teacher the example conversations in tutor_prompt.py
- [ ] Ask: "Does this sound like a good Tamil teacher?"
- [ ] Note their feedback and adjust tone

---

## End of Week 1 — Go/No-Go Decision

Answer these before Week 2 coding begins:

1. **Input Method confirmed?** Voice / Text / Both → ___________
2. **2 lessons curated with real YouTube IDs?** Yes / No
3. **Teachers excited about the concept?** Yes / No / Uncertain
4. **AI tutor tone approved by teacher?** Yes / No
5. **Figma mockup ready to show stakeholders?** Yes / No

If all YES → Start Week 2: FastAPI + Database setup
If any NO → Spend extra time resolving that blocker first

---

## Week 2 Preview (What's Next)

```
Week 2 Goals:
├── FastAPI backend setup
├── PostgreSQL schema + seed data
├── Student login (PIN-based)
├── Lesson page with YouTube embed
└── Basic checkpoint question flow
```
