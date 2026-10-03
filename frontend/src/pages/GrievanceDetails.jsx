import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function GrievanceDetails() {
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGrievance() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/grievances/${id}`);
        setGrievance(res.data.grievance);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Access Denied: You do not have permission to view this grievance.');
        } else if (err.response?.status === 404) {
          setError('Grievance not found. It may have been removed or the ID is invalid.');
        } else {
          setError(err.response?.data?.message || 'Failed to retrieve grievance details.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchGrievance();
    }
  }, [id]);

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
        return <span style={{ color: '#f43f5e', fontWeight: '700', fontSize: '0.85rem', background: 'rgba(244,63,94,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.25)' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ color: '#f97316', fontWeight: '700', fontSize: '0.85rem', background: 'rgba(249,115,22,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(249,115,22,0.25)' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.85rem', background: 'rgba(56,189,248,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.25)' }}>MEDIUM</span>;
      case 'LOW':
      default:
        return <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', background: 'rgba(148,163,184,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.25)' }}>LOW</span>;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading grievance details...</p>
        </div>
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '700px' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.05)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.25rem', color: '#fb7185', marginBottom: '0.5rem' }}>Unable to Access Grievance</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/citizen/my" className="btn btn-secondary">
            ← Return to My Grievances
          </Link>
        </div>
      </div>
    );
  }

  // Collect potential similarities (both directed relations)
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

  const analysis = grievance.analysis;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1050px' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/citizen/my" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back to My Grievances
        </Link>
      </div>

      {/* Main Header Card */}
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
              {grievance.title}
            </h1>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>Submitted: {new Date(grievance.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <div style={{ marginTop: '0.2rem' }}>Updated: {new Date(grievance.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            {grievance.resolvedAt && (
              <div style={{ marginTop: '0.2rem', color: '#34d399' }}>
                Resolved: {new Date(grievance.resolvedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            )}
          </div>
        </div>

        {/* Official Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Category</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {grievance.category ? grievance.category.name : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 'normal' }}>
                  Pending official assignment
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
                  <span style={{ fontWeight: '600' }}>{grievance.assignedTo.name}</span>
                  {grievance.assignedTo.department && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                      {grievance.assignedTo.department}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending assignment</span>
              )}
            </div>
          </div>
        </div>

        {/* Complaint Description */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Description
          </h3>
          <div
            style={{
              padding: '1rem 1.25rem',
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

      {/* Two Column Layout: AI Analysis vs Similar Complaints */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Stored AI Analysis / Advisory */}
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
              <span style={{ fontSize: '1.25rem' }}>🤖</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                AI Analysis / Advisory
              </h2>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              Advisory Only
            </span>
          </div>

          {analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Predicted Category</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {analysis.predictedCategory}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Confidence: {(analysis.categoryConfidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Suggested Priority</div>
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
                  <span style={{ fontWeight: '600', fontSize: '0.85rem', color: analysis.isAnomalous ? '#fb7185' : '#34d399' }}>
                    {analysis.isAnomalous ? 'Anomaly Detected' : 'Normal Pattern Verified'}
                  </span>
                </div>
                {analysis.anomalyReason && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {analysis.anomalyReason}
                  </p>
                )}
              </div>

              {/* Model Version Tag */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                <span>Model Engine:</span>
                <span style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>
                  {analysis.modelVersion}
                </span>
              </div>

              {/* Advisory Notice */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(245, 158, 11, 0.07)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}
              >
                ℹ️ <strong>Advisory Notice:</strong> These AI results are advisory predictions intended to assist administrative processing. Official category and priority are determined by authorized personnel.
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                AI Analysis is currently unavailable for this grievance.
              </p>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                Advisory assessment may be re-run during administrative review.
              </span>
            </div>
          )}
        </div>

        {/* Potentially Similar Grievances */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔍</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
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
                The following grievances share significant semantic similarity. Authorities use this data to identify clustering civic issues.
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
                    <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                      {(item.score * 100).toFixed(1)}% match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', opacity: 0.6 }}>🔍</div>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                No similar grievances detected.
              </p>
              <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>
                This submission appears unique compared to recent complaints in the system.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
