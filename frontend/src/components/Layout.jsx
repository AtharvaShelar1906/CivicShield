import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="nav-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/" className="nav-brand">
              <span style={{ fontSize: '1.4rem' }}>⚖️</span>
              <span>Citizen Grievance Intelligence</span>
            </Link>
            <span className="badge badge-sdg" style={{ display: 'none', mdDisplay: 'inline-flex' }}>
              SDG 16
            </span>

            {user && user.role === 'CITIZEN' && (
              <nav className="nav-links" style={{ marginLeft: '1rem' }}>
                <Link
                  to="/citizen"
                  className={`nav-link ${location.pathname === '/citizen' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/citizen/submit"
                  className={`nav-link ${location.pathname === '/citizen/submit' ? 'active' : ''}`}
                >
                  Submit Grievance
                </Link>
                <Link
                  to="/citizen/my"
                  className={`nav-link ${location.pathname === '/citizen/my' || location.pathname.startsWith('/citizen/grievances') ? 'active' : ''}`}
                >
                  My Grievances
                </Link>
              </nav>
            )}

            {user && user.role === 'AUTHORITY' && (
              <nav className="nav-links" style={{ marginLeft: '1rem' }}>
                <Link
                  to="/authority"
                  className={`nav-link ${location.pathname === '/authority' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/authority/queue"
                  className={`nav-link ${location.pathname === '/authority/queue' || location.pathname.startsWith('/authority/grievances') ? 'active' : ''}`}
                >
                  Triage Queue
                </Link>
              </nav>
            )}

            {user && user.role === 'ADMIN' && (
              <nav className="nav-links" style={{ marginLeft: '1rem' }}>
                <Link
                  to="/admin"
                  className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/grievances"
                  className={`nav-link ${location.pathname === '/admin/grievances' || location.pathname.startsWith('/admin/grievances/') ? 'active' : ''}`}
                >
                  Grievances
                </Link>
                <Link
                  to="/admin/users"
                  className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
                >
                  Users
                </Link>
                <Link
                  to="/admin/audit"
                  className={`nav-link ${location.pathname === '/admin/audit' ? 'active' : ''}`}
                >
                  Audit Trail
                </Link>
              </nav>
            )}
          </div>

          <div className="nav-user">
            {user ? (
              <>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</span>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  {user.department && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {user.department}
                    </span>
                  )}
                </div>
                <button onClick={handleLogout} className="btn btn-outline-danger" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>
          Secure Citizen Grievance Intelligence System • UN SDG 16: Peace, Justice & Strong Institutions
        </p>
      </footer>
    </div>
  );
}
