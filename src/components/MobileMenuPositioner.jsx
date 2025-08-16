import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Smart mobile menu positioning utility component
 * Ensures menus are always fully visible within viewport bounds
 */
export default function MobileMenuPositioner({
  children,
  triggerRef,
  isOpen,
  onClose,
  preferredPosition = 'bottom', // 'top', 'bottom', 'auto'
  offset = 8,
  className = '',
  showBackdrop = true,
  zIndex = 100
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [actualPosition, setActualPosition] = useState(preferredPosition);

  // Calculate safe area insets
  const getSafeAreaInsets = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10)
    };
  }, []);

  // Calculate optimal menu position
  const calculatePosition = useCallback(() => {
    if (!triggerRef?.current || !menuRef.current || !isOpen) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current;
    const safeArea = getSafeAreaInsets();
    
    // Get viewport dimensions
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      safeTop: safeArea.top,
      safeBottom: safeArea.bottom,
      safeLeft: safeArea.left,
      safeRight: safeArea.right
    };

    // Temporarily show menu to measure dimensions
    menu.style.visibility = 'hidden';
    menu.style.display = 'block';
    const menuRect = menu.getBoundingClientRect();
    menu.style.display = '';
    menu.style.visibility = '';

    // Calculate horizontal position (center-aligned with trigger by default)
    let left = trigger.left + (trigger.width / 2) - (menuRect.width / 2);
    
    // Adjust horizontal position to stay within viewport
    if (left < viewport.safeLeft + offset) {
      left = viewport.safeLeft + offset;
    } else if (left + menuRect.width > viewport.width - viewport.safeRight - offset) {
      left = viewport.width - viewport.safeRight - menuRect.width - offset;
    }

    // Calculate vertical position based on preference
    let top = 0;
    let finalPosition = preferredPosition;

    if (preferredPosition === 'auto') {
      // Determine best position based on available space
      const spaceAbove = trigger.top - viewport.safeTop - offset;
      const spaceBelow = viewport.height - trigger.bottom - viewport.safeBottom - offset;
      
      if (spaceBelow >= menuRect.height || spaceBelow > spaceAbove) {
        finalPosition = 'bottom';
      } else {
        finalPosition = 'top';
      }
    }

    if (finalPosition === 'bottom') {
      top = trigger.bottom + offset;
      // Check if menu would go off screen
      if (top + menuRect.height > viewport.height - viewport.safeBottom) {
        // Try positioning above if there's more space
        const spaceAbove = trigger.top - viewport.safeTop - offset;
        if (spaceAbove > menuRect.height) {
          finalPosition = 'top';
          top = trigger.top - menuRect.height - offset;
        } else {
          // Position at bottom of viewport if neither fits perfectly
          top = Math.max(
            viewport.safeTop + offset,
            viewport.height - viewport.safeBottom - menuRect.height - offset
          );
        }
      }
    } else if (finalPosition === 'top') {
      top = trigger.top - menuRect.height - offset;
      // Check if menu would go off screen
      if (top < viewport.safeTop) {
        top = viewport.safeTop + offset;
        finalPosition = 'bottom';
      }
    }

    setPosition({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(trigger.width)
    });
    setActualPosition(finalPosition);
  }, [triggerRef, isOpen, preferredPosition, offset, getSafeAreaInsets]);

  // Recalculate position when menu opens or window resizes
  useEffect(() => {
    if (!isOpen) return;

    calculatePosition();

    const handleResize = () => calculatePosition();
    const handleScroll = () => {
      if (isOpen) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isOpen, calculatePosition, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className="mobile-menu-backdrop"
          onClick={handleBackdropClick}
          style={{ zIndex: zIndex - 1 }}
        />
      )}
      
      {/* Menu */}
      <div
        ref={menuRef}
        className={`mobile-menu-positioner ${actualPosition} ${className}`}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: zIndex,
          transform: 'translateZ(0)', // Force GPU acceleration
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        {children}
      </div>
    </>,
    document.getElementById('portal-root') || document.body
  );
}

/**
 * Hook for easy menu positioning
 */
export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    triggerRef,
    openMenu,
    closeMenu,
    toggleMenu,
    menuProps: {
      triggerRef,
      isOpen,
      onClose: closeMenu
    }
  };
}