import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createStudentAccount } from '../services/authService';
import './CreateStudentScreen.css';

/**
 * CreateStudentScreen Component
 * Allows teachers to create student accounts
 * Phase A: Hybrid approach - Teacher creates, student activates
 */
const CreateStudentScreen = ({ currentUser, onClose, embedded = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    schoolId: '',
    district: currentUser?.district || '',
    state: currentUser?.state || '',
    schoolName: currentUser?.schoolName || ''
  });
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Load schools from Firestore
  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const q = query(collection(db, 'schools'), orderBy('name'));
      const snapshot = await getDocs(q);
      const schoolsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'schoolName') {
      // When school is selected, auto-populate district and state
      const selectedSchool = schools.find(s => s.name === value);
      if (selectedSchool) {
        setFormData({
          ...formData,
          schoolName: value,
          district: selectedSchool.district || '',
          state: selectedSchool.state || ''
        });
      } else {
        setFormData({ ...formData, [field]: value });
      }
    } else {
      setFormData({ ...formData, [field]: value });
    }
    setError('');
  };

  const generateSchoolId = () => {
    // Validate required fields
    if (!formData.state || formData.state.length < 2) {
      setError('Please select state first');
      return;
    }
    if (!formData.district || formData.district.length < 3) {
      setError('Please select district first');
      return;
    }
    if (!formData.schoolName) {
      setError('Please select school first');
      return;
    }

    // Auto-generate School ID based on pattern: STATE-DISTRICT-SCHOOL-STUDENTID
    const state = formData.state.substring(0, 2).toUpperCase();
    const district = formData.district.substring(0, 3).toUpperCase();
    const school = formData.schoolName.replace(/[^A-Z0-9]/gi, '').substring(0, 6).toUpperCase();
    const studentNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random

    const schoolId = `${state}-${district}-${school}-ST${studentNum}`;
    setFormData({ ...formData, schoolId });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter student name');
      return;
    }

    if (!formData.class.trim()) {
      setError('Please select class');
      return;
    }

    if (!formData.schoolId.trim()) {
      setError('Please generate or enter School ID');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createStudentAccount({
        ...formData,
        teacherId: currentUser.uid
      });

      if (result.success) {
        setSuccess(result);
        // Clear form
        setFormData({
          name: '',
          class: '',
          schoolId: '',
          district: currentUser?.district || '',
          state: currentUser?.state || '',
          schoolName: currentUser?.schoolName || ''
        });
      }
    } catch (error) {
      console.error('Error creating student:', error);
      setError(error.message || 'Failed to create student account');
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <>
          {success ? (
            <div className="success-card">
              <div className="success-icon">✅</div>
              <h3>Student Account Created!</h3>
              <div className="success-details">
                <div className="detail-row">
                  <strong>Student Name:</strong> {success.name}
                </div>
                <div className="detail-row">
                  <strong>School ID:</strong>
                  <span className="highlight">{success.schoolId}</span>
                </div>
                <div className="detail-row">
                  <strong>Activation Code:</strong>
                  <span className="highlight">{success.activationCode}</span>
                </div>
              </div>
              <div className="instructions">
                <p><strong>📋 Next Steps:</strong></p>
                <ol>
                  <li>Share the School ID and Activation Code with the student</li>
                  <li>Student should visit the login page and click "Activate your account"</li>
                  <li>Student enters School ID, Activation Code, and sets a password</li>
                  <li>Once activated, student can login with School ID and password</li>
                </ol>
              </div>
              <button className="primary-button" onClick={() => setSuccess(null)}>
                Create Another Student
              </button>
              {!embedded && (
                <button className="secondary-button" onClick={onClose} style={{ marginTop: '12px' }}>
                  Close
                </button>
              )}
            </div>
          ) : (
            <form className="create-student-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Student Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Class *</label>
                <select
                  className="form-input"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select class</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">School ID *</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="TN-TEN-GOV123-ST456"
                    value={formData.schoolId}
                    onChange={(e) => handleInputChange('schoolId', e.target.value.toUpperCase())}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="generate-button"
                    onClick={generateSchoolId}
                    disabled={isLoading}
                  >
                    Generate
                  </button>
                </div>
                <div className="form-hint">
                  Format: STATE-DISTRICT-SCHOOL-STUDENTID
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">School Name *</label>
                <select
                  className="form-input"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange('schoolName', e.target.value)}
                  disabled={isLoading || (currentUser?.role?.toLowerCase() === 'teacher')}
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.name}>
                      {school.name} ({school.district})
                    </option>
                  ))}
                </select>
                {currentUser?.role?.toLowerCase() === 'teacher' && (
                  <div className="form-hint">
                    Teachers can only create students for their own school
                  </div>
                )}
                {schools.length === 0 && (
                  <div className="form-hint" style={{ color: '#ef4444' }}>
                    No schools available. Please add schools in the Schools tab first.
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <select
                    className="form-input"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    disabled={isLoading || !!formData.schoolName}
                  >
                    <option value="">Select District</option>
                    <option value="Tenkasi">Tenkasi</option>
                    <option value="Tirunelveli">Tirunelveli</option>
                  </select>
                  {formData.schoolName && (
                    <div className="form-hint">
                      Auto-filled from selected school
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">State *</label>
                  <select
                    className="form-input"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={isLoading || !!formData.schoolName}
                  >
                    <option value="">Select State</option>
                    <option value="Tamilnadu">Tamilnadu</option>
                  </select>
                  {formData.schoolName && (
                    <div className="form-hint">
                      Auto-filled from selected school
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Student Account'}
              </button>
              {!embedded && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={onClose}
                  disabled={isLoading}
                  style={{ marginTop: '12px' }}
                >
                  Cancel
                </button>
              )}
            </form>
          )}
    </>
  );

  return embedded ? (
    <div className="student-management-wrapper">
      {formContent}
    </div>
  ) : (
    <div className="modal-overlay">
      <div className="modal-container create-student-modal">
        <div className="modal-header">
          <h2>Create Student Account</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {formContent}
        </div>
      </div>
    </div>
  );
};

export default CreateStudentScreen;
