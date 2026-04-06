import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { deleteStudentAccount, updateStudentAccount } from '../services/authService';
import CreateStudentScreen from './CreateStudentScreen';
import './StudentSearch.css';

/**
 * StudentSearch Component
 * Search-based student management - more efficient for large datasets
 * Search by: School ID, Name, School Name
 */
const StudentSearch = ({ currentUser }) => {
  const [searchType, setSearchType] = useState('schoolId'); // schoolId, name, schoolName
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isTeacher = currentUser?.role?.toLowerCase() === 'teacher';

  // Check if current user can modify a student
  const canModifyStudent = (student) => {
    if (isAdmin) return true;
    if (isTeacher && student.createdBy === currentUser.uid) return true;
    if (isTeacher && student.teacherId === currentUser.uid) return true; // For pending activations
    return false;
  };

  // Search students
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
      const normalizedQuery = searchQuery.trim().toUpperCase().replace(/\*/g, '');

      if (searchType === 'schoolId') {
        // Search by School ID (supports partial matching with wildcards)
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'student'))
        );

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          const schoolId = data.schoolId?.toUpperCase() || '';

          // Check if matches (partial or full)
          if (schoolId.includes(normalizedQuery) || normalizedQuery.includes(schoolId.substring(0, 4))) {
            results.push({
              id: doc.id,
              ...data,
              status: 'activated',
              source: 'users'
            });
          }
        });

        // Search in pending activations (skip already-activated records)
        const pendingSnapshot = await getDocs(collection(db, 'pendingActivations'));

        pendingSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.activated) return;
          const schoolId = data.schoolId?.toUpperCase() || '';

          if (schoolId.includes(normalizedQuery) || normalizedQuery.includes(schoolId.substring(0, 4))) {
            results.push({
              id: doc.id,
              ...data,
              status: 'pending',
              source: 'pendingActivations'
            });
          }
        });

      } else if (searchType === 'name') {
        // Search by name (partial match with wildcard support)
        const normalizedQuery = searchQuery.toLowerCase().trim().replace(/\*/g, '');

        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'student'))
        );

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          const name = data.name?.toLowerCase() || '';

          // Flexible matching - checks if query is in name or name contains query
          if (name.includes(normalizedQuery) || normalizedQuery.split(' ').some(part => name.includes(part))) {
            results.push({
              id: doc.id,
              ...data,
              status: 'activated',
              source: 'users'
            });
          }
        });

        // Search pending activations (skip already-activated records)
        const pendingSnapshot = await getDocs(collection(db, 'pendingActivations'));

        pendingSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.activated) return;
          const name = data.name?.toLowerCase() || '';

          if (name.includes(normalizedQuery) || normalizedQuery.split(' ').some(part => name.includes(part))) {
            results.push({
              id: doc.id,
              ...data,
              status: 'pending',
              source: 'pendingActivations'
            });
          }
        });

      } else if (searchType === 'schoolName') {
        // Search by school name (wildcard support)
        const normalizedQuery = searchQuery.toLowerCase().trim().replace(/\*/g, '');

        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'student'))
        );

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          const schoolName = data.schoolName?.toLowerCase() || '';

          // Flexible matching - supports partial words
          if (schoolName.includes(normalizedQuery) || normalizedQuery.split(' ').some(part => schoolName.includes(part))) {
            results.push({
              id: doc.id,
              ...data,
              status: 'activated',
              source: 'users'
            });
          }
        });

        // Search pending activations (skip already-activated records)
        const pendingSnapshot = await getDocs(collection(db, 'pendingActivations'));

        pendingSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.activated) return;
          const schoolName = data.schoolName?.toLowerCase() || '';

          if (schoolName.includes(normalizedQuery) || normalizedQuery.split(' ').some(part => schoolName.includes(part))) {
            results.push({
              id: doc.id,
              ...data,
              status: 'pending',
              source: 'pendingActivations'
            });
          }
        });
      }

      setSearchResults(results);

      if (results.length === 0) {
        setError(`No students found matching "${searchQuery}"`);
      }

    } catch (error) {
      console.error('Error searching students:', error);
      setError('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'student'))
      );

      const pendingSnapshot = await getDocs(
        query(collection(db, 'pendingActivations'), where('activated', '==', false))
      );

      let myStudents = 0;
      if (isTeacher) {
        usersSnapshot.forEach(doc => {
          if (doc.data().createdBy === currentUser.uid) myStudents++;
        });
        pendingSnapshot.forEach(doc => {
          if (doc.data().teacherId === currentUser.uid) myStudents++;
        });
      }

      setStats({
        totalActivated: usersSnapshot.size,
        totalPending: pendingSnapshot.size,
        total: usersSnapshot.size + pendingSnapshot.size,
        myStudents: myStudents
      });
      setShowStats(true);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Handle delete
  const handleDelete = async (student) => {
    if (!window.confirm(`Delete student "${student.name}"? This cannot be undone.`)) {
      return;
    }

    const confirmText = window.prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      if (student.status === 'activated') {
        await deleteStudentAccount(student.id);
      } else {
        await deleteDoc(doc(db, 'pendingActivations', student.id));
      }

      setSearchResults(searchResults.filter(s => s.id !== student.id));
      alert('Student deleted successfully');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Delete failed: ' + error.message);
    }
  };

  // Regenerate activation code for pending students
  const handleRegenerateCode = async () => {
    if (selectedStudent.status !== 'pending') return;
    setIsResetting(true);
    setResetMessage('');
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      await updateDoc(doc(db, 'pendingActivations', selectedStudent.id), { activationCode: newCode });
      setSearchResults(searchResults.map(s =>
        s.id === selectedStudent.id ? { ...s, activationCode: newCode } : s
      ));
      setSelectedStudent(prev => ({ ...prev, activationCode: newCode }));
      setResetMessage(`New activation code: ${newCode} — share this with the student.`);
    } catch (err) {
      setResetMessage('Failed to regenerate code: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Handle edit
  const handleEdit = (student) => {
    setSelectedStudent(student);
    setResetMessage('');
    setEditFormData({
      name: student.name,
      class: student.class,
      schoolName: student.schoolName,
      district: student.district,
      state: student.state
    });
  };

  const handleEditSave = async () => {
    try {
      const nameChanged = editFormData.name !== selectedStudent.name;
      const schoolChanged = editFormData.schoolName !== selectedStudent.schoolName;

      if (selectedStudent.status === 'activated') {
        await updateStudentAccount(selectedStudent.id, editFormData);

        // Propagate name/school changes to all the student's videos
        if (nameChanged || schoolChanged) {
          const videosSnap = await getDocs(
            query(collection(db, 'videos'), where('uploaderId', '==', selectedStudent.id))
          );
          if (!videosSnap.empty) {
            const batch = writeBatch(db);
            videosSnap.forEach(v => {
              const updates = {};
              if (nameChanged) updates.uploaderName = editFormData.name;
              if (schoolChanged) {
                updates.uploaderSchool = editFormData.schoolName;
                updates.schoolName = editFormData.schoolName;
              }
              batch.update(v.ref, updates);
            });
            await batch.commit();
          }
        }
      } else {
        await updateDoc(doc(db, 'pendingActivations', selectedStudent.id), editFormData);
      }

      setSearchResults(searchResults.map(s =>
        s.id === selectedStudent.id ? { ...s, ...editFormData } : s
      ));
      setSelectedStudent(null);
      alert('Student updated successfully');
    } catch (error) {
      console.error('Error updating:', error);
      alert('Update failed: ' + error.message);
    }
  };

  // Show create form
  if (showCreateForm) {
    return (
      <div className="student-search-container">
        <button
          className="back-button"
          onClick={() => setShowCreateForm(false)}
        >
          ← Back to Search
        </button>
        <CreateStudentScreen
          currentUser={currentUser}
          onClose={() => setShowCreateForm(false)}
          embedded={true}
        />
      </div>
    );
  }

  // Show edit form
  if (selectedStudent) {
    return (
      <div className="student-search-container">
        <div className="edit-form-card">
          <h3>Edit Student: {selectedStudent.name}</h3>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Class</label>
            <select
              value={editFormData.class}
              onChange={(e) => setEditFormData({ ...editFormData, class: e.target.value })}
            >
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
            <label>School Name</label>
            <input
              type="text"
              value={editFormData.schoolName}
              onChange={(e) => setEditFormData({ ...editFormData, schoolName: e.target.value })}
            />
          </div>

          {/* Password Reset Section */}
          <div style={{ borderTop: '1px solid rgba(148,163,184,0.2)', marginTop: '16px', paddingTop: '16px' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>🔑 Password Reset</label>
            {selectedStudent.status === 'pending' ? (
              <>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                  Current activation code: <strong style={{ color: '#f1f5f9' }}>{selectedStudent.activationCode || '—'}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={isResetting}
                  style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                >
                  {isResetting ? 'Generating...' : '🔄 Regenerate Activation Code'}
                </button>
              </>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', borderRadius: '8px', padding: '10px 12px' }}>
                Student passwords use internal login (no email). To reset, delete this student account and recreate it — the student will receive a new activation code.
              </div>
            )}
            {resetMessage && (
              <div style={{ marginTop: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#10b981', fontSize: '13px' }}>
                ✅ {resetMessage}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="save-button" onClick={handleEditSave}>Save Changes</button>
            <button className="cancel-button" onClick={() => { setSelectedStudent(null); setResetMessage(''); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-search-container">
      <div className="search-header">
        <h2>🎓 Student Search</h2>
        <p className="subtitle">Search for students by ID, name, or school</p>
      </div>

      {/* Quick Stats */}
      {!showStats ? (
        <button className="stats-button" onClick={loadStats}>
          📊 Show Statistics
        </button>
      ) : (
        <div className="stats-card">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalActivated}</div>
            <div className="stat-label">Activated</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalPending}</div>
            <div className="stat-label">Pending</div>
          </div>
          {isTeacher && (
            <div className="stat-item highlight">
              <div className="stat-value">{stats.myStudents}</div>
              <div className="stat-label">My Students</div>
            </div>
          )}
        </div>
      )}

      {/* Search Controls */}
      <div className="search-controls">
        <div className="search-type-selector">
          <label>Search by:</label>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="schoolId">School ID</option>
            <option value="name">Student Name</option>
            <option value="schoolName">School Name</option>
          </select>
        </div>

        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder={
              searchType === 'schoolId' ? 'Enter School ID (supports partial: TN-*, *ST456, or full ID)' :
              searchType === 'name' ? 'Enter student name (supports partial match)' :
              'Enter school name (supports partial match)'
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

        {(isAdmin || isTeacher) && (
          <button
            className="create-button"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Student
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({searchResults.length})</h3>
          <div className="results-list">
            {searchResults.map((student) => {
              const canModify = canModifyStudent(student);

              return (
                <div key={student.id} className="student-card">
                  <div className="student-card-header">
                    <div>
                      <h4>{student.name}</h4>
                      <div className="school-id">{student.schoolId}</div>
                    </div>
                    <span className={`status-badge ${student.status}`}>
                      {student.status === 'activated' ? '✓ Activated' : '⏳ Pending'}
                    </span>
                  </div>

                  <div className="student-card-body">
                    <div className="info-row">
                      <span className="label">School:</span>
                      <span className="value">{student.schoolName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Class:</span>
                      <span className="value">Class {student.class}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">District:</span>
                      <span className="value">{student.district}</span>
                    </div>
                    {student.activationCode && student.status === 'pending' && (
                      <div className="info-row highlight">
                        <span className="label">Activation Code:</span>
                        <span className="value code">{student.activationCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="student-card-actions">
                    {canModify ? (
                      <>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(student)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(student)}
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
          <li><strong>School ID:</strong> Supports wildcards and partial matching
            <ul>
              <li>Full ID: <code>TN-TEN-GOV123-ST456</code></li>
              <li>Partial: <code>TN-TEN</code>, <code>ST456</code>, <code>GOV123</code></li>
              <li>Wildcard: <code>TN-*</code>, <code>*ST456</code> (* is optional)</li>
            </ul>
          </li>
          <li><strong>Name:</strong> Partial match - type any part of the name (e.g., "raj" finds "Rajesh", "Rajeev")</li>
          <li><strong>School Name:</strong> Partial match - type any part of school name (e.g., "Government" or "High")</li>
          <li>Press <kbd>Enter</kbd> to search quickly</li>
          <li>Searches are case-insensitive</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentSearch;
