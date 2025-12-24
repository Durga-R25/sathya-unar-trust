import React from 'react';
import './UploadProgress.css';

/**
 * UploadProgress Component
 * Shows upload progress with animation
 */
const UploadProgress = ({ progress, fileName }) => {
  return (
    <div className="upload-progress">
      <div className="progress-content">
        <div className="progress-icon">
          {progress < 100 ? '📤' : '✅'}
        </div>

        <h3 className="progress-title">
          {progress < 100 ? 'Uploading Video...' : 'Processing...'}
        </h3>

        <p className="progress-filename">{fileName}</p>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="progress-stats">
          <span className="progress-percent">{progress}%</span>
          <span className="progress-status">
            {progress < 100
              ? 'Please wait...'
              : 'Generating thumbnail...'}
          </span>
        </div>

        {progress < 100 && (
          <p className="progress-note">
            ⚠️ Do not close this window or navigate away
          </p>
        )}

        {/* Upload Steps */}
        <div className="progress-steps">
          <div className={`step ${progress >= 25 ? 'complete' : 'active'}`}>
            <div className="step-icon">
              {progress >= 25 ? '✓' : '1'}
            </div>
            <span className="step-label">Uploading</span>
          </div>

          <div className={`step ${progress >= 50 ? 'complete' : progress >= 25 ? 'active' : ''}`}>
            <div className="step-icon">
              {progress >= 50 ? '✓' : '2'}
            </div>
            <span className="step-label">Validating</span>
          </div>

          <div className={`step ${progress >= 75 ? 'complete' : progress >= 50 ? 'active' : ''}`}>
            <div className="step-icon">
              {progress >= 75 ? '✓' : '3'}
            </div>
            <span className="step-label">Processing</span>
          </div>

          <div className={`step ${progress >= 100 ? 'complete' : progress >= 75 ? 'active' : ''}`}>
            <div className="step-icon">
              {progress >= 100 ? '✓' : '4'}
            </div>
            <span className="step-label">Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
