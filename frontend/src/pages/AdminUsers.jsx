import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action & Feedback
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState(null); // { user, newStatus, onConfirm }

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve user registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetUser, newStatus) => {
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/status`, { isActive: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u))
      );
      setActionSuccess(
        `User "${targetUser.name}" has been ${newStatus ? 'activated' : 'deactivated'} successfully.`
      );
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-role-admin';
      case 'AUTHORITY':
        return 'badge-role-authority';
      default:
        return 'badge-role-citizen';
    }
  };

  // Client-side filtering
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = u.isActive === true;
    if (statusFilter === 'INACTIVE') matchesStatus = u.isActive === false;

    return matchesSearch && matchesRole && matchesStatus;
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
            User Registry & Access Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Manage account status, departmental affiliations, and administrative access governance
          </p>
        </div>

        <button onClick={fetchUsers} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          🔄 Refresh Users
        </button>
      </div>

      {/* Action Feedback */}
      {actionSuccess && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>✅</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>⚠️</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{actionError}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '1.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Confirm Account {confirmDialog.newStatus ? 'Activation' : 'Deactivation'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              {confirmDialog.newStatus ? (
                <>Are you sure you want to activate the account for <strong>{confirmDialog.user.name}</strong> ({confirmDialog.user.email})? They will be able to log in immediately.</>
              ) : (
                <>Are you sure you want to deactivate the account for <strong>{confirmDialog.user.name}</strong> ({confirmDialog.user.email})? They will be immediately blocked from signing in.</>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn btn-secondary"
                disabled={actionLoading}
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={confirmDialog.newStatus ? 'btn btn-primary' : 'btn btn-outline-danger'}
                disabled={actionLoading}
                style={{ fontSize: '0.85rem' }}
              >
                {actionLoading ? 'Updating...' : confirmDialog.newStatus ? 'Activate User' : 'Deactivate User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Search Name / Email / Dept
            </label>
            <input
              type="text"
              placeholder="Search user registry..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Role Tier
            </label>
            <select
              className="form-control"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Roles</option>
              <option value="CITIZEN">Citizen</option>
              <option value="AUTHORITY">Authority</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Status
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Count Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>
          Showing {filteredUsers.length} of {users.length} registered users
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading user registry...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: '#fb7185', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Error Loading Registry</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
          <button onClick={fetchUsers} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* User Table/Card List */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>User / Email</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Activity</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Registered</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {u.name} {isCurrentAdmin && <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {u.email}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {u.department || '—'}
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        {u.isActive ? (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                            ● Active
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                            ○ Deactivated
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.role === 'CITIZEN' && <span>{u._count?.submittedGrievances || 0} submitted</span>}
                        {u.role === 'AUTHORITY' && <span>{u._count?.assignedGrievances || 0} assigned</span>}
                        {u.role === 'ADMIN' && <span>System Root</span>}
                      </td>

                      <td style={{ padding: '1rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {isCurrentAdmin ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Self-protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                user: u,
                                newStatus: !u.isActive,
                                onConfirm: () => handleToggleStatus(u, !u.isActive)
                              });
                            }}
                            className={u.isActive ? 'btn btn-outline-danger' : 'btn btn-secondary'}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                            disabled={actionLoading}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
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
