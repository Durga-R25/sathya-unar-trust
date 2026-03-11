"""
AI Tutor Chat Component — Fixed version
- Uses st.chat_input() for Enter key support
- History keyed to lesson_id to survive reruns
- Includes evaluation (MCQ + essay) stage
"""

import os
import sys
import json
import streamlit as st

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.ai.tutor_prompt import build_tutor_prompt, build_english_tutor_prompt
from backend.db.db import save_tutor_session, upsert_progress, award_badge


# ─────────────────────────────────────────────
# HELPER: stable session key per lesson
# ─────────────────────────────────────────────

def _get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        try:
            key = st.secrets["ANTHROPIC_API_KEY"]
        except Exception:
            pass
    return key


def _is_english(lesson: dict) -> bool:
    return (lesson.get("subject") or "").strip().lower() == "english"


def _msg_key(lesson_id: str) -> str:
    """Chat history is stored per lesson_id — survives page reruns."""
    return f"chat_msgs_{lesson_id}"


def _eval_key(lesson_id: str) -> str:
    return f"eval_{lesson_id}"


# ─────────────────────────────────────────────
# MAIN CHAT
# ─────────────────────────────────────────────

def render_chat(student: dict, lesson: dict):
    """
    Full AI tutor chat using st.chat_input (Enter key works).
    History persists in session_state keyed to lesson_id.
    """
    import anthropic
    client = anthropic.Anthropic(api_key=_get_api_key())

    key = _msg_key(lesson["id"])

    eng = _is_english(lesson)

    # Init history for this lesson (only once per session)
    if key not in st.session_state:
        if eng:
            opening = lesson.get("opening_question") or (
                "Hello! Great job watching the video! "
                "What was the most interesting thing you noticed in this lesson?"
            )
        else:
            opening = lesson.get("opening_question") or (
                "வணக்கம்! வீடியோ பார்த்தாய் — நல்லது! "
                "இந்த பாடத்தில் உனக்கு என்ன ஆர்வமாக இருந்தது?"
            )
        st.session_state[key] = [{"role": "assistant", "content": opening}]

    messages: list = st.session_state[key]

    if eng:
        system_prompt = build_english_tutor_prompt(
            class_name=f"Class {lesson['class_name']}",
            lesson_title=lesson["title"],
            unit_name=lesson.get("unit", ""),
            competencies=_parse_competencies(lesson.get("competencies", "[]")),
            lesson_summary=lesson.get("lesson_summary", "")
        )
    else:
        system_prompt = build_tutor_prompt(
            class_name=f"வகுப்பு {lesson['class_name']}",
            lesson_title=lesson["title"],
            unit_name=lesson.get("unit", ""),
            competencies=_parse_competencies(lesson.get("competencies", "[]")),
            lesson_summary=lesson.get("lesson_summary", "")
        )

    # Header
    st.markdown(f"""
    <div style='background:#1B4F8A;color:white;padding:12px 16px;
                border-radius:10px;margin-bottom:8px;'>
        🧑‍🏫 <b>Kalvi AI</b> — {lesson['title']}
    </div>
    """, unsafe_allow_html=True)

    # Render all history using native st.chat_message
    for msg in messages:
        with st.chat_message("assistant" if msg["role"] == "assistant" else "user",
                             avatar="🤖" if msg["role"] == "assistant" else "👤"):
            st.markdown(
                f"<span style='font-family:\"Noto Sans Tamil\",sans-serif;"
                f"font-size:16px;line-height:1.8;'>{msg['content']}</span>",
                unsafe_allow_html=True
            )

    turn_count = len([m for m in messages if m["role"] == "user"])
    st.caption(f"{'Turns with AI' if eng else 'AI உடன்'}: {turn_count}")

    # ── st.chat_input: Enter key works, auto-clears ──────────────
    placeholder = ("Type your answer here... (Press Enter to send)"
                   if eng else
                   "உன் எண்ணத்தை இங்கே எழுது... (Enter அழுத்தி அனுப்பு)")
    user_input = st.chat_input(placeholder)

    if user_input and user_input.strip():
        messages.append({"role": "user", "content": user_input.strip()})

        with st.chat_message("user", avatar="👤"):
            st.markdown(
                f"<span style='font-family:\"Noto Sans Tamil\",sans-serif;"
                f"font-size:16px;'>{user_input.strip()}</span>",
                unsafe_allow_html=True
            )

        with st.chat_message("assistant", avatar="🤖"):
            with st.spinner("Kalvi is thinking..." if eng else "கல்வி யோசிக்கிறது..."):
                response = client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=350,
                    system=system_prompt,
                    messages=messages
                )
                ai_reply = response.content[0].text

            st.markdown(
                f"<span style='font-family:\"Noto Sans Tamil\",sans-serif;"
                f"font-size:16px;line-height:1.8;'>{ai_reply}</span>",
                unsafe_allow_html=True
            )
            messages.append({"role": "assistant", "content": ai_reply})

        # Persist history in session_state (keyed to lesson)
        st.session_state[key] = messages
        save_tutor_session(student["id"], lesson["id"], messages)

        turn_count = len([m for m in messages if m["role"] == "user"])
        upsert_progress(student["id"], lesson["id"], tutor_turns=turn_count)

        # Badge at 5 turns
        if turn_count == 5:
            badge_label = "Curious Learner 🌟" if eng else "ஆர்வமுள்ள மாணவன் 🌟"
            newly = award_badge(student["id"], "curious_learner", badge_label)
            if newly:
                st.balloons()
                st.success("🏅 New Badge: Curious Learner!" if eng else
                           "🏅 புதிய சாதனை: ஆர்வமுள்ள மாணவன்!")

    # Move to evaluation after 3+ turns
    st.markdown("<br>", unsafe_allow_html=True)
    if turn_count >= 3:
        btn_label = "📝 Go to Evaluation" if eng else "📝 மதிப்பீட்டிற்கு செல்"
        if st.button(btn_label, use_container_width=True,
                     key=f"go_eval_{lesson['id']}"):
            st.session_state["lesson_stage"] = "evaluate"
            st.rerun()


# ─────────────────────────────────────────────
# EVALUATION: MCQ + ESSAY
# ─────────────────────────────────────────────

def render_evaluation(student: dict, lesson: dict):
    """
    Two-part evaluation:
    Part 1 — 3 MCQ questions (AI-generated, auto-graded)
    Part 2 — 1 Essay question (AI evaluates in Tamil)
    """
    import anthropic
    client = anthropic.Anthropic(api_key=_get_api_key())

    ekey = _eval_key(lesson["id"])

    if ekey not in st.session_state:
        st.session_state[ekey] = {
            "mcq": None,           # generated questions
            "mcq_answers": {},     # {q_index: chosen_option}
            "mcq_submitted": False,
            "mcq_score": None,
            "essay_question": None,
            "essay_answer": "",
            "essay_feedback": None,
            "essay_submitted": False,
        }

    ev = st.session_state[ekey]
    eng = _is_english(lesson)

    header_text = ("📝 <b>Evaluation</b> — Let's test what you learned!"
                   if eng else
                   "📝 <b>மதிப்பீடு</b> — உன் கற்றலை சோதிக்கலாம்!")
    st.markdown(f"""
    <div style='background:linear-gradient(135deg,#FF6B35,#E55A2B);color:white;
                padding:16px;border-radius:12px;margin-bottom:20px;'>
        {header_text}
    </div>
    """, unsafe_allow_html=True)

    # ── Generate questions if not yet done ───────────────────────
    if ev["mcq"] is None:
        with st.spinner("Generating questions..." if eng else
                        "கேள்விகள் உருவாக்கப்படுகின்றன..."):
            ev["mcq"], ev["essay_question"] = _generate_questions(
                client, lesson
            )
        st.session_state[ekey] = ev
        st.rerun()

    # ══ PART 1: MCQ ══════════════════════════════════════════════

    st.markdown("### Part 1 — Multiple Choice" if eng else
                "### பகுதி 1 — பலவுள் தெரிவு கேள்விகள்")
    st.markdown("<small style='color:#888;'>"
                + ("Choose the correct answer" if eng else "சரியான விடையைத் தேர்ந்தெடு")
                + "</small>",
                unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)

    if not ev["mcq_submitted"]:
        for i, q in enumerate(ev["mcq"]):
            st.markdown(f"**{i+1}. {q['question']}**")
            choice = st.radio(
                label=f"q{i}",
                options=q["options"],
                index=None,
                key=f"mcq_{lesson['id']}_{i}",
                label_visibility="collapsed"
            )
            if choice:
                ev["mcq_answers"][i] = choice
            st.markdown("<br>", unsafe_allow_html=True)

        all_answered = len(ev["mcq_answers"]) == len(ev["mcq"])
        if st.button("✅ Submit MCQ" if eng else "✅ MCQ சமர்ப்பி", use_container_width=True,
                     disabled=not all_answered,
                     key=f"submit_mcq_{lesson['id']}"):
            score = 0
            for i, q in enumerate(ev["mcq"]):
                if ev["mcq_answers"].get(i) == q["answer"]:
                    score += 1
            ev["mcq_score"] = score
            ev["mcq_submitted"] = True
            st.session_state[ekey] = ev
            st.rerun()

    else:
        # Show results
        score = ev["mcq_score"]
        total = len(ev["mcq"])
        pct = int(score / total * 100)
        color = "#27AE60" if pct >= 60 else "#E74C3C"

        st.markdown(f"""
        <div style='background:{color}20;border:2px solid {color};
                    border-radius:12px;padding:16px;text-align:center;
                    margin-bottom:20px;'>
            <div style='font-size:32px;font-weight:700;color:{color};'>{score}/{total}</div>
            <div style='color:{color};font-size:16px;'>
                {"Well done! 🎉" if eng and pct >= 60 else
                 "Keep practising! 💪" if eng else
                 "சரியாக செய்தாய்! 🎉" if pct >= 60 else "இன்னும் படிக்கலாம்! 💪"}
            </div>
        </div>
        """, unsafe_allow_html=True)

        for i, q in enumerate(ev["mcq"]):
            chosen = ev["mcq_answers"].get(i, "")
            correct = q["answer"]
            is_right = chosen == correct
            icon = "✅" if is_right else "❌"
            st.markdown(f"""
            <div style='background:{"#D5F5E3" if is_right else "#FADBD8"};
                        border-radius:8px;padding:10px 14px;margin-bottom:8px;
                        font-family:"Noto Sans Tamil",sans-serif;'>
                {icon} <b>{i+1}. {q['question']}</b><br>
                <small>{"Your answer" if eng else "உன் பதில்"}: {chosen}<br>
                {"Correct answer" if eng else "சரியான பதில்"}: <b>{correct}</b></small>
                {"" if is_right else f"<br><small style='color:#555;'>💡 {q.get('explanation','')}</small>"}
            </div>
            """, unsafe_allow_html=True)

        upsert_progress(student["id"], lesson["id"],
                        checkpoint_score=pct)

    st.markdown("---")

    # ══ PART 2: ESSAY ═════════════════════════════════════════════

    st.markdown("### Part 2 — Written Response" if eng else
                "### பகுதி 2 — கட்டுரை / சிந்தனை கேள்வி")

    if ev["essay_question"]:
        st.markdown(f"""
        <div style='background:#EBF5FB;border-left:4px solid #1B4F8A;
                    padding:14px 16px;border-radius:8px;margin-bottom:16px;
                    font-family:"Noto Sans Tamil",sans-serif;font-size:16px;'>
            🖊️ {ev['essay_question']}
        </div>
        """, unsafe_allow_html=True)

    if not ev["essay_submitted"]:
        essay_text = st.text_area(
            "Write your answer here (at least 3 lines)" if eng else
            "உன் பதில் இங்கே எழுது (குறைந்தது 3 வரிகள்)",
            value=ev.get("essay_answer", ""),
            height=150,
            key=f"essay_input_{lesson['id']}",
            placeholder=("Write in your own words..." if eng else
                         "உன் சொந்த வார்த்தைகளில் எழுது...")
        )
        ev["essay_answer"] = essay_text
        st.session_state[ekey] = ev

        word_count = len(essay_text.split()) if essay_text.strip() else 0
        st.caption(f"{word_count} {'words' if eng else 'வார்த்தைகள்'}")

        if st.button("📤 Submit Essay" if eng else "📤 கட்டுரை சமர்ப்பி",
                     use_container_width=True,
                     disabled=(word_count < 5),
                     key=f"submit_essay_{lesson['id']}"):
            with st.spinner("Kalvi AI is reading your answer..." if eng else
                            "கல்வி AI உன் பதிலை படிக்கிறது..."):
                ev["essay_feedback"] = _evaluate_essay(
                    client, lesson, ev["essay_question"], essay_text
                )
            ev["essay_submitted"] = True
            st.session_state[ekey] = ev

            # Award essay badge
            award_badge(student["id"], "essay_writer", "படைப்பாளி ✍️")
            st.rerun()

    else:
        # Show essay + feedback
        st.markdown(f"""
        <div style='background:#F8F9FA;border-radius:8px;padding:12px 16px;
                    margin-bottom:12px;font-family:"Noto Sans Tamil",sans-serif;'>
            <small style='color:#888;'>உன் பதில்:</small><br>
            {ev['essay_answer']}
        </div>
        """, unsafe_allow_html=True)

        if ev.get("essay_feedback"):
            fb = ev["essay_feedback"]
            score_color = "#27AE60" if fb.get("score", 0) >= 6 else "#E67E22"
            st.markdown(f"""
            <div style='background:white;border:2px solid {score_color};
                        border-radius:12px;padding:16px;'>
                <div style='display:flex;justify-content:space-between;
                            align-items:center;margin-bottom:12px;'>
                    <b style='font-size:16px;'>🤖 கல்வி AI மதிப்பீடு</b>
                    <span style='background:{score_color};color:white;
                                 padding:4px 12px;border-radius:20px;font-weight:700;'>
                        {fb.get("score", "—")}/10
                    </span>
                </div>
                <div style='font-family:"Noto Sans Tamil",sans-serif;
                            font-size:15px;line-height:1.9;color:#2C3E50;'>
                    <b>{"👍 Strengths:" if eng else "👍 நன்மைகள்:"}</b><br>{fb.get("strengths", "")}<br><br>
                    <b>{"💡 Improve:" if eng else "💡 மேம்படுத்த:"}</b><br>{fb.get("improvements", "")}<br><br>
                    <b>{"🌟 Overall:" if eng else "🌟 ஒட்டுமொத்த கருத்து:"}</b><br>{fb.get("overall", "")}
                </div>
            </div>
            """, unsafe_allow_html=True)

        # Complete lesson
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🎉 Lesson Complete!" if eng else "🎉 பாடம் முடித்தேன்!",
                     use_container_width=True,
                     key=f"complete_{lesson['id']}"):
            upsert_progress(
                student["id"], lesson["id"],
                completed=1,
                completed_at=_now()
            )
            badge_label = "Lesson Complete 📚" if eng else "பாடம் முடித்தேன் 📚"
            award_badge(student["id"], "lesson_complete", badge_label)
            st.session_state["lesson_completed"] = True
            st.session_state["lesson_stage"] = "summary"
            st.rerun()


# ─────────────────────────────────────────────
# AI: GENERATE MCQ + ESSAY QUESTION
# ─────────────────────────────────────────────

def _generate_questions(client, lesson: dict) -> tuple[list, str]:
    """Generate 3 MCQ + 1 essay question for the lesson using Claude."""

    eng = _is_english(lesson)

    if eng:
        prompt = f"""You are an English teacher. Create questions for the following lesson.

Class: {lesson['class_name']}
Lesson: {lesson['title']}
Lesson Summary: {lesson.get('lesson_summary', '')}

Create 3 multiple choice questions and 1 written response question.
The written response question should ask students to connect the lesson to their own life experience.

Reply ONLY in this JSON format:
{{
  "mcq": [
    {{
      "question": "question here",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "answer": "correct option (must match one of the options exactly)",
      "explanation": "why this is correct in 1 line"
    }}
  ],
  "essay_question": "written response question here"
}}

Rules:
- All in simple English suitable for Class {lesson['class_name']} students
- MCQ options must be clearly distinct
- Questions must be based on the lesson content only
"""
    else:
        prompt = f"""நீ ஒரு தமிழ் ஆசிரியர். கீழே உள்ள பாடத்திற்கு கேள்விகள் உருவாக்கு.

வகுப்பு: {lesson['class_name']}
பாடம்: {lesson['title']}
பாட சுருக்கம்: {lesson.get('lesson_summary', '')}

3 பலவுள் தெரிவு கேள்விகளும் 1 கட்டுரை கேள்வியும் உருவாக்கு.

கட்டுரை கேள்வி: மாணவர் தன் சொந்த அனுபவத்தோடு பாடத்தை இணைத்து எழுதும் திறன்-சோதிக்கும் கேள்வி.

இந்த JSON format-ல் மட்டுமே பதில் சொல்:
{{
  "mcq": [
    {{
      "question": "கேள்வி இங்கே",
      "options": ["விடை 1", "விடை 2", "விடை 3", "விடை 4"],
      "answer": "சரியான விடை (options-ல் உள்ளதே)",
      "explanation": "ஏன் இது சரி என்று 1 வரியில்"
    }}
  ],
  "essay_question": "கட்டுரை கேள்வி இங்கே"
}}

விதிகள்:
- எல்லாமே தமிழில் மட்டுமே
- வகுப்பு {lesson['class_name']} மாணவர்களுக்கு பொருத்தமான கேள்விகள்
- MCQ options தெளிவாக வேறுபட்டதாக இருக்கட்டும்
"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        data = json.loads(raw)
        return data.get("mcq", []), data.get("essay_question", "")
    except json.JSONDecodeError:
        # Fallback questions
        return _fallback_mcq(lesson), _fallback_essay(lesson)


def _evaluate_essay(client, lesson: dict,
                    question: str, answer: str) -> dict:
    """AI evaluates student essay — returns structured feedback."""

    eng = _is_english(lesson)

    if eng:
        prompt = f"""You are a kind English teacher. Evaluate the student's written response.

Lesson: {lesson['title']} (Class {lesson['class_name']})
Question: {question}
Student's answer: {answer}

Evaluate and reply ONLY in this JSON format:
{{
  "score": (score from 1-10),
  "strengths": "what the student did well — 2-3 lines in simple English",
  "improvements": "what to improve — 2-3 lines, encouraging tone, no criticism",
  "overall": "overall encouraging comment — 1-2 lines"
}}

Rules:
- All feedback in simple English
- Never scold or shame — always encourage
- score must be integer 1-10
- Praise the student's effort
"""
    else:
        prompt = f"""நீ ஒரு அன்பான தமிழ் ஆசிரியர். மாணவரின் பதிலை மதிப்பீடு செய்.

பாடம்: {lesson['title']} (வகுப்பு {lesson['class_name']})
கேள்வி: {question}
மாணவரின் பதில்: {answer}

மதிப்பீடு செய் மற்றும் இந்த JSON format-ல் பதில் சொல்:
{{
  "score": (1-10 இல் மதிப்பெண்),
  "strengths": "மாணவர் நன்றாக செய்தது — 2-3 வரிகளில் தமிழில்",
  "improvements": "மேம்படுத்த வேண்டியது — 2-3 வரிகளில் தமிழில், கோபமின்றி",
  "overall": "ஒட்டுமொத்த ஊக்கமளிக்கும் கருத்து — 1-2 வரிகளில்"
}}

விதிகள்:
- எல்லாமே தமிழில் மட்டுமே
- ஒருபோதும் திட்டாதே, எப்போதும் ஊக்கமளி
- score 1-10 இல் மட்டுமே (integer)
- மாணவரின் முயற்சியை பாராட்டு
"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        if eng:
            return {
                "score": 7,
                "strengths": "Good effort! You wrote in your own words.",
                "improvements": "Try to write a little more detail next time.",
                "overall": "Keep writing — you can do even better! 🌟"
            }
        return {
            "score": 7,
            "strengths": "நல்ல முயற்சி செய்தாய்! உன் சொந்த வார்த்தைகளில் எழுதினாய்.",
            "improvements": "இன்னும் கொஞ்சம் விரிவாக எழுதினால் நன்றாக இருக்கும்.",
            "overall": "தொடர்ந்து எழுது — உன்னால் இன்னும் நன்றாக செய்ய முடியும்! 🌟"
        }


# ─────────────────────────────────────────────
# FALLBACK (if JSON parse fails)
# ─────────────────────────────────────────────

def _fallback_mcq(lesson: dict) -> list:
    return [
        {
            "question": f"{lesson['title']} பாடத்தில் முக்கிய கருத்து என்ன?",
            "options": ["இயற்கை பாதுகாப்பு", "கல்வியின் முக்கியத்துவம்",
                        "மனித உறவுகள்", "சமூக நீதி"],
            "answer": "கல்வியின் முக்கியத்துவம்",
            "explanation": "பாடத்தின் மையக் கருத்தை அடிப்படையாக கொண்டது"
        },
        {
            "question": "இந்த பாடத்தில் என்ன கற்றோம்?",
            "options": ["வரலாறு", "அறிவியல்", "பாட உள்ளடக்கம்", "கணிதம்"],
            "answer": "பாட உள்ளடக்கம்",
            "explanation": "பாடத்தின் சுருக்கம் அடிப்படையில்"
        },
        {
            "question": "இந்த பாடம் எந்த வகுப்பிற்கானது?",
            "options": ["வகுப்பு 6", "வகுப்பு 7",
                        f"வகுப்பு {lesson['class_name']}", "வகுப்பு 10"],
            "answer": f"வகுப்பு {lesson['class_name']}",
            "explanation": "சரியான வகுப்பு"
        }
    ]


def _fallback_essay(lesson: dict) -> str:
    return (f"'{lesson['title']}' பாடத்தில் கற்றதை உன் வாழ்க்கையோடு "
            f"எவ்வாறு இணைக்கிறாய்? உன் சொந்த வார்த்தைகளில் எழுது.")


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _parse_competencies(comp_str: str) -> list:
    try:
        return json.loads(comp_str)
    except Exception:
        return []


def _now() -> str:
    from datetime import datetime
    return datetime.now().isoformat()
