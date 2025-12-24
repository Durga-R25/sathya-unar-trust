import React from 'react';
import './Leaderboard.css';

const Leaderboard = ({ title, data, type }) => {
  if (!data || data.length === 0) {
    return (
      <div className="leaderboard-empty">
        <p>No data available yet</p>
      </div>
    );
  }

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">{title}</h3>

      <div className="leaderboard-list">
        {data.map((item, index) => (
          <div key={index} className={`leaderboard-item rank-${index + 1}`}>
            <div className="rank-badge">
              <span className="rank-number">{getMedalIcon(index + 1)}</span>
            </div>

            <div className="item-content">
              <h4 className="item-name">
                {type === 'school' ? item.schoolName : item.category}
              </h4>

              {type === 'school' && (
                <p className="item-subtitle">{item.district}</p>
              )}

              <div className="item-stats">
                <span className="stat">
                  <span className="stat-label">Score:</span>
                  <span className="stat-value">⭐ {item.averageScore.toFixed(2)}</span>
                </span>
                <span className="stat">
                  <span className="stat-label">Videos:</span>
                  <span className="stat-value">{item.videoCount}</span>
                </span>
                <span className="stat">
                  <span className="stat-label">Evaluations:</span>
                  <span className="stat-value">{item.totalEvaluations}</span>
                </span>
                {type === 'school' && (
                  <span className="stat">
                    <span className="stat-label">Views:</span>
                    <span className="stat-value">{item.totalViews.toLocaleString()}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="score-display">
              <div className="score-number">{item.averageScore.toFixed(1)}</div>
              <div className="score-label">Score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
