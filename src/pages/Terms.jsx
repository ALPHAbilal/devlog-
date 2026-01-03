import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LogoMinimal from '../components/LogoMinimal';
import NoiseOverlay from '../components/NoiseOverlay';
import { ArrowLeft, ChevronDown, ChevronUp, FileCheck, Users, Shield, AlertTriangle, FileText, CreditCard, Lock, Scale, Ban, Gavel, RefreshCw, Building, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fadeInUp, staggerContainer, staggerItem } from '@/shared/lib';

export default function Terms() {
  const navigate = useNavigate();
  const lastUpdated = 'January 9, 2025';
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set(['1'])); // First section expanded by default
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Calculate reading progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (sectionNumber) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionNumber)) {
      newExpanded.delete(sectionNumber);
    } else {
      newExpanded.add(sectionNumber);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.number)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const sections = [
    {
      number: '1',
      title: 'Acceptance of Terms',
      icon: FileCheck,
      content: (
        <p className="legal-text">
          By accessing or using Devlog ("Service"), you agree to be bound by these Terms of Service 
          ("Terms"). If you disagree with any part of these terms, you may not access the Service.
        </p>
      )
    },
    {
      number: '2',
      title: 'Description of Service',
      icon: FileText,
      content: (
        <p className="legal-text">
          Devlog is a developer-focused knowledge management platform that allows you to capture, 
          organize, and search your code snippets, documentation, and development insights. The Service 
          includes web-based tools, APIs, and related services.
        </p>
      )
    },
    {
      number: '3',
      title: 'Account Registration',
      icon: Users,
      content: (
        <ul className="legal-list">
          <li>You must provide accurate and complete information during registration</li>
          <li>You are responsible for maintaining the security of your account</li>
          <li>You must notify us immediately of any unauthorized access</li>
          <li>You are responsible for all activities under your account</li>
          <li>One person or legal entity may not maintain more than one free account</li>
        </ul>
      )
    },
    {
      number: '4',
      title: 'Acceptable Use',
      icon: AlertTriangle,
      content: (
        <>
          <p className="legal-text">You agree not to:</p>
          <ul className="legal-list">
            <li>Violate any laws or regulations</li>
            <li>Upload malicious code or content</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Use the Service to store or distribute illegal content</li>
            <li>Reverse engineer or attempt to extract the source code</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>
        </>
      )
    },
    {
      number: '5',
      title: 'Content Ownership',
      icon: Shield,
      content: (
        <>
          <div className="legal-subsection">
            <h3 className="legal-subsection-title">Your Content</h3>
            <p className="legal-text">
              You retain all rights to the content you upload to Devlog. By using our Service, you grant us 
              a limited license to store, backup, and display your content solely for providing the Service.
            </p>
          </div>
          
          <div className="legal-subsection">
            <h3 className="legal-subsection-title">Our Content</h3>
            <p className="legal-text">
              The Service, including its original content, features, and functionality, is owned by Devlog, Inc. 
              and is protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </div>
        </>
      )
    },
    {
      number: '6',
      title: 'Subscription Plans',
      icon: CreditCard,
      content: (
        <>
          <div className="legal-subsection">
            <h3 className="legal-subsection-title">Free Plan</h3>
            <ul className="legal-list">
              <li>Limited to 100 documents</li>
              <li>5MB per document limit</li>
              <li>Local storage only</li>
              <li>Community support</li>
            </ul>
          </div>
          
          <div className="legal-subsection">
            <h3 className="legal-subsection-title">Paid Plans</h3>
            <ul className="legal-list">
              <li>Subscription fees are billed in advance</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>Price changes will be notified 30 days in advance</li>
              <li>Cancellation takes effect at the end of the billing period</li>
            </ul>
          </div>
        </>
      )
    },
    {
      number: '7',
      title: 'Privacy and Data Protection',
      icon: Lock,
      content: (
        <p className="legal-text">
          Your use of the Service is also governed by our Privacy Policy. We are committed to protecting 
          your data and maintaining its confidentiality. We do not use your content to train AI models 
          or for any purpose other than providing the Service.
        </p>
      )
    },
    {
      number: '8',
      title: 'Limitation of Liability',
      icon: Scale,
      content: (
        <p className="legal-text" style={{ textTransform: 'uppercase', fontSize: '0.875rem' }}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEVLOG SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
          DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
        </p>
      )
    },
    {
      number: '9',
      title: 'Indemnification',
      icon: Shield,
      content: (
        <p className="legal-text">
          You agree to indemnify and hold harmless Devlog, Inc. and its officers, directors, employees, 
          and agents from any claims, damages, or expenses arising from your use of the Service or 
          violation of these Terms.
        </p>
      )
    },
    {
      number: '10',
      title: 'Termination',
      icon: Ban,
      content: (
        <p className="legal-text">
          We may terminate or suspend your account immediately, without prior notice, for conduct that 
          we believe violates these Terms or is harmful to other users, us, or third parties. Upon 
          termination, your right to use the Service will cease immediately.
        </p>
      )
    },
    {
      number: '11',
      title: 'Changes to Terms',
      icon: RefreshCw,
      content: (
        <p className="legal-text">
          We reserve the right to modify these Terms at any time. Material changes will be notified 
          via email or through the Service. Your continued use after such modifications constitutes 
          acceptance of the updated Terms.
        </p>
      )
    },
    {
      number: '12',
      title: 'Governing Law',
      icon: Gavel,
      content: (
        <p className="legal-text">
          These Terms shall be governed by the laws of the State of California, United States, 
          without regard to its conflict of law provisions.
        </p>
      )
    },
    {
      number: '13',
      title: 'Contact Information',
      icon: Mail,
      content: (
        <>
          <p className="legal-text">
            For questions about these Terms, please contact us at:
          </p>
          <div className="legal-contact">
            <div className="legal-contact-item">
              <span className="legal-contact-label">Email:</span>
              <span>legal@devlog.app</span>
            </div>
            <div className="legal-contact-item">
              <span className="legal-contact-label">Address:</span>
              <span>Devlog, Inc., San Francisco, CA</span>
            </div>
          </div>
        </>
      )
    }
  ];

  return (
    <div className="legal-page-wrapper bg-dark-primary text-text-primary">
      {/* Premium gradient background */}
      <div className="fixed inset-0 gradient-hero opacity-20 pointer-events-none" />
      <NoiseOverlay />
      
      {/* Enhanced Navigation with Progress */}
      <nav className={`legal-nav ${isScrolled ? 'scrolled' : ''}`}>
        {/* Reading Progress Bar */}
        <div className="reading-progress-bar">
          <div 
            className="reading-progress-fill" 
            style={{ width: `${readingProgress}%` }}
          />
        </div>
        
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
            
            {/* Section Controls */}
            <div className="section-controls">
              <button onClick={expandAll} className="control-btn" title="Expand All">
                <ChevronDown size={16} />
                <span className="sr-only">Expand All</span>
              </button>
              <button onClick={collapseAll} className="control-btn" title="Collapse All">
                <ChevronUp size={16} />
                <span className="sr-only">Collapse All</span>
              </button>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="reading-progress">
            <span className="progress-text">{Math.round(readingProgress)}%</span>
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
            Terms of Service
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

      {/* Content with collapsible sections */}
      <section className="legal-content">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {sections.map((section, index) => {
            const isExpanded = expandedSections.has(section.number);
            const IconComponent = section.icon;
            
            return (
              <motion.div
                key={section.number}
                className="legal-card fade-in-up"
                variants={staggerItem}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div 
                  className="legal-section-header collapsible"
                  onClick={() => toggleSection(section.number)}
                >
                  <div className="section-header-left">
                    <div className="section-icon">
                      <IconComponent size={18} />
                    </div>
                    <span className="section-number">{section.number}</span>
                    <h2 className="legal-section-title">{section.title}</h2>
                  </div>
                  <button className="collapse-toggle">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
                
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ 
                        duration: 0.3,
                        ease: [0.04, 0.62, 0.23, 0.98]
                      }}
                    >
                      <div className="legal-section-content">
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
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