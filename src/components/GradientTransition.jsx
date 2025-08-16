import React from 'react';

/**
 * GradientTransition - Seamless transition between hero and problem sections
 * 
 * Design Philosophy:
 * - Creates smooth visual flow from hero gradient to problem section
 * - Multiple transition styles: wave, curve, fade
 * - Pure CSS/SVG for performance
 * - Responsive and accessible
 * - Maintains brand color consistency
 */

const GradientTransition = ({ 
  variant = 'wave',
  fromColors = {
    primary: '#0a0f14',
    secondary: '#0d1117',
    accent: 'rgba(16, 185, 129, 0.15)'
  },
  toColors = {
    primary: 'rgba(26, 35, 50, 0.4)',
    secondary: 'rgba(10, 22, 40, 0.8)',
    accent: 'rgba(16, 185, 129, 0.08)'
  },
  height = 200,
  className = ''
}) => {
  
  const transitions = {
    // Smooth wave transition
    wave: {
      path: `M0,${height * 0.4} 
             C${height * 0.5},${height * 0.2} ${height * 1.5},${height * 0.6} ${height * 2},${height * 0.4}
             Q${height * 2.5},${height * 0.3} ${height * 3},${height * 0.5}
             C${height * 3.5},${height * 0.7} ${height * 4.5},${height * 0.3} ${height * 5},${height * 0.5}
             L${height * 5},${height} L0,${height} Z`,
      viewBox: `0 0 ${height * 5} ${height}`,
      preserveAspectRatio: "none"
    },
    
    // Organic curve transition
    curve: {
      path: `M0,0 
             Q${height * 1.25},${height * 0.3} ${height * 2.5},${height * 0.15}
             T${height * 5},${height * 0.3}
             L${height * 5},${height} L0,${height} Z`,
      viewBox: `0 0 ${height * 5} ${height}`,
      preserveAspectRatio: "none"
    },
    
    // Subtle fade transition
    fade: {
      gradient: true,
      maskImage: `linear-gradient(to bottom, 
                   black 0%, 
                   black 40%, 
                   transparent 100%)`
    },
    
    // Angular geometric transition
    angular: {
      path: `M0,0 
             L${height * 1.5},${height * 0.3}
             L${height * 2.5},${height * 0.1}
             L${height * 3.5},${height * 0.4}
             L${height * 5},${height * 0.2}
             L${height * 5},${height} L0,${height} Z`,
      viewBox: `0 0 ${height * 5} ${height}`,
      preserveAspectRatio: "none"
    },
    
    // Smooth S-curve transition
    scurve: {
      path: `M0,${height * 0.3}
             C${height * 1},${height * 0.1} ${height * 2},${height * 0.5} ${height * 3},${height * 0.3}
             S${height * 4},${height * 0.1} ${height * 5},${height * 0.4}
             L${height * 5},${height} L0,${height} Z`,
      viewBox: `0 0 ${height * 5} ${height}`,
      preserveAspectRatio: "none"
    }
  };

  const selectedTransition = transitions[variant];

  // Gradient definitions for reuse
  const gradientDefs = (
    <defs>
      {/* Primary gradient from hero to problem section */}
      <linearGradient id="transitionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={fromColors.primary} />
        <stop offset="30%" stopColor={fromColors.secondary} />
        <stop offset="70%" stopColor={toColors.secondary} />
        <stop offset="100%" stopColor={toColors.primary} />
      </linearGradient>
      
      {/* Accent gradient overlay */}
      <radialGradient id="accentGradient" cx="50%" cy="0%" r="100%">
        <stop offset="0%" stopColor={fromColors.accent} />
        <stop offset="50%" stopColor={toColors.accent} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      
      {/* Subtle noise filter for texture */}
      <filter id="transitionNoise">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.9" 
          numOctaves="4" 
          seed="5"
        />
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0 .02 .02 .02 0"/>
        </feComponentTransfer>
      </filter>
    </defs>
  );

  // Render fade variant
  if (selectedTransition.gradient) {
    return (
      <div 
        className={`gradient-transition gradient-transition-fade ${className}`}
        style={{
          position: 'relative',
          height: `${height}px`,
          background: `linear-gradient(to bottom, 
                        ${fromColors.primary} 0%, 
                        ${fromColors.secondary} 20%,
                        ${toColors.secondary} 80%,
                        ${toColors.primary} 100%)`,
          maskImage: selectedTransition.maskImage,
          WebkitMaskImage: selectedTransition.maskImage,
          overflow: 'hidden'
        }}
      >
        {/* Accent overlay */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${fromColors.accent} 0%, transparent 60%)`,
            opacity: 0.5
          }}
        />
        
        {/* Noise texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.02,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Cfilter id="noise"%3E%3CfeTurbulence baseFrequency="0.9" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="1"/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat'
          }}
        />
      </div>
    );
  }

  // Render SVG-based transitions
  return (
    <div 
      className={`gradient-transition gradient-transition-${variant} ${className}`}
      style={{
        position: 'relative',
        height: `${height}px`,
        overflow: 'hidden',
        marginTop: '-1px', // Prevent gap
        marginBottom: '-1px' // Prevent gap
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={selectedTransition.viewBox}
        preserveAspectRatio={selectedTransition.preserveAspectRatio}
        style={{ display: 'block' }}
      >
        {gradientDefs}
        
        {/* Main transition shape */}
        <path
          d={selectedTransition.path}
          fill="url(#transitionGradient)"
        />
        
        {/* Accent overlay shape */}
        <path
          d={selectedTransition.path}
          fill="url(#accentGradient)"
          opacity="0.3"
        />
        
        {/* Noise overlay */}
        <rect
          width="100%"
          height="100%"
          filter="url(#transitionNoise)"
          opacity="0.5"
        />
      </svg>
      
      {/* Additional gradient overlay for smoother transition */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: `linear-gradient(to bottom, transparent 0%, ${toColors.primary} 100%)`,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

// Export transition variants for documentation
export const transitionVariants = ['wave', 'curve', 'fade', 'angular', 'scurve'];

export default GradientTransition;