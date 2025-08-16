import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Component-level Error Boundary
 * Provides granular error handling for specific components
 */
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`ComponentErrorBoundary in ${this.props.name || 'Unknown'}:`, error, errorInfo);
    
    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    
    // Call reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className={`p-4 bg-dark-secondary/30 rounded-lg border border-red-500/20 ${this.props.className || ''}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-text-primary font-medium">
                {this.props.errorMessage || 'Component Error'}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {this.state.error?.message || 'Something went wrong in this component'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="p-2 hover:bg-dark-secondary/50 rounded transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          
          {/* Show details in dev mode */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                Error Stack
              </summary>
              <pre className="mt-2 text-xs text-red-400 overflow-auto max-h-32 p-2 bg-dark-primary/50 rounded">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary(Component, options = {}) {
  return function WrappedComponent(props) {
    return (
      <ComponentErrorBoundary {...options}>
        <Component {...props} />
      </ComponentErrorBoundary>
    );
  };
}

export default ComponentErrorBoundary;