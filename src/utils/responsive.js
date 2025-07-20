/**
 * Responsive Design Utilities
 * Central module for all responsive design helpers and constants
 */

// Breakpoint constants matching Tailwind config
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Touch target sizes (WCAG 2.1 AA compliance)
export const TOUCH_TARGETS = {
  minimum: 44, // WCAG 2.1 AA requirement
  small: 36,   // For dense UI with alternatives
  comfortable: 48, // Recommended for primary actions
  large: 56,   // For important CTAs
};

// Safe area constants for mobile devices
export const SAFE_AREAS = {
  top: 'env(safe-area-inset-top)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
  right: 'env(safe-area-inset-right)',
};

// Animation durations based on viewport
export const getAnimationDuration = (baseMs = 300) => {
  if (typeof window === 'undefined') return baseMs;
  
  // Reduce animation duration on mobile for snappier feel
  const isMobile = window.innerWidth < BREAKPOINTS.md;
  return isMobile ? baseMs * 0.8 : baseMs;
};

// Check if device supports hover
export const supportsHover = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover)').matches;
};

// Check if device prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get current breakpoint name
export const getCurrentBreakpoint = () => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  const breakpoints = Object.entries(BREAKPOINTS).reverse();
  
  for (const [name, minWidth] of breakpoints) {
    if (width >= minWidth) return name;
  }
  
  return 'xs';
};

// Check if current viewport matches breakpoint
export const matchesBreakpoint = (breakpoint) => {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const minWidth = BREAKPOINTS[breakpoint];
  
  if (!minWidth) return false;
  
  // Find next breakpoint for upper bound
  const breakpointKeys = Object.keys(BREAKPOINTS);
  const currentIndex = breakpointKeys.indexOf(breakpoint);
  const nextBreakpoint = breakpointKeys[currentIndex + 1];
  const maxWidth = nextBreakpoint ? BREAKPOINTS[nextBreakpoint] - 1 : Infinity;
  
  return width >= minWidth && width <= maxWidth;
};

// Debounced resize observer for performance
export const createResizeObserver = (callback, delay = 150) => {
  let timeoutId;
  
  return new ResizeObserver((entries) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(entries);
    }, delay);
  });
};

// Get optimal image size based on viewport
export const getOptimalImageSize = (containerWidth, density = 1) => {
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const effectiveDensity = density * devicePixelRatio;
  
  // Common responsive image breakpoints
  const sizes = [320, 640, 768, 1024, 1280, 1536, 2048];
  const targetWidth = containerWidth * effectiveDensity;
  
  // Find the smallest size that's larger than target
  return sizes.find(size => size >= targetWidth) || sizes[sizes.length - 1];
};

// Calculate responsive font size with min/max bounds
export const getResponsiveFontSize = (baseSize, minSize, maxSize) => {
  const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 10;
  const calculatedSize = baseSize + (vw * 0.5);
  
  return Math.max(minSize, Math.min(maxSize, calculatedSize));
};

// Get scroll position with fallback
export const getScrollPosition = () => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
};

// Lock/unlock body scroll (useful for modals on mobile)
let scrollPosition = 0;

export const lockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  
  scrollPosition = window.pageYOffset;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
};

export const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollPosition);
};

// Detect if element is in viewport
export const isInViewport = (element, threshold = 0) => {
  if (!element || typeof window === 'undefined') return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
  );
};

// Format class names for responsive modifiers
export const responsiveClass = (baseClass, modifiers = {}) => {
  const classes = [baseClass];
  
  Object.entries(modifiers).forEach(([breakpoint, className]) => {
    if (className) {
      classes.push(`${breakpoint}:${className}`);
    }
  });
  
  return classes.join(' ');
};

// Generate srcset for responsive images
export const generateSrcSet = (baseSrc, sizes = [1, 2, 3]) => {
  return sizes
    .map(size => {
      const url = baseSrc.replace(/(\.[^.]+)$/, `@${size}x$1`);
      return `${url} ${size}x`;
    })
    .join(', ');
};

// Responsive table wrapper styles
export const getResponsiveTableStyles = (maxWidth = BREAKPOINTS.md) => ({
  wrapper: `overflow-x-auto -mx-4 sm:mx-0`,
  table: `min-w-full divide-y divide-gray-700`,
  container: `inline-block min-w-full align-middle`,
  scroll: `overflow-hidden shadow sm:rounded-lg`,
});

// Export all utilities as default object
export default {
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
  getResponsiveTableStyles,
};