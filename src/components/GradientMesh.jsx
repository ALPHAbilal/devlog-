import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function GradientMesh() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  
  // Check device type and performance
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
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
  
  // Check for reduced motion preference or low performance
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  
  // Static gradient for mobile, reduced motion, or low performance devices
  if (prefersReducedMotion || isMobile || isLowPerformance) {
    return (
      <div ref={containerRef} className="hero-gradient-mesh">
        <div className="mesh-gradient" style={{ transform: 'scale(1.1)' }} />
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
              'translate3d(0%, 0%, 0) scale(1)',
              'translate3d(-5%, 5%, 0) scale(1.05)',
              'translate3d(5%, -5%, 0) scale(0.95)',
              'translate3d(0%, 0%, 0) scale(1)',
            ],
          }}
          transition={{
            duration: 45, // Slower animation for less CPU usage
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            willChange: 'auto', // Let browser optimize
          }}
        />
      )}
    </div>
  );
}