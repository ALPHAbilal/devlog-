import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

// Ghost Manager Class for handling ghost trail system
class GhostManager {
  constructor(container) {
    this.container = container;
    this.ghostPool = [];
    this.activeGhosts = new Map();
    this.maxGhostsPerFragment = 5;
    
    // Register GSAP effects
    this.registerEffects();
  }

  registerEffects() {
    // Ghost trail creation effect
    gsap.registerEffect({
      name: "ghostTrail",
      effect: (targets, config) => {
        const tl = gsap.timeline();
        targets.forEach((target, i) => {
          const ghostIndex = parseInt(target.dataset.ghostIndex);
          const baseOpacity = 0.4 - (ghostIndex * 0.075);
          const baseBlur = 2 + (ghostIndex * 2);
          const baseScale = 1 - (ghostIndex * 0.05);
          
          tl.fromTo(target, 
            {
              opacity: 0,
              scale: baseScale * 1.2,
              filter: `blur(${baseBlur}px) grayscale(${20 + ghostIndex * 20}%)`,
            },
            {
              opacity: baseOpacity,
              scale: baseScale,
              filter: `blur(${baseBlur}px) grayscale(${20 + ghostIndex * 20}%)`,
              duration: config.duration,
              ease: config.ease,
            }, 
            i * config.stagger
          );
        });
        return tl;
      },
      defaults: { duration: 0.3, stagger: 0.05, ease: "power2.out" }
    });

    // Chromatic aberration effect
    gsap.registerEffect({
      name: "chromaticAberration",
      effect: (targets, config) => {
        return gsap.to(targets, {
          duration: config.duration,
          ease: config.ease,
          onUpdate: function() {
            const progress = this.progress();
            const offset = config.intensity * progress;
            targets.forEach(target => {
              target.style.textShadow = `
                ${offset}px 0 0 rgba(255,0,0,0.5),
                ${-offset}px 0 0 rgba(0,255,255,0.5)
              `;
            });
          }
        });
      },
      defaults: { duration: 0.5, intensity: 2, ease: "none" }
    });

    // Ghost convergence effect
    gsap.registerEffect({
      name: "ghostConverge",
      effect: (targets, config) => {
        const tl = gsap.timeline({
          onComplete: config.onComplete
        });
        
        targets.forEach((target, i) => {
          const startX = gsap.getProperty(target, "x");
          const startY = gsap.getProperty(target, "y");
          
          // Create bezier path for smooth convergence
          const path = {
            curviness: 1.5,
            values: [
              { x: startX, y: startY },
              { x: startX * 0.5, y: startY * 0.5 + 20 },
              { x: 0, y: 0 }
            ]
          };
          
          tl.to(target, {
            motionPath: path,
            opacity: 0,
            scale: 0.5,
            filter: "blur(10px)",
            duration: config.duration,
            ease: "power2.inOut"
          }, i * 0.05);
        });
        
        return tl;
      },
      defaults: { duration: 1, onComplete: null }
    });
  }

  getGhostFromPool() {
    if (this.ghostPool.length > 0) {
      return this.ghostPool.pop();
    }
    
    const ghost = document.createElement('div');
    ghost.className = 'memory-ghost';
    ghost.style.position = 'absolute';
    ghost.style.pointerEvents = 'none';
    ghost.style.willChange = 'transform, opacity, filter';
    
    const content = document.createElement('pre');
    ghost.appendChild(content);
    
    return ghost;
  }

  returnToPool(ghost) {
    ghost.style.opacity = '0';
    ghost.style.transform = '';
    ghost.style.filter = '';
    ghost.style.textShadow = '';
    if (ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
    this.ghostPool.push(ghost);
  }

  createGhostTrail(fragment, fragmentEl) {
    const fragmentId = fragmentEl.dataset.fragmentId;
    const existingGhosts = this.activeGhosts.get(fragmentId) || [];
    
    // Clean up excess ghosts
    while (existingGhosts.length >= this.maxGhostsPerFragment) {
      const oldGhost = existingGhosts.shift();
      this.returnToPool(oldGhost.element);
    }
    
    // Create new ghost
    const ghost = this.getGhostFromPool();
    ghost.querySelector('pre').textContent = fragmentEl.querySelector('pre').textContent;
    ghost.className = `memory-ghost ${fragmentEl.className}`;
    ghost.dataset.ghostIndex = existingGhosts.length;
    ghost.dataset.parentId = fragmentId;
    
    // Copy current position and styles
    const rect = fragmentEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    ghost.style.left = `${rect.left - containerRect.left}px`;
    ghost.style.top = `${rect.top - containerRect.top}px`;
    ghost.style.width = `${rect.width}px`;
    
    this.container.appendChild(ghost);
    
    // Add to active ghosts
    const ghostData = {
      element: ghost,
      timeline: null,
      parentFragment: fragmentEl
    };
    existingGhosts.push(ghostData);
    this.activeGhosts.set(fragmentId, existingGhosts);
    
    // Apply ghost trail effect
    gsap.effects.ghostTrail([ghost]);
    gsap.effects.chromaticAberration([ghost], { intensity: 1 + existingGhosts.length * 0.5 });
    
    // Position offset for trail effect
    gsap.set(ghost, {
      x: `-=${existingGhosts.length * 10}`,
      y: `-=${existingGhosts.length * 5}`,
      transform3d: "translate3d(0,0,0)" // Force GPU acceleration
    });
    
    return ghostData;
  }

  convergeGhosts(fragmentId, callback) {
    const ghosts = this.activeGhosts.get(fragmentId);
    if (!ghosts || ghosts.length === 0) {
      if (callback) callback();
      return;
    }
    
    const ghostElements = ghosts.map(g => g.element);
    
    gsap.effects.ghostConverge(ghostElements, {
      duration: 1,
      onComplete: () => {
        ghosts.forEach(ghost => this.returnToPool(ghost.element));
        this.activeGhosts.delete(fragmentId);
        
        // Particle burst effect
        this.createParticleBurst(ghosts[0].parentFragment);
        
        if (callback) callback();
      }
    });
  }

  createParticleBurst(fragmentEl) {
    const rect = fragmentEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - containerRect.left;
    const y = rect.top + rect.height / 2 - containerRect.top;
    
    const particleCount = 12;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'convergence-particle';
      particle.style.position = 'absolute';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.width = '4px';
      particle.style.height = '4px';
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = getComputedStyle(fragmentEl).borderColor;
      particle.style.pointerEvents = 'none';
      
      this.container.appendChild(particle);
      particles.push(particle);
    }
    
    // Animate particles
    particles.forEach((particle, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      
      gsap.to(particle, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0,
        duration: 0.6 + Math.random() * 0.3,
        ease: "power2.out",
        onComplete: () => particle.remove()
      });
    });
  }

  updateGhostVisibility(viewportRect) {
    // Visibility culling for performance
    this.activeGhosts.forEach((ghosts) => {
      ghosts.forEach(ghost => {
        const rect = ghost.element.getBoundingClientRect();
        const isVisible = (
          rect.bottom >= viewportRect.top &&
          rect.top <= viewportRect.bottom &&
          rect.right >= viewportRect.left &&
          rect.left <= viewportRect.right
        );
        
        ghost.element.style.display = isVisible ? 'block' : 'none';
      });
    });
  }

  cleanup() {
    this.activeGhosts.forEach((ghosts) => {
      ghosts.forEach(ghost => {
        if (ghost.timeline) ghost.timeline.kill();
        this.returnToPool(ghost.element);
      });
    });
    this.activeGhosts.clear();
    
    this.ghostPool.forEach(ghost => {
      if (ghost.parentNode) ghost.remove();
    });
    this.ghostPool = [];
  }
}

const MemoryErosionHero = () => {
  const containerRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const ghostManagerRef = useRef(null);
  const fragmentsRef = useRef([]);
  const lastGhostTimeRef = useRef({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Optimized memory fragments for hero background
  const memoryFragments = [
    {
      type: 'code',
      content: 'const solution = await findAnswer();',
      position: { x: 10, y: 15 },
      age: 30,
      importance: 0.8
    },
    {
      type: 'error',
      content: 'TypeError: Cannot read property...',
      position: { x: 75, y: 20 },
      age: 50,
      importance: 0.7
    },
    {
      type: 'chat',
      content: 'ChatGPT: "Try using async/await..."',
      position: { x: 15, y: 70 },
      age: 40,
      importance: 0.9
    },
    {
      type: 'stackoverflow',
      content: '// Solution from 2019 still works!',
      position: { x: 80, y: 65 },
      age: 60,
      importance: 0.6
    },
    {
      type: 'terminal',
      content: '$ npm install --save-dev',
      position: { x: 45, y: 85 },
      age: 45,
      importance: 0.7
    },
    {
      type: 'algorithm',
      content: 'function quickSort(arr) { ... }',
      position: { x: 30, y: 40 },
      age: 35,
      importance: 0.8
    }
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const fragments = [];
    ghostManagerRef.current = new GhostManager(container);
    
    // Create fragment elements
    memoryFragments.forEach((fragment, index) => {
      const fragmentEl = document.createElement('div');
      fragmentEl.className = `memory-fragment memory-fragment-${fragment.type}`;
      fragmentEl.setAttribute('data-importance', fragment.importance);
      fragmentEl.setAttribute('data-fragment-id', `fragment-${index}`);
      
      // Create content with code styling
      const content = document.createElement('pre');
      content.textContent = fragment.content;
      fragmentEl.appendChild(content);
      
      // Position fragments
      fragmentEl.style.position = 'absolute';
      fragmentEl.style.left = `${fragment.position.x}%`;
      fragmentEl.style.top = `${fragment.position.y}%`;
      fragmentEl.style.transform = 'translate(-50%, -50%)';
      fragmentEl.style.willChange = 'transform, opacity, filter';
      
      container.appendChild(fragmentEl);
      fragments.push({
        element: fragmentEl,
        originalAge: fragment.age,
        currentAge: fragment.age,
        importance: fragment.importance,
        position: fragment.position,
        timeline: null,
        isRestoring: false,
        lastPosition: { x: 0, y: 0 }
      });
    });

    fragmentsRef.current = fragments;

    // Create erosion timelines
    fragments.forEach((fragment, index) => {
      const erosionLevel = fragment.originalAge / 100;
      
      // Initial erosion state
      gsap.set(fragment.element, {
        opacity: Math.max(0.2, 1 - erosionLevel * 0.8),
        filter: `blur(${erosionLevel * 3}px) grayscale(${erosionLevel * 100}%)`,
        scale: 1 - erosionLevel * 0.1,
        transform3d: "translate3d(0,0,0)" // Force GPU acceleration
      });

      // Subtle floating animation
      const floatTimeline = gsap.timeline({ repeat: -1 });
      floatTimeline
        .to(fragment.element, {
          y: `+=10`,
          x: `+=5`,
          duration: 3 + index,
          ease: "sine.inOut",
          onUpdate: function() {
            // Create ghost trails during movement
            const fragmentId = fragment.element.dataset.fragmentId;
            const currentTime = Date.now();
            const lastTime = lastGhostTimeRef.current[fragmentId] || 0;
            
            if (currentTime - lastTime > 200) { // Create ghost every 200ms
              const rect = fragment.element.getBoundingClientRect();
              const dx = Math.abs(rect.left - fragment.lastPosition.x);
              const dy = Math.abs(rect.top - fragment.lastPosition.y);
              
              if (dx > 5 || dy > 5) { // Only create ghost if significant movement
                ghostManagerRef.current.createGhostTrail(fragment, fragment.element);
                lastGhostTimeRef.current[fragmentId] = currentTime;
                fragment.lastPosition = { x: rect.left, y: rect.top };
              }
            }
          }
        })
        .to(fragment.element, {
          y: `-=10`,
          x: `-=5`,
          duration: 3 + index,
          ease: "sine.inOut"
        });

      fragment.timeline = floatTimeline;
    });

    // Mouse interaction for restoration
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      cursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    // Visibility culling optimization
    let visibilityCheckTimer;
    const checkVisibility = () => {
      if (ghostManagerRef.current) {
        const viewportRect = container.getBoundingClientRect();
        ghostManagerRef.current.updateGhostVisibility(viewportRect);
      }
    };

    const handleScroll = () => {
      clearTimeout(visibilityCheckTimer);
      visibilityCheckTimer = setTimeout(checkVisibility, 100);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    const animate = () => {
      fragments.forEach(fragment => {
        const rect = fragment.element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const elementX = rect.left + rect.width / 2 - containerRect.left;
        const elementY = rect.top + rect.height / 2 - containerRect.top;
        
        const distance = Math.sqrt(
          Math.pow(cursorRef.current.x - elementX, 2) + 
          Math.pow(cursorRef.current.y - elementY, 2)
        );
        
        const restorationRadius = 200;
        const restoration = Math.max(0, 1 - distance / restorationRadius);
        
        if (restoration > 0) {
          const newAge = fragment.originalAge * (1 - restoration);
          const erosionLevel = newAge / 100;
          
          gsap.to(fragment.element, {
            opacity: Math.max(0.2, 1 - erosionLevel * 0.8),
            filter: `blur(${erosionLevel * 3}px) grayscale(${erosionLevel * 100}%)`,
            scale: 1 - erosionLevel * 0.1 + restoration * 0.1,
            duration: 0.3,
            ease: "power2.out"
          });

          // Add glow effect on strong restoration
          if (restoration > 0.7) {
            fragment.element.classList.add('restoring');
            
            // Trigger ghost convergence when fully restored
            if (restoration > 0.9 && !fragment.isRestoring) {
              fragment.isRestoring = true;
              const fragmentId = fragment.element.dataset.fragmentId;
              ghostManagerRef.current.convergeGhosts(fragmentId, () => {
                fragment.isRestoring = false;
              });
            }
          } else {
            fragment.element.classList.remove('restoring');
            fragment.isRestoring = false;
          }
        } else {
          // Return to eroded state
          const erosionLevel = fragment.originalAge / 100;
          gsap.to(fragment.element, {
            opacity: Math.max(0.2, 1 - erosionLevel * 0.8),
            filter: `blur(${erosionLevel * 3}px) grayscale(${erosionLevel * 100}%)`,
            scale: 1 - erosionLevel * 0.1,
            duration: 0.5,
            ease: "power2.out"
          });
          fragment.element.classList.remove('restoring');
          fragment.isRestoring = false;
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    animate();
    checkVisibility();
    setIsInitialized(true);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(visibilityCheckTimer);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      fragments.forEach(fragment => {
        if (fragment.timeline) fragment.timeline.kill();
        if (fragment.element) fragment.element.remove();
      });
      
      if (ghostManagerRef.current) {
        ghostManagerRef.current.cleanup();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="memory-erosion-hero"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden'
      }}
    >
      <style>{`
        .memory-erosion-hero {
          --restoration-color: #00ff88;
          --code-color: #4ade80;
          --error-color: #f87171;
          --chat-color: #818cf8;
          --stackoverflow-color: #fb923c;
          --terminal-color: #38bdf8;
          --algorithm-color: #c084fc;
        }
        
        .memory-fragment,
        .memory-ghost {
          position: absolute;
          padding: 0.75rem 1.25rem;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          white-space: nowrap;
          transition: all 0.3s ease;
          pointer-events: auto;
          transform-origin: center;
        }
        
        .memory-ghost {
          pointer-events: none;
          z-index: -1;
        }
        
        .memory-fragment pre,
        .memory-ghost pre {
          margin: 0;
          font-size: inherit;
          font-family: inherit;
          color: inherit;
        }
        
        .memory-fragment-code,
        .memory-ghost.memory-fragment-code {
          border-color: var(--code-color);
        }
        
        .memory-fragment-error,
        .memory-ghost.memory-fragment-error {
          border-color: var(--error-color);
        }
        
        .memory-fragment-chat,
        .memory-ghost.memory-fragment-chat {
          border-color: var(--chat-color);
        }
        
        .memory-fragment-stackoverflow,
        .memory-ghost.memory-fragment-stackoverflow {
          border-color: var(--stackoverflow-color);
        }
        
        .memory-fragment-terminal,
        .memory-ghost.memory-fragment-terminal {
          border-color: var(--terminal-color);
        }
        
        .memory-fragment-algorithm,
        .memory-ghost.memory-fragment-algorithm {
          border-color: var(--algorithm-color);
        }
        
        .memory-fragment.restoring {
          border-color: var(--restoration-color);
          box-shadow: 
            0 0 20px rgba(0, 255, 136, 0.3),
            inset 0 0 20px rgba(0, 255, 136, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .convergence-particle {
          box-shadow: 0 0 6px currentColor;
        }
        
        @media (max-width: 768px) {
          .memory-fragment,
          .memory-ghost {
            font-size: 0.75rem;
            padding: 0.5rem 0.875rem;
          }
        }
        
        /* Performance optimization */
        .memory-erosion-hero * {
          will-change: auto;
        }
        
        .memory-fragment,
        .memory-ghost {
          will-change: transform, opacity, filter;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default MemoryErosionHero;