import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/metrics');
      setMetrics(res.data.metrics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve administrative metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-role-admin">Central Administration</span>
            <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              System Governance Tier
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            System Governance Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Cross-departmental oversight, user registry management, and immutable audit inspection
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={fetchMetrics} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            🔄 Refresh Metrics
          </button>
          <Link to="/admin/grievances" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            📋 All Grievances
          </Link>
          <Link to="/admin/users" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            👥 User Registry
          </Link>
          <Link to="/admin/audit" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            📜 Audit Logs
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <strong style={{ color: '#fb7185' }}>Error loading admin metrics:</strong> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aggregating system-wide metrics...</p>
        </div>
      ) : metrics ? (
        <>
          {/* Top Level Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {/* Total Users */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Registered Users
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                {metrics.users.total}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <span style={{ color: '#34d399' }}>● {metrics.users.active} Active</span>
                <span style={{ color: '#fb7185' }}>● {metrics.users.inactive} Inactive</span>
              </div>
            </div>

            {/* Total Grievances */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Grievances
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                {metrics.grievances.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {metrics.grievances.unassigned} unassigned complaints
              </div>
            </div>

            {/* High & Critical */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
              <div style={{ fontSize: '0.75rem', color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                High / Critical Priority
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fb7185', marginTop: '0.35rem' }}>
                {metrics.grievances.highPriority + metrics.grievances.criticalPriority}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {metrics.grievances.criticalPriority} Critical • {metrics.grievances.highPriority} High
              </div>
            </div>

            {/* Total Audit Logs */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Governance Audit Trail
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                {metrics.governance.totalAuditLogs}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Immutable security & triage events
              </div>
            </div>
          </div>

          {/* Section: Grievance Lifecycle Breakdown */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Grievance Lifecycle Distribution
              </h2>
              <Link to="/admin/grievances" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>
                Manage All Grievances →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUBMITTED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.25rem' }}>
                  {metrics.grievances.submitted}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UNDER REVIEW</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fbbf24', marginTop: '0.25rem' }}>
                  {metrics.grievances.underReview}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ASSIGNED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fbbf24', marginTop: '0.25rem' }}>
                  {metrics.grievances.assigned}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IN PROGRESS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.25rem' }}>
                  {metrics.grievances.inProgress}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RESOLVED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#34d399', marginTop: '0.25rem' }}>
                  {metrics.grievances.resolved}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CLOSED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#94a3b8', marginTop: '0.25rem' }}>
                  {metrics.grievances.closed}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REJECTED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fb7185', marginTop: '0.25rem' }}>
                  {metrics.grievances.rejected}
                </div>
              </div>
            </div>
          </div>

          {/* Section: User Roles & Governance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* User Roles Breakdown */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                  User Registry Breakdown
                </h3>
                <Link to="/admin/users" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>
                  Manage Users →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-role-citizen">CITIZEN</span>
                    <span style={{ fontSize: '0.85rem' }}>Public Grievance Submitters</span>
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>{metrics.users.citizens}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-role-authority">AUTHORITY</span>
                    <span style={{ fontSize: '0.85rem' }}>Municipal Triage Officers</span>
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>{metrics.users.authorities}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-role-admin">ADMIN</span>
                    <span style={{ fontSize: '0.85rem' }}>System Administrators</span>
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>{metrics.users.admins}</strong>
                </div>
              </div>
            </div>

            {/* Quick Governance Links */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  Administrative Governance Shortcuts
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Central administrators have full authority to override priorities, correct workflow states across all municipal departments, inspect security audit logs, and toggle account access status.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <Link to="/admin/grievances" className="btn btn-secondary" style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                  ⚖️ System-Wide Grievance Oversight & Corrections
                </Link>
                <Link to="/admin/users" className="btn btn-secondary" style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                  👥 User Registry & Access Status (Activate / Deactivate)
                </Link>
                <Link to="/admin/audit" className="btn btn-secondary" style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                  📜 Security & Triage Audit Trail Inspector
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
