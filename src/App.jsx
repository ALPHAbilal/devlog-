import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProviderOptimized as AuthProvider, useAuth } from './contexts/AuthContextOptimized';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AuthComponent from './components/Auth';
import AuthCallback from './pages/auth/callback';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import GlobalPerformanceMonitor from './components/GlobalPerformanceMonitor';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';
import recoveryManager from './utils/recovery/RecoveryManager';

function AppContent() {
  // Initialize recovery system
  useEffect(() => {
    // Recovery manager initializes automatically, but we can check status
    const status = recoveryManager.getRecoveryStatus();
    if (status.recoveryInProgress) {
      console.log('Recovery in progress...');
    }
  }, []);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthComponent />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
      <GlobalPerformanceMonitor />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App
