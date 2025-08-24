import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LogoMinimal from '../components/LogoMinimal';
import NoiseOverlay from '../components/NoiseOverlay';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

export default function Privacy() {
  const navigate = useNavigate();
  const lastUpdated = 'January 9, 2025';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    {
      number: '1',
      title: 'Introduction',
      content: (
        <p className="legal-text">
          At Devlog ("we", "our", or "us"), we take your privacy seriously. This Privacy Policy 
          explains how we collect, use, disclose, and safeguard your information when you use our 
          developer knowledge management platform.
        </p>
      )
    },
    {
      number: '2',
      title: 'Information We Collect',
      content: (
        <>
          <div className="legal-subsection">
            <h3 className="legal-subsection-title">Personal Information</h3>
            <ul className="legal-list">
              <li>Email address (for authentication)</li>
              <li>Display name (optional)</li>
              <li>GitHub profile information (if using GitHub SSO)</li>
            </ul>
          </div>
          
          <div className="legal-subsection">
            <h3 className="legal-subsection-title">Usage Data</h3>
            <ul className="legal-list">
              <li>Documents created and modified</li>
              <li>Search queries (stored locally only)</li>
              <li>Feature usage analytics (anonymized)</li>
            </ul>
          </div>
          
          <div className="legal-subsection">
            <h3 className="legal-subsection-title">Technical Data</h3>
            <ul className="legal-list">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address (for security purposes)</li>
            </ul>
          </div>
        </>
      )
    },
    {
      number: '3',
      title: 'How We Use Your Information',
      content: (
        <>
          <p className="legal-text">We use your information to:</p>
          <ul className="legal-list">
            <li>Provide and maintain our service</li>
            <li>Authenticate your account</li>
            <li>Sync your data across devices (Pro/Team plans)</li>
            <li>Send important service updates</li>
            <li>Improve our platform based on usage patterns</li>
            <li>Provide customer support</li>
          </ul>
        </>
      )
    },
    {
      number: '4',
      title: 'Data Storage and Security',
      content: (
        <>
          <p className="legal-text">Your documents and code snippets are:</p>
          <ul className="legal-list">
            <li>Encrypted at rest using AES-256 encryption</li>
            <li>Transmitted over SSL/TLS connections</li>
            <li>Stored in SOC2-compliant data centers</li>
            <li>Backed up regularly with encryption</li>
            <li>Never used to train AI models</li>
          </ul>
        </>
      )
    },
    {
      number: '5',
      title: 'Data Sharing',
      content: (
        <>
          <p className="legal-text">
            We do not sell, trade, or rent your personal information. We may share data only:
          </p>
          <ul className="legal-list">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>With service providers who help us operate our platform (under strict confidentiality)</li>
            <li>In aggregated, anonymized form for analytics</li>
          </ul>
        </>
      )
    },
    {
      number: '6',
      title: 'Your Rights',
      content: (
        <>
          <p className="legal-text">You have the right to:</p>
          <ul className="legal-list">
            <li>Access your personal data</li>
            <li>Export all your documents and data</li>
            <li>Delete your account and all associated data</li>
            <li>Opt-out of marketing communications</li>
            <li>Request data portability</li>
          </ul>
        </>
      )
    },
    {
      number: '7',
      title: 'Data Retention',
      content: (
        <p className="legal-text">
          We retain your data as long as your account is active. Upon account deletion, 
          we permanently delete your data within 30 days, except where required by law 
          to retain it longer.
        </p>
      )
    },
    {
      number: '8',
      title: 'Contact Us',
      content: (
        <>
          <p className="legal-text">
            If you have questions about this Privacy Policy or our data practices, contact us at:
          </p>
          <div className="legal-contact">
            <div className="legal-contact-item">
              <span className="legal-contact-label">Email:</span>
              <span>privacy@devlog.app</span>
            </div>
            <div className="legal-contact-item">
              <span className="legal-contact-label">Address:</span>
              <span>Devlog, Inc., San Francisco, CA</span>
            </div>
          </div>
        </>
      )
    },
    {
      number: '9',
      title: 'Changes to This Policy',
      content: (
        <p className="legal-text">
          We may update this Privacy Policy from time to time. We will notify you of any 
          material changes via email or through the platform. Your continued use of Devlog 
          after such modifications constitutes acceptance of the updated policy.
        </p>
      )
    }
  ];

  return (
    <div className="legal-page-wrapper bg-dark-primary text-text-primary">
      {/* Premium gradient background */}
      <div className="fixed inset-0 gradient-hero opacity-20 pointer-events-none" />
      <NoiseOverlay />
      
      {/* Enhanced Navigation */}
      <nav className={`legal-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="legal-nav-content">
          <div className="legal-nav-left">
            <button
              onClick={() => navigate('/')}
              className="legal-back-btn"
            >
              <ArrowLeft size={20} />
              <LogoMinimal size={24} />
              <span>Back to Home</span>
            </button>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="legal-nav-cta"
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="legal-hero">
        <motion.div 
          className="legal-hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 
            className="legal-title"
            variants={fadeInUp}
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            className="legal-subtitle"
            variants={fadeInUp}
          >
            <span className="pulse-dot" />
            Last updated: {lastUpdated}
          </motion.p>
        </motion.div>
      </section>

      {/* Content with improved cards */}
      <section className="legal-content">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.number}
              className="legal-card fade-in-up"
              variants={staggerItem}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="legal-section-header">
                <span className="section-number">{section.number}</span>
                <h2 className="legal-section-title">{section.title}</h2>
              </div>
              {section.content}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Premium Footer */}
      <footer className="px-4 md:px-6 gradient-footer relative">
        <div className="noise-overlay" />
        <div className="max-w-6xl mx-auto text-center relative z-10 py-12 md:py-16">
          <div className="flex flex-col items-center gap-3 mb-6">
            <LogoMinimal size={28} className="opacity-80" />
            <p className="text-sm text-text-secondary/50">
              Your second brain for code
            </p>
          </div>
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