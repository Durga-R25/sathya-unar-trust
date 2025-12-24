import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import './JudgeAssignments.css';

/**
 * JudgeAssignments Component
 * Allows admins to assign judges to evaluate videos
 * Supports: School-based, Category-based, or School+Category assignments
 */
const JudgeAssignments = () => {
  const [assignmentMode, setAssignmentMode] = useState('school'); // 'school', 'category', 'both'
  const [formData, setFormData] = useState({
    judgeEmail: '',
    school: '',
    category: ''
  });
  const [schools, setSchools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load schools, categories, and existing assignments
  useEffect(() => {
    loadSchools();
    loadCategories();
    loadAssignments();
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

  const loadCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const snapshot = await getDocs(q);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const q = query(collection(db, 'judgeAssignments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const assignmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
    setSuccess('');
  };

  const handleModeChange = (mode) => {
    setAssignmentMode(mode);
    setFormData({
      judgeEmail: formData.judgeEmail,
      school: '',
      category: ''
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.judgeEmail.trim()) {
      setError('Please enter judge email');
      return;
    }

    if (assignmentMode === 'school' && !formData.school) {
      setError('Please select a school');
      return;
    }

    if (assignmentMode === 'category' && !formData.category) {
      setError('Please select a category');
      return;
    }

    if (assignmentMode === 'both' && (!formData.school || !formData.category)) {
      setError('Please select both school and category');
      return;
    }

    setIsLoading(true);

    try {
      // Verify that the judge email exists in the users collection with role 'judge'
      const judgeQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.judgeEmail.toLowerCase().trim()),
        where('role', 'in', ['judge', 'Judge', 'JUDGE'])
      );
      const judgeSnapshot = await getDocs(judgeQuery);

      if (judgeSnapshot.empty) {
        setError('Judge not found. Please create the judge account first in the Users tab.');
        setIsLoading(false);
        return;
      }

      const judgeDoc = judgeSnapshot.docs[0];
      const judgeData = judgeDoc.data();

      // Create assignment document
      const assignmentData = {
        judgeUid: judgeDoc.id,
        judgeEmail: formData.judgeEmail.toLowerCase().trim(),
        judgeName: judgeData.name || 'Unknown',
        assignmentType: assignmentMode,
        createdAt: new Date()
      };

      if (assignmentMode === 'school' || assignmentMode === 'both') {
        assignmentData.schoolName = formData.school;
      }

      if (assignmentMode === 'category' || assignmentMode === 'both') {
        assignmentData.category = formData.category;
      }

      await addDoc(collection(db, 'judgeAssignments'), assignmentData);

      // Build success message
      let successMsg = `Judge "${formData.judgeEmail}" assigned to evaluate `;
      if (assignmentMode === 'school') {
        successMsg += `all videos from "${formData.school}"`;
      } else if (assignmentMode === 'category') {
        successMsg += `all "${formData.category}" videos`;
      } else {
        successMsg += `"${formData.category}" videos from "${formData.school}"`;
      }

      setSuccess(successMsg);

      // Clear form
      setFormData({
        judgeEmail: '',
        school: '',
        category: ''
      });

      // Reload assignments
      await loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError('Failed to create assignment: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'judgeAssignments', assignmentId));
      setSuccess('Assignment deleted successfully');
      await loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('Failed to delete assignment: ' + error.message);
    }
  };

  const getAssignmentDescription = (assignment) => {
    if (assignment.assignmentType === 'school') {
      return `All videos from ${assignment.schoolName}`;
    } else if (assignment.assignmentType === 'category') {
      return `All ${assignment.category} videos`;
    } else {
      return `${assignment.category} videos from ${assignment.schoolName}`;
    }
  };

  return (
    <div className="judge-assignments">
      <div className="assignments-header">
        <h3>📋 Judge Assignments</h3>
        <p className="assignments-subtitle">Assign judges to evaluate videos by school, category, or both</p>
      </div>

      <div className="assignments-content">
        {/* Assignment Form */}
        <div className="assignment-form-section">
          <h4>Create New Assignment</h4>

          {/* Assignment Mode Selector */}
          <div className="mode-selector">
            <button
              className={`mode-button ${assignmentMode === 'school' ? 'active' : ''}`}
              onClick={() => handleModeChange('school')}
            >
              🏫 By School
            </button>
            <button
              className={`mode-button ${assignmentMode === 'category' ? 'active' : ''}`}
              onClick={() => handleModeChange('category')}
            >
              📚 By Category
            </button>
            <button
              className={`mode-button ${assignmentMode === 'both' ? 'active' : ''}`}
              onClick={() => handleModeChange('both')}
            >
              🎯 School & Category
            </button>
          </div>

          <form className="assignment-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Judge Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="judge@example.com"
                value={formData.judgeEmail}
                onChange={(e) => handleInputChange('judgeEmail', e.target.value)}
                disabled={isLoading}
              />
            </div>

            {(assignmentMode === 'school' || assignmentMode === 'both') && (
              <div className="form-group">
                <label className="form-label">School *</label>
                <select
                  className="form-input"
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
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
                  <p className="help-text">No schools available. Add schools in the Schools tab.</p>
                )}
              </div>
            )}

            {(assignmentMode === 'category' || assignmentMode === 'both') && (
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="help-text">No categories available. Add categories in the Categories tab.</p>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="info-box">
              <strong>ℹ️ How it works:</strong>
              <ul>
                {assignmentMode === 'school' && (
                  <li>Judge will see ALL videos uploaded by students from the selected school</li>
                )}
                {assignmentMode === 'category' && (
                  <li>Judge will see ALL videos in the selected category (from any school)</li>
                )}
                {assignmentMode === 'both' && (
                  <li>Judge will see videos from the selected school in the selected category only</li>
                )}
              </ul>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Assignment...' : 'Create Assignment'}
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div className="assignments-list-section">
          <h4>Active Assignments ({assignments.length})</h4>
          {assignments.length === 0 ? (
            <div className="empty-state">
              <p>No assignments yet. Create your first assignment above.</p>
            </div>
          ) : (
            <div className="assignments-table">
              <table>
                <thead>
                  <tr>
                    <th>Judge Email</th>
                    <th>Assignment Type</th>
                    <th>Scope</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => (
                    <tr key={assignment.id}>
                      <td className="judge-email">{assignment.judgeEmail}</td>
                      <td>
                        <span className={`badge badge-${assignment.assignmentType}`}>
                          {assignment.assignmentType === 'school' && '🏫 School'}
                          {assignment.assignmentType === 'category' && '📚 Category'}
                          {assignment.assignmentType === 'both' && '🎯 Both'}
                        </span>
                      </td>
                      <td className="scope-text">
                        {getAssignmentDescription(assignment)}
                      </td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(assignment.id)}
                          title="Delete assignment"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgeAssignments;
