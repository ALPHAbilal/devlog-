import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop({ scrollContainerRef }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const scrollElement = scrollContainerRef?.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      
      // Show button when scrolled down more than 100px
      const shouldShow = scrollTop > 100;
      setIsVisible(shouldShow);
      
      // Check if near bottom (within 100px)
      setIsAtBottom(scrollHeight - (scrollTop + clientHeight) < 100);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const scrollToTop = () => {
    const scrollElement = scrollContainerRef?.current;
    if (!scrollElement) return;

    // Smooth scroll to top
    scrollElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Get the portal root element
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  return createPortal(
    <button
      onClick={scrollToTop}
      style={{ 
        position: 'fixed',
        right: '32px',
        bottom: isAtBottom ? '96px' : '32px',
        left: 'auto',
        top: 'auto',
        width: '48px',
        height: '48px',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 300ms ease-out'
      }}
      className="rounded-xl bg-accent-green border-2 border-accent-green flex items-center justify-center text-dark-primary hover:bg-accent-green/90 hover:scale-110 shadow-lg shadow-accent-green/20 group"
      title="Back to top"
      aria-label="Scroll to top"
    >
      {/* Arrow icon */}
      <ArrowUp 
        size={20} 
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
    </button>,
    portalRoot
  );
}