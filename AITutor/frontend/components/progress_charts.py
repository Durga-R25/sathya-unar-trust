"""
Progress Charts & Leaderboard for Teacher Dashboard
- Bar charts: lessons completed, AI chat turns per student
- Student detail breakdown via expander
- Anonymised leaderboard with metric cards
"""

import streamlit as st

from backend.db.db import get_class_progress, get_class_students, get_student_detail, get_badges
from frontend.i18n import T


def render_progress_charts(class_name: str, lang: str = "en"):
    data = get_class_progress(class_name)

    if not data:
        st.info(T("no_data", lang))
        return

    names         = [d["name"] for d in data]
    lessons_done  = [int(d.get("lessons_done") or 0) for d in data]
    tutor_turns   = [int(d.get("total_tutor_turns") or 0) for d in data]
    avg_scores    = [round(float(d.get("avg_score") or 0), 1) for d in data]

    col1, col2 = st.columns(2)

    with col1:
        st.markdown(f"**{'Lessons Completed' if lang == 'en' else 'முடிந்த பாடங்கள்'}**")
        chart_data = dict(zip(names, lessons_done))
        if any(v > 0 for v in lessons_done):
            st.bar_chart(chart_data, height=220)
        else:
            st.caption(T("no_data", lang))

    with col2:
        st.markdown(f"**{'AI Chat Turns' if lang == 'en' else 'AI உரையாடல்கள்'}**")
        turns_data = dict(zip(names, tutor_turns))
        if any(v > 0 for v in tutor_turns):
            st.bar_chart(turns_data, height=220)
        else:
            st.caption(T("no_data", lang))

    st.markdown("---")
    st.markdown(f"**{'Student Details' if lang == 'en' else 'மாணவர் விவரங்கள்'}**")

    # Get student ids for detail lookup
    students = get_class_students(class_name)
    name_to_id = {s["name"]: s["id"] for s in students}

    for i, d in enumerate(data):
        done   = int(d.get("lessons_done") or 0)
        turns  = int(d.get("total_tutor_turns") or 0)
        score  = round(float(d.get("avg_score") or 0), 1)
        last   = (d.get("last_active") or "")[:10] or "—"
        alert  = "⚠️" if done == 0 else ""
        border = "#E74C3C" if done == 0 else "#27AE60"

        with st.expander(f"{alert} {d['name']} — {done} {'lessons' if lang == 'en' else 'பாடங்கள்'} | {turns} AI | {T('avg_score', lang)}: {score}"):
            st.markdown(f"<small style='color:#888;'>{'Last active' if lang == 'en' else 'கடைசி நேரம்'}: {last}</small>", unsafe_allow_html=True)

            sid = name_to_id.get(d["name"])
            if sid:
                detail = get_student_detail(sid)
                if detail:
                    for row in detail:
                        done_icon = "✅" if row.get("completed") else "🔄"
                        st.markdown(f"""
                        <div style='font-size:13px;padding:4px 8px;background:white;
                                    border-radius:6px;margin-bottom:3px;
                                    border-left:3px solid {border};'>
                            {done_icon} <b style='font-family:"Noto Sans Tamil",sans-serif;'>{row['title']}</b>
                            &nbsp;<small style='color:#888;'>
                                {row.get('subject','')} | AI: {row.get('tutor_turns',0)} | Score: {row.get('checkpoint_score',0)}%
                            </small>
                        </div>
                        """, unsafe_allow_html=True)
                else:
                    st.caption(T("no_data", lang))


def render_leaderboard(class_name: str, lang: str = "en"):
    data = get_class_progress(class_name)

    if not data:
        st.info(T("no_data", lang))
        return

    # Sort by lessons_done desc, then tutor_turns desc
    sorted_data = sorted(
        data,
        key=lambda d: (int(d.get("lessons_done") or 0), int(d.get("total_tutor_turns") or 0)),
        reverse=True
    )

    st.markdown(f"### {T('leaderboard_tab', lang)} — {'Class' if lang == 'en' else 'வகுப்பு'} {class_name}")

    top3_colors  = ["#FFD700", "#C0C0C0", "#CD7F32"]  # gold, silver, bronze
    top3_labels  = ["🥇", "🥈", "🥉"]

    students = get_class_students(class_name)
    name_to_id = {s["name"]: s["id"] for s in students}

    # Top 3 metric cards
    top3 = sorted_data[:3]
    cols = st.columns(len(top3)) if top3 else []
    for i, (col, d) in enumerate(zip(cols, top3)):
        done   = int(d.get("lessons_done") or 0)
        turns  = int(d.get("total_tutor_turns") or 0)
        sid    = name_to_id.get(d["name"])
        badge_count = len(get_badges(sid)) if sid else 0
        color  = top3_colors[i]
        label  = top3_labels[i]

        with col:
            st.markdown(f"""
            <div style='background:white;border-radius:14px;padding:16px;
                        border-top:4px solid {color};text-align:center;
                        box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:8px;'>
                <div style='font-size:28px;'>{label}</div>
                <div style='font-size:15px;font-weight:700;color:#1E3A8A;margin:4px 0;'>
                    Student {i+1}
                </div>
                <div style='font-size:12px;color:#555;'>
                    📚 {done} {'lessons' if lang == 'en' else 'பாடங்கள்'}<br>
                    🤖 {turns} AI<br>
                    🏅 {badge_count} {'badges' if lang == 'en' else 'சாதனைகள்'}
                </div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"**{'Full Rankings (Anonymised)' if lang == 'en' else 'தரவரிசை (பெயர் மறைக்கப்பட்டது)'}**")

    for i, d in enumerate(sorted_data):
        done  = int(d.get("lessons_done") or 0)
        turns = int(d.get("total_tutor_turns") or 0)
        score = round(float(d.get("avg_score") or 0), 1)
        rank_icon = top3_labels[i] if i < 3 else f"#{i+1}"
        bg = "#FFFBEB" if i < 3 else "white"

        st.markdown(f"""
        <div style='background:{bg};border-radius:8px;padding:10px 16px;
                    margin-bottom:4px;box-shadow:0 1px 3px rgba(0,0,0,0.05);
                    display:flex;align-items:center;'>
            <span style='font-size:18px;min-width:40px;'>{rank_icon}</span>
            <b>Student {i+1}</b>
            &nbsp;&nbsp;
            <small style='color:#888;'>
                📚 {done} | 🤖 {turns} | {T('avg_score', lang)}: {score}%
            </small>
        </div>
        """, unsafe_allow_html=True)
