import { useEffect, useRef, useState } from 'react';
import { Code2, FileText, MessageSquare, GitBranch, Hash, Table, FolderTree } from 'lucide-react';

// Particle types configuration
const PARTICLE_TYPES = [
  { type: 'code', icon: Code2, color: '#3b82f6', size: 1, weight: 1.2 },
  { type: 'text', icon: FileText, color: '#ffffff', size: 0.9, weight: 1 },
  { type: 'ai', icon: MessageSquare, color: '#8b5cf6', size: 1.1, weight: 1.3 },
  { type: 'version', icon: GitBranch, color: '#f59e0b', size: 0.8, weight: 0.9 },
  { type: 'tag', icon: Hash, color: '#10b981', size: 0.7, weight: 0.8 },
  { type: 'table', icon: Table, color: '#06b6d4', size: 1, weight: 1.1 },
  { type: 'folder', icon: FolderTree, color: '#6b7280', size: 0.9, weight: 1 }
];

export default function QuantumDocumentationField() {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const gsapContextRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [particleCount, setParticleCount] = useState(50);

  useEffect(() => {
    // Detect device capabilities
    const isMobile = window.innerWidth < 768;
    const isLowEnd = !window.matchMedia('(hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsVisible(false);
      return;
    }

    // Adjust particle count based on device
    if (isMobile || isLowEnd) {
      setParticleCount(20);
    } else if (window.innerWidth < 1024) {
      setParticleCount(35);
    }

    // Initialize GSAP context
    const gsap = window.gsap;
    if (!gsap) {
      console.error('GSAP not loaded');
      return;
    }

    gsapContextRef.current = gsap.context(() => {
      const container = containerRef.current;
      if (!container) return;

      // Create particles
      particlesRef.current = [];
      const bounds = container.getBoundingClientRect();

      for (let i = 0; i < particleCount; i++) {
        const particleType = PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)];
        const particle = createParticle(particleType, bounds, i);
        container.appendChild(particle.element);
        particlesRef.current.push(particle);

        // Initial animation
        gsap.set(particle.element, {
          x: particle.x,
          y: particle.y,
          scale: 0,
          opacity: 0
        });

        gsap.to(particle.element, {
          scale: particle.baseScale,
          opacity: particle.opacity,
          duration: 1,
          delay: i * 0.02,
          ease: "back.out(1.7)"
        });

        // Floating animation
        animateParticle(particle, gsap);
      }

      // Mouse tracking
      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      };

      const handleMouseLeave = () => {
        mouseRef.current = { x: bounds.width / 2, y: bounds.height / 2 };
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      // Helper functions defined inside context
      const createRipple = (particle) => {
        const ripple = document.createElement('div');
        ripple.className = 'quantum-ripple';
        ripple.style.left = particle.x + 'px';
        ripple.style.top = particle.y + 'px';
        ripple.style.setProperty('--ripple-color', particle.color);
        
        container.appendChild(ripple);
        
        gsap.fromTo(ripple, 
          {
            scale: 0,
            opacity: 0.8
          },
          {
            scale: 3,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            onComplete: () => ripple.remove()
          }
        );
      };

      const createMergeEffect = (particle1, particle2) => {
        const midX = (particle1.x + particle2.x) / 2;
        const midY = (particle1.y + particle2.y) / 2;
        
        const merge = document.createElement('div');
        merge.className = 'quantum-merge';
        merge.style.left = midX + 'px';
        merge.style.top = midY + 'px';
        merge.style.setProperty('--merge-color', particle1.color);
        
        container.appendChild(merge);
        
        gsap.timeline()
          .to(merge, {
            scale: 2,
            duration: 0.5,
            ease: "back.out(1.7)"
          })
          .to(merge, {
            scale: 0,
            opacity: 0,
            duration: 0.3,
            onComplete: () => merge.remove()
          });
        
        // Temporary merge state
        particle1.merging = true;
        particle2.merging = true;
        setTimeout(() => {
          particle1.merging = false;
          particle2.merging = false;
        }, 1000);
      };

      const checkCollisions = (particle) => {
        particlesRef.current.forEach(other => {
          if (other === particle) return;
          
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (particle.size + other.size) * 40;
          
          if (distance < minDistance && !particle.merging) {
            // Collision detected
            const angle = Math.atan2(dy, dx);
            const force = (minDistance - distance) / minDistance;
            
            // Bounce apart
            particle.vx -= Math.cos(angle) * force * 2;
            particle.vy -= Math.sin(angle) * force * 2;
            other.vx += Math.cos(angle) * force * 2;
            other.vy += Math.sin(angle) * force * 2;
            
            // Merge effect for same types
            if (particle.type === other.type && Math.random() > 0.98) {
              createMergeEffect(particle, other);
            }
          }
        });
      };

      const updateParticle = (particle) => {
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Attraction/repulsion based on distance
        if (distance < particle.attractionRadius) {
          const force = 1 - (distance / particle.attractionRadius);
          const angle = Math.atan2(dy, dx);
          
          if (distance < particle.repulsionForce) {
            // Repulsion
            particle.vx -= Math.cos(angle) * force * 2;
            particle.vy -= Math.sin(angle) * force * 2;
            
            // Show metadata on close proximity
            gsap.to(particle.element.querySelector('.quantum-particle__metadata'), {
              opacity: 1,
              scale: 1,
              duration: 0.3
            });
            
            // Create ripple effect
            if (!particle.rippling && Math.random() > 0.95) {
              createRipple(particle);
              particle.rippling = true;
              setTimeout(() => particle.rippling = false, 1000);
            }
          } else {
            // Attraction
            particle.vx += Math.cos(angle) * force * 0.5;
            particle.vy += Math.sin(angle) * force * 0.5;
          }
          
          // Scale based on proximity
          const targetScale = particle.baseScale * (1 + force * 0.3);
          gsap.to(particle.element, {
            scale: targetScale,
            duration: 0.3
          });
        } else {
          // Hide metadata when far
          gsap.to(particle.element.querySelector('.quantum-particle__metadata'), {
            opacity: 0,
            scale: 0.8,
            duration: 0.3
          });
          
          // Return to base scale
          gsap.to(particle.element, {
            scale: particle.baseScale,
            duration: 0.5
          });
        }
        
        // Apply floating offset
        const floatX = particle.floatOffsetX || 0;
        const floatY = particle.floatOffsetY || 0;
        
        // Update position with physics
        particle.vx *= 0.95; // Friction
        particle.vy *= 0.95;
        
        particle.x += particle.vx + floatX * 0.1;
        particle.y += particle.vy + floatY * 0.1;
        
        // Boundary collision
        if (particle.x < 50) {
          particle.x = 50;
          particle.vx = Math.abs(particle.vx);
        } else if (particle.x > bounds.width - 50) {
          particle.x = bounds.width - 50;
          particle.vx = -Math.abs(particle.vx);
        }
        
        if (particle.y < 50) {
          particle.y = 50;
          particle.vy = Math.abs(particle.vy);
        } else if (particle.y > bounds.height - 50) {
          particle.y = bounds.height - 50;
          particle.vy = -Math.abs(particle.vy);
        }
        
        // Apply transform
        gsap.set(particle.element, {
          x: particle.x,
          y: particle.y
        });
        
        // Check for collisions
        checkCollisions(particle);
      };

      // Animation loop
      const animate = () => {
        particlesRef.current.forEach((particle) => {
          updateParticle(particle);
        });
        rafRef.current = requestAnimationFrame(animate);
      };

      animate();

      // Cleanup
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }, containerRef);

    // Intersection Observer
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (gsapContextRef.current) {
        gsapContextRef.current.revert();
      }
    };
  }, [particleCount]);

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef} 
      className="quantum-field-container"
      aria-hidden="true"
    />
  );
}

// Helper function for particle creation
function createParticle(type, bounds, index) {
  const element = document.createElement('div');
  element.className = `quantum-particle quantum-particle--${type.type}`;
  
  // Create inner elements
  const glow = document.createElement('div');
  glow.className = 'quantum-particle__glow';
  
  const core = document.createElement('div');
  core.className = 'quantum-particle__core';
  
  const icon = document.createElement('div');
  icon.className = 'quantum-particle__icon';
  
  const metadata = document.createElement('div');
  metadata.className = 'quantum-particle__metadata';
  metadata.innerHTML = `<span>${type.type}</span>`;
  
  // Append elements
  element.appendChild(glow);
  element.appendChild(core);
  element.appendChild(icon);
  element.appendChild(metadata);
  
  // Set custom properties
  element.style.setProperty('--particle-color', type.color);
  element.style.setProperty('--particle-size', `${type.size * 60}px`);
  
  // Initial position
  const x = Math.random() * bounds.width;
  const y = Math.random() * bounds.height;
  
  return {
    element,
    x,
    y,
    vx: 0,
    vy: 0,
    type: type.type,
    color: type.color,
    size: type.size,
    weight: type.weight,
    baseScale: type.size,
    scale: type.size,
    opacity: 0.6 + Math.random() * 0.3,
    attractionRadius: 150 + Math.random() * 100,
    repulsionForce: 50 + Math.random() * 50,
    floatSpeed: 0.5 + Math.random() * 0.5,
    floatAmount: 20 + Math.random() * 20,
    phase: Math.random() * Math.PI * 2
  };
}

function animateParticle(particle, gsap) {
  // Organic floating motion
  gsap.to(particle, {
    phase: particle.phase + Math.PI * 2,
    duration: 10 + Math.random() * 10,
    repeat: -1,
    ease: "none",
    onUpdate: function() {
      const floatX = Math.sin(particle.phase) * particle.floatAmount;
      const floatY = Math.cos(particle.phase * 0.7) * particle.floatAmount;
      particle.floatOffsetX = floatX;
      particle.floatOffsetY = floatY;
    }
  });
}