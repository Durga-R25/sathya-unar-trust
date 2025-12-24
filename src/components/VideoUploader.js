import React, { useRef, useState } from 'react';
import './VideoUploader.css';

/**
 * VideoUploader Component
 * File picker for selecting existing videos from device
 */
const VideoUploader = ({ allowedFormats, maxFileSize, onFileSelect, onCancel }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!allowedFormats.includes(file.type)) {
      alert('Invalid file format. Please select MP4, WebM, or MOV files.');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes) => {
    return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  };

  return (
    <div className="video-uploader">
      <div
        className={`upload-dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFormats.join(',')}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <span className="dropzone-icon">📁</span>
        <h3 className="dropzone-title">
          {dragActive ? 'Drop video here' : 'Select Video File'}
        </h3>
        <p className="dropzone-subtitle">
          Click to browse or drag and drop
        </p>
        <div className="dropzone-formats">
          <span className="format-badge">MP4</span>
          <span className="format-badge">WebM</span>
          <span className="format-badge">MOV</span>
        </div>
      </div>

      <div className="uploader-info">
        <div className="info-row">
          <span className="info-label">Maximum file size:</span>
          <span className="info-value">{formatSize(maxFileSize)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Recommended format:</span>
          <span className="info-value">MP4 (H.264)</span>
        </div>
        <div className="info-row">
          <span className="info-label">Recommended resolution:</span>
          <span className="info-value">720p or 1080p</span>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;
