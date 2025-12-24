import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import './CompetitionSettings.css';

const CompetitionSettings = () => {
  const [settings, setSettings] = useState({
    name: 'District Science Competition 2024',
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    videoDurationLimit: 300,
    maxVideoFileSize: 500, // in MB
    maxSubmissionsPerStudent: 1,
    uploadsEnabled: true,
    evaluationsEnabled: true,
    announcement: 'Welcome to the competition! Show us your best science projects.'
  });

  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load settings from Firestore on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'competitionSettings');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          name: data.name || settings.name,
          startDate: data.startDate || settings.startDate,
          endDate: data.endDate || settings.endDate,
          videoDurationLimit: data.videoDurationLimit || settings.videoDurationLimit,
          maxVideoFileSize: data.maxVideoFileSize || settings.maxVideoFileSize,
          maxSubmissionsPerStudent: data.maxSubmissionsPerStudent || settings.maxSubmissionsPerStudent,
          uploadsEnabled: data.uploadsEnabled !== undefined ? data.uploadsEnabled : settings.uploadsEnabled,
          evaluationsEnabled: data.evaluationsEnabled !== undefined ? data.evaluationsEnabled : settings.evaluationsEnabled,
          announcement: data.announcement || settings.announcement
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Save settings to Firestore
      const docRef = doc(db, 'settings', 'competitionSettings');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="competition-settings">
      <h3 className="settings-title">🏆 Competition Settings</h3>

      <div className="settings-form">
        <div className="form-section">
          <h4 className="section-heading">Basic Information</h4>

          <div className="form-field">
            <label>Competition Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="settings-input"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Start Date</label>
              <input
                type="date"
                value={settings.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="settings-input"
              />
            </div>
            <div className="form-field">
              <label>End Date</label>
              <input
                type="date"
                value={settings.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="settings-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-heading">Submission Rules</h4>

          <div className="form-field">
            <label>Video Duration Limit (seconds): {settings.videoDurationLimit}</label>
            <input
              type="range"
              min="60"
              max="600"
              step="30"
              value={settings.videoDurationLimit}
              onChange={(e) => handleChange('videoDurationLimit', parseInt(e.target.value))}
              className="settings-range"
            />
            <span className="range-value">{Math.floor(settings.videoDurationLimit / 60)} minutes</span>
          </div>

          <div className="form-field">
            <label>Maximum Video File Size</label>
            <select
              value={settings.maxVideoFileSize}
              onChange={(e) => handleChange('maxVideoFileSize', parseInt(e.target.value))}
              className="settings-input"
            >
              <option value={50}>50 MB</option>
              <option value={100}>100 MB</option>
              <option value={250}>250 MB</option>
              <option value={500}>500 MB (Recommended)</option>
              <option value={1000}>1 GB</option>
              <option value={2000}>2 GB</option>
              <option value={5000}>5 GB</option>
            </select>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              Videos larger than this size will be rejected during upload
            </p>
          </div>

          <div className="form-field">
            <label>Max Submissions Per Student</label>
            <input
              type="number"
              min="1"
              max="5"
              value={settings.maxSubmissionsPerStudent}
              onChange={(e) => handleChange('maxSubmissionsPerStudent', parseInt(e.target.value))}
              className="settings-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-heading">Permissions</h4>

          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.uploadsEnabled}
                onChange={(e) => handleChange('uploadsEnabled', e.target.checked)}
              />
              <span>Enable Video Uploads</span>
            </label>

            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.evaluationsEnabled}
                onChange={(e) => handleChange('evaluationsEnabled', e.target.checked)}
              />
              <span>Enable Evaluations</span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-heading">Announcement</h4>
          <textarea
            value={settings.announcement}
            onChange={(e) => handleChange('announcement', e.target.value)}
            className="settings-textarea"
            rows="4"
            placeholder="Enter competition announcement..."
          />
        </div>

        {error && (
          <div className="error-message" style={{ color: '#ef4444', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginTop: '16px' }}>
            {error}
          </div>
        )}

        <button
          className="save-button"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default CompetitionSettings;
