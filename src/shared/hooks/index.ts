// Shared hooks barrel file
// Re-exports all shared hooks

export { useIntersectionObserver, useCanvasVisibility } from './use-intersection-observer';
export { useResponsive, useComponentResponsive } from './use-responsive';
export { useScrollAnimation } from './use-scroll-animation';
export { useToast, ToastProvider } from './use-toast';
export { useTouchGestures, useSwipe, usePullToRefresh, useDocumentSwipe } from './use-touch-gestures';
export { useSwipeNavigation, useCarouselSwipe } from './use-swipe-navigation';
export { useViewportAwarePosition } from './use-viewport-aware-position';
export { useIndexedDBCache } from './use-indexeddb-cache';
export { useAnalytics, useDocumentAnalytics, usePerformanceTracking } from './use-analytics';

// Performance hooks
export {
  useDebounce,
  useThrottle,
  useIdleCallback,
  useViewportSize,
  useMediaQuery,
  usePrefetch,
  useVirtualScroll,
  useProgressiveImage,
  useNetworkStatus
} from './use-performance';

// Alias for backward compatibility
export { useToast as toast } from './use-toast';
