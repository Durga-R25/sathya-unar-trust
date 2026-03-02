import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getCurrentUser, logout as authLogout } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * UserContext - Provides current user information and authentication state
 * Phase A & B: Real Firebase Authentication with Role-Based Access Control
 */

const UserContext = createContext();

// Session timeout: 8 hours of inactivity (module-level constant, never recreated)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Session timeout effect — depends ONLY on isAuthenticated.
  // Previously had `lastActivity` in the deps which caused the interval to be
  // cleared and restarted on every user event (every click/scroll), so the
  // timeout never fired. Now the interval runs once and stays running.
  useEffect(() => {
    if (!isAuthenticated) return;

    // updateActivity writes ONLY to localStorage — no React state, no re-render
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Force logout: clears local state immediately so the UI responds at once.
    // Firebase signOut runs in the background — if it fails, local state is
    // already cleared, which is the correct UX for a timeout scenario.
    const doLogout = () => {
      authLogout().catch(err => console.error('Firebase signOut error during timeout:', err));
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('lastActivity');
    };

    const checkTimeout = () => {
      const stored = localStorage.getItem('lastActivity');
      if (!stored) {
        // No activity record — can't determine last active time, force logout
        console.log('No activity record — logging out');
        doLogout();
        return;
      }
      const elapsed = Date.now() - parseInt(stored, 10);
      if (elapsed > SESSION_TIMEOUT) {
        console.log('Session timeout — logging out due to inactivity');
        doLogout();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Check every minute — this interval is created ONCE on login and runs
    // uninterrupted until logout (no more per-event teardown/restart)
    const intervalId = setInterval(checkTimeout, 60000);

    // Check immediately when tab becomes visible (handles mobile background suspension)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkTimeout();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated]); // ← only isAuthenticated, not lastActivity

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // On app load / page refresh: check if the persisted session has timed out
          const storedActivity = localStorage.getItem('lastActivity');
          if (storedActivity) {
            const elapsed = Date.now() - parseInt(storedActivity, 10);
            if (elapsed > SESSION_TIMEOUT) {
              console.log('Session expired on reload — logging out');
              await authLogout();
              setCurrentUser(null);
              setIsAuthenticated(false);
              setLoading(false);
              localStorage.removeItem('lastActivity');
              return;
            }
          } else {
            // No record at all (cleared storage, incognito, first login):
            // stamp now so the timeout clock starts from this moment
            localStorage.setItem('lastActivity', Date.now().toString());
          }

          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser({
              ...userDoc.data(),
              uid: firebaseUser.uid,   // always use Firebase Auth UID, never the stored copy
              email: firebaseUser.email
            });
            setIsAuthenticated(true);
          } else {
            console.error('User document not found in Firestore');
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('lastActivity');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login — stamp lastActivity so the timeout clock starts immediately on login
  const login = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  // Logout — clears local state immediately; Firebase signOut in background
  const logout = () => {
    authLogout().catch(err => console.error('Logout error:', err));
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('lastActivity');
  };

  // Refresh user data from Firestore (used after profile update)
  const refreshUserData = async () => {
    const firebaseUser = getCurrentUser();
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser({
            ...userDoc.data(),
            uid: firebaseUser.uid,
            email: firebaseUser.email
          });
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUserData
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
