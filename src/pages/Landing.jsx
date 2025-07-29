import { useState, lazy, Suspense, useEffect, useRef } from 'react';
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
import NoiseOverlay from '../components/NoiseOverlay';
import {
  HeroToProblemTransition,
  ProblemToVideoTransition,
  VideoToFeaturesTransition,
  FeaturesToPricingTransition,
  PricingToCTATransition,
  CTAToFooterTransition
} from '../components/SectionTransitions';

// Lazy load heavy components
const PricingSection = lazy(() => import('../components/PricingSection'));

// Feature Card Component with Premium Effects
function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setRotation({ x: rotateX, y: rotateY });
    
    // Update CSS variables for glow effect
    cardRef.current.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };
  
  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };
  
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
      {/* Navigation */}
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glassmorphism-nav' : ''
        }`}
        style={{
          backgroundColor: !isScrolled ? 'rgba(10, 22, 40, 0.8)' : undefined,
          backdropFilter: !isScrolled ? 'blur(12px)' : undefined,
          borderBottom: !isScrolled ? '1px solid rgba(30, 41, 59, 0.2)' : undefined,
          boxShadow: !isScrolled ? 'none' : undefined
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <LogoMinimal size={32} />
            </div>
            <h1 className="text-xl font-semibold">Devlog</h1>
          </motion.div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:!flex items-center gap-4">
            <span className="text-sm text-text-secondary/70">
              Trusted by 7,000+ developers
            </span>
            <div className="w-px h-5 bg-dark-secondary/30"></div>
            <a
              href="#pricing"
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Pricing
            </a>
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </button>
            <motion.button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 bg-accent-green text-dark-primary rounded font-medium 
                           relative overflow-hidden"
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
                <span className="relative z-10">Start Free Trial</span>
              </motion.button>
          </div>
          
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

      {/* Hero to Problem Transition */}
      <HeroToProblemTransition variant="wave" />

      {/* Problem Section */}
      <ProblemSection />
      
      {/* Problem to Video Transition */}
      <ProblemToVideoTransition variant="flow" />
      
      {/* How It Works - Video Showcase */}
      <HowItWorksVideo />

      {/* Video to Features Transition */}
      <VideoToFeaturesTransition variant="geometric" />

      {/* Features Grid */}
      <section className="py-16 md:py-20 px-4 md:px-6 gradient-features relative">
        {/* Noise overlay for premium texture */}
        <div className="noise-overlay" />
        <div className="max-w-6xl mx-auto relative z-10">
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

      {/* Features to Pricing Transition */}
      <FeaturesToPricingTransition variant="premium" />

      {/* Pricing */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="text-text-secondary">Loading pricing...</div></div>}>
        <PricingSection />
      </Suspense>

      {/* Pricing to CTA Transition */}
      <PricingToCTATransition variant="energy" />

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 md:px-6 gradient-cta relative">
        {/* Noise overlay for premium texture */}
        <div className="noise-overlay" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 
                          text-accent-green rounded-full text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-block w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
            Launch pricing ends Friday at midnight
          </motion.div>
          
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
            7,000+ developers already building their second brain. Start today.
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

      {/* CTA to Footer Transition */}
      <CTAToFooterTransition variant="fade" />

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 gradient-footer relative">
        {/* Noise overlay for premium texture */}
        <div className="noise-overlay" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <LogoMinimal size={20} className="md:hidden" />
            <LogoMinimal size={24} className="hidden md:block" />
            <span className="text-xs md:text-sm text-text-secondary">© 2025 Devlog</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-text-secondary">
            <a 
              href="https://github.com/devlog-app/devlog" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-accent-green transition-colors"
            >
              GitHub
            </a>
            <a 
              href="/docs" 
              className="hover:text-accent-green transition-colors"
            >
              Documentation
            </a>
            <a 
              href="/privacy" 
              className="hover:text-accent-green transition-colors"
            >
              Privacy
            </a>
            <a 
              href="/terms" 
              className="hover:text-accent-green transition-colors"
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
      <LandingContent />
    </DemoModeProvider>
  );
}

