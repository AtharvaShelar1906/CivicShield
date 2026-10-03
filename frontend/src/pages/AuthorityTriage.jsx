import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthorityTriage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [grievance, setGrievance] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Action & Feedback State
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Controls State
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('');

  // Confirmation Modal / Dialog State
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, title, message, onConfirm }

  const fetchGrievanceData = async () => {
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
      setSelectedAuthorityId(g.assignedToId || user?.id || '');

      setCategories(categoryRes.data.categories || []);
      setAuthorities(authorityRes.data.authorities || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Forbidden: This grievance is assigned to another authority officer.');
      } else if (err.response?.status === 404) {
        setError('Grievance not found. The ID may be invalid.');
      } else {
        setError(err.response?.data?.message || 'Failed to retrieve grievance details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGrievanceData();
    }
  }, [id]);

  // Allowed transitions per backend state machine
  const getAllowedTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'SUBMITTED':
        return ['UNDER_REVIEW'];
      case 'UNDER_REVIEW':
        return ['ASSIGNED', 'REJECTED'];
      case 'ASSIGNED':
        return ['IN_PROGRESS'];
      case 'IN_PROGRESS':
        return ['RESOLVED'];
      case 'RESOLVED':
        return ['CLOSED'];
      default:
        return [];
    }
  };

  // Helper clear feedback messages after 5 seconds
  const setFeedback = (successMsg, errorMsg) => {
    setActionSuccess(successMsg);
    setActionError(errorMsg);
    if (successMsg) {
      setTimeout(() => setActionSuccess(null), 6000);
    }
  };

  // 1. Update Official Priority
  const handleUpdatePriority = async (newPriority) => {
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/grievances/${id}/priority`, { priority: newPriority });
      setGrievance(res.data.grievance);
      setSelectedPriority(res.data.grievance.priority);
      setFeedback(`Official priority updated to "${newPriority}".`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Failed to update priority.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  // 2. Update Official Category
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
      setFeedback(`Official category updated to "${catName}".`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Failed to update category.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  // 3. Assign Grievance
  const handleAssign = async (targetOfficerId) => {
    if (!targetOfficerId) return;
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/grievances/${id}/assign`, { assignedToId: targetOfficerId });
      setGrievance(res.data.grievance);
      setSelectedAuthorityId(targetOfficerId);
      const officerName = authorities.find((a) => a.id === targetOfficerId)?.name || (targetOfficerId === user?.id ? user?.name : 'Officer');
      setFeedback(`Grievance successfully assigned to ${officerName}. Status transitioned to ASSIGNED.`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Failed to assign grievance.');
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  // 4. Update Status Transition
  const handleUpdateStatus = async (nextStatus) => {
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.patch(`/grievances/${id}/status`, { status: nextStatus });
      setGrievance(res.data.grievance);
      setFeedback(`Grievance workflow status updated to "${nextStatus.replace('_', ' ')}".`, null);
    } catch (err) {
      setFeedback(null, err.response?.data?.message || 'Status transition rejected.');
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading grievance triage workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '750px' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.25rem', color: '#fb7185', marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/authority/queue" className="btn btn-secondary">
            ← Return to Authority Queue
          </Link>
        </div>
      </div>
    );
  }

  const analysis = grievance.analysis;
  const allowedTransitions = getAllowedTransitions(grievance.status);

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

  // Find matching category object for AI prediction if exists
  const aiPredictedCategoryObj = analysis
    ? categories.find((c) => c.name.toLowerCase() === analysis.predictedCategory?.toLowerCase())
    : null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to="/authority/queue" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back to Authority Queue
        </Link>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Authority Triage Session • {user?.name} ({user?.department || 'Operations'})
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
                className={confirmDialog.confirmBtnClass || 'btn btn-primary'}
                disabled={actionLoading}
                style={{ fontSize: '0.85rem' }}
              >
                {actionLoading ? 'Processing...' : confirmDialog.confirmBtnLabel || 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grievance Record Card */}
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
                  Pending authoritative triage
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
                <span style={{ color: '#fbbf24', fontWeight: '600' }}>⚠️ Unassigned (Open for triage)</span>
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
            Citizen Description
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

      {/* Interactive Authority Triage Controls Panel */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid var(--accent-blue)',
          background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.03) 0%, transparent 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.3rem' }}>⚙️</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Administrative Triage & Workflow Management
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* 1. Official Priority Triage */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              1. Official Priority Triage
            </h3>

            {/* AI Suggestion Comparison Banner */}
            {analysis && (
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  marginBottom: '1rem',
                  fontSize: '0.82rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>AI Suggested: <strong>{analysis.predictedPriority}</strong> (Severity: {(analysis.severityScore * 10).toFixed(1)}/10)</span>
                  {grievance.priority !== analysis.predictedPriority && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          type: 'priority',
                          title: 'Confirm Priority Update',
                          message: `Adopt AI suggested priority "${analysis.predictedPriority}" as the official grievance priority?`,
                          onConfirm: () => handleUpdatePriority(analysis.predictedPriority)
                        })
                      }
                      className="btn"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', background: 'var(--accent-blue)', color: '#fff' }}
                      disabled={actionLoading}
                    >
                      Adopt {analysis.predictedPriority}
                    </button>
                  )}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Current Official: <strong style={{ color: 'var(--text-primary)' }}>{grievance.priority}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    if (p === grievance.priority) return;
                    setConfirmDialog({
                      type: 'priority',
                      title: 'Confirm Priority Change',
                      message: `Are you sure you want to change the official priority from "${grievance.priority}" to "${p}"?`,
                      onConfirm: () => handleUpdatePriority(p)
                    });
                  }}
                  disabled={actionLoading || p === grievance.priority}
                  className="btn"
                  style={{
                    flex: '1 1 70px',
                    padding: '0.45rem',
                    fontSize: '0.8rem',
                    background: p === grievance.priority ? 'var(--primary-color)' : 'var(--bg-primary)',
                    color: p === grievance.priority ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    opacity: p === grievance.priority ? 1 : 0.85
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Official Category Assignment */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              2. Authoritative Categorization
            </h3>

            {/* AI Category Suggestion Banner */}
            {analysis && (
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(6, 182, 212, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  marginBottom: '1rem',
                  fontSize: '0.82rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>AI Predicted: <strong>{analysis.predictedCategory}</strong> ({(analysis.categoryConfidence * 100).toFixed(1)}%)</span>
                  {aiPredictedCategoryObj && grievance.categoryId !== aiPredictedCategoryObj.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          type: 'category',
                          title: 'Confirm Category Assignment',
                          message: `Assign official category "${aiPredictedCategoryObj.name}" recommended by the AI advisor?`,
                          onConfirm: () => handleUpdateCategory(aiPredictedCategoryObj.id)
                        })
                      }
                      className="btn"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', background: 'var(--accent-cyan)', color: '#000' }}
                      disabled={actionLoading}
                    >
                      Adopt Suggestion
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Select Official Category --</option>
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
                    type: 'category',
                    title: 'Confirm Category Assignment',
                    message: `Assign official category to "${catName}"?`,
                    onConfirm: () => handleUpdateCategory(selectedCategoryId)
                  });
                }}
                disabled={actionLoading || !selectedCategoryId || selectedCategoryId === grievance.categoryId}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', whiteSpace: 'nowrap' }}
              >
                Set Category
              </button>
            </div>
          </div>

          {/* 3. Authority Assignment */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              3. Officer Assignment
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {/* Quick Assign to Me */}
              {grievance.assignedToId !== user?.id && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      type: 'assign',
                      title: 'Assign to Self',
                      message: `Take custody of this complaint and assign it to yourself (${user?.name})?`,
                      onConfirm: () => handleAssign(user?.id)
                    })
                  }
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  disabled={actionLoading}
                >
                  👤 Assign to Myself
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control"
                value={selectedAuthorityId}
                onChange={(e) => setSelectedAuthorityId(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Choose Active Authority --</option>
                {authorities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.department || 'Authority'}) {a.id === user?.id ? '— (You)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!selectedAuthorityId || selectedAuthorityId === grievance.assignedToId) return;
                  const officerName = authorities.find((a) => a.id === selectedAuthorityId)?.name;
                  setConfirmDialog({
                    type: 'assign',
                    title: 'Confirm Assignment',
                    message: `Assign this grievance to officer ${officerName}? Status will transition to ASSIGNED.`,
                    onConfirm: () => handleAssign(selectedAuthorityId)
                  });
                }}
                disabled={actionLoading || !selectedAuthorityId || selectedAuthorityId === grievance.assignedToId}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', whiteSpace: 'nowrap' }}
              >
                Assign
              </button>
            </div>
          </div>

          {/* 4. Workflow State Transitions */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              4. Workflow Status Transitions
            </h3>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Current: <strong>{grievance.status.replace('_', ' ')}</strong> • Allowed next states:
            </div>

            {allowedTransitions.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {allowedTransitions.map((nextStatus) => {
                  const isDestructive = ['REJECTED', 'CLOSED'].includes(nextStatus);
                  const isSuccess = nextStatus === 'RESOLVED';
                  return (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() => {
                        const labels = {
                          UNDER_REVIEW: 'Move to Under Review',
                          ASSIGNED: 'Transition to Assigned',
                          IN_PROGRESS: 'Begin In-Progress Work',
                          RESOLVED: 'Mark as Resolved',
                          CLOSED: 'Close Grievance',
                          REJECTED: 'Reject Grievance'
                        };
                        const confirmPrompt = isDestructive
                          ? `Are you sure you want to mark this grievance as ${nextStatus}? This is a final or restrictive state transition.`
                          : isSuccess
                          ? `Mark this grievance as RESOLVED? This sets the authoritative resolved timestamp.`
                          : `Transition this grievance status to "${nextStatus}"?`;

                        setConfirmDialog({
                          type: 'status',
                          title: `Confirm Status: ${nextStatus.replace('_', ' ')}`,
                          message: confirmPrompt,
                          confirmBtnClass: isDestructive ? 'btn btn-outline-danger' : isSuccess ? 'btn btn-primary' : 'btn btn-primary',
                          confirmBtnLabel: `Transition to ${nextStatus.replace('_', ' ')}`,
                          onConfirm: () => handleUpdateStatus(nextStatus)
                        });
                      }}
                      className={isDestructive ? 'btn btn-outline-danger' : 'btn btn-primary'}
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                      disabled={actionLoading}
                    >
                      → Transition to {nextStatus.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                This grievance is in terminal state ({grievance.status}). No further authority transitions available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Stored Advisory AI vs Similar Complaints */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Stored AI Advisory Card */}
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

              {/* Anomaly Detection Status */}
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
                    {analysis.isAnomalous ? 'Anomaly Flagged' : 'Normal Complaint Pattern'}
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

              {/* Explicit Advisory Disclaimer */}
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(245, 158, 11, 0.07)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}
              >
                ℹ️ <strong>Officer Guidance:</strong> AI predictions are assistive advisory indicators generated by machine learning. Municipal officers retain full authority and responsibility for official categorization and resolution.
              </div>
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                No automated AI analysis was recorded for this grievance.
              </p>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                Please proceed with manual administrative triage.
              </span>
            </div>
          )}
        </div>

        {/* Potentially Similar Grievances */}
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Complaints with matching semantic vectors. Check for civic clustering or duplicate submissions:
              </p>

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
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    {item.isPotentialDuplicate && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                        Potential Duplicate
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Status: {item.status.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Priority: {item.priority}</span>
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                      {(item.score * 100).toFixed(1)}% similarity
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', opacity: 0.6 }}>🔍</div>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                No similar complaints detected in municipal records.
              </p>
              <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>
                This grievance represents an isolated civic report.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
