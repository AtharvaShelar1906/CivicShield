import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verifying security session...</p>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homePath = user.role === 'CITIZEN' ? '/citizen' : user.role === 'AUTHORITY' ? '/authority' : '/admin';

    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem', textAlign: 'center' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)', padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#fb7185' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Your account role is <span className="mono-tag" style={{ textTransform: 'uppercase' }}>{user.role}</span>.
            You do not possess the required privileges to view this area.
          </p>
          <Link to={homePath} className="btn btn-primary">
            Return to Your {user.role === 'CITIZEN' ? 'Citizen' : user.role === 'AUTHORITY' ? 'Authority' : 'Admin'} Portal
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
