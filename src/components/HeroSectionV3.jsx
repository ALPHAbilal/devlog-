import { ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { heroTextReveal, magneticHover, liquidMorph, staggerContainer, staggerItem, energyPulse } from '../utils/animations';
import { throttle } from '../utils/performance';
import ParticleField from './ParticleField';
import GradientMesh from './GradientMesh';
import FloatingElements from './FloatingElements';
import HeroBackgroundAnimation from './HeroBackgroundAnimation/index';

export default function HeroSectionV3() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    // Throttled mouse move handler - max 60fps
    const handleMouseMove = throttle((e) => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const x = (clientX - window.innerWidth / 2) / 50;
        const y = (clientY - window.innerHeight / 2) / 50;
        setMousePosition({ x, y });
      });
    }, 16); // 16ms = ~60fps max

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('problem-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-container gradient-hero relative min-h-screen flex items-center overflow-hidden">
      {/* Premium background effects - optimized for performance */}
      <GradientMesh />
      <ParticleField count={10} /> {/* Reduced from 30 for better performance */}
      <FloatingElements />
      
      {/* New sophisticated background animation */}
      <HeroBackgroundAnimation />
      
      <div className="max-w-6xl mx-auto px-4 md:px-6 w-full text-center relative z-10 py-16 md:py-20">
        {/* Main content - single column, centered */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            className="mb-6 md:mb-8"
            style={{
              fontSize: '72px',
              lineHeight: '82.8px',
              letterSpacing: '-1.44px',
              fontWeight: 400,
              fontFamily: 'Arial, sans-serif'
            }}
            variants={heroTextReveal}
          >
            <motion.span variants={staggerItem} className="text-white">
              Never Google The Same
            </motion.span>
            <br />
            <motion.span variants={staggerItem} className="text-white">
              Same
            </motion.span>
            <br />
            <motion.span
              className="hero-title-gradient"
              data-text="Error Twice"
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ letterSpacing: '-1.08px' }}
            >
              Error Twice
            </motion.span>
          </motion.h1>
        </motion.div>

        <motion.p
          className="text-slate-400 mb-8 md:mb-12 mx-auto"
          style={{
            fontSize: '21px',
            lineHeight: '33.6px',
            maxWidth: '768px',
            fontFamily: 'Arial, sans-serif'
          }}
          initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        >
          That Stack Overflow answer you found at 2am? That ChatGPT explanation that finally made it click?
          Capture, connect, and find them instantly when you need them again.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center mb-8"
          style={{ gap: '16px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        >
          <motion.button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center justify-start gap-2 bg-emerald-500 text-[#050d1a] rounded-lg relative overflow-hidden"
            style={{
              height: '72px',
              minWidth: '143px',
              padding: '0 12px',
              fontSize: '16px',
              letterSpacing: '-0.4px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400
            }}
            variants={liquidMorph}
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            custom={mousePosition}
          >
            <span className="relative z-10">Start Building</span>
            <ArrowRight size={16} className="relative z-10" />
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{ background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.2), transparent 70%)' }}
              variants={energyPulse}
              initial="initial"
              whileHover="animate"
            />
          </motion.button>

          <motion.button
            onClick={scrollToDemo}
            className="inline-flex items-center justify-center gap-2 border border-[#2d333b] text-indigo-100 rounded-lg relative overflow-hidden"
            style={{
              height: '74px',
              minWidth: '231px',
              padding: '0 16px',
              fontSize: '16px',
              letterSpacing: '-0.4px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
              background: 'transparent'
            }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(16, 185, 129, 0.5)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ChevronDown size={16} className="relative z-10" />
            <span className="relative z-10">See It Work In 60 Seconds</span>
          </motion.button>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 mb-12"
          style={{
            fontSize: '15px',
            letterSpacing: '-0.375px',
            fontFamily: 'Arial, sans-serif'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 text-slate-400"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-emerald-500">✓</span>
            <span>14-day free trial</span>
          </motion.div>
          <div className="hidden sm:block text-slate-600">•</div>
          <motion.div className="inline-flex items-center gap-2 text-slate-400" whileHover={{ scale: 1.05 }}>
            <span className="text-emerald-500">✓</span>
            <span>Export anytime</span>
          </motion.div>
          <div className="hidden sm:block text-slate-600">•</div>
          <motion.div className="inline-flex items-center gap-2 text-slate-400" whileHover={{ scale: 1.05 }}>
            <span className="text-emerald-500">✓</span>
            <span>Works Offline</span>
          </motion.div>
        </motion.div>

        {/* Trust Indicator - Bottom text */}
        <motion.p
          className="text-slate-400 font-['Consolas']"
          style={{
            fontSize: '14px',
            letterSpacing: '-0.35px'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          // Start building your second brain today
        </motion.p>
      </div>
    </section>
  );
}