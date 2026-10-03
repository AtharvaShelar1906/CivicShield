import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      // Check if user came from a specific protected page
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }

      // Default role-based redirect
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'AUTHORITY') {
        navigate('/authority', { replace: true });
      } else {
        navigate('/citizen', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for development demonstration
  const quickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            System Login
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Enter your credentials to access your civic account
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Authenticating...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-links">
          Don't have a citizen account? <Link to="/register">Register here</Link>
        </div>

        {/* Development Seed Quick Fill */}
        <div className="quick-fill-bar">
          <div className="quick-fill-title">Demo Seed Credentials:</div>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="btn-chip"
              onClick={() => quickFill('aarav.citizen@example.com', 'CitizenPass123!')}
            >
              Citizen (Aarav)
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => quickFill('authority.roads@grievance.gov.in', 'AuthorityPass123!')}
            >
              Authority (Roads)
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => quickFill('admin@grievance.gov.in', 'AdminPass123!')}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
