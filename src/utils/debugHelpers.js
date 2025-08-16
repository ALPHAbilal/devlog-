// Auth Debug Utilities
// Comprehensive debugging tools for responsive layout analysis

export const debugHelpers = {
  // Get computed grid template columns
  getGridTemplateColumns(element) {
    if (!element) return 'N/A';
    const computed = window.getComputedStyle(element);
    return computed.gridTemplateColumns;
  },

  // Get element measurements
  getElementMeasurements(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const computed = window.getComputedStyle(element);
    
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      padding: {
        top: parseFloat(computed.paddingTop),
        right: parseFloat(computed.paddingRight),
        bottom: parseFloat(computed.paddingBottom),
        left: parseFloat(computed.paddingLeft),
      },
      margin: {
        top: parseFloat(computed.marginTop),
        right: parseFloat(computed.marginRight),
        bottom: parseFloat(computed.marginBottom),
        left: parseFloat(computed.marginLeft),
      },
      display: computed.display,
      position: computed.position,
      overflow: computed.overflow,
      overflowX: computed.overflowX,
      overflowY: computed.overflowY,
    };
  },

  // Get CSS custom properties
  getCSSCustomProperties(element = document.documentElement) {
    const computed = window.getComputedStyle(element);
    const properties = {};
    
    // Auth-specific custom properties
    const authProps = [
      '--auth-text-xs', '--auth-text-sm', '--auth-text-base', '--auth-text-lg',
      '--auth-text-xl', '--auth-text-2xl', '--auth-text-3xl', '--auth-text-4xl',
      '--auth-space-xs', '--auth-space-sm', '--auth-space-md', '--auth-space-lg',
      '--auth-space-xl', '--auth-space-2xl', '--auth-space-3xl',
      '--auth-form-width-sm', '--auth-form-width-md', '--auth-form-width-lg', '--auth-form-width-xl',
    ];
    
    authProps.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value) {
        properties[prop] = value.trim();
      }
    });
    
    return properties;
  },

  // Get active media queries
  getActiveMediaQueries() {
    const queries = [
      { name: 'Mobile', query: '(max-width: 767px)' },
      { name: 'Tablet', query: '(min-width: 768px) and (max-width: 1023px)' },
      { name: 'Desktop', query: '(min-width: 1024px)' },
      { name: 'Large Desktop', query: '(min-width: 1440px)' },
      { name: 'Ultra Wide', query: '(min-width: 1920px)' },
      { name: '4K', query: '(min-width: 2560px)' },
      { name: 'Landscape', query: '(orientation: landscape)' },
      { name: 'High DPI', query: '(-webkit-min-device-pixel-ratio: 2)' },
    ];
    
    return queries.filter(q => window.matchMedia(q.query).matches);
  },

  // Check container queries support
  checkContainerQueries() {
    return CSS.supports('container-type', 'inline-size');
  },

  // Detect overflow issues
  detectOverflow(element) {
    if (!element) return { hasOverflow: false };
    
    const rect = element.getBoundingClientRect();
    const hasHorizontalOverflow = element.scrollWidth > rect.width;
    const hasVerticalOverflow = element.scrollHeight > rect.height;
    
    return {
      hasOverflow: hasHorizontalOverflow || hasVerticalOverflow,
      horizontal: hasHorizontalOverflow,
      vertical: hasVerticalOverflow,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
    };
  },

  // Check centering issues
  checkCentering(element, parentElement) {
    if (!element || !parentElement) return null;
    
    const elementRect = element.getBoundingClientRect();
    const parentRect = parentElement.getBoundingClientRect();
    
    const horizontalCenter = parentRect.left + (parentRect.width / 2);
    const elementCenter = elementRect.left + (elementRect.width / 2);
    const horizontalOffset = Math.abs(horizontalCenter - elementCenter);
    
    const verticalCenter = parentRect.top + (parentRect.height / 2);
    const elementMiddle = elementRect.top + (elementRect.height / 2);
    const verticalOffset = Math.abs(verticalCenter - elementMiddle);
    
    return {
      isCentered: horizontalOffset < 2 && verticalOffset < 2,
      horizontalOffset: horizontalOffset,
      verticalOffset: verticalOffset,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      elementWidth: elementRect.width,
      elementHeight: elementRect.height,
    };
  },

  // Get computed styles for debugging
  getDebugStyles(element) {
    if (!element) return null;
    
    const computed = window.getComputedStyle(element);
    return {
      display: computed.display,
      gridTemplateColumns: computed.gridTemplateColumns,
      gridTemplateRows: computed.gridTemplateRows,
      gridGap: computed.gridGap,
      flexDirection: computed.flexDirection,
      justifyContent: computed.justifyContent,
      alignItems: computed.alignItems,
      placeItems: computed.placeItems,
      width: computed.width,
      height: computed.height,
      maxWidth: computed.maxWidth,
      minHeight: computed.minHeight,
      position: computed.position,
      zIndex: computed.zIndex,
    };
  },

  // Performance metrics
  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    };
  },

  // Export debug data
  exportDebugData(data) {
    const timestamp = new Date().toISOString();
    const exportData = {
      timestamp,
      userAgent: navigator.userAgent,
      ...data,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-debug-${timestamp.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Copy to clipboard
  copyToClipboard(data) {
    const text = JSON.stringify(data, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  },
};