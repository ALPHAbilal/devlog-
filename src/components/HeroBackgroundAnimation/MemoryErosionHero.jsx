import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const MemoryErosionHero = () => {
  const containerRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
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
    
    // Create fragment elements
    memoryFragments.forEach((fragment, index) => {
      const fragmentEl = document.createElement('div');
      fragmentEl.className = `memory-fragment memory-fragment-${fragment.type}`;
      fragmentEl.setAttribute('data-importance', fragment.importance);
      
      // Create content with code styling
      const content = document.createElement('pre');
      content.textContent = fragment.content;
      fragmentEl.appendChild(content);
      
      // Position fragments
      fragmentEl.style.position = 'absolute';
      fragmentEl.style.left = `${fragment.position.x}%`;
      fragmentEl.style.top = `${fragment.position.y}%`;
      fragmentEl.style.transform = 'translate(-50%, -50%)';
      
      container.appendChild(fragmentEl);
      fragments.push({
        element: fragmentEl,
        originalAge: fragment.age,
        currentAge: fragment.age,
        importance: fragment.importance,
        position: fragment.position,
        timeline: null
      });
    });

    // Create erosion timelines
    fragments.forEach((fragment, index) => {
      const erosionLevel = fragment.originalAge / 100;
      
      // Initial erosion state
      gsap.set(fragment.element, {
        opacity: Math.max(0.2, 1 - erosionLevel * 0.8),
        filter: `blur(${erosionLevel * 3}px) grayscale(${erosionLevel * 100}%)`,
        scale: 1 - erosionLevel * 0.1
      });

      // Subtle floating animation
      const floatTimeline = gsap.timeline({ repeat: -1 });
      floatTimeline
        .to(fragment.element, {
          y: `+=10`,
          x: `+=5`,
          duration: 3 + index,
          ease: "sine.inOut"
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
          } else {
            fragment.element.classList.remove('restoring');
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
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    animate();
    setIsInitialized(true);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      fragments.forEach(fragment => {
        if (fragment.timeline) fragment.timeline.kill();
        if (fragment.element) fragment.element.remove();
      });
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
        zIndex: 1
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
        
        .memory-fragment {
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
        
        .memory-fragment pre {
          margin: 0;
          font-size: inherit;
          font-family: inherit;
          color: inherit;
        }
        
        .memory-fragment-code {
          border-color: var(--code-color);
        }
        
        .memory-fragment-error {
          border-color: var(--error-color);
        }
        
        .memory-fragment-chat {
          border-color: var(--chat-color);
        }
        
        .memory-fragment-stackoverflow {
          border-color: var(--stackoverflow-color);
        }
        
        .memory-fragment-terminal {
          border-color: var(--terminal-color);
        }
        
        .memory-fragment-algorithm {
          border-color: var(--algorithm-color);
        }
        
        .memory-fragment.restoring {
          border-color: var(--restoration-color);
          box-shadow: 
            0 0 20px rgba(0, 255, 136, 0.3),
            inset 0 0 20px rgba(0, 255, 136, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        @media (max-width: 768px) {
          .memory-fragment {
            font-size: 0.75rem;
            padding: 0.5rem 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MemoryErosionHero;