"""
Translation service — all UI strings in one place.
Usage:
    from frontend.i18n import T
    T("login_btn")          # → "Login"
    T("chat_placeholder", "ta")  # → Tamil string
"""

_STRINGS = {
    # ── Login ────────────────────────────────────────────────────
    "app_subtitle":       {"en": "ArivAI — Tamil AI Learning",     "ta": "ArivAI — தமிழ் AI கற்றல்"},
    "student_tab":        {"en": "📚 Student",                    "ta": "📚 மாணவர்"},
    "teacher_tab":        {"en": "👨‍🏫 Teacher",                   "ta": "👨‍🏫 ஆசிரியர்"},
    "name_label":         {"en": "Your Name",                     "ta": "உன் பெயர்"},
    "name_placeholder":   {"en": "Enter your name",               "ta": "பெயரை எழுது"},
    "class_label":        {"en": "Class",                         "ta": "வகுப்பு"},
    "section_label":      {"en": "Section",                       "ta": "பிரிவு"},
    "pin_label":          {"en": "PIN",                           "ta": "PIN"},
    "pin_placeholder":    {"en": "Enter your PIN",                "ta": "உன் PIN எண்"},
    "login_btn":          {"en": "Login →",                       "ta": "உள்நுழை →"},
    "teacher_name_label": {"en": "Teacher Name",                  "ta": "ஆசிரியர் பெயர்"},
    "password_label":     {"en": "Password",                      "ta": "கடவுச்சொல்"},
    "teacher_login_btn":  {"en": "Teacher Login →",               "ta": "ஆசிரியர் உள்நுழை →"},
    "name_required":      {"en": "Please enter your name",        "ta": "பெயர் உள்ளிடவும்"},
    "pin_required":       {"en": "Please enter your PIN",         "ta": "PIN உள்ளிடவும்"},
    "invalid_login":      {"en": "Name or PIN is incorrect",      "ta": "பெயர் அல்லது PIN சரியில்லை"},
    "invalid_teacher":    {"en": "Invalid credentials",           "ta": "தவறான நற்சான்றுகள்"},

    # ── Home ─────────────────────────────────────────────────────
    "greeting":           {"en": "Hello",                         "ta": "வணக்கம்"},
    "lessons_done":       {"en": "Lessons Done",                  "ta": "பாடங்கள் முடிந்தது"},
    "ai_chats":           {"en": "AI Chats",                      "ta": "AI உரையாடல்கள்"},
    "badges":             {"en": "Badges",                        "ta": "சாதனைகள்"},
    "choose_subject":     {"en": "📖 Choose a Subject",           "ta": "📖 பாடம் தேர்வு செய்"},
    "chapters":           {"en": "Chapters",                      "ta": "அத்தியாயங்கள்"},
    "done":               {"en": "Done",                          "ta": "முடிந்தது"},
    "open_btn":           {"en": "Open",                          "ta": "திற"},
    "back_btn":           {"en": "← Back",                        "ta": "← பின்"},
    "logout_btn":         {"en": "Logout",                        "ta": "வெளியேறு"},
    "no_chapters":        {"en": "No chapters found for this subject yet.",
                           "ta": "இந்த பாடத்திற்கான அத்தியாயங்கள் இன்னும் ஏற்றப்படவில்லை."},

    # ── Stage bar ────────────────────────────────────────────────
    "stage_video":        {"en": "1️⃣ Video",                      "ta": "1️⃣ வீடியோ"},
    "stage_chat":         {"en": "2️⃣ Chat with AI",               "ta": "2️⃣ AI உடன் பேசு"},
    "stage_eval":         {"en": "3️⃣ Evaluation",                 "ta": "3️⃣ மதிப்பீடு"},

    # ── Lesson page ──────────────────────────────────────────────
    "learning_obj":       {"en": "In this lesson, you will learn:",
                           "ta": "இந்த பாடத்தில் நீ கற்பாய்:"},
    "think_before":       {"en": "💡 Think before watching:",      "ta": "💡 வீடியோ பார்க்கும்முன் யோசி:"},
    "watch_done_msg":     {"en": "✅ After watching the video, click the button below",
                           "ta": "✅ வீடியோ பார்த்த பிறகு கீழே உள்ள பொத்தானை அழுத்து"},
    "watch_done_btn":     {"en": "▶ Done watching — Chat with ArivAI",
                           "ta": "▶ வீடியோ பார்த்தாயிற்று — AI உடன் பேசுவோம்"},

    # ── Summary ──────────────────────────────────────────────────
    "well_done":          {"en": "Well done!",                    "ta": "நல்லா கத்துக்கிட்டே!"},
    "lesson_completed":   {"en": "✅ Lesson Completed:",           "ta": "✅ முடிந்த பாடம்:"},
    "your_badges":        {"en": "🏅 Your Badges",                "ta": "🏅 உன் சாதனைகள்"},
    "home_btn":           {"en": "🏠 Home",                       "ta": "🏠 முகப்பு பக்கம்"},
    "chat_again_btn":     {"en": "🤖 Chat with AI again",         "ta": "🤖 மீண்டும் AI உடன் பேசு"},

    # ── Voice ────────────────────────────────────────────────────
    "voice_btn":          {"en": "🎤 Voice",                        "ta": "🎤 குரல்"},
    "text_btn":           {"en": "⌨️ Text",                         "ta": "⌨️ எழுத்து"},
    "speak_prompt":       {"en": "🎤 Tap to record, then stop",     "ta": "🎤 பேசி நிறுத்தவும்"},
    "transcribing":       {"en": "Listening...",                    "ta": "கேட்கிறேன்..."},
    "you_said":           {"en": "You said",                        "ta": "நீ சொன்னது"},
    "voice_error":        {"en": "Couldn't understand. Please try again.",
                           "ta": "புரியவில்லை. மீண்டும் முயற்சிக்கவும்."},
    "voice_offline":      {"en": "No internet for voice. Please type instead.",
                           "ta": "குரல் சேவை இல்லை. எழுத்தில் தட்டவும்."},

    # ── Chat UI ──────────────────────────────────────────────────
    "chat_opening_q":     {"en": "Hello! Great job watching the video! What was the most interesting thing you noticed in this lesson?",
                           "ta": "வணக்கம்! வீடியோ பார்த்தாய் — நல்லது! இந்த பாடத்தில் உனக்கு என்ன ஆர்வமாக இருந்தது?"},
    "turns_label":        {"en": "Turns with AI",                 "ta": "AI உடன் பேசிய முறை"},
    "chat_placeholder":   {"en": "Type your answer here... (Press Enter to send)",
                           "ta": "உன் எண்ணத்தை இங்கே எழுது... (Enter அழுத்தி அனுப்பு)"},
    "ai_thinking":        {"en": "Kalvi is thinking...",          "ta": "கல்வி யோசிக்கிறது..."},
    "go_eval_btn":        {"en": "📝 Go to Evaluation",           "ta": "📝 மதிப்பீட்டிற்கு செல்"},
    "new_badge":          {"en": "🏅 New Badge: Curious Learner!","ta": "🏅 புதிய சாதனை: ஆர்வமுள்ள மாணவன்!"},
    "curious_badge":      {"en": "Curious Learner 🌟",            "ta": "ஆர்வமுள்ள மாணவன் 🌟"},

    # ── Evaluation ───────────────────────────────────────────────
    "eval_header":        {"en": "📝 Evaluation — Let's test what you learned!",
                           "ta": "📝 மதிப்பீடு — உன் கற்றலை சோதிக்கலாம்!"},
    "generating_qs":      {"en": "Generating questions...",       "ta": "கேள்விகள் உருவாக்கப்படுகின்றன..."},
    "mcq_title":          {"en": "### Part 1 — Multiple Choice",  "ta": "### பகுதி 1 — பலவுள் தெரிவு கேள்விகள்"},
    "mcq_subtitle":       {"en": "Choose the correct answer",     "ta": "சரியான விடையைத் தேர்ந்தெடு"},
    "submit_mcq":         {"en": "✅ Submit MCQ",                  "ta": "✅ MCQ சமர்ப்பி"},
    "well_done_score":    {"en": "Well done! 🎉",                 "ta": "சரியாக செய்தாய்! 🎉"},
    "keep_practicing":    {"en": "Keep practising! 💪",           "ta": "இன்னும் படிக்கலாம்! 💪"},
    "your_answer":        {"en": "Your answer",                   "ta": "உன் பதில்"},
    "correct_answer":     {"en": "Correct answer",                "ta": "சரியான பதில்"},
    "essay_title":        {"en": "### Part 2 — Written Response", "ta": "### பகுதி 2 — கட்டுரை / சிந்தனை கேள்வி"},
    "essay_label":        {"en": "Write your answer here (at least 3 lines)",
                           "ta": "உன் பதில் இங்கே எழுது (குறைந்தது 3 வரிகள்)"},
    "essay_placeholder":  {"en": "Write in your own words...",    "ta": "உன் சொந்த வார்த்தைகளில் எழுது..."},
    "word_count":         {"en": "words",                         "ta": "வார்த்தைகள்"},
    "submit_essay":       {"en": "📤 Submit Essay",               "ta": "📤 கட்டுரை சமர்ப்பி"},
    "evaluating":         {"en": "Kalvi AI is reading your answer...",
                           "ta": "கல்வி AI உன் பதிலை படிக்கிறது..."},
    "fb_strengths":       {"en": "👍 Strengths:",                 "ta": "👍 நன்மைகள்:"},
    "fb_improve":         {"en": "💡 Improve:",                   "ta": "💡 மேம்படுத்த:"},
    "fb_overall":         {"en": "🌟 Overall:",                   "ta": "🌟 ஒட்டுமொத்த கருத்து:"},
    "complete_btn":       {"en": "🎉 Lesson Complete!",           "ta": "🎉 பாடம் முடித்தேன்!"},
    "essay_badge":        {"en": "Creative Writer ✍️",            "ta": "படைப்பாளி ✍️"},
    "lesson_badge":       {"en": "Lesson Complete 📚",            "ta": "பாடம் முடித்தேன் 📚"},

    # ── Admin ─────────────────────────────────────────────────────
    "admin_tab":          {"en": "🔧 Admin",                      "ta": "🔧 நிர்வாகி"},
    "schools_tab":        {"en": "🏫 Schools",                    "ta": "🏫 பள்ளிகள்"},
    "teachers_tab":       {"en": "👨‍🏫 Teachers",                  "ta": "👨‍🏫 ஆசிரியர்கள்"},
    "students_tab":       {"en": "📚 Students",                   "ta": "📚 மாணவர்கள்"},
    "all_users_tab":      {"en": "👥 All Users",                  "ta": "👥 அனைவரும்"},
    "add_school":         {"en": "Add School",                    "ta": "பள்ளி சேர்"},
    "add_teacher":        {"en": "Add Teacher",                   "ta": "ஆசிரியர் சேர்"},
    "import_csv":         {"en": "📂 Import Students (CSV)",      "ta": "📂 மாணவர் இறக்குமதி (CSV)"},
    "csv_format":         {"en": "CSV format: name,class,section,pin", "ta": "CSV வடிவம்: பெயர்,வகுப்பு,பிரிவு,PIN"},
    "import_btn":         {"en": "Import",                        "ta": "இறக்குமதி"},
    "delete_btn":         {"en": "Delete",                        "ta": "நீக்கு"},
    "save_btn":           {"en": "💾 Save",                       "ta": "💾 சேமி"},
    "saved_ok":           {"en": "✅ Saved!",                     "ta": "✅ சேமிக்கப்பட்டது!"},

    # ── Teacher editor ────────────────────────────────────────────
    "edit_lessons":       {"en": "📝 Edit Lessons",               "ta": "📝 பாடங்கள் திருத்து"},
    "lesson_editor":      {"en": "Lesson Editor",                 "ta": "பாட திருத்தி"},
    "youtube_id":         {"en": "YouTube Video ID",              "ta": "YouTube வீடியோ ID"},
    "duration":           {"en": "Duration (minutes)",            "ta": "நேரம் (நிமிடங்கள்)"},
    "summary":            {"en": "Lesson Summary",                "ta": "பாட சுருக்கம்"},
    "opening_q":          {"en": "Opening Question",              "ta": "தொடக்க கேள்வி"},
    "checkpoints":        {"en": "Checkpoint Questions",          "ta": "இடை நிறுத்த கேள்விகள்"},

    # ── Progress ──────────────────────────────────────────────────
    "progress_tab":       {"en": "📊 Progress",                   "ta": "📊 முன்னேற்றம்"},
    "leaderboard_tab":    {"en": "🏆 Leaderboard",                "ta": "🏆 சிறந்தோர்"},
    "avg_score":          {"en": "Avg Score",                     "ta": "சராசரி மதிப்பெண்"},
    "no_data":            {"en": "No data yet",                   "ta": "தரவு இல்லை"},
}


def T(key: str, lang: str = "en") -> str:
    """Return translated string. lang = 'en' or 'ta'."""
    entry = _STRINGS.get(key)
    if not entry:
        return key
    return entry.get(lang, entry.get("en", key))
