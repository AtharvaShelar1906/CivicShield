import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SubmitGrievance() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/grievances', {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined
      });

      setResult(response.data.grievance);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit grievance. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setResult(null);
    setError(null);
  };

  // If successfully submitted, render the detailed Advisory result view
  if (result) {
    const analysis = result.analysis;
    const similarities = result.similarAsSource || [];

    return (
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '0.75rem' }}>
            Submission Successful
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
            Grievance Registered
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Your complaint has been assigned tracking identifier <span className="mono-tag">{result.id}</span>
          </p>
        </div>

        {/* Official Status Card */}
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
            Official Record Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Status</span>
              <p style={{ fontWeight: '700', color: '#38bdf8' }}>{result.status}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Official Priority</span>
              <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{result.priority} (Default Initial)</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Authoritative Category</span>
              <p style={{ fontWeight: '700', color: 'var(--text-muted)' }}>Pending Authority Triage</p>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Complaint Title</span>
            <p style={{ fontWeight: '600', fontSize: '1rem' }}>{result.title}</p>
          </div>
        </div>

        {/* AI Advisory Intelligence Card */}
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🤖</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>AI Analysis / Advisory</h3>
            </div>
            <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              Non-Authoritative
            </span>
          </div>

          {analysis ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Predicted Category</span>
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                    {analysis.predictedCategory}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Confidence: <strong>{Math.round(analysis.categoryConfidence * 100)}%</strong>
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Suggested Priority</span>
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: analysis.predictedPriority === 'CRITICAL' ? '#f43f5e' : analysis.predictedPriority === 'HIGH' ? '#f97316' : '#38bdf8', marginTop: '0.2rem' }}>
                    {analysis.predictedPriority}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Severity Score: <strong>{analysis.severityScore} / 1.0</strong>
                  </p>
                </div>
              </div>

              {/* Anomaly Notice */}
              {analysis.isAnomalous ? (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <span>🚨</span>
                  <div>
                    <strong>Flagged by Anomaly Detector:</strong> {analysis.anomalyReason}
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.9 }}>
                      This is an automated advisory flag for administrative review and does not automatically reject your complaint.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-emerald)', marginBottom: '1rem' }}>
                  <span>✓</span>
                  <span>Anomaly Scan: Valid complaint structure (no spam or abuse patterns detected).</span>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: 'var(--text-secondary)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                ℹ️ <strong>Advisory Notice:</strong> The predicted category and suggested priority are generated automatically by the local natural language processing pipeline. Authorized municipal officers will review and assign authoritative values during triage.
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Intelligence service was temporarily offline during submission. Your grievance has been recorded safely and will be triaged manually by authorities.
            </p>
          )}
        </div>

        {/* Similar Complaints Card */}
        {similarities.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-amber)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Potentially Similar Grievances Detected ({similarities.length})
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              The system noticed existing complaints with similar keywords in nearby civic records:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {similarities.map(sim => (
                <div key={sim.id} style={{ padding: '0.65rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{sim.targetGrievance?.title || 'Existing civic complaint'}</span>
                  <span className="mono-tag" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)' }}>
                    {Math.round(sim.similarityScore * 100)}% Match
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/citizen/grievances/${result.id}`} className="btn btn-primary">
            View Full Grievance Details
          </Link>
          <button type="button" onClick={handleReset} className="btn btn-secondary">
            Submit Another Grievance
          </button>
          <Link to="/citizen" className="btn btn-secondary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Submission Form View
  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <Link to="/citizen" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.35rem' }}>
          Submit Civic Grievance
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Report a public issue directly to municipal authorities. Automated intelligence will estimate urgency and categorize your issue upon submission.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Complaint Title <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g. Deep pothole and broken drain lid on Station Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
              maxLength={200}
              autoFocus
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Provide a concise, descriptive title (5 to 200 characters)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Detailed Description <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <textarea
              id="description"
              className="form-input"
              rows={6}
              placeholder="Describe the issue in detail: what happened, duration, risks to pedestrians/vehicles, and how many households are affected..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              maxLength={3000}
              style={{ resize: 'vertical' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Minimum 10 characters. Include clear facts and safety risks.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="location">
              General Location / Landmark (Optional)
            </label>
            <input
              id="location"
              type="text"
              className="form-input"
              placeholder="e.g. Near Metro Pillar 42, Sector 4, Station Road"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={255}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Helps dispatch municipal inspection teams to the exact vicinity
            </span>
          </div>

          {/* Policy Notice Box */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            🛡️ <strong>Governance Notice:</strong> Upon submission, your grievance will be initialized to status <strong style={{ color: 'var(--text-primary)' }}>SUBMITTED</strong> and priority <strong style={{ color: 'var(--text-primary)' }}>MEDIUM</strong>. Authoritative category and priority assignment are managed solely by designated authorities.
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link to="/citizen" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '160px' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  <span>Analyzing & Submitting...</span>
                </>
              ) : (
                'Submit Grievance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
