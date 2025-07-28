import { ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { heroTextReveal, magneticHover, liquidMorph, staggerContainer, staggerItem, energyPulse } from '../utils/animations';
import ParticleField from './ParticleField';
import GradientMesh from './GradientMesh';
import FloatingElements from './FloatingElements';
import HeroBackgroundAnimation from './HeroBackgroundAnimation/index';

export default function HeroSectionV3() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX - window.innerWidth / 2) / 50;
      const y = (clientY - window.innerHeight / 2) / 50;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('problem-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-container relative min-h-screen flex items-center py-16 md:py-20 overflow-hidden">
      {/* Premium background effects */}
      <GradientMesh />
      <ParticleField count={30} />
      <FloatingElements />
      
      {/* New sophisticated background animation */}
      <HeroBackgroundAnimation />
      
      <div className="max-w-4xl mx-auto px-4 md:px-6 w-full text-center relative z-10">
        {/* Enhanced Urgency Badge */}
        <motion.div
          className="hero-badge mb-6"
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="hero-badge-pulse" />
          <span>Launch Week: 50% off ends Friday</span>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)' }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Main content - single column, centered */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 
            className="hero-title mb-6 md:mb-8"
            variants={heroTextReveal}
          >
            <motion.span variants={staggerItem}>
              Never Google The Same
            </motion.span>
            <br />
            <motion.span 
              className="hero-title-gradient"
              data-text="Error Twice"
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Error Twice
            </motion.span>
          </motion.h1>
        </motion.div>
        
        <motion.p 
          className="hero-subtitle mb-8 md:mb-12 px-4"
          initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        >
          That Stack Overflow answer you found at 2am? That ChatGPT explanation that finally made it click? 
          Capture, connect, and find them instantly when you need them again.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        >
          <motion.button
              onClick={() => navigate('/auth')}
              className="hero-cta-primary w-full sm:w-auto"
              variants={liquidMorph}
              initial="rest"
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              custom={mousePosition}
            >
              <span className="relative z-10">Start Building</span>
              <ArrowRight size={20} className="relative z-10" />
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.2), transparent 70%)' }}
                variants={energyPulse}
                initial="initial"
                whileHover="animate"
              />
            </motion.button>
          
          <motion.button
            onClick={scrollToDemo}
            className="hero-cta-secondary w-full sm:w-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="relative z-10">See It Work in 60 Seconds</span>
            <ChevronDown size={20} className="relative z-10" />
          </motion.button>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div 
            className="hero-trust-item"
            whileHover={{ scale: 1.05 }}
          >
            <span className="hero-trust-check" style={{ '--check-delay': '0s' }}>✓</span>
            <span>14-day free trial</span>
          </motion.div>
          <div className="hidden sm:block">•</div>
          <motion.div className="hero-trust-item" whileHover={{ scale: 1.05 }}>
            <span className="hero-trust-check" style={{ '--check-delay': '0.5s' }}>✓</span>
            <span>Export anytime</span>
          </motion.div>
          <div className="hidden sm:block">•</div>
          <motion.div className="hero-trust-item" whileHover={{ scale: 1.05 }}>
            <span className="hero-trust-check" style={{ '--check-delay': '1s' }}>✓</span>
            <span>Works offline</span>
          </motion.div>
        </motion.div>

        {/* Trust Indicator */}
        <motion.p 
          className="mt-8 text-sm text-text-secondary/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          Join 7,000+ developers building their second brain
        </motion.p>
      </div>
    </section>
  );
}