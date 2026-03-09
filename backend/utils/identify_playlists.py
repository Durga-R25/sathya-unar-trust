"""
Quick script to identify which playlist belongs to which class.
Fetches only the FIRST video title from each playlist — fast, no full scan.

Usage:
    pip install yt-dlp
    python backend/utils/identify_playlists.py
"""

import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PLAYLISTS = {
    # Class 8
    "C8 Tamil T1":      "PL-mvKYotpGsL70WJ27Uu0zLtxbv_2cJ54",
    "C8 Tamil T2":      "PL-mvKYotpGsIky5YS1Jcu2uF7n9nJbISd",
    "C8 Maths T1":      "PL-mvKYotpGsLi8wEXrwoRgmeSMUaQghtf",
    "C8 Maths T2":      "PL-mvKYotpGsJc8zh8S6m4hgdZOQGjJ3Fx",
    "C8 Science T1":    "PL-mvKYotpGsIA9elKaBiSAW-TZZrSVreU",
    "C8 Science T2":    "PL-mvKYotpGsJhVR7QXkvO-zAeTwYphtXC",
    "C8 Social T1":     "PL-mvKYotpGsLpISmgBaPw6_iNaHZASuNn",
    "C8 Social T2":     "PL-mvKYotpGsKgGbkq4SMz8eZGuWgVeUOM",
    "C8 English T1":    "PL-mvKYotpGsLRdVKirMOzcPZdUtlXjS6P",
    "C8 Bridge":        "PL-mvKYotpGsLQ_ZkuhMMVwv-M6zXlpycE",
    # Class 9
    "C9 Tamil T1":      "PL-mvKYotpGsIqNXh3FlkU2TEhHLDnkI7G",
    "C9 Tamil T2":      "PL-mvKYotpGsKgZR-XqgavV4jxg9ep9_jm",
    "C9 Maths T1":      "PL-mvKYotpGsJ0s5EtWs5K6SSH13-hBEjl",
    "C9 Maths T2":      "PL-mvKYotpGsLn-FBb1X0gHhF7hfBB4Cl5",
    "C9 Science T1":    "PL-mvKYotpGsKZlFqVLeeQK2KJ7ksDArFa",
    "C9 Science T2":    "PL-mvKYotpGsKDafYDTeIyTSQyOtWmKxQL",
    "C9 Social T1":     "PL-mvKYotpGsKLMDUNSgmb1-99_pbFIgz-",
    "C9 Social T2":     "PL-mvKYotpGsKwkTCV7fGgQDoypFD2gpIl",
    "C9 English T1":    "PL-mvKYotpGsIemhKEJZ_e-DbOMDCYGC6u",
    "C9 Bridge":        "PL-mvKYotpGsLY2cDzrz-HT8U6NoFQVyol",
}


def get_first_video(playlist_id: str) -> dict:
    try:
        import yt_dlp
    except ImportError:
        print("Run: pip install yt-dlp")
        sys.exit(1)

    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    ydl_opts = {
        "quiet": True,
        "extract_flat": True,
        "playlist_items": "1",       # Only fetch first video
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        entries = info.get("entries", [])
        if entries and entries[0]:
            e = entries[0]
            return {
                "title": e.get("title", "N/A"),
                "video_id": e.get("id", "N/A"),
                "total_videos": info.get("playlist_count", "?"),
                "playlist_title": info.get("title", "N/A"),
            }
    return {}


def main():
    print("=" * 70)
    print("Playlist Identifier — First video title reveals class & subject")
    print("=" * 70)

    results = []
    for label, pid in PLAYLISTS.items():
        print(f"Checking {label}...", end=" ", flush=True)
        info = get_first_video(pid)
        if info:
            print(f"OK ({info['total_videos']} videos)")
            results.append({
                "label": label,
                "playlist_id": pid,
                "playlist_title": info["playlist_title"],
                "first_video": info["title"],
                "total_videos": info["total_videos"],
            })
        else:
            print("FAILED")

    print("\n" + "=" * 70)
    print(f"{'Label':<15} {'Total':>6}  {'Playlist Title / First Video'}")
    print("=" * 70)
    for r in results:
        print(f"{r['label']:<15} {str(r['total_videos']):>6}  {r['playlist_title']}")
        print(f"{'':15} {'':>6}  First: {r['first_video']}")
        print()

    # Save to file for reference
    import json, os
    out = os.path.join(os.path.dirname(__file__), "../../data/playlist_map.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f">>> Saved to data/playlist_map.json")
    print(">>> Now update class8_lessons.json and class9_lessons.json with correct playlist_id")


if __name__ == "__main__":
    main()
