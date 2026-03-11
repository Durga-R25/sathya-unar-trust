"""
AITutor — Tamil AI Learning Platform
Class 8 & 9 | Government School Pilot

Run: streamlit run streamlit_app.py
"""

import os
import sys
import json
import streamlit as st
from dotenv import load_dotenv

# Path setup
sys.path.insert(0, os.path.dirname(__file__))

from backend.db.db import (
    init_db, login_user, login_teacher,
    get_lessons, get_lesson, get_progress,
    upsert_progress, get_badges, get_class_progress
)
from backend.db.seed import auto_seed_if_empty
from frontend.components.video_player import render_video
from frontend.components.chat_ui import render_chat, render_evaluation
from frontend.i18n import T

# ── Page config (must be first Streamlit call) ────────────────────────────────

st.set_page_config(
    page_title="கல்வி AI",
    page_icon="🎓",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# ── Load API key ──────────────────────────────────────────────────────────────

load_dotenv()
if "ANTHROPIC_API_KEY" not in os.environ:
    try:
        os.environ["ANTHROPIC_API_KEY"] = st.secrets["ANTHROPIC_API_KEY"]
    except Exception:
        pass

# ── Global CSS ─────────────────────────────────────────────────────────────────

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Noto Sans Tamil', sans-serif !important;
    font-size: 16px;
}
.stButton > button {
    background-color: #FF6B35;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Noto Sans Tamil', sans-serif;
    font-size: 16px;
    padding: 8px 20px;
}
.stButton > button:hover {
    background-color: #E55A2B;
}
.stTextInput > div > input {
    font-family: 'Noto Sans Tamil', sans-serif;
    font-size: 16px;
    border-radius: 8px;
}
.metric-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    text-align: center;
}
</style>
""", unsafe_allow_html=True)

# ── Init & auto-seed DB on first run ──────────────────────────────────────────

auto_seed_if_empty()

# ── Subject config ────────────────────────────────────────────────────────────

SUBJECTS = {
    "தமிழ்":            {"icon": "📚", "color": "#FF6B35", "key": "tamil"},
    "கணிதம்":           {"icon": "🔢", "color": "#1B4F8A", "key": "maths"},
    "அறிவியல்":         {"icon": "🔬", "color": "#27AE60", "key": "science"},
    "சமூக அறிவியல்":    {"icon": "🌍", "color": "#8E44AD", "key": "social"},
    "English":           {"icon": "🗣️", "color": "#E67E22", "key": "english"},
    "Bridge Course":     {"icon": "🌉", "color": "#16A085", "key": "bridge"},
}

# ── Language helper ───────────────────────────────────────────────────────────

def _lang(lesson: dict) -> str:
    """Return 'en' for English subject, 'ta' for everything else."""
    return "en" if (lesson.get("subject") or "").strip().lower() == "english" else "ta"

# ── Session state defaults ────────────────────────────────────────────────────

def init_state():
    defaults = {
        "page": "login",
        "user": None,
        "current_lesson_id": None,
        "current_subject": None,
        "lesson_stage": "video",
        "lesson_completed": False,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

init_state()


def go(page: str, **kwargs):
    st.session_state["page"] = page
    for k, v in kwargs.items():
        st.session_state[k] = v
    st.rerun()


# ════════════════════════════════════════════════════════════════════
# PAGE: LOGIN
# ════════════════════════════════════════════════════════════════════

def page_login():
    st.markdown(f"""
    <div style='text-align:center;padding:40px 0 20px;'>
        <div style='font-size:64px;'>🎓</div>
        <h1 style='color:#1B4F8A;font-size:32px;margin:8px 0;'>கல்வி AI</h1>
        <p style='color:#666;font-size:16px;'>{T("app_subtitle")} — {T("app_subtitle","ta")}</p>
        <p style='color:#888;font-size:14px;'>Govt. Higher Secondary School</p>
    </div>
    """, unsafe_allow_html=True)

    tab_student, tab_teacher = st.tabs([T("student_tab"), T("teacher_tab")])

    with tab_student:
        st.markdown("<br>", unsafe_allow_html=True)
        name = st.text_input(T("name_label"), placeholder=T("name_placeholder"))

        col1, col2 = st.columns(2)
        with col1:
            cls = st.selectbox(T("class_label"), ["8", "9"])
        with col2:
            sec = st.selectbox(T("section_label"), ["A", "B"])

        pin = st.text_input(T("pin_label"), type="password",
                            placeholder=T("pin_placeholder"), max_chars=10)

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button(T("login_btn"), use_container_width=True):
            if not name.strip():
                st.error(T("name_required"))
            elif not pin:
                st.error(T("pin_required"))
            else:
                user = login_user(name.strip(), cls, pin)
                if user:
                    st.session_state["user"] = user
                    go("home")
                else:
                    st.error(T("invalid_login"))

        st.markdown("""
        <div style='text-align:center;color:#888;font-size:13px;margin-top:16px;'>
            Demo PIN: <b>1234</b><br>
            Example: அர்ஜுன் (Class 8)
        </div>
        """, unsafe_allow_html=True)

    with tab_teacher:
        st.markdown("<br>", unsafe_allow_html=True)
        t_name = st.text_input(T("teacher_name_label"),
                               placeholder="ஆசிரியர் மீனா / ஆசிரியர் ரவி")
        t_pin = st.text_input(T("password_label"), type="password",
                              placeholder="Teacher PIN", max_chars=20)
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button(T("teacher_login_btn"), use_container_width=True):
            teacher = login_teacher(t_name.strip(), t_pin)
            if teacher:
                st.session_state["user"] = teacher
                go("teacher")
            else:
                st.error(T("invalid_teacher"))

        st.markdown("""
        <div style='text-align:center;color:#888;font-size:13px;margin-top:16px;'>
            Demo PIN: <b>teacher123</b>
        </div>
        """, unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════
# PAGE: STUDENT HOME  (subject grid → chapter list)
# ════════════════════════════════════════════════════════════════════

def page_home():
    user     = st.session_state["user"]
    cls      = user["class_name"]
    progress = get_progress(user["id"])
    badges   = get_badges(user["id"])

    completed_ids = {p["lesson_id"] for p in progress if p["completed"]}
    touched_ids   = {p["lesson_id"] for p in progress}

    done_total  = len(completed_ids)
    turns_total = sum(p.get("tutor_turns", 0) or 0 for p in progress)

    st.markdown(f"""
    <div style='background:linear-gradient(135deg,#1B4F8A,#2980B9);
                color:white;padding:18px 20px;border-radius:12px;margin-bottom:16px;'>
        <h2 style='margin:0;font-size:21px;'>{T("greeting")}, {user['name']}! 👋</h2>
        <p style='margin:3px 0 0;opacity:.85;font-size:14px;'>
            {T("class_label")} {cls}{user.get('section','A')}
        </p>
    </div>
    """, unsafe_allow_html=True)

    c1, c2, c3 = st.columns(3)
    for col, val, label, color in [
        (c1, done_total,   T("lessons_done"), "#1B4F8A"),
        (c2, turns_total,  T("ai_chats"),     "#FF6B35"),
        (c3, len(badges),  T("badges"),       "#27AE60"),
    ]:
        with col:
            st.markdown(f"""<div class='metric-card'>
                <div style='font-size:26px;font-weight:700;color:{color};'>{val}</div>
                <div style='color:#666;font-size:12px;'>{label}</div>
            </div>""", unsafe_allow_html=True)

    if badges:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown(" &nbsp;".join(b["badge_label"] for b in badges),
                    unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    current_subject = st.session_state.get("current_subject")
    if current_subject is None:
        _render_subject_grid(cls, completed_ids, touched_ids)
    else:
        _render_chapter_list(user, cls, current_subject, completed_ids, touched_ids)

    st.markdown("<br>")
    if st.button(T("logout_btn")):
        for k in list(st.session_state.keys()):
            del st.session_state[k]
        go("login")


def _render_subject_grid(cls: str, completed_ids: set, touched_ids: set):
    st.markdown(f"### {T('choose_subject')}")

    subject_list = list(SUBJECTS.items())
    for i in range(0, len(subject_list), 2):
        cols = st.columns(2)
        for j, col in enumerate(cols):
            if i + j >= len(subject_list):
                break
            subj_label, cfg = subject_list[i + j]
            with col:
                lessons = get_lessons(cls, subj_label)
                total   = len(lessons)
                done    = sum(1 for l in lessons if l["id"] in completed_ids)
                pct     = int(done / total * 100) if total else 0

                st.markdown(f"""
                <div style='background:white;border-radius:12px;padding:16px;
                            border-top:4px solid {cfg["color"]};
                            box-shadow:0 2px 8px rgba(0,0,0,0.08);
                            margin-bottom:4px;text-align:center;'>
                    <div style='font-size:32px;'>{cfg["icon"]}</div>
                    <div style='font-size:16px;font-weight:700;color:#2C3E50;
                                font-family:"Noto Sans Tamil",sans-serif;
                                margin:6px 0 4px;'>{subj_label}</div>
                    <div style='font-size:12px;color:#888;'>{total} {T("chapters")}</div>
                    <div style='background:#F0F4F8;border-radius:6px;
                                height:6px;margin:8px 0 4px;'>
                        <div style='background:{cfg["color"]};border-radius:6px;
                                    height:6px;width:{pct}%;'></div>
                    </div>
                    <div style='font-size:11px;color:{cfg["color"]};'>{done}/{total} {T("done")}</div>
                </div>
                """, unsafe_allow_html=True)

                if st.button(f"{cfg['icon']} {T('open_btn')}",
                             key=f"subj_{cls}_{cfg['key']}",
                             use_container_width=True):
                    st.session_state["current_subject"] = subj_label
                    st.rerun()


def _render_chapter_list(user: dict, cls: str, subject: str,
                         completed_ids: set, touched_ids: set):
    cfg = SUBJECTS.get(subject, {"icon": "📖", "color": "#1B4F8A"})

    col_back, col_title = st.columns([1, 5])
    with col_back:
        if st.button(T("back_btn")):
            st.session_state["current_subject"] = None
            st.rerun()
    with col_title:
        st.markdown(f"""
        <h2 style='color:{cfg["color"]};font-size:20px;margin:0;padding-top:4px;'>
            {cfg["icon"]} {subject} — {T("class_label")} {cls}
        </h2>""", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    lessons = get_lessons(cls, subject)
    if not lessons:
        st.info(T("no_chapters"))
        return

    terms: dict[str, list] = {}
    for l in lessons:
        t = l.get("unit") or "Term 1"
        terms.setdefault(t, []).append(l)

    for term_label, chapters in terms.items():
        with st.expander(f"📂 {term_label}  ({len(chapters)} {T('chapters')})",
                         expanded=(term_label == list(terms.keys())[0])):
            for ch in chapters:
                lid      = ch["id"]
                is_done  = lid in completed_ids
                is_start = lid in touched_ids
                icon     = "✅" if is_done else ("▶️" if is_start else "📄")
                border   = "#27AE60" if is_done else (cfg["color"] if is_start else "#E0E0E0")
                dur      = ch.get("duration_min") or 0
                dur_txt  = f"⏱ {dur} min" if dur else ""

                col_info, col_btn = st.columns([5, 1])
                with col_info:
                    st.markdown(f"""
                    <div style='padding:10px 14px;background:white;border-radius:8px;
                                border-left:4px solid {border};
                                box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:6px;'>
                        <div style='font-size:15px;color:#2C3E50;
                                    font-family:"Noto Sans Tamil",sans-serif;'>
                            {icon} {ch['title']}
                        </div>
                        <div style='font-size:12px;color:#aaa;margin-top:2px;'>
                            {dur_txt}
                        </div>
                    </div>""", unsafe_allow_html=True)
                with col_btn:
                    if st.button("▶", key=f"ch_{lid}", use_container_width=True):
                        if st.session_state.get("current_lesson_id") != lid:
                            st.session_state["lesson_stage"]    = "video"
                            st.session_state["lesson_completed"] = False
                        st.session_state["current_lesson_id"] = lid
                        go("lesson")


# ── Stage progress bar ─────────────────────────────────────────────

def _render_stage_bar(active: int):
    stages = [T("stage_video"), T("stage_chat"), T("stage_eval")]
    cols = st.columns(3)
    for i, (col, label) in enumerate(zip(cols, stages), 1):
        with col:
            color  = "#FF6B35" if i == active else ("#27AE60" if i < active else "#BDC3C7")
            weight = "700" if i == active else "400"
            st.markdown(
                f"<div style='text-align:center;color:{color};"
                f"font-weight:{weight};font-size:13px;'>{label}</div>",
                unsafe_allow_html=True
            )
    st.markdown("<hr style='margin:8px 0 16px;'>", unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════
# PAGE: LESSON
# ════════════════════════════════════════════════════════════════════

def page_lesson():
    user = st.session_state["user"]
    lesson_id = st.session_state.get("current_lesson_id")

    if not lesson_id:
        go("home")
        return

    lesson = get_lesson(lesson_id)
    if not lesson:
        st.error("Lesson not found")
        go("home")
        return

    stage = st.session_state.get("lesson_stage", "video")
    lang  = _lang(lesson)

    col_back, col_title = st.columns([1, 5])
    with col_back:
        if st.button(T("back_btn", lang)):
            go("home")
    with col_title:
        st.markdown(f"""
        <h2 style='color:#1B4F8A;font-size:20px;margin:0;padding-top:6px;'>
            {lesson['title']}
        </h2>
        <p style='color:#888;font-size:13px;margin:2px 0 0;'>
            {T("class_label", lang)} {lesson['class_name']} &nbsp;|&nbsp;
            {lesson.get('unit','').split(' - ')[0] if lesson.get('unit') else ''}
        </p>
        """, unsafe_allow_html=True)

    st.markdown("---")

    # ── STAGE: VIDEO ──────────────────────────────────────────────

    if stage == "video":
        _render_stage_bar(active=1)

        st.markdown(f"**{T('learning_obj', lang)}**")
        summary = lesson.get("lesson_summary", "")
        if summary:
            st.markdown(f"""
            <div style='background:#EBF5FB;padding:12px 16px;border-radius:8px;
                        font-size:15px;line-height:1.8;color:#2C3E50;
                        font-family:"Noto Sans Tamil",sans-serif;'>
                {summary}
            </div>
            """, unsafe_allow_html=True)

        opening = lesson.get("opening_question", "")
        if opening:
            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown(f"""
            <div style='background:#FFF3CD;border-left:4px solid #FF6B35;
                        padding:12px 16px;border-radius:8px;font-size:15px;
                        font-family:"Noto Sans Tamil",sans-serif;'>
                {T("think_before", lang)}<br>{opening}
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        render_video(
            youtube_id=lesson.get("youtube_id", ""),
            title=lesson["title"],
            duration_min=lesson.get("duration_min", 15),
            playlist_id=lesson.get("playlist_id", "")
        )

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown(f"""
        <div style='background:#D5F5E3;padding:12px 16px;border-radius:8px;
                    font-size:15px;font-family:"Noto Sans Tamil",sans-serif;'>
            {T("watch_done_msg", lang)}
        </div>
        """, unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)

        if st.button(T("watch_done_btn", lang), use_container_width=True):
            upsert_progress(user["id"], lesson_id, video_watched=1)
            st.session_state["lesson_stage"] = "tutor"
            st.rerun()

    # ── STAGE: TUTOR CHAT ─────────────────────────────────────────

    elif stage == "tutor":
        _render_stage_bar(active=2)
        render_chat(student=user, lesson=lesson)

    # ── STAGE: EVALUATE ───────────────────────────────────────────

    elif stage == "evaluate":
        _render_stage_bar(active=3)
        render_evaluation(student=user, lesson=lesson)

        if st.session_state.get("lesson_completed"):
            st.session_state["lesson_stage"] = "summary"
            go("summary")

    # ── STAGE: SUMMARY ────────────────────────────────────────────

    elif stage == "summary":
        go("summary")


# ════════════════════════════════════════════════════════════════════
# PAGE: LESSON SUMMARY
# ════════════════════════════════════════════════════════════════════

def page_summary():
    user      = st.session_state["user"]
    lesson_id = st.session_state.get("current_lesson_id")
    lesson    = get_lesson(lesson_id) if lesson_id else None
    lang      = _lang(lesson) if lesson else "en"

    st.markdown(f"""
    <div style='text-align:center;padding:30px 0;'>
        <div style='font-size:64px;'>🎉</div>
        <h2 style='color:#27AE60;'>{T("well_done", lang)}</h2>
    </div>
    """, unsafe_allow_html=True)

    if lesson:
        st.markdown(f"""
        <div style='background:#D5F5E3;padding:16px;border-radius:12px;
                    margin-bottom:20px;font-family:"Noto Sans Tamil",sans-serif;'>
            <b>{T("lesson_completed", lang)}</b> {lesson['title']}<br>
            <small style='color:#555;'>{lesson.get('unit','')}</small>
        </div>
        """, unsafe_allow_html=True)

    badges = get_badges(user["id"])
    if badges:
        st.markdown(f"### {T('your_badges', lang)}")
        for b in badges:
            st.markdown(f"""
            <div style='background:white;border:2px solid #F1C40F;border-radius:10px;
                        padding:12px 16px;margin-bottom:8px;font-size:18px;'>
                {b['badge_label']}
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    with col1:
        if st.button(T("home_btn", lang), use_container_width=True):
            st.session_state["lesson_stage"]    = "video"
            st.session_state["lesson_completed"] = False
            go("home")
    with col2:
        if lesson:
            if st.button(T("chat_again_btn", lang), use_container_width=True):
                st.session_state["lesson_stage"]    = "tutor"
                st.session_state["lesson_completed"] = False
                go("lesson")


# ════════════════════════════════════════════════════════════════════
# PAGE: TEACHER DASHBOARD
# ════════════════════════════════════════════════════════════════════

def page_teacher():
    user = st.session_state["user"]

    st.markdown(f"""
    <div style='background:linear-gradient(135deg,#1B4F8A,#154360);
                color:white;padding:20px;border-radius:12px;margin-bottom:20px;'>
        <h2 style='margin:0;font-size:22px;'>🏫 Teacher Dashboard</h2>
        <p style='margin:4px 0 0;opacity:0.85;'>{user['name']}</p>
    </div>
    """, unsafe_allow_html=True)

    class_tab8, class_tab9 = st.tabs(["Class 8A", "Class 9A"])

    for tab, cls in [(class_tab8, "8"), (class_tab9, "9")]:
        with tab:
            progress_list = get_class_progress(cls)

            if not progress_list:
                st.info("No students yet")
                continue

            total_students = len(progress_list)
            active = sum(1 for p in progress_list if p.get("lessons_done") or 0 > 0)

            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Students", total_students)
            with col2:
                st.metric("Active", active)
            with col3:
                avg_done = sum((p.get("lessons_done") or 0) for p in progress_list) / max(total_students, 1)
                st.metric("Avg Lessons", f"{avg_done:.1f}")

            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown("**Student Progress:**")

            for p in progress_list:
                done  = p.get("lessons_done") or 0
                turns = p.get("total_tutor_turns") or 0
                last  = p.get("last_active", "")[:10] if p.get("last_active") else "—"
                alert = "⚠️" if done == 0 else ("💬" if turns == 0 else "")

                st.markdown(f"""
                <div style='background:white;border-radius:10px;padding:12px 16px;
                            margin-bottom:8px;border-left:4px solid {"#E74C3C" if alert == "⚠️" else "#27AE60"};
                            box-shadow:0 1px 4px rgba(0,0,0,0.07);'>
                    <b style='font-family:"Noto Sans Tamil",sans-serif;'>{alert} {p['name']}</b>
                    &nbsp;&nbsp;
                    <small style='color:#888;'>
                        📚 {done} lessons &nbsp;|&nbsp;
                        🤖 {turns} AI chats &nbsp;|&nbsp;
                        📅 {last}
                    </small>
                </div>
                """, unsafe_allow_html=True)

    st.markdown("<br>")
    if st.button("Logout"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        go("login")


# ════════════════════════════════════════════════════════════════════
# ROUTER
# ════════════════════════════════════════════════════════════════════

def main():
    page = st.session_state.get("page", "login")
    user = st.session_state.get("user")

    if page != "login" and not user:
        go("login")
        return

    routes = {
        "login":   page_login,
        "home":    page_home,
        "lesson":  page_lesson,
        "summary": page_summary,
        "teacher": page_teacher,
    }

    routes.get(page, page_login)()


if __name__ == "__main__":
    main()
