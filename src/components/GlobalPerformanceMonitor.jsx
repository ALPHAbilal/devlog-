import { useState, useEffect } from 'react';
import PerformanceMonitor from './PerformanceMonitor';
import SystemHealthMonitor from './SystemHealthMonitor';
import { Activity, Shield } from 'lucide-react';

/**
 * Global Performance Monitor Toggle
 * Shows in bottom right corner when enabled
 */
export default function GlobalPerformanceMonitor() {
  const [showMonitor, setShowMonitor] = useState(() => {
    // Check localStorage for saved preference
    return localStorage.getItem('showPerformanceMonitor') === 'true';
  });
  
  const [showHealthMonitor, setShowHealthMonitor] = useState(() => {
    return localStorage.getItem('showHealthMonitor') === 'true';
  });

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('showPerformanceMonitor', showMonitor);
  }, [showMonitor]);
  
  useEffect(() => {
    localStorage.setItem('showHealthMonitor', showHealthMonitor);
  }, [showHealthMonitor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'P') {
          e.preventDefault();
          setShowMonitor(prev => !prev);
        } else if (e.key === 'H') {
          e.preventDefault();
          setShowHealthMonitor(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setShowMonitor(!showMonitor)}
        className="fixed bottom-5 right-5 z-50 p-3 rounded-full
                   bg-dark-secondary/80 backdrop-blur-sm
                   border border-dark-secondary/50 hover:border-accent-green/50
                   text-text-primary hover:text-accent-green
                   transition-all duration-200 group"
        title="Toggle Performance Monitor (⌘⇧P)"
      >
        <Activity 
          size={20} 
          className={`transition-transform duration-300 ${
            showMonitor ? 'rotate-180' : ''
          }`}
        />
        {!showMonitor && (
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2
                          bg-dark-primary/90 px-2 py-1 rounded text-xs
                          text-text-secondary opacity-0 group-hover:opacity-100
                          transition-opacity whitespace-nowrap">
            Performance Monitor (⌘⇧P)
          </div>
        )}
      </button>

      {/* Health Monitor Toggle */}
      <button
        onClick={() => setShowHealthMonitor(!showHealthMonitor)}
        className="fixed bottom-5 right-20 z-50 p-3 rounded-full
                   bg-dark-secondary/80 backdrop-blur-sm
                   border border-dark-secondary/50 hover:border-accent-green/50
                   text-text-primary hover:text-accent-green
                   transition-all duration-200 group"
        title="Toggle System Health Monitor (⌘⇧H)"
      >
        <Shield 
          size={20} 
          className={`transition-transform duration-300 ${
            showHealthMonitor ? 'scale-110' : ''
          }`}
        />
        {!showHealthMonitor && (
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2
                          bg-dark-primary/90 px-2 py-1 rounded text-xs
                          text-text-secondary opacity-0 group-hover:opacity-100
                          transition-opacity whitespace-nowrap">
            System Health (⌘⇧H)
          </div>
        )}
      </button>

      {/* Performance Monitor */}
      <PerformanceMonitor show={showMonitor} />
      
      {/* System Health Monitor */}
      <SystemHealthMonitor show={showHealthMonitor} />
    </>
  );
}