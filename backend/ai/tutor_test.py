"""
Quick test script to validate Tamil AI Tutor prompts.
Run this BEFORE building the full app to tune the AI behavior.

Usage:
    python backend/ai/tutor_test.py

Requires:
    pip install anthropic python-dotenv
"""

import os
import sys

# Fix Windows terminal Tamil Unicode rendering
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    # Force UTF-8 codepage in Windows console
    os.system("chcp 65001 >nul 2>&1")

from dotenv import load_dotenv

load_dotenv()


def test_tutor_conversation():
    """
    Simulates a student-AI tutor conversation for Class 8 Tamil.
    Tests the Khanmigo-style Socratic interaction.
    """
    try:
        import anthropic
    except ImportError:
        print("Run: pip install anthropic python-dotenv")
        return

    from tutor_prompt import build_tutor_prompt

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # Test scenario: Class 8, Water Resources lesson
    system_prompt = build_tutor_prompt(
        class_name="வகுப்பு 8",
        lesson_title="நீர் — உயிரின் அடிப்படை",
        unit_name="Unit 2 - இயற்கை வளங்கள்",
        competencies=["reading_comprehension", "critical_thinking", "inference"],
        lesson_summary=(
            "நீரின் முக்கியத்துவம், நீர் ஆதாரங்கள், நீர் சேமிப்பு முறைகள், "
            "மற்றும் நீர் மாசுபாட்டை தடுக்கும் வழிகள் பற்றி விவரிக்கிறது."
        )
    )

    # Simulate a conversation
    test_messages = [
        "வீடியோவில் பார்த்தது: நீர் முக்கியம்",
        "தெரியல sir",
        "மழை இல்லாம போகுது",
        "நாங்க குளம் வச்சிருக்கோம்",
    ]

    print("=" * 60)
    print("AITutor - Tamil Tutor Test")
    print("Lesson: நீர் — உயிரின் அடிப்படை (Class 8)")
    print("=" * 60)

    conversation_history = []
    output_lines = []

    def log(text=""):
        """Print to terminal and collect for file output."""
        print(text)
        output_lines.append(text)

    # Opening question from AI
    opening = (
        "வணக்கம்! வீடியோ பார்த்தாய் — நல்லது! "
        "உன் வீட்டில் தினமும் எவ்வளவு தண்ணீர் செலவாகும் என்று "
        "யோசித்திருக்கிறாயா?"
    )
    log(f"\n[கல்வி AI]:\n{opening}\n")
    conversation_history.append({"role": "assistant", "content": opening})

    for student_input in test_messages:
        log(f"[மாணவர்]: {student_input}\n")
        conversation_history.append({"role": "user", "content": student_input})

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=system_prompt,
            messages=conversation_history
        )

        ai_response = response.content[0].text
        log(f"[கல்வி AI]:\n{ai_response}\n")
        log("-" * 40)

        conversation_history.append({"role": "assistant", "content": ai_response})

    log("\n[Test complete]")
    log("Check: Does AI always ask a follow-up question?")
    log("Check: Does AI avoid giving direct answers?")
    log("Check: Is the Tamil simple and encouraging?")

    # Always write to file — readable regardless of terminal encoding
    _write_output_file("test_output_class8.txt", output_lines)


def test_incorrect_answer_handling():
    """
    Tests how the AI handles wrong answers — should encourage, not shame.
    """
    try:
        import anthropic
    except ImportError:
        print("Run: pip install anthropic python-dotenv")
        return

    from tutor_prompt import build_tutor_prompt

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    system_prompt = build_tutor_prompt(
        class_name="வகுப்பு 9",
        lesson_title="திருக்குறள் — அன்பின் வலிமை",
        unit_name="Unit 1 - திருக்குறள்",
        competencies=["literary_interpretation", "critical_thinking"],
        lesson_summary=(
            "திருவள்ளுவர் அன்பைப் பற்றி எழுதிய குறள்களின் ஆழமான பொருளை விவரிக்கிறது."
        )
    )

    print("=" * 60)
    print("Test: Incorrect Answer Handling")
    print("Lesson: திருக்குறள் — அன்பு (Class 9)")
    print("=" * 60)

    # Deliberately wrong answer scenario
    conversation = [
        {
            "role": "assistant",
            "content": (
                "'அன்பிற்கும் உண்டோ அடைக்குந்தாழ்' என்ற குறளில் "
                "வள்ளுவர் என்ன சொல்கிறார் என்று உன் வார்த்தைகளில் சொல்?"
            )
        },
        {
            "role": "user",
            "content": "அன்பு பணம் போல இருக்கும்னு சொல்றாரு"  # Wrong answer
        }
    ]

    output_lines = []

    def log(text=""):
        print(text)
        output_lines.append(text)

    log(f"\n[கல்வி AI]:\n{conversation[0]['content']}\n")
    log(f"[மாணவர்]: {conversation[1]['content']}\n")

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system_prompt,
        messages=conversation
    )

    log(f"[கல்வி AI]:\n{response.content[0].text}\n")
    log("\nCheck: Did AI encourage first before correcting?")
    log("Check: Did AI guide thinking rather than give the answer?")

    _write_output_file("test_output_class9.txt", output_lines)


def _write_output_file(filename: str, lines: list):
    """
    Write test output to a UTF-8 file so Tamil text is always readable,
    regardless of Windows terminal encoding.
    Output files land in: backend/ai/test_outputs/
    """
    output_dir = os.path.join(os.path.dirname(__file__), "test_outputs")
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n>>> Tamil output saved to: {filepath}")
    print(">>> Open that file in VS Code to read Tamil clearly.")


if __name__ == "__main__":
    print("Running AITutor Tamil Prompt Tests...\n")
    test_tutor_conversation()
    print("\n" + "=" * 60 + "\n")
    test_incorrect_answer_handling()
