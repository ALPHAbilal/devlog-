import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import '../../styles/MemoryErosion.css';

const MemoryErosion = () => {
  const containerRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sample memory fragments
  const memoryFragments = [
    {
      type: 'code',
      content: `const solution = async () => {
  const data = await fetch('/api/data');
  return data.json();
}`,
      age: 30, // days old
      language: 'javascript'
    },
    {
      type: 'error',
      content: `TypeError: Cannot read property 'map' of undefined
  at Array.map (<anonymous>)
  at processData (index.js:42:15)`,
      age: 45,
      language: 'error'
    },
    {
      type: 'chat',
      content: 'To fix this issue, you need to check if the array exists before mapping over it. Use optional chaining: data?.map()',
      age: 60,
      language: 'ai'
    },
    {
      type: 'stackoverflow',
      content: 'The solution is to use Promise.all() for parallel async operations. This reduces execution time significantly.',
      votes: 142,
      age: 90,
      language: 'solution'
    },
    {
      type: 'terminal',
      content: `$ npm install gsap@latest
✓ Installed 1 package
✓ Audited 245 packages`,
      age: 15,
      language: 'bash'
    },
    {
      type: 'docs',
      content: 'The useEffect hook accepts a function that contains imperative, possibly effectful code.',
      age: 120,
      language: 'documentation'
    }
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const fragments = [];

    // Create memory fragment elements
    memoryFragments.forEach((memory, index) => {
      const fragment = document.createElement('div');
      fragment.className = `memory-fragment ${memory.type}`;
      fragment.innerHTML = createFragmentHTML(memory);
      
      // Random positioning
      const x = Math.random() * (window.innerWidth - 300);
      const y = Math.random() * (window.innerHeight - 200);
      const z = Math.random() * 1000 - 500;
      
      gsap.set(fragment, {
        x,
        y,
        z,
        rotationX: Math.random() * 30 - 15,
        rotationY: Math.random() * 30 - 15,
        transformPerspective: 1000,
        transformStyle: 'preserve-3d'
      });

      container.appendChild(fragment);
      
      // Store fragment data with performance optimizations
      fragments.push({
        element: fragment,
        originalContent: memory.content,
        memory,
        timeline: createErosionTimeline(fragment, memory),
        position: { x, y, z },
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5
        },
        // Performance: Cache for getBoundingClientRect
        cachedRect: null,
        lastRectUpdate: 0
      });
    });

    // Mouse tracking
    const handleMouseMove = (e) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Performance optimization: Track frame timing
    let lastFrameTime = 0;
    const targetFPS = 30; // Limit to 30 FPS for better performance
    const frameInterval = 1000 / targetFPS;

    // Animation loop with frame limiting
    const animate = (currentTime) => {
      // Skip frame if too soon
      if (currentTime - lastFrameTime < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime;
      
      fragments.forEach(fragment => {
        updateFragment(fragment, cursorRef.current);
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate(0);
    setIsInitialized(true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      fragments.forEach(f => f.timeline.kill());
    };
  }, []);

  const createFragmentHTML = (memory) => {
    switch (memory.type) {
      case 'code':
        return `
          <pre class="code-block">
            <code class="language-${memory.language}">${memory.content}</code>
          </pre>
          <div class="erosion-overlay"></div>
        `;
      
      case 'error':
        return `
          <div class="error-block">
            <span class="error-icon">⚠️</span>
            <pre>${memory.content}</pre>
          </div>
          <div class="erosion-overlay"></div>
        `;
      
      case 'chat':
        return `
          <div class="chat-bubble">
            <div class="ai-avatar">🤖</div>
            <p>${memory.content}</p>
          </div>
          <div class="erosion-overlay"></div>
        `;
      
      case 'stackoverflow':
        return `
          <div class="stackoverflow-block">
            <div class="vote-count">
              <span class="arrow">▲</span>
              <span class="votes">${memory.votes}</span>
            </div>
            <p>${memory.content}</p>
          </div>
          <div class="erosion-overlay"></div>
        `;
      
      case 'terminal':
        return `
          <div class="terminal-block">
            <div class="terminal-header">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <pre>${memory.content}</pre>
          </div>
          <div class="erosion-overlay"></div>
        `;
      
      case 'docs':
        return `
          <div class="docs-block">
            <div class="docs-icon">📖</div>
            <p>${memory.content}</p>
          </div>
          <div class="erosion-overlay"></div>
        `;
      
      default:
        return `<p>${memory.content}</p>`;
    }
  };

  const createErosionTimeline = (element, memory) => {
    const tl = gsap.timeline({ paused: true });
    const erosionLevel = Math.min(memory.age / 100, 1); // Max erosion at 100 days
    
    // Get text elements
    const textElements = element.querySelectorAll('p, pre, code, span:not(.dot)');
    const overlay = element.querySelector('.erosion-overlay');
    
    // Initial erosion state based on age
    tl.to(element, {
      filter: `blur(${erosionLevel * 8}px) grayscale(${erosionLevel * 100}%)`,
      opacity: 1 - (erosionLevel * 0.5),
      duration: 0
    });

    // Add noise and fragmentation
    if (overlay) {
      tl.to(overlay, {
        opacity: erosionLevel * 0.8,
        duration: 0
      }, 0);
    }

    // Character erosion for old memories
    if (erosionLevel > 0.3) {
      textElements.forEach(textEl => {
        const originalText = textEl.textContent;
        const erodedText = erodeText(originalText, erosionLevel);
        textEl.textContent = erodedText;
        textEl.setAttribute('data-original', originalText);
      });
    }

    // Floating animation
    tl.to(element, {
      y: '+=20',
      x: '+=10',
      rotation: '+=5',
      duration: 4 + Math.random() * 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    }, 0);

    tl.play();
    return tl;
  };

  const erodeText = (text, erosionLevel) => {
    const chars = text.split('');
    const erodeChance = erosionLevel * 0.4;
    
    return chars.map(char => {
      if (char === ' ' || char === '\n') return char;
      return Math.random() < erodeChance ? '░' : char;
    }).join('');
  };

  const updateFragment = (fragment, cursor) => {
    // Cache bounding rect to avoid expensive reflow
    if (!fragment.cachedRect || Date.now() - fragment.lastRectUpdate > 1000) {
      fragment.cachedRect = fragment.element.getBoundingClientRect();
      fragment.lastRectUpdate = Date.now();
    }
    
    const rect = fragment.cachedRect;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(cursor.x - centerX, 2) + 
      Math.pow(cursor.y - centerY, 2)
    );
    
    const restorationRadius = 150;
    const restoration = Math.max(0, 1 - (distance / restorationRadius));
    
    if (restoration > 0) {
      restoreFragment(fragment, restoration);
    } else {
      // Continue erosion
      const erosionLevel = Math.min(fragment.memory.age / 100, 1);
      gsap.to(fragment.element, {
        filter: `blur(${erosionLevel * 8 * (1 - restoration)}px) grayscale(${erosionLevel * 100 * (1 - restoration)}%)`,
        opacity: 1 - (erosionLevel * 0.5 * (1 - restoration)),
        duration: 0.5,
        ease: 'power2.out'
      });
    }

    // Gentle floating movement
    fragment.position.x += fragment.velocity.x;
    fragment.position.y += fragment.velocity.y;

    // Boundary check
    if (fragment.position.x < 0 || fragment.position.x > window.innerWidth - 300) {
      fragment.velocity.x *= -1;
    }
    if (fragment.position.y < 0 || fragment.position.y > window.innerHeight - 200) {
      fragment.velocity.y *= -1;
    }
  };

  const restoreFragment = (fragment, restoration) => {
    const element = fragment.element;
    
    // Restore visual properties
    gsap.to(element, {
      filter: `blur(${8 * (1 - restoration)}px) grayscale(${100 * (1 - restoration)}%)`,
      opacity: 0.5 + (0.5 * restoration),
      scale: 1 + (restoration * 0.05),
      duration: 0.3,
      ease: 'power2.out'
    });

    // Restore text
    const textElements = element.querySelectorAll('[data-original]');
    textElements.forEach(textEl => {
      const original = textEl.getAttribute('data-original');
      const current = textEl.textContent;
      
      if (restoration > 0.5 && current !== original) {
        // Typewriter restoration effect
        const chars = original.split('');
        const currentChars = current.split('');
        
        chars.forEach((char, i) => {
          if (currentChars[i] === '░' && Math.random() < restoration) {
            currentChars[i] = char;
          }
        });
        
        textEl.textContent = currentChars.join('');
      }
    });

    // Add glow effect
    if (restoration > 0.8) {
      element.classList.add('restored');
      
      // Crystallization effect at full restoration
      if (restoration > 0.95 && !element.classList.contains('crystallized')) {
        crystallizeFragment(element);
      }
    } else {
      element.classList.remove('restored');
    }
  };

  const crystallizeFragment = (element) => {
    element.classList.add('crystallizing');
    
    gsap.to(element, {
      scale: 1.1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
      onComplete: () => {
        element.classList.add('crystallized');
        element.classList.remove('crystallizing');
        
        // Add to permanent memory
        gsap.to(element, {
          borderColor: '#00ff88',
          boxShadow: '0 0 30px rgba(0, 255, 136, 0.5)',
          duration: 1,
          ease: 'power2.inOut'
        });
      }
    });
  };

  return (
    <div className="memory-erosion-container" ref={containerRef}>
      <div className="erosion-instructions">
        <h1 className="erosion-title">Memory Erosion</h1>
        <p className="erosion-subtitle">Watch your solutions fade away... hover to remember</p>
      </div>
      
      <div className="restoration-field" style={{
        '--cursor-x': `${cursorRef.current.x}px`,
        '--cursor-y': `${cursorRef.current.y}px`
      }}></div>
    </div>
  );
};

export default MemoryErosion;