import React from 'react';
import './EvaluationHistory.css';

/**
 * EvaluationHistory Component
 * Displays transparent list of all evaluations with evaluator details
 * Shows who evaluated, their role, and individual dimension scores
 */
const EvaluationHistory = ({ evaluations, onClose }) => {
  const getRoleColor = (role) => {
    const colors = {
      judge: '#f59e0b',
      teacher: '#10b981',
      student: '#3b82f6'
    };
    return colors[role] || colors.student;
  };

  const getRoleLabel = (role) => {
    const labels = {
      judge: 'Judge',
      teacher: 'Teacher',
      student: 'Student'
    };
    return labels[role] || 'Student';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const renderStars = (score) => {
    const fullStars = Math.floor(score);
    const emptyStars = 5 - fullStars;

    return (
      <span className="mini-stars">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="mini-star filled">★</span>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="mini-star empty">★</span>
        ))}
      </span>
    );
  };

  // Sort evaluations: judges first, then teachers, then students
  const sortedEvaluations = [...evaluations].sort((a, b) => {
    const roleOrder = { judge: 0, teacher: 1, student: 2 };
    return roleOrder[a.evaluatorRole] - roleOrder[b.evaluatorRole];
  });

  // Group by role
  const groupedEvaluations = {
    judge: sortedEvaluations.filter(e => e.evaluatorRole === 'judge'),
    teacher: sortedEvaluations.filter(e => e.evaluatorRole === 'teacher'),
    student: sortedEvaluations.filter(e => e.evaluatorRole === 'student')
  };

  return (
    <div className="evaluation-history-overlay" onClick={onClose}>
      <div className="evaluation-history" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <div>
            <h2 className="history-title">All Evaluations</h2>
            <p className="history-subtitle">
              {evaluations.length} total • Transparent & Public
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-content">
          {/* Judges Section */}
          {groupedEvaluations.judge.length > 0 && (
            <div className="role-section">
              <div className="role-section-header" style={{ backgroundColor: getRoleColor('judge') }}>
                <span className="role-section-title">
                  Judges ({groupedEvaluations.judge.length})
                </span>
                <span className="role-section-weight">70% weight</span>
              </div>
              <div className="evaluations-list">
                {groupedEvaluations.judge.map((evaluation) => (
                  <EvaluationCard
                    key={evaluation.evaluationId}
                    evaluation={evaluation}
                    roleColor={getRoleColor('judge')}
                    formatDate={formatDate}
                    renderStars={renderStars}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Teachers Section */}
          {groupedEvaluations.teacher.length > 0 && (
            <div className="role-section">
              <div className="role-section-header" style={{ backgroundColor: getRoleColor('teacher') }}>
                <span className="role-section-title">
                  Teachers ({groupedEvaluations.teacher.length})
                </span>
                <span className="role-section-weight">20% weight</span>
              </div>
              <div className="evaluations-list">
                {groupedEvaluations.teacher.map((evaluation) => (
                  <EvaluationCard
                    key={evaluation.evaluationId}
                    evaluation={evaluation}
                    roleColor={getRoleColor('teacher')}
                    formatDate={formatDate}
                    renderStars={renderStars}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Students Section */}
          {groupedEvaluations.student.length > 0 && (
            <div className="role-section">
              <div className="role-section-header" style={{ backgroundColor: getRoleColor('student') }}>
                <span className="role-section-title">
                  Students ({groupedEvaluations.student.length})
                </span>
                <span className="role-section-weight">10% weight</span>
              </div>
              <div className="evaluations-list">
                {groupedEvaluations.student.map((evaluation) => (
                  <EvaluationCard
                    key={evaluation.evaluationId}
                    evaluation={evaluation}
                    roleColor={getRoleColor('student')}
                    formatDate={formatDate}
                    renderStars={renderStars}
                  />
                ))}
              </div>
            </div>
          )}

          {evaluations.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <p className="empty-text">No evaluations yet</p>
              <p className="empty-subtext">Be the first to evaluate this video!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EvaluationCard = ({ evaluation, roleColor, formatDate, renderStars }) => {
  return (
    <div className="evaluation-card">
      <div className="evaluation-header">
        <div className="evaluator-info">
          <div className="evaluator-avatar" style={{ backgroundColor: roleColor }}>
            {evaluation.evaluatorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="evaluator-name">{evaluation.evaluatorName}</div>
            <div className="evaluator-school">{evaluation.evaluatorSchool}</div>
          </div>
        </div>
        <div className="evaluation-time">{formatDate(evaluation.evaluatedAt)}</div>
      </div>

      <div className="evaluation-scores">
        <div className="score-row">
          <span className="score-icon">🔬</span>
          <span className="score-label">Scientific Clarity</span>
          {renderStars(evaluation.scientificClarity)}
          <span className="score-value">{evaluation.scientificClarity.toFixed(1)}</span>
        </div>
        <div className="score-row">
          <span className="score-icon">❤️</span>
          <span className="score-label">Humanity & Care</span>
          {renderStars(evaluation.humanityCare)}
          <span className="score-value">{evaluation.humanityCare.toFixed(1)}</span>
        </div>
        <div className="score-row">
          <span className="score-icon">🌍</span>
          <span className="score-label">Real-Life Impact</span>
          {renderStars(evaluation.realLifeImpact)}
          <span className="score-value">{evaluation.realLifeImpact.toFixed(1)}</span>
        </div>
        <div className="score-row">
          <span className="score-icon">💡</span>
          <span className="score-label">Original Thinking</span>
          {renderStars(evaluation.originalThinking)}
          <span className="score-value">{evaluation.originalThinking.toFixed(1)}</span>
        </div>
      </div>

      {evaluation.comment && (
        <div className="evaluation-comment">
          <p className="comment-text">"{evaluation.comment}"</p>
        </div>
      )}

      <div className="evaluation-footer">
        <span className="average-badge">
          Avg: {evaluation.averageRating.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default EvaluationHistory;
