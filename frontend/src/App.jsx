import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitGrievance from './pages/SubmitGrievance';
import MyGrievances from './pages/MyGrievances';
import GrievanceDetails from './pages/GrievanceDetails';
import AuthorityDashboard from './pages/AuthorityDashboard';
import AuthorityQueue from './pages/AuthorityQueue';
import AuthorityTriage from './pages/AuthorityTriage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminGrievances from './pages/AdminGrievances';
import AdminGrievanceDetail from './pages/AdminGrievanceDetail';
import AdminAuditLogs from './pages/AdminAuditLogs';
import NotFound from './pages/NotFound';

/**
 * Root index component that routes authenticated users to their respective role portal
 * or redirects guests to /login.
 */
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Initializing session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'AUTHORITY') {
    return <Navigate to="/authority" replace />;
  }

  return <Navigate to="/citizen" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Root index redirect */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Public authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Citizen role-protected routes */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/submit"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <SubmitGrievance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/my"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <MyGrievances />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/grievances/:id"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <GrievanceDetails />
                </ProtectedRoute>
              }
            />

            {/* Authority role-protected routes */}
            <Route
              path="/authority"
              element={
                <ProtectedRoute allowedRoles={['AUTHORITY', 'ADMIN']}>
                  <AuthorityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/queue"
              element={
                <ProtectedRoute allowedRoles={['AUTHORITY', 'ADMIN']}>
                  <AuthorityQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/grievances/:id"
              element={
                <ProtectedRoute allowedRoles={['AUTHORITY', 'ADMIN']}>
                  <AuthorityTriage />
                </ProtectedRoute>
              }
            />

            {/* Admin role-protected routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/grievances"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminGrievances />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/grievances/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminGrievanceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
