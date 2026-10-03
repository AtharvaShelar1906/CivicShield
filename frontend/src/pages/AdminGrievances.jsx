import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');

  const fetchGrievancesData = async () => {
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
      setError(err.response?.data?.message || 'Failed to load system-wide grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievancesData();
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

  // Client-side filtering
  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.location && g.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.id && g.id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || g.priority === priorityFilter;

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'UNASSIGNED' && !g.categoryId) ||
      g.categoryId === categoryFilter;

    let matchesAssigned = true;
    if (assignedFilter === 'ASSIGNED') matchesAssigned = !!g.assignedToId;
    if (assignedFilter === 'UNASSIGNED') matchesAssigned = !g.assignedToId;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned;
  });

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Link to="/admin" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Admin Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            System-Wide Grievance Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Unrestricted administrative visibility and cross-departmental oversight
          </p>
        </div>

        <button onClick={fetchGrievancesData} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          🔄 Refresh Grievances
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Search Title / Location / ID
            </label>
            <input
              type="text"
              placeholder="Search all grievances..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

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
              <option value="UNASSIGNED">Unassigned Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Authority Assignment
            </label>
            <select
              className="form-control"
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Visible</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNASSIGNED">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>
          Showing {filteredGrievances.length} of {grievances.length} total municipal complaints
        </span>
        {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || assignedFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCategoryFilter('ALL');
              setAssignedFilter('ALL');
            }}
            className="btn btn-outline"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading system grievances...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: '#fb7185', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Error Loading Grievances</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
          <button onClick={fetchGrievancesData} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Grievances List */}
      {!loading && !error && filteredGrievances.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredGrievances.map((g) => (
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
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
            >
              <div style={{ flex: '1 1 550px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    #{g.id.substring(0, 8)}
                  </span>
                  {getStatusBadge(g.status)}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority:</span>
                    {getPriorityBadge(g.priority)}
                  </div>
                  {g.category ? (
                    <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                      {g.category.name}
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem' }}>
                      Pending Category
                    </span>
                  )}
                  {g.assignedTo ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      👤 {g.assignedTo.name} ({g.assignedTo.department || 'Authority'})
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem' }}>
                      ⚠️ Unassigned
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                  {g.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.45rem 0', lineHeight: 1.4 }}>
                  {g.description.length > 150 ? `${g.description.substring(0, 150)}...` : g.description}
                </p>

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {g.location && <span>📍 {g.location}</span>}
                  <span>👤 Submitter: {g.submittedBy?.name || 'Citizen'}</span>
                  <span>🕒 Submitted: {new Date(g.createdAt).toLocaleDateString()}</span>
                  <span>🔄 Updated: {new Date(g.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <Link
                  to={`/admin/grievances/${g.id}`}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  Admin Review & Correct →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
