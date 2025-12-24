import React from 'react';
import './Navigation.css';

/**
 * Navigation Component
 * Bottom navigation bar with 5 main tabs
 */
const Navigation = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'upload', label: 'Upload', icon: '➕' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'more', label: 'More', icon: '⚙️' }
  ];

  return (
    <nav className="bottom-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${currentTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
