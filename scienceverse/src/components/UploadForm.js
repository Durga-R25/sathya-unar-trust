import React, { useState } from 'react';
import './UploadForm.css';

/**
 * UploadForm Component
 * Metadata form for video upload (title, description, category, tags)
 */
const UploadForm = ({ videoUrl, videoFile, categories, currentUser, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    // Parse tags
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Max 5 tags

    const metadata = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      tags: tags.length > 0 ? tags : ['science', 'experiment']
    };

    onSubmit(metadata);
  };

  return (
    <div className="upload-form-container">
      {/* Video Preview */}
      <div className="form-preview">
        <video
          className="preview-thumb"
          src={videoUrl}
          controls
          playsInline
        />
        <div className="preview-details">
          <p className="preview-name">{videoFile.name}</p>
          <p className="preview-size">
            {(videoFile.size / (1024 * 1024)).toFixed(2)}MB
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="upload-form">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="e.g., Solar Panel Made from Recycled Materials"
            value={formData.title}
            onChange={handleChange}
            maxLength={100}
          />
          <div className="form-meta">
            {errors.title ? (
              <span className="error-text">{errors.title}</span>
            ) : (
              <span className="char-count">{formData.title.length} / 100</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder="Describe your experiment: What did you do? What did you learn? How can it help people?"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            maxLength={500}
          />
          <div className="form-meta">
            {errors.description ? (
              <span className="error-text">{errors.description}</span>
            ) : (
              <span className="char-count">{formData.description.length} / 500</span>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category" className="form-label">
            Category <span className="required">*</span>
          </label>
          <select
            id="category"
            name="category"
            className={`form-select ${errors.category ? 'error' : ''}`}
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select a category...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <span className="error-text">{errors.category}</span>
          )}
        </div>

        {/* Tags */}
        <div className="form-group">
          <label htmlFor="tags" className="form-label">
            Tags <span className="optional">(Optional)</span>
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            className="form-input"
            placeholder="e.g., renewable, solar, energy (comma separated)"
            value={formData.tags}
            onChange={handleChange}
          />
          <p className="form-hint">
            Add up to 5 tags to help others find your video
          </p>
        </div>

        {/* Uploader Info */}
        <div className="form-info">
          <h4 className="info-heading">Submission Details</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{currentUser.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">School:</span>
              <span className="info-value">{currentUser.schoolName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Class:</span>
              <span className="info-value">{currentUser.class || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">District:</span>
              <span className="info-value">{currentUser.district}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Upload Video'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
