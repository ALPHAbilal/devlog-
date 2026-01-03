/**
 * Performance utilities for monitoring and optimizing document page performance
 */

// Performance monitoring state
let performanceData = {
  blockRenders: new Map(),
  animationFrames: 0,
  memorySnapshots: [],
  startTime: performance.now()
};

/**
 * Start performance monitoring for a document
 */
export function startPerformanceMonitoring() {
  performanceData = {
    blockRenders: new Map(),
    animationFrames: 0,
    memorySnapshots: [],
    startTime: performance.now()
  };

  console.log('🚀 Performance monitoring started');
}

/**
 * Log block render performance
 */
export function logBlockRender(blockId, blockType, renderTime = performance.now()) {
  if (!performanceData.blockRenders.has(blockId)) {
    performanceData.blockRenders.set(blockId, {
      blockType,
      renderCount: 0,
      totalRenderTime: 0,
      firstRender: renderTime,
      lastRender: renderTime
    });
  }

  const blockData = performanceData.blockRenders.get(blockId);
  blockData.renderCount++;
  blockData.totalRenderTime += renderTime - blockData.lastRender;
  blockData.lastRender = renderTime;

  // Log excessive re-renders
  if (blockData.renderCount > 10) {
    console.warn(`🔄 Block ${blockId} (${blockType}) has rendered ${blockData.renderCount} times`);
  }
}

/**
 * Track animation frame usage
 */
export function trackAnimationFrame() {
  performanceData.animationFrames++;
}

/**
 * Take a memory snapshot
 */
export function takeMemorySnapshot(label = '') {
  if (performance.memory) {
    const snapshot = {
      timestamp: performance.now(),
      label,
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
    
    performanceData.memorySnapshots.push(snapshot);
    
    // Keep only last 50 snapshots
    if (performanceData.memorySnapshots.length > 50) {
      performanceData.memorySnapshots.shift();
    }
    
    return snapshot;
  }
  return null;
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
  const now = performance.now();
  const duration = now - performanceData.startTime;
  
  // Calculate block render statistics
  const blockStats = [];
  performanceData.blockRenders.forEach((data, blockId) => {
    blockStats.push({
      blockId,
      blockType: data.blockType,
      renderCount: data.renderCount,
      avgRenderTime: data.totalRenderTime / data.renderCount,
      totalTime: data.totalRenderTime
    });
  });

  // Sort by most problematic blocks
  blockStats.sort((a, b) => b.renderCount - a.renderCount);

  // Memory analysis
  const memoryAnalysis = analyzeMemoryUsage();

  return {
    duration,
    totalBlocks: performanceData.blockRenders.size,
    totalAnimationFrames: performanceData.animationFrames,
    animationFrameRate: performanceData.animationFrames / (duration / 1000),
    blockStats,
    memoryAnalysis,
    recommendations: generateRecommendations(blockStats, memoryAnalysis)
  };
}

/**
 * Analyze memory usage patterns
 */
function analyzeMemoryUsage() {
  if (performanceData.memorySnapshots.length < 2) {
    return { available: false };
  }

  const snapshots = performanceData.memorySnapshots;
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const peak = snapshots.reduce((max, snap) => 
    snap.usedJSHeapSize > max.usedJSHeapSize ? snap : max
  );

  const memoryGrowth = last.usedJSHeapSize - first.usedJSHeapSize;
  const peakUsage = peak.usedJSHeapSize;
  const currentUsage = last.usedJSHeapSize;

  return {
    available: true,
    memoryGrowth,
    peakUsage,
    currentUsage,
    growthRate: memoryGrowth / (last.timestamp - first.timestamp) * 1000, // bytes per second
    snapshots: snapshots.length
  };
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(blockStats, memoryAnalysis) {
  const recommendations = [];

  // Check for excessive re-renders
  const excessiveRerenders = blockStats.filter(block => block.renderCount > 5);
  if (excessiveRerenders.length > 0) {
    recommendations.push({
      type: 'rerenders',
      severity: 'high',
      message: `${excessiveRerenders.length} blocks are re-rendering excessively`,
      blocks: excessiveRerenders.slice(0, 5).map(b => b.blockId)
    });
  }

  // Check animation frame rate
  if (performanceData.animationFrames > 0) {
    const frameRate = performanceData.animationFrames / ((performance.now() - performanceData.startTime) / 1000);
    if (frameRate > 120) { // More than 2 frames per second on average
      recommendations.push({
        type: 'animation',
        severity: 'medium',
        message: `High animation frame rate detected (${frameRate.toFixed(1)} fps)`,
        suggestion: 'Consider reducing animation frequency or adding visibility checks'
      });
    }
  }

  // Check memory growth
  if (memoryAnalysis.available && memoryAnalysis.memoryGrowth > 10 * 1024 * 1024) { // 10MB growth
    recommendations.push({
      type: 'memory',
      severity: 'high',
      message: `Memory usage increased by ${(memoryAnalysis.memoryGrowth / 1024 / 1024).toFixed(1)}MB`,
      suggestion: 'Check for memory leaks in event listeners, intervals, or large objects'
    });
  }

  // Check for heavy blocks
  const heavyBlocks = blockStats.filter(block =>
    ['ai', 'issue-tracker'].includes(block.blockType) &&
    block.renderCount > 3
  );
  if (heavyBlocks.length > 2) {
    recommendations.push({
      type: 'heavy-blocks',
      severity: 'medium',
      message: `Multiple heavy blocks (${heavyBlocks.length}) are rendering frequently`,
      suggestion: 'Consider implementing lazy loading or virtualization'
    });
  }

  return recommendations;
}

/**
 * Debug performance in development mode
 */
export function debugPerformance() {
  if (process.env.NODE_ENV !== 'development') return;

  const report = getPerformanceReport();
  console.group('📊 Performance Report');
  console.log(`Duration: ${(report.duration / 1000).toFixed(2)}s`);
  console.log(`Blocks: ${report.totalBlocks}`);
  console.log(`Animation Frames: ${report.totalAnimationFrames}`);
  console.log(`Frame Rate: ${report.animationFrameRate.toFixed(1)} fps`);
  
  if (report.blockStats.length > 0) {
    console.group('Block Performance');
    report.blockStats.slice(0, 10).forEach(block => {
      console.log(`${block.blockType} (${block.blockId}): ${block.renderCount} renders`);
    });
    console.groupEnd();
  }

  if (report.memoryAnalysis.available) {
    console.group('Memory Analysis');
    console.log(`Growth: ${(report.memoryAnalysis.memoryGrowth / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Peak: ${(report.memoryAnalysis.peakUsage / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Current: ${(report.memoryAnalysis.currentUsage / 1024 / 1024).toFixed(1)}MB`);
    console.groupEnd();
  }

  if (report.recommendations.length > 0) {
    console.group('Recommendations');
    report.recommendations.forEach(rec => {
      const emoji = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${emoji} ${rec.message}`);
      if (rec.suggestion) console.log(`   💡 ${rec.suggestion}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Feature flag for performance optimizations
 */
export function isPerformanceOptimizationEnabled(feature) {
  const flags = {
    lazyLoading: true,
    intersectionObserver: true,
    memoryCleanup: true,
    virtualizedLists: true,
    animationControl: true
  };

  return flags[feature] ?? true;
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const args = arguments;
    const context = this;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}