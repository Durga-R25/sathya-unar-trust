import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import './EvaluationPanel.css';

/**
 * EvaluationPanel Component
 * Interactive form for evaluating videos with 4 dimensions
 * Handles submission and validation
 */
const EvaluationPanel = ({ video, currentUser, onClose, onSubmit }) => {
  const [ratings, setRatings] = useState({
    scientificClarity: 0,
    humanityCare: 0,
    realLifeImpact: 0,
    originalThinking: 0
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dimensions = [
    {
      key: 'scientificClarity',
      name: 'Scientific Clarity',
      icon: '🔬',
      description: 'How well is the science explained?',
      tip: 'Consider: Clear explanation, accurate concepts, logical flow'
    },
    {
      key: 'humanityCare',
      name: 'Humanity & Care',
      icon: '❤️',
      description: 'What is the social impact?',
      tip: 'Consider: Community benefit, empathy, solving real problems'
    },
    {
      key: 'realLifeImpact',
      name: 'Real-Life Impact',
      icon: '🌍',
      description: 'How practical and useful is it?',
      tip: 'Consider: Applicability, feasibility, sustainability'
    },
    {
      key: 'originalThinking',
      name: 'Original Thinking',
      icon: '💡',
      description: 'How innovative is the approach?',
      tip: 'Consider: Creativity, uniqueness, novel solution'
    }
  ];

  // Check if user already evaluated this video
  useEffect(() => {
    // In Phase 7, check Firebase for existing evaluation
    // For now, just mock check
    const existingEvaluation = null;
    if (existingEvaluation) {
      setRatings(existingEvaluation.ratings);
      setComment(existingEvaluation.comment || '');
    }
  }, [video.videoId, currentUser.userId]);

  const handleRatingChange = (dimension, value) => {
    setRatings(prev => ({
      ...prev,
      [dimension]: value
    }));
    setError('');
  };

  const validateRatings = () => {
    const values = Object.values(ratings);
    if (values.some(v => v === 0)) {
      return 'Please rate all four dimensions';
    }
    return null;
  };

  const calculateAverageRating = () => {
    const values = Object.values(ratings);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateRatings();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create evaluation object
      const evaluation = {
        evaluationId: `eval_${Date.now()}_${currentUser.userId}`,
        videoId: video.videoId,
        evaluatorId: currentUser.userId,
        evaluatorName: currentUser.name,
        evaluatorRole: currentUser.role,
        evaluatorSchool: currentUser.schoolName,
        scientificClarity: ratings.scientificClarity,
        humanityCare: ratings.humanityCare,
        realLifeImpact: ratings.realLifeImpact,
        originalThinking: ratings.originalThinking,
        averageRating: parseFloat(calculateAverageRating()),
        comment: comment.trim(),
        evaluatedAt: new Date().toISOString()
      };

      // In Phase 7, this will save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay

      onSubmit(evaluation);

      // Show success message
      alert('✅ Thank you! Your evaluation has been submitted successfully.');
      onClose();
    } catch (err) {
      setError('Failed to submit evaluation. Please try again.');
      console.error('Evaluation submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleInfo = (role) => {
    const roleMap = {
      judge: { weight: 70, color: '#f59e0b', label: 'Judge' },
      teacher: { weight: 20, color: '#10b981', label: 'Teacher' },
      student: { weight: 10, color: '#3b82f6', label: 'Student' }
    };
    return roleMap[role] || roleMap.student;
  };

  const roleInfo = getRoleInfo(currentUser.role);

  return (
    <div className="evaluation-panel-overlay" onClick={onClose}>
      <div className="evaluation-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="header-content">
            <h2 className="panel-title">Evaluate Video</h2>
            <p className="panel-subtitle">"{video.title}"</p>
          </div>
          <button className="close-button" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* Role Badge */}
        <div className="role-badge" style={{ backgroundColor: roleInfo.color }}>
          <span className="role-label">
            Evaluating as {roleInfo.label}
          </span>
          <span className="role-weight">
            Your rating weight: {roleInfo.weight}%
          </span>
        </div>

        <form onSubmit={handleSubmit} className="evaluation-form">
          {/* Rating Dimensions */}
          <div className="dimensions-list">
            {dimensions.map((dimension) => (
              <div key={dimension.key} className="dimension-item">
                <div className="dimension-header">
                  <span className="dimension-icon">{dimension.icon}</span>
                  <div className="dimension-info">
                    <h3 className="dimension-name">{dimension.name}</h3>
                    <p className="dimension-description">{dimension.description}</p>
                  </div>
                </div>
                <StarRating
                  value={ratings[dimension.key]}
                  onChange={(value) => handleRatingChange(dimension.key, value)}
                  dimension={dimension.key}
                  disabled={isSubmitting}
                />
                <p className="dimension-tip">{dimension.tip}</p>
              </div>
            ))}
          </div>

          {/* Average Preview */}
          <div className="average-preview">
            <span className="average-label">Your Average Rating:</span>
            <span className="average-value">
              {calculateAverageRating()} / 5.00
            </span>
          </div>

          {/* Comment (Optional) */}
          <div className="comment-section">
            <label htmlFor="evaluation-comment" className="comment-label">
              Comments (Optional)
            </label>
            <textarea
              id="evaluation-comment"
              className="comment-textarea"
              placeholder="Share your thoughts on this project..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
            />
            <div className="character-count">
              {comment.length} / 500
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              <>
                Submit Evaluation
              </>
            )}
          </button>

          {/* Info Note */}
          <p className="info-note">
            ℹ️ Your evaluation will be public and visible to everyone.
            All evaluations are permanent and cannot be edited.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EvaluationPanel;
