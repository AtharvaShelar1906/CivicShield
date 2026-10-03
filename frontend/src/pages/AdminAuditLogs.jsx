import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [searchActor, setSearchActor] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  // Client-side text filter on actor
  const filteredLogs = logs.filter((log) => {
    if (!searchActor) return true;
    const actorName = log.user?.name || 'System / Anonymous';
    const actorEmail = log.user?.email || '';
    const term = searchActor.toLowerCase();
    return actorName.toLowerCase().includes(term) || actorEmail.toLowerCase().includes(term);
  });

  const getActionBadgeColor = (action) => {
    if (action.includes('DEACTIVATED') || action.includes('FAILED') || action.includes('REJECTED')) {
      return { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' };
    }
    if (action.includes('ACTIVATED') || action.includes('SUCCESS') || action.includes('RESOLVED')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (action.includes('ASSIGNED') || action.includes('UPDATED')) {
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
    }
    return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
  };

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
            Immutable Security & Triage Audit Trail
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Complete tamper-evident record of all system authentication, user access, and grievance mutations
          </p>
        </div>

        <button onClick={fetchLogs} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          🔄 Refresh Logs
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter by Action
            </label>
            <select
              className="form-control"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="">All Actions</option>
              <option value="GRIEVANCE_SUBMITTED">GRIEVANCE_SUBMITTED</option>
              <option value="GRIEVANCE_ASSIGNED">GRIEVANCE_ASSIGNED</option>
              <option value="GRIEVANCE_STATUS_UPDATED">GRIEVANCE_STATUS_UPDATED</option>
              <option value="GRIEVANCE_PRIORITY_UPDATED">GRIEVANCE_PRIORITY_UPDATED</option>
              <option value="GRIEVANCE_CATEGORY_UPDATED">GRIEVANCE_CATEGORY_UPDATED</option>
              <option value="AI_ANALYSIS_EXECUTED">AI_ANALYSIS_EXECUTED</option>
              <option value="USER_ACTIVATED">USER_ACTIVATED</option>
              <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Entity Type
            </label>
            <select
              className="form-control"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="">All Entity Types</option>
              <option value="Grievance">Grievance</option>
              <option value="User">User</option>
              <option value="GrievanceAnalysis">GrievanceAnalysis</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Search Actor (Name / Email)
            </label>
            <input
              type="text"
              placeholder="Search by actor..."
              className="form-control"
              value={searchActor}
              onChange={(e) => setSearchActor(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>
          Showing {filteredLogs.length} of {total} total audit records (Latest 100)
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Querying audit trail...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: '#fb7185', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Error Loading Audit Logs</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
          <button onClick={fetchLogs} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Audit Log Table */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Actor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Target Entity</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Details Summary</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const badgeStyle = getActionBadgeColor(log.action);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '0.85rem 1.25rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className="badge"
                          style={{
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: `1px solid ${badgeStyle.border}`,
                            fontSize: '0.72rem',
                            fontWeight: '600'
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {log.user ? (
                          <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.user.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                              {log.user.role} • {log.user.email}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                            System / Unauthenticated
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{log.entityType}</span>
                        {log.entityId && (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            #{log.entityId.substring(0, 8)}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {log.details ? (
                          <code style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {JSON.stringify(log.details)}
                          </code>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
