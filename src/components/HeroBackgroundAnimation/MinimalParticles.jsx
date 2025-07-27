import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Minimal particle system inspired by 2025 enterprise trends
export default function MinimalParticles() {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [particles] = useState(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      baseVelocity: {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
      },
    }))
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse tracking with debouncing
    let mouseTimeout;
    const handleMouseMove = (e) => {
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        const rect = container.getBoundingClientRect();
        mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
      }, 50); // Debounce for performance
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Animation loop using requestAnimationFrame
    const animate = () => {
      const particleElements = container.querySelectorAll('.minimal-particle');
      
      particleElements.forEach((element, index) => {
        const particle = particles[index];
        if (!particle) return;

        // Get current position
        const currentX = parseFloat(element.dataset.x) || particle.x;
        const currentY = parseFloat(element.dataset.y) || particle.y;

        // Calculate mouse influence (subtle)
        const mouseInfluence = 0.0001;
        const dx = (mouseRef.current.x * 100 - currentX) * mouseInfluence;
        const dy = (mouseRef.current.y * 100 - currentY) * mouseInfluence;

        // Update position
        let newX = currentX + particle.baseVelocity.x + dx;
        let newY = currentY + particle.baseVelocity.y + dy;

        // Wrap around edges
        if (newX < -5) newX = 105;
        if (newX > 105) newX = -5;
        if (newY < -5) newY = 105;
        if (newY > 105) newY = -5;

        // Update element
        element.style.transform = `translate(${newX}vw, ${newY}vh)`;
        element.dataset.x = newX;
        element.dataset.y = newY;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(mouseTimeout);
    };
  }, [particles]);

  return (
    <div ref={containerRef} className="minimal-particles-container">
      {/* Gradient mesh background - static for performance */}
      <div className="particles-gradient-mesh" />
      
      {/* Minimal particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="minimal-particle"
          data-x={particle.x}
          data-y={particle.y}
          style={{
            width: particle.size,
            height: particle.size,
            transform: `translate(${particle.x}vw, ${particle.y}vh)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ 
            duration: 1.5, 
            delay: particle.id * 0.1,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Single connection line that follows mouse */}
      <svg className="particles-connections">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
            <stop offset="50%" stopColor="rgba(16, 185, 129, 0.2)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}