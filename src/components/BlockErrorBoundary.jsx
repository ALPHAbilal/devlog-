import React from 'react';
import { AlertTriangle } from 'lucide-react';

class BlockErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console with details
    console.error('Block Error Boundary caught an error:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      blockType: this.props.blockType,
      blockId: this.props.blockId
    });
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="bg-red-900/10 border border-red-600/20 rounded-lg p-4 my-2">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle size={16} />
            <span className="font-medium">Block Render Error</span>
          </div>
          <p className="text-sm text-text-secondary mb-2">
            Failed to render {this.props.blockType || 'block'} 
            {this.props.blockId && ` (ID: ${this.props.blockId.slice(0, 8)}...)`}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-2">
              <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                Error Details
              </summary>
              <pre className="text-xs mt-2 p-2 bg-dark-secondary rounded overflow-auto max-h-32">
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default BlockErrorBoundary;