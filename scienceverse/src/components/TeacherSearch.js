import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import './StudentSearch.css';

/**
 * TeacherSearch Component
 * Search-based teacher management - same design as StudentSearch
 * Search by: Name, Email
 */
const TeacherSearch = ({ currentUser }) => {
  const [searchType, setSearchType] = useState('name'); // name, email
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolName: '',
    district: '',
    state: ''
  });

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  // Check if current user can modify a teacher
  const canModifyTeacher = (teacher) => {
    if (isAdmin) return true;
    // Only admin created by check
    if (isAdmin && teacher.createdBy === currentUser.uid) return true;
    return false;
  };

  // Search teachers
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);

    try {
      let results = [];
      const normalizedQuery = searchQuery.trim().toLowerCase().replace(/\*/g, '');

      if (searchType === 'name') {
        // Search by name (partial match)
        const teachersSnapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'teacher'))
        );

        teachersSnapshot.forEach(doc => {
          const data = doc.data();
          const name = data.name?.toLowerCase() || '';

          if (name.includes(normalizedQuery) || normalizedQuery.split(' ').some(part => name.includes(part))) {
            results.push({
              id: doc.id,
              ...data,
              status: 'activated'
            });
          }
        });

      } else if (searchType === 'email') {
        // Search by email (partial match)
        const teachersSnapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'teacher'))
        );

        teachersSnapshot.forEach(doc => {
          const data = doc.data();
          const email = data.email?.toLowerCase() || '';

          if (email.includes(normalizedQuery)) {
            results.push({
              id: doc.id,
              ...data,
              status: 'activated'
            });
          }
        });
      }

      setSearchResults(results);

      if (results.length === 0) {
        setError(`No teachers found matching "${searchQuery}"`);
      }

    } catch (error) {
      console.error('Error searching teachers:', error);
      setError('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const teachersSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'teacher'))
      );

      let myTeachers = 0;
      if (isAdmin) {
        teachersSnapshot.forEach(doc => {
          if (doc.data().createdBy === currentUser.uid) myTeachers++;
        });
      }

      setStats({
        total: teachersSnapshot.size,
        myTeachers: myTeachers
      });
      setShowStats(true);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Handle create teacher
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!createFormData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!createFormData.email.trim() || !createFormData.email.includes('@')) {
      setError('Valid email is required');
      return;
    }
    if (!createFormData.password || createFormData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!createFormData.schoolName.trim()) {
      setError('School name is required');
      return;
    }

    setIsCreating(true);
    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        createFormData.email.trim(),
        createFormData.password
      );
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        schoolName: createFormData.schoolName.trim(),
        district: createFormData.district.trim() || '',
        state: createFormData.state.trim() || '',
        role: 'teacher',
        createdAt: new Date(),
        createdBy: currentUser.uid
      });

      alert('✅ Teacher account created successfully!');
      setShowCreateForm(false);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        schoolName: '',
        district: '',
        state: ''
      });

      // Reload stats
      if (showStats) {
        loadStats();
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else {
        setError('Failed to create teacher: ' + error.message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Handle delete
  const handleDelete = async (teacher) => {
    if (!window.confirm(`Delete teacher "${teacher.name}"? This cannot be undone.`)) {
      return;
    }

    const confirmText = window.prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      await deleteDoc(doc(db, 'users', teacher.id));
      setSearchResults(searchResults.filter(t => t.id !== teacher.id));
      alert('Teacher deleted successfully');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Delete failed: ' + error.message);
    }
  };

  return (
    <div className="student-search-container">
      <div className="search-header">
        <h2>👨‍🏫 Teacher Search</h2>
        <p className="subtitle">Search for teachers by name or email</p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {isAdmin && (
          <button
            className="create-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? '✕ Cancel' : '➕ Create New Teacher'}
          </button>
        )}
        {!showStats ? (
          <button className="stats-button" onClick={loadStats}>
            📊 Show Statistics
          </button>
        ) : null}
      </div>

      {/* Quick Stats */}
      {showStats && (
        <div className="stats-card">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Teachers</div>
          </div>
          {isAdmin && (
            <div className="stat-item highlight">
              <div className="stat-value">{stats.myTeachers}</div>
              <div className="stat-label">Created by Me</div>
            </div>
          )}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="create-form-card" style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#10b981' }}>➕ Create New Teacher</h3>
          <form onSubmit={handleCreateTeacher}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Name *</label>
                <input
                  type="text"
                  className="search-input"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Email *</label>
                <input
                  type="email"
                  className="search-input"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Password *</label>
              <input
                type="password"
                className="search-input"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>School Name *</label>
              <input
                type="text"
                className="search-input"
                value={createFormData.schoolName}
                onChange={(e) => setCreateFormData({ ...createFormData, schoolName: e.target.value })}
                placeholder="School name"
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>District</label>
                <input
                  type="text"
                  className="search-input"
                  value={createFormData.district}
                  onChange={(e) => setCreateFormData({ ...createFormData, district: e.target.value })}
                  placeholder="District"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>State</label>
                <input
                  type="text"
                  className="search-input"
                  value={createFormData.state}
                  onChange={(e) => setCreateFormData({ ...createFormData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>
            <button
              type="submit"
              className="search-button"
              disabled={isCreating}
              style={{ width: '100%', padding: '14px' }}
            >
              {isCreating ? '⏳ Creating...' : '✓ Create Teacher Account'}
            </button>
          </form>
        </div>
      )}

      {/* Search Controls */}
      <div className="search-controls">
        <div className="search-type-selector">
          <label>Search by:</label>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder={
              searchType === 'name' ? 'Enter teacher name (supports partial match)' :
              'Enter email address (supports partial match)'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({searchResults.length})</h3>
          <div className="results-list">
            {searchResults.map((teacher) => {
              const canModify = canModifyTeacher(teacher);

              return (
                <div key={teacher.id} className="student-card">
                  <div className="student-card-header">
                    <div>
                      <h4>👨‍🏫 {teacher.name}</h4>
                      <div className="school-id">{teacher.email}</div>
                    </div>
                    <span className="status-badge activated role-teacher">
                      👨‍🏫 Teacher
                    </span>
                  </div>

                  <div className="student-card-body">
                    <div className="info-row">
                      <span className="label">Email:</span>
                      <span className="value">{teacher.email}</span>
                    </div>
                    {teacher.schoolName && (
                      <div className="info-row">
                        <span className="label">School:</span>
                        <span className="value">{teacher.schoolName}</span>
                      </div>
                    )}
                    {teacher.district && (
                      <div className="info-row">
                        <span className="label">District:</span>
                        <span className="value">{teacher.district}</span>
                      </div>
                    )}
                    {teacher.state && (
                      <div className="info-row">
                        <span className="label">State:</span>
                        <span className="value">{teacher.state}</span>
                      </div>
                    )}
                  </div>

                  <div className="student-card-actions">
                    {canModify ? (
                      <>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(teacher)}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    ) : (
                      <span className="no-permission">View Only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="help-text">
        <h4>💡 Search Tips:</h4>
        <ul>
          <li><strong>Name:</strong> Partial match - type any part of the name</li>
          <li><strong>Email:</strong> Partial match - search by email (e.g., "@gmail.com")</li>
          <li>Press <kbd>Enter</kbd> to search quickly</li>
          <li>Searches are case-insensitive</li>
        </ul>
      </div>
    </div>
  );
};

export default TeacherSearch;
