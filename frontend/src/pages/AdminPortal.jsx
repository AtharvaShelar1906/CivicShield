import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminPortal() {
  const { user } = useAuth();

  return (
    <div className="container">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-role-admin">
            Central Administration
          </span>
          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <span className="badge-pulse" style={{ background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></span> Root Privileges
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Administration Control Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Full administrative access for governance oversight, audit log examination, and system parameters.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Administrator Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrator Name</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user?.name}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Email</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user?.email}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Unit</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--accent-rose)' }}>{user?.department || 'Central Governance Office'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privilege Level</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>
              <span className="mono-tag" style={{ color: 'var(--accent-rose)' }}>{user?.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          System Governance Initialized
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Authentication state and administrative role guard verified. Full system audit log inspector, category management, and cross-departmental overrides will be rendered here in the next phase.
        </p>
      </div>
    </div>
  );
}
