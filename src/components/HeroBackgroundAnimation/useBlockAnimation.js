import { useState, useCallback, useRef } from 'react';

export default function useBlockAnimation() {
  const [mousePosition, setMousePosition] = useState(null);
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Throttle updates with requestAnimationFrame
    rafRef.current = requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setMousePosition(null);
  }, []);

  return {
    mousePosition,
    handleMouseMove,
    handleMouseLeave,
  };
}