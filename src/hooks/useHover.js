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
    if (!element) {
      console.log('❌ useHover: No element ref');
      return;
    }
    
    // Find the parent block wrapper (the element with the group class)
    const parent = element.closest('.group') || element;
    console.log('🔍 useHover: Found parent:', parent, 'Has .group class:', parent.classList.contains('group'));
    
    const handleEnter = () => {
      console.log('🟢 useHover: Mouse entered');
      setIsHovered(true);
    };
    const handleLeave = () => {
      console.log('🔴 useHover: Mouse left');
      setIsHovered(false);
    };
    
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