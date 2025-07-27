import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MinimalParticles from './MinimalParticles';

// Performance optimization - only render on larger screens
const isMobile = window.innerWidth < 1024;

export default function HeroBackgroundAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // Check if animation should be visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const heroSection = document.querySelector('.hero-container');
    if (heroSection) {
      observer.observe(heroSection);
    }

    return () => {
      if (heroSection) {
        observer.unobserve(heroSection);
      }
    };
  }, []);

  // Don't render on mobile or with reduced motion
  if (isMobile || reducedMotion) {
    return null;
  }

  return (
    <motion.div
      className="hero-background-animation"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      {/* Single minimal animation layer - 2025 enterprise style */}
      {isVisible && <MinimalParticles />}
      
      {/* Subtle gradient overlay */}
      <div className="animation-gradient-overlay" />
    </motion.div>
  );
}