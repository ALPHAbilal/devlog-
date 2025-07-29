// Performance Monitoring for Memory Erosion Animation

export class PerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.frameTime = 0;
    this.lastTime = performance.now();
    this.frames = 0;
    this.startTime = this.lastTime;
    
    // Performance thresholds
    this.thresholds = {
      targetFPS: 60,
      minFPS: 30,
      maxFragments: 50,
      maxParticles: 1000
    };
    
    // Performance stats
    this.stats = {
      averageFPS: 60,
      droppedFrames: 0,
      totalFrames: 0,
      gpuMemory: 0,
      cpuTime: 0
    };
    
    // Quality levels
    this.qualityLevels = {
      ultra: {
        blur: true,
        particles: true,
        shaders: true,
        maxFragments: 50,
        erosionQuality: 'high'
      },
      high: {
        blur: true,
        particles: false,
        shaders: true,
        maxFragments: 30,
        erosionQuality: 'medium'
      },
      medium: {
        blur: false,
        particles: false,
        shaders: false,
        maxFragments: 20,
        erosionQuality: 'low'
      },
      low: {
        blur: false,
        particles: false,
        shaders: false,
        maxFragments: 10,
        erosionQuality: 'minimal'
      }
    };
    
    this.currentQuality = 'ultra';
    this.autoAdjust = true;
  }
  
  // Update performance metrics
  update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frames++;
    this.stats.totalFrames++;
    
    // Calculate FPS every second
    if (currentTime >= this.startTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.startTime));
      this.stats.averageFPS = (this.stats.averageFPS * 0.9) + (this.fps * 0.1);
      
      // Check for performance issues
      if (this.fps < this.thresholds.minFPS) {
        this.stats.droppedFrames++;
        if (this.autoAdjust) {
          this.adjustQuality('down');
        }
      } else if (this.fps >= this.thresholds.targetFPS - 5) {
        if (this.autoAdjust) {
          this.adjustQuality('up');
        }
      }
      
      this.frames = 0;
      this.startTime = currentTime;
    }
    
    this.lastTime = currentTime;
    this.frameTime = deltaTime;
    
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      quality: this.currentQuality
    };
  }
  
  // Adjust quality based on performance
  adjustQuality(direction) {
    const qualities = Object.keys(this.qualityLevels);
    const currentIndex = qualities.indexOf(this.currentQuality);
    
    if (direction === 'down' && currentIndex < qualities.length - 1) {
      this.currentQuality = qualities[currentIndex + 1];
      console.log(`Performance: Lowering quality to ${this.currentQuality}`);
    } else if (direction === 'up' && currentIndex > 0) {
      // Only increase quality if we've been stable for a while
      if (this.stats.droppedFrames < 5) {
        this.currentQuality = qualities[currentIndex - 1];
        console.log(`Performance: Increasing quality to ${this.currentQuality}`);
      }
    }
  }
  
  // Get current quality settings
  getQualitySettings() {
    return this.qualityLevels[this.currentQuality];
  }
  
  // Monitor GPU memory usage (if available)
  async checkGPUMemory() {
    if ('gpu' in navigator && navigator.gpu.requestAdapter) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        const info = await adapter.requestAdapterInfo();
        this.stats.gpuMemory = info.limits?.maxBufferSize || 0;
      } catch (e) {
        // GPU info not available
      }
    }
  }
  
  // Get performance report
  getReport() {
    return {
      currentFPS: this.fps,
      averageFPS: Math.round(this.stats.averageFPS),
      quality: this.currentQuality,
      droppedFrames: this.stats.droppedFrames,
      totalFrames: this.stats.totalFrames,
      dropRate: (this.stats.droppedFrames / this.stats.totalFrames * 100).toFixed(2) + '%'
    };
  }
  
  // Create visual performance overlay
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'performance-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 10000;
      min-width: 150px;
    `;
    
    const updateOverlay = () => {
      const report = this.getReport();
      overlay.innerHTML = `
        <div>FPS: ${report.currentFPS}</div>
        <div>AVG: ${report.averageFPS}</div>
        <div>Quality: ${report.quality}</div>
        <div>Drops: ${report.dropRate}</div>
      `;
      
      // Color code based on performance
      if (report.currentFPS < 30) {
        overlay.style.color = '#ff0000';
      } else if (report.currentFPS < 50) {
        overlay.style.color = '#ffff00';
      } else {
        overlay.style.color = '#00ff00';
      }
    };
    
    setInterval(updateOverlay, 100);
    document.body.appendChild(overlay);
    
    return overlay;
  }
}

// Optimization utilities
export const OptimizationUtils = {
  // Throttle function calls
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Debounce function calls
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  
  // Object pooling for particles
  createObjectPool(factory, size = 100) {
    const pool = [];
    const active = new Set();
    
    // Pre-populate pool
    for (let i = 0; i < size; i++) {
      pool.push(factory());
    }
    
    return {
      get() {
        let obj = pool.pop();
        if (!obj) {
          obj = factory();
        }
        active.add(obj);
        return obj;
      },
      
      release(obj) {
        if (active.has(obj)) {
          active.delete(obj);
          pool.push(obj);
        }
      },
      
      releaseAll() {
        active.forEach(obj => {
          pool.push(obj);
        });
        active.clear();
      },
      
      size: () => pool.length,
      activeSize: () => active.size
    };
  },
  
  // Viewport culling
  isInViewport(element, buffer = 100) {
    const rect = element.getBoundingClientRect();
    return (
      rect.bottom >= -buffer &&
      rect.top <= window.innerHeight + buffer &&
      rect.right >= -buffer &&
      rect.left <= window.innerWidth + buffer
    );
  },
  
  // Batch DOM updates
  batchUpdates(updates) {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }
};

// Memory management
export class MemoryManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50;
  }
  
  // Cache processed text
  cacheProcessedText(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  getProcessedText(key) {
    return this.cache.get(key);
  }
  
  // Clean up resources
  cleanup() {
    this.cache.clear();
  }
  
  // Monitor memory usage
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export const memoryManager = new MemoryManager();