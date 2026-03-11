"""
Teacher Lesson Editor Component
- List lessons grouped by subject
- Click to edit title, YouTube ID, duration, summary, opening Q, checkpoints (up to 2 MCQ)
- Save via upsert_lesson_full()
"""

import json
import streamlit as st

from backend.db.db import get_lessons, get_lesson, upsert_lesson_full
from frontend.i18n import T


def render_lesson_editor(class_name: str, lang: str = "en"):
    st.markdown(f"### {T('lesson_editor', lang)} — {'Class' if lang == 'en' else 'வகுப்பு'} {class_name}")

    lessons = get_lessons(class_name)
    if not lessons:
        st.info(T("no_data", lang))
        return

    # Group by subject
    subjects: dict[str, list] = {}
    for l in lessons:
        subjects.setdefault(l["subject"], []).append(l)

    # Lesson selector
    subject_list = list(subjects.keys())
    sel_subj = st.selectbox(
        "Subject" if lang == "en" else "பாடம்",
        subject_list,
        key=f"le_subj_{class_name}"
    )

    subj_lessons = subjects.get(sel_subj, [])
    lesson_titles = [f"{l['unit'] or ''} — {l['title']}" for l in subj_lessons]
    sel_idx = st.selectbox(
        "Lesson" if lang == "en" else "பாடம் தேர்வு",
        range(len(lesson_titles)),
        format_func=lambda i: lesson_titles[i],
        key=f"le_lesson_{class_name}"
    )

    lesson = subj_lessons[sel_idx]
    lid    = lesson["id"]

    st.markdown("---")
    st.markdown(f"**{T('lesson_editor', lang)}: {lesson['title']}**")

    # Load fresh from DB for latest values
    fresh = get_lesson(lid) or lesson

    title_val   = st.text_input("Title" if lang == "en" else "தலைப்பு",
                                value=fresh.get("title", ""),
                                key=f"le_title_{lid}")
    yt_val      = st.text_input(T("youtube_id", lang),
                                value=fresh.get("youtube_id", ""),
                                key=f"le_yt_{lid}")
    dur_val     = st.number_input(T("duration", lang),
                                  min_value=1, max_value=180,
                                  value=int(fresh.get("duration_min") or 15),
                                  key=f"le_dur_{lid}")

    if yt_val.strip():
        st.markdown(f"""
        <div style='margin:8px 0;border-radius:8px;overflow:hidden;'>
            <iframe width="100%" height="200"
                src="https://www.youtube.com/embed/{yt_val.strip()}"
                frameborder="0" allowfullscreen></iframe>
        </div>
        """, unsafe_allow_html=True)

    summary_val = st.text_area(T("summary", lang),
                               value=fresh.get("lesson_summary", ""),
                               height=100,
                               key=f"le_sum_{lid}")
    opening_val = st.text_area(T("opening_q", lang),
                               value=fresh.get("opening_question", ""),
                               height=80,
                               key=f"le_oq_{lid}")

    # Checkpoints
    st.markdown(f"**{T('checkpoints', lang)}** (max 2)")

    try:
        checkpoints = json.loads(fresh.get("checkpoint_json") or "[]")
    except Exception:
        checkpoints = []

    # Ensure at most 2 entries
    while len(checkpoints) < 2:
        checkpoints.append({"question": "", "options": ["", "", "", ""], "answer": "", "time_minutes": 5})

    new_checkpoints = []
    for ci in range(2):
        cp = checkpoints[ci]
        with st.expander(f"Checkpoint {ci+1}", expanded=(ci == 0 and not cp.get("question"))):
            cp_q = st.text_input(f"Question {ci+1}",
                                 value=cp.get("question", ""),
                                 key=f"le_cpq_{lid}_{ci}")
            cp_opts = cp.get("options", ["", "", "", ""])
            while len(cp_opts) < 4:
                cp_opts.append("")
            new_opts = []
            for oi in range(4):
                opt = st.text_input(f"Option {oi+1}",
                                    value=cp_opts[oi],
                                    key=f"le_opt_{lid}_{ci}_{oi}")
                new_opts.append(opt)
            cp_ans  = st.text_input("Correct Answer" if lang == "en" else "சரியான விடை",
                                    value=cp.get("answer", ""),
                                    key=f"le_ans_{lid}_{ci}")
            cp_time = st.number_input("Time (minutes)" if lang == "en" else "நேரம் (நிமிடங்கள்)",
                                      min_value=1, max_value=60,
                                      value=int(cp.get("time_minutes") or 5),
                                      key=f"le_time_{lid}_{ci}")
            new_checkpoints.append({
                "question": cp_q,
                "options": new_opts,
                "answer": cp_ans,
                "time_minutes": cp_time,
            })

    if st.button(T("save_btn", lang), use_container_width=True, key=f"le_save_{lid}"):
        # Only keep checkpoints that have a question filled
        valid_cps = [c for c in new_checkpoints if c.get("question", "").strip()]
        upsert_lesson_full(
            lesson_id=lid,
            class_name=fresh["class_name"],
            subject=fresh["subject"],
            unit=fresh.get("unit", ""),
            title=title_val.strip() or fresh["title"],
            youtube_id=yt_val.strip(),
            playlist_id=fresh.get("playlist_id", ""),
            duration_min=int(dur_val),
            lesson_summary=summary_val.strip(),
            opening_question=opening_val.strip(),
            checkpoint_json=json.dumps(valid_cps, ensure_ascii=False),
        )
        st.success(T("saved_ok", lang))
        st.rerun()
