import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function CitizenPortal() {
  const { user } = useAuth();

  return (
    <div className="container">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-role-citizen">
            Citizen Portal
          </span>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span className="badge-pulse"></span> Authenticated
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Welcome, {user?.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Your citizen account is active. From this portal, you can register grievances, track resolution status, and see AI categorization.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Authenticated Profile Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user?.name}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user?.email}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</span>
            <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>
              <span className="mono-tag">{user?.role}</span>
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Identifier</span>
            <p style={{ fontWeight: '600', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Phase 6A Foundation Active
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          The authentication layer, JWT session storage, and route protection are fully operational.
          Grievance submission forms, personal complaint histories, and AI similarity notifications will be mounted to this view in the upcoming phase.
        </p>
      </div>
    </div>
  );
}
