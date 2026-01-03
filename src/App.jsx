import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AuthProviderOptimized as AuthProvider, useAuth } from '@/app/providers';
import { SettingsProvider } from '@/app/providers';
import { SidebarProvider } from '@/app/providers';
import { TabProvider } from '@/app/providers';
import { useGlobalAutoSave } from '@/features/block';
import { useAnalytics } from '@/features/analytics';
import { initMonitoring, setUserContext } from '@/shared/lib';
import { register as registerServiceWorker } from '@/shared/lib';
import { preloadResources } from '@/shared/lib';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SettingsClaude from './pages/SettingsClaude';
import AuthPageRedesign from './components/AuthPageRedesign';
import AuthCallback from './pages/auth/callback';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import SharedDocument from './pages/SharedDocument';
import DocumentPage from './pages/DocumentPage';
import Upgrade from './pages/Upgrade';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsentBanner from './components/CookieConsentBanner';

import { ToastProvider } from '@/shared/hooks';
import { useEffect } from 'react';

// Create Sentry-enhanced routing component
const SentryRoutes = Sentry.withSentryRouting(Routes);

// Lazy load SEO pages
const AIConversationSaver = lazy(() => import('./pages/features/AIConversationSaver'));
const NotionAlternative = lazy(() => import('./pages/compare/NotionAlternative'));
const AIConversationManagement = lazy(() => import('./pages/guides/AIConversationManagement'));
const DevLogVsNotion = lazy(() => import('./pages/compare/DevLogVsNotion'));

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
  const { setUserId, setUserProperties, trackEvent } = useAnalytics();
  const [hasTrackedSession, setHasTrackedSession] = useState(false);

  // Set user context for monitoring and analytics
  useEffect(() => {
    setUserContext(user);
    
    // Set up Google Analytics user tracking
    if (user) {
      setUserId(user.id);
      setUserProperties({
        plan_type: user.user_metadata?.plan || 'free',
        signup_date: user.created_at,
        email_verified: user.email_confirmed_at ? 'true' : 'false'
      });
      
      // Only track login/session once per session
      if (!hasTrackedSession) {
        // Check if this is a fresh login or session restoration
        const isNewLogin = sessionStorage.getItem('fresh_login') === 'true';
        
        if (isNewLogin) {
          // Track actual login event
          trackEvent('login', {
            method: user.app_metadata?.provider || 'email'
          });
          sessionStorage.removeItem('fresh_login');
        } else {
          // Track session restoration (page refresh while logged in)
          trackEvent('session_restored', {
            user_id: user.id
          });
        }
        setHasTrackedSession(true);
      }
    } else {
      // Clear user ID on logout
      setUserId(null);
      setHasTrackedSession(false);
    }
  }, [user, setUserId, setUserProperties, trackEvent, hasTrackedSession]);

  // Add beforeunload handler to save pending changes
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Smart Sync handles saving automatically via IndexedDB
      // Check if there are unsaved changes via the global managers
      if (window.__smartSyncManagers) {
        let hasUnsaved = false;
        for (const manager of window.__smartSyncManagers.values()) {
          const status = manager.getSyncStatus();
          if (status.pending > 0) {
            hasUnsaved = true;
            // Force sync before leaving
            manager.forceSync().catch(console.error);
          }
        }
        
        if (hasUnsaved) {
          // Show browser warning
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return e.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also use Page Visibility API as a more reliable alternative
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && window.__smartSyncManagers) {
        // Force sync all pending changes when tab becomes hidden
        for (const manager of window.__smartSyncManagers.values()) {
          const status = manager.getSyncStatus();
          if (status.pending > 0) {
            manager.forceSync().catch(console.error);
          }
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
      <SentryRoutes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPageRedesign />} />
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
        
        <Route path="/compare/devlog-vs-notion" element={
          <Suspense fallback={<div className="min-h-screen bg-dark-primary flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>}>
            <DevLogVsNotion />
          </Suspense>
        } />
        
        {/* Guide Pages */}
        <Route path="/guides/ai-conversation-management" element={
          <Suspense fallback={<div className="min-h-screen bg-dark-primary flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>}>
            <AIConversationManagement />
          </Suspense>
        } />
        
        <Route path="/upgrade" element={<Upgrade />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </SentryRoutes>
    );
  }

  return (
    <SentryRoutes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      <Route path="/dashboard/:documentId" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      <Route path="/document/:documentId" element={
        <Layout>
          <DocumentPage />
        </Layout>
      } />
      <Route path="/settings" element={<SettingsClaude />} />
      <Route path="/shared/:shareCode" element={
        <Layout>
          <SharedDocument />
        </Layout>
      } />
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </SentryRoutes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <SidebarProvider>
              <TabProvider>
                <ToastProvider>
                  <AutoSaveProvider />
                  <AppContent />
                  <CookieConsentBanner />
                </ToastProvider>
              </TabProvider>
            </SidebarProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App
