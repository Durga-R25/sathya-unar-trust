"""
Admin Panel Component
- Schools, Teachers, Students (CSV import), All Users with delete
"""

import io
import csv
import streamlit as st

from backend.db.db import (
    get_all_schools, add_school,
    get_all_users, add_user, delete_user,
    get_lessons,
)
from frontend.i18n import T


def render_admin_panel(user: dict, lang: str = "en"):
    st.markdown(f"""
    <div style='background:linear-gradient(135deg,#1E3A8A,#2563EB);
                color:white;padding:18px 20px;border-radius:12px;margin-bottom:16px;'>
        <h2 style='margin:0;font-size:22px;'>🔧 {"Admin Panel" if lang == "en" else "நிர்வாக பலகை"}</h2>
        <p style='margin:4px 0 0;opacity:0.85;'>{user.get("name","Admin")}</p>
    </div>
    """, unsafe_allow_html=True)

    tab_schools, tab_teachers, tab_students, tab_all = st.tabs([
        T("schools_tab", lang),
        T("teachers_tab", lang),
        T("students_tab", lang),
        T("all_users_tab", lang),
    ])

    with tab_schools:
        _schools_tab(lang)

    with tab_teachers:
        _teachers_tab(lang)

    with tab_students:
        _students_tab(lang)

    with tab_all:
        _all_users_tab(lang)


# ── Schools ───────────────────────────────────────────────────────

def _schools_tab(lang: str):
    schools = get_all_schools()

    st.markdown(f"**{'Schools' if lang == 'en' else 'பள்ளிகள்'} ({len(schools)})**")
    for s in schools:
        st.markdown(f"""
        <div style='background:white;border-radius:8px;padding:10px 14px;
                    border-left:4px solid #2563EB;margin-bottom:6px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
            🏫 <b>{s['name']}</b> &nbsp; <small style='color:#888;'>Code: {s['code']}</small>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(f"**{T('add_school', lang)}**")

    with st.form("add_school_form", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            s_name = st.text_input("School Name" if lang == "en" else "பள்ளி பெயர்")
        with col2:
            s_code = st.text_input("School Code" if lang == "en" else "பள்ளி குறியீடு")

        if st.form_submit_button(T("add_school", lang), use_container_width=True):
            if s_name.strip() and s_code.strip():
                ok = add_school(s_name.strip(), s_code.strip().upper())
                if ok:
                    st.success(T("saved_ok", lang))
                    st.rerun()
                else:
                    st.error("Code already exists" if lang == "en" else "குறியீடு ஏற்கனவே உள்ளது")
            else:
                st.warning("Fill all fields" if lang == "en" else "அனைத்து புலங்களையும் நிரப்பவும்")


# ── Teachers ──────────────────────────────────────────────────────

def _teachers_tab(lang: str):
    teachers = get_all_users(role="teacher")
    schools  = get_all_schools()
    school_map = {s["id"]: s["name"] for s in schools}

    st.markdown(f"**{'Teachers' if lang == 'en' else 'ஆசிரியர்கள்'} ({len(teachers)})**")
    for t in teachers:
        sname = school_map.get(t.get("school_id"), "—")
        st.markdown(f"""
        <div style='background:white;border-radius:8px;padding:10px 14px;
                    border-left:4px solid #1D4ED8;margin-bottom:6px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
            👨‍🏫 <b style='font-family:"Noto Sans Tamil",sans-serif;'>{t['name']}</b>
            &nbsp; <small style='color:#888;'>{sname}</small>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(f"**{T('add_teacher', lang)}**")

    with st.form("add_teacher_form", clear_on_submit=True):
        t_name = st.text_input("Teacher Name" if lang == "en" else "ஆசிரியர் பெயர்")
        t_pin  = st.text_input("PIN", type="password", max_chars=20)

        school_options = {s["name"]: s["id"] for s in schools}
        sel_school = st.selectbox("School" if lang == "en" else "பள்ளி", list(school_options.keys()))

        if st.form_submit_button(T("add_teacher", lang), use_container_width=True):
            if t_name.strip() and t_pin.strip():
                sid = school_options.get(sel_school)
                ok  = add_user(t_name.strip(), "teacher", None, None, sid, t_pin.strip())
                if ok:
                    st.success(T("saved_ok", lang))
                    st.rerun()
                else:
                    st.error("Error saving" if lang == "en" else "சேமிப்பில் பிழை")
            else:
                st.warning("Fill all fields" if lang == "en" else "அனைத்து புலங்களையும் நிரப்பவும்")


# ── Students ──────────────────────────────────────────────────────

def _students_tab(lang: str):
    students = get_all_users(role="student")
    schools  = get_all_schools()
    school_map = {s["id"]: s["name"] for s in schools}

    st.markdown(f"**{'Students' if lang == 'en' else 'மாணவர்கள்'} ({len(students)})**")

    cls_filter = st.selectbox(
        "Filter by Class" if lang == "en" else "வகுப்பு தேர்வு",
        ["All", "8", "9"], key="stu_cls_filter"
    )
    filtered = students if cls_filter == "All" else [s for s in students if str(s.get("class_name")) == cls_filter]

    for s in filtered:
        sname = school_map.get(s.get("school_id"), "—")
        st.markdown(f"""
        <div style='background:white;border-radius:8px;padding:8px 14px;
                    border-left:4px solid #0284C7;margin-bottom:4px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.05);font-size:14px;'>
            <b style='font-family:"Noto Sans Tamil",sans-serif;'>{s['name']}</b>
            &nbsp; <small style='color:#888;'>
                Cls {s.get('class_name','?')}{s.get('section','')} | {sname}
            </small>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(f"**{T('import_csv', lang)}**")
    st.caption(T("csv_format", lang))

    school_options = {s["name"]: s["id"] for s in schools}
    sel_school = st.selectbox("School" if lang == "en" else "பள்ளி", list(school_options.keys()), key="csv_school")
    uploaded = st.file_uploader("Choose CSV file", type=["csv"], key="csv_upload")

    if uploaded:
        content = uploaded.read().decode("utf-8", errors="ignore")
        reader  = csv.DictReader(io.StringIO(content))
        rows    = list(reader)

        st.markdown(f"**Preview ({len(rows)} rows):**")
        preview_rows = rows[:5]
        for r in preview_rows:
            st.text(f"  {r.get('name','?')} | Cls {r.get('class','?')}{r.get('section','?')} | PIN {r.get('pin','?')}")
        if len(rows) > 5:
            st.caption(f"... and {len(rows)-5} more")

        if st.button(T("import_btn", lang), use_container_width=True, key="do_import"):
            sid   = school_options.get(sel_school)
            ok_n  = 0
            fail_n = 0
            for r in rows:
                name = (r.get("name") or "").strip()
                cls  = (r.get("class") or "").strip()
                sec  = (r.get("section") or "A").strip()
                pin  = (r.get("pin") or "1234").strip()
                if name and cls:
                    if add_user(name, "student", cls, sec, sid, pin):
                        ok_n += 1
                    else:
                        fail_n += 1

            st.success(f"Imported {ok_n} students. Skipped {fail_n}.")
            st.rerun()


# ── All Users ─────────────────────────────────────────────────────

def _all_users_tab(lang: str):
    all_users = get_all_users()

    st.markdown(f"**{'All Users' if lang == 'en' else 'அனைவரும்'} ({len(all_users)})**")

    role_icons = {"student": "📚", "teacher": "👨‍🏫", "admin": "🔧"}

    for u in all_users:
        icon = role_icons.get(u.get("role"), "👤")
        cls_info = f"Cls {u.get('class_name','')}{u.get('section','')}" if u.get("class_name") else u.get("role","")

        col_info, col_del = st.columns([5, 1])
        with col_info:
            st.markdown(f"""
            <div style='background:white;border-radius:8px;padding:8px 14px;
                        border-left:4px solid #6366F1;margin-bottom:4px;
                        box-shadow:0 1px 3px rgba(0,0,0,0.05);font-size:14px;'>
                {icon} <b style='font-family:"Noto Sans Tamil",sans-serif;'>{u['name']}</b>
                &nbsp; <small style='color:#888;'>{cls_info}</small>
            </div>
            """, unsafe_allow_html=True)
        with col_del:
            if u.get("role") != "admin":
                if st.button(T("delete_btn", lang), key=f"del_{u['id']}", use_container_width=True):
                    delete_user(u["id"])
                    st.rerun()
