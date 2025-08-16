/**
 * Animation Performance Monitor
 * Tracks FPS and frame timing for animations
 */

class AnimationPerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.lastFpsUpdate = 0;
    this.frameTimes = [];
    this.maxFrames = 100;
    this.isMonitoring = false;
    this.slowFrameThreshold = 16.67 * 2; // 2x target frame time (30 FPS)
    this.callbacks = new Set();
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.monitor();
  }

  stop() {
    this.isMonitoring = false;
  }

  monitor = () => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    // Track frame time
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxFrames) {
      this.frameTimes.shift();
    }

    // Update FPS every second
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
      
      // Calculate average frame time
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      const slowFrames = this.frameTimes.filter(t => t > this.slowFrameThreshold).length;
      
      // Notify callbacks
      this.callbacks.forEach(callback => {
        callback({
          fps: this.fps,
          avgFrameTime: avgFrameTime.toFixed(2),
          slowFrames,
          totalFrames: this.frameTimes.length
        });
      });

      // Log performance warnings
      if (this.fps < 30) {
        console.warn(`[Animation Performance] Low FPS detected: ${this.fps} FPS`);
      }
      if (slowFrames > this.frameTimes.length * 0.1) {
        console.warn(`[Animation Performance] ${slowFrames} slow frames detected (${(slowFrames / this.frameTimes.length * 100).toFixed(1)}%)`);
      }
    }

    this.lastTime = currentTime;
    requestAnimationFrame(this.monitor);
  };

  onUpdate(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getStats() {
    const avgFrameTime = this.frameTimes.length > 0 
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length 
      : 0;
    
    return {
      fps: this.fps,
      avgFrameTime: avgFrameTime.toFixed(2),
      slowFrames: this.frameTimes.filter(t => t > this.slowFrameThreshold).length,
      totalFrames: this.frameTimes.length
    };
  }
}

// Singleton instance
export const animationMonitor = new AnimationPerformanceMonitor();

// Hook for React components
export function useAnimationPerformance() {
  const [stats, setStats] = React.useState(animationMonitor.getStats());

  React.useEffect(() => {
    const unsubscribe = animationMonitor.onUpdate(setStats);
    return unsubscribe;
  }, []);

  return stats;
}

// Utility to wrap animation loops with monitoring
export function monitoredAnimationLoop(callback, options = {}) {
  const { targetFPS = 60, autoStart = true } = options;
  const frameInterval = 1000 / targetFPS;
  let lastFrameTime = 0;
  let animationId = null;

  const loop = (currentTime) => {
    // Frame limiting
    if (currentTime - lastFrameTime < frameInterval) {
      animationId = requestAnimationFrame(loop);
      return;
    }

    lastFrameTime = currentTime;
    
    // Call the actual animation callback
    callback(currentTime);
    
    animationId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (!animationMonitor.isMonitoring && autoStart) {
      animationMonitor.start();
    }
    animationId = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  return { start, stop };
}