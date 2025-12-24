import React, { useState, useRef, useEffect } from 'react';
import './VideoRecorder.css';

/**
 * VideoRecorder Component
 * Records video using device camera with preview and controls
 */
const VideoRecorder = ({ maxDuration, onRecordComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Initialize camera
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // or 'environment' for back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = () => {
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        stopTimer();
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error('Recording error:', err);
      setError('Unable to start recording.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordedTime(prev => {
        const newTime = prev + 1;
        // Auto-stop at max duration
        if (newTime >= maxDuration) {
          stopRecording();
          return maxDuration;
        }
        return newTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRetry = () => {
    setRecordedBlob(null);
    setRecordedTime(0);
    chunksRef.current = [];
  };

  const handleUseRecording = () => {
    stopCamera();
    onRecordComplete(recordedBlob);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (recordedTime / maxDuration) * 100;
    if (percentage >= 90) return '#ef4444'; // Red
    if (percentage >= 70) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  if (error) {
    return (
      <div className="recorder-error">
        <span className="error-icon">⚠️</span>
        <h3 className="error-title">Camera Error</h3>
        <p className="error-message">{error}</p>
        <button className="secondary-button" onClick={onCancel}>
          Go Back
        </button>
      </div>
    );
  }

  if (recordedBlob) {
    return (
      <div className="recorder-preview">
        <div className="preview-container">
          <video
            className="preview-video"
            src={URL.createObjectURL(recordedBlob)}
            controls
            playsInline
          />
        </div>
        <div className="preview-info">
          <p className="preview-duration">
            Duration: {formatTime(recordedTime)}
          </p>
          <p className="preview-message">
            Preview your recording and use it, or record again
          </p>
        </div>
        <div className="preview-actions">
          <button className="secondary-button" onClick={handleRetry}>
            🔄 Record Again
          </button>
          <button className="primary-button" onClick={handleUseRecording}>
            ✓ Use This Recording
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-recorder">
      <div className="recorder-viewport">
        <video
          ref={videoRef}
          className="recorder-video"
          autoPlay
          playsInline
          muted
        />

        {!cameraReady && (
          <div className="camera-loading">
            <div className="spinner"></div>
            <p>Starting camera...</p>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="recording-indicator">
            <span className={`rec-dot ${isPaused ? 'paused' : ''}`}></span>
            <span className="rec-text">{isPaused ? 'PAUSED' : 'REC'}</span>
          </div>
        )}

        {/* Timer */}
        <div className="recorder-timer" style={{ color: getTimeColor() }}>
          {formatTime(recordedTime)} / {formatTime(maxDuration)}
        </div>

        {/* Progress Bar */}
        <div className="duration-progress">
          <div
            className="duration-fill"
            style={{
              width: `${(recordedTime / maxDuration) * 100}%`,
              backgroundColor: getTimeColor()
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="recorder-controls">
        {!isRecording ? (
          <button
            className="record-button"
            onClick={startRecording}
            disabled={!cameraReady}
          >
            <span className="record-icon">⏺</span>
            <span className="record-label">Start Recording</span>
          </button>
        ) : (
          <>
            <button className="control-button" onClick={stopRecording}>
              <span className="control-icon">⏹</span>
              <span className="control-label">Stop</span>
            </button>
            {!isPaused ? (
              <button className="control-button" onClick={pauseRecording}>
                <span className="control-icon">⏸</span>
                <span className="control-label">Pause</span>
              </button>
            ) : (
              <button className="control-button resume" onClick={resumeRecording}>
                <span className="control-icon">▶</span>
                <span className="control-label">Resume</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Tips */}
      {!isRecording && (
        <div className="recorder-tips">
          <h4 className="tips-title">📝 Recording Tips:</h4>
          <ul className="tips-list">
            <li>Ensure good lighting for clear video</li>
            <li>Speak clearly and explain your experiment</li>
            <li>Show all steps of your project</li>
            <li>Keep phone/camera steady</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
