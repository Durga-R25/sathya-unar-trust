import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { deleteStudentAccount, updateStudentAccount } from '../services/authService';
import CreateStudentScreen from './CreateStudentScreen';
import './StudentManagement.css';

/**
 * StudentManagement Component
 * Lists all student accounts with proper permissions:
 * - Visibility: All user types can see all students
 * - Edit/Delete: Only admin and the teacher who created the student
 */
const StudentManagement = ({ currentUser }) => {
  const [students, setStudents] = useState([]);
  const [pendingActivations, setPendingActivations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isTeacher = currentUser?.role?.toLowerCase() === 'teacher';

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load activated students from users collection
      const usersRef = collection(db, 'users');
      const studentsQuery = query(
        usersRef,
        where('role', '==', 'student'),
        orderBy('createdAt', 'desc')
      );

      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'activated'
      }));

      // Load pending activations
      const pendingRef = collection(db, 'pendingActivations');
      const pendingQuery = query(
        pendingRef,
        where('activated', '==', false),
        orderBy('createdAt', 'desc')
      );

      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'pending'
      }));

      setStudents(studentsData);
      setPendingActivations(pendingData);
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user can edit/delete a student
  const canModifyStudent = (student) => {
    if (isAdmin) return true;
    if (isTeacher && student.createdBy === currentUser.uid) return true;
    if (isTeacher && student.teacherId === currentUser.uid) return true; // For pending activations
    return false;
  };

  const handleDelete = async (student) => {
    const studentName = student.name;
    const isConfirmed = window.confirm(
      `Are you sure you want to delete student "${studentName}"?\n\n` +
      `This action cannot be undone and will delete:\n` +
      `- Student account\n` +
      `- All uploaded videos\n` +
      `- All evaluations\n\n` +
      `Type "DELETE" to confirm.`
    );

    if (!isConfirmed) return;

    const confirmText = window.prompt('Please type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled. Confirmation text did not match.');
      return;
    }

    try {
      setIsLoading(true);

      if (student.status === 'activated') {
        // Delete activated student account
        await deleteStudentAccount(student.id);
      } else {
        // Delete pending activation
        await deleteDoc(doc(db, 'pendingActivations', student.id));
      }

      alert(`Student "${studentName}" has been deleted successfully.`);
      await loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      class: student.class,
      schoolName: student.schoolName,
      district: student.district,
      state: student.state
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      if (editingStudent.status === 'activated') {
        // Update activated student
        await updateStudentAccount(editingStudent.id, editFormData);
      } else {
        // Update pending activation
        await updateDoc(doc(db, 'pendingActivations', editingStudent.id), {
          ...editFormData
        });
      }

      alert('Student information updated successfully.');
      setEditingStudent(null);
      await loadStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingStudent(null);
    setEditFormData({});
  };

  // Combine activated students and pending activations
  const allStudents = [...students, ...pendingActivations];

  if (showCreateForm) {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => {
            setShowCreateForm(false);
            loadStudents();
          }}
        >
          ← Back to Student List
        </button>
        <CreateStudentScreen
          currentUser={currentUser}
          onClose={() => {
            setShowCreateForm(false);
            loadStudents();
          }}
          embedded={true}
        />
      </div>
    );
  }

  if (editingStudent) {
    return (
      <div className="edit-student-form">
        <h3>Edit Student Information</h3>
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label>Student Name *</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Class *</label>
            <select
              value={editFormData.class}
              onChange={(e) => setEditFormData({ ...editFormData, class: e.target.value })}
              required
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
            <label>School Name *</label>
            <input
              type="text"
              value={editFormData.schoolName}
              onChange={(e) => setEditFormData({ ...editFormData, schoolName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>District *</label>
            <input
              type="text"
              value={editFormData.district}
              onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>State *</label>
            <input
              type="text"
              value={editFormData.state}
              onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleEditCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="student-management">
      <div className="management-header">
        <div>
          <h2>Student Management</h2>
          <p className="subtitle">
            {allStudents.length} total students
            ({students.length} activated, {pendingActivations.length} pending)
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <button
            className="primary-button"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Student
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading students...</div>
      ) : allStudents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👨‍🎓</span>
          <h3>No Students Yet</h3>
          <p>Create your first student account to get started.</p>
          {(isAdmin || isTeacher) && (
            <button
              className="primary-button"
              onClick={() => setShowCreateForm(true)}
            >
              Create Student
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>School ID</th>
                <th>School</th>
                <th>Class</th>
                <th>District</th>
                <th>State</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allStudents.map((student) => {
                const canModify = canModifyStudent(student);

                return (
                  <tr key={student.id}>
                    <td className="student-name">{student.name}</td>
                    <td className="school-id">{student.schoolId}</td>
                    <td>{student.schoolName}</td>
                    <td>Class {student.class}</td>
                    <td>{student.district}</td>
                    <td>{student.state}</td>
                    <td>
                      <span className={`status-badge ${student.status}`}>
                        {student.status === 'activated' ? '✓ Activated' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="created-by">
                      {student.createdBy || student.teacherId ?
                        `Teacher ID: ${(student.createdBy || student.teacherId).substring(0, 8)}...` :
                        'N/A'
                      }
                    </td>
                    <td className="actions">
                      {canModify ? (
                        <>
                          <button
                            className="action-button edit-button"
                            onClick={() => handleEdit(student)}
                            title="Edit student"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="action-button delete-button"
                            onClick={() => handleDelete(student)}
                            title="Delete student"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      ) : (
                        <span className="no-permission">No permission</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Permissions Legend */}
      <div className="permissions-info">
        <h4>Permissions:</h4>
        <ul>
          <li><strong>View:</strong> All users (admin, teacher, judge, student) can view all students</li>
          <li><strong>Edit/Delete:</strong> Only available to:
            <ul>
              <li>Admin users (can manage all students)</li>
              <li>Teachers who created the student</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentManagement;
