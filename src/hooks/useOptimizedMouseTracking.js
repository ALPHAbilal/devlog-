import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Optimized mouse tracking hook with debouncing and RAF
 * @param {HTMLElement} element - Element to track mouse position relative to
 * @param {number} delay - Debounce delay in ms (default: 50)
 * @returns {Object} Mouse position { x, y } as percentages
 */
export function useOptimizedMouseTracking(element, delay = 50) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastPositionRef = useRef({ x: 50, y: 50 });

  const updatePosition = useCallback((clientX, clientY) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // Only update if position changed significantly (2% threshold)
    const dx = Math.abs(x - lastPositionRef.current.x);
    const dy = Math.abs(y - lastPositionRef.current.y);
    
    if (dx > 2 || dy > 2) {
      lastPositionRef.current = { x, y };
      
      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use RAF for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        setMousePosition({ x, y });
      });
    }
  }, [element]);

  const handleMouseMove = useCallback((e) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the update
    timeoutRef.current = setTimeout(() => {
      updatePosition(e.clientX, e.clientY);
    }, delay);
  }, [updatePosition, delay]);

  useEffect(() => {
    if (!element) return;

    // Add passive event listener for better performance
    element.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      
      // Cleanup
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [element, handleMouseMove]);

  return mousePosition;
}

/**
 * Hook to check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}