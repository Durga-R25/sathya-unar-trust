import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import StarRating from './StarRating';
import './EvaluationPanel.css';

/**
 * EvaluationPanel Component
 * Interactive form for evaluating videos with 4 dimensions
 * - One evaluation per user per video (enforced via Firebase check)
 * - Comment is mandatory (min 10 characters)
 * - Saves to Firebase and recalculates video aggregate scores
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
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(true);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [existingEvaluation, setExistingEvaluation] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const videoRef = video.videoId || video.id;

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

  // Check Firebase to see if this user already evaluated this video
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'evaluations'), where('videoId', '==', videoRef))
        );
        const myEval = snap.docs.map(d => d.data()).find(e => e.evaluatorId === currentUser.uid);
        if (myEval) {
          setAlreadyEvaluated(true);
          setExistingEvaluation(myEval);
        }
      } catch (err) {
        console.error('Error checking existing evaluation:', err);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };
    checkExisting();
  }, [videoRef, currentUser.uid]);

  const handleRatingChange = (dimension, value) => {
    setRatings(prev => ({ ...prev, [dimension]: value }));
    setError('');
  };

  const calculateAverageRating = () => {
    const values = Object.values(ratings);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  const validate = () => {
    if (Object.values(ratings).some(v => v === 0)) {
      return 'Please rate all four dimensions';
    }
    if (!comment.trim()) {
      return 'A comment is required — please share your thoughts on this project';
    }
    if (comment.trim().length < 10) {
      return 'Comment must be at least 10 characters';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const evaluation = {
        evaluationId: `eval_${Date.now()}_${currentUser.uid}`,
        videoId: videoRef,
        evaluatorId: currentUser.uid,
        evaluatorName: currentUser.name || '',
        evaluatorRole: currentUser.role || '',
        // judges have 'organization', students/teachers have 'schoolName'
        evaluatorSchool: currentUser.schoolName || currentUser.organization || '',
        scientificClarity: ratings.scientificClarity,
        humanityCare: ratings.humanityCare,
        realLifeImpact: ratings.realLifeImpact,
        originalThinking: ratings.originalThinking,
        averageRating: parseFloat(calculateAverageRating()),
        comment: comment.trim(),
        evaluatedAt: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      // Save evaluation to Firebase
      await addDoc(collection(db, 'evaluations'), evaluation);

      // Recalculate video aggregate scores — done separately so a score
      // update failure never prevents the evaluation from being recorded
      try {
        const allEvalsSnap = await getDocs(
          query(collection(db, 'evaluations'), where('videoId', '==', videoRef))
        );
        const allEvals = allEvalsSnap.docs.map(d => d.data());
        const count = allEvals.length;
        if (count > 0 && video.id) {
          // Weighted average: Judge 70%, Teacher 20%, Student 10%
          // Only roles present contribute; weights are renormalised if a role is absent
          const weightedAvg = (field) => {
            const judgeEvals = allEvals.filter(e => ['judge', 'admin'].includes((e.evaluatorRole || '').toLowerCase()));
            const teacherEvals = allEvals.filter(e => (e.evaluatorRole || '').toLowerCase() === 'teacher');
            const studentEvals = allEvals.filter(e => (e.evaluatorRole || '').toLowerCase() === 'student');
            const roleAvg = (group) =>
              group.length > 0 ? group.reduce((sum, e) => sum + (e[field] || 0), 0) / group.length : null;
            const jAvg = roleAvg(judgeEvals);
            const tAvg = roleAvg(teacherEvals);
            const sAvg = roleAvg(studentEvals);
            const jW = jAvg !== null ? 0.7 : 0;
            const tW = tAvg !== null ? 0.2 : 0;
            const sW = sAvg !== null ? 0.1 : 0;
            const totalW = jW + tW + sW;
            if (totalW === 0) return 0;
            return ((jAvg || 0) * jW + (tAvg || 0) * tW + (sAvg || 0) * sW) / totalW;
          };
          // Count evaluations per role
          const normalizeRole = (r) => (r || '').toLowerCase().trim();
          const judgeCount = allEvals.filter(e => ['judge', 'admin'].includes(normalizeRole(e.evaluatorRole))).length;
          const teacherCount = allEvals.filter(e => normalizeRole(e.evaluatorRole) === 'teacher').length;
          const studentCount = allEvals.filter(e => normalizeRole(e.evaluatorRole) === 'student').length;

          await updateDoc(doc(db, 'videos', video.id), {
            totalEvaluations: count,
            judgeEvaluations: judgeCount,
            teacherEvaluations: teacherCount,
            studentEvaluations: studentCount,
            aggregateScore: parseFloat(weightedAvg('averageRating').toFixed(2)),
            scientificClarity: parseFloat(weightedAvg('scientificClarity').toFixed(2)),
            humanityCare: parseFloat(weightedAvg('humanityCare').toFixed(2)),
            realLifeImpact: parseFloat(weightedAvg('realLifeImpact').toFixed(2)),
            originalThinking: parseFloat(weightedAvg('originalThinking').toFixed(2))
          });
        }
      } catch (scoreErr) {
        console.warn('Score update failed (evaluation still saved):', scoreErr);
      }

      onSubmit(evaluation);
      setSubmitted(true);
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

  // Loading state — checking Firebase for existing evaluation
  if (isCheckingDuplicate) {
    return (
      <div className="evaluation-panel-overlay" onClick={onClose}>
        <div className="evaluation-panel" onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p>Checking evaluation status...</p>
          </div>
        </div>
      </div>
    );
  }

  // Already evaluated — show their previous submission (read-only)
  if (alreadyEvaluated && existingEvaluation) {
    return (
      <div className="evaluation-panel-overlay" onClick={onClose}>
        <div className="evaluation-panel" onClick={e => e.stopPropagation()}>
          <div className="panel-header">
            <div className="header-content">
              <h2 className="panel-title">Your Evaluation</h2>
              <p className="panel-subtitle">"{video.title}"</p>
            </div>
            <button className="close-button" onClick={onClose} type="button">✕</button>
          </div>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>⭐</div>
            <h3 style={{ color: '#10b981', margin: '0 0 8px' }}>Already Evaluated</h3>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
              You have already submitted an evaluation for this video. Each video can only be rated once per user.
            </p>
            <div className="average-preview">
              <span className="average-label">Your Rating:</span>
              <span className="average-value">
                {existingEvaluation.averageRating?.toFixed(2)} / 5.00
              </span>
            </div>
            {existingEvaluation.comment && (
              <div style={{
                marginTop: '16px', padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                textAlign: 'left', color: '#cbd5e1', fontSize: '14px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <strong style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                  YOUR COMMENT
                </strong>
                {existingEvaluation.comment}
              </div>
            )}
            <button
              className="submit-button"
              onClick={onClose}
              style={{ marginTop: '24px', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state — evaluation just submitted
  if (submitted) {
    return (
      <div className="evaluation-panel-overlay" onClick={onClose}>
        <div className="evaluation-panel" onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: '#f1f5f9', marginBottom: '8px' }}>Evaluation Submitted!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              Thank you for evaluating "{video.title}".
            </p>
            <button
              className="submit-button"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal evaluation form
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

          {/* Comment (Required) */}
          <div className="comment-section">
            <label htmlFor="evaluation-comment" className="comment-label">
              Comments <span style={{ color: '#ef4444' }}>*</span>
              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 400, marginLeft: '6px' }}>
                (required, min 10 characters)
              </span>
            </label>
            <textarea
              id="evaluation-comment"
              className="comment-textarea"
              placeholder="Share your thoughts on this project — what stood out, what could be improved..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error && e.target.value.trim().length >= 10) setError('');
              }}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
            />
            <div className="character-count" style={{
              color: comment.trim().length > 0 && comment.trim().length < 10 ? '#ef4444' : undefined
            }}>
              {comment.length} / 500
              {comment.trim().length > 0 && comment.trim().length < 10 && (
                <span style={{ marginLeft: '8px', color: '#ef4444' }}>
                  ({10 - comment.trim().length} more characters needed)
                </span>
              )}
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
              'Submit Evaluation'
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
