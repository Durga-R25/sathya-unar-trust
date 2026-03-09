"""
YouTube video/playlist player component.
Falls back to full playlist embed when individual video ID is not yet set.
"""

import streamlit as st


def render_video(youtube_id: str, title: str,
                 duration_min: int = 15, playlist_id: str = ""):
    """
    Embed a YouTube video.
    - If youtube_id is set → embed individual video
    - Else if playlist_id is set → embed full playlist
    - Else → show placeholder
    """
    youtube_id = (youtube_id or "").strip()
    playlist_id = (playlist_id or "").strip()

    if youtube_id:
        _embed_video(youtube_id, title, duration_min)
    elif playlist_id:
        _embed_playlist(playlist_id, title)
    else:
        _render_placeholder(title, duration_min)


def _embed_video(video_id: str, title: str, duration_min: int):
    embed_url = (
        f"https://www.youtube.com/embed/{video_id}"
        f"?rel=0&modestbranding=1&cc_load_policy=1"
    )
    st.markdown(f"""
    <div style='position:relative;padding-bottom:56.25%;height:0;overflow:hidden;
                border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.15);'>
        <iframe src="{embed_url}"
                style='position:absolute;top:0;left:0;width:100%;height:100%;border:0;'
                allow="accelerometer; autoplay; clipboard-write; encrypted-media;
                       gyroscope; picture-in-picture"
                allowfullscreen>
        </iframe>
    </div>
    <p style='text-align:center;color:#666;font-size:13px;margin-top:8px;'>
        📺 {title} &nbsp;|&nbsp; ⏱ சுமார் {duration_min} நிமிடங்கள்
    </p>
    """, unsafe_allow_html=True)


def _embed_playlist(playlist_id: str, title: str):
    embed_url = (
        f"https://www.youtube.com/embed/videoseries?list={playlist_id}"
        f"&rel=0&modestbranding=1"
    )
    st.markdown(f"""
    <div style='position:relative;padding-bottom:56.25%;height:0;overflow:hidden;
                border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.15);'>
        <iframe src="{embed_url}"
                style='position:absolute;top:0;left:0;width:100%;height:100%;border:0;'
                allow="accelerometer; autoplay; clipboard-write; encrypted-media;
                       gyroscope; picture-in-picture"
                allowfullscreen>
        </iframe>
    </div>
    <p style='text-align:center;color:#666;font-size:13px;margin-top:8px;'>
        📺 {title} &nbsp;|&nbsp; 🎬 KalviTV Playlist
    </p>
    """, unsafe_allow_html=True)


def _render_placeholder(title: str, duration_min: int):
    st.markdown(f"""
    <div style='background:#F0F4F8;border:2px dashed #BDC3C7;border-radius:12px;
                padding:40px;text-align:center;'>
        <div style='font-size:48px;'>🎬</div>
        <div style='font-size:18px;color:#2C3E50;margin-top:8px;
                    font-family:"Noto Sans Tamil",sans-serif;'>{title}</div>
        <div style='color:#E74C3C;margin-top:12px;font-size:14px;'>
            Playlist ID இன்னும் சேர்க்கப்படவில்லை
        </div>
    </div>
    """, unsafe_allow_html=True)
