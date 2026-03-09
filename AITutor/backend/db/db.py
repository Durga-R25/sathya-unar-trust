"""
Simple SQLite database for AITutor prototype.
No PostgreSQL server needed — runs as a local file.
"""

import sqlite3
import hashlib
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "aitutor.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = get_conn()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS schools (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT NOT NULL,
            code    TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            role        TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
            class_name  TEXT,
            section     TEXT,
            school_id   INTEGER REFERENCES schools(id),
            pin_hash    TEXT NOT NULL,
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS lessons (
            id              TEXT PRIMARY KEY,
            class_name      TEXT NOT NULL,
            subject         TEXT NOT NULL,
            term            TEXT,
            unit            TEXT,
            title           TEXT NOT NULL,
            youtube_id      TEXT,
            playlist_id     TEXT,
            duration_min    INTEGER,
            lesson_summary  TEXT,
            competencies    TEXT,
            opening_question TEXT,
            checkpoint_json TEXT,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS student_progress (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id          INTEGER REFERENCES users(id),
            lesson_id           TEXT REFERENCES lessons(id),
            video_watched       INTEGER DEFAULT 0,
            checkpoint_answered INTEGER DEFAULT 0,
            checkpoint_score    INTEGER DEFAULT 0,
            tutor_turns         INTEGER DEFAULT 0,
            completed           INTEGER DEFAULT 0,
            completed_at        TEXT,
            UNIQUE(student_id, lesson_id)
        );

        CREATE TABLE IF NOT EXISTS tutor_sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id  INTEGER REFERENCES users(id),
            lesson_id   TEXT REFERENCES lessons(id),
            messages    TEXT NOT NULL DEFAULT '[]',
            started_at  TEXT DEFAULT (datetime('now')),
            ended_at    TEXT
        );

        CREATE TABLE IF NOT EXISTS badges (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id  INTEGER REFERENCES users(id),
            badge_key   TEXT NOT NULL,
            badge_label TEXT NOT NULL,
            earned_at   TEXT DEFAULT (datetime('now'))
        );
    """)

    conn.commit()
    conn.close()


def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


# ── Auth ──────────────────────────────────────────────────────────────────────

def login_user(name: str, class_name: str, pin: str) -> dict | None:
    """Returns user dict if credentials match, else None."""
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM users WHERE name=? AND class_name=? AND pin_hash=?",
        (name.strip(), class_name, hash_pin(pin))
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def login_teacher(name: str, pin: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM users WHERE name=? AND role='teacher' AND pin_hash=?",
        (name.strip(), hash_pin(pin))
    ).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Lessons ───────────────────────────────────────────────────────────────────

def get_lessons(class_name: str, subject: str = None) -> list[dict]:
    conn = get_conn()
    if subject:
        rows = conn.execute(
            "SELECT * FROM lessons WHERE class_name=? AND subject=? ORDER BY unit, id",
            (class_name, subject)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM lessons WHERE class_name=? ORDER BY subject, unit, id",
            (class_name,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_subjects(class_name: str) -> list[str]:
    """Return distinct subjects available for a class."""
    conn = get_conn()
    rows = conn.execute(
        "SELECT DISTINCT subject FROM lessons WHERE class_name=? ORDER BY subject",
        (class_name,)
    ).fetchall()
    conn.close()
    return [r["subject"] for r in rows]


def get_lesson(lesson_id: str) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM lessons WHERE id=?", (lesson_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Progress ──────────────────────────────────────────────────────────────────

def get_progress(student_id: int) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT sp.*, l.title, l.unit FROM student_progress sp
           JOIN lessons l ON sp.lesson_id = l.id
           WHERE sp.student_id=? ORDER BY sp.id""",
        (student_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def upsert_progress(student_id: int, lesson_id: str, **kwargs):
    """Insert or update progress for a student-lesson pair."""
    conn = get_conn()
    existing = conn.execute(
        "SELECT id FROM student_progress WHERE student_id=? AND lesson_id=?",
        (student_id, lesson_id)
    ).fetchone()

    if existing:
        sets = ", ".join(f"{k}=?" for k in kwargs)
        vals = list(kwargs.values()) + [student_id, lesson_id]
        conn.execute(
            f"UPDATE student_progress SET {sets} WHERE student_id=? AND lesson_id=?",
            vals
        )
    else:
        kwargs["student_id"] = student_id
        kwargs["lesson_id"] = lesson_id
        keys = ", ".join(kwargs.keys())
        placeholders = ", ".join("?" for _ in kwargs)
        conn.execute(
            f"INSERT INTO student_progress ({keys}) VALUES ({placeholders})",
            list(kwargs.values())
        )
    conn.commit()
    conn.close()


# ── Tutor sessions ────────────────────────────────────────────────────────────

def save_tutor_session(student_id: int, lesson_id: str, messages: list) -> int:
    conn = get_conn()
    existing = conn.execute(
        "SELECT id FROM tutor_sessions WHERE student_id=? AND lesson_id=? AND ended_at IS NULL",
        (student_id, lesson_id)
    ).fetchone()

    if existing:
        conn.execute(
            "UPDATE tutor_sessions SET messages=? WHERE id=?",
            (json.dumps(messages, ensure_ascii=False), existing["id"])
        )
        session_id = existing["id"]
    else:
        cur = conn.execute(
            "INSERT INTO tutor_sessions (student_id, lesson_id, messages) VALUES (?,?,?)",
            (student_id, lesson_id, json.dumps(messages, ensure_ascii=False))
        )
        session_id = cur.lastrowid

    conn.commit()
    conn.close()
    return session_id


def get_tutor_session(student_id: int, lesson_id: str) -> list:
    """Returns message list for an ongoing session."""
    conn = get_conn()
    row = conn.execute(
        "SELECT messages FROM tutor_sessions WHERE student_id=? AND lesson_id=? AND ended_at IS NULL",
        (student_id, lesson_id)
    ).fetchone()
    conn.close()
    return json.loads(row["messages"]) if row else []


# ── Badges ────────────────────────────────────────────────────────────────────

def award_badge(student_id: int, badge_key: str, badge_label: str):
    conn = get_conn()
    exists = conn.execute(
        "SELECT id FROM badges WHERE student_id=? AND badge_key=?",
        (student_id, badge_key)
    ).fetchone()
    if not exists:
        conn.execute(
            "INSERT INTO badges (student_id, badge_key, badge_label) VALUES (?,?,?)",
            (student_id, badge_key, badge_label)
        )
        conn.commit()
    conn.close()
    return not exists  # True = newly awarded


def get_badges(student_id: int) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM badges WHERE student_id=? ORDER BY earned_at DESC",
        (student_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Teacher view ──────────────────────────────────────────────────────────────

def get_class_progress(class_name: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT u.name, u.section,
                  COUNT(sp.lesson_id) as lessons_touched,
                  SUM(sp.completed) as lessons_done,
                  SUM(sp.tutor_turns) as total_tutor_turns,
                  AVG(sp.checkpoint_score) as avg_score,
                  MAX(sp.completed_at) as last_active
           FROM users u
           LEFT JOIN student_progress sp ON u.id = sp.student_id
           WHERE u.class_name=? AND u.role='student'
           GROUP BY u.id ORDER BY u.name""",
        (class_name,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
