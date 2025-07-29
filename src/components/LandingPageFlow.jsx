import React from 'react';
import HeroSectionV3 from './HeroSectionV3';
import ProblemSection from './ProblemSection';
import HowItWorksVideo from './HowItWorksVideo';
import PricingSection from './PricingSection';
import {
  HeroToProblemTransition,
  ProblemToVideoTransition,
  VideoToFeaturesTransition,
  FeaturesToPricingTransition,
  PricingToCTATransition,
  CTAToFooterTransition
} from './SectionTransitions';

/**
 * LandingPageFlow - Complete example of landing page with seamless transitions
 * 
 * This component demonstrates:
 * 1. Proper component ordering
 * 2. Transition variant selection
 * 3. Color flow throughout the page
 * 4. Unified gradient system in action
 * 
 * Color Psychology Journey:
 * - Hero: Dark neural (#0a0f14) → Mystery and innovation
 * - Problem: Warmer darks (#0f0a14) → Pain acknowledgment
 * - Video: Cool blues (#0a1428) → Solution clarity
 * - Features: Balanced spectrum → Capability showcase
 * - Pricing: Premium purples (#140a1a) → Value perception
 * - CTA: Energetic greens (#0a1410) → Action motivation
 */

export default function LandingPageFlow() {
  return (
    <div className="min-h-screen bg-dark-primary text-text-primary overflow-x-hidden">
      {/* Global noise overlay for consistent texture */}
      <div className="noise-overlay fixed inset-0 z-0" />
      
      {/* Hero Section - Dark Neural Theme */}
      <HeroSectionV3 />
      
      {/* Smooth wave transition from mystery to pain */}
      <HeroToProblemTransition variant="wave" height={150} />
      
      {/* Problem Section - Warm Dark Theme */}
      <ProblemSection />
      
      {/* Flowing transition from pain to solution */}
      <ProblemToVideoTransition variant="flow" height={150} />
      
      {/* Video Section - Cool Blue Theme */}
      <HowItWorksVideo />
      
      {/* Geometric transition to features */}
      <VideoToFeaturesTransition variant="geometric" height={150} />
      
      {/* Features Section - Balanced Spectrum */}
      <section className="py-16 md:py-20 px-4 md:px-6 gradient-features relative">
        <div className="noise-overlay" />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Features content here */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Core Features
          </h2>
          {/* Feature cards... */}
        </div>
      </section>
      
      {/* Premium transition to pricing */}
      <FeaturesToPricingTransition variant="premium" height={150} />
      
      {/* Pricing Section - Premium Purple Theme */}
      <PricingSection />
      
      {/* Energy transition to CTA */}
      <PricingToCTATransition variant="energy" height={150} />
      
      {/* CTA Section - Energetic Green Theme */}
      <section className="py-16 md:py-20 px-4 md:px-6 gradient-cta relative">
        <div className="noise-overlay" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build Your Second Brain?
          </h3>
          <p className="text-lg md:text-xl text-text-secondary mb-8">
            Join thousands of developers who never lose a solution again.
          </p>
          <button className="px-8 py-4 bg-accent-green text-dark-primary rounded-lg font-medium text-lg hover:bg-accent-green/90 transition-colors">
            Start Free Trial
          </button>
        </div>
      </section>
      
      {/* Fade transition to footer */}
      <CTAToFooterTransition variant="fade" height={100} />
      
      {/* Footer - Dark Minimal Theme */}
      <footer className="py-8 px-4 md:px-6 gradient-footer relative">
        <div className="noise-overlay" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <p className="text-sm text-text-secondary">
            © 2025 Devlog. Built for developers, by developers.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Usage Notes:
 * 
 * 1. Transition Variants:
 *    - wave: Organic, flowing movement
 *    - curve: Smooth curved transition
 *    - flow: Animated gradient flow
 *    - geometric: Angular, modern look
 *    - premium: Sophisticated with accents
 *    - energy: Dynamic with motion
 *    - fade: Simple gradient fade
 * 
 * 2. Height Customization:
 *    - Default: 150px for most transitions
 *    - Smaller (100px) for subtle transitions
 *    - Larger (200px) for dramatic effect
 * 
 * 3. Performance Tips:
 *    - Use GPU-accelerated transforms
 *    - Minimize paint operations
 *    - Leverage CSS containment
 *    - Consider reduced motion preferences
 * 
 * 4. Mobile Optimization:
 *    - Simplify gradients on smaller screens
 *    - Reduce animation complexity
 *    - Ensure smooth 60fps scrolling
 */