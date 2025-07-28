import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockEntity from './BlockEntity';
import useBlockAnimation from './useBlockAnimation';
import { generateBlocks } from './blockConfigs';

export default function HeroBackgroundAnimation() {
  const containerRef = useRef(null);
  const [blocks, setBlocks] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const { mousePosition, handleMouseMove } = useBlockAnimation();

  // Generate blocks on mount
  useEffect(() => {
    if (isVisible) {
      setBlocks(generateBlocks(30)); // 30 blocks for balanced performance
    }
  }, [isVisible]);

  // Handle mouse movement for interactive effects
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div ref={containerRef} className="hero-background-animation">
      <AnimatePresence>
        {isVisible && blocks.map((block) => (
          <BlockEntity
            key={block.id}
            block={block}
            mousePosition={mousePosition}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}