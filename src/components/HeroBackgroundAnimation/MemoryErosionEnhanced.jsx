import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
// Note: Premium plugins removed for npm compatibility
import { performanceMonitor, OptimizationUtils, memoryManager } from './MemoryErosionPerformance';
import './MemoryErosion.css';

// Enhanced erosion patterns
const EROSION_PATTERNS = {
  digital: {
    chars: ['█', '▓', '▒', '░', '·', ' '],
    speed: 0.02
  },
  organic: {
    chars: ['◦', '○', '◌', '◯', '◉', ' '],
    speed: 0.015
  },
  glitch: {
    chars: ['⌷', '⍼', '⌾', '⍀', '⌿', ' '],
    speed: 0.025
  }
};

// Advanced fragment types with more detail
const ADVANCED_FRAGMENTS = [
  {
    type: 'react-hook',
    content: `const [state, setState] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    const result = await api.getData();
    setState(result);
  };
  fetchData();
}, []);`,
    age: 25,
    language: 'javascript',
    framework: 'react',
    importance: 0.9
  },
  {
    type: 'algorithm',
    content: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}`,
    age: 60,
    language: 'javascript',
    importance: 0.7
  },
  {
    type: 'debug-solution',
    content: `// FIX: Prevent memory leak in useEffect
return () => {
  isMounted = false;
  controller.abort();
  clearInterval(intervalId);
};`,
    age: 15,
    language: 'javascript',
    importance: 1.0
  },
  {
    type: 'sql-query',
    content: `SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id
HAVING order_count > 5;`,
    age: 45,
    language: 'sql',
    importance: 0.6
  },
  {
    type: 'config',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}`,
    age: 90,
    language: 'json',
    importance: 0.5
  },
  {
    type: 'regex',
    content: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/`,
    age: 120,
    language: 'regex',
    importance: 0.8
  }
];

const MemoryErosionEnhanced = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const particleSystemRef = useRef(null);
  const fragmentsRef = useRef([]);
  const [quality, setQuality] = useState('ultra');
  const [showPerformance, setShowPerformance] = useState(false);
  
  // Memoized cursor field gradient
  const cursorFieldGradient = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(150, 150, 0, 150, 150, 150);
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 300);
    
    return canvas;
  }, []);

  // Initialize particle system for disintegration effects
  const initParticleSystem = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particlePool = OptimizationUtils.createObjectPool(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      alpha: 1,
      color: '#00ff88',
      life: 100,
      active: false
    }), 1000);
    
    const createParticle = (x, y, color) => {
      const particle = particlePool.get();
      particle.x = x;
      particle.y = y;
      particle.vx = (Math.random() - 0.5) * 2;
      particle.vy = (Math.random() - 0.5) * 2 - 1;
      particle.size = Math.random() * 3 + 1;
      particle.alpha = 1;
      particle.color = color;
      particle.life = 100;
      particle.active = true;
      particles.push(particle);
    };
    
    const updateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p.active) continue;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha -= 0.01;
        p.life--;
        
        if (p.life <= 0 || p.alpha <= 0) {
          p.active = false;
          particlePool.release(p);
          particles.splice(i, 1);
          continue;
        }
        
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
    
    particleSystemRef.current = {
      create: createParticle,
      update: updateParticles,
      clear: () => {
        particles.forEach(p => particlePool.release(p));
        particles.length = 0;
      }
    };
  }, []);

  // Enhanced fragment creation with physics
  const createAdvancedFragment = useCallback((memory, index) => {
    const fragment = document.createElement('div');
    fragment.className = `memory-fragment ${memory.type}`;
    fragment.setAttribute('data-importance', memory.importance);
    
    // Create sophisticated HTML structure
    fragment.innerHTML = `
      <div class="fragment-inner">
        <div class="fragment-header">
          <span class="fragment-type">${memory.type}</span>
          <span class="fragment-age" title="${memory.age} days old">
            ${getAgeDisplay(memory.age)}
          </span>
        </div>
        <div class="fragment-content">
          <pre class="code-content language-${memory.language}">${memory.content}</pre>
        </div>
        <div class="erosion-overlay"></div>
        <div class="crystallization-layer"></div>
        <svg class="fragment-svg" width="100%" height="100%">
          <defs>
            <filter id="erosion-filter-${index}">
              <feTurbulence baseFrequency="0.02" numOctaves="3" />
              <feDisplacementMap in="SourceGraphic" scale="0" />
            </filter>
            <linearGradient id="crystal-gradient-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#00ff88;stop-opacity:0.2" />
              <stop offset="50%" style="stop-color:#00b4ff;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#ff00b4;stop-opacity:0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    `;
    
    // Advanced positioning with depth
    const goldenRatio = 1.618;
    const spiral = index * goldenRatio * Math.PI;
    const radius = Math.sqrt(index) * 50;
    
    const x = window.innerWidth / 2 + Math.cos(spiral) * radius;
    const y = window.innerHeight / 2 + Math.sin(spiral) * radius;
    const z = -index * 10;
    
    gsap.set(fragment, {
      x,
      y,
      z,
      rotationX: Math.random() * 20 - 10,
      rotationY: Math.random() * 20 - 10,
      transformPerspective: 1500,
      transformStyle: 'preserve-3d',
      scale: 1 - (index * 0.02)
    });
    
    return {
      element: fragment,
      memory,
      position: { x, y, z },
      velocity: {
        x: Math.cos(spiral) * 0.2,
        y: Math.sin(spiral) * 0.2,
        angular: (Math.random() - 0.5) * 0.5
      },
      physics: {
        mass: 1 + memory.importance,
        elasticity: 0.8,
        friction: 0.95
      },
      erosionState: {
        level: Math.min(memory.age / 100, 1),
        pattern: Object.values(EROSION_PATTERNS)[index % 3],
        timeline: null
      }
    };
  }, []);

  // Get age display
  const getAgeDisplay = (days) => {
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    if (days < 365) return `${Math.floor(days / 30)}m`;
    return `${Math.floor(days / 365)}y`;
  };

  // Advanced erosion with multiple effects
  const applyAdvancedErosion = useCallback((fragment) => {
    const { element, memory, erosionState } = fragment;
    const timeline = gsap.timeline({ paused: true });
    
    // SVG filter animation
    const filter = element.querySelector(`#erosion-filter-${fragmentsRef.current.indexOf(fragment)}`);
    if (filter) {
      timeline.to(filter.querySelector('feDisplacementMap'), {
        attr: { scale: erosionState.level * 20 },
        duration: 2,
        ease: 'power2.inOut'
      }, 0);
    }
    
    // Text erosion with pattern
    const codeContent = element.querySelector('.code-content');
    if (codeContent) {
      const originalText = codeContent.textContent;
      codeContent.setAttribute('data-original', originalText);
      
      timeline.to(codeContent, {
        scrambleText: {
          text: erodeTextWithPattern(originalText, erosionState.level, erosionState.pattern),
          chars: erosionState.pattern.chars.join(''),
          speed: erosionState.pattern.speed
        },
        duration: 3,
        ease: 'none'
      }, 0);
    }
    
    // Visual erosion
    timeline.to(element, {
      filter: `
        blur(${erosionState.level * 10}px) 
        contrast(${1 - erosionState.level * 0.5}) 
        grayscale(${erosionState.level * 100}%) 
        sepia(${erosionState.level * 50}%)
      `,
      opacity: Math.max(0.3, 1 - erosionState.level * 0.6),
      duration: 0
    }, 0);
    
    // Particle emission for heavy erosion
    if (erosionState.level > 0.7 && particleSystemRef.current) {
      timeline.add(() => {
        const rect = element.getBoundingClientRect();
        const particleCount = Math.floor(erosionState.level * 5);
        for (let i = 0; i < particleCount; i++) {
          particleSystemRef.current.create(
            rect.left + Math.random() * rect.width,
            rect.top + Math.random() * rect.height,
            getComputedStyle(element).color
          );
        }
      }, 'random');
    }
    
    erosionState.timeline = timeline;
    timeline.play();
    
    return timeline;
  }, []);

  // Pattern-based text erosion
  const erodeTextWithPattern = (text, level, pattern) => {
    const chars = text.split('');
    const patternChars = pattern.chars;
    
    return chars.map((char, i) => {
      if (char === '\n' || char === ' ') return char;
      
      const charErosion = level + (Math.sin(i * 0.1) * 0.1);
      const patternIndex = Math.floor(charErosion * patternChars.length);
      
      if (patternIndex >= patternChars.length - 1) {
        return patternChars[patternChars.length - 1];
      }
      
      return Math.random() < charErosion ? patternChars[patternIndex] : char;
    }).join('');
  };

  // Main initialization
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Initialize particle system
    initParticleSystem();
    
    // Create fragments
    ADVANCED_FRAGMENTS.forEach((memory, index) => {
      const fragmentData = createAdvancedFragment(memory, index);
      container.appendChild(fragmentData.element);
      fragmentsRef.current.push(fragmentData);
      
      // Apply initial erosion
      applyAdvancedErosion(fragmentData);
    });
    
    // Mouse tracking with smoothing
    let smoothX = 0, smoothY = 0;
    const handleMouseMove = (e) => {
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.2,
        ease: 'power2.out'
      });
    };
    
    // Advanced animation loop
    let animationFrame;
    const animate = () => {
      // Update performance
      const perfData = performanceMonitor.update();
      if (perfData.quality !== quality) {
        setQuality(perfData.quality);
      }
      
      // Update particles
      if (particleSystemRef.current) {
        particleSystemRef.current.update();
      }
      
      // Update fragments
      fragmentsRef.current.forEach((fragment, index) => {
        updateAdvancedFragment(fragment, cursorRef.current, index);
      });
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    // Start animation
    animate();
    
    // Show performance overlay in development
    if (process.env.NODE_ENV === 'development' && showPerformance) {
      performanceMonitor.createOverlay();
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
      
      fragmentsRef.current.forEach(f => {
        if (f.erosionState.timeline) {
          f.erosionState.timeline.kill();
        }
      });
      
      if (particleSystemRef.current) {
        particleSystemRef.current.clear();
      }
    };
  }, [initParticleSystem, createAdvancedFragment, applyAdvancedErosion, quality, showPerformance]);

  // Advanced fragment update with physics
  const updateAdvancedFragment = (fragment, cursor, index) => {
    const { element, position, velocity, physics, erosionState } = fragment;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate forces
    const dx = cursor.x - centerX;
    const dy = cursor.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Restoration field
    const restorationRadius = 200;
    const restoration = Math.max(0, 1 - (distance / restorationRadius));
    const restorationPower = Math.pow(restoration, 2);
    
    // Magnetic attraction when close
    if (restoration > 0) {
      const attraction = restorationPower * 0.1;
      velocity.x += (dx / distance) * attraction / physics.mass;
      velocity.y += (dy / distance) * attraction / physics.mass;
    }
    
    // Apply restoration effects
    if (restorationPower > 0) {
      restoreAdvancedFragment(fragment, restorationPower);
    }
    
    // Physics update
    position.x += velocity.x;
    position.y += velocity.y;
    velocity.x *= physics.friction;
    velocity.y *= physics.friction;
    velocity.angular *= 0.98;
    
    // Boundary collision with elasticity
    const bounds = {
      left: rect.width / 2,
      right: window.innerWidth - rect.width / 2,
      top: rect.height / 2,
      bottom: window.innerHeight - rect.height / 2
    };
    
    if (position.x < bounds.left || position.x > bounds.right) {
      velocity.x *= -physics.elasticity;
      position.x = Math.max(bounds.left, Math.min(bounds.right, position.x));
    }
    
    if (position.y < bounds.top || position.y > bounds.bottom) {
      velocity.y *= -physics.elasticity;
      position.y = Math.max(bounds.top, Math.min(bounds.bottom, position.y));
    }
    
    // Apply transform
    gsap.set(element, {
      x: position.x - window.innerWidth / 2,
      y: position.y - window.innerHeight / 2,
      rotation: velocity.angular * 100,
      overwrite: 'auto'
    });
  };

  // Advanced restoration with multiple stages
  const restoreAdvancedFragment = (fragment, restoration) => {
    const { element, memory, erosionState } = fragment;
    
    // Visual restoration
    const currentErosion = erosionState.level * (1 - restoration);
    
    gsap.to(element, {
      filter: `
        blur(${currentErosion * 10}px) 
        contrast(${1 - currentErosion * 0.5}) 
        grayscale(${currentErosion * 100}%) 
        sepia(${currentErosion * 50}%)
      `,
      opacity: Math.max(0.3, 1 - currentErosion * 0.6),
      scale: 1 + restoration * 0.1,
      duration: 0.3,
      ease: 'power2.out'
    });
    
    // Text restoration
    const codeContent = element.querySelector('.code-content');
    if (codeContent && restoration > 0.3) {
      const original = codeContent.getAttribute('data-original');
      const current = codeContent.textContent;
      
      if (original && current !== original) {
        const restoredText = restoreTextGradually(current, original, restoration);
        codeContent.textContent = restoredText;
      }
    }
    
    // Stage-based effects
    if (restoration > 0.6) {
      element.classList.add('stage-1-restored');
    }
    if (restoration > 0.8) {
      element.classList.add('stage-2-restored');
    }
    if (restoration > 0.95) {
      element.classList.add('stage-3-restored');
      
      if (!element.classList.contains('crystallized')) {
        crystallizeAdvancedFragment(fragment);
      }
    }
  };

  // Gradual text restoration
  const restoreTextGradually = (current, original, restoration) => {
    const currentChars = current.split('');
    const originalChars = original.split('');
    
    return currentChars.map((char, i) => {
      if (i >= originalChars.length) return '';
      
      const threshold = i / originalChars.length;
      if (restoration > threshold && Math.random() < restoration) {
        return originalChars[i];
      }
      return char;
    }).join('');
  };

  // Advanced crystallization with connections
  const crystallizeAdvancedFragment = (fragment) => {
    const { element, memory } = fragment;
    
    element.classList.add('crystallizing');
    
    // Find nearby crystallized fragments
    const crystallized = fragmentsRef.current.filter(f => 
      f.element.classList.contains('crystallized')
    );
    
    // Create connections
    crystallized.forEach(other => {
      if (other === fragment) return;
      
      const connection = createConnection(fragment, other);
      if (connection) {
        containerRef.current.appendChild(connection);
      }
    });
    
    // Crystallization animation
    const timeline = gsap.timeline({
      onComplete: () => {
        element.classList.add('crystallized');
        element.classList.remove('crystallizing');
        
        // Emit celebration particles
        if (particleSystemRef.current) {
          const rect = element.getBoundingClientRect();
          for (let i = 0; i < 20; i++) {
            particleSystemRef.current.create(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              '#00ff88'
            );
          }
        }
      }
    });
    
    timeline
      .to(element, {
        scale: 1.2,
        duration: 0.3,
        ease: 'back.out(2)'
      })
      .to(element.querySelector('.crystallization-layer'), {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.inOut'
      }, 0)
      .to(element, {
        scale: 1.1,
        duration: 0.2,
        ease: 'power2.inOut'
      });
  };

  // Create connection between crystallized fragments
  const createConnection = (fragment1, fragment2) => {
    const rect1 = fragment1.element.getBoundingClientRect();
    const rect2 = fragment2.element.getBoundingClientRect();
    
    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;
    
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    if (distance > 300) return null;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - distance * 0.2;
    
    path.setAttribute('d', `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`);
    path.style.cssText = `
      fill: none;
      stroke: url(#connection-gradient);
      stroke-width: 2;
      opacity: 0;
    `;
    
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.id = 'connection-gradient';
    gradient.innerHTML = `
      <stop offset="0%" style="stop-color:#00ff88;stop-opacity:0.5" />
      <stop offset="50%" style="stop-color:#00b4ff;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#ff00b4;stop-opacity:0.5" />
    `;
    
    svg.appendChild(gradient);
    svg.appendChild(path);
    
    gsap.to(path, {
      opacity: 0.6,
      strokeDasharray: '10 5',
      strokeDashoffset: 15,
      duration: 1,
      ease: 'power2.inOut',
      repeat: -1
    });
    
    return svg;
  };

  // Handle window resize
  const handleResize = () => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  };

  return (
    <div className="memory-erosion-container enhanced" ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        className="particle-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 999
        }}
      />
      
      <div className="erosion-header">
        <h1 className="erosion-title glitch" data-text="Memory Erosion">
          Memory Erosion
        </h1>
        <p className="erosion-subtitle">
          <span className="typewriter">Watch your solutions fade away... hover to remember</span>
        </p>
      </div>
      
      <div className="quality-indicator">
        Quality: <span className={`quality-${quality}`}>{quality}</span>
      </div>
      
      <div 
        className="restoration-field enhanced" 
        style={{
          '--cursor-x': `${cursorRef.current.x}px`,
          '--cursor-y': `${cursorRef.current.y}px`
        }}
      />
      
      <div className="interaction-hints">
        <div className="hint">
          <span className="hint-icon">👆</span>
          <span className="hint-text">Hover to restore memories</span>
        </div>
        <div className="hint">
          <span className="hint-icon">✨</span>
          <span className="hint-text">Fully restored memories crystallize</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryErosionEnhanced;