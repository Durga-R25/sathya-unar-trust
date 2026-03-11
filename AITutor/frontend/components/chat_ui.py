"""
AI Tutor Chat Component
- Uses st.chat_input() for Enter key support
- History keyed to lesson_id to survive reruns
- Includes evaluation (MCQ + essay) stage
- Bilingual via frontend.i18n.T()
"""

import os
import sys
import json
import streamlit as st

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.ai.tutor_prompt import build_tutor_prompt, build_english_tutor_prompt
from backend.db.db import save_tutor_session, upsert_progress, award_badge
from frontend.i18n import T


# ── Helpers ───────────────────────────────────────────────────────

def _get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        try:
            key = st.secrets["ANTHROPIC_API_KEY"]
        except Exception:
            pass
    return key


def _lang(lesson: dict) -> str:
    """Tamil subject always 'ta'; everything else uses the user's chosen lang."""
    if (lesson.get("subject") or "").strip() == "தமிழ்":
        return "ta"
    return st.session_state.get("lang", "ta")


def _msg_key(lesson_id: str) -> str:
    return f"chat_msgs_{lesson_id}"


def _eval_key(lesson_id: str) -> str:
    return f"eval_{lesson_id}"


def _parse_competencies(comp_str: str) -> list:
    try:
        return json.loads(comp_str)
    except Exception:
        return []


def _now() -> str:
    from datetime import datetime
    return datetime.now().isoformat()


# ── Checkpoint ────────────────────────────────────────────────────

def _render_checkpoint(student: dict, lesson: dict) -> bool:
    """
    Show checkpoint MCQ if not yet answered.
    Returns True when all checkpoints are done (or none exist).
    """
    lang = _lang(lesson)
    lid  = lesson["id"]

    try:
        checkpoints = json.loads(lesson.get("checkpoint_json") or "[]")
    except Exception:
        checkpoints = []

    if not checkpoints:
        return True  # nothing to check

    cp_key = f"checkpoint_done_{lid}"
    if st.session_state.get(cp_key):
        return True  # already answered

    cp_idx_key = f"checkpoint_idx_{lid}"
    idx = st.session_state.get(cp_idx_key, 0)

    if idx >= len(checkpoints):
        st.session_state[cp_key] = True
        return True

    cp = checkpoints[idx]
    question = cp.get("question", "")
    options  = cp.get("options", [])
    answer   = cp.get("answer", "")

    if not question:
        # skip empty checkpoint
        st.session_state[cp_idx_key] = idx + 1
        st.rerun()
        return False

    st.markdown(f"""
    <div style='background:#EFF6FF;border-left:4px solid #2563EB;
                padding:14px 16px;border-radius:10px;margin-bottom:12px;'>
        <b style='color:#1E3A8A;'>{'Checkpoint' if lang == 'en' else 'இடை நிறுத்தம்'} {idx+1}/{len(checkpoints)}</b><br>
        <span style='font-family:"Noto Sans Tamil",sans-serif;font-size:16px;'>
            {question}
        </span>
    </div>
    """, unsafe_allow_html=True)

    cp_ans_key = f"cp_ans_{lid}_{idx}"
    chosen = st.radio(
        label="Choose answer" if lang == "en" else "விடை தேர்வு செய்",
        options=options,
        index=None,
        key=cp_ans_key,
    )

    submitted_key = f"cp_submitted_{lid}_{idx}"
    if not st.session_state.get(submitted_key):
        if st.button("Submit" if lang == "en" else "சமர்ப்பி",
                     key=f"cp_submit_{lid}_{idx}",
                     disabled=(chosen is None)):
            st.session_state[submitted_key] = True
            st.session_state[f"cp_chosen_{lid}_{idx}"] = chosen
            upsert_progress(student["id"], lid, checkpoint_answered=1)
            st.rerun()
    else:
        final_chosen = st.session_state.get(f"cp_chosen_{lid}_{idx}", "")
        is_correct   = (final_chosen == answer)
        if is_correct:
            st.success("✅ " + ("Correct!" if lang == "en" else "சரியான விடை!"))
        else:
            st.error("❌ " + ("Incorrect." if lang == "en" else "தவறான விடை.") +
                     f" {'Correct answer' if lang == 'en' else 'சரியான விடை'}: **{answer}**")

        if st.button("Continue" if lang == "en" else "தொடர்",
                     key=f"cp_next_{lid}_{idx}"):
            st.session_state[cp_idx_key] = idx + 1
            if idx + 1 >= len(checkpoints):
                st.session_state[cp_key] = True
            st.rerun()

    return False


# ── Chat ──────────────────────────────────────────────────────────

def render_chat(student: dict, lesson: dict):
    import anthropic
    client = anthropic.Anthropic(api_key=_get_api_key())

    lang = _lang(lesson)
    key  = _msg_key(lesson["id"])

    # ── Checkpoint gate ───────────────────────────────────────────
    if not _render_checkpoint(student, lesson):
        return

    if key not in st.session_state:
        opening = lesson.get("opening_question") or T("chat_opening_q", lang)
        st.session_state[key] = [{"role": "assistant", "content": opening}]

    messages: list = st.session_state[key]

    if lang == "en":
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

    st.markdown(f"""
    <div style='background:#1E3A8A;color:white;padding:12px 16px;
                border-radius:10px;margin-bottom:8px;'>
        🧑‍🏫 <b>Kalvi AI</b> — {lesson['title']}
    </div>
    """, unsafe_allow_html=True)

    for msg in messages:
        with st.chat_message("assistant" if msg["role"] == "assistant" else "user",
                             avatar="🤖" if msg["role"] == "assistant" else "👤"):
            st.markdown(
                f"<span style='font-family:\"Noto Sans Tamil\",sans-serif;"
                f"font-size:16px;line-height:1.8;'>{msg['content']}</span>",
                unsafe_allow_html=True
            )

    turn_count = len([m for m in messages if m["role"] == "user"])
    st.caption(f"{T('turns_label', lang)}: {turn_count}")

    user_input = st.chat_input(T("chat_placeholder", lang))

    if user_input and user_input.strip():
        messages.append({"role": "user", "content": user_input.strip()})

        with st.chat_message("user", avatar="👤"):
            st.markdown(
                f"<span style='font-family:\"Noto Sans Tamil\",sans-serif;"
                f"font-size:16px;'>{user_input.strip()}</span>",
                unsafe_allow_html=True
            )

        with st.chat_message("assistant", avatar="🤖"):
            with st.spinner(T("ai_thinking", lang)):
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

        st.session_state[key] = messages
        save_tutor_session(student["id"], lesson["id"], messages)

        turn_count = len([m for m in messages if m["role"] == "user"])
        upsert_progress(student["id"], lesson["id"], tutor_turns=turn_count)

        if turn_count == 5:
            newly = award_badge(student["id"], "curious_learner", T("curious_badge", lang))
            if newly:
                st.balloons()
                st.success(T("new_badge", lang))

    st.markdown("<br>", unsafe_allow_html=True)
    if turn_count >= 3:
        if st.button(T("go_eval_btn", lang), use_container_width=True,
                     key=f"go_eval_{lesson['id']}"):
            st.session_state["lesson_stage"] = "evaluate"
            st.rerun()


# ── Evaluation ────────────────────────────────────────────────────

def render_evaluation(student: dict, lesson: dict):
    import anthropic
    client = anthropic.Anthropic(api_key=_get_api_key())

    lang = _lang(lesson)
    ekey = _eval_key(lesson["id"])

    if ekey not in st.session_state:
        st.session_state[ekey] = {
            "mcq": None,
            "mcq_answers": {},
            "mcq_submitted": False,
            "mcq_score": None,
            "essay_question": None,
            "essay_answer": "",
            "essay_feedback": None,
            "essay_submitted": False,
        }

    ev = st.session_state[ekey]

    st.markdown(f"""
    <div style='background:linear-gradient(135deg,#1D4ED8,#2563EB);color:white;
                padding:16px;border-radius:12px;margin-bottom:20px;'>
        {T("eval_header", lang)}
    </div>
    """, unsafe_allow_html=True)

    if ev["mcq"] is None:
        with st.spinner(T("generating_qs", lang)):
            ev["mcq"], ev["essay_question"] = _generate_questions(client, lesson)
        st.session_state[ekey] = ev
        st.rerun()

    # ── MCQ ───────────────────────────────────────────────────────

    st.markdown(T("mcq_title", lang))
    st.markdown(f"<small style='color:#888;'>{T('mcq_subtitle', lang)}</small>",
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
        if st.button(T("submit_mcq", lang), use_container_width=True,
                     disabled=not all_answered,
                     key=f"submit_mcq_{lesson['id']}"):
            score = sum(1 for i, q in enumerate(ev["mcq"])
                        if ev["mcq_answers"].get(i) == q["answer"])
            ev["mcq_score"] = score
            ev["mcq_submitted"] = True
            st.session_state[ekey] = ev
            st.rerun()

    else:
        score = ev["mcq_score"]
        total = len(ev["mcq"])
        pct   = int(score / total * 100)
        color = "#27AE60" if pct >= 60 else "#E74C3C"

        st.markdown(f"""
        <div style='background:{color}20;border:2px solid {color};
                    border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;'>
            <div style='font-size:32px;font-weight:700;color:{color};'>{score}/{total}</div>
            <div style='color:{color};font-size:16px;'>
                {T("well_done_score", lang) if pct >= 60 else T("keep_practicing", lang)}
            </div>
        </div>
        """, unsafe_allow_html=True)

        for i, q in enumerate(ev["mcq"]):
            chosen   = ev["mcq_answers"].get(i, "")
            correct  = q["answer"]
            is_right = chosen == correct
            st.markdown(f"""
            <div style='background:{"#D5F5E3" if is_right else "#FADBD8"};
                        border-radius:8px;padding:10px 14px;margin-bottom:8px;
                        font-family:"Noto Sans Tamil",sans-serif;'>
                {"✅" if is_right else "❌"} <b>{i+1}. {q['question']}</b><br>
                <small>{T("your_answer", lang)}: {chosen}<br>
                {T("correct_answer", lang)}: <b>{correct}</b></small>
                {"" if is_right else f"<br><small style='color:#555;'>💡 {q.get('explanation','')}</small>"}
            </div>
            """, unsafe_allow_html=True)

        upsert_progress(student["id"], lesson["id"], checkpoint_score=pct)

    st.markdown("---")

    # ── Essay ─────────────────────────────────────────────────────

    st.markdown(T("essay_title", lang))

    if ev["essay_question"]:
        st.markdown(f"""
        <div style='background:#EFF6FF;border-left:4px solid #2563EB;
                    padding:14px 16px;border-radius:8px;margin-bottom:16px;
                    font-family:"Noto Sans Tamil",sans-serif;font-size:16px;'>
            🖊️ {ev['essay_question']}
        </div>
        """, unsafe_allow_html=True)

    if not ev["essay_submitted"]:
        essay_text = st.text_area(
            T("essay_label", lang),
            value=ev.get("essay_answer", ""),
            height=150,
            key=f"essay_input_{lesson['id']}",
            placeholder=T("essay_placeholder", lang)
        )
        ev["essay_answer"] = essay_text
        st.session_state[ekey] = ev

        word_count = len(essay_text.split()) if essay_text.strip() else 0
        st.caption(f"{word_count} {T('word_count', lang)}")

        if st.button(T("submit_essay", lang), use_container_width=True,
                     disabled=(word_count < 5),
                     key=f"submit_essay_{lesson['id']}"):
            with st.spinner(T("evaluating", lang)):
                ev["essay_feedback"] = _evaluate_essay(
                    client, lesson, ev["essay_question"], essay_text
                )
            ev["essay_submitted"] = True
            st.session_state[ekey] = ev
            award_badge(student["id"], "essay_writer", T("essay_badge", lang))
            st.rerun()

    else:
        st.markdown(f"""
        <div style='background:#F8F9FA;border-radius:8px;padding:12px 16px;
                    margin-bottom:12px;font-family:"Noto Sans Tamil",sans-serif;'>
            <small style='color:#888;'>{T("your_answer", lang)}:</small><br>
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
                    <b style='font-size:16px;'>🤖 Kalvi AI</b>
                    <span style='background:{score_color};color:white;
                                 padding:4px 12px;border-radius:20px;font-weight:700;'>
                        {fb.get("score", "—")}/10
                    </span>
                </div>
                <div style='font-family:"Noto Sans Tamil",sans-serif;
                            font-size:15px;line-height:1.9;color:#2C3E50;'>
                    <b>{T("fb_strengths", lang)}</b><br>{fb.get("strengths", "")}<br><br>
                    <b>{T("fb_improve", lang)}</b><br>{fb.get("improvements", "")}<br><br>
                    <b>{T("fb_overall", lang)}</b><br>{fb.get("overall", "")}
                </div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button(T("complete_btn", lang), use_container_width=True,
                     key=f"complete_{lesson['id']}"):
            upsert_progress(student["id"], lesson["id"],
                            completed=1, completed_at=_now())
            award_badge(student["id"], "lesson_complete", T("lesson_badge", lang))
            st.session_state["lesson_completed"] = True
            st.session_state["lesson_stage"] = "summary"
            st.rerun()


# ── AI: Generate questions ────────────────────────────────────────

def _generate_questions(client, lesson: dict) -> tuple[list, str]:
    lang = _lang(lesson)

    if lang == "en":
        prompt = f"""You are an English teacher. Create questions for the following lesson.

Class: {lesson['class_name']}
Lesson: {lesson['title']}
Lesson Summary: {lesson.get('lesson_summary', '')}

Create 3 multiple choice questions and 1 written response question.
The written response question should ask students to connect the lesson to their own life.

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

Rules: Simple English for Class {lesson['class_name']} students. Questions based on lesson only."""
    else:
        prompt = f"""நீ ஒரு தமிழ் ஆசிரியர். கீழே உள்ள பாடத்திற்கு கேள்விகள் உருவாக்கு.

வகுப்பு: {lesson['class_name']}
பாடம்: {lesson['title']}
பாட சுருக்கம்: {lesson.get('lesson_summary', '')}

3 பலவுள் தெரிவு கேள்விகளும் 1 கட்டுரை கேள்வியும் உருவாக்கு.

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

விதிகள்: எல்லாமே தமிழில். வகுப்பு {lesson['class_name']} மாணவர்களுக்கு பொருத்தமானது."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        data = json.loads(raw)
        return data.get("mcq", []), data.get("essay_question", "")
    except json.JSONDecodeError:
        return _fallback_mcq(lesson), _fallback_essay(lesson)


# ── AI: Evaluate essay ────────────────────────────────────────────

def _evaluate_essay(client, lesson: dict, question: str, answer: str) -> dict:
    lang = _lang(lesson)

    if lang == "en":
        prompt = f"""You are a kind English teacher. Evaluate the student's written response.

Lesson: {lesson['title']} (Class {lesson['class_name']})
Question: {question}
Student's answer: {answer}

Reply ONLY in this JSON format:
{{
  "score": (integer 1-10),
  "strengths": "2-3 lines of what the student did well",
  "improvements": "2-3 lines of encouragement to improve",
  "overall": "1-2 lines of overall encouragement"
}}

Rules: Simple English. Never scold. Always encourage."""
    else:
        prompt = f"""நீ ஒரு அன்பான தமிழ் ஆசிரியர். மாணவரின் பதிலை மதிப்பீடு செய்.

பாடம்: {lesson['title']} (வகுப்பு {lesson['class_name']})
கேள்வி: {question}
மாணவரின் பதில்: {answer}

இந்த JSON format-ல் மட்டுமே பதில் சொல்:
{{
  "score": (1-10 integer),
  "strengths": "2-3 வரிகளில் தமிழில்",
  "improvements": "2-3 வரிகளில் தமிழில், கோபமின்றி",
  "overall": "1-2 வரிகளில் ஊக்கமளி"
}}

விதிகள்: தமிழில் மட்டும். ஒருபோதும் திட்டாதே."""

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
        if lang == "en":
            return {"score": 7,
                    "strengths": "Good effort! You wrote in your own words.",
                    "improvements": "Try to add more detail next time.",
                    "overall": "Keep going — you can do even better! 🌟"}
        return {"score": 7,
                "strengths": "நல்ல முயற்சி செய்தாய்!",
                "improvements": "இன்னும் கொஞ்சம் விரிவாக எழுதினால் நன்றாக இருக்கும்.",
                "overall": "தொடர்ந்து எழுது! 🌟"}


# ── Fallbacks ─────────────────────────────────────────────────────

def _fallback_mcq(lesson: dict) -> list:
    lang = _lang(lesson)
    if lang == "en":
        return [
            {"question": f"What is the main topic of '{lesson['title']}'?",
             "options": ["Nature", "Education", "History", "Science"],
             "answer": "Education", "explanation": "Based on the lesson content"},
            {"question": "What did you learn in this lesson?",
             "options": ["A story", "Lesson content", "A poem", "A formula"],
             "answer": "Lesson content", "explanation": "The lesson covers this topic"},
            {"question": f"Which class is this lesson for?",
             "options": ["Class 6", "Class 7", f"Class {lesson['class_name']}", "Class 10"],
             "answer": f"Class {lesson['class_name']}", "explanation": "Correct class"},
        ]
    return [
        {"question": f"{lesson['title']} பாடத்தில் முக்கிய கருத்து என்ன?",
         "options": ["இயற்கை பாதுகாப்பு", "கல்வியின் முக்கியத்துவம்", "மனித உறவுகள்", "சமூக நீதி"],
         "answer": "கல்வியின் முக்கியத்துவம்", "explanation": "பாடத்தின் மையக் கருத்து"},
        {"question": "இந்த பாடத்தில் என்ன கற்றோம்?",
         "options": ["வரலாறு", "அறிவியல்", "பாட உள்ளடக்கம்", "கணிதம்"],
         "answer": "பாட உள்ளடக்கம்", "explanation": "பாடத்தின் சுருக்கம்"},
        {"question": "இந்த பாடம் எந்த வகுப்பிற்கானது?",
         "options": ["வகுப்பு 6", "வகுப்பு 7", f"வகுப்பு {lesson['class_name']}", "வகுப்பு 10"],
         "answer": f"வகுப்பு {lesson['class_name']}", "explanation": "சரியான வகுப்பு"},
    ]


def _fallback_essay(lesson: dict) -> str:
    lang = _lang(lesson)
    if lang == "en":
        return f"How does what you learned in '{lesson['title']}' connect to your daily life? Write in your own words."
    return f"'{lesson['title']}' பாடத்தில் கற்றதை உன் வாழ்க்கையோடு எவ்வாறு இணைக்கிறாய்?"
