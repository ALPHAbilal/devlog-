import React from 'react';
import { AlertTriangle, RefreshCw, Save, Home } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { storageWrapper } from '@/shared/lib';

/**
 * Global Error Boundary
 * Catches all React errors and provides recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRecovering: false,
      lastSavedData: null,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Check if this is an authentication loop error
    const isAuthError = error.message?.includes('auth') || 
                       error.message?.includes('No active session') ||
                       error.message?.includes('sign in');
    
    // If we're getting rapid auth errors, it might be an infinite loop
    if (isAuthError && this.state.recoveryAttempts > 5) {
      console.error('Authentication loop detected, stopping retries');
      // Clear any auth-related storage to break the loop
      localStorage.removeItem('sb-zqcjipwiznesnbgbocnu-auth-token');
      sessionStorage.clear();
    }
    
    // Capture error with Sentry and get error ID
    const errorId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.props.name || "DevlogErrorBoundary"
        },
        devlog_app: {
          feature: this.props.feature || 'unknown',
          offline_mode: !navigator.onLine,
          recovery_attempts: this.state.recoveryAttempts,
          has_saved_data: !!this.getLastSavedData()
        }
      },
      tags: {
        component: this.props.name || 'global',
        feature: this.props.feature || 'general',
        error_boundary: true,
        environment: import.meta.env.MODE
      },
      user: {
        id: localStorage.getItem('userId') || 'anonymous'
      }
    });
    
    // Save error details
    this.setState({
      error,
      errorInfo,
      errorId,
      lastSavedData: this.getLastSavedData()
    });
    
    // Report to error tracking service (if configured)
    this.reportError(error, errorInfo);
    
    // Save crash report to localStorage for debugging
    this.saveCrashReport(error, errorInfo);
  }

  getLastSavedData() {
    try {
      // Get last saved state from localStorage
      const entries = localStorage.getItem('entries');
      const currentDocument = sessionStorage.getItem('currentDocument');
      
      return {
        entries: entries ? JSON.parse(entries) : null,
        currentDocument: currentDocument ? JSON.parse(currentDocument) : null,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('Failed to retrieve last saved data:', err);
      return null;
    }
  }

  saveCrashReport(error, errorInfo) {
    try {
      const crashReport = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.toString(),
          stack: error.stack
        },
        errorInfo: errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        lastSavedData: this.state.lastSavedData
      };
      
      // Save to localStorage
      const crashes = JSON.parse(localStorage.getItem('crashReports') || '[]');
      crashes.push(crashReport);
      
      // Keep only last 10 crash reports
      if (crashes.length > 10) {
        crashes.shift();
      }
      
      localStorage.setItem('crashReports', JSON.stringify(crashes));
    } catch (err) {
      console.error('Failed to save crash report:', err);
    }
  }

  reportError(error, errorInfo) {
    // In production, this would send to error tracking service
    // For now, just log to console
    console.group('Error Report');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Props:', this.props);
    console.groupEnd();
  }

  async handleRecovery() {
    this.setState({ isRecovering: true, recoveryAttempts: this.state.recoveryAttempts + 1 });
    
    try {
      // Clear any corrupted state
      sessionStorage.clear();
      
      // If we have saved data, restore it
      if (this.state.lastSavedData) {
        if (this.state.lastSavedData.entries) {
          await storageWrapper.saveEntries(this.state.lastSavedData.entries);
        }
        
        if (this.state.lastSavedData.currentDocument) {
          sessionStorage.setItem(
            'currentDocument', 
            JSON.stringify(this.state.lastSavedData.currentDocument)
          );
        }
      }
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
      
      // Reload the app
      window.location.reload();
      
    } catch (err) {
      console.error('Recovery failed:', err);
      this.setState({ isRecovering: false });
      
      // If recovery fails multiple times, offer hard reset
      if (this.state.recoveryAttempts >= 3) {
        if (window.confirm('Recovery failed. Would you like to reset the application? This will clear all local data.')) {
          this.handleHardReset();
        }
      }
    }
  }

  handleHardReset() {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear IndexedDB
    if (window.indexedDB) {
      indexedDB.deleteDatabase('devlog-db');
    }
    
    // Reload to landing page
    window.location.href = '/';
  }

  handleSaveAndReload() {
    // Try to save current state before reloading
    if (this.state.lastSavedData && this.state.lastSavedData.entries) {
      localStorage.setItem('entries_backup', JSON.stringify(this.state.lastSavedData.entries));
    }
    
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-dark-secondary/50 rounded-lg p-8 
                          border border-red-500/20 shadow-2xl">
            {/* Error Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-text-primary">
                  Something went wrong
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  Don't worry, we can help you recover your work
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-text-secondary mt-2">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </div>

            {/* Error Details (Dev Mode) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 p-4 bg-dark-primary/50 rounded-lg">
                <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-3 text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Recovery Status */}
            {this.state.lastSavedData && (
              <div className="mb-6 p-4 bg-dark-primary/50 rounded-lg">
                <p className="text-sm text-text-secondary">
                  Last saved: {new Date(this.state.lastSavedData.timestamp).toLocaleString()}
                </p>
                {this.state.lastSavedData.entries && (
                  <p className="text-sm text-text-secondary mt-1">
                    {this.state.lastSavedData.entries.length} documents saved
                  </p>
                )}
              </div>
            )}

            {/* Recovery Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => this.handleRecovery()}
                disabled={this.state.isRecovering}
                className="flex items-center justify-center gap-2 p-3 
                           bg-accent-green text-dark-primary rounded-lg
                           hover:bg-accent-green/80 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
                {this.state.isRecovering ? 'Recovering...' : 'Recover and Reload'}
              </button>

              <button
                onClick={() => this.handleSaveAndReload()}
                className="flex items-center justify-center gap-2 p-3 
                           bg-dark-primary text-text-primary rounded-lg
                           border border-dark-secondary hover:bg-dark-secondary/50 
                           transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Backup and Reload
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 p-3 
                           text-text-secondary hover:text-text-primary
                           transition-colors"
              >
                <Home className="w-5 h-5" />
                Go to Home
              </button>
            </div>

            {/* Hard Reset Option */}
            {this.state.recoveryAttempts >= 2 && (
              <div className="mt-6 pt-6 border-t border-dark-secondary/50">
                <button
                  onClick={() => this.handleHardReset()}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Reset Application (Clear All Data)
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;