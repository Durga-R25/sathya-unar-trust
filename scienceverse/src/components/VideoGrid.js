import React from 'react';
import './VideoGrid.css';

const VideoGrid = ({ videos, onVideoSelect, title, subtitle, emptyMessage }) => {
  if (videos.length === 0) {
    return (
      <div className="video-grid-empty">
        <span className="empty-icon">📭</span>
        <p className="empty-message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="video-grid-container">
      {title && (
        <div className="video-grid-header">
          <h3 className="grid-title">{title}</h3>
          {subtitle && <p className="grid-subtitle">{subtitle}</p>}
        </div>
      )}

      <div className="video-grid">
        {videos.map(video => (
          <div
            key={video.videoId}
            className="video-card"
            onClick={() => onVideoSelect(video)}
          >
            <div className="video-thumbnail">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="thumbnail-image"
                  onError={(e) => {
                    // If thumbnail fails to load, show placeholder
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="thumbnail-placeholder"
                style={{
                  display: video.thumbnailUrl ? 'none' : 'flex',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}
              >
                🎬
              </div>
              <div className="video-duration">
                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
              </div>
              <div className="video-score-badge">
                ⭐ {video.aggregateScore.toFixed(1)}
              </div>
            </div>

            <div className="video-card-content">
              <h4 className="video-card-title">{video.title}</h4>

              <div className="video-card-meta">
                <span className="meta-item">👤 {video.uploaderName}</span>
                <span className="meta-item">🏫 {video.schoolName}</span>
              </div>

              <div className="video-card-stats">
                <span className="stat-item">
                  <span className="stat-icon">🔬</span>
                  {video.scientificClarity.toFixed(1)}
                </span>
                <span className="stat-item">
                  <span className="stat-icon">❤️</span>
                  {video.humanityCare.toFixed(1)}
                </span>
                <span className="stat-item">
                  <span className="stat-icon">🌍</span>
                  {video.realLifeImpact.toFixed(1)}
                </span>
                <span className="stat-item">
                  <span className="stat-icon">💡</span>
                  {video.originalThinking.toFixed(1)}
                </span>
              </div>

              <div className="video-card-footer">
                <span className="category-tag">{video.category}</span>
                <span className="views-count">👁️ {video.views}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
