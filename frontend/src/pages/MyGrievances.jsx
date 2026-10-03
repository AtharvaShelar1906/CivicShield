import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function MyGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/grievances/my');
      setGrievances(res.data.grievances || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your grievances. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

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
      case 'SUBMITTED':
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span style={{ color: '#f43f5e', fontWeight: '700', fontSize: '0.8rem', background: 'rgba(244,63,94,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.2)' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ color: '#f97316', fontWeight: '700', fontSize: '0.8rem', background: 'rgba(249,115,22,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(249,115,22,0.2)' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.8rem', background: 'rgba(56,189,248,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.2)' }}>MEDIUM</span>;
      case 'LOW':
      default:
        return <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.8rem', background: 'rgba(148,163,184,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.2)' }}>LOW</span>;
    }
  };

  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.location && g.location.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'IN_PROGRESS') {
      return matchesSearch && ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes(g.status);
    }
    if (statusFilter === 'RESOLVED') {
      return matchesSearch && ['RESOLVED', 'CLOSED'].includes(g.status);
    }
    return matchesSearch && g.status === statusFilter;
  });

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            My Grievances
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Track and monitor the status of all your submitted complaints
          </p>
        </div>
        <Link to="/citizen/submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>+</span>
          <span>Submit Grievance</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by title, description or location..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
            {['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className="btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  background: statusFilter === filter ? 'var(--primary-color)' : 'var(--bg-secondary)',
                  color: statusFilter === filter ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                {filter === 'ALL' ? 'All' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading your grievances...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: '#fb7185', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Error Loading Grievances</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
          <button onClick={fetchGrievances} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty List State */}
      {!loading && !error && grievances.length === 0 && (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.7 }}>📋</div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Grievances Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            You haven't submitted any civic complaints yet. If you have an issue in your area, submit a grievance to initiate official resolution.
          </p>
          <Link to="/citizen/submit" className="btn btn-primary">
            Submit Your First Grievance
          </Link>
        </div>
      )}

      {/* No Search Matches */}
      {!loading && !error && grievances.length > 0 && filteredGrievances.length === 0 && (
        <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            No grievances matched your search or status filter.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
            className="btn btn-outline"
            style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Grievances List */}
      {!loading && !error && filteredGrievances.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Showing {filteredGrievances.length} of {grievances.length} {grievances.length === 1 ? 'grievance' : 'grievances'}
          </div>

          {filteredGrievances.map((g) => (
            <div
              key={g.id}
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.25rem',
                flexWrap: 'wrap',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
            >
              <div style={{ flex: '1 1 500px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    #{g.id.substring(0, 8)}
                  </span>
                  {getStatusBadge(g.status)}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority:</span>
                    {getPriorityBadge(g.priority)}
                  </div>
                  {g.category ? (
                    <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                      {g.category.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Pending categorization
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                  {g.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                  {g.description.length > 140 ? `${g.description.substring(0, 140)}...` : g.description}
                </p>

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {g.location && (
                    <span>📍 {g.location}</span>
                  )}
                  <span>🕒 Submitted: {new Date(g.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span>🔄 Updated: {new Date(g.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  to={`/citizen/grievances/${g.id}`}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
