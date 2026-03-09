import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db, functions, auth } from '../config/firebase';
import './UserManagement.css';

/**
 * UserManagement Component
 * Allows admins to create Teacher and Judge accounts
 * Phase A & B: Admin creates accounts with roles
 */
const UserManagement = ({ currentUser, userType = 'teacher' }) => {
  const [selectedRole, setSelectedRole] = useState(userType);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolName: '',
    village: '',
    district: '',
    state: '',
    organization: '',
    expertise: '',
    designation: ''
  });
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Update selectedRole when userType prop changes
  useEffect(() => {
    setSelectedRole(userType);
  }, [userType]);

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
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    // Clear all form fields when switching roles
    setFormData({
      name: '',
      email: '',
      password: '',
      schoolName: '',
      village: '',
      district: '',
      state: '',
      organization: '',
      expertise: '',
      designation: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if user is authenticated with Firebase Auth
    const currentAuthUser = auth.currentUser;

    console.log('=== AUTH DEBUG ===');
    console.log('Firebase Auth currentUser:', currentAuthUser);
    console.log('Current user from context:', currentUser);

    if (!currentAuthUser) {
      setError('Firebase Auth error: Not authenticated. Please logout and login again.');
      console.error('No Firebase Auth user found. Auth state:', auth);
      return;
    }

    console.log('✓ Firebase Auth user found:', currentAuthUser.uid, currentAuthUser.email);

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter email');
      return;
    }

    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (selectedRole === 'teacher' && !formData.schoolName.trim()) {
      setError('Please enter school name');
      return;
    }

    if (selectedRole === 'judge' && !formData.organization.trim()) {
      setError('Please enter organization');
      return;
    }

    setIsLoading(true);

    try {
      // Check for duplicate email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.email.toLowerCase().trim())
      );
      const existingUsers = await getDocs(usersQuery);

      if (!existingUsers.empty) {
        setError('This email is already registered. Please use a different email.');
        setIsLoading(false);
        return;
      }
      // Get current ID token
      const idToken = await currentAuthUser.getIdToken(true);
      console.log('✓ Got ID token:', idToken.substring(0, 50) + '...');

      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: selectedRole,
        village: formData.village,
        district: formData.district,
        state: formData.state
      };

      if (selectedRole === 'teacher') {
        userData.schoolName = formData.schoolName;
        userData.designation = formData.designation || '';
      } else if (selectedRole === 'judge') {
        userData.organization = formData.organization;
        userData.expertise = formData.expertise;
      }

      // Call Cloud Function with explicit auth header
      const functionUrl = `https://us-central1-scienceverse-competition.cloudfunctions.net/createUserAccount`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ data: userData })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'Failed to create user');
      }

      console.log('✓ User created successfully:', responseData);

      setSuccess({
        role: selectedRole,
        name: formData.name,
        email: formData.email
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        schoolName: '',
        village: '',
        district: '',
        state: '',
        organization: '',
        expertise: '',
        designation: ''
      });
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Handle Cloud Function errors
      if (error.code === 'already-exists' || error.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (error.code === 'invalid-argument') {
        setError(error.message);
      } else if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        setError('Authentication error: ' + (error.message || 'You do not have permission to create users'));
      } else if (error.code === 'functions/unauthenticated') {
        setError('Not authenticated. Please logout and login again.');
      } else if (error.code === 'functions/internal') {
        setError('Server error: ' + error.message);
      } else {
        setError('Error: ' + (error.message || 'Failed to create user account'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-management">
      {success ? (
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h3>{selectedRole === 'teacher' ? 'Teacher' : 'Judge'} Account Created!</h3>
          <div className="success-details">
            <div className="detail-row">
              <strong>Name:</strong> {success.name}
            </div>
            <div className="detail-row">
              <strong>Email:</strong> {success.email}
            </div>
            <div className="detail-row">
              <strong>Role:</strong> {success.role}
            </div>
          </div>
          <div className="instructions">
            <p><strong>📧 Next Steps:</strong></p>
            <ol>
              <li>The user can now login with their email and password</li>
              <li>Share the login credentials securely with the user</li>
              <li>They should change their password after first login</li>
            </ol>
          </div>
          <button className="primary-button" onClick={() => setSuccess(null)}>
            Create Another User
          </button>
        </div>
      ) : (
        <>
          <form className="user-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
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
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
              />
            </div>

            {selectedRole === 'teacher' && (
              <>
                <div className="form-group">
                  <label className="form-label">School Name *</label>
                  <select
                    className="form-input"
                    value={formData.schoolName}
                    onChange={(e) => handleInputChange('schoolName', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select School</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.name}>
                        {school.name} ({school.district})
                      </option>
                    ))}
                  </select>
                  {schools.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                      No schools available. Please add schools in the Schools tab first.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Designation (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Science Coordinator, Math Teacher"
                    value={formData.designation || ''}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {selectedRole === 'judge' && (
              <>
                <div className="form-group">
                  <label className="form-label">Organization *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., District Science Committee"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expertise (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Physics & Chemistry"
                    value={formData.expertise}
                    onChange={(e) => handleInputChange('expertise', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {selectedRole === 'teacher' && (
              <div className="form-group">
                <label className="form-label">Village</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter village name"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">District *</label>
                <select
                  className="form-input"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select District</option>
                  <option value="Tenkasi">Tenkasi</option>
                  <option value="Tirunelveli">Tirunelveli</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">State *</label>
                <select
                  className="form-input"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select State</option>
                  <option value="Tamilnadu">Tamilnadu</option>
                </select>
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
              {isLoading ? 'Creating...' : `Create ${selectedRole === 'teacher' ? 'Teacher' : 'Judge'} Account`}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default UserManagement;
