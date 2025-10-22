import { useState, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import LogoMinimal from '../components/LogoMinimal';
import { Code2, Link2, Zap, GitBranch, Search, ArrowRight, Menu, X } from 'lucide-react';
import HeroSectionV3 from '../components/HeroSectionV3';
import ProblemSection from '../components/ProblemSection';
import HowItWorksVideo from '../components/HowItWorksVideo';
import { DemoModeProvider } from '../contexts/DemoModeContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { fadeInUp, staggerContainer, staggerItem, iconLift, buttonHover, featureReveal, tiltEffect } from '../utils/animations';
import { throttle } from '../utils/performance';
import NoiseOverlay from '../components/NoiseOverlay';
import LandingPerformanceMonitor from '../components/LandingPerformanceMonitor';
// Removed section transitions for cleaner, uninterrupted flow

// Lazy load heavy components
const PricingSection = lazy(() => import('../components/PricingSection'));

// Feature Card Component with Premium Effects
function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);
  
  // Throttled mouse move handler
  const handleMouseMove = useCallback(
    throttle((e) => {
      if (!cardRef.current) return;
      
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        setRotation({ x: rotateX, y: rotateY });
        
        // Update CSS variables for glow effect
        if (cardRef.current) {
          cardRef.current.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
          cardRef.current.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
        }
      });
    }, 16), // 16ms = ~60fps
    []
  );
  
  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setRotation({ x: 0, y: 0 });
  }, []);
  
  return (
    <motion.div 
      className="feature-card-wrapper"
      variants={featureReveal}
      custom={index}
    >
      {/* Gradient Orb */}
      <div className="feature-gradient-orb" />
      
      <motion.div
        ref={cardRef}
        className="feature-card"
        data-feature={feature.dataFeature}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={rotation}
        variants={tiltEffect}
        custom={rotation}
        style={{
          '--rotate-x': `${rotation.x}deg`,
          '--rotate-y': `${rotation.y}deg`,
        }}
      >
        {/* Card Glow Effect */}
        <div className="feature-card-glow" />
        
        {/* Animated Border */}
        <div className="feature-border-gradient" />
        
        {/* Card Content */}
        <div className="card-content">
          {/* Icon with Effects */}
          <div className="feature-icon-wrapper">
            <div className="feature-icon-glow" />
            <div className="feature-icon-particles">
              <span className="feature-particle" />
              <span className="feature-particle" />
              <span className="feature-particle" />
              <span className="feature-particle" />
            </div>
            <span style={{ 
              color: `rgba(255, 255, 255, ${feature.opacity || 0.9})` 
            }}>
              {feature.icon}
            </span>
          </div>
          
          {/* Text Content */}
          <div className="feature-content">
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="feature-progress">
          <div className="feature-progress-fill" />
        </div>
        
        {/* Noise Texture */}
        <div className="feature-noise" />
      </motion.div>
    </motion.div>
  );
}

function LandingContent() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  // Handle navigation bar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Code2 size={32} />,
      title: 'Document in 30 seconds',
      description: 'Paste code, add context, done. No formatting needed.',
      opacity: 0.9,
      dataFeature: 'document'
    },
    {
      icon: <Link2 size={32} />,
      title: 'Everything connected',
      description: 'Organize with projects and folders. Share knowledge easily.',
      opacity: 0.7,
      dataFeature: 'connect'
    },
    {
      icon: <Search size={32} />,
      title: 'Find anything in 2 seconds',
      description: 'Remember that fix from last year? It\'s one search away.',
      opacity: 0.5,
      dataFeature: 'search'
    },
    {
      icon: <GitBranch size={32} />,
      title: 'Never lose context',
      description: 'See how your code evolved and why you made those changes.',
      opacity: 0.3,
      dataFeature: 'context'
    }
  ];


  return (
    <div className="min-h-screen bg-dark-primary text-text-primary overflow-x-hidden">
      {/* Subtle noise texture overlay */}
      <NoiseOverlay />
      {/* Navigation - New Figma Design */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 md:px-6 pt-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="max-w-5xl w-full flex items-center justify-between px-6 py-1 rounded-2xl border border-[#1a3d52] transition-all duration-300"
          style={{
            backgroundColor: 'rgba(13, 36, 51, 0.8)',
            backdropFilter: 'blur(12px)',
            height: '74px'
          }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[#00d9ff] rounded-full"></div>
              <div className="w-2 h-2 bg-[#00d9ff] rounded-full"></div>
              <div className="w-2 h-2 bg-[#00d9ff] rounded-full"></div>
              <div className="w-2 h-2 bg-[#00d9ff] rounded-full"></div>
            </div>
            <h1 className="text-white text-base font-['Consolas'] tracking-tight">Devlog</h1>
          </motion.div>

          {/* Desktop Center Navigation */}
          <motion.div
            className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(0,255,136,0.3)]"
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.1)'
              }}
            >
              <div className="w-3.5 h-3.5 flex items-center justify-center">
                <svg viewBox="0 0 14 14" fill="none" className="w-full h-full">
                  <circle cx="7" cy="7" r="6" stroke="#00ff88" strokeWidth="1.5" fill="none"/>
                  <circle cx="7" cy="7" r="2" fill="#00ff88"/>
                </svg>
              </div>
              <span className="text-[#00ff88] text-[13px] font-['Consolas']">Beta</span>
            </div>
            <a
              href="#pricing"
              className="text-[#b8c5d0] text-[15px] hover:text-white transition-colors font-['Arial']"
            >
              Pricing
            </a>
            <button
              onClick={() => navigate('/auth')}
              className="text-[#b8c5d0] text-[15px] hover:text-white transition-colors font-['Arial']"
            >
              Sign In
            </button>
          </motion.div>

          {/* Desktop CTA Button */}
          <motion.button
            onClick={() => navigate('/auth')}
            className="hidden md:block px-6 py-2.5 bg-[#00ff88] text-[#0a1e2e] rounded-lg font-['Arial'] text-[14px] font-medium
                       hover:bg-[#00ff88]/90 transition-all relative overflow-hidden"
            variants={buttonHover}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            style={{ height: '40px' }}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
            <span className="relative z-10">Start Free Trial</span>
          </motion.button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-text-primary hover:text-accent-green transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-dark-primary shadow-2xl mobile-menu-enter">
            <div className="flex items-center justify-between p-4 border-b border-dark-secondary/20">
              <div className="flex items-center gap-2.5">
                <LogoMinimal size={32} />
                <h1 className="text-xl font-semibold">Devlog</h1>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-lg text-text-primary hover:text-accent-green transition-colors"
              >
                Pricing
              </a>
              <button
                onClick={() => {
                  navigate('/auth');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-lg text-text-primary hover:text-accent-green transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  navigate('/auth');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full px-4 py-3 bg-accent-green text-dark-primary rounded-lg font-medium 
                           text-lg hover:bg-accent-green/80 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Hero Section */}
      <HeroSectionV3 />

      {/* Problem Section */}
      <ProblemSection />
      
      {/* How It Works - Video Showcase */}
      <HowItWorksVideo />

      {/* Features Grid */}
      <section className="px-4 md:px-6 gradient-features relative">
        {/* Noise overlay for premium texture */}
        <div className="noise-overlay" />
        <div className="max-w-6xl mx-auto relative z-10 py-16 md:py-20">
          <motion.div className="text-center mb-8 md:mb-16">
            <motion.h3 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Core Features
              </span>
            </motion.h3>
            <motion.p
              className="text-lg text-text-secondary max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Everything you need to build your second brain for code
            </motion.p>
          </motion.div>

          <motion.div 
            className="fluid-grid-features"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="text-text-secondary">Loading pricing...</div></div>}>
        <PricingSection />
      </Suspense>

      {/* CTA Section */}
      <section className="px-4 md:px-6 gradient-cta relative">
        {/* Noise overlay for premium texture */}
        <div className="noise-overlay" />
        <div className="max-w-4xl mx-auto text-center relative z-10 py-16 md:py-20">
          {/* Beta - Launch pricing hidden until ready
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 
                          text-accent-green rounded-full text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-block w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
            Launch pricing ends Friday at midnight
          </motion.div> */}
          
          <motion.h3 
            className="text-3xl md:text-4xl font-bold mb-4 md:mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Stop Losing Solutions Forever
          </motion.h3>
          <motion.p 
            className="text-lg md:text-xl text-text-secondary mb-6 md:mb-8 px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Beta - User count hidden until launch
            7,000+ developers already building their second brain. Start today. */}
            Join the beta and start building your second brain today.
          </motion.p>
          <motion.div 
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-accent-green text-dark-primary 
                           rounded-lg font-medium text-base md:text-lg shadow-lg shadow-accent-green/20
                           relative overflow-hidden group"
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">Start Building Now</span>
                <ArrowRight size={24} className="relative z-10" />
              </motion.button>
            <p className="text-sm text-text-secondary/70">
              14-day free trial • Cancel anytime • Export your data
            </p>
          </motion.div>
        </div>
        
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-6 gradient-footer relative">
        {/* Subtle gradient background with noise */}
        <div className="noise-overlay" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10 py-12 md:py-16">
          {/* Centered logo and tagline */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <LogoMinimal size={28} className="opacity-80" />
            <p className="text-sm text-text-secondary/50">
              Your second brain for code
            </p>
          </div>
          
          {/* Minimal legal links */}
          <div className="flex items-center justify-center gap-6 text-xs text-text-secondary/40">
            <span>© 2025 Devlog</span>
            <span className="w-px h-3 bg-text-secondary/20" />
            <a 
              href="/privacy" 
              className="hover:text-text-secondary/60 transition-colors"
            >
              Privacy
            </a>
            <span className="w-px h-3 bg-text-secondary/20" />
            <a 
              href="/terms" 
              className="hover:text-text-secondary/60 transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Landing() {
  return (
    <DemoModeProvider>
      <LandingPerformanceMonitor />
      <LandingContent />
    </DemoModeProvider>
  );
}

