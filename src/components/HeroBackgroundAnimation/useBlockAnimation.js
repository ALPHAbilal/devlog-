import { useCallback, useRef } from 'react';

export default function useBlockAnimation() {
  const rafRef = useRef(null);
  const containerRef = useRef(null);

  // Update CSS custom properties instead of React state
  const updateMousePosition = useCallback((x, y) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--mouse-x', `${x}px`);
      containerRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Throttle updates with requestAnimationFrame
    rafRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        updateMousePosition(x, y);
      }
    });
  }, [updateMousePosition]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    // Reset to center when mouse leaves
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      updateMousePosition(rect.width / 2, rect.height / 2);
    }
  }, [updateMousePosition]);

  return {
    containerRef,
    handleMouseMove,
    handleMouseLeave,
  };
}