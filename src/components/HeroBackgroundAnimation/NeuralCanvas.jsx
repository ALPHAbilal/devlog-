import { useRef, useEffect, useState, useCallback } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import ParticleSystem from './utils/particleSystem';
import { createPhysicsWorker } from './workers/physicsWorker';

export default function NeuralCanvas({ 
  quality, 
  isVisible, 
  particleCount, 
  connectionRadius,
  interactionRadius 
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particleSystemRef = useRef(null);
  const workerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 300 });
  const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 300 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  
  // Initialize particle system and worker
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true,
      willReadFrequently: false 
    });
    
    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize particle system
    particleSystemRef.current = new ParticleSystem({
      count: particleCount,
      bounds: { width: canvas.width, height: canvas.height },
      connectionRadius,
      interactionRadius
    });
    
    // Initialize physics worker
    if (quality === 'high' && typeof Worker !== 'undefined') {
      workerRef.current = createPhysicsWorker();
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'update' && particleSystemRef.current) {
          particleSystemRef.current.updateFromWorker(e.data.particles);
        }
      };
    }
    
    setIsInitialized(true);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [isVisible, particleCount, connectionRadius, interactionRadius, quality]);
  
  // Mouse and keyboard tracking
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    
    const handleMouseLeave = () => {
      mouseX.set(-1000);
      mouseY.set(-1000);
    };
    
    const handleKeyDown = (e) => {
      if (!particleSystemRef.current || !canvasRef.current) return;
      
      switch(e.key) {
        case ' ': // Space bar for explosion ripple
          e.preventDefault();
          const rect = canvasRef.current.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          particleSystemRef.current.createRipple(centerX, centerY);
          particleSystemRef.current.createPulseWave(centerX, centerY);
          
          // Create radial explosion
          particleSystemRef.current.particles.forEach(particle => {
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 300 && distance > 0) {
              const angle = Math.atan2(dy, dx);
              const force = (1 - distance / 300) * 15;
              particle.vx += Math.cos(angle) * force;
              particle.vy += Math.sin(angle) * force;
              particle.energy = 1;
              particle.sparkTimer = 20;
            }
          });
          break;
          
        case 'v': // Create vortex at mouse position
          if (smoothMouseX.get() > 0 && smoothMouseY.get() > 0) {
            particleSystemRef.current.createVortex(
              smoothMouseX.get(),
              smoothMouseY.get(),
              100
            );
          }
          break;
          
        case 'w': // Wave effect
          particleSystemRef.current.createDirectionalWave(
            { x: 0, y: rect.height / 2 },
            { x: rect.width, y: rect.height / 2 }
          );
          break;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mouseX, mouseY, smoothMouseX, smoothMouseY]);
  
  // Animation loop
  const animate = useCallback((timestamp) => {
    if (!canvasRef.current || !particleSystemRef.current || !isVisible) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const mousePos = {
      x: smoothMouseX.get(),
      y: smoothMouseY.get()
    };
    
    // Dynamic clear based on performance
    const clearAlpha = quality === 'high' ? 0.08 : 0.1;
    ctx.fillStyle = `rgba(10, 15, 28, ${clearAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // FPS monitoring
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
    
    // Update particles
    if (workerRef.current && quality === 'high') {
      // Offload physics to worker
      workerRef.current.postMessage({
        type: 'update',
        particles: particleSystemRef.current.particles,
        mousePos,
        timestamp
      });
    } else {
      // Calculate physics on main thread for medium quality
      particleSystemRef.current.update(mousePos, timestamp);
    }
    
    // Render particles and connections
    particleSystemRef.current.render(ctx, mousePos);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isVisible, quality, smoothMouseX, smoothMouseY]);
  
  // Start animation
  useEffect(() => {
    if (isInitialized && isVisible) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, isVisible, animate]);
  
  // Handle clicks for ripple effects
  const handleClick = useCallback((e) => {
    if (!particleSystemRef.current || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    particleSystemRef.current.createRipple(x, y);
  }, []);
  
  return (
    <>
      <canvas
        ref={canvasRef}
        className="neural-canvas"
        onClick={handleClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
        }}
      />
      {/* FPS Counter for development */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: fps < 30 ? '#ef4444' : fps < 50 ? '#f59e0b' : '#10b981',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '0 0 4px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          {fps} FPS
        </div>
      )}
    </>
  );
}