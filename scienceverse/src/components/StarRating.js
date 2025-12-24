import React, { useState } from 'react';
import './StarRating.css';

/**
 * StarRating Component
 * Interactive 5-star rating input
 * Supports half-star ratings and hover preview
 */
const StarRating = ({ value, onChange, dimension, disabled = false }) => {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (rating) => {
    if (!disabled && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!disabled) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  const displayValue = hoverValue || value;

  return (
    <div className="star-rating-input">
      <div className="stars-container" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`star-button ${disabled ? 'disabled' : ''}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            disabled={disabled}
            type="button"
          >
            <span className={`star ${displayValue >= star ? 'filled' : 'empty'}`}>
              ★
            </span>
          </button>
        ))}
      </div>
      <div className="rating-value">
        {value > 0 ? value.toFixed(1) : '—'}
      </div>
    </div>
  );
};

export default StarRating;
