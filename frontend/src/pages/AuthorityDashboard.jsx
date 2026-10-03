import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/grievances');
        setGrievances(res.data.grievances || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load authority dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Derived real metrics
  const totalVisible = grievances.length;
  const unassignedCount = grievances.filter((g) => !g.assignedToId).length;
  const assignedToMeCount = grievances.filter((g) => g.assignedToId === user?.id).length;
  const inProgressCount = grievances.filter((g) => g.status === 'IN_PROGRESS').length;
  const resolvedCount = grievances.filter((g) => ['RESOLVED', 'CLOSED'].includes(g.status)).length;
  const highCriticalCount = grievances.filter((g) => ['HIGH', 'CRITICAL'].includes(g.priority)).length;

  // Urgent grievances needing triage (unassigned or high/critical and not resolved)
  const urgentGrievances = grievances
    .filter((g) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(g.status))
    .filter((g) => !g.assignedToId || ['HIGH', 'CRITICAL'].includes(g.priority))
    .slice(0, 5);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return <span className="badge badge-success">{status.replace('_', ' ')}</span>;
      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'UNDER_REVIEW':
        return <span className="badge badge-warning">{status.replace('_', ' ')}</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span style={{ color: '#f43f5e', fontWeight: '700', fontSize: '0.75rem', background: 'rgba(244,63,94,0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.25)' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ color: '#f97316', fontWeight: '700', fontSize: '0.75rem', background: 'rgba(249,115,22,0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(249,115,22,0.25)' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.75rem', background: 'rgba(56,189,248,0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.25)' }}>MEDIUM</span>;
      default:
        return <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.75rem', background: 'rgba(148,163,184,0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.25)' }}>LOW</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      {/* Officer Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-role-authority">Authority Operations</span>
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              {user?.department || 'Municipal Administration'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Departmental grievance triage, advisory AI review, and workflow resolution hub
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/authority/queue" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📋</span>
            <span>Open Triage Queue</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#fb7185' }}>Failed to load dashboard data:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Real Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        {/* Total Visible */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Visible
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {loading ? '-' : totalVisible}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Complaints in department scope
          </div>
        </div>

        {/* Unassigned */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
            Unassigned
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', marginTop: '0.35rem' }}>
            {loading ? '-' : unassignedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Awaiting triage / assignment
          </div>
        </div>

        {/* Assigned to Me */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
            Assigned to Me
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.35rem' }}>
            {loading ? '-' : assignedToMeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Directly under your custody
          </div>
        </div>

        {/* In Progress */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            In Progress
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', marginTop: '0.35rem' }}>
            {loading ? '-' : inProgressCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Active municipal work
          </div>
        </div>

        {/* Resolved / Closed */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resolved / Closed
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399', marginTop: '0.35rem' }}>
            {loading ? '-' : resolvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Completed cases
          </div>
        </div>

        {/* High / Critical Priority */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ fontSize: '0.75rem', color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
            High / Critical
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fb7185', marginTop: '0.35rem' }}>
            {loading ? '-' : highCriticalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Priority escalations
          </div>
        </div>
      </div>

      {/* Priority Triage Queue Preview */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Urgent & Unassigned Grievances
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Complaints requiring official categorization, priority confirmation, or assignment
            </p>
          </div>
          <Link to="/authority/queue" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>
            View Full Queue ({totalVisible}) →
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
            <div className="spinner"></div>
          </div>
        ) : urgentGrievances.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {urgentGrievances.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1 1 500px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{g.id.substring(0, 8)}
                    </span>
                    {getStatusBadge(g.status)}
                    {getPriorityBadge(g.priority)}
                    {g.category ? (
                      <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                        {g.category.name}
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.7rem' }}>
                        Pending Category
                      </span>
                    )}
                    {g.assignedTo ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        👤 {g.assignedTo.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '600' }}>
                        ⚠️ Unassigned
                      </span>
                    )}
                  </div>

                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {g.title}
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {g.location && <span>📍 {g.location}</span>}
                    <span>🕒 Submitted: {new Date(g.createdAt).toLocaleDateString()}</span>
                    {g.analysis && (
                      <span style={{ color: 'var(--accent-cyan)' }}>
                        🤖 AI Suggestion: {g.analysis.predictedCategory} ({g.analysis.predictedPriority})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Link to={`/authority/grievances/${g.id}`} className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    Triage & Action →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No urgent or unassigned grievances pending triage!</p>
            <span style={{ fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
              All visible complaints have been assigned or resolved.
            </span>
          </div>
        )}
      </div>

      {/* Advisory Information Notice */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--accent-cyan)',
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.04) 0%, transparent 100%)',
          padding: '1.25rem 1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🤖</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>SDG 16 AI Advisory Protocol</strong>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
          Incoming complaints are analyzed by local NLP models for advisory categorization, severity estimation, and duplicate detection. As an authorized officer, your administrative decisions remain authoritative. Always verify grievance content before confirming category and priority.
        </p>
      </div>
    </div>
  );
}
