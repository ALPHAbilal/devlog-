import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to calculate viewport-aware positioning for menus and popups
 * Ensures content is always visible within viewport bounds
 */
export function useViewportAwarePosition({
  isOpen,
  anchorRef,
  contentRef,
  preferredPosition = 'bottom',
  offset = 8,
  constrainToViewport = true
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPosition, setActualPosition] = useState(preferredPosition);
  const [shouldUseFixed, setShouldUseFixed] = useState(false);
  const animationFrameRef = useRef();
  
  const calculatePosition = useCallback(() => {
    if (!isOpen || !anchorRef?.current || !contentRef?.current) return;
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const anchor = anchorRef.current.getBoundingClientRect();
      const content = contentRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Get safe area insets
      const computedStyle = getComputedStyle(document.documentElement);
      const safeArea = {
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10)
      };
      
      let top = 0;
      let left = 0;
      let useFixed = false;
      let chosenPosition = preferredPosition;
      
      // Check if we need to use fixed positioning
      // (when anchor is in a scrollable container)
      const scrollParent = getScrollParent(anchorRef.current);
      if (scrollParent && scrollParent !== document.body) {
        useFixed = true;
      }
      
      // Auto positioning
      if (preferredPosition === 'auto') {
        const spaceBelow = viewport.height - anchor.bottom - safeArea.bottom;
        const spaceAbove = anchor.top - safeArea.top;
        
        if (spaceBelow >= content.height + offset) {
          chosenPosition = 'bottom';
        } else if (spaceAbove >= content.height + offset) {
          chosenPosition = 'top';
        } else {
          // Use bottom with scroll if no space
          chosenPosition = 'bottom';
        }
      }
      
      // Calculate position
      switch (chosenPosition) {
        case 'bottom':
          top = anchor.bottom + offset;
          left = anchor.left + (anchor.width - content.width) / 2;
          break;
        case 'top':
          top = anchor.top - content.height - offset;
          left = anchor.left + (anchor.width - content.width) / 2;
          break;
        case 'left':
          top = anchor.top + (anchor.height - content.height) / 2;
          left = anchor.left - content.width - offset;
          break;
        case 'right':
          top = anchor.top + (anchor.height - content.height) / 2;
          left = anchor.right + offset;
          break;
      }
      
      // Constrain to viewport if enabled
      if (constrainToViewport) {
        const padding = 8;
        const maxTop = viewport.height - content.height - safeArea.bottom - padding;
        const minTop = safeArea.top + padding;
        const maxLeft = viewport.width - content.width - safeArea.right - padding;
        const minLeft = safeArea.left + padding;
        
        top = Math.max(minTop, Math.min(top, maxTop));
        left = Math.max(minLeft, Math.min(left, maxLeft));
      }
      
      setPosition({ top, left });
      setActualPosition(chosenPosition);
      setShouldUseFixed(useFixed);
    });
  }, [isOpen, anchorRef, contentRef, preferredPosition, offset, constrainToViewport]);
  
  // Recalculate on relevant changes
  useEffect(() => {
    if (!isOpen) return;
    
    calculatePosition();
    
    const handleRecalculate = () => calculatePosition();
    
    // Listen for window resize and scroll
    window.addEventListener('resize', handleRecalculate);
    window.addEventListener('scroll', handleRecalculate, true);
    
    // Also observe the anchor element for position changes
    let resizeObserver;
    if (anchorRef?.current) {
      resizeObserver = new ResizeObserver(handleRecalculate);
      resizeObserver.observe(anchorRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleRecalculate);
      window.removeEventListener('scroll', handleRecalculate, true);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, calculatePosition]);
  
  return {
    position,
    actualPosition,
    shouldUseFixed,
    style: {
      position: shouldUseFixed ? 'fixed' : 'absolute',
      top: position.top,
      left: position.left,
      zIndex: 9999
    }
  };
}

// Helper function to find scrollable parent
function getScrollParent(element) {
  if (!element) return null;
  
  let parent = element.parentElement;
  
  while (parent) {
    const style = getComputedStyle(parent);
    const overflow = style.overflow + style.overflowY + style.overflowX;
    
    if (/(auto|scroll)/.test(overflow)) {
      return parent;
    }
    
    parent = parent.parentElement;
  }

  return typeof document !== 'undefined' && document.body ? document.body : null;
}