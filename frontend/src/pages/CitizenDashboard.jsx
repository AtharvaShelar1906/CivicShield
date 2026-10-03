import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGrievances() {
      try {
        const res = await api.get('/grievances/my');
        setGrievances(res.data.grievances || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your grievances.');
      } finally {
        setLoading(false);
      }
    }
    fetchGrievances();
  }, []);

  // Summary Metrics
  const totalGrievances = grievances.length;
  const inProgressCount = grievances.filter(g =>
    ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes(g.status)
  ).length;
  const resolvedCount = grievances.filter(g =>
    ['RESOLVED', 'CLOSED'].includes(g.status)
  ).length;
  const submittedCount = grievances.filter(g => g.status === 'SUBMITTED').length;

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'UNDER_REVIEW':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'REJECTED':
        return { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' };
      default:
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' };
      case 'HIGH':
        return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
      case 'MEDIUM':
        return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' };
      default:
        return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
    }
  };

  return (
    <div className="container">
      {/* Top Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-role-citizen">Citizen Workspace</span>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <span className="badge-pulse"></span> Active Session
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Submit civic grievances, track official municipal handling, and view automated intelligence analysis.
          </p>
        </div>

        <Link to="/citizen/submit" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem' }}>
          <span>+</span> Submit New Grievance
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Submitted
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            {loading ? '...' : totalGrievances}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            All lifetime complaints
          </p>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            New Submissions
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.25rem', color: '#38bdf8' }}>
            {loading ? '...' : submittedCount}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Awaiting initial review
          </p>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            In Progress
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.25rem', color: '#fbbf24' }}>
            {loading ? '...' : inProgressCount}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Assigned & active handling
          </p>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resolved / Closed
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.25rem', color: '#34d399' }}>
            {loading ? '...' : resolvedCount}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Successfully concluded
          </p>
        </div>
      </div>

      {/* Recent Grievances Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Recent Grievances</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your recently lodged complaints and their current status</p>
          </div>
          {grievances.length > 0 && (
            <Link to="/citizen/my" className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              View All ({grievances.length}) →
            </Link>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading your grievances...</p>
          </div>
        ) : grievances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>No Grievances Submitted Yet</h4>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              You haven't filed any civic complaints yet. Notice a pothole, pipeline leak, or waste accumulation? Submit your grievance now.
            </p>
            <Link to="/citizen/submit" className="btn btn-primary">
              Submit Your First Grievance
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {grievances.slice(0, 5).map((g) => {
              const statusStyle = getStatusBadgeStyle(g.status);
              const priorityStyle = getPriorityStyle(g.priority);

              return (
                <div
                  key={g.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span
                        className="badge"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.7rem'
                        }}
                      >
                        {g.status.replace('_', ' ')}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                          border: `1px solid ${priorityStyle.color}40`,
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.7rem'
                        }}
                      >
                        {g.priority} PRIORITY
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(g.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {g.title}
                    </h4>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{g.category?.name || 'Unassigned (In Triage)'}</strong></span>
                      {g.location && <span>Location: <em>{g.location}</em></span>}
                    </div>
                  </div>

                  <Link
                    to={`/citizen/grievances/${g.id}`}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                  >
                    View Details →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
