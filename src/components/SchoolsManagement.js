import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import './SchoolsManagement.css';

/**
 * SchoolsManagement Component
 * Allows admins to manage schools list
 */
const SchoolsManagement = () => {
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    village: '',
    district: '',
    state: 'Tamilnadu'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load schools from Firestore
  useEffect(() => {
    loadSchools();
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
      setError('Failed to load schools');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter school name');
      return;
    }

    if (!formData.district) {
      setError('Please select district');
      return;
    }

    setIsLoading(true);

    try {
      // Add school to Firestore
      await addDoc(collection(db, 'schools'), {
        name: formData.name.trim(),
        village: formData.village.trim(),
        district: formData.district,
        state: formData.state,
        createdAt: serverTimestamp()
      });

      setSuccess(`School "${formData.name}" added successfully!`);

      // Clear form
      setFormData({
        name: '',
        village: '',
        district: '',
        state: 'Tamilnadu'
      });

      // Reload schools list
      await loadSchools();
    } catch (error) {
      console.error('Error adding school:', error);
      setError('Failed to add school: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (schoolId, schoolName) => {
    if (!window.confirm(`Are you sure you want to delete "${schoolName}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'schools', schoolId));
      setSuccess(`School "${schoolName}" deleted successfully!`);
      await loadSchools();
    } catch (error) {
      console.error('Error deleting school:', error);
      setError('Failed to delete school: ' + error.message);
    }
  };

  return (
    <div className="schools-management">
      <div className="schools-header">
        <h3>📚 Schools Management</h3>
        <p className="schools-subtitle">Add and manage schools for teacher accounts</p>
      </div>

      <div className="schools-content">
        {/* Add School Form */}
        <div className="add-school-section">
          <h4>Add New School</h4>
          <form className="school-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">School Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Ratna Higher Secondary School, Kadayanallur"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Village</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter village name"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">District *</label>
                <select
                  className="form-input"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select District</option>
                  <option value="Tenkasi">Tenkasi</option>
                  <option value="Tirunelveli">Tirunelveli</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">State *</label>
                <select
                  className="form-input"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="Tamilnadu">Tamilnadu</option>
                </select>
              </div>
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
              {isLoading ? 'Adding...' : 'Add School'}
            </button>
          </form>
        </div>

        {/* Schools List */}
        <div className="schools-list-section">
          <h4>Schools List ({schools.length})</h4>
          {schools.length === 0 ? (
            <div className="empty-state">
              <p>No schools added yet. Add your first school above.</p>
            </div>
          ) : (
            <div className="schools-table">
              <table>
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Village</th>
                    <th>District</th>
                    <th>State</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => (
                    <tr key={school.id}>
                      <td className="school-name">{school.name}</td>
                      <td>{school.village || '-'}</td>
                      <td>{school.district}</td>
                      <td>{school.state}</td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(school.id, school.name)}
                          title="Delete school"
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

export default SchoolsManagement;
