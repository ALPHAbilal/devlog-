import { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import LogoMinimal from '../components/LogoMinimal';
import { Code2, Link2, Shield, Zap, GitBranch, Search, ArrowRight, Menu, X } from 'lucide-react';
import HeroSectionV3 from '../components/HeroSectionV3';
import ProblemSection from '../components/ProblemSection';
import HowItWorksSimple from '../components/HowItWorksSimple';
import { DemoModeProvider } from '../contexts/DemoModeContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { fadeInUp, staggerContainer, staggerItem, iconLift, buttonHover } from '../utils/animations';
import NoiseOverlay from '../components/NoiseOverlay';

// Lazy load heavy components
const PricingSection = lazy(() => import('../components/PricingSection'));

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
      icon: <Code2 className="text-accent-green" size={32} />,
      title: 'Document in 30 seconds',
      description: 'Paste code, add context, done. No formatting needed.'
    },
    {
      icon: <Link2 className="text-accent-green" size={32} />,
      title: 'Everything connected',
      description: 'Link solutions together. Your knowledge compounds over time.'
    },
    {
      icon: <Search className="text-accent-green" size={32} />,
      title: 'Find anything in 2 seconds',
      description: 'Remember that fix from last year? It\'s one search away.'
    },
    {
      icon: <GitBranch className="text-accent-green" size={32} />,
      title: 'Never lose context',
      description: 'See how your code evolved and why you made those changes.'
    },
    {
      icon: <Zap className="text-accent-green" size={32} />,
      title: 'Works offline',
      description: 'Your knowledge is always accessible, even without internet.'
    },
    {
      icon: <Shield className="text-accent-green" size={32} />,
      title: 'Your data, always',
      description: 'Export anytime. No vendor lock-in. It\'s your knowledge.'
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

      {/* Problem Section */}
      <ProblemSection />
      
      {/* How It Works - Proof of the Promise */}
      <HowItWorksSimple />

      {/* Features Grid */}
      <section className="py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h3 
            className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Core Features
          </motion.h3>

          <motion.div 
            className="fluid-grid-features"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                className="glassmorphism-card glassmorphism-hover rounded-lg p-6
                           relative overflow-hidden group"
                variants={staggerItem}
              >
                {/* Gradient overlay on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-accent-green/0 to-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                
                <motion.div 
                  className="mb-4 relative z-10"
                  variants={iconLift}
                  initial="rest"
                  whileHover="hover"
                >
                  {feature.icon}
                </motion.div>
                <h4 className="text-xl font-semibold mb-2 relative z-10">{feature.title}</h4>
                <p className="text-text-secondary text-sm relative z-10">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* Pricing */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="text-text-secondary">Loading pricing...</div></div>}>
        <PricingSection />
      </Suspense>



      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 md:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 
                          rounded-full text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
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

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-dark-secondary/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
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

