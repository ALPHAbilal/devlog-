import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import LogoMinimal from '../components/LogoMinimal';
import { Code2, Link2, Zap, GitBranch, Search, ArrowRight, Menu, X } from 'lucide-react';
import HeroSectionV3 from '../components/HeroSectionV3';
import GradientTransition from '../components/GradientTransition';
import ProblemSection from '../components/ProblemSection';
import HowItWorksVideo from '../components/HowItWorksVideo';
import { DemoModeProvider } from '../contexts/DemoModeContext';
import EnhancedInteractiveDemo from '../components/EnhancedInteractiveDemo';
import PricingSection from '../components/PricingSection';
import TestimonialsSection from '../components/TestimonialsSection';
import ScrollToTop from '../components/ScrollToTop';
import { useAuth } from '../contexts/AuthContext';

/**
 * Landing page with smooth gradient transitions
 * 
 * This demonstrates the integration of GradientTransition component
 * to create Apple-quality smooth visual flow between sections
 */

function LandingWithTransition() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Code2 size={20} />,
      title: 'Capture as you code',
      description: 'Document solutions in real-time without breaking your flow'
    },
    {
      icon: <Link2 size={20} />,
      title: 'Connect everything',
      description: 'Link related concepts, code snippets, and solutions together'
    },
    {
      icon: <Search size={20} />,
      title: 'Find instantly',
      description: 'Search across all your documentation with powerful filters'
    },
    {
      icon: <GitBranch size={20} />,
      title: 'Version everything',
      description: 'Track how your solutions evolve over time'
    }
  ];

  return (
    <DemoModeProvider>
      <div className="min-h-screen bg-dark-primary text-text-primary">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-primary/80 backdrop-blur-md border-b border-border-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center gap-2">
                  <LogoMinimal className="w-8 h-8" />
                  <span className="text-xl font-bold">Devlog</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-text-secondary hover:text-text-primary transition-colors">
                  How it works
                </a>
                <a href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">
                  Pricing
                </a>
                <div className="flex items-center gap-4">
                  {user ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-accent-green text-dark-primary rounded-lg 
                               hover:bg-green-400 transition-colors font-medium"
                    >
                      Go to Dashboard
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/auth')}
                        className="text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => navigate('/auth')}
                        className="px-4 py-2 bg-accent-green text-dark-primary rounded-lg 
                                 hover:bg-green-400 transition-colors font-medium"
                      >
                        Get started free
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-dark-secondary border-t border-border-primary"
              >
                <div className="px-4 py-4 space-y-4">
                  <a href="#features" className="block text-text-secondary hover:text-text-primary">
                    Features
                  </a>
                  <a href="#how-it-works" className="block text-text-secondary hover:text-text-primary">
                    How it works
                  </a>
                  <a href="#pricing" className="block text-text-secondary hover:text-text-primary">
                    Pricing
                  </a>
                  <div className="pt-4 border-t border-border-primary">
                    {user ? (
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full px-4 py-2 bg-accent-green text-dark-primary rounded-lg 
                                 hover:bg-green-400 transition-colors font-medium"
                      >
                        Go to Dashboard
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate('/auth')}
                          className="w-full px-4 py-2 text-text-secondary hover:text-text-primary"
                        >
                          Sign in
                        </button>
                        <button
                          onClick={() => navigate('/auth')}
                          className="w-full px-4 py-2 bg-accent-green text-dark-primary rounded-lg 
                                   hover:bg-green-400 transition-colors font-medium mt-2"
                        >
                          Get started free
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <HeroSectionV3 />

        {/* Gradient Transition from Hero to Problem */}
        <GradientTransition 
          variant="wave"
          height={180}
          fromColors={{
            primary: '#0a0f14',
            secondary: '#0d1117',
            accent: 'rgba(16, 185, 129, 0.15)'
          }}
          toColors={{
            primary: 'rgba(10, 15, 20, 1)',
            secondary: 'rgba(13, 17, 23, 0.98)',
            accent: 'rgba(16, 185, 129, 0.06)'
          }}
          className="gradient-transition-loading"
        />

        {/* Problem Section with gradient background */}
        <ProblemSection />

        {/* Gradient Transition from Problem to How It Works */}
        <GradientTransition 
          variant="curve"
          height={120}
          fromColors={{
            primary: 'rgba(10, 15, 20, 1)',
            secondary: 'rgba(13, 17, 23, 0.98)',
            accent: 'rgba(16, 185, 129, 0.06)'
          }}
          toColors={{
            primary: '#0f1419',
            secondary: '#0d1117',
            accent: 'rgba(16, 185, 129, 0.03)'
          }}
        />

        {/* How It Works - Video Showcase */}
        <HowItWorksVideo />

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 bg-dark-secondary/30">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Built for developers who document
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Every feature is designed to make documentation feel like a natural 
                part of your development workflow, not an afterthought.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="p-8 bg-dark-secondary/50 rounded-xl border border-border-primary 
                           hover:border-accent-green/30 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(0, 255, 136, 0.1)' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent-green/10 text-accent-green rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-text-secondary">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="py-20 px-6 bg-dark-primary">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Try it yourself
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Experience how Devlog transforms your documentation workflow. 
                This is a fully interactive demo - go ahead and play with it!
              </p>
            </motion.div>

            <EnhancedInteractiveDemo />
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-accent-green/10 via-dark-primary to-accent-green/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Start documenting the right way
              </h2>
              <p className="text-xl text-text-secondary mb-8">
                Join thousands of developers who've transformed their documentation workflow. 
                Free for personal use, forever.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-accent-green text-dark-primary rounded-lg text-lg font-medium
                         hover:bg-green-400 transition-all duration-300 transform hover:scale-105
                         inline-flex items-center gap-2"
              >
                Get started free
                <ArrowRight size={20} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-border-primary">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <LogoMinimal className="w-6 h-6" />
                <span className="text-lg font-semibold">Devlog</span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-text-secondary">
                <Link to="/privacy" className="hover:text-text-primary transition-colors">
                  Privacy
                </Link>
                <Link to="/terms" className="hover:text-text-primary transition-colors">
                  Terms
                </Link>
                <a href="mailto:support@devlog.app" className="hover:text-text-primary transition-colors">
                  Contact
                </a>
              </div>
              <p className="text-sm text-text-secondary">
                © 2024 Devlog. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        <ScrollToTop />
      </div>
    </DemoModeProvider>
  );
}

export default LandingWithTransition;