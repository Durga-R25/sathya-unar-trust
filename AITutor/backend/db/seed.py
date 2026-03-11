"""
Seed the database.
- If data/all_chapters.json exists (fetched by fetch_all_chapters.py):
    seeds ALL subjects and ALL chapters for Class 8 & 9
- Otherwise: seeds Tamil-only lessons from class8/9_lessons.json

Run:
    python backend/db/seed.py
"""

import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.db.db import get_conn, init_db, hash_pin

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")

SUBJECT_LABELS = {
    "tamil":   "தமிழ்",
    "maths":   "கணிதம்",
    "science": "அறிவியல்",
    "social":  "சமூக அறிவியல்",
    "english": "English",
    "bridge":  "Bridge Course",
}


# ── School ────────────────────────────────────────────────────────────────────

def seed_school(conn):
    conn.execute(
        "INSERT OR IGNORE INTO schools (name, code) VALUES (?,?)",
        ("Govt. Higher Secondary School - Pilot", "GHS001")
    )
    return conn.execute(
        "SELECT id FROM schools WHERE code='GHS001'"
    ).fetchone()["id"]


# ── Users ─────────────────────────────────────────────────────────────────────

def seed_users(conn, school_id: int):
    users = [
        ("அர்ஜுன்",      "student", "8", "A", "1234", school_id),
        ("பிரியா",        "student", "8", "A", "1234", school_id),
        ("கார்த்திக்",    "student", "8", "A", "1234", school_id),
        ("முத்துலக்ஷ்மி", "student", "8", "A", "1234", school_id),
        ("ராஜேஷ்",        "student", "8", "A", "1234", school_id),
        ("அனிதா",         "student", "9", "A", "1234", school_id),
        ("சுரேஷ்",        "student", "9", "A", "1234", school_id),
        ("கவிதா",         "student", "9", "A", "1234", school_id),
        ("விக்னேஷ்",      "student", "9", "A", "1234", school_id),
        ("லாவண்யா",       "student", "9", "A", "1234", school_id),
        ("ஆசிரியர் மீனா", "teacher", None, None, "teacher123", school_id),
        ("ஆசிரியர் ரவி",  "teacher", None, None, "teacher123", school_id),
        ("Admin",          "admin",   None, None, "admin123",   school_id),
    ]
    for name, role, cls, sec, pin, sid in users:
        conn.execute(
            "INSERT OR IGNORE INTO users "
            "(name,role,class_name,section,school_id,pin_hash) VALUES (?,?,?,?,?,?)",
            (name, role, cls, sec, sid, hash_pin(pin))
        )
    print(f"  {len(users)} users")


# ── Lessons from all_chapters.json (full subject list) ───────────────────────

def seed_from_all_chapters(conn) -> int:
    path = os.path.join(DATA_DIR, "all_chapters.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    count = 0
    for cls, subjects in data.items():
        for subject, terms in subjects.items():
            subject_label = SUBJECT_LABELS.get(subject, subject.title())
            for term, tdata in terms.items():
                playlist_id = tdata["playlist_id"]
                term_label = "Term 1" if term == "term_1" else "Term 2"
                for chapter in tdata["chapters"]:
                    lesson_id = f"c{cls}-{subject}-{term}-{chapter['position']:03d}"
                    dur = chapter.get("duration") or 0
                    conn.execute(
                        """INSERT OR REPLACE INTO lessons
                           (id, class_name, subject, unit, title,
                            youtube_id, playlist_id, duration_min,
                            lesson_summary, competencies,
                            opening_question, checkpoint_json)
                           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (
                            lesson_id,
                            cls,
                            subject_label,
                            term_label,
                            chapter["title"],
                            chapter["video_id"],
                            playlist_id,
                            max(1, dur // 60),
                            "",
                            json.dumps([]),
                            "",
                            json.dumps([]),
                        )
                    )
                    count += 1
    return count


# ── Fallback: Tamil-only from class8/9_lessons.json ──────────────────────────

def seed_tamil_fallback(conn) -> int:
    count = 0
    for fname in ["class8_lessons.json", "class9_lessons.json"]:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        cls = data["class"]
        playlist_id = (data.get("playlists", {})
                           .get("tamil", {})
                           .get("term_1", ""))

        for lesson in data["lessons"]:
            yid = lesson.get("youtube_id", "")
            if not yid or yid == "FIND_FROM_KALVITV":
                yid = ""
            conn.execute(
                """INSERT OR REPLACE INTO lessons
                   (id, class_name, subject, unit, title,
                    youtube_id, playlist_id, duration_min,
                    lesson_summary, competencies,
                    opening_question, checkpoint_json)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    lesson["id"],
                    cls,
                    "தமிழ்",
                    f"{lesson['unit']} - {lesson['unit_name']}",
                    lesson["title"],
                    yid,
                    playlist_id,
                    lesson.get("duration_minutes", 15),
                    lesson.get("lesson_summary", ""),
                    json.dumps(lesson.get("competencies", []), ensure_ascii=False),
                    lesson.get("opening_question", ""),
                    json.dumps(lesson.get("checkpoints", []), ensure_ascii=False),
                )
            )
            count += 1
    return count


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Initializing database...")
    init_db()
    conn = get_conn()

    print("Seeding school...")
    school_id = seed_school(conn)

    print("Seeding users...")
    seed_users(conn, school_id)

    print("Seeding lessons...")
    chapters_json = os.path.join(DATA_DIR, "all_chapters.json")
    if os.path.exists(chapters_json):
        count = seed_from_all_chapters(conn)
        print(f"  {count} chapters from all_chapters.json (all subjects)")
    else:
        count = seed_tamil_fallback(conn)
        print(f"  {count} Tamil lessons (fallback)")
        print("  Tip: run fetch_all_chapters.py to get all subjects")

    conn.commit()
    conn.close()
    print(f"\nDone. {count} lessons ready.")


# Called from streamlit_app.py on startup
def auto_seed_if_empty():
    """Seed only if lessons table is empty (cloud deployment safe)."""
    from backend.db.db import get_conn, init_db
    init_db()
    conn = get_conn()
    count = conn.execute("SELECT COUNT(*) FROM lessons").fetchone()[0]
    users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    if count == 0 or users == 0:
        main()


if __name__ == "__main__":
    main()
