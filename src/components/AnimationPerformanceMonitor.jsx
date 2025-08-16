import React, { useState, useEffect } from 'react';
import { animationMonitor } from '../utils/animationPerformance';

const AnimationPerformanceMonitor = ({ position = 'bottom-right' }) => {
  const [stats, setStats] = useState({ fps: 0, avgFrameTime: 0, slowFrames: 0, totalFrames: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start monitoring
    animationMonitor.start();
    
    // Subscribe to updates
    const unsubscribe = animationMonitor.onUpdate(setStats);
    
    // Show monitor in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }

    // Keyboard shortcut to toggle (Ctrl/Cmd + Shift + P)
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!isVisible) return null;

  const getFPSColor = (fps) => {
    if (fps >= 55) return '#10b981'; // green
    if (fps >= 30) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 bg-dark-primary/90 backdrop-blur-sm 
                  border border-dark-secondary/50 rounded-lg p-3 font-mono text-xs 
                  shadow-lg min-w-[200px]`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary">Performance Monitor</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-text-secondary hover:text-text-primary"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-text-secondary">FPS:</span>
          <span style={{ color: getFPSColor(stats.fps) }} className="font-bold">
            {stats.fps}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-text-secondary">Frame Time:</span>
          <span className="text-text-primary">{stats.avgFrameTime}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-text-secondary">Slow Frames:</span>
          <span className={stats.slowFrames > 5 ? 'text-red-500' : 'text-text-primary'}>
            {stats.slowFrames}/{stats.totalFrames}
          </span>
        </div>
      </div>
      
      {/* FPS Graph */}
      <div className="mt-2 h-8 bg-dark-secondary/50 rounded relative overflow-hidden">
        <div 
          className="absolute bottom-0 right-0 bg-accent-green/50 transition-all"
          style={{ 
            width: '100%',
            height: `${(stats.fps / 60) * 100}%`,
            background: `linear-gradient(to top, ${getFPSColor(stats.fps)}40, ${getFPSColor(stats.fps)}20)`
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-text-secondary">
          Target: 60 FPS
        </div>
      </div>

      <div className="mt-2 text-[10px] text-text-secondary text-center">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};

export default AnimationPerformanceMonitor;