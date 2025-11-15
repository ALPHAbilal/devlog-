import { useEffect, useRef } from 'react';

/**
 * Performance Monitor for Landing Page
 * Tracks FPS, memory usage, and animation performance
 */
export default function LandingPerformanceMonitor() {
  const statsRef = useRef({
    fps: 0,
    frameCount: 0,
    lastTime: performance.now(),
    animationCount: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return; // Only run in development

    let rafId;
    const stats = statsRef.current;

    // FPS Counter
    const measureFPS = () => {
      stats.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= stats.lastTime + 1000) {
        stats.fps = Math.round((stats.frameCount * 1000) / (currentTime - stats.lastTime));
        stats.frameCount = 0;
        stats.lastTime = currentTime;
        
        // Count active animations
        const animations = document.querySelectorAll('[style*="animation"], [style*="transition"]');
        stats.animationCount = animations.length;
        
        // Memory usage (if available)
        if (performance.memory) {
          stats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
        }
        
        // Log performance stats
        if (stats.fps < 30) {
          console.warn('🔴 Low FPS detected:', {
            fps: stats.fps,
            animations: stats.animationCount,
            memory: `${stats.memoryUsage}MB`,
            timestamp: new Date().toLocaleTimeString()
          });
        } else if (import.meta.env.DEV) {
          console.log('🟢 Landing Page Performance:', {
            fps: stats.fps,
            animations: stats.animationCount,
            memory: `${stats.memoryUsage}MB`,
            particles: document.querySelectorAll('.hero-particle').length,
            mouseListeners: performance.getEntriesByType('event')?.length || 'N/A'
          });
        }
      }
      
      rafId = requestAnimationFrame(measureFPS);
    };
    
    // Start monitoring
    rafId = requestAnimationFrame(measureFPS);
    
    // Performance Observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('⚠️ Long task detected:', {
                duration: `${Math.round(entry.duration)}ms`,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        
        return () => {
          cancelAnimationFrame(rafId);
          observer.disconnect();
        };
      } catch (err) {
        // Some browsers don't support longtask
        return () => cancelAnimationFrame(rafId);
      }
    }
    
    return () => cancelAnimationFrame(rafId);
  }, []);

  // No UI - monitoring only
  return null;
}

// Export performance utilities
export const performanceUtils = {
  checkDeviceCapability() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4; // GB
    const connection = navigator.connection?.effectiveType || '4g';
    
    return {
      isLowEnd: cores <= 2 || memory <= 2,
      isMidRange: cores <= 4 || memory <= 4,
      isHighEnd: cores > 4 && memory > 4,
      connectionSpeed: connection,
      shouldReduceAnimations: cores <= 2 || memory <= 2 || connection === 'slow-2g' || connection === '2g'
    };
  },
  
  getOptimalSettings() {
    const device = this.checkDeviceCapability();
    
    return {
      particleCount: device.isLowEnd ? 5 : device.isMidRange ? 10 : 20,
      enableGradientAnimation: !device.isLowEnd,
      enableMouseTracking: !device.isLowEnd,
      enableFloatingElements: device.isHighEnd,
      throttleDelay: device.isLowEnd ? 32 : 16, // ms
    };
  }
};