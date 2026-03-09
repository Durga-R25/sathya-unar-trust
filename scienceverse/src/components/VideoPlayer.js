import React, { useRef, useEffect, useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import './VideoPlayer.css';
import VideoInfo from './VideoInfo';
import ScoreDisplay from './ScoreDisplay';

/**
 * VideoPlayer Component
 * Displays a single video with controls, metadata, and evaluation scores
 * Auto-plays when visible, pauses when swiped away
 */
const VideoPlayer = ({ video, currentUser, isActive, onVideoEnd, onEvaluate, onViewEvaluations, evaluationsCount = 0 }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const viewCounted = useRef(false); // ensure we count at most once per mount

  // Auto-play/pause based on visibility; increment view count when video becomes active
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log('Autoplay prevented:', err));

      // Count one view per mount — not on every swipe back to this video
      if (video.id && !viewCounted.current) {
        viewCounted.current = true;
        updateDoc(doc(db, 'videos', video.id), { views: increment(1) })
          .catch(err => console.log('View count update failed:', err));
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    // Cleanup: pause video when component unmounts
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
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
    const count = views || 0;
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
  };

  const handleLike = () => {
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount(prev => nowLiked ? prev + 1 : Math.max(0, prev - 1));
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(30,41,59,0.95);color:white;padding:12px 20px;border-radius:24px;font-size:14px;font-weight:500;z-index:9999;backdrop-filter:blur(8px);box-shadow:0 4px 12px rgba(0,0,0,0.3);white-space:nowrap;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      try {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
      } catch (err) {
        showToast('Share: ' + video.title);
      }
    }
  };

  const showDimensionInfo = (dimension, score, description) => {
    showToast(`${dimension}: ${score.toFixed(1)}/5.0 — ${description}`);
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
        {currentUser && (
          <button
            className="action-button evaluate-button"
            onClick={onEvaluate}
            title={currentUser.role === 'judge' ? 'Judge this video' : 'Evaluate this video'}
            style={{
              background: currentUser.role === 'judge' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : undefined
            }}
          >
            <span className="icon evaluate-icon">⭐</span>
            <span className="action-label">{currentUser.role === 'judge' ? 'Judge' : 'Rate'}</span>
          </button>
        )}

        {/* Aggregate Score */}
        <button
          className="action-button score-button"
          onClick={() => setShowInfo(!showInfo)}
        >
          <div className="score-circle">
            <span className="score-value">{(video.aggregateScore || 0).toFixed(1)}</span>
          </div>
          <span className="action-label">Score</span>
        </button>

        {/* Scientific Clarity — score only */}
        <button
          className="action-button"
          onClick={() => showDimensionInfo('Scientific Clarity', video.scientificClarity || 0, 'How well is the science explained? Clear concepts, accurate information, and logical flow.')}
          title="Scientific Clarity score"
        >
          <span className="icon">🔬</span>
          <span className="action-label">{(video.scientificClarity || 0).toFixed(1)}</span>
        </button>

        {/* Humanity & Care — score only */}
        <button
          className="action-button"
          onClick={() => showDimensionInfo('Humanity & Care', video.humanityCare || 0, 'Social impact and community benefit. Empathy, solving real problems.')}
          title="Humanity & Care score"
        >
          <span className="icon">❤️</span>
          <span className="action-label">{(video.humanityCare || 0).toFixed(1)}</span>
        </button>

        {/* Real-Life Impact — score only */}
        <button
          className="action-button"
          onClick={() => showDimensionInfo('Real-Life Impact', video.realLifeImpact || 0, 'How practical and useful is it? Applicability, feasibility, sustainability.')}
          title="Real-Life Impact score"
        >
          <span className="icon">🌍</span>
          <span className="action-label">{(video.realLifeImpact || 0).toFixed(1)}</span>
        </button>

        {/* Original Thinking — score only */}
        <button
          className="action-button"
          onClick={() => showDimensionInfo('Original Thinking', video.originalThinking || 0, 'How innovative is the approach? Creativity, uniqueness, and novel solutions.')}
          title="Original Thinking score"
        >
          <span className="icon">💡</span>
          <span className="action-label">{(video.originalThinking || 0).toFixed(1)}</span>
        </button>

        {/* Like — after all score dimensions */}
        <button
          className="action-button"
          onClick={handleLike}
          title={isLiked ? 'Unlike this video' : 'Like this video'}
        >
          <span className="icon">{isLiked ? '👍' : '👍'}</span>
          <span className="action-label" style={{ color: isLiked ? '#ef4444' : undefined }}>
            {likeCount}
          </span>
        </button>

        {/* Share — after all score dimensions */}
        <button
          className="action-button"
          onClick={handleShare}
          title="Share this video"
        >
          <span className="icon">📤</span>
          <span className="action-label">Share</span>
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
        <button className="action-button" title="View count">
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
