"""
YouTube Playlist Fetcher
Fetches all videos from a KalviTV playlist and maps them to lessons.

Usage:
    python backend/utils/playlist_fetcher.py

Requires:
    pip install google-api-python-client python-dotenv

OR — use without API key (scrape method, no quota limits):
    python backend/utils/playlist_fetcher.py --no-api
"""

import os
import json
import sys
import re
import argparse

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv()

# ─────────────────────────────────────────────
# PLAYLIST CONFIGURATION
# Paste your KalviTV playlist IDs here
# ─────────────────────────────────────────────

PLAYLISTS = {

    # ════════════════════════════════════════════
    # CLASS 8
    # ════════════════════════════════════════════

    "c8_tamil_t1": {
        "playlist_id": "PL-mvKYotpGsL70WJ27Uu0zLtxbv_2cJ54",
        "label": "Class 8 Tamil Term 1",
        "class": "8", "subject": "tamil", "term": "1"
    },
    "c8_tamil_t2": {
        "playlist_id": "PL-mvKYotpGsIky5YS1Jcu2uF7n9nJbISd",
        "label": "Class 8 Tamil Term 2",
        "class": "8", "subject": "tamil", "term": "2"
    },
    "c8_maths_t1": {
        "playlist_id": "PL-mvKYotpGsLi8wEXrwoRgmeSMUaQghtf",
        "label": "Class 8 Maths Term 1",
        "class": "8", "subject": "maths", "term": "1"
    },
    "c8_maths_t2": {
        "playlist_id": "PL-mvKYotpGsJc8zh8S6m4hgdZOQGjJ3Fx",
        "label": "Class 8 Maths Term 2",
        "class": "8", "subject": "maths", "term": "2"
    },
    "c8_science_t1": {
        "playlist_id": "PL-mvKYotpGsIA9elKaBiSAW-TZZrSVreU",
        "label": "Class 8 Science Term 1",
        "class": "8", "subject": "science", "term": "1"
    },
    "c8_science_t2": {
        "playlist_id": "PL-mvKYotpGsJhVR7QXkvO-zAeTwYphtXC",
        "label": "Class 8 Science Term 2",
        "class": "8", "subject": "science", "term": "2"
    },
    "c8_social_t1": {
        "playlist_id": "PL-mvKYotpGsLpISmgBaPw6_iNaHZASuNn",
        "label": "Class 8 Social Science Term 1",
        "class": "8", "subject": "social", "term": "1"
    },
    "c8_social_t2": {
        "playlist_id": "PL-mvKYotpGsKgGbkq4SMz8eZGuWgVeUOM",
        "label": "Class 8 Social Science Term 2",
        "class": "8", "subject": "social", "term": "2"
    },
    "c8_english_t1": {
        "playlist_id": "PL-mvKYotpGsLRdVKirMOzcPZdUtlXjS6P",
        "label": "Class 8 English Term 1",
        "class": "8", "subject": "english", "term": "1"
    },
    "c8_bridge": {
        "playlist_id": "PL-mvKYotpGsLQ_ZkuhMMVwv-M6zXlpycE",
        "label": "Class 8 Bridge Course",
        "class": "8", "subject": "bridge", "term": "0"
    },

    # ════════════════════════════════════════════
    # CLASS 9
    # ════════════════════════════════════════════

    "c9_tamil_t1": {
        "playlist_id": "PL-mvKYotpGsIqNXh3FlkU2TEhHLDnkI7G",
        "label": "Class 9 Tamil Term 1",
        "class": "9", "subject": "tamil", "term": "1"
    },
    "c9_tamil_t2": {
        "playlist_id": "PL-mvKYotpGsKgZR-XqgavV4jxg9ep9_jm",
        "label": "Class 9 Tamil Term 2",
        "class": "9", "subject": "tamil", "term": "2"
    },
    "c9_maths_t1": {
        "playlist_id": "PL-mvKYotpGsJ0s5EtWs5K6SSH13-hBEjl",
        "label": "Class 9 Maths Term 1",
        "class": "9", "subject": "maths", "term": "1"
    },
    "c9_maths_t2": {
        "playlist_id": "PL-mvKYotpGsLn-FBb1X0gHhF7hfBB4Cl5",
        "label": "Class 9 Maths Term 2",
        "class": "9", "subject": "maths", "term": "2"
    },
    "c9_science_t1": {
        "playlist_id": "PL-mvKYotpGsKZlFqVLeeQK2KJ7ksDArFa",
        "label": "Class 9 Science Term 1",
        "class": "9", "subject": "science", "term": "1"
    },
    "c9_science_t2": {
        "playlist_id": "PL-mvKYotpGsKDafYDTeIyTSQyOtWmKxQL",
        "label": "Class 9 Science Term 2",
        "class": "9", "subject": "science", "term": "2"
    },
    "c9_social_t1": {
        "playlist_id": "PL-mvKYotpGsKLMDUNSgmb1-99_pbFIgz-",
        "label": "Class 9 Social Science Term 1",
        "class": "9", "subject": "social", "term": "1"
    },
    "c9_social_t2": {
        "playlist_id": "PL-mvKYotpGsKwkTCV7fGgQDoypFD2gpIl",
        "label": "Class 9 Social Science Term 2",
        "class": "9", "subject": "social", "term": "2"
    },
    "c9_english_t1": {
        "playlist_id": "PL-mvKYotpGsIemhKEJZ_e-DbOMDCYGC6u",
        "label": "Class 9 English Term 1",
        "class": "9", "subject": "english", "term": "1"
    },
    "c9_bridge": {
        "playlist_id": "PL-mvKYotpGsLY2cDzrz-HT8U6NoFQVyol",
        "label": "Class 9 Bridge Course",
        "class": "9", "subject": "bridge", "term": "0"
    },
}

# Keywords to auto-match video titles to lesson units
# Format: "lesson_id": ["keyword1", "keyword2", ...]
LESSON_KEYWORDS = {
    # Class 8
    "c8-u1-l1": ["காடு", "காட்டு உயிர", "வனம்"],
    "c8-u1-l2": ["விளையாட்டு", "தமிழர் விளையாட்"],
    "c8-u2-l1": ["நீர்", "நீரின்", "water", "நீர் வளம்"],
    "c8-u3-l1": ["வினைச்சொல்", "வினை", "verb"],
    # Class 9
    "c9-u1-l1": ["திருக்குறள்", "அன்பு", "kural"],
    "c9-u1-l2": ["பாரதியார்", "bharathi", "தேசியம்"],
    "c9-u2-l1": ["புதுமைப்பித்தன்", "சிறுகதை"],
    "c9-u3-l1": ["தொடர்", "வாக்கியம்", "sentence"],
}


# ─────────────────────────────────────────────
# METHOD 1: YouTube Data API v3 (needs API key)
# ─────────────────────────────────────────────

def fetch_playlist_via_api(playlist_id: str) -> list[dict]:
    """
    Fetch all videos from a YouTube playlist using the Data API.
    Requires YOUTUBE_API_KEY in .env
    """
    try:
        from googleapiclient.discovery import build
    except ImportError:
        print("Run: pip install google-api-python-client")
        return []

    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key or api_key == "optional_for_search":
        print("No YOUTUBE_API_KEY found. Use --no-api method instead.")
        return []

    youtube = build("youtube", "v3", developerKey=api_key)
    videos = []
    next_page_token = None

    while True:
        request = youtube.playlistItems().list(
            part="snippet",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        response = request.execute()

        for item in response["items"]:
            snippet = item["snippet"]
            videos.append({
                "position": snippet["position"] + 1,
                "video_id": snippet["resourceId"]["videoId"],
                "title": snippet["title"],
                "description": snippet.get("description", "")[:200],
                "thumbnail": snippet["thumbnails"].get("medium", {}).get("url", ""),
                "url": f"https://www.youtube.com/watch?v={snippet['resourceId']['videoId']}"
            })

        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break

    return videos


# ─────────────────────────────────────────────
# METHOD 2: No API key — parse playlist page
# Uses yt-dlp (most reliable, no quota limits)
# ─────────────────────────────────────────────

def fetch_playlist_no_api(playlist_id: str) -> list[dict]:
    """
    Fetch playlist videos without an API key using yt-dlp.
    Run: pip install yt-dlp
    """
    try:
        import yt_dlp
    except ImportError:
        print("Run: pip install yt-dlp")
        return []

    playlist_url = f"https://www.youtube.com/playlist?list={playlist_id}"
    ydl_opts = {
        "quiet": True,
        "extract_flat": True,   # Don't download, just get metadata
        "skip_download": True,
    }

    videos = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(playlist_url, download=False)
        for i, entry in enumerate(info.get("entries", []), 1):
            if entry:
                videos.append({
                    "position": i,
                    "video_id": entry.get("id", ""),
                    "title": entry.get("title", ""),
                    "description": entry.get("description", "")[:200] if entry.get("description") else "",
                    "url": f"https://www.youtube.com/watch?v={entry.get('id', '')}"
                })

    return videos


# ─────────────────────────────────────────────
# AUTO-MATCH videos to lesson IDs
# ─────────────────────────────────────────────

def auto_match_lessons(videos: list[dict]) -> dict:
    """
    Try to match video titles to lesson IDs using keywords.
    Returns: { lesson_id: video_info }
    """
    matched = {}
    unmatched = []

    for video in videos:
        title_lower = video["title"].lower()
        found = False
        for lesson_id, keywords in LESSON_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in title_lower:
                    matched[lesson_id] = video
                    found = True
                    break
            if found:
                break
        if not found:
            unmatched.append(video)

    return matched, unmatched


# ─────────────────────────────────────────────
# DISPLAY & SAVE RESULTS
# ─────────────────────────────────────────────

def display_videos(videos: list[dict], label: str):
    print(f"\n{'='*60}")
    print(f"Playlist: {label}")
    print(f"Total videos found: {len(videos)}")
    print(f"{'='*60}")
    for v in videos:
        print(f"  [{v['position']:2d}] {v['video_id']}  |  {v['title']}")
    print()


def display_matches(matched: dict, unmatched: list):
    print("\n--- AUTO-MATCHED LESSONS ---")
    for lesson_id, video in matched.items():
        print(f"  {lesson_id:15s} -> [{video['video_id']}] {video['title']}")

    if unmatched:
        print(f"\n--- UNMATCHED VIDEOS ({len(unmatched)}) ---")
        print("These videos didn't match any lesson. Review manually:")
        for v in unmatched:
            print(f"  [{v['position']:2d}] {v['video_id']}  |  {v['title']}")


def save_video_map(matched: dict, class_label: str):
    """Save the video ID map so lesson JSON files can be updated."""
    output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, f"video_map_{class_label}.json")

    video_map = {
        lesson_id: {
            "youtube_id": v["video_id"],
            "title_from_playlist": v["title"],
            "url": v["url"]
        }
        for lesson_id, v in matched.items()
    }

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(video_map, f, ensure_ascii=False, indent=2)

    print(f"\n>>> Saved video map to: {filepath}")
    return filepath


def update_lesson_json(video_map_file: str, lesson_json_file: str):
    """Patch the lesson JSON file with real YouTube IDs from the video map."""
    with open(video_map_file, encoding="utf-8") as f:
        video_map = json.load(f)

    with open(lesson_json_file, encoding="utf-8") as f:
        lessons = json.load(f)

    updated = 0
    for lesson in lessons["lessons"]:
        lesson_id = lesson["id"]
        if lesson_id in video_map:
            lesson["youtube_id"] = video_map[lesson_id]["youtube_id"]
            lesson["kalvitv_title"] = video_map[lesson_id]["title_from_playlist"]
            updated += 1

    with open(lesson_json_file, "w", encoding="utf-8") as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)

    print(f"Updated {updated} lessons in {lesson_json_file}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Fetch KalviTV playlist videos")
    parser.add_argument("--no-api", action="store_true",
                        help="Use yt-dlp instead of YouTube API (no API key needed)")
    args = parser.parse_args()

    use_api = not args.no_api
    fetch_fn = fetch_playlist_via_api if use_api else fetch_playlist_no_api
    method = "YouTube Data API" if use_api else "yt-dlp (no API key)"
    print(f"Method: {method}\n")

    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")

    for key, config in PLAYLISTS.items():
        pid = config["playlist_id"]
        if "PASTE" in pid:
            print(f"[SKIP] {config['label']} — playlist ID not set yet.")
            print(f"       Open backend/utils/playlist_fetcher.py and paste the ID.\n")
            continue

        print(f"Fetching: {config['label']} ...")
        videos = fetch_fn(pid)

        if not videos:
            print(f"No videos found for {key}. Check playlist ID or internet connection.\n")
            continue

        display_videos(videos, config["label"])
        matched, unmatched = auto_match_lessons(videos)
        display_matches(matched, unmatched)

        map_file = save_video_map(matched, key)

        # Auto-update the lesson JSON
        lesson_file = os.path.join(data_dir, f"class{config['class']}_lessons.json")
        if os.path.exists(lesson_file):
            update_lesson_json(map_file, lesson_file)

    print("\nDone. Review the matches above and manually fix any unmatched lessons.")
    print("Then run: python backend/ai/tutor_test.py")


if __name__ == "__main__":
    main()
