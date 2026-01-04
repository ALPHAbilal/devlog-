/**
 * Performance Monitor for Supabase Operations
 * Tracks and reports performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      auth: 100, // 100ms
      query: 200, // 200ms
      save: 500, // 500ms
      upload: 2000 // 2s
    };
    this.enabled = import.meta.env.DEV; // Only in development
  }

  /**
   * Start timing an operation
   */
  startTimer(operation, metadata = {}) {
    if (!this.enabled) return;
    
    const id = `${operation}-${Date.now()}-${Math.random()}`;
    this.metrics.set(id, {
      operation,
      startTime: performance.now(),
      metadata
    });
    
    return id;
  }

  /**
   * End timing and log if threshold exceeded
   */
  endTimer(id, success = true) {
    if (!this.enabled || !id) return;
    
    const metric = this.metrics.get(id);
    if (!metric) return;
    
    const duration = performance.now() - metric.startTime;
    this.metrics.delete(id);
    
    // Get threshold for operation type
    const threshold = this.thresholds[metric.operation.split(':')[0]] || 1000;
    
    // Log if exceeded threshold or failed
    if (duration > threshold || !success) {
      console.warn(`[Performance] ${metric.operation} took ${duration.toFixed(2)}ms`, {
        threshold,
        exceeded: duration > threshold,
        success,
        metadata: metric.metadata
      });
    }
    
    // Track in analytics if available
    this.trackMetric(metric.operation, duration, success);
    
    return duration;
  }

  /**
   * Track metric for analytics
   */
  trackMetric(operation, duration, success) {
    // This could send to analytics service
    if (window.analytics?.track) {
      window.analytics.track('supabase_operation', {
        operation,
        duration,
        success,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Monitor a promise-based operation
   */
  async monitor(operation, promiseFn, metadata = {}) {
    if (!this.enabled) return promiseFn();
    
    const id = this.startTimer(operation, metadata);
    try {
      const result = await promiseFn();
      this.endTimer(id, true);
      return result;
    } catch (error) {
      this.endTimer(id, false);
      throw error;
    }
  }

  /**
   * Get performance report
   */
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };
    
    // Aggregate metrics by operation type
    for (const [id, metric] of this.metrics.entries()) {
      const operation = metric.operation.split(':')[0];
      if (!report.metrics[operation]) {
        report.metrics[operation] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0
        };
      }
      
      const duration = performance.now() - metric.startTime;
      report.metrics[operation].count++;
      report.metrics[operation].totalDuration += duration;
      report.metrics[operation].avgDuration = 
        report.metrics[operation].totalDuration / report.metrics[operation].count;
    }
    
    return report;
  }

  /**
   * Log memory usage
   */
  logMemoryUsage() {
    if (!this.enabled || !performance.memory) return;
    
    const memory = performance.memory;
    const used = (memory.usedJSHeapSize / 1048576).toFixed(2);
    const total = (memory.totalJSHeapSize / 1048576).toFixed(2);
    const limit = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
    
    console.log(`[Memory] Used: ${used}MB / Total: ${total}MB / Limit: ${limit}MB`);
  }

  /**
   * Monitor React component render times
   */
  measureComponent(componentName) {
    if (!this.enabled) return () => {};
    
    const id = this.startTimer(`component:${componentName}`);
    return () => this.endTimer(id);
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Hook for component performance monitoring
export function usePerformanceMonitor(componentName) {
  useEffect(() => {
    const cleanup = performanceMonitor.measureComponent(componentName);
    return cleanup;
  }, [componentName]);
}

// Helper function for monitoring async operations
export function withPerformanceMonitoring(operation) {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      return performanceMonitor.monitor(
        `${operation}:${propertyKey}`,
        () => originalMethod.apply(this, args),
        { args: args.length }
      );
    };
    
    return descriptor;
  };
}