import React, { useEffect, useState, memo } from 'react';
import { deviceCapabilities, performanceMonitor } from '../utils/mobilePerformance';
import MobileNavigation from './MobileNavigation';

const MobileOptimizedLayout = memo(({ children }) => {
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [performanceMode, setPerformanceMode] = useState('normal');

  useEffect(() => {
    // Check device capabilities
    setIsLowEnd(deviceCapabilities.isLowEnd());
    setReducedMotion(deviceCapabilities.prefersReducedMotion());

    // Monitor performance
    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      if (metrics.fps < 30) {
        setPerformanceMode('reduced');
      } else if (metrics.fps > 50) {
        setPerformanceMode('normal');
      }
    });

    // Start monitoring
    performanceMonitor.start();

    return unsubscribe;
  }, []);

  // Apply performance optimizations
  useEffect(() => {
    const root = document.documentElement;
    
    if (isLowEnd || performanceMode === 'reduced') {
      // Disable complex animations
      root.style.setProperty('--animation-duration', '0.1s');
      root.classList.add('reduce-animations');
      
      // Disable backdrop filters
      root.classList.add('disable-backdrop-filters');
      
      // Reduce shadow complexity
      root.classList.add('simple-shadows');
    } else {
      root.style.removeProperty('--animation-duration');
      root.classList.remove('reduce-animations');
      root.classList.remove('disable-backdrop-filters');
      root.classList.remove('simple-shadows');
    }
    
    if (reducedMotion) {
      root.classList.add('prefers-reduced-motion');
    } else {
      root.classList.remove('prefers-reduced-motion');
    }
  }, [isLowEnd, reducedMotion, performanceMode]);

  return (
    <>
      <div 
        className="mobile-optimized-layout"
        data-performance-mode={performanceMode}
        data-low-end={isLowEnd}
      >
        {children}
      </div>
      <MobileNavigation />
      
      {/* Performance indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 right-2 bg-dark-secondary/80 backdrop-blur-sm 
                       rounded px-2 py-1 text-xs text-text-secondary z-50">
          {performanceMode === 'reduced' ? '🔴' : '🟢'} Performance
        </div>
      )}
    </>
  );
});

MobileOptimizedLayout.displayName = 'MobileOptimizedLayout';

export default MobileOptimizedLayout;