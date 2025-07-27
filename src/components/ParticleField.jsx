import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ParticleField({ count = 50 }) {
  const containerRef = useRef(null);
  
  // Generate particles with random properties
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 20,
    opacity: Math.random() * 0.5 + 0.3,
  }));

  return (
    <div ref={containerRef} className="hero-particle-field">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="hero-particle"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -window.innerHeight * 2],
            x: [0, Math.sin(particle.id) * 100],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}