import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import LightweightCanvas from './LightweightCanvas';
import MinimalParticles from './MinimalParticles';
import InteractionHints from './InteractionHints';
import '../../styles/hero-background-animation.css';

export default function HeroBackgroundAnimation() {
  const [quality, setQuality] = useState('high');
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);
  
  // Detect device capabilities and set quality
  useEffect(() => {
    const detectPerformance = () => {
      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setQuality('minimal');
        return;
      }
      
      // Check device memory (if available)
      const memory = navigator.deviceMemory;
      if (memory && memory < 8) {
        setQuality('medium');
        return;
      }
      
      // Check GPU (basic detection)
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setQuality('minimal');
        return;
      }
      
      // Check for mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                      window.innerWidth < 768;
      if (isMobile) {
        setQuality('medium');
        return;
      }
      
      // Check CPU cores for performance hint
      const cores = navigator.hardwareConcurrency;
      if (cores && cores < 4) {
        setQuality('medium');
        return;
      }
      
      // Default to medium quality for better performance
      setQuality('medium');
    };
    
    detectPerformance();
    
    // Re-evaluate on resize
    const handleResize = () => {
      if (window.innerWidth < 768 && quality === 'high') {
        setQuality('medium');
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
  
  return (
    <div 
      ref={containerRef}
      className="hero-background-animation"
      data-quality={quality}
    >
      {/* Loading state */}
      <motion.div
        className="hero-bg-loading"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      
      {/* Render based on quality setting */}
      {quality === 'minimal' ? (
        <MinimalParticles count={20} />
      ) : (
        <LightweightCanvas 
          quality={quality} 
          isVisible={isVisible}
          particleCount={quality === 'high' ? 40 : 25}
          connectionRadius={80}
          interactionRadius={100}
        />
      )}
      
      {/* Depth gradient overlay */}
      <div className="hero-bg-gradient-overlay" />
      
      {/* Interaction hints (only show for medium/high quality) */}
      {quality !== 'minimal' && isVisible && (
        <InteractionHints show={true} />
      )}
    </div>
  );
}