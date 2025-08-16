import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect hover state on an element or its parent
 * Works around CSS group hover limitations with overflow containers
 */
export function useHover() {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Find the parent block wrapper (the element with the group class)
    const parent = element.closest('.group') || element;
    
    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);
    
    // Add event listeners to the parent for hover detection
    parent.addEventListener('mouseenter', handleEnter);
    parent.addEventListener('mouseleave', handleLeave);
    
    // Also handle touch events for mobile
    parent.addEventListener('touchstart', handleEnter, { passive: true });
    
    return () => {
      parent.removeEventListener('mouseenter', handleEnter);
      parent.removeEventListener('mouseleave', handleLeave);
      parent.removeEventListener('touchstart', handleEnter);
    };
  }, []);
  
  return [ref, isHovered];
}