import React, { useState } from 'react';
import { setupAdmin } from '../utils/setupAdmin';

/**
 * Temporary component to create admin account
 * Add this to LoginScreen temporarily to create the admin
 */
const AdminSetupButton = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    const setupResult = await setupAdmin();
    setResult(setupResult);
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 99999,
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      maxWidth: '350px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e293b' }}>
        🔧 Admin Setup
      </h4>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>
        Click to create the admin account in Firebase
      </p>

      <button
        onClick={handleSetup}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Setting up...' : 'Create Admin Account'}
      </button>

      {result && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '8px',
          background: result.success ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '13px'
        }}>
          <strong style={{ color: result.success ? '#166534' : '#991b1b' }}>
            {result.success ? '✅ Success!' : '❌ Error'}
          </strong>
          <p style={{ margin: '4px 0 0 0', color: result.success ? '#166534' : '#991b1b' }}>
            {result.message}
          </p>
          {result.uid && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              UID: {result.uid}
            </p>
          )}
          {result.error && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#991b1b' }}>
              Error: {result.error}
            </p>
          )}
        </div>
      )}

      {result && result.success && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '8px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          fontSize: '12px',
          color: '#1e40af'
        }}>
          <strong>Login Credentials:</strong><br />
          Email: admin@scienceverse.com<br />
          Password: admin123
        </div>
      )}
    </div>
  );
};

export default AdminSetupButton;
