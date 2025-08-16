import React, { useState } from 'react';
import MemoryErosion from './MemoryErosion';
import MemoryErosionEnhanced from './MemoryErosionEnhanced';
import '../../styles/MemoryErosionShowcase.css';

// Showcase component demonstrating the Memory Erosion animation
const MemoryErosionShowcase = () => {
  const [version, setVersion] = useState('enhanced');
  const [showInfo, setShowInfo] = useState(true);
  
  return (
    <div className="showcase-container">
      {/* Version selector */}
      <div className="version-selector">
        <button 
          className={version === 'basic' ? 'active' : ''}
          onClick={() => setVersion('basic')}
        >
          Basic Version
        </button>
        <button 
          className={version === 'enhanced' ? 'active' : ''}
          onClick={() => setVersion('enhanced')}
        >
          Enhanced Version
        </button>
      </div>
      
      {/* Info panel */}
      {showInfo && (
        <div className="info-panel">
          <button className="close-btn" onClick={() => setShowInfo(false)}>×</button>
          <h2>Memory Erosion Animation</h2>
          <p className="tagline">Watch your code solutions fade from memory... hover to remember</p>
          
          <div className="features">
            <h3>Features:</h3>
            <ul>
              <li>✨ Hover-only interaction - no clicks needed</li>
              <li>🎨 Time-based erosion with organic patterns</li>
              <li>💎 Crystallization effect for permanent storage</li>
              <li>🌈 Advanced visual effects with GSAP</li>
              <li>⚡ Performance optimized with quality levels</li>
              <li>🎯 Physics-based movement and interactions</li>
            </ul>
          </div>
          
          <div className="tech-stack">
            <h3>Technology:</h3>
            <div className="tech-badges">
              <span className="badge">React</span>
              <span className="badge">GSAP</span>
              <span className="badge">WebGL Shaders</span>
              <span className="badge">CSS3</span>
            </div>
          </div>
          
          <div className="instructions">
            <h3>How to use:</h3>
            <ol>
              <li>Move your cursor around to explore floating code fragments</li>
              <li>Hover over any fragment to restore it from erosion</li>
              <li>Keep hovering to fully restore and crystallize memories</li>
              <li>Watch as crystallized fragments connect to each other</li>
            </ol>
          </div>
        </div>
      )}
      
      {/* Main animation */}
      {version === 'basic' ? <MemoryErosion /> : <MemoryErosionEnhanced />}
      
      {/* Awards mockup */}
      <div className="awards-banner">
        <div className="award">
          <span className="award-icon">🏆</span>
          <span className="award-text">Awwwards Site of the Day</span>
        </div>
        <div className="award">
          <span className="award-icon">⭐</span>
          <span className="award-text">FWA of the Month</span>
        </div>
        <div className="award">
          <span className="award-icon">🎨</span>
          <span className="award-text">CSS Design Award</span>
        </div>
      </div>
    </div>
  );
};

// Integration example
export const MemoryErosionIntegration = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MemoryErosionEnhanced />
    </div>
  );
};

// Configuration example
export const MemoryErosionConfig = {
  // Fragment configuration
  fragments: [
    {
      type: 'custom',
      content: 'Your custom code here',
      age: 30,
      language: 'javascript',
      importance: 0.9
    }
  ],
  
  // Animation settings
  animation: {
    erosionSpeed: 0.02,
    restorationRadius: 200,
    crystallizationThreshold: 0.95
  },
  
  // Performance settings
  performance: {
    autoAdjustQuality: true,
    targetFPS: 60,
    maxFragments: 50
  },
  
  // Visual settings
  visuals: {
    particlesEnabled: true,
    connectionsEnabled: true,
    glowEffects: true
  }
};

export default MemoryErosionShowcase;