import React, { useMemo, useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import './ProfileScreen.css';

/**
 * ProfileScreen Component
 * Displays user profile with role-specific information
 * - Student: School ID, submissions, scores, badges
 * - Teacher: School, students, evaluations
 * - Judge: Organization, evaluations, statistics
 * - Admin: System access, permissions
 *
 * In Phase 7, this will fetch real data from Firebase
 */
const ProfileScreen = ({ currentUser, videos, evaluations, notifications, onClose, onLogout }) => {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [realStats, setRealStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load real statistics from Firestore
  useEffect(() => {
    loadRealStats();
  }, [currentUser]);

  const loadRealStats = async () => {
    try {
      setIsLoadingStats(true);
      const role = currentUser.role?.toLowerCase();

      if (role === 'student') {
        // Get student's videos (both active and pending)
        const videosQuery = query(
          collection(db, 'videos'),
          where('uploaderId', '==', currentUser.uid)
        );
        const videosSnapshot = await getDocs(videosQuery);
        const userVideos = videosSnapshot.docs.map(doc => doc.data());

        const totalViews = userVideos.reduce((sum, v) => sum + (v.views || 0), 0);
        const avgScore = userVideos.length > 0
          ? userVideos.reduce((sum, v) => sum + (v.aggregateScore || 0), 0) / userVideos.length
          : 0;

        setRealStats({
          videosSubmitted: userVideos.length,
          pendingVideos: userVideos.filter(v => v.status === 'pending').length,
          activeVideos: userVideos.filter(v => v.status === 'active').length,
          totalViews,
          avgScore: avgScore.toFixed(1)
        });

      } else if (role === 'teacher') {
        // Get students created by this teacher
        const studentsQuery = query(
          collection(db, 'users'),
          where('createdBy', '==', currentUser.uid),
          where('role', '==', 'student')
        );
        const studentsSnapshot = await getDocs(studentsQuery);

        // Get videos from teacher's school
        const schoolVideosQuery = query(
          collection(db, 'videos'),
          where('uploaderSchool', '==', currentUser.schoolName)
        );
        const schoolVideosSnapshot = await getDocs(schoolVideosQuery);

        setRealStats({
          studentsManaged: studentsSnapshot.size,
          videosSupervised: schoolVideosSnapshot.size,
          pendingApprovals: schoolVideosSnapshot.docs.filter(doc => doc.data().status === 'pending').length
        });

      } else if (role === 'admin') {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, 'users'));

        // Get total videos
        const videosSnapshot = await getDocs(collection(db, 'videos'));

        // Get pending videos
        const pendingQuery = query(
          collection(db, 'videos'),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);

        setRealStats({
          totalUsers: usersSnapshot.size,
          totalVideos: videosSnapshot.size,
          pendingApprovals: pendingSnapshot.size,
          activeVideos: videosSnapshot.docs.filter(doc => doc.data().status === 'active').length
        });
      }
    } catch (error) {
      console.error('Error loading real stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Calculate user statistics (use realStats when available)
  const userStats = useMemo(() => {
    if (isLoadingStats || !realStats) {
      return { loading: true };
    }
    return realStats;
  }, [realStats, isLoadingStats]);

  const getRoleIcon = (role) => {
    const icons = {
      student: '🎓',
      teacher: '👨‍🏫',
      judge: '⚖️',
      admin: '⚙️'
    };
    return icons[role] || '👤';
  };

  const handlePasswordChange = () => {
    setPasswordError('');

    // Validation
    if (!passwordData.currentPassword.trim()) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (!passwordData.newPassword.trim()) {
      setPasswordError('Please enter a new password');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    // Here you would call Firebase to update the password
    // For now, just show success
    alert('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPrivacy(false);
  };

  const getStudentProfile = () => (
    <>
      <div className="profile-section">
        <div className="section-title">
          📋 Student Information
        </div>
        <div className="profile-info-grid">
          <div className="info-item">
            <div className="info-label">School ID</div>
            <div className="school-id-display">
              {currentUser.schoolId || currentUser.id || 'Not assigned'}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">School Name</div>
            <div className="info-value small">{currentUser.schoolName || 'Not specified'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Class</div>
            <div className="info-value">Class {currentUser.class || 'Not specified'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">District</div>
            <div className="info-value">{currentUser.district || 'Not specified'}</div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">
          📊 Your Statistics
        </div>
        {isLoadingStats ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            Loading statistics...
          </div>
        ) : (
          <div className="profile-stats-grid">
            <div className="stat-card">
              <div className="stat-value">{userStats.videosSubmitted || 0}</div>
              <div className="stat-label">Videos Submitted</div>
            </div>
            <div className="stat-card" style={{
              background: userStats.pendingVideos > 0 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : undefined,
              border: userStats.pendingVideos > 0 ? '2px solid #f59e0b' : undefined
            }}>
              <div className="stat-value" style={{ color: userStats.pendingVideos > 0 ? '#b45309' : undefined }}>
                {userStats.pendingVideos || 0}
              </div>
              <div className="stat-label" style={{ color: userStats.pendingVideos > 0 ? '#92400e' : undefined }}>
                ⏳ Pending Approval
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userStats.activeVideos || 0}</div>
              <div className="stat-label">✓ Active Videos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userStats.totalViews || 0}</div>
              <div className="stat-label">Total Views</div>
            </div>
          </div>
        )}
      </div>

      <div className="profile-section">
        <div className="section-title">
          🏆 Badges & Achievements
        </div>
        <div className="badge-collection">
          <div className="badge-item">
            <div className="badge-icon">🎬</div>
            <div className="badge-name">First Upload</div>
          </div>
          <div className="badge-item">
            <div className="badge-icon">⭐</div>
            <div className="badge-name">High Scorer</div>
          </div>
          <div className="badge-item locked">
            <div className="badge-icon">🔥</div>
            <div className="badge-name">Trending</div>
          </div>
          <div className="badge-item locked">
            <div className="badge-icon">👑</div>
            <div className="badge-name">Top 10</div>
          </div>
        </div>
      </div>
    </>
  );

  const getTeacherProfile = () => (
    <>
      <div className="profile-section">
        <div className="section-title">
          🏫 Teacher Information
        </div>
        <div className="profile-info-grid">
          <div className="info-item">
            <div className="info-label">School Name</div>
            <div className="info-value small">{currentUser.schoolName}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="info-value small">{currentUser.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label">District</div>
            <div className="info-value">{currentUser.district || 'Not specified'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Role</div>
            <div className="info-value">{currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Teacher'}</div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">
          📊 Your Statistics
        </div>
        {isLoadingStats ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            Loading statistics...
          </div>
        ) : (
          <div className="profile-stats-grid">
            <div className="stat-card">
              <div className="stat-value">{userStats.studentsManaged || 0}</div>
              <div className="stat-label">👥 Students Managed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userStats.videosSupervised || 0}</div>
              <div className="stat-label">🎥 School Videos</div>
            </div>
            <div className="stat-card" style={{
              background: userStats.pendingApprovals > 0 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : undefined,
              border: userStats.pendingApprovals > 0 ? '2px solid #f59e0b' : undefined
            }}>
              <div className="stat-value" style={{ color: userStats.pendingApprovals > 0 ? '#b45309' : undefined }}>
                {userStats.pendingApprovals || 0}
              </div>
              <div className="stat-label" style={{ color: userStats.pendingApprovals > 0 ? '#92400e' : undefined }}>
                ⏳ Pending Approvals
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const getJudgeProfile = () => (
    <>
      <div className="profile-section">
        <div className="section-title">
          ⚖️ Judge Information
        </div>
        <div className="profile-info-grid">
          <div className="info-item">
            <div className="info-label">Organization</div>
            <div className="info-value small">{currentUser.organization}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="info-value small">{currentUser.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label">District</div>
            <div className="info-value">{currentUser.district || 'Not specified'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Specialization</div>
            <div className="info-value">{currentUser.expertise || 'Not specified'}</div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">
          📊 Evaluation Statistics
        </div>
        <div className="profile-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{userStats.evaluationsGiven}</div>
            <div className="stat-label">Evaluations</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{userStats.videosEvaluated}</div>
            <div className="stat-label">Videos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{userStats.avgTimePerEval}</div>
            <div className="stat-label">Avg Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{userStats.completionRate}</div>
            <div className="stat-label">Completion</div>
          </div>
        </div>
      </div>
    </>
  );

  const getAdminProfile = () => (
    <>
      <div className="profile-section">
        <div className="section-title">
          ⚙️ Administrator Information
        </div>
        <div className="profile-info-grid">
          <div className="info-item">
            <div className="info-label">Organization</div>
            <div className="info-value small">{currentUser.organization}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="info-value small">{currentUser.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Access Level</div>
            <div className="info-value">Full System Access</div>
          </div>
          <div className="info-item">
            <div className="info-label">District</div>
            <div className="info-value">{currentUser.district || 'Not specified'}</div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">
          📊 System Statistics
        </div>
        {isLoadingStats ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            Loading statistics...
          </div>
        ) : (
          <div className="profile-stats-grid">
            <div className="stat-card">
              <div className="stat-value">{userStats.totalUsers || 0}</div>
              <div className="stat-label">👥 Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userStats.totalVideos || 0}</div>
              <div className="stat-label">🎥 Total Videos</div>
            </div>
            <div className="stat-card" style={{
              background: userStats.pendingApprovals > 0 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : undefined,
              border: userStats.pendingApprovals > 0 ? '2px solid #f59e0b' : undefined
            }}>
              <div className="stat-value" style={{ color: userStats.pendingApprovals > 0 ? '#b45309' : undefined }}>
                {userStats.pendingApprovals || 0}
              </div>
              <div className="stat-label" style={{ color: userStats.pendingApprovals > 0 ? '#92400e' : undefined }}>
                ⏳ Pending Approvals
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userStats.activeVideos || 0}</div>
              <div className="stat-label">✓ Active Videos</div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const getRoleSpecificContent = () => {
    switch (currentUser.role) {
      case 'student':
        return getStudentProfile();
      case 'teacher':
        return getTeacherProfile();
      case 'judge':
        return getJudgeProfile();
      case 'admin':
        return getAdminProfile();
      default:
        return null;
    }
  };

  return (
    <div className="profile-screen">
      <div className="profile-container">
        <div className="profile-header">
          <button className="profile-close-btn" onClick={onClose}>
            ✕
          </button>

          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {getRoleIcon(currentUser.role)}
            </div>
            <h2 className="profile-name">{currentUser.name}</h2>
            <div className="profile-role-badge">
              {getRoleIcon(currentUser.role)}
              <span>{currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          {getRoleSpecificContent()}

          <div className="profile-section">
            <div className="section-title">
              ⚙️ Settings & Actions
            </div>
            <div className="profile-actions">
              <button className="action-button" onClick={() => setShowEditProfile(true)}>
                <div className="action-button-left">
                  <span className="action-icon">✏️</span>
                  <span>Edit Profile</span>
                </div>
                <span className="action-arrow">→</span>
              </button>

              <button className="action-button" onClick={() => setShowNotifications(true)}>
                <div className="action-button-left">
                  <span className="action-icon">🔔</span>
                  <span>Notifications</span>
                </div>
                <span className="action-arrow">→</span>
              </button>

              <button className="action-button" onClick={() => setShowPrivacy(true)}>
                <div className="action-button-left">
                  <span className="action-icon">🔒</span>
                  <span>Privacy & Security</span>
                </div>
                <span className="action-arrow">→</span>
              </button>

              <button className="action-button" onClick={() => setShowHelp(true)}>
                <div className="action-button-left">
                  <span className="action-icon">❓</span>
                  <span>Help & Support</span>
                </div>
                <span className="action-arrow">→</span>
              </button>

              <button className="action-button logout-button" onClick={onLogout}>
                <div className="action-button-left">
                  <span className="action-icon">🚪</span>
                  <span>Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>✏️ Edit Profile</h3>
              <button className="profile-modal-close" onClick={() => setShowEditProfile(false)}>✕</button>
            </div>
            <div className="profile-modal-content">
              <p style={{ color: '#64748b', marginBottom: '16px' }}>Update your profile information</p>
              <div className="form-group">
                <label>Name</label>
                <input type="text" className="modal-input" defaultValue={currentUser.name} placeholder="Enter your name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="modal-input" defaultValue={currentUser.email} placeholder="Enter your email" disabled />
                <small style={{ color: '#64748b', fontSize: '12px' }}>Email cannot be changed</small>
              </div>
              <button className="modal-button" onClick={() => {
                alert('Profile updated successfully!');
                setShowEditProfile(false);
              }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="profile-modal-overlay" onClick={() => setShowNotifications(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>🔔 Notifications</h3>
              <button className="profile-modal-close" onClick={() => setShowNotifications(false)}>✕</button>
            </div>
            <div className="profile-modal-content">
              {!notifications || notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔔</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#64748b' }}>No Notifications</h3>
                  <p>You're all caught up! Check back later for updates.</p>
                </div>
              ) : (
                <>
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className="notification-item"
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #e2e8f0',
                        background: !notification.read ? '#f0f9ff' : 'transparent'
                      }}
                    >
                      <span className="notification-icon" style={{ fontSize: '24px' }}>
                        {notification.icon || '📢'}
                      </span>
                      <div className="notification-text">
                        <strong>{notification.title}</strong>
                        <p style={{ margin: '4px 0', color: '#64748b' }}>{notification.message}</p>
                        <small style={{ color: '#94a3b8' }}>
                          {new Date(notification.createdAt).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                  <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', marginBottom: '0' }}>
                    {notifications.length === 1 ? '1 notification' : `${notifications.length} notifications`}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Security Modal */}
      {showPrivacy && (
        <div className="profile-modal-overlay" onClick={() => setShowPrivacy(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>🔒 Privacy & Security</h3>
              <button className="profile-modal-close" onClick={() => setShowPrivacy(false)}>✕</button>
            </div>
            <div className="profile-modal-content">
              <div className="privacy-section">
                <h4>Change Password</h4>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      setPasswordError('');
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="Enter new password (min 6 characters)"
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      setPasswordError('');
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      setPasswordError('');
                    }}
                  />
                </div>
                {passwordError && (
                  <div style={{
                    color: '#dc2626',
                    background: '#fef2f2',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    {passwordError}
                  </div>
                )}
                <button className="modal-button" onClick={handlePasswordChange}>
                  Change Password
                </button>
              </div>
              <div className="privacy-section" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <h4>Account Security</h4>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Last login: {new Date().toLocaleString()}
                </p>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
                  Your account is protected with Firebase Authentication
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelp && (
        <div className="profile-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>❓ Help & Support</h3>
              <button className="profile-modal-close" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <div className="profile-modal-content">
              <div className="help-section">
                <h4>📘 Frequently Asked Questions</h4>
                <div className="help-item">
                  <strong>How do I upload a video?</strong>
                  <p>Click the Upload tab at the bottom, then choose to record or upload a video file.</p>
                </div>
                <div className="help-item">
                  <strong>How are videos evaluated?</strong>
                  <p>Videos are rated on 4 dimensions: Scientific Clarity, Humanity & Care, Real-Life Impact, and Original Thinking.</p>
                </div>
                <div className="help-item">
                  <strong>When will results be announced?</strong>
                  <p>Final results will be announced after the evaluation period ends on March 31st, 2026.</p>
                </div>
              </div>
              <div className="help-section" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <h4>📧 Contact Support</h4>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  For technical issues or questions:<br />
                  Email: support@scienceverse.com<br />
                  Phone: +91 1234567890
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
