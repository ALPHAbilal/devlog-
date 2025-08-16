import { useRef, useEffect, useState, useCallback } from 'react';
import LightweightParticleSystem from './utils/lightweightParticleSystem';

export default function LightweightCanvas({ 
  quality, 
  isVisible, 
  particleCount, 
  connectionRadius,
  interactionRadius 
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particleSystemRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [isInitialized, setIsInitialized] = useState(false);
  const lastFrameTime = useRef(0);
  const targetFPS = quality === 'high' ? 30 : 20; // Reduced target FPS
  
  // Initialize particle system
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true
    });
    
    // Set canvas size (lower DPR for performance)
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    
    // Debounced resize handler
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 250);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initialize particle system
    particleSystemRef.current = new LightweightParticleSystem({
      count: particleCount,
      bounds: { width: canvas.width, height: canvas.height },
      connectionRadius,
      interactionRadius
    });
    
    setIsInitialized(true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isVisible, particleCount, connectionRadius, interactionRadius, quality]);
  
  // Mouse tracking (throttled)
  useEffect(() => {
    if (!canvasRef.current) return;
    
    let lastMoveTime = 0;
    const moveThrottle = 16; // ~60fps for mouse tracking
    
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMoveTime < moveThrottle) return;
      lastMoveTime = now;
      
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };
    
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  // Animation loop (throttled)
  const animate = useCallback((timestamp) => {
    if (!canvasRef.current || !particleSystemRef.current || !isVisible) return;
    
    // Frame rate limiting
    const frameInterval = 1000 / targetFPS;
    const deltaTime = timestamp - lastFrameTime.current;
    
    if (deltaTime < frameInterval) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    lastFrameTime.current = timestamp - (deltaTime % frameInterval);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Update and render
    particleSystemRef.current.update(mouseRef.current);
    particleSystemRef.current.render(ctx, mouseRef.current);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isVisible, targetFPS]);
  
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
  );
}