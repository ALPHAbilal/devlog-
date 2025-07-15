import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProviderOptimized as AuthProvider, useAuth } from './contexts/AuthContextOptimized';
import { SettingsProvider } from './contexts/SettingsContext';
import { useGlobalAutoSave } from './hooks/useAutoSave';
import { initMonitoring, setUserContext } from './utils/monitoring';
import { register as registerServiceWorker } from './utils/serviceWorker';
import { preloadResources } from './utils/performance';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AuthComponent from './components/Auth';
import AuthCallback from './pages/auth/callback';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import SharedDocument from './pages/SharedDocument';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToast';
import { useEffect, Suspense, lazy } from 'react';

// Lazy load SEO pages
const AIConversationSaver = lazy(() => import('./pages/features/AIConversationSaver'));
const NotionAlternative = lazy(() => import('./pages/compare/NotionAlternative'));

// Initialize monitoring
initMonitoring();

// Register service worker for caching
registerServiceWorker();

// Preload critical resources
// Removed preload for fonts and icons to avoid warnings
// These resources will be loaded on-demand

// Component to handle global auto-save
function AutoSaveProvider() {
  useGlobalAutoSave();
  return null;
}

function AppContent() {
  const { user, loading } = useAuth();

  // Set user context for monitoring
  useEffect(() => {
    setUserContext(user);
  }, [user]);

  // Add beforeunload handler to save pending changes
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Check if there are unsaved changes
      const { globalAutoSaveManager } = await import('./utils/globalAutoSave');
      
      if (globalAutoSaveManager.hasUnsavedChanges()) {
        // Save all pending changes
        await globalAutoSaveManager.saveAll();
        
        // Show browser warning
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also use Page Visibility API as a more reliable alternative
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        const { globalAutoSaveManager } = await import('./utils/globalAutoSave');
        if (globalAutoSaveManager.hasUnsavedChanges()) {
          await globalAutoSaveManager.saveAll();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
        <Route path="/shared/:shareCode" element={<SharedDocument />} />
        
        {/* SEO Landing Pages */}
        <Route path="/features/ai-conversation-saver" element={
          <Suspense fallback={<div className="min-h-screen bg-dark-primary flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>}>
            <AIConversationSaver />
          </Suspense>
        } />
        
        {/* Comparison Pages */}
        <Route path="/compare/notion-alternative" element={
          <Suspense fallback={<div className="min-h-screen bg-dark-primary flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>}>
            <NotionAlternative />
          </Suspense>
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/shared/:shareCode" element={<SharedDocument />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <ToastProvider>
              <AutoSaveProvider />
              <AppContent />
            </ToastProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App
