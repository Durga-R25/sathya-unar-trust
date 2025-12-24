import React from 'react';
import './VideoInfo.css';

/**
 * VideoInfo Component
 * Displays detailed video metadata
 */
const VideoInfo = ({ video }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-info">
      <h2 className="info-title">{video.title}</h2>

      <div className="info-section">
        <h3 className="section-title">Description</h3>
        <p className="description-text">{video.description}</p>
      </div>

      <div className="info-section">
        <h3 className="section-title">Student Details</h3>
        <div className="info-row">
          <span className="info-label">Name:</span>
          <span className="info-value">{video.uploaderName}</span>
        </div>
        <div className="info-row">
          <span className="info-label">School:</span>
          <span className="info-value">{video.schoolName}</span>
        </div>
        <div className="info-row">
          <span className="info-label">District:</span>
          <span className="info-value">{video.district}</span>
        </div>
      </div>

      <div className="info-section">
        <h3 className="section-title">Video Details</h3>
        <div className="info-row">
          <span className="info-label">Category:</span>
          <span className="info-value category-tag">{video.category}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Duration:</span>
          <span className="info-value">{formatDuration(video.duration)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Uploaded:</span>
          <span className="info-value">{formatDate(video.uploadedAt)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Views:</span>
          <span className="info-value">{video.views.toLocaleString()}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Voice-over:</span>
          <span className="info-value">{video.hasVoiceover ? '✓ Yes' : '✗ No'}</span>
        </div>
      </div>

      <div className="info-section">
        <h3 className="section-title">Tags</h3>
        <div className="tags-container">
          {video.tags.map((tag, index) => (
            <span key={index} className="info-tag">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoInfo;
