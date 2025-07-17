import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop({ scrollContainerRef }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const scrollElement = scrollContainerRef?.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      
      // Show button when scrolled down more than 300px
      setIsVisible(scrollTop > 300);
      
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

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed z-40
        w-10 h-10 rounded-xl
        bg-dark-secondary/40 backdrop-blur-xl
        border border-dark-secondary/30
        flex items-center justify-center
        text-text-secondary/70
        hover:text-text-primary
        hover:bg-dark-secondary/60
        hover:border-accent-green/30
        hover:shadow-lg hover:shadow-accent-green/5
        transition-all duration-300 ease-out
        group
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        ${isAtBottom ? 'bottom-24' : 'bottom-8'}
      `}
      style={{ right: '2rem' }}
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
    </button>
  );
}