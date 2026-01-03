import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing canvas memory and cleanup
 * Ensures proper cleanup of canvas contexts and animation frames
 */
export function useCanvasCleanup() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const resourcesRef = useRef(new Set());

  // Register a resource for cleanup
  const registerResource = useCallback((resource) => {
    resourcesRef.current.add(resource);
    return () => resourcesRef.current.delete(resource);
  }, []);

  // Clean up canvas context
  const cleanupCanvas = useCallback(() => {
    if (contextRef.current) {
      // Clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Reset context reference
      contextRef.current = null;
    }
  }, []);

  // Cancel animation frame
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Clean up all registered resources
  const cleanupResources = useCallback(() => {
    resourcesRef.current.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error cleaning up resource:', error);
        }
      }
    });
    resourcesRef.current.clear();
  }, []);

  // Main cleanup function
  const cleanup = useCallback(() => {
    cancelAnimation();
    cleanupCanvas();
    cleanupResources();
  }, [cancelAnimation, cleanupCanvas, cleanupResources]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    canvasRef,
    contextRef,
    animationFrameRef,
    registerResource,
    cleanup,
    cleanupCanvas,
    cancelAnimation
  };
}

/**
 * Hook for managing heavy block memory
 * Provides utilities for cleanup when blocks are unmounted or off-screen
 */
export function useBlockMemoryManagement(blockType, blockId) {
  const timeoutsRef = useRef(new Set());
  const intervalsRef = useRef(new Set());
  const listenersRef = useRef(new Map());
  const resourcesRef = useRef(new Map());

  // Register timeout with automatic cleanup
  const registerTimeout = useCallback((timeoutId) => {
    timeoutsRef.current.add(timeoutId);
    return () => {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(timeoutId);
    };
  }, []);

  // Register interval with automatic cleanup
  const registerInterval = useCallback((intervalId) => {
    intervalsRef.current.add(intervalId);
    return () => {
      clearInterval(intervalId);
      intervalsRef.current.delete(intervalId);
    };
  }, []);

  // Register event listener with automatic cleanup
  const registerEventListener = useCallback((element, event, handler, options) => {
    const key = `${event}-${Date.now()}`;
    listenersRef.current.set(key, { element, event, handler, options });
    element.addEventListener(event, handler, options);
    
    return () => {
      element.removeEventListener(event, handler, options);
      listenersRef.current.delete(key);
    };
  }, []);

  // Register generic resource with cleanup function
  const registerResource = useCallback((key, cleanupFn) => {
    resourcesRef.current.set(key, cleanupFn);
    return () => {
      const cleanup = resourcesRef.current.get(key);
      if (cleanup) {
        cleanup();
        resourcesRef.current.delete(key);
      }
    };
  }, []);

  // Get memory usage info (rough estimation)
  const getMemoryInfo = useCallback(() => {
    return {
      timeouts: timeoutsRef.current.size,
      intervals: intervalsRef.current.size,
      listeners: listenersRef.current.size,
      resources: resourcesRef.current.size,
      blockType,
      blockId
    };
  }, [blockType, blockId]);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    // Clear timeouts
    timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutsRef.current.clear();

    // Clear intervals
    intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
    intervalsRef.current.clear();

    // Remove event listeners
    listenersRef.current.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        console.warn('Error removing event listener:', error);
      }
    });
    listenersRef.current.clear();

    // Clean up custom resources
    resourcesRef.current.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.warn('Error cleaning up resource:', error);
      }
    });
    resourcesRef.current.clear();

    // Log cleanup in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Memory cleanup completed for ${blockType} block ${blockId}`);
    }
  }, [blockType, blockId]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    registerTimeout,
    registerInterval,
    registerEventListener,
    registerResource,
    getMemoryInfo,
    cleanup
  };
}

/**
 * Hook for monitoring memory usage and performance
 * Provides insights into block-level memory consumption
 */
export function useMemoryMonitor() {
  const metricsRef = useRef({
    startTime: performance.now(),
    peakMemory: 0,
    averageMemory: 0,
    samples: []
  });

  const addSample = useCallback(() => {
    if (performance.memory) {
      const currentMemory = performance.memory.usedJSHeapSize;
      const sample = {
        timestamp: performance.now(),
        memory: currentMemory
      };
      
      metricsRef.current.samples.push(sample);
      metricsRef.current.peakMemory = Math.max(metricsRef.current.peakMemory, currentMemory);
      
      // Keep only last 100 samples
      if (metricsRef.current.samples.length > 100) {
        metricsRef.current.samples.shift();
      }
      
      // Calculate average
      const total = metricsRef.current.samples.reduce((sum, s) => sum + s.memory, 0);
      metricsRef.current.averageMemory = total / metricsRef.current.samples.length;
    }
  }, []);

  const getMetrics = useCallback(() => {
    const now = performance.now();
    const duration = now - metricsRef.current.startTime;
    
    return {
      ...metricsRef.current,
      duration,
      currentMemory: performance.memory ? performance.memory.usedJSHeapSize : null,
      samplesCount: metricsRef.current.samples.length
    };
  }, []);

  const startMonitoring = useCallback((intervalMs = 1000) => {
    const interval = setInterval(addSample, intervalMs);
    return () => clearInterval(interval);
  }, [addSample]);

  return {
    addSample,
    getMetrics,
    startMonitoring
  };
}