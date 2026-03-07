import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const [updateBanner, setUpdateBanner] = useState(null); // { countdown } when a new build is detected

  // Videos state
  const [videos, setVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Evaluation state
  const [showEvaluationPanel, setShowEvaluationPanel] = useState(false);
  const [showEvaluationHistory, setShowEvaluationHistory] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [evaluations] = useState([]);

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
  const [showAllNotifications, setShowAllNotifications] = useState(false);
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

  // ─── Update & Force-Logout helpers ───────────────────────────────────────────

  // Countdown banner → logout → clear → store survival keys in sessionStorage → reload
  // Uses bundleHash as the processed-ID so clock-drift can't cause re-trigger loops.
  const startForceLogout = (message, bundleHash) => {
    setUpdateBanner({ text: message, secs: 5 });
    let secs = 5;
    const tick = setInterval(() => {
      secs -= 1;
      setUpdateBanner({ text: message, secs });
      if (secs <= 0) {
        clearInterval(tick);
        (async () => {
          try { await logout(); } catch (_) {}
          localStorage.clear();
          sessionStorage.clear();
          // Re-set AFTER clearing so these survive the reload (sessionStorage persists across reload)
          if (bundleHash) sessionStorage.setItem('processedUpdateId', bundleHash);
          sessionStorage.setItem('pendingUpdateNotif', JSON.stringify({
            message, time: new Date().toISOString()
          }));
          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(n => caches.delete(n)));
          }
          window.location.reload(true);
        })();
      }
    }, 1000);
  };

  // Detect new build on mount (runs before auth — Firestore write happens after login)
  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch('/asset-manifest.json?t=' + Date.now());
        const manifest = await res.json();
        const currentBundle = manifest.files?.['main.js'];
        if (!currentBundle) return;

        const cachedBundle = localStorage.getItem('appBundle');
        if (cachedBundle && cachedBundle !== currentBundle) {
          startForceLogout('System update — logging out to apply bug fixes', currentBundle);
          return;
        }
        localStorage.setItem('appBundle', currentBundle);
      } catch (e) {
        console.log('[ScienceVerse] Update check skipped:', e);
      }
    };
    checkForUpdate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After login: signal other sessions via Firestore + poll for force-logout from others
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkForceLogout = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'systemUpdate'));
        if (!snap.exists()) return;

        const data = snap.data();
        if (!data.bundleHash) return;

        // Use bundle hash as processed-ID — immune to clock drift
        const processedId = sessionStorage.getItem('processedUpdateId')
          || localStorage.getItem('processedUpdateId');
        if (processedId === data.bundleHash) return; // Already handled this update

        const currentBundle = localStorage.getItem('appBundle');
        if (currentBundle === data.bundleHash) return; // We're already on this version

        // Mark as processed before triggering to prevent loops
        sessionStorage.setItem('processedUpdateId', data.bundleHash);
        localStorage.setItem('processedUpdateId', data.bundleHash);
        startForceLogout(
          data.message || 'System update — logging out to apply bug fixes',
          data.bundleHash
        );
      } catch (e) {
        console.log('[ScienceVerse] Force-logout check skipped:', e);
      }
    };

    // After login: write current bundle to Firestore if it differs (signals other sessions)
    const signalOtherSessions = async () => {
      try {
        const currentBundle = localStorage.getItem('appBundle');
        if (!currentBundle) return;
        const snap = await getDoc(doc(db, 'settings', 'systemUpdate'));
        if (snap.exists() && snap.data().bundleHash === currentBundle) return;
        await setDoc(doc(db, 'settings', 'systemUpdate'), {
          bundleHash: currentBundle,
          forceLogoutAt: serverTimestamp(),
          message: 'System update applied — bug fixes deployed.'
        }, { merge: true });
      } catch (e) {
        console.log('[ScienceVerse] Could not signal other sessions:', e);
      }
    };

    signalOtherSessions();
    checkForceLogout();
    const interval = setInterval(checkForceLogout, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────────

  // Pause all videos when any modal is open (admin panel, profile, upload, etc.)
  const isAnyModalOpen = showAdminPanel || showProfileScreen || showUploadScreen || showDiscoveryScreen || showEvaluationPanel || showEvaluationHistory || showAllNotifications || showStudentSearch;

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
      setNotifications([]);
      setUnreadCount(0);
    }

    // 1. Inject system notification stored in sessionStorage (current user, just reloaded)
    const pendingNotif = sessionStorage.getItem('pendingUpdateNotif');
    if (pendingNotif) {
      try {
        const { message, time } = JSON.parse(pendingNotif);
        sessionStorage.removeItem('pendingUpdateNotif');
        const systemNotif = {
          id: `system-update-${new Date(time).getTime()}`,
          icon: '🔧',
          title: 'System Update',
          message,
          createdAt: new Date(time),
          read: false,
          isSystem: true,
        };
        setNotifications(prev => [systemNotif, ...prev.filter(n => !n.isSystem)]);
        setUnreadCount(prev => prev + 1);
      } catch (_) {}
    } else {
      // 2. For other sessions: check Firestore for a recent system notification
      try {
        const snap = await getDoc(doc(db, 'settings', 'systemUpdate'));
        if (snap.exists()) {
          const data = snap.data();
          const seenId = localStorage.getItem('lastSeenSystemUpdate');
          if (data.message && data.bundleHash && data.bundleHash !== seenId) {
            localStorage.setItem('lastSeenSystemUpdate', data.bundleHash);
            const ts = data.forceLogoutAt?.toDate?.() || new Date();
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (ts > sevenDaysAgo) {
              const systemNotif = {
                id: `system-update-${ts.getTime()}`,
                icon: '🔧',
                title: 'System Update',
                message: data.message,
                createdAt: ts,
                read: false,
                isSystem: true,
              };
              setNotifications(prev => [systemNotif, ...prev.filter(n => !n.isSystem)]);
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      } catch (_) {}
    }
  };

  // Convert a Firestore Timestamp (or any date-like value) to an ISO string.
  // Returns null if the value is missing or unreadable.
  const toISOString = (val) => {
    if (!val) return null;
    try {
      const d = val.toDate ? val.toDate() : new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      return null;
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
      const videosList = snapshot.docs.map(doc => {
        const data = doc.data();

        // Log raw Firestore fields once (first video) so field names are visible in browser console
        if (snapshot.docs[0].id === doc.id) {
          console.log('[ScienceVerse] First video raw Firestore fields:', Object.keys(data));
          console.log('[ScienceVerse] First video data sample:', {
            uploaderSchool: data.uploaderSchool,
            schoolName: data.schoolName,
            duration: data.duration,
            uploadedAt: data.uploadedAt,
            createdAt: data.createdAt,
          });
        }

        return {
          ...data,
          id: doc.id,
          videoId: data.videoId,
          fileUrl: data.videoUrl,
          // Normalise school name — field was 'uploaderSchool' in UploadScreen
          schoolName: data.uploaderSchool || data.schoolName || '',
          // Convert Firestore Timestamps to ISO strings so components use plain strings
          uploadedAt: toISOString(data.uploadedAt) || toISOString(data.createdAt),
          createdAt: toISOString(data.createdAt),
          approvedAt: toISOString(data.approvedAt),
          rejectedAt: toISOString(data.rejectedAt),
        };
      });
      setVideos(videosList);
      console.log('[ScienceVerse] Loaded videos:', videosList.length);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
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
    loadVideos();
    loadNotifications();
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
    // Reload videos so updated aggregate scores are reflected immediately
    loadVideos();
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

  // Update notification banner (shown above everything, including login screen)
  const UpdateBanner = updateBanner !== null ? (
    <div className="update-banner">
      🔄 {updateBanner.text} — logging out in <strong>{updateBanner.secs}s</strong>. Please wait...
    </div>
  ) : null;

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {UpdateBanner}
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="app">
      {/* Update Banner */}
      {UpdateBanner}

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
            <button
              className="logout-button-header"
              onClick={handleLogout}
              title="Logout"
            >
              <span>🚪</span>
              <span className="logout-label">Logout</span>
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
                      setShowAllNotifications(true);
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
                {currentUser?.role === 'judge' && (
                  <p style={{ marginTop: '12px', color: '#94a3b8', fontSize: '14px' }}>
                    💡 As a judge, you'll be able to evaluate videos once they are uploaded and assigned to you.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <VideoFeed
              videos={videos}
              currentUser={currentUser}
              onEvaluate={handleEvaluate}
              onViewEvaluations={handleViewEvaluations}
              evaluations={evaluations}
              initialVideoId={selectedVideoId}
              paused={isAnyModalOpen}
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
          videoId={selectedVideo.videoId || selectedVideo.id}
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

      {/* All Notifications Modal */}
      {showAllNotifications && (
        <div className="notifications-modal-overlay" onClick={() => setShowAllNotifications(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 700 }}>
                🔔 All Notifications
              </h3>
              <button onClick={() => setShowAllNotifications(false)} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', color: 'white', fontSize: '18px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div key={notification.id} style={{
                    display: 'flex', gap: '12px', padding: '16px 20px',
                    borderBottom: '1px solid #e2e8f0',
                    background: !notification.read ? '#f0f9ff' : 'transparent'
                  }}>
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{notification.icon || '📢'}</span>
                    <div>
                      <strong style={{ display: 'block', color: '#1e293b', fontSize: '14px' }}>
                        {notification.title}
                      </strong>
                      <p style={{ margin: '4px 0', color: '#64748b', fontSize: '13px' }}>
                        {notification.message}
                      </p>
                      <small style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {getTimeAgo(notification.createdAt)}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
