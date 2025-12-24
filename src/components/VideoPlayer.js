import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';
import VideoInfo from './VideoInfo';
import ScoreDisplay from './ScoreDisplay';

/**
 * VideoPlayer Component
 * Displays a single video with controls, metadata, and evaluation scores
 * Auto-plays when visible, pauses when swiped away
 */
const VideoPlayer = ({ video, isActive, onVideoEnd, onEvaluate, onViewEvaluations, evaluationsCount = 0 }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Auto-play/pause based on visibility
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log('Autoplay prevented:', err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onVideoEnd) onVideoEnd();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onVideoEnd]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views;
  };

  return (
    <div className="video-player">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="video-element"
        src={video.fileUrl}
        playsInline
        loop
        preload="auto"
        onClick={togglePlayPause}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="play-overlay" onClick={togglePlayPause}>
          <div className="play-button">▶</div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Right Side Actions */}
      <div className="video-actions">
        {/* Evaluate Button */}
        <button
          className="action-button evaluate-button"
          onClick={onEvaluate}
          title="Evaluate this video"
        >
          <span className="icon evaluate-icon">⭐</span>
          <span className="action-label">Rate</span>
        </button>

        {/* Aggregate Score */}
        <button
          className="action-button score-button"
          onClick={() => setShowInfo(!showInfo)}
        >
          <div className="score-circle">
            <span className="score-value">{video.aggregateScore.toFixed(1)}</span>
          </div>
          <span className="action-label">Score</span>
        </button>

        {/* Scientific Clarity */}
        <button className="action-button">
          <span className="icon">🔬</span>
          <span className="action-label">{video.scientificClarity.toFixed(1)}</span>
        </button>

        {/* Humanity & Care */}
        <button className="action-button">
          <span className="icon">❤️</span>
          <span className="action-label">{video.humanityCare.toFixed(1)}</span>
        </button>

        {/* Real-Life Impact */}
        <button className="action-button">
          <span className="icon">🌍</span>
          <span className="action-label">{video.realLifeImpact.toFixed(1)}</span>
        </button>

        {/* Original Thinking */}
        <button className="action-button">
          <span className="icon">💡</span>
          <span className="action-label">{video.originalThinking.toFixed(1)}</span>
        </button>

        {/* View All Evaluations */}
        <button
          className="action-button"
          onClick={onViewEvaluations}
          title="View all evaluations"
        >
          <span className="icon">👥</span>
          <span className="action-label">{evaluationsCount}</span>
        </button>

        {/* Views */}
        <button className="action-button">
          <span className="icon">👁️</span>
          <span className="action-label">{formatViews(video.views)}</span>
        </button>
      </div>

      {/* Bottom Video Info */}
      <div className="video-bottom">
        {/* Category Badge */}
        <div className="category-badge">{video.category}</div>

        {/* Video Metadata */}
        <div className="video-meta">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-description">
            {video.description.length > 100
              ? `${video.description.substring(0, 100)}...`
              : video.description}
          </p>
          <div className="uploader-info">
            <span className="uploader-name">👤 {video.uploaderName}</span>
            <span className="uploader-school">🏫 {video.schoolName}</span>
          </div>
          <div className="video-tags">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <button className="volume-button" onClick={toggleMute}>
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Detailed Info Modal */}
      {showInfo && (
        <div className="info-modal" onClick={() => setShowInfo(false)}>
          <div className="info-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowInfo(false)}>✕</button>
            <VideoInfo video={video} />
            <ScoreDisplay video={video} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
