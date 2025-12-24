import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import VideoPlayer from './VideoPlayer';
import { getEvaluationsForVideo } from '../data/mockEvaluations';
import './VideoFeed.css';

/**
 * VideoFeed Component
 * Implements TikTok-style vertical swipe navigation
 * Handles video preloading and smooth transitions
 */
const VideoFeed = ({ videos, onEvaluate, onViewEvaluations, evaluations, initialVideoId }) => {
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

  const handlers = useSwipeable({
    onSwipedUp: (eventData) => {
      console.log('Swiped up');
      goToNext();
    },
    onSwipedDown: (eventData) => {
      console.log('Swiped down');
      goToPrevious();
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    delta: 30,
    swipeDuration: 1000
  });

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

  // Native touch event handlers for better mobile support
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // Minimum swipe distance in pixels

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped up - go to next video
        goToNext();
      } else {
        // Swiped down - go to previous video
        goToPrevious();
      }
    }

    // Reset values
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

      return (
      <div
        className="video-feed"
        {...handlers}
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
            const videoEvaluations = getEvaluationsForVideo(video.videoId);
            return (
              <div key={video.videoId} className="video-slide">
                <VideoPlayer
                  video={video}
                  isActive={index === currentIndex}
                  onVideoEnd={handleVideoEnd}
                  onEvaluate={() => onEvaluate(video)}
                  onViewEvaluations={() => onViewEvaluations(video)}
                  evaluationsCount={videoEvaluations.length}
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
