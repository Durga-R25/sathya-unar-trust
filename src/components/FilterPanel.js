import React from 'react';
import './FilterPanel.css';

const FilterPanel = ({ filters, categories, schools, districts, onFilterChange, onClearFilters }) => {
  return (
    <div className="filter-panel">
      <div className="filter-grid">
        {/* Category */}
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* School */}
        <div className="filter-group">
          <label className="filter-label">School</label>
          <select
            className="filter-select"
            value={filters.school}
            onChange={(e) => onFilterChange({ school: e.target.value })}
          >
            <option value="">All Schools</option>
            {schools.map(school => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="filter-group">
          <label className="filter-label">District</label>
          <select
            className="filter-select"
            value={filters.district}
            onChange={(e) => onFilterChange({ district: e.target.value })}
          >
            <option value="">All Districts</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        {/* Min Rating */}
        <div className="filter-group">
          <label className="filter-label">Min Rating: {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}</label>
          <input
            type="range"
            className="filter-range"
            min="0"
            max="5"
            step="0.5"
            value={filters.minRating}
            onChange={(e) => onFilterChange({ minRating: parseFloat(e.target.value) })}
          />
        </div>

        {/* Sort By */}
        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest-rated">Highest Rated</option>
            <option value="most-evaluated">Most Evaluated</option>
          </select>
        </div>
      </div>

      <button className="clear-filters-button" onClick={onClearFilters}>
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterPanel;
