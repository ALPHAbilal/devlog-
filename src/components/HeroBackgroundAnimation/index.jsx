import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import BlockConstellation from './BlockConstellation';
import CodeEvolution from './CodeEvolution';
import KnowledgeGraph from './KnowledgeGraph';
import WorkflowParticles from './WorkflowParticles';

// Performance optimization - lazy load on desktop only
const isMobile = window.innerWidth < 768;

export default function HeroBackgroundAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // Check if animation should be visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const heroSection = document.querySelector('.hero-container');
    if (heroSection) {
      observer.observe(heroSection);
    }

    return () => {
      if (heroSection) {
        observer.unobserve(heroSection);
      }
    };
  }, []);

  // Don't render on mobile or with reduced motion
  if (isMobile || reducedMotion) {
    return null;
  }

  return (
    <motion.div
      className="hero-background-animation"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1 }}
    >
      {/* Layer 1: Block Constellation Network */}
      <div className="animation-layer constellation-layer">
        <Suspense fallback={null}>
          {isVisible && <BlockConstellation />}
        </Suspense>
      </div>

      {/* Layer 2: Code Evolution */}
      <div className="animation-layer evolution-layer">
        <Suspense fallback={null}>
          {isVisible && <CodeEvolution />}
        </Suspense>
      </div>

      {/* Layer 3: Knowledge Graph */}
      <div className="animation-layer graph-layer">
        <Suspense fallback={null}>
          {isVisible && <KnowledgeGraph />}
        </Suspense>
      </div>

      {/* Layer 4: Workflow Particles */}
      <div className="animation-layer workflow-layer">
        <Suspense fallback={null}>
          {isVisible && <WorkflowParticles />}
        </Suspense>
      </div>

      {/* Gradient overlay for depth */}
      <div className="animation-gradient-overlay" />
    </motion.div>
  );
}