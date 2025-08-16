import React from 'react';
import HeroSectionV3 from './HeroSectionV3';
import GradientTransition from './GradientTransition';
import ProblemSection from './ProblemSection';

/**
 * Example integration of GradientTransition between Hero and Problem sections
 * 
 * This demonstrates how to create a seamless visual flow between sections
 * using the GradientTransition component with different variants
 */

const GradientTransitionIntegration = () => {
  // Define color transitions based on your hero gradient
  // These should match the end colors of your EliteGradient component
  const transitionColors = {
    fromColors: {
      primary: '#0a0f14',     // Dark base from hero
      secondary: '#0d1117',   // Secondary dark
      accent: 'rgba(16, 185, 129, 0.15)' // Green accent
    },
    toColors: {
      primary: 'rgba(10, 15, 20, 1)',     // Problem section base
      secondary: 'rgba(13, 17, 23, 0.98)', // Problem section mid
      accent: 'rgba(16, 185, 129, 0.06)'  // Faded green accent
    }
  };

  return (
    <>
      {/* Hero Section */}
      <HeroSectionV3 />
      
      {/* Gradient Transition - Choose your preferred variant */}
      <GradientTransition 
        variant="wave" // Options: 'wave', 'curve', 'fade', 'angular', 'scurve'
        height={150}   // Adjust height as needed
        {...transitionColors}
        className="transition-hero-to-problem"
      />
      
      {/* Problem Section with integrated gradient background */}
      <ProblemSection />
      
      {/* Example: Transition from Problem to next section */}
      <GradientTransition 
        variant="curve"
        height={120}
        fromColors={{
          primary: 'rgba(10, 15, 20, 1)',
          secondary: 'rgba(13, 17, 23, 0.98)',
          accent: 'rgba(16, 185, 129, 0.06)'
        }}
        toColors={{
          primary: '#ffffff',  // Next section background
          secondary: '#f9fafb',
          accent: 'rgba(16, 185, 129, 0.02)'
        }}
        className="transition-problem-to-next"
      />
    </>
  );
};

// Example: Landing page integration
export const LandingPageExample = () => {
  return (
    <div className="min-h-screen">
      {/* Method 1: Using individual components with transitions */}
      <HeroSectionV3 />
      
      <GradientTransition 
        variant="wave"
        height={180}
        fromColors={{
          primary: '#0a0f14',
          secondary: '#0d1117',
          accent: 'rgba(16, 185, 129, 0.15)'
        }}
        toColors={{
          primary: 'rgba(10, 15, 20, 1)',
          secondary: 'rgba(13, 17, 23, 0.98)',
          accent: 'rgba(16, 185, 129, 0.06)'
        }}
      />
      
      <ProblemSection />
      
      {/* Continue with other sections... */}
    </div>
  );
};

// Example: Different transition variants
export const TransitionShowcase = () => {
  const baseFromColors = {
    primary: '#0a0f14',
    secondary: '#0d1117',
    accent: 'rgba(16, 185, 129, 0.15)'
  };
  
  const baseToColors = {
    primary: 'rgba(10, 15, 20, 1)',
    secondary: 'rgba(13, 17, 23, 0.98)',
    accent: 'rgba(16, 185, 129, 0.06)'
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">Wave Transition</h3>
        <GradientTransition 
          variant="wave"
          height={150}
          fromColors={baseFromColors}
          toColors={baseToColors}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Curve Transition</h3>
        <GradientTransition 
          variant="curve"
          height={150}
          fromColors={baseFromColors}
          toColors={baseToColors}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Fade Transition</h3>
        <GradientTransition 
          variant="fade"
          height={200}
          fromColors={baseFromColors}
          toColors={baseToColors}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Angular Transition</h3>
        <GradientTransition 
          variant="angular"
          height={150}
          fromColors={baseFromColors}
          toColors={baseToColors}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">S-Curve Transition</h3>
        <GradientTransition 
          variant="scurve"
          height={150}
          fromColors={baseFromColors}
          toColors={baseToColors}
        />
      </div>
    </div>
  );
};

// CSS custom properties for dynamic theming
export const cssVariables = `
  /* Add to your global CSS for easy theming */
  :root {
    /* Hero gradient end colors */
    --hero-gradient-end-primary: #0a0f14;
    --hero-gradient-end-secondary: #0d1117;
    --hero-gradient-end-accent: rgba(16, 185, 129, 0.15);
    
    /* Problem section colors */
    --problem-bg-primary: rgba(10, 15, 20, 1);
    --problem-bg-secondary: rgba(13, 17, 23, 0.98);
    --problem-bg-accent: rgba(16, 185, 129, 0.06);
    
    /* Transition height */
    --transition-height: 180px;
  }
  
  /* Responsive transition heights */
  @media (max-width: 768px) {
    :root {
      --transition-height: 120px;
    }
  }
  
  @media (max-width: 480px) {
    :root {
      --transition-height: 80px;
    }
  }
`;

export default GradientTransitionIntegration;