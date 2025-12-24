import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import './CategoryManager.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load categories from Firestore on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('order'));
      const snapshot = await getDocs(q);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      // If no categories exist, initialize with defaults
      if (categoriesData.length === 0) {
        await initializeDefaultCategories();
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultCategories = async () => {
    const defaultCategories = [
      { name: 'Physics', icon: '⚛️', active: true, order: 1 },
      { name: 'Chemistry', icon: '🧪', active: true, order: 2 },
      { name: 'Biology', icon: '🧬', active: true, order: 3 },
      { name: 'Environment', icon: '🌱', active: true, order: 4 },
      { name: 'Technology', icon: '💻', active: true, order: 5 }
    ];

    try {
      for (const category of defaultCategories) {
        await addDoc(collection(db, 'categories'), {
          ...category,
          createdAt: serverTimestamp()
        });
      }
      await loadCategories();
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  };

  const handleAdd = async () => {
    if (!newCategory.name || !newCategory.icon) {
      setError('Please enter both category name and icon');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const category = {
        name: newCategory.name.trim(),
        icon: newCategory.icon,
        active: true,
        order: categories.length + 1,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'categories'), category);
      setSuccess(`Category "${newCategory.name}" added successfully!`);
      setNewCategory({ name: '', icon: '' });
      await loadCategories();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category: ' + error.message);
    }
  };

  const handleToggle = async (id) => {
    setError('');
    setSuccess('');

    try {
      const category = categories.find(cat => cat.id === id);
      if (!category) return;

      await updateDoc(doc(db, 'categories', id), {
        active: !category.active,
        updatedAt: serverTimestamp()
      });

      setSuccess(`Category ${!category.active ? 'activated' : 'deactivated'} successfully!`);
      await loadCategories();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling category:', error);
      setError('Failed to update category: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    const category = categories.find(cat => cat.id === id);
    if (!category) return;

    if (!window.confirm(`Delete "${category.name}" category? All videos in this category will be affected.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteDoc(doc(db, 'categories', id));
      setSuccess(`Category "${category.name}" deleted successfully!`);
      await loadCategories();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category: ' + error.message);
    }
  };

  return (
    <div className="category-manager">
      <h3 className="manager-title">📚 Category Management</h3>

      <div className="add-category-section">
        <h4 className="section-title">Add New Category</h4>
        <div className="add-category-form">
          <input
            type="text"
            placeholder="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="category-input"
          />
          <input
            type="text"
            placeholder="Icon (emoji)"
            value={newCategory.icon}
            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
            className="category-input"
            maxLength={2}
          />
          <button onClick={handleAdd} className="add-button">
            ➕ Add
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ color: '#ef4444', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginTop: '12px' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message" style={{ color: '#10b981', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', marginTop: '12px' }}>
            {success}
          </div>
        )}
      </div>

      <div className="categories-list">
        <h4 className="section-title">Existing Categories ({categories.length})</h4>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            No categories yet. Add your first category above.
          </div>
        ) : (
          <>
            {categories.map(cat => (
              <div key={cat.id} className={`category-item ${!cat.active ? 'inactive' : ''}`}>
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <span className={`status-badge ${cat.active ? 'active' : 'inactive'}`}>
                  {cat.active ? 'Active' : 'Inactive'}
                </span>
                <div className="category-actions">
                  <button onClick={() => handleToggle(cat.id)} className="toggle-btn">
                    {cat.active ? '👁️' : '🔒'}
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="delete-btn">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
