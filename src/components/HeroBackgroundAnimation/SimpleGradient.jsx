import React from 'react';

const SimpleGradient = () => {
  return (
    <div 
      className="simple-gradient-bg"
      style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(
            ellipse at top left,
            rgba(16, 185, 129, 0.1) 0%,
            transparent 50%
          ),
          radial-gradient(
            ellipse at bottom right,
            rgba(59, 130, 246, 0.1) 0%,
            transparent 50%
          ),
          linear-gradient(
            135deg,
            #0a0a0a 0%,
            #0f0f1a 50%,
            #0a0a0a 100%
          )
        `,
        zIndex: 0
      }}
    >
      {/* Optional subtle noise texture */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
};

export default SimpleGradient;