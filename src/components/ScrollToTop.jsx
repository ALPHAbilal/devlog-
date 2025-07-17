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
      className={`
        fixed z-[9999]
        w-12 h-12 rounded-xl
        bg-accent-green backdrop-blur-xl
        border-2 border-accent-green
        flex items-center justify-center
        text-dark-primary
        hover:bg-accent-green/90
        hover:scale-110
        transition-all duration-300 ease-out
        shadow-lg shadow-accent-green/20
        group
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        ${isAtBottom ? 'bottom-24' : 'bottom-8'}
        right-8
      `}
      title="Back to top"
      aria-label="Scroll to top"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-green/0 to-accent-green/10 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Arrow icon */}
      <ArrowUp 
        size={16} 
        className="relative z-10 transition-all duration-300 
                   group-hover:text-accent-green group-hover:-translate-y-0.5"
      />
    </button>,
    portalRoot
  );
}