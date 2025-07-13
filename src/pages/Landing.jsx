import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoMinimal from '../components/LogoMinimal';
import { Code2, Link2, Shield, Zap, GitBranch, FolderTree, ArrowRight, Menu, X } from 'lucide-react';
import HeroSectionV3 from '../components/HeroSectionV3';
import ProblemSection from '../components/ProblemSection';
import DeveloperTestimonial, { testimonials } from '../components/DeveloperTestimonial';
import { DemoModeProvider } from '../contexts/DemoModeContext';

// Lazy load heavy components
const PricingSection = lazy(() => import('../components/PricingSection'));
const TestimonialsSection = lazy(() => import('../components/TestimonialsSection'));

function LandingContent() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Code2 className="text-accent-green" size={32} />,
      title: 'Rich markdown editor built for code',
      description: 'Syntax highlighting, slash commands, and keyboard shortcuts. Document as fast as you code.'
    },
    {
      icon: <Link2 className="text-accent-green" size={32} />,
      title: 'Wiki-style linking between documents',
      description: 'Create connections with [[links]]. Build your personal knowledge graph naturally.'
    },
    {
      icon: <FolderTree className="text-accent-green" size={32} />,
      title: 'Organize with tags and collections',
      description: 'Structure by project, technology, or concept. Your documentation scales with your career.'
    },
    {
      icon: <GitBranch className="text-accent-green" size={32} />,
      title: 'Version history for every document',
      description: 'Track how your solutions evolved. See what changed and why.'
    },
    {
      icon: <Zap className="text-accent-green" size={32} />,
      title: 'Lightning-fast search when you need it',
      description: 'Find any document, code block, or concept instantly. Search is the result of good documentation.'
    },
    {
      icon: <Shield className="text-accent-green" size={32} />,
      title: 'Your knowledge, your control',
      description: 'Export anytime. API access. Self-host option. Your documentation stays yours.'
    }
  ];


  return (
    <div className="min-h-screen bg-dark-primary text-text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-primary/80 backdrop-blur-md border-b border-dark-secondary/20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMinimal size={32} />
            <h1 className="text-xl font-semibold">Devlog</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
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
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 bg-accent-green text-dark-primary rounded font-medium 
                         hover:bg-accent-green/80 transition-colors"
            >
              Start Free Trial
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-text-primary hover:text-accent-green transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

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
      

      {/* Developer Testimonial */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <DeveloperTestimonial {...testimonials[0]} />
      </div>

      {/* Features Grid */}
      <section className="py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Core Features</h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="bg-dark-secondary/30 border border-dark-secondary/50 rounded-lg p-6
                           hover:border-accent-green/30 hover:bg-dark-secondary/40 transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="text-text-secondary">Loading testimonials...</div></div>}>
        <TestimonialsSection />
      </Suspense>

      {/* Pricing */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="text-text-secondary">Loading pricing...</div></div>}>
        <PricingSection />
      </Suspense>


      {/* Trust Elements */}
      <section className="py-16 px-6 bg-dark-secondary/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <Shield className="text-accent-green mx-auto mb-3" size={40} />
              <h4 className="text-lg font-semibold mb-2">Your Data, Always</h4>
              <p className="text-text-secondary text-sm">
                Export anytime. No vendor lock-in. Self-host option available.
              </p>
            </div>
            <div>
              <GitBranch className="text-accent-green mx-auto mb-3" size={40} />
              <h4 className="text-lg font-semibold mb-2">Open Development</h4>
              <p className="text-text-secondary text-sm">
                Built in the open. Community-driven. Your feedback shapes the product.
              </p>
            </div>
            <div>
              <Zap className="text-accent-green mx-auto mb-3" size={40} />
              <h4 className="text-lg font-semibold mb-2">Developer Focused</h4>
              <p className="text-text-secondary text-sm">
                GitHub SSO. API access. Keyboard-first. Built how developers work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/20 text-accent-green 
                          rounded-full text-sm font-medium mb-6">
            <Zap size={16} />
            Limited Time: Get 30% off annual plans
          </div>
          
          <h3 className="text-4xl font-bold mb-6">
            Ready to Build Your Second Brain?
          </h3>
          <p className="text-xl text-text-secondary mb-8">
            Join thousands of developers who've transformed scattered notes into searchable knowledge.
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-green text-dark-primary 
                         rounded-lg font-medium text-lg hover:bg-accent-green/80 transition-all group
                         shadow-lg shadow-accent-green/20"
            >
              Claim Your 14-Day Free Trial
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-text-secondary/70">
              No credit card • Setup in 2 minutes • Cancel anytime
            </p>
          </div>
        </div>
        
        {/* Urgency indicator */}
        <div className="absolute bottom-4 right-4 text-xs text-text-secondary">
          Offer expires in 48 hours
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-dark-secondary/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMinimal size={24} />
            <span className="text-sm text-text-secondary">© 2025 Devlog</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
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

