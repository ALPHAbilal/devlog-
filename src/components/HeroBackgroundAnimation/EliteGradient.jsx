import React, { useState } from 'react';

/**
 * EliteGradient - Premium gradient backgrounds for Devlog hero section
 * 
 * Design Philosophy:
 * - Dark base for optimal text readability
 * - Subtle brand color integration (green #00ff88, #10b981)
 * - Psychological color choices for trust and innovation
 * - Metaphorical representation of knowledge preservation
 * - Apple-level sophistication for developer tools
 */

const EliteGradient = ({ variant = 'neuralMemory' }) => {
  const gradients = {
    // Option 1: Neural Memory Network
    // Represents interconnected knowledge with subtle green accents
    neuralMemory: {
      background: `
        radial-gradient(
          circle at 20% 80%,
          rgba(16, 185, 129, 0.15) 0%,
          transparent 50%
        ),
        radial-gradient(
          circle at 80% 20%,
          rgba(0, 255, 136, 0.08) 0%,
          transparent 50%
        ),
        radial-gradient(
          circle at 50% 50%,
          rgba(16, 185, 129, 0.05) 0%,
          transparent 70%
        ),
        linear-gradient(
          135deg,
          #0a0f14 0%,
          #0d1117 25%,
          #0f1419 50%,
          #0a0f14 100%
        )
      `,
      pattern: 'dots',
      description: 'Neural network-inspired gradient representing interconnected knowledge'
    },

    // Option 2: Deep Ocean Memory
    // Deep, trustworthy blues with emerald highlights - knowledge depth metaphor
    deepOcean: {
      background: `
        radial-gradient(
          ellipse 800px 600px at 30% 0%,
          rgba(0, 255, 136, 0.12) 0%,
          transparent 40%
        ),
        radial-gradient(
          ellipse 600px 800px at 70% 100%,
          rgba(16, 185, 129, 0.08) 0%,
          transparent 40%
        ),
        linear-gradient(
          180deg,
          #030810 0%,
          #051320 20%,
          #071825 50%,
          #04111f 80%,
          #020b15 100%
        )
      `,
      pattern: 'waves',
      description: 'Ocean depths representing vast knowledge preservation'
    },

    // Option 3: Quantum Persistence
    // Sophisticated purple-to-green shift suggesting advanced technology
    quantumPersistence: {
      background: `
        radial-gradient(
          circle at 10% 50%,
          rgba(16, 185, 129, 0.18) 0%,
          transparent 50%
        ),
        radial-gradient(
          circle at 90% 50%,
          rgba(88, 28, 135, 0.15) 0%,
          transparent 50%
        ),
        conic-gradient(
          from 230deg at 50% 50%,
          #0a0a0f 0deg,
          rgba(16, 185, 129, 0.02) 180deg,
          #0a0a0f 360deg
        ),
        linear-gradient(
          110deg,
          #08080d 0%,
          #0f0f1a 30%,
          #0d0d18 60%,
          #08080d 100%
        )
      `,
      pattern: 'grid',
      description: 'Quantum-inspired gradient for cutting-edge technology feel'
    },

    // Option 4: Emerald Vault
    // Premium dark with rich emerald accents - secure knowledge storage
    emeraldVault: {
      background: `
        radial-gradient(
          ellipse 1000px 600px at 50% -20%,
          rgba(0, 255, 136, 0.06) 0%,
          transparent 70%
        ),
        radial-gradient(
          circle at 25% 75%,
          rgba(16, 185, 129, 0.12) 0%,
          transparent 40%
        ),
        radial-gradient(
          circle at 75% 25%,
          rgba(5, 150, 105, 0.08) 0%,
          transparent 40%
        ),
        linear-gradient(
          135deg,
          #020202 0%,
          #040a08 25%,
          #061210 50%,
          #030806 75%,
          #020202 100%
        )
      `,
      pattern: 'hexagon',
      description: 'Secure vault aesthetic with emerald highlights'
    },

    // Option 5: Midnight Archive
    // Ultra-premium dark with subtle aurora-like green wisps
    midnightArchive: {
      background: `
        linear-gradient(
          45deg,
          transparent 0%,
          rgba(0, 255, 136, 0.03) 50%,
          transparent 100%
        ),
        radial-gradient(
          ellipse 1200px 400px at 50% 0%,
          rgba(16, 185, 129, 0.08) 0%,
          transparent 60%
        ),
        radial-gradient(
          ellipse 800px 300px at 50% 100%,
          rgba(5, 150, 105, 0.06) 0%,
          transparent 60%
        ),
        linear-gradient(
          to bottom,
          #000000 0%,
          #030303 20%,
          #050505 40%,
          #040404 60%,
          #020202 80%,
          #000000 100%
        )
      `,
      pattern: 'noise',
      description: 'Ultra-dark archive aesthetic with aurora-like accents'
    }
  };

  const patterns = {
    // Subtle dot pattern for neural network feel
    dots: (
      <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="1" fill="rgba(16, 185, 129, 0.2)" />
      </pattern>
    ),
    
    // Wave pattern for ocean depth
    waves: (
      <pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
        <path 
          d="M0 10 Q 25 0 50 10 T 100 10" 
          stroke="rgba(16, 185, 129, 0.1)" 
          strokeWidth="0.5" 
          fill="none"
        />
      </pattern>
    ),
    
    // Grid pattern for quantum/tech feel
    grid: (
      <pattern id="grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <path 
          d="M 60 0 L 0 0 0 60" 
          fill="none" 
          stroke="rgba(16, 185, 129, 0.05)" 
          strokeWidth="0.5"
        />
      </pattern>
    ),
    
    // Hexagon pattern for secure vault aesthetic
    hexagon: (
      <pattern id="hexagon" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
        <polygon 
          points="30,1 45,13 45,39 30,51 15,39 15,13" 
          fill="none" 
          stroke="rgba(16, 185, 129, 0.04)" 
          strokeWidth="0.5"
        />
      </pattern>
    ),
    
    // Noise pattern for premium texture
    noise: (
      <filter id="noise">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.9" 
          numOctaves="4" 
          seed="5"
        />
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    )
  };

  const selectedGradient = gradients[variant];

  return (
    <div 
      className="elite-gradient-bg"
      style={{
        position: 'absolute',
        inset: 0,
        background: selectedGradient.background,
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      {/* Pattern overlay */}
      <svg 
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: selectedGradient.pattern === 'noise' ? 0.02 : 1
        }}
      >
        <defs>
          {patterns[selectedGradient.pattern]}
        </defs>
        {selectedGradient.pattern === 'noise' ? (
          <rect width="100%" height="100%" filter="url(#noise)" />
        ) : (
          <rect width="100%" height="100%" fill={`url(#${selectedGradient.pattern})`} />
        )}
      </svg>
      
      {/* Subtle vignette for depth */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

// Export variants for easy testing
export const gradientVariants = [
  'neuralMemory',
  'deepOcean', 
  'quantumPersistence',
  'emeraldVault',
  'midnightArchive'
];

export default EliteGradient;