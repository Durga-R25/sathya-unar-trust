import React, { useState } from 'react';
import { loginWithSchoolId, loginWithEmail, activateStudentAccount, sendPasswordReset } from '../services/authService';
import './LoginScreen.css';

/**
 * LoginScreen Component
 * Handles authentication for all user roles (Student, Teacher, Judge, Admin)
 *
 * School ID Format: STATE-DISTRICT-SCHOOL-STUDENTID
 * Example: MH-NAG-GOV123-ST456
 *
 * In Phase 7, this will integrate with Firebase Authentication
 */
const LoginScreen = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    schoolId: '',
    password: '',
    email: '', // Used for Teacher, Judge, Admin
    activationCode: '' // Used for student activation
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const roles = [
    { id: 'student', name: 'Student', icon: '🎓', description: 'Class 7-9 participant' },
    { id: 'teacher', name: 'Teacher', icon: '👨‍🏫', description: 'School coordinator' },
    { id: 'judge', name: 'Judge', icon: '⚖️', description: 'Competition evaluator' },
    { id: 'admin', name: 'Admin', icon: '⚙️', description: 'System administrator' }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setFormData({ schoolId: '', password: '', email: '' });
  };

  const validateSchoolId = (schoolId) => {
    // Format: STATE-DISTRICT-SCHOOL-STUDENTID (e.g., TN-TEN-GOV123-ST456)
    const schoolIdRegex = /^[A-Z]{2}-[A-Z]{3,4}-[A-Z0-9]{3,8}-[A-Z0-9]{3,8}$/;
    return schoolIdRegex.test(schoolId);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (selectedRole === 'student') {
      if (!formData.schoolId.trim()) {
        setError('Please enter your School ID');
        return;
      }
      // Check if user entered email format when student role is selected
      if (validateEmail(formData.schoolId.trim())) {
        setError('You entered an email address. Please select Teacher, Judge, or Admin role above to login with email.');
        return;
      }
      if (!validateSchoolId(formData.schoolId.toUpperCase())) {
        setError('Invalid School ID format. Use: STATE-DISTRICT-SCHOOL-STUDENTID');
        return;
      }
    } else {
      if (!formData.email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('Invalid email format');
        return;
      }
    }

    if (!formData.password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      let result;

      // Use appropriate login method based on role
      if (selectedRole === 'student') {
        result = await loginWithSchoolId(formData.schoolId.toUpperCase(), formData.password);
      } else {
        result = await loginWithEmail(formData.email, formData.password);
      }

      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setError('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleActivateAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.schoolId.trim()) {
      setError('Please enter your School ID');
      return;
    }

    if (!formData.activationCode.trim()) {
      setError('Please enter your activation code');
      return;
    }

    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await activateStudentAccount(
        formData.schoolId.toUpperCase(),
        formData.activationCode,
        formData.password
      );

      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setError('Activation failed. Please check your details.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Activation error:', error);
      setError(error.message || 'Activation failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!resetInput.trim()) {
      setError(selectedRole === 'student' ? 'Please enter your School ID' : 'Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendPasswordReset(resetInput.trim());
      setResetSuccess(result.message);
      setIsLoading(false);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset.');
      setIsLoading(false);
    }
  };

  const openForgotPassword = () => {
    setResetInput('');
    setResetSuccess('');
    setError('');
    setShowForgotPassword(true);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetInput('');
    setResetSuccess('');
    setError('');
  };

  const handleSchoolRegistration = () => {
    alert(
      '🏫 School Registration\n\n' +
      'To register a new school:\n\n' +
      '1. Contact the system administrator\n' +
      '2. Provide your school details (name, district, state)\n' +
      '3. Administrator will add your school to the system\n' +
      '4. You will then receive your teacher account credentials\n\n' +
      'For assistance, please contact your district coordinator or the competition organizers.'
    );
  };

  const getFormFields = () => {
    if (selectedRole === 'student') {
      return (
        <>
          <div className="form-group">
            <label className="form-label">School ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="TN-TEN-GOV123-ST456"
              value={formData.schoolId}
              onChange={(e) => handleInputChange('schoolId', e.target.value.toUpperCase())}
              disabled={isLoading}
            />
            <div className="school-id-info">
              <div className="school-id-info-title">
                ℹ️ School ID Format
              </div>
              <div className="school-id-info-text">
                Your School ID was provided by your teacher. Format: STATE-DISTRICT-SCHOOL-STUDENTID
              </div>
            </div>
          </div>

          {showActivation && (
            <div className="form-group">
              <label className="form-label">Activation Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-digit code"
                value={formData.activationCode}
                onChange={(e) => handleInputChange('activationCode', e.target.value)}
                disabled={isLoading}
                maxLength={6}
              />
              <div className="school-id-info">
                <div className="school-id-info-title">
                  ℹ️ Activation Code
                </div>
                <div className="school-id-info-text">
                  Your teacher provided you with a 6-digit activation code along with your School ID.
                </div>
              </div>
            </div>
          )}
        </>
      );
    } else {
      return (
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder={`${selectedRole}@example.com`}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={isLoading}
          />
        </div>
      );
    }
  };

  return (
    <div className="login-screen">
      {/* Organization Logos */}
      <div className="org-logos">
        <img src="/logos/SUS Logo.jpg" alt="SUS Logo" className="org-logo org-logo-right" />
      </div>

      <div className="login-container">
           <div className="login-header">
             <h1 className="login-title">
               <span className="logo-icon">🔬</span>
               ScienceVerse
             </h1>
             <p className="login-subtitle">
               Sathya Unar Charitable Trust - Innovation Science Hub
            <br />
            Select your role and login to continue
            </p>
      </div>

        <div className="role-selection">
          <label className="role-selection-label">I am a...</label>
          <div className="role-cards">
            {roles.map(role => (
              <div
                key={role.id}
                className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="role-card-icon">{role.icon}</div>
                <div className="role-card-name">{role.name}</div>
              </div>
            ))}
          </div>
        </div>

        <form className="login-form" onSubmit={showActivation ? handleActivateAccount : handleLogin}>
          <div className="selected-role-banner">
            <span className="banner-icon">{roles.find(r => r.id === selectedRole)?.icon}</span>
            <span className="banner-text">
              Logging in as: <strong>{roles.find(r => r.id === selectedRole)?.name}</strong>
            </span>
          </div>
          {getFormFields()}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-toggle">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="forgot-password"
            onClick={openForgotPassword}
          >
            Forgot password?
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading
              ? (showActivation ? 'Activating...' : 'Logging in...')
              : (showActivation ? 'Activate Account' : `Login as ${roles.find(r => r.id === selectedRole)?.name}`)}
          </button>
        </form>

        {selectedRole === 'student' && !showActivation && (
          <div className="register-link">
            New student? <button type="button" className="link-button" onClick={() => setShowActivation(true)}>Activate your account</button>
            <br />
            Don't have a School ID? <a href="#contact">Contact your teacher</a>
          </div>
        )}

        {selectedRole === 'student' && showActivation && (
          <div className="register-link">
            Already activated? <button type="button" className="link-button" onClick={() => setShowActivation(false)}>Login here</button>
          </div>
        )}

        {selectedRole === 'teacher' && (
          <div className="register-link">
            New school? <button type="button" className="link-button" onClick={handleSchoolRegistration}>Register your school</button>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="login-screen" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeForgotPassword}>
          <div className="login-container" style={{ maxWidth: '420px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="login-header">
              <h2 className="login-title" style={{ fontSize: '1.4rem' }}>🔑 Reset Password</h2>
              <p className="login-subtitle">
                {selectedRole === 'student'
                  ? 'Enter your School ID to reset your password'
                  : 'Enter your email address and we\'ll send you a reset link'}
              </p>
            </div>

            {resetSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p style={{ color: '#10b981', fontWeight: 600, marginBottom: '8px' }}>{resetSuccess}</p>
                <button type="button" className="login-button" onClick={closeForgotPassword}>Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="form-group">
                  <label className="form-label">
                    {selectedRole === 'student' ? 'School ID' : 'Email Address'}
                  </label>
                  <input
                    type={selectedRole === 'student' ? 'text' : 'email'}
                    className="form-input"
                    placeholder={selectedRole === 'student' ? 'TN-TEN-GOV123-ST456' : 'you@example.com'}
                    value={resetInput}
                    onChange={e => { setResetInput(selectedRole === 'student' ? e.target.value.toUpperCase() : e.target.value); setError(''); }}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="login-button" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset'}
                </button>
                <button type="button" className="forgot-password" onClick={closeForgotPassword} style={{ display: 'block', textAlign: 'center', marginTop: '8px' }}>
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
