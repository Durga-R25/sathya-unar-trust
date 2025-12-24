import React from 'react';
import './ScoreDisplay.css';

/**
 * ScoreDisplay Component
 * Shows detailed evaluation breakdown with weighted scoring
 */
const ScoreDisplay = ({ video }) => {
  const dimensions = [
    {
      name: 'Scientific Clarity',
      icon: '🔬',
      score: video.scientificClarity,
      description: 'How well the science is explained'
    },
    {
      name: 'Humanity & Care',
      icon: '❤️',
      score: video.humanityCare,
      description: 'Social impact and community benefit'
    },
    {
      name: 'Real-Life Impact',
      icon: '🌍',
      score: video.realLifeImpact,
      description: 'Practical applications and usefulness'
    },
    {
      name: 'Original Thinking',
      icon: '💡',
      score: video.originalThinking,
      description: 'Innovation and creative approach'
    }
  ];

  const renderStars = (score) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="stars">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star full">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="score-display">
      <div className="aggregate-section">
        <h3 className="section-title">Overall Score</h3>
        <div className="aggregate-score">
          <div className="score-circle-large">
            <span className="score-number">{video.aggregateScore.toFixed(2)}</span>
            <span className="score-max">/ 5.00</span>
          </div>
          <div className="score-legend">
            <div className="legend-item">
              <span className="legend-dot judge"></span>
              <span className="legend-text">Judge (70%): {video.judgeEvaluations} reviews</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot teacher"></span>
              <span className="legend-text">Teacher (20%): {video.teacherEvaluations} reviews</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot student"></span>
              <span className="legend-text">Student (10%): {video.studentEvaluations} reviews</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dimensions-section">
        <h3 className="section-title">Evaluation Dimensions</h3>
        {dimensions.map((dimension, index) => (
          <div key={index} className="dimension-card">
            <div className="dimension-header">
              <span className="dimension-icon">{dimension.icon}</span>
              <div className="dimension-info">
                <h4 className="dimension-name">{dimension.name}</h4>
                <p className="dimension-description">{dimension.description}</p>
              </div>
            </div>
            <div className="dimension-score">
              {renderStars(dimension.score)}
              <span className="score-text">{dimension.score.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="evaluation-stats">
        <h3 className="section-title">Evaluation Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{video.totalEvaluations}</span>
            <span className="stat-label">Total Reviews</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{video.views.toLocaleString()}</span>
            <span className="stat-label">Views</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{((video.totalEvaluations / video.views) * 100).toFixed(1)}%</span>
            <span className="stat-label">Engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
