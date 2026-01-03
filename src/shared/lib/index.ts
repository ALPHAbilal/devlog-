// Shared lib main barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Cache ==============
export { LRUCache } from './cache/lru-cache';

// ============== Styles ==============
export { cn } from './styles/cn';

// ============== Events ==============
export { default as eventBus, EVENT_TYPES } from './events/event-bus';

// ============== Performance ==============
// From utils.ts - main debounce/throttle implementations
export {
  debounce,
  throttle,
  preloadResources,
  createLazyLoader,
  lazyLoadImages,
  whenIdle,
  measurePerformance,
  batchDOMUpdates,
  createVirtualList,
  prefetchData,
  memoizeWithLimit,
  observePerformance
} from './performance/utils';

// From helpers.ts - performance monitoring helpers
export {
  startPerformanceMonitoring,
  logBlockRender,
  trackAnimationFrame,
  takeMemorySnapshot,
  getPerformanceReport,
  debugPerformance,
  isPerformanceOptimizationEnabled
} from './performance/helpers';

// From monitoring.ts - Sentry integration
export {
  initMonitoring,
  logError,
  logMessage,
  logPerformance,
  trackEvent,
  startTransaction,
  setUserContext,
  setContext,
  ErrorBoundary,
  Profiler,
  withProfiler,
  withSentryRouting
} from './performance/monitoring';

// From monitor.ts
export { performanceMonitor, usePerformanceMonitor, withPerformanceMonitoring } from './performance/monitor';

// From animation.ts
export { animationMonitor, useAnimationPerformance, monitoredAnimationLoop } from './performance/animation';

// From mobile.ts - mobile-specific performance utilities
export {
  requestIdleCallback,
  cancelIdleCallback,
  deviceCapabilities,
  VirtualScroller,
  ImagePreloader,
  PerformanceMonitor as MobilePerformanceMonitor,
  lazyLoader,
  imagePreloader
} from './performance/mobile';

// ============== Storage ==============
// From wrapper.ts
export { default as storageWrapper, deleteEntry, loadDocumentsPaginated } from './storage/wrapper';

// From multi-layer.ts
export { default as MultiLayerStorage } from './storage/multi-layer';

// From sync-engine.ts
export { default as SyncEngine } from './storage/sync-engine';

// From lru-cache.ts (storage-specific)
export { LRUCache as StorageLRUCache } from './storage/lru-cache';

// From secure.ts
export { secureStorage, SessionMonitor, sessionMonitor } from './storage/secure';
export { secureStorage as SecureStorage } from './storage/secure';

// From session-cache.ts
export { sessionCache } from './storage/session-cache';
export { sessionCache as SessionCache } from './storage/session-cache';

// From adapters - direct source files
export { default as IndexedDBAdapter } from './storage/adapters/indexeddb';
export { SupabaseAdapterOptimized, supabaseAdapter } from './storage/adapters/supabase';
export { default as compressedStorage, default as CompressedStorageAdapter } from './storage/adapters/compressed';

// Legacy utilities (direct path, no barrel chain)
export { optimizedBlockLoader, OptimizedBlockLoader } from '../../utils/optimizedBlockLoader';
export { paginatedBlockLoader, PaginatedBlockLoader } from '../../utils/paginatedBlockLoader';

// ============== Integrity & Recovery ==============
export { default as DataIntegrityManager, INTEGRITY_EVENTS } from './integrity/data-integrity';
export { default as LockManager, LOCK_EVENTS } from './locking/lock-manager';
export { CircuitBreaker, circuitBreakerManager, CIRCUIT_EVENTS } from './network/circuit-breaker';
export { default as RecoveryManager, RECOVERY_EVENTS } from './recovery/recovery-manager';
export { default as TransactionManager, TRANSACTION_EVENTS, documentSaga } from './transactions/transaction-manager';

// ============== Sanitization ==============
export {
  sanitizeInput,
  sanitizeTitle,
  sanitizeTags,
  sanitizeBlock,
  sanitizeDocument,
  sanitizeSearchQuery,
  createSafeElement,
  sanitizeURL,
  sanitizeConfig,
  DOMPurify,
  type SanitizeType
} from './sanitization';
// Aliases for backward compatibility
export { sanitizeInput as sanitize } from './sanitization';
export { sanitizeDocument as sanitizeForStorage } from './sanitization';

// ============== Rate Limiting ==============
export { rateLimiter, RateLimitError, handleRateLimitError } from './rate-limiter';

// ============== Responsive ==============
export {
  BREAKPOINTS,
  TOUCH_TARGETS,
  SAFE_AREAS,
  getAnimationDuration,
  supportsHover,
  prefersReducedMotion,
  getCurrentBreakpoint,
  matchesBreakpoint,
  createResizeObserver,
  getOptimalImageSize,
  getResponsiveFontSize,
  getScrollPosition,
  lockBodyScroll,
  unlockBodyScroll,
  isInViewport,
  responsiveClass,
  generateSrcSet,
  getResponsiveTableStyles
} from './responsive';

// ============== Animations ==============
export {
  appleEase,
  fadeIn,
  fadeInUp,
  fadeInDown,
  staggerContainer,
  staggerItem,
  textReveal,
  scaleIn,
  cardHover,
  buttonHover,
  magneticButton,
  iconLift,
  iconRotate,
  shimmer,
  navScrolled,
  toggleSwitch,
  card3D,
  gradientStatic,
  shouldReduceMotion,
  getMotionVariant,
  scrollAnimationOptions,
  problemCardContainer,
  problemCardItem,
  iconFloat,
  glowPulse,
  card3DEnhanced,
  gradientLoop,
  indicatorFill,
  magneticHover,
  liquidMorph,
  energyPulse,
  tiltEffect,
  particleFloat,
  featureReveal,
  heroTextReveal
} from './animations';

// ============== Markdown ==============
export { markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlainText } from './markdown/converter';
export { parseMarkdown, detectHeadingMarkdown, processLineBreaksAndLists, extractTagsFromContent } from './markdown/parser';
// Aliases for backward compatibility
export { markdownToHtml as convertMarkdownToHtml } from './markdown/converter';
export { htmlToMarkdown as convertHtmlToMarkdown } from './markdown/converter';
export { parseMarkdown as InlineMarkdown } from './markdown/parser';
// Create markdownConverter object for convenience
export const markdownConverter = {
  toHtml: (md: string) => import('./markdown/converter').then(m => m.markdownToHtml(md)),
  toMarkdown: (html: string) => import('./markdown/converter').then(m => m.htmlToMarkdown(html)),
};

// ============== Auth ==============
export { getURL, signInWithProvider, signInWithGoogle, signInWithGitHub, signOut } from './auth/utils';
export { clearCorruptedAuthStorage, clearCorruptedAuthStorage as clearAuthStorage } from './auth/clear-storage';

// ============== Upload ==============
export {
  uploadImageToSupabase,
  dataUrlToBlob,
  compressImage,
  deleteImageFromSupabase,
  createImagesBucketIfNotExists
} from './upload/image';
export { setupImageStorage, migrateBase64Images, cleanupBase64Data } from './upload/setup-storage';
// Aliases for backward compatibility
export { uploadImageToSupabase as uploadImage } from './upload/image';
export { deleteImageFromSupabase as deleteImage } from './upload/image';
// Generate unique filename helper
export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || 'png';
  return `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
}

// ============== Links ==============
export { extractDocumentLinks, getBacklinks } from './links/extract';
// Aliases for backward compatibility
export { extractDocumentLinks as extractLinks } from './links/extract';
export { extractDocumentLinks as extractAllLinks } from './links/extract';

// ============== DOM ==============
export { patchQuerySelector } from './dom/patch-query-selector';

// ============== Service Worker ==============
export { register, unregister } from './service-worker/register';
export {
  register as registerServiceWorker,
  unregister as unregisterServiceWorker,
  useServiceWorker,
  useInstallPrompt,
  BackgroundSyncManager,
  NotificationManager,
  CacheManager
} from './service-worker/registration';

// ============== Math ==============
export {
  calculateBranchControlPoints,
  generateTimelineBranchPath,
  calculateConnectionPoint,
  snapToPixel,
  calculateGridPosition,
  calculateBranchOffset
} from './math/timeline';
