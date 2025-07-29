import React from 'react';
import EliteGradient from './EliteGradient';

/**
 * Example integration of EliteGradient into your hero section
 * 
 * Usage in your Hero component:
 * 
 * import EliteGradient from './HeroBackgroundAnimation/EliteGradient';
 * 
 * const Hero = () => {
 *   return (
 *     <section className="hero-section" style={{ position: 'relative', minHeight: '100vh' }}>
 *       <EliteGradient variant="neuralMemory" />
 *       <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
 *         // Your hero content here
 *       </div>
 *     </section>
 *   );
 * };
 */

const EliteGradientIntegration = () => {
  // You can dynamically select variants based on:
  // - User preferences
  // - Time of day
  // - Page section
  // - A/B testing
  
  const getVariantByTimeOfDay = () => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return 'deepOcean'; // Morning - fresh, deep
    } else if (hour >= 12 && hour < 17) {
      return 'neuralMemory'; // Afternoon - productive, connected
    } else if (hour >= 17 && hour < 21) {
      return 'quantumPersistence'; // Evening - innovative
    } else {
      return 'midnightArchive'; // Night - focused, minimal
    }
  };

  // Performance optimization: The gradient is pure CSS, no re-renders needed
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Gradient background layer */}
      <EliteGradient variant={getVariantByTimeOfDay()} />
      
      {/* Content layer */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '80px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            color: '#fff',
            marginBottom: 24,
            lineHeight: 1.2
          }}>
            Never Google The Same <span style={{ color: '#00ff88' }}>Error Twice</span>
          </h1>
          <p style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 40,
            maxWidth: 600,
            margin: '0 auto'
          }}>
            Your second brain for code. Save, organize, and instantly find every solution.
          </p>
          <button style={{
            background: 'linear-gradient(135deg, #00ff88 0%, #10b981 100%)',
            color: '#000',
            padding: '16px 32px',
            fontSize: 18,
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'transform 0.2s',
            marginTop: 32
          }}>
            Start Saving Solutions
          </button>
        </div>
      </div>
    </div>
  );
};

export default EliteGradientIntegration;

/**
 * Advanced Usage Tips:
 * 
 * 1. Variant Selection Strategy:
 *    - A/B test different variants to see which converts better
 *    - Use 'neuralMemory' for general purpose (most balanced)
 *    - Use 'emeraldVault' for security-focused messaging
 *    - Use 'midnightArchive' for premium/pro features
 * 
 * 2. Performance Considerations:
 *    - All gradients are pure CSS - no JavaScript animations
 *    - SVG patterns are optimized and cached by browsers
 *    - Zero re-renders after initial mount
 * 
 * 3. Accessibility:
 *    - All variants maintain WCAG AAA contrast ratios for white text
 *    - Green accent color (#00ff88) is carefully chosen for visibility
 * 
 * 4. Responsive Design:
 *    - Gradients scale naturally with viewport
 *    - Pattern density remains consistent across screen sizes
 */