import React, { useState } from 'react';
import CompetitionSettings from './CompetitionSettings';
import CategoryManager from './CategoryManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import DataExport from './DataExport';
import JudgeAssignments from './JudgeAssignments';
import SchoolsManagement from './SchoolsManagement';
import StudentSearch from './StudentSearch';
import TeacherSearch from './TeacherSearch';
import JudgeSearch from './JudgeSearch';
import VideoApproval from './VideoApproval';
import BadgesAchievements from './BadgesAchievements';
import './AdminPanel.css';

/**
 * AdminPanel Component
 * Main admin interface for competition management
 * Restricted to admin users only
 */
const AdminPanel = ({ currentUser, videos, evaluations, onClose }) => {
  // Check if user is admin or teacher
  const userRole = currentUser.role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';

  // Teachers start at approvals tab, admins at dashboard
  const [activeTab, setActiveTab] = useState(isTeacher ? 'approvals' : 'dashboard');
  const [userSubTab, setUserSubTab] = useState('teachers');

  if (!isAdmin && !isTeacher) {
    return (
      <div className="admin-panel-overlay">
        <div className="admin-panel">
          <div className="access-denied">
            <span className="denied-icon">🔒</span>
            <h2>Access Denied</h2>
            <p>Only administrators and teachers can access this panel.</p>
            <button className="close-button-large" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Different tabs for teachers vs admins
  const tabs = isTeacher ? [
    { id: 'approvals', label: 'Video Approvals', icon: '✓' },
    { id: 'students', label: 'My Students', icon: '🎓' },
    { id: 'badges', label: 'Badges & Achievements', icon: '🏆' }
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'approvals', label: 'Video Approvals', icon: '✓' },
    { id: 'badges', label: 'Badges & Achievements', icon: '🏆' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'schools', label: 'Schools', icon: '🏫' },
    { id: 'assignments', label: 'Assignments', icon: '📋' },
    { id: 'competition', label: 'Competition', icon: '⚙️' },
    { id: 'categories', label: 'Categories', icon: '📚' },
    { id: 'export', label: 'Export', icon: '📥' }
  ];

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-header">
          <div className="header-left">
            <h2 className="admin-title">
              {isTeacher ? '👨‍🏫 Teacher Dashboard' : '👨‍💼 Admin Control Panel'}
            </h2>
            <span className="admin-badge">{isTeacher ? 'Teacher' : 'Administrator'}</span>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <AnalyticsDashboard
              videos={videos}
              evaluations={evaluations}
            />
          )}

          {activeTab === 'approvals' && (
            <VideoApproval currentUser={currentUser} />
          )}

          {activeTab === 'badges' && (
            <BadgesAchievements currentUser={currentUser} />
          )}

          {activeTab === 'students' && isTeacher && (
            <StudentSearch currentUser={currentUser} />
          )}

          {activeTab === 'users' && (
            <div>
              {/* Sub-tabs for Users */}
              <div className="sub-tabs">
                <button
                  className={`sub-tab ${userSubTab === 'teachers' ? 'active' : ''}`}
                  onClick={() => setUserSubTab('teachers')}
                >
                  👨‍🏫 Teachers
                </button>
                <button
                  className={`sub-tab ${userSubTab === 'judges' ? 'active' : ''}`}
                  onClick={() => setUserSubTab('judges')}
                >
                  ⚖️ Judges
                </button>
                <button
                  className={`sub-tab ${userSubTab === 'students' ? 'active' : ''}`}
                  onClick={() => setUserSubTab('students')}
                >
                  🎓 Students
                </button>
              </div>

              {/* Sub-tab Content */}
              {userSubTab === 'teachers' && (
                <TeacherSearch currentUser={currentUser} />
              )}

              {userSubTab === 'judges' && (
                <JudgeSearch currentUser={currentUser} />
              )}

              {userSubTab === 'students' && (
                <StudentSearch currentUser={currentUser} />
              )}
            </div>
          )}

          {activeTab === 'schools' && (
            <SchoolsManagement />
          )}

          {activeTab === 'assignments' && (
            <JudgeAssignments />
          )}

          {activeTab === 'competition' && (
            <CompetitionSettings />
          )}

          {activeTab === 'categories' && (
            <CategoryManager />
          )}

          {activeTab === 'export' && (
            <DataExport
              videos={videos}
              evaluations={evaluations}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
