import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function GradientMesh() {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);
  
  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
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
    return (
      <div ref={containerRef} className="hero-gradient-mesh">
        <div className="mesh-gradient" />
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="hero-gradient-mesh">
      {isVisible && (
        <motion.div 
          className="mesh-gradient"
          animate={{
            transform: [
              'translate3d(0%, 0%, 0) rotate(0deg) scale(1)',
              'translate3d(-10%, 10%, 0) rotate(120deg) scale(1.1)',
              'translate3d(10%, -10%, 0) rotate(240deg) scale(0.9)',
              'translate3d(0%, 0%, 0) rotate(360deg) scale(1)',
            ],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </div>
  );
}