import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockEntity from './BlockEntity';
import useBlockAnimation from './useBlockAnimation';
import { generateBlocks } from './blockConfigs';
import { debugBlocks } from './debug';

export default function HeroBackgroundAnimation() {
  const [blocks, setBlocks] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const { containerRef, handleMouseMove, handleMouseLeave } = useBlockAnimation();
  
  // Detect device capabilities
  const [blockCount, setBlockCount] = useState(30);
  
  useEffect(() => {
    // Adjust block count based on device
    const isMobile = window.innerWidth < 768;
    const isLowEnd = !window.matchMedia('(hover: hover)').matches;
    
    if (isMobile || isLowEnd) {
      setBlockCount(15);
    } else if (window.matchMedia('(prefers-reduced-data: reduce)').matches) {
      setBlockCount(20);
    }
  }, []);

  // Generate blocks on mount
  useEffect(() => {
    if (isVisible) {
      const generatedBlocks = generateBlocks(blockCount);
      console.log('Generated blocks:', generatedBlocks);
      setBlocks(generatedBlocks);
      
      // Debug after render
      setTimeout(() => {
        debugBlocks();
      }, 100);
    }
  }, [isVisible, blockCount]);

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
  }, [containerRef]);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="hero-background-animation"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      }}
    >
      <AnimatePresence>
        {isVisible && blocks.map((block) => (
          <BlockEntity
            key={block.id}
            block={block}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}