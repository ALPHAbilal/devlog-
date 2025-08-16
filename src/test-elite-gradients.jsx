import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import EliteGradient, { gradientVariants } from './components/HeroBackgroundAnimation/EliteGradient';
import './index.css';

/**
 * Test showcase for EliteGradient component
 * Allows easy comparison of all gradient variants
 */

const EliteGradientShowcase = () => {
  const [currentVariant, setCurrentVariant] = useState('neuralMemory');
  const [showGrid, setShowGrid] = useState(false);

  const variantDescriptions = {
    neuralMemory: {
      name: 'Neural Memory Network',
      description: 'Interconnected knowledge visualization with subtle green neural pathways',
      psychology: 'Evokes intelligence, connectivity, and systematic organization'
    },
    deepOcean: {
      name: 'Deep Ocean Memory',
      description: 'Vast depths of preserved knowledge with emerald highlights',
      psychology: 'Communicates depth, reliability, and endless discovery'
    },
    quantumPersistence: {
      name: 'Quantum Persistence',
      description: 'Advanced technology aesthetic with purple-to-green quantum shifts',
      psychology: 'Suggests cutting-edge innovation and persistent memory'
    },
    emeraldVault: {
      name: 'Emerald Vault',
      description: 'Secure knowledge storage with rich emerald accents on deep black',
      psychology: 'Premium security, valuable information, trustworthy preservation'
    },
    midnightArchive: {
      name: 'Midnight Archive',
      description: 'Ultra-premium dark with aurora-like wisps of brand green',
      psychology: 'Sophisticated minimalism, focus on content, premium tool'
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#000' }}>
      {/* Current gradient background */}
      <EliteGradient variant={currentVariant} />
      
      {/* Controls */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 12,
        padding: 20,
        zIndex: 1000,
        minWidth: 300
      }}>
        <h3 style={{ color: '#fff', marginBottom: 15, fontSize: 18 }}>Gradient Variants</h3>
        
        {gradientVariants.map(variant => (
          <button
            key={variant}
            onClick={() => setCurrentVariant(variant)}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 16px',
              marginBottom: 8,
              background: currentVariant === variant 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(255,255,255,0.05)',
              border: currentVariant === variant
                ? '1px solid rgba(16, 185, 129, 0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            {variantDescriptions[variant].name}
          </button>
        ))}
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginTop: 16,
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {showGrid ? 'Hide' : 'Show'} Grid View
        </button>
      </div>
      
      {/* Hero content preview */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 800 }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            marginBottom: 24,
            color: '#fff',
            lineHeight: 1.2
          }}>
            Never Google The Same <span style={{ color: '#00ff88' }}>Error Twice</span>
          </h1>
          <p style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 40,
            lineHeight: 1.5
          }}>
            Your second brain for code. Save, organize, and instantly find every solution.
          </p>
          
          {/* Variant info */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 12,
            padding: 24,
            marginTop: 60,
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#00ff88', marginBottom: 12 }}>
              {variantDescriptions[currentVariant].name}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
              {variantDescriptions[currentVariant].description}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              <strong>Psychology:</strong> {variantDescriptions[currentVariant].psychology}
            </p>
          </div>
        </div>
      </div>
      
      {/* Grid view */}
      {showGrid && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 2000,
          padding: 40,
          overflowY: 'auto'
        }}>
          <h2 style={{ color: '#fff', marginBottom: 30, textAlign: 'center' }}>
            All Gradient Variants
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 20
          }}>
            {gradientVariants.map(variant => (
              <div
                key={variant}
                onClick={() => {
                  setCurrentVariant(variant);
                  setShowGrid(false);
                }}
                style={{
                  position: 'relative',
                  height: 300,
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <EliteGradient variant={variant} />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h4 style={{ color: '#00ff88', marginBottom: 4 }}>
                    {variantDescriptions[variant].name}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    {variantDescriptions[variant].description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowGrid(false)}
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              padding: '12px 24px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Close Grid
          </button>
        </div>
      )}
    </div>
  );
};

// Mount the showcase
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <EliteGradientShowcase />
  </React.StrictMode>
);