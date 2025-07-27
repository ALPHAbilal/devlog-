import { useState, useEffect, useRef, useCallback } from 'react';
import { debugHelpers } from '../../utils/debugHelpers';
import { X, Download, Copy, Move, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import '../../styles/auth-debug.css';

const AuthDebugConsole = ({ authPageRef, brandingPanelRef, formPanelRef, formContainerRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [debugData, setDebugData] = useState({});
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const intervalRef = useRef(null);

  // Update debug data
  const updateDebugData = useCallback(() => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type || 'unknown',
    };

    const pageWrapper = authPageRef?.current;
    const brandingPanel = brandingPanelRef?.current;
    const formPanel = formPanelRef?.current;
    const formContainer = formContainerRef?.current;

    const data = {
      viewport,
      activeMediaQueries: debugHelpers.getActiveMediaQueries(),
      containerQueriesSupported: debugHelpers.checkContainerQueries(),
      cssCustomProperties: debugHelpers.getCSSCustomProperties(),
      
      pageWrapper: pageWrapper ? {
        measurements: debugHelpers.getElementMeasurements(pageWrapper),
        styles: debugHelpers.getDebugStyles(pageWrapper),
        gridTemplate: debugHelpers.getGridTemplateColumns(pageWrapper),
        overflow: debugHelpers.detectOverflow(pageWrapper),
      } : null,
      
      brandingPanel: brandingPanel ? {
        measurements: debugHelpers.getElementMeasurements(brandingPanel),
        styles: debugHelpers.getDebugStyles(brandingPanel),
        isVisible: window.getComputedStyle(brandingPanel).display !== 'none',
      } : null,
      
      formPanel: formPanel ? {
        measurements: debugHelpers.getElementMeasurements(formPanel),
        styles: debugHelpers.getDebugStyles(formPanel),
        overflow: debugHelpers.detectOverflow(formPanel),
      } : null,
      
      formContainer: formContainer ? {
        measurements: debugHelpers.getElementMeasurements(formContainer),
        centering: formPanel ? debugHelpers.checkCentering(formContainer, formPanel) : null,
      } : null,
      
      performance: debugHelpers.getPerformanceMetrics(),
      
      issues: [],
    };

    // Detect issues
    if (data.formContainer?.centering && !data.formContainer.centering.isCentered) {
      data.issues.push({
        type: 'centering',
        message: `Form not centered: H-offset: ${data.formContainer.centering.horizontalOffset.toFixed(1)}px, V-offset: ${data.formContainer.centering.verticalOffset.toFixed(1)}px`,
      });
    }

    if (data.pageWrapper?.overflow?.hasOverflow) {
      data.issues.push({
        type: 'overflow',
        message: `Page wrapper has overflow: ${data.pageWrapper.overflow.horizontal ? 'horizontal' : ''} ${data.pageWrapper.overflow.vertical ? 'vertical' : ''}`,
      });
    }

    if (data.formPanel?.overflow?.hasOverflow) {
      data.issues.push({
        type: 'overflow',
        message: `Form panel has overflow: ${data.formPanel.overflow.horizontal ? 'horizontal' : ''} ${data.formPanel.overflow.vertical ? 'vertical' : ''}`,
      });
    }

    setDebugData(data);
  }, [authPageRef, brandingPanelRef, formPanelRef, formContainerRef]);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Update data on resize and initial load
  useEffect(() => {
    if (!isVisible) return;

    updateDebugData();
    
    // Update on resize
    const handleResize = () => updateDebugData();
    window.addEventListener('resize', handleResize);
    
    // Update every second for real-time monitoring
    intervalRef.current = setInterval(updateDebugData, 1000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isVisible, updateDebugData]);

  // Handle dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Export data
  const handleExport = () => {
    debugHelpers.exportDebugData(debugData);
  };

  // Copy to clipboard
  const handleCopy = () => {
    const success = debugHelpers.copyToClipboard(debugData);
    if (success) {
      alert('Debug data copied to clipboard!');
    }
  };

  if (!isVisible) {
    return (
      <button
        className="auth-debug-toggle"
        onClick={() => setIsVisible(true)}
        title="Show Debug Console (Ctrl+Shift+D)"
      >
        Debug
      </button>
    );
  }

  return (
    <div
      className={`auth-debug-console ${isDragging ? 'is-dragging' : ''} ${isMinimized ? 'is-minimized' : ''}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      ref={dragRef}
    >
      <div className="auth-debug-header" onMouseDown={handleMouseDown}>
        <span className="auth-debug-title">Auth Debug Console</span>
        <div className="auth-debug-controls">
          <button onClick={() => setIsMinimized(!isMinimized)} title="Minimize">
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={handleCopy} title="Copy to Clipboard">
            <Copy size={16} />
          </button>
          <button onClick={handleExport} title="Export JSON">
            <Download size={16} />
          </button>
          <button onClick={() => setIsVisible(false)} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="auth-debug-content">
          {/* Issues Alert */}
          {debugData.issues?.length > 0 && (
            <div className="auth-debug-section auth-debug-issues">
              <h3><AlertCircle size={16} /> Issues Detected</h3>
              {debugData.issues.map((issue, i) => (
                <div key={i} className={`auth-debug-issue auth-debug-issue-${issue.type}`}>
                  {issue.message}
                </div>
              ))}
            </div>
          )}

          {/* Viewport Info */}
          <div className="auth-debug-section">
            <h3>Viewport</h3>
            <div className="auth-debug-grid">
              <span>Size:</span>
              <span>{debugData.viewport?.width} × {debugData.viewport?.height}</span>
              <span>DPR:</span>
              <span>{debugData.viewport?.devicePixelRatio}</span>
              <span>Orientation:</span>
              <span>{debugData.viewport?.orientation}</span>
            </div>
          </div>

          {/* Active Media Queries */}
          <div className="auth-debug-section">
            <h3>Active Media Queries</h3>
            <div className="auth-debug-list">
              {debugData.activeMediaQueries?.map((q, i) => (
                <span key={i} className="auth-debug-tag">{q.name}</span>
              )) || <span className="auth-debug-empty">None</span>}
            </div>
          </div>

          {/* Grid Layout */}
          {debugData.pageWrapper?.gridTemplate && (
            <div className="auth-debug-section">
              <h3>Grid Layout</h3>
              <div className="auth-debug-code">
                {debugData.pageWrapper.gridTemplate}
              </div>
            </div>
          )}

          {/* Element Sizes */}
          <div className="auth-debug-section">
            <h3>Element Measurements</h3>
            <div className="auth-debug-measurements">
              {debugData.pageWrapper && (
                <div>
                  <strong>Page Wrapper:</strong>
                  <span>{debugData.pageWrapper.measurements?.width?.toFixed(1)} × {debugData.pageWrapper.measurements?.height?.toFixed(1)}</span>
                </div>
              )}
              {debugData.brandingPanel?.isVisible && (
                <div>
                  <strong>Branding Panel:</strong>
                  <span>{debugData.brandingPanel.measurements?.width?.toFixed(1)} × {debugData.brandingPanel.measurements?.height?.toFixed(1)}</span>
                </div>
              )}
              {debugData.formPanel && (
                <div>
                  <strong>Form Panel:</strong>
                  <span>{debugData.formPanel.measurements?.width?.toFixed(1)} × {debugData.formPanel.measurements?.height?.toFixed(1)}</span>
                </div>
              )}
              {debugData.formContainer && (
                <div>
                  <strong>Form Container:</strong>
                  <span>{debugData.formContainer.measurements?.width?.toFixed(1)} × {debugData.formContainer.measurements?.height?.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* CSS Custom Properties */}
          <div className="auth-debug-section auth-debug-collapsed">
            <h3>CSS Variables</h3>
            <div className="auth-debug-props">
              {Object.entries(debugData.cssCustomProperties || {}).map(([key, value]) => (
                <div key={key}>
                  <span className="auth-debug-prop-name">{key}:</span>
                  <span className="auth-debug-prop-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="auth-debug-section">
            <h3>Performance</h3>
            <div className="auth-debug-grid">
              <span>DOM Load:</span>
              <span>{debugData.performance?.domContentLoaded?.toFixed(0)}ms</span>
              <span>FCP:</span>
              <span>{debugData.performance?.firstContentfulPaint?.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugConsole;