import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminGrievanceDetail() {
  const { id } = useParams();

  const [grievance, setGrievance] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Administrative Action State
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Correction Form States
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, confirmBtnLabel, isDestructive }

  const fetchDetailData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [grievanceRes, categoryRes, authorityRes] = await Promise.all([
        api.get(`/grievances/${id}`),
        api.get('/grievances/categories'),
        api.get('/grievances/authorities').catch(() => ({ data: { authorities: [] } }))
      ]);

      const g = grievanceRes.data.grievance;
      setGrievance(g);
      setSelectedPriority(g.priority);
      setSelectedCategoryId(g.categoryId || '');
      setSelectedAuthorityId(g.assignedToId || '');
      setSelectedStatus(g.status);

      setCategories(categoryRes.data.categories || []);
      setAuthorities(authorityRes.data.authorities || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Grievance not found. The ID may be invalid.');
      } else {
        setError(err.response?.data?.message || 'Failed to retrieve administrative grievance record.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetailData();
    }
  }, [id]);

  const setFeedback = (successMsg, errorMsg) => {
    setActionSuccess(successMsg);
    setActionError(errorMsg);
    if (successMsg) {
      setTimeout(() => setActionSuccess(null), 6000);
    }
  };

  // 1. Admin Priority Correction
  const handleUpdatePriority = async (newPriority) => {
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/grievances/${id}/priority`, { priority: newPriority });
      setGrievance(res.data.grievance);
      setSelectedPriority(res.data.grievance.priority);
      setFeedback(`[Admin Correction] Official priority updated to "${newPriority}".`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Failed to update priority.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  // 2. Admin Category Correction
  const handleUpdateCategory = async (catId) => {
    if (!catId) return;
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/grievances/${id}/category`, { categoryId: catId });
      setGrievance(res.data.grievance);
      setSelectedCategoryId(catId);
      const catName = categories.find((c) => c.id === catId)?.name || 'Updated';
      setFeedback(`[Admin Correction] Official category assigned to "${catName}".`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Failed to update category.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  // 3. Admin Assignment / Reassignment
  const handleAssign = async (targetOfficerId) => {
    if (!targetOfficerId) return;
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/grievances/${id}/assign`, { assignedToId: targetOfficerId });
      setGrievance(res.data.grievance);
      setSelectedAuthorityId(targetOfficerId);
      const officerName = authorities.find((a) => a.id === targetOfficerId)?.name || 'Officer';
      setFeedback(`[Admin Correction] Grievance assigned/reassigned to ${officerName}.`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Failed to assign grievance.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  // 4. Admin Workflow Status Administrative Correction
  const handleUpdateStatus = async (newStatus) => {
    if (!newStatus) return;
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/grievances/${id}/status`, { status: newStatus });
      setGrievance(res.data.grievance);
      setSelectedStatus(newStatus);
      setFeedback(`[Admin Correction] Workflow status corrected to "${newStatus.replace('_', ' ')}".`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Status correction rejected.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

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
        return <span style={{ color: '#f43f5e', fontWeight: '700', fontSize: '0.85rem', background: 'rgba(244,63,94,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.25)' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ color: '#f97316', fontWeight: '700', fontSize: '0.85rem', background: 'rgba(249,115,22,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(249,115,22,0.25)' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.85rem', background: 'rgba(56,189,248,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.25)' }}>MEDIUM</span>;
      default:
        return <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', background: 'rgba(148,163,184,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.25)' }}>LOW</span>;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading administrative grievance record...</p>
        </div>
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '750px' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', color: '#fb7185', marginBottom: '0.5rem' }}>Unable to Access Grievance</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/admin/grievances" className="btn btn-secondary">
            ← Return to Admin Grievances
          </Link>
        </div>
      </div>
    );
  }

  const analysis = grievance.analysis;

  // Collect potential similarities
  const similarItems = [];
  if (Array.isArray(grievance.similarAsSource)) {
    grievance.similarAsSource.forEach((sim) => {
      if (sim.targetGrievance) {
        similarItems.push({
          id: sim.targetGrievance.id,
          title: sim.targetGrievance.title,
          status: sim.targetGrievance.status,
          priority: sim.targetGrievance.priority,
          score: sim.similarityScore,
          isPotentialDuplicate: sim.similarityScore >= 0.70
        });
      }
    });
  }
  if (Array.isArray(grievance.similarAsTarget)) {
    grievance.similarAsTarget.forEach((sim) => {
      if (sim.sourceGrievance && !similarItems.some((item) => item.id === sim.sourceGrievance.id)) {
        similarItems.push({
          id: sim.sourceGrievance.id,
          title: sim.sourceGrievance.title,
          status: sim.sourceGrievance.status,
          priority: sim.sourceGrievance.priority,
          score: sim.similarityScore,
          isPotentialDuplicate: sim.similarityScore >= 0.70
        });
      }
    });
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to="/admin/grievances" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back to Admin Grievances
        </Link>
        <span className="badge badge-role-admin" style={{ fontSize: '0.75rem' }}>
          Administrator Root Session
        </span>
      </div>

      {/* Action Success / Error Notifications */}
      {actionSuccess && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✅</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
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
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              {confirmDialog.message}
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
                className={confirmDialog.isDestructive ? 'btn btn-outline-danger' : 'btn btn-primary'}
                disabled={actionLoading}
                style={{ fontSize: '0.85rem' }}
              >
                {actionLoading ? 'Processing...' : confirmDialog.confirmBtnLabel || 'Confirm Correction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Grievance Record Card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                ID: {grievance.id}
              </span>
              {getStatusBadge(grievance.status)}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Priority:</span>
                {getPriorityBadge(grievance.priority)}
              </div>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
              {grievance.title}
            </h1>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>Submitted: {new Date(grievance.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <div style={{ marginTop: '0.2rem' }}>Last Update: {new Date(grievance.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            {grievance.resolvedAt && (
              <div style={{ marginTop: '0.2rem', color: '#34d399', fontWeight: '600' }}>
                Resolved: {new Date(grievance.resolvedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            )}
          </div>
        </div>

        {/* Official Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Category</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {grievance.category ? grievance.category.name : (
                <span style={{ color: '#fbbf24', fontStyle: 'italic', fontWeight: 'normal' }}>
                  Pending authoritative category
                </span>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {grievance.location ? `📍 ${grievance.location}` : <span style={{ color: 'var(--text-muted)' }}>Not specified</span>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Authority</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {grievance.assignedTo ? (
                <div>
                  <span style={{ fontWeight: '700' }}>👤 {grievance.assignedTo.name}</span>
                  {grievance.assignedTo.department && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {grievance.assignedTo.department}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ color: '#fbbf24', fontWeight: '600' }}>⚠️ Unassigned</span>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citizen Submitter</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {grievance.submittedBy ? (
                <div>
                  <span style={{ fontWeight: '600' }}>{grievance.submittedBy.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    {grievance.submittedBy.email}
                  </span>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Verified Citizen</span>
              )}
            </div>
          </div>
        </div>

        {/* Complaint Description */}
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Description
          </h3>
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-primary)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}
          >
            {grievance.description}
          </div>
        </div>
      </div>

      {/* Central Administrator Corrections Control Panel */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #f43f5e',
          background: 'linear-gradient(180deg, rgba(244, 63, 94, 0.03) 0%, transparent 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🛡️</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            System Administrative Corrections & Governance Overrides
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* 1. Official Priority Override */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              1. Correct Official Priority
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Current: <strong>{grievance.priority}</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    if (p === grievance.priority) return;
                    setConfirmDialog({
                      title: 'Confirm Priority Correction',
                      message: `Administratively override official priority from "${grievance.priority}" to "${p}"? This event will be logged in the immutable audit trail.`,
                      confirmBtnLabel: `Set Priority to ${p}`,
                      onConfirm: () => handleUpdatePriority(p)
                    });
                  }}
                  disabled={actionLoading || p === grievance.priority}
                  className="btn"
                  style={{
                    flex: '1 1 60px',
                    padding: '0.4rem',
                    fontSize: '0.78rem',
                    background: p === grievance.priority ? 'var(--primary-color)' : 'var(--bg-primary)',
                    color: p === grievance.priority ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Official Category Override */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              2. Correct Official Category
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!selectedCategoryId || selectedCategoryId === grievance.categoryId) return;
                  const catName = categories.find((c) => c.id === selectedCategoryId)?.name;
                  setConfirmDialog({
                    title: 'Confirm Category Correction',
                    message: `Administratively assign category "${catName}"?`,
                    confirmBtnLabel: 'Set Category',
                    onConfirm: () => handleUpdateCategory(selectedCategoryId)
                  });
                }}
                disabled={actionLoading || !selectedCategoryId || selectedCategoryId === grievance.categoryId}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* 3. Authority Assignment / Reassignment */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              3. Assign / Reassign Officer
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control"
                value={selectedAuthorityId}
                onChange={(e) => setSelectedAuthorityId(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Select Authority Officer --</option>
                {authorities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.department || 'Authority'})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!selectedAuthorityId || selectedAuthorityId === grievance.assignedToId) return;
                  const officerName = authorities.find((a) => a.id === selectedAuthorityId)?.name;
                  setConfirmDialog({
                    title: 'Confirm Officer Assignment',
                    message: `Assign or reassign this complaint to officer ${officerName}? Status will transition to ASSIGNED if previously unassigned.`,
                    confirmBtnLabel: 'Assign Officer',
                    onConfirm: () => handleAssign(selectedAuthorityId)
                  });
                }}
                disabled={actionLoading || !selectedAuthorityId || selectedAuthorityId === grievance.assignedToId}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
              >
                Assign
              </button>
            </div>
          </div>

          {/* 4. Administrative Workflow Status Correction */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              4. Workflow Status Correction
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                {['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!selectedStatus || selectedStatus === grievance.status) return;
                  const isDestructive = ['REJECTED', 'CLOSED'].includes(selectedStatus);
                  setConfirmDialog({
                    title: 'Confirm Workflow Status Correction',
                    message: `Administratively correct workflow status to "${selectedStatus.replace('_', ' ')}"? ${isDestructive ? 'Note: This represents a terminal or restrictive state.' : ''}`,
                    confirmBtnLabel: `Correct to ${selectedStatus.replace('_', ' ')}`,
                    isDestructive,
                    onConfirm: () => handleUpdateStatus(selectedStatus)
                  });
                }}
                disabled={actionLoading || !selectedStatus || selectedStatus === grievance.status}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Stored AI Advisory vs Potentially Similar Grievances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Stored Advisory AI */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.03) 0%, transparent 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🤖</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                AI Analysis — Advisory Only
              </h2>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              Non-Authoritative
            </span>
          </div>

          {analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predicted Category</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {analysis.predictedCategory}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Confidence: {(analysis.categoryConfidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Suggested Priority</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    {getPriorityBadge(analysis.predictedPriority)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Severity Score: {(analysis.severityScore * 10).toFixed(1)} / 10
                  </div>
                </div>
              </div>

              {/* Anomaly Result */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  background: analysis.isAnomalous ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${analysis.isAnomalous ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1rem' }}>{analysis.isAnomalous ? '⚠️' : '✅'}</span>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: analysis.isAnomalous ? '#fb7185' : '#34d399' }}>
                    {analysis.isAnomalous ? 'Anomaly Flagged by Pipeline' : 'Normal Complaint Verified'}
                  </span>
                </div>
                {analysis.anomalyReason && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {analysis.anomalyReason}
                  </p>
                )}
              </div>

              {/* Model Version Tag */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Model Pipeline:</span>
                <span style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>
                  {analysis.modelVersion}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No advisory AI analysis is available for this record.
            </div>
          )}
        </div>

        {/* Similar Grievances */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🔍</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Potentially Similar Grievances
              </h2>
            </div>
            <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
              {similarItems.length} {similarItems.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          {similarItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {similarItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    {item.isPotentialDuplicate && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        Potential Duplicate
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Status: {item.status.replace('_', ' ')} • Priority: {item.priority}</span>
                    <strong style={{ color: 'var(--primary-color)' }}>{(item.score * 100).toFixed(1)}% match</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No similar complaints detected in municipal records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
