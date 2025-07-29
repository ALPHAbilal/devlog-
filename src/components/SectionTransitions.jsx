import React from 'react';
import { motion } from 'framer-motion';

/**
 * Section Transitions - Seamless visual flow between landing page sections
 * 
 * Design Philosophy:
 * - Each transition creates a unique but cohesive connection
 * - Progressive color journey through the page
 * - Performance-optimized with GPU acceleration
 * - Mobile-responsive and accessible
 */

// Base transition component for shared functionality
const BaseTransition = ({ 
  children, 
  height = 150, 
  className = '',
  style = {}
}) => (
  <div 
    className={`section-transition ${className}`}
    style={{
      position: 'relative',
      height: `${height}px`,
      overflow: 'hidden',
      marginTop: '-1px',
      marginBottom: '-1px',
      ...style
    }}
  >
    {children}
  </div>
);

// Hero to Problem Transition
export const HeroToProblemTransition = ({ 
  variant = 'wave',
  height = 150 
}) => {
  const transitions = {
    wave: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroToProblem" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0f14" />
            <stop offset="50%" stopColor="#0b1015" />
            <stop offset="100%" stopColor="#0a0f14" />
          </linearGradient>
          <radialGradient id="heroToProblemAccent" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.02)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <path
          d={`M0,${height * 0.3} 
              C${300},${height * 0.1} ${600},${height * 0.5} ${900},${height * 0.3}
              S${1200},${height * 0.2} ${1200},${height * 0.4}
              L${1200},${height} L0,${height} Z`}
          fill="url(#heroToProblem)"
        />
        <path
          d={`M0,${height * 0.3} 
              C${300},${height * 0.1} ${600},${height * 0.5} ${900},${height * 0.3}
              S${1200},${height * 0.2} ${1200},${height * 0.4}
              L${1200},${height} L0,${height} Z`}
          fill="url(#heroToProblemAccent)"
          opacity="0.5"
        />
      </svg>
    ),
    curve: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroToProblemCurve" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0f14" />
            <stop offset="100%" stopColor="#0a0f14" />
          </linearGradient>
        </defs>
        <path
          d={`M0,0 Q${600},${height * 0.4} ${1200},0 L${1200},${height} L0,${height} Z`}
          fill="url(#heroToProblemCurve)"
        />
      </svg>
    ),
    neural: (
      <div style={{ 
        height: '100%', 
        background: `linear-gradient(to bottom, #0a0f14 0%, #0b1015 50%, #0a0f14 100%)`,
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%)`
        }} />
      </div>
    )
  };

  return (
    <BaseTransition height={height} className="hero-to-problem">
      {transitions[variant]}
    </BaseTransition>
  );
};

// Problem to Video Transition
export const ProblemToVideoTransition = ({ 
  variant = 'wave',
  height = 150 
}) => {
  const transitions = {
    wave: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="problemToVideo" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f0a14" />
            <stop offset="50%" stopColor="#0c0f1e" />
            <stop offset="100%" stopColor="#0a1428" />
          </linearGradient>
          <radialGradient id="problemToVideoAccent" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.05)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <path
          d={`M0,${height * 0.6} 
              Q${400},${height * 0.2} ${800},${height * 0.5}
              T${1200},${height * 0.3}
              L${1200},${height} L0,${height} Z`}
          fill="url(#problemToVideo)"
        />
        <path
          d={`M0,${height * 0.6} 
              Q${400},${height * 0.2} ${800},${height * 0.5}
              T${1200},${height * 0.3}
              L${1200},${height} L0,${height} Z`}
          fill="url(#problemToVideoAccent)"
          opacity="0.6"
        />
      </svg>
    ),
    flow: (
      <div style={{ 
        height: '100%',
        background: `linear-gradient(to bottom, #0f0a14 0%, #0c0f1e 40%, #0a1428 100%)`,
        position: 'relative'
      }}>
        <motion.div
          style={{
            position: 'absolute',
            width: '200%',
            height: '100%',
            background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
          }}
          animate={{
            x: ['-50%', '50%', '-50%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    )
  };

  return (
    <BaseTransition height={height} className="problem-to-video">
      {transitions[variant]}
    </BaseTransition>
  );
};

// Video to Features Transition
export const VideoToFeaturesTransition = ({ 
  variant = 'geometric',
  height = 150 
}) => {
  const transitions = {
    geometric: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="videoToFeatures" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1428" />
            <stop offset="50%" stopColor="#0c1622" />
            <stop offset="100%" stopColor="#0f1420" />
          </linearGradient>
          <pattern id="featureGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1" height="40" fill="rgba(99, 102, 241, 0.05)" />
            <rect x="0" y="0" width="40" height="1" fill="rgba(99, 102, 241, 0.05)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#videoToFeatures)" />
        <rect width="100%" height="100%" fill="url(#featureGrid)" opacity="0.3" />
        <polygon
          points={`0,0 ${300},${height * 0.3} ${600},${height * 0.1} ${900},${height * 0.4} ${1200},0 ${1200},${height} 0,${height}`}
          fill="url(#videoToFeatures)"
          opacity="0.8"
        />
      </svg>
    ),
    wave: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="videoToFeaturesWave" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1428" />
            <stop offset="100%" stopColor="#0f1420" />
          </linearGradient>
        </defs>
        <path
          d={`M0,${height * 0.4} 
              C${200},${height * 0.6} ${400},${height * 0.2} ${600},${height * 0.4}
              S${1000},${height * 0.2} ${1200},${height * 0.5}
              L${1200},${height} L0,${height} Z`}
          fill="url(#videoToFeaturesWave)"
        />
      </svg>
    )
  };

  return (
    <BaseTransition height={height} className="video-to-features">
      {transitions[variant]}
    </BaseTransition>
  );
};

// Features to Pricing Transition
export const FeaturesToPricingTransition = ({ 
  variant = 'premium',
  height = 150 
}) => {
  const transitions = {
    premium: (
      <div style={{ 
        height: '100%',
        background: `linear-gradient(to bottom, #0f1420 0%, #12101f 50%, #140a1a 100%)`,
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
                       radial-gradient(ellipse at 80% 50%, rgba(147, 51, 234, 0.05) 0%, transparent 40%)`
        }} />
        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '2px',
            top: '50%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.3) 50%, transparent 100%)',
          }}
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    ),
    wave: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="featuresToPricing" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f1420" />
            <stop offset="100%" stopColor="#140a1a" />
          </linearGradient>
        </defs>
        <path
          d={`M0,${height * 0.5} 
              Q${300},${height * 0.2} ${600},${height * 0.5}
              T${1200},${height * 0.3}
              L${1200},${height} L0,${height} Z`}
          fill="url(#featuresToPricing)"
        />
      </svg>
    )
  };

  return (
    <BaseTransition height={height} className="features-to-pricing">
      {transitions[variant]}
    </BaseTransition>
  );
};

// Pricing to CTA Transition
export const PricingToCTATransition = ({ 
  variant = 'energy',
  height = 150 
}) => {
  const transitions = {
    energy: (
      <div style={{ 
        height: '100%',
        background: `linear-gradient(to bottom, #140a1a 0%, #0f0f17 50%, #0a1410 100%)`,
        position: 'relative'
      }}>
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 60%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '100%',
              height: '1px',
              top: `${30 + i * 20}%`,
              background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) 50%, transparent 100%)',
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
    ),
    wave: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="pricingToCTA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#140a1a" />
            <stop offset="100%" stopColor="#0a1410" />
          </linearGradient>
        </defs>
        <path
          d={`M0,${height * 0.3} 
              C${400},${height * 0.1} ${800},${height * 0.5} ${1200},${height * 0.2}
              L${1200},${height} L0,${height} Z`}
          fill="url(#pricingToCTA)"
        />
      </svg>
    )
  };

  return (
    <BaseTransition height={height} className="pricing-to-cta">
      {transitions[variant]}
    </BaseTransition>
  );
};

// CTA to Footer Transition
export const CTAToFooterTransition = ({ 
  variant = 'fade',
  height = 100 
}) => {
  const transitions = {
    fade: (
      <div style={{ 
        height: '100%',
        background: `linear-gradient(to bottom, #0a1410 0%, #090f11 50%, #080a0d 100%)`,
      }} />
    ),
    minimal: (
      <svg width="100%" height="100%" viewBox={`0 0 1200 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ctaToFooter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1410" />
            <stop offset="100%" stopColor="#080a0d" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#ctaToFooter)" />
      </svg>
    )
  };

  return (
    <BaseTransition height={height} className="cta-to-footer">
      {transitions[variant]}
    </BaseTransition>
  );
};

// Export all transitions for easy import
export default {
  HeroToProblemTransition,
  ProblemToVideoTransition,
  VideoToFeaturesTransition,
  FeaturesToPricingTransition,
  PricingToCTATransition,
  CTAToFooterTransition
};