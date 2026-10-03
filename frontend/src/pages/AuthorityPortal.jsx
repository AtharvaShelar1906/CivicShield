import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthorityPortal() {
  const { user } = useAuth();

  return (
    <div className="container">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-role-authority">
            Authority Operations Hub
          </span>
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <span className="badge-pulse" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }}></span> Officer Session
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Welcome, {user?.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Departmental triage and grievance management portal for authorized municipal officers.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Officer Credentials & Assignment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Officer Name</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user?.name}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Email</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user?.email}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--accent-amber)' }}>{user?.department || 'General Municipal Administration'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role Tier</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>
              <span className="mono-tag">{user?.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Authority Workspace Active
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Backend RBAC has validated your AUTHORITY privileges. The grievance triage queue, status transition controls, and advisory AI suggestions will be integrated here in the next phase.
        </p>
      </div>
    </div>
  );
}
