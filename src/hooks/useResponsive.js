import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for responsive design utilities
 * Provides viewport detection, touch detection, and responsive helpers
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  // Breakpoint detection
  const breakpoints = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;
  const isLargeDesktop = windowSize.width >= breakpoints.xl;

  // Specific device ranges
  const isSmallMobile = windowSize.width < breakpoints.sm;
  const isTabletPortrait = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg && orientation === 'portrait';
  const isTabletLandscape = windowSize.width >= breakpoints.lg && windowSize.width < breakpoints.xl && orientation === 'landscape';

  // Handle window resize with debouncing
  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 150); // Debounce resize events
    };

    const handleOrientationChange = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    // Check if touch device
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    // Initial setup
    handleResize();
    handleOrientationChange();
    checkTouchDevice();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Utility function to check if a specific breakpoint is active
  const isBreakpoint = useCallback((breakpoint) => {
    const bp = breakpoints[breakpoint];
    if (!bp) return false;

    // Find the next breakpoint
    const breakpointKeys = Object.keys(breakpoints);
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];
    const nextBp = nextBreakpoint ? breakpoints[nextBreakpoint] : Infinity;

    return windowSize.width >= bp && windowSize.width < nextBp;
  }, [windowSize.width]);

  // Get current breakpoint name
  const getCurrentBreakpoint = useCallback(() => {
    const breakpointEntries = Object.entries(breakpoints).reverse();
    for (const [name, width] of breakpointEntries) {
      if (windowSize.width >= width) {
        return name;
      }
    }
    return 'xs';
  }, [windowSize.width]);

  // Check if viewport matches a media query
  const matchesMediaQuery = useCallback((query) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, []);

  // Get safe area insets for mobile devices
  const getSafeAreaInsets = () => {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
    
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
    };
  };

  // Check if reduced motion is preferred
  const prefersReducedMotion = matchesMediaQuery('(prefers-reduced-motion: reduce)');

  return {
    // Viewport dimensions
    windowSize,
    width: windowSize.width,
    height: windowSize.height,
    
    // Device type detection
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isSmallMobile,
    isTabletPortrait,
    isTabletLandscape,
    
    // Touch and orientation
    isTouchDevice,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    
    // Utility functions
    isBreakpoint,
    getCurrentBreakpoint,
    matchesMediaQuery,
    getSafeAreaInsets,
    
    // Accessibility
    prefersReducedMotion,
    
    // Breakpoints object for reference
    breakpoints,
  };
};

// Responsive utility hook for specific components
export const useComponentResponsive = (containerRef) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef?.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return {
    containerSize,
    isCompact: containerSize.width < 400,
    isMedium: containerSize.width >= 400 && containerSize.width < 600,
    isWide: containerSize.width >= 600,
  };
};