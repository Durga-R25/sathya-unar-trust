import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './config/firebase';
import { UserProvider, useUser } from './context/UserContext';
import { canUploadVideo, canAccessAdminPanel } from './services/authService';
import VideoFeed from './components/VideoFeed';
import Navigation from './components/Navigation';
import EvaluationPanel from './components/EvaluationPanel';
import EvaluationHistory from './components/EvaluationHistory';
import UploadScreen from './components/UploadScreen';
import DiscoveryScreen from './components/DiscoveryScreen';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';
import StudentSearch from './components/StudentSearch';
import { mockEvaluations, getEvaluationsForVideo, addEvaluation } from './data/mockEvaluations';
import './App.css';

/**
 * Main App Component
 * Phase 1: Core video player with vertical swipe feed ✓
 * Phase 2: Evaluation system with 4-dimension rating ✓
 * Phase 3: Upload flow (camera recording & file picker) ✓
 * Phase 4: Discovery & Search (filters, leaderboards) ✓
 * Phase 5: Admin configuration panel ✓
 *
 * Future phases:
 * - Authentication (Phase 6)
 * - Firebase integration (Phase 7)
 */

const AppContent = () => {
  const { currentUser, isAuthenticated, login, logout } = useUser();
  const [currentTab, setCurrentTab] = useState('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Videos state
  const [videos, setVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Evaluation state
  const [showEvaluationPanel, setShowEvaluationPanel] = useState(false);
  const [showEvaluationHistory, setShowEvaluationHistory] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [evaluations, setEvaluations] = useState(mockEvaluations);

  // Upload state
  const [showUploadScreen, setShowUploadScreen] = useState(false);

  // Discovery state
  const [showDiscoveryScreen, setShowDiscoveryScreen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  // Admin panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Profile screen state
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  // Student search screen state (for teachers)
  const [showStudentSearch, setShowStudentSearch] = useState(false);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Debug: Track showStudentSearch state changes
  React.useEffect(() => {
    console.log('*** showStudentSearch state changed to:', showStudentSearch);
  }, [showStudentSearch]);

  // Load videos from Firestore
  useEffect(() => {
    if (isAuthenticated) {
      loadVideos();
      loadNotifications();
    }
  }, [isAuthenticated]);

  // Load notifications from Firestore
  const loadNotifications = async () => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(notificationsQuery);
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setNotifications(notificationsList);

      // Count unread notifications
      const unread = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // If notifications collection doesn't exist or has no data, just use empty array
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const loadVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const videosQuery = query(
        collection(db, 'videos'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(videosQuery);
      const videosList = snapshot.docs.map(doc => ({
        id: doc.id,
        videoId: doc.data().videoId,
        fileUrl: doc.data().videoUrl, // Map videoUrl to fileUrl for VideoPlayer compatibility
        ...doc.data()
      }));
      setVideos(videosList);
      console.log('Loaded videos from Firestore:', videosList.length);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]); // Set empty array on error
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleTabChange = (tab) => {
    // Handle upload tab (Phase B.1 - Students, Teachers, and Admins)
    if (tab === 'upload') {
      if (!canUploadVideo(currentUser)) {
        const role = currentUser?.role?.toLowerCase();
        if (role === 'judge') {
          showToast('Access Restricted: Judges can evaluate videos but cannot upload content.');
        } else {
          showToast('Access Restricted: You do not have permission to upload videos.');
        }
        return;
      }
      setShowUploadScreen(true);
      return;
    }

    // Handle discover tab
    if (tab === 'discover') {
      setShowDiscoveryScreen(true);
      return;
    }

    // Handle profile tab
    if (tab === 'profile') {
      setShowProfileScreen(true);
      return;
    }

    // Handle more tab (admin panel for admin and teacher)
    if (tab === 'more') {
      console.log('=== MORE TAB CLICKED ===');
      console.log('Current user:', currentUser);
      console.log('User role:', currentUser?.role);
      const role = currentUser?.role?.toLowerCase();
      console.log('Role (lowercase):', role);

      // Teachers and admins can access the admin panel
      if (role === 'teacher' || canAccessAdminPanel(currentUser)) {
        console.log('✓ Teacher/Admin detected - showing AdminPanel');
        setShowAdminPanel(true);
        return;
      }

      // Others are denied
      console.log('✗ Access denied - not admin or teacher');
      if (role === 'judge') {
        showToast('Access Restricted: Administrative features are only available to teachers and administrators.');
      } else {
        showToast('Access Restricted: This panel is only accessible to teachers and administrators.');
      }
      return;
    }

    // Only set currentTab for actual content tabs (home, etc.)
    setCurrentTab(tab);
  };

  const handleLoginSuccess = (userData) => {
    login(userData);
    showToast(`Welcome, ${userData.name}!`);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      setShowProfileScreen(false);
      setCurrentTab('home');
      showToast('Logged out successfully');
    }
  };

  const handleUploadComplete = (uploadData) => {
    console.log('Upload complete:', uploadData);
    // Reload videos to show the newly uploaded one (if approved)
    loadVideos();
    showToast('Video uploaded successfully!');
  };

  const handleEvaluate = (video) => {
    setSelectedVideo(video);
    setShowEvaluationPanel(true);
  };

  const handleViewEvaluations = (video) => {
    setSelectedVideo(video);
    setShowEvaluationHistory(true);
  };

  const handleEvaluationSubmit = (evaluation) => {
    // Add evaluation to state
    addEvaluation(evaluation.videoId, evaluation);
    setEvaluations({ ...evaluations });

    // In Phase 7, this will update Firebase and trigger re-calculation
    console.log('Evaluation submitted:', evaluation);
  };


  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="offline-banner">
          📵 You're offline. Some features may be unavailable.
        </div>
      )}

      {/* Top Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🔬</span>
            <span className="logo-text">ScienceVerse</span>
          </div>
          <div className="header-actions">
            <img src="/logos/SUS Logo.jpg" alt="SUS" className="header-org-logo" />
            <button className="notification-button" onClick={() => setShowNotifications(!showNotifications)}>
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h4>Notifications</h4>
                  <button className="close-notifications" onClick={() => setShowNotifications(false)}>✕</button>
                </div>
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(notification => (
                      <div key={notification.id} className="notification-item" style={{
                        background: !notification.read ? '#f0f9ff' : 'transparent'
                      }}>
                        <span className="notification-icon">{notification.icon || '📢'}</span>
                        <div className="notification-content">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <small>{getTimeAgo(notification.createdAt)}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="notifications-footer">
                    <button className="view-all-btn" onClick={() => {
                      setShowNotifications(false);
                      setShowProfileScreen(true);
                    }}>
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {currentTab === 'home' ? (
          isLoadingVideos ? (
            <div className="placeholder-screen">
              <div className="placeholder-content">
                <div className="loading-spinner"></div>
                <h2>Loading Videos...</h2>
                <p>Please wait while we fetch the latest content</p>
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="placeholder-screen">
              <div className="placeholder-content">
                <span className="placeholder-icon">🎥</span>
                <h2>No Videos Yet</h2>
                <p>Be the first to upload a video!</p>
              </div>
            </div>
          ) : (
            <VideoFeed
              videos={videos}
              onEvaluate={handleEvaluate}
              onViewEvaluations={handleViewEvaluations}
              evaluations={evaluations}
              initialVideoId={selectedVideoId}
            />
          )
        ) : (
          <div className="placeholder-screen">
            <div className="placeholder-content">
              <span className="placeholder-icon">🚧</span>
              <h2>Coming Soon</h2>
              <p>This feature will be available in the next phase</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation currentTab={currentTab} onTabChange={handleTabChange} />

      {/* Evaluation Panel Modal */}
      {showEvaluationPanel && selectedVideo && (
        <EvaluationPanel
          video={selectedVideo}
          currentUser={currentUser}
          onClose={() => setShowEvaluationPanel(false)}
          onSubmit={handleEvaluationSubmit}
        />
      )}

      {/* Evaluation History Modal */}
      {showEvaluationHistory && selectedVideo && (
        <EvaluationHistory
          evaluations={getEvaluationsForVideo(selectedVideo.videoId)}
          onClose={() => setShowEvaluationHistory(false)}
        />
      )}

      {/* Upload Screen Modal */}
      {showUploadScreen && (
        <UploadScreen
          currentUser={currentUser}
          onClose={() => {
            setShowUploadScreen(false);
            setCurrentTab('home');
          }}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Discovery Screen Modal */}
      {showDiscoveryScreen && (
        <DiscoveryScreen
          onVideoSelect={(video) => {
            setShowDiscoveryScreen(false);
            setSelectedVideoId(video.videoId);
            setCurrentTab('home');
            showToast(`Playing: ${video.title}`);
          }}
          onClose={() => {
            setShowDiscoveryScreen(false);
            setCurrentTab('home');
          }}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel
          currentUser={currentUser}
          videos={videos}
          evaluations={evaluations}
          onClose={() => {
            setShowAdminPanel(false);
            setCurrentTab('home');
          }}
        />
      )}

      {/* Profile Screen Modal */}
      {showProfileScreen && (
        <ProfileScreen
          currentUser={currentUser}
          videos={videos}
          evaluations={evaluations}
          notifications={notifications}
          onClose={() => {
            setShowProfileScreen(false);
            setCurrentTab('home');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Student Search Screen Modal (Teachers only) */}
      {showStudentSearch && (
        <div className="modal-overlay">
          <div className="modal-container student-management-modal">
            <div className="modal-header">
              <h2>Student Search</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowStudentSearch(false);
                  setCurrentTab('home');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <StudentSearch currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Teachers */}
      {currentUser.role && currentUser.role.toLowerCase() === 'teacher' && !showStudentSearch && (
        <button
          className="fab"
          onClick={() => setShowStudentSearch(true)}
          title="Search Students"
        >
          🔍
        </button>
      )}
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
