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
        width: '40px',
        height: '40px',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      className="rounded-xl bg-dark-secondary/60 backdrop-blur-xl border border-dark-secondary/30 flex items-center justify-center hover:bg-dark-secondary/80 hover:border-accent-green/30 hover:shadow-lg hover:shadow-accent-green/5 group"
      title="Back to top"
      aria-label="Scroll to top"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-green/0 to-accent-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Arrow icon */}
      <ArrowUp 
        size={18} 
        className="relative z-10 text-text-secondary/70 group-hover:text-accent-green transition-all duration-300 group-hover:-translate-y-0.5"
      />
    </button>,
    portalRoot
  );
}