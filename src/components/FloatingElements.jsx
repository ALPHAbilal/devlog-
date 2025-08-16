import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function FloatingElements() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Check viewport size and motion preference
  useEffect(() => {
    const checkVisibility = () => {
      const isMobile = window.innerWidth < 768;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsVisible(!isMobile && !prefersReducedMotion);
    };
    
    checkVisibility();
    window.addEventListener('resize', checkVisibility);
    
    return () => window.removeEventListener('resize', checkVisibility);
  }, []);
  
  if (!isVisible) {
    return null;
  }
  
  // Reduced elements for performance
  return (
    <div className="hero-floating-elements">
      {/* Single optimized glass morphism bubble */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
        }}
        animate={{
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}