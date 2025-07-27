import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function ParticleField({ count = 20 }) { // Reduced default count
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [particles, setParticles] = useState([]);
  
  // Generate particles only when visible
  useEffect(() => {
    if (isVisible) {
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 20,
        opacity: Math.random() * 0.5 + 0.3,
      }));
      setParticles(newParticles);
    }
  }, [count, isVisible]);
  
  // Intersection Observer for lazy rendering
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
    return null;
  }

  return (
    <div ref={containerRef} className="hero-particle-field">
      {isVisible && particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="hero-particle"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            opacity: particle.opacity,
            willChange: 'transform',
          }}
          animate={{
            y: [0, -window.innerHeight * 2],
            x: [0, Math.sin(particle.id) * 100],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}