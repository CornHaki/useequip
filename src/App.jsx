import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DataContext, DataProvider } from './context/DataContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import RoleSelection from './pages/Auth/RoleSelection';
import Login from './pages/Auth/Login';
import UserDashboard from './pages/Dashboard/UserDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import BrowseEquipment from './pages/Discovery/BrowseEquipment';
import EquipmentDetail from './pages/Detail/EquipmentDetail';
import CheckInOutPortal from './pages/HandOver/CheckInOutPortal';
import ActivityHistory from './pages/Audit/ActivityHistory';
import { hasRole } from './utils/permissions';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-textMain">Loading your account…</div>;
  if (!isAuthenticated) return <Navigate to="/" />;
  if (allowedRole && !hasRole(user, allowedRole)) return <Navigate to={`/${user.role}-dashboard`} />;
  return children;
};

function AppContent() {
  const { isAuthenticated, user, loading: authLoading, authError, logout } = useAuth();
  const { error: dataError } = useContext(DataContext);
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionState, setTransitionState] = useState('idle');

  useEffect(() => {
    const updateVisibility = () => {
      document.body.classList.toggle('tab-inactive', document.hidden);
    };

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      document.body.classList.remove('tab-inactive');
    };
  }, []);

  useEffect(() => {
    if (location.key === displayLocation.key) return undefined;

    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayLocation(location);
      setTransitionState('idle');
      return undefined;
    }

    setTransitionState('exiting');
    const timeoutId = window.setTimeout(() => {
      setDisplayLocation(location);
      setTransitionState('entering');
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionState !== 'entering') return undefined;

    const timeoutId = window.setTimeout(() => setTransitionState('idle'), 220);
    return () => window.clearTimeout(timeoutId);
  }, [displayLocation, transitionState]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-textMain font-semibold">Loading UseEquip…</div>;
  }

  if (!isAuthenticated && authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-surface p-7 shadow-lg">
          <h1 className="text-xl font-extrabold text-textMain">UseEquip account setup</h1>
          <p role="alert" className="mt-3 text-sm leading-relaxed text-textMain/80">{authError}</p>
          {authError.startsWith('Firebase is not configured') ? (
            <p className="mt-3 text-sm text-textMain/80">Set the Vite Firebase web app values in your local <code>.env.local</code>, then restart the development server.</p>
          ) : (
            <button type="button" onClick={logout} className="mt-5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white">Return to sign in</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isAuthenticated && <Navbar />}
      <div className="flex-1">
        {dataError && (
          <div role="alert" className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              Could not load application data: {dataError}
            </div>
          </div>
        )}
        <div className={`route-transition route-transition-${transitionState}`}>
        <Routes location={displayLocation}>
          <Route path="/" element={!isAuthenticated ? <RoleSelection /> : <Navigate to={`/${user.role}-dashboard`} />} />
          <Route path="/login/:role" element={<Login />} />
          
          <Route path="/user-dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          
          <Route path="/browse" element={<ProtectedRoute allowedRole="user"><BrowseEquipment /></ProtectedRoute>} />
          <Route path="/equipment/:id" element={<ProtectedRoute allowedRole="user"><EquipmentDetail /></ProtectedRoute>} />
          <Route path="/handover/:bookingId" element={<ProtectedRoute allowedRole="user"><CheckInOutPortal /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><ActivityHistory /></ProtectedRoute>} />
        </Routes>
        </div>
      </div>
      {isAuthenticated && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DataProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </DataProvider>
      </ToastProvider>
    </AuthProvider>
  );
}