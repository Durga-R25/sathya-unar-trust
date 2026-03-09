import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import './VideoFeed.css';

/**
 * VideoFeed Component
 * Implements TikTok-style vertical swipe navigation
 * Handles video preloading and smooth transitions
 */
const VideoFeed = ({ videos, currentUser, onEvaluate, onViewEvaluations, evaluations, initialVideoId, paused }) => {
  // Find initial video index if initialVideoId is provided
  const getInitialIndex = () => {
    if (initialVideoId) {
      const index = videos.findIndex(v => v.videoId === initialVideoId);
      return index >= 0 ? index : 0;
    }
    return 0;
  };

  const [currentIndex, setCurrentIndex] = useState(getInitialIndex());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const touchHasMoved = useRef(false);

  // Update current index when initialVideoId changes
  useEffect(() => {
    if (initialVideoId) {
      const index = videos.findIndex(v => v.videoId === initialVideoId);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  }, [initialVideoId, videos]);

  // Preload next videos
  useEffect(() => {
    const preloadNextVideos = () => {
      // Preload next 2 videos
      for (let i = 1; i <= 2; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < videos.length) {
          const video = document.createElement('video');
          video.src = videos[nextIndex].fileUrl;
          video.preload = 'auto';
        }
      }
    };

    preloadNextVideos();
  }, [currentIndex, videos]);

  const goToNext = () => {
    if (isTransitioning) return;
    if (currentIndex < videos.length - 1) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const goToPrevious = () => {
    if (isTransitioning) return;
    if (currentIndex > 0) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Native touch handlers — primary swipe detection
  // Key fix: initialize touchEndY = touchStartY so a tap (no touchmove) gives distance=0
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY; // same as start → tap gives distance 0
    touchHasMoved.current = false;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
    touchHasMoved.current = true;
  };

  const handleTouchEnd = () => {
    if (!touchHasMoved.current) return; // pure tap — ignore

    const swipeDistance = touchStartY.current - touchEndY.current;
    if (Math.abs(swipeDistance) > 60) {
      if (swipeDistance > 0) goToNext();
      else goToPrevious();
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
    touchHasMoved.current = false;
  };

  // Handle video end - auto-advance to next
  const handleVideoEnd = () => {
    goToNext();
  };

  // Keyboard navigation (for desktop testing)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isTransitioning]);

      return (
      <div
        className="video-feed"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="video-container"
          style={{
            transform: `translateY(-${currentIndex * 100}vh)`,
            transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
          }}
        >
          {videos.map((video, index) => {
            return (
              <div key={video.videoId} className="video-slide">
                <VideoPlayer
                  video={video}
                  isActive={index === currentIndex && !paused}
                  onVideoEnd={handleVideoEnd}
                  onEvaluate={() => onEvaluate(video)}
                  onViewEvaluations={() => onViewEvaluations(video)}
                  evaluationsCount={video.totalEvaluations || 0}
                  currentUser={currentUser}
                />
              </div>
            );
          })}
        </div>


        {/* Video Counter */}
        <div className="video-counter">
          {currentIndex + 1} / {videos.length}
        </div>

        {/* Swipe Indicators */}
        {currentIndex < videos.length - 1 && (
          <div className="swipe-indicator swipe-up">
            <span className="arrow">↑</span>
            <span className="text">Swipe up</span>
          </div>
        )}

        {currentIndex > 0 && (
          <div className="swipe-indicator swipe-down">
            <span className="arrow">↓</span>
            <span className="text">Swipe down</span>
          </div>
        )}
      </div>
    );
  };

  export default VideoFeed;
