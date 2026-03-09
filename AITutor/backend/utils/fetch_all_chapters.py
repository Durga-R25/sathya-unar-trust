"""
Fetch all chapters (video titles + IDs) from every subject playlist.
Saves to data/all_chapters.json — commit this file to GitHub for cloud deployment.

Run once locally:
    pip install yt-dlp
    python backend/utils/fetch_all_chapters.py
"""

import os, sys, json, time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ALL_PLAYLISTS = {
    # ── CLASS 8 ───────────────────────────────────────────────────
    "8": {
        "tamil":   {"term_1": "PL-mvKYotpGsL70WJ27Uu0zLtxbv_2cJ54",
                    "term_2": "PL-mvKYotpGsIky5YS1Jcu2uF7n9nJbISd"},
        "maths":   {"term_1": "PL-mvKYotpGsLi8wEXrwoRgmeSMUaQghtf",
                    "term_2": "PL-mvKYotpGsJc8zh8S6m4hgdZOQGjJ3Fx"},
        "science": {"term_1": "PL-mvKYotpGsIA9elKaBiSAW-TZZrSVreU",
                    "term_2": "PL-mvKYotpGsJhVR7QXkvO-zAeTwYphtXC"},
        "social":  {"term_1": "PL-mvKYotpGsLpISmgBaPw6_iNaHZASuNn",
                    "term_2": "PL-mvKYotpGsKgGbkq4SMz8eZGuWgVeUOM"},
        "english": {"term_1": "PL-mvKYotpGsLRdVKirMOzcPZdUtlXjS6P"},
        "bridge":  {"term_1": "PL-mvKYotpGsLQ_ZkuhMMVwv-M6zXlpycE"},
    },
    # ── CLASS 9 ───────────────────────────────────────────────────
    "9": {
        "tamil":   {"term_1": "PL-mvKYotpGsIqNXh3FlkU2TEhHLDnkI7G",
                    "term_2": "PL-mvKYotpGsKgZR-XqgavV4jxg9ep9_jm"},
        "maths":   {"term_1": "PL-mvKYotpGsJ0s5EtWs5K6SSH13-hBEjl",
                    "term_2": "PL-mvKYotpGsLn-FBb1X0gHhF7hfBB4Cl5"},
        "science": {"term_1": "PL-mvKYotpGsKZlFqVLeeQK2KJ7ksDArFa",
                    "term_2": "PL-mvKYotpGsKDafYDTeIyTSQyOtWmKxQL"},
        "social":  {"term_1": "PL-mvKYotpGsKLMDUNSgmb1-99_pbFIgz-",
                    "term_2": "PL-mvKYotpGsKwkTCV7fGgQDoypFD2gpIl"},
        "english": {"term_1": "PL-mvKYotpGsIemhKEJZ_e-DbOMDCYGC6u"},
        "bridge":  {"term_1": "PL-mvKYotpGsLY2cDzrz-HT8U6NoFQVyol"},
    }
}


def fetch_playlist(playlist_id: str) -> list[dict]:
    try:
        import yt_dlp
    except ImportError:
        print("  Run: pip install yt-dlp")
        return []

    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    opts = {"quiet": True, "extract_flat": True, "skip_download": True}
    videos = []
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            for i, e in enumerate(info.get("entries", []), 1):
                if e and e.get("id"):
                    videos.append({
                        "position":   i,
                        "video_id":   e["id"],
                        "title":      e.get("title", f"Chapter {i}"),
                        "duration":   e.get("duration", 0),
                        "url":        f"https://www.youtube.com/watch?v={e['id']}"
                    })
    except Exception as ex:
        print(f"  ERROR: {ex}")
    return videos


def main():
    out_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "all_chapters.json")
    result = {}

    for cls, subjects in ALL_PLAYLISTS.items():
        result[cls] = {}
        for subject, terms in subjects.items():
            result[cls][subject] = {}
            for term, pid in terms.items():
                print(f"Fetching Class {cls} {subject.title()} {term} ({pid[:20]}...)...")
                videos = fetch_playlist(pid)
                result[cls][subject][term] = {
                    "playlist_id": pid,
                    "chapters":    videos,
                    "total":       len(videos)
                }
                print(f"  Got {len(videos)} chapters")
                time.sleep(1)  # polite delay

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    total = sum(
        d["total"]
        for cls in result.values()
        for d in cls.values()
        for d in d.values()
    )
    print(f"\nSaved {total} chapters to data/all_chapters.json")
    print("Now run: python backend/db/seed.py")


if __name__ == "__main__":
    main()
