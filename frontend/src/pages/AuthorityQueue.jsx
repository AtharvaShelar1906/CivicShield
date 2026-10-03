import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthorityQueue() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState('ALL');

  const fetchQueueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [grievanceRes, categoryRes] = await Promise.all([
        api.get('/grievances'),
        api.get('/grievances/categories')
      ]);
      setGrievances(grievanceRes.data.grievances || []);
      setCategories(categoryRes.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load grievance queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
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

  // Client-side filtering across visible dataset
  const filteredGrievances = grievances.filter((g) => {
    // Search
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.location && g.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.id && g.id.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;

    // Priority
    const matchesPriority = priorityFilter === 'ALL' || g.priority === priorityFilter;

    // Category
    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'UNASSIGNED' && !g.categoryId) ||
      g.categoryId === categoryFilter;

    // Assignment
    let matchesAssignment = true;
    if (assignmentFilter === 'ME') {
      matchesAssignment = g.assignedToId === user?.id;
    } else if (assignmentFilter === 'UNASSIGNED') {
      matchesAssignment = !g.assignedToId;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignment;
  });

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Authority Grievance Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Filter, inspect, categorize, and transition civic complaints under municipal authority
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchQueueData} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            🔄 Refresh Queue
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          {/* Keyword Search */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Search Keywords / ID
            </label>
            <input
              type="text"
              placeholder="Filter by keyword, location, or ID..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Priority
            </label>
            <select
              className="form-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Category
            </label>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Categories</option>
              <option value="UNASSIGNED">Pending Categorization</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assignment
            </label>
            <select
              className="form-control"
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Visible</option>
              <option value="ME">Assigned to Me</option>
              <option value="UNASSIGNED">Unassigned Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Count Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>
          Showing {filteredGrievances.length} of {grievances.length} visible complaints
        </span>
        {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || assignmentFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCategoryFilter('ALL');
              setAssignmentFilter('ALL');
            }}
            className="btn btn-outline"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1rem', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading grievance queue...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: '#fb7185', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Error Loading Queue</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
          <button onClick={fetchQueueData} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && grievances.length === 0 && (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.7 }}>📭</div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Grievances Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto' }}>
            There are currently no complaints in your departmental queue. New citizen submissions will appear here automatically.
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && !error && grievances.length > 0 && filteredGrievances.length === 0 && (
        <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            No complaints match the selected filter criteria.
          </p>
        </div>
      )}

      {/* Grievances Queue List */}
      {!loading && !error && filteredGrievances.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredGrievances.map((g) => {
            const isAssignedToMe = g.assignedToId === user?.id;
            return (
              <div
                key={g.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  borderLeft: isAssignedToMe ? '4px solid #38bdf8' : !g.assignedToId ? '4px solid #fbbf24' : '1px solid var(--border-color)',
                  transition: 'border-color 0.2s ease, transform 0.2s ease'
                }}
              >
                <div style={{ flex: '1 1 550px' }}>
                  {/* Status & Priority Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{g.id.substring(0, 8)}
                    </span>
                    {getStatusBadge(g.status)}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority:</span>
                      {getPriorityBadge(g.priority)}
                    </div>

                    {/* Category */}
                    {g.category ? (
                      <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                        {g.category.name}
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem' }}>
                        Pending Category
                      </span>
                    )}

                    {/* Assigned Officer */}
                    {isAssignedToMe ? (
                      <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', fontSize: '0.75rem' }}>
                        👤 Assigned to You
                      </span>
                    ) : g.assignedTo ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        👤 {g.assignedTo.name}
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem' }}>
                        ⚠️ Unassigned
                      </span>
                    )}
                  </div>

                  {/* Grievance Title */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                    {g.title}
                  </h3>

                  {/* Complaint Excerpt */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.45rem 0', lineHeight: 1.4 }}>
                    {g.description.length > 150 ? `${g.description.substring(0, 150)}...` : g.description}
                  </p>

                  {/* Metadata Row */}
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {g.location && <span>📍 {g.location}</span>}
                    <span>🕒 Submitted: {new Date(g.createdAt).toLocaleDateString()}</span>
                    <span>🔄 Updated: {new Date(g.updatedAt).toLocaleDateString()}</span>
                    {g.analysis && (
                      <span style={{ color: 'var(--accent-cyan)' }}>
                        🤖 AI Advisory: {g.analysis.predictedCategory} ({g.analysis.predictedPriority})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link
                    to={`/authority/grievances/${g.id}`}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    Triage & Action →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
