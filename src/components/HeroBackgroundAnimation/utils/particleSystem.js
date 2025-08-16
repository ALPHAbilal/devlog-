import { noise } from './perlinNoise';
import Quadtree from './quadtree';

class Particle {
  constructor(x, y, id) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = Math.random() * 2 + 1;
    this.connections = new Set();
    this.energy = Math.random() * 0.5 + 0.5;
    this.noiseOffset = Math.random() * 1000;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    // Trail properties
    this.trail = [];
    this.maxTrailLength = 10;
    
    // Depth properties
    this.z = Math.random() * 100; // Simulated depth
    this.baseRadius = this.radius;
    
    // Memory trace
    this.activityScore = 0;
    this.lastActiveTime = 0;
    
    // Visual effects
    this.sparkTimer = 0;
    this.colorTemp = 0; // Color temperature shift
  }
  
  update(mousePos, timestamp, bounds, interactionRadius) {
    // Perlin noise movement for organic feel
    const noiseScale = 0.002;
    const noiseStrength = 0.5;
    const angle = noise(this.x * noiseScale, this.y * noiseScale, timestamp * 0.0001 + this.noiseOffset) * Math.PI * 2;
    
    this.vx += Math.cos(angle) * noiseStrength;
    this.vy += Math.sin(angle) * noiseStrength;
    
    // Mouse interaction
    if (mousePos.x > 0 && mousePos.y > 0) {
      const dx = mousePos.x - this.x;
      const dy = mousePos.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < interactionRadius && distance > 0) {
        const force = (1 - distance / interactionRadius) * 2;
        const angle = Math.atan2(dy, dx);
        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;
        
        // Increase energy when near cursor
        this.energy = Math.min(1, this.energy + 0.02);
      }
    }
    
    // Apply velocity with damping
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    
    // Boundary collision with soft bounce
    const margin = 50;
    if (this.x < margin) {
      this.x = margin;
      this.vx = Math.abs(this.vx) * 0.5;
    } else if (this.x > bounds.width - margin) {
      this.x = bounds.width - margin;
      this.vx = -Math.abs(this.vx) * 0.5;
    }
    
    if (this.y < margin) {
      this.y = margin;
      this.vy = Math.abs(this.vy) * 0.5;
    } else if (this.y > bounds.height - margin) {
      this.y = bounds.height - margin;
      this.vy = -Math.abs(this.vy) * 0.5;
    }
    
    // Decay energy
    this.energy = Math.max(0.3, this.energy - 0.005);
    
    // Update pulse
    this.pulsePhase += 0.02 + this.energy * 0.03;
    
    // Update trail
    this.trail.push({ x: this.x, y: this.y, energy: this.energy });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    // Update depth simulation
    const targetZ = 50 + noise(this.x * 0.001, this.y * 0.001, timestamp * 0.0001) * 50;
    this.z += (targetZ - this.z) * 0.05;
    
    // Update color temperature based on velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.colorTemp = Math.min(1, speed * 0.1);
    
    // Update spark timer
    if (this.sparkTimer > 0) {
      this.sparkTimer--;
    }
  }
  
  activateMemoryTrace() {
    this.activityScore = Math.min(1, this.activityScore + 0.1);
    this.lastActiveTime = Date.now();
  }
  
  updateMemoryTrace() {
    const timeSinceActive = Date.now() - this.lastActiveTime;
    if (timeSinceActive > 1000) {
      this.activityScore = Math.max(0, this.activityScore - 0.01);
    }
  }
}

export default class ParticleSystem {
  constructor({ count, bounds, connectionRadius, interactionRadius }) {
    this.particles = [];
    this.bounds = bounds;
    this.connectionRadius = connectionRadius;
    this.interactionRadius = interactionRadius;
    this.quadtree = null;
    this.ripples = [];
    
    // Advanced effects
    this.pulseWaves = [];
    this.dataFlows = [];
    this.gestureTracker = new GestureTracker();
    this.activityZones = [];
    this.performanceMonitor = new PerformanceMonitor();
    this.compositeCanvas = null;
    this.noiseTexture = null;
    
    // Initialize particles in a neural network-like pattern
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = Math.random() * Math.min(bounds.width, bounds.height) * 0.4;
      const x = bounds.width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 100;
      const y = bounds.height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 100;
      
      this.particles.push(new Particle(x, y, i));
    }
    
    this.initNoiseTexture();
  }
  
  initNoiseTexture() {
    // Create noise texture for overlay effect
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(128, 128);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const value = Math.random() * 30;
      imageData.data[i] = value;     // R
      imageData.data[i + 1] = value; // G
      imageData.data[i + 2] = value; // B
      imageData.data[i + 3] = 10;    // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    this.noiseTexture = canvas;
  }
  
  update(mousePos, timestamp) {
    // Performance monitoring
    this.performanceMonitor.startFrame();
    
    // Update gesture tracking
    this.gestureTracker.update(mousePos);
    const gesture = this.gestureTracker.detectGesture();
    
    // Handle gestures
    if (gesture) {
      this.handleGesture(gesture, mousePos);
    }
    
    // Update quadtree for efficient proximity queries
    this.quadtree = new Quadtree({
      x: 0,
      y: 0,
      width: this.bounds.width,
      height: this.bounds.height
    });
    
    this.particles.forEach(particle => {
      this.quadtree.insert(particle);
    });
    
    // Update activity zones
    this.updateActivityZones();
    
    // Update particles with LOD
    const lod = this.performanceMonitor.getLOD();
    this.particles.forEach(particle => {
      particle.update(mousePos, timestamp, this.bounds, this.interactionRadius);
      particle.updateMemoryTrace();
      
      // Clear old connections
      particle.connections.clear();
      
      // Find nearby particles for connections
      const nearby = this.quadtree.retrieve({
        x: particle.x - this.connectionRadius,
        y: particle.y - this.connectionRadius,
        width: this.connectionRadius * 2,
        height: this.connectionRadius * 2
      });
      
      nearby.forEach(other => {
        if (other.id !== particle.id) {
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.connectionRadius) {
            const connection = {
              particle: other,
              distance,
              strength: 1 - distance / this.connectionRadius,
              flow: Math.random() // Data flow position
            };
            
            particle.connections.add(connection);
            
            // Activate memory traces for frequently connected particles
            if (connection.strength > 0.7) {
              particle.activateMemoryTrace();
              other.activateMemoryTrace();
            }
            
            // Create data flow for strong connections
            if (connection.strength > 0.8 && Math.random() < 0.1) {
              this.createDataFlow(particle, other);
            }
            
            // Trigger sparks occasionally
            if (connection.strength > 0.9 && Math.random() < 0.05) {
              particle.sparkTimer = 10;
              other.sparkTimer = 10;
            }
          }
        }
      });
    });
    
    // Update ripples
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += ripple.speed;
      ripple.opacity -= 0.02;
      return ripple.opacity > 0;
    });
    
    // Update pulse waves
    this.pulseWaves = this.pulseWaves.filter(wave => {
      wave.radius += wave.speed;
      wave.opacity -= 0.01;
      return wave.opacity > 0;
    });
    
    // Update data flows
    this.dataFlows = this.dataFlows.filter(flow => {
      flow.progress += flow.speed;
      return flow.progress < 1;
    });
    
    // Particle clustering near activity zones
    if (lod >= 2) {
      this.applyActivityClustering();
    }
    
    this.performanceMonitor.endFrame();
  }
  
  render(ctx, mousePos) {
    const lod = this.performanceMonitor.getLOD();
    
    // Save context state
    ctx.save();
    
    // Apply chromatic aberration for fast movements
    if (this.gestureTracker.getSpeed() > 50 && lod >= 2) {
      this.applyChromAberration(ctx);
    }
    
    // Apply noise texture overlay
    if (lod >= 3) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.03;
      ctx.drawImage(this.noiseTexture, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    
    // Set up context for smooth rendering
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw particle trails first (lower layer)
    if (lod >= 2) {
      this.renderParticleTrails(ctx);
    }
    
    // Draw connections with data flow
    const drawnConnections = new Set();
    
    this.particles.forEach(particle => {
      particle.connections.forEach(({ particle: other, distance, strength, flow }) => {
        const connectionId = particle.id < other.id 
          ? `${particle.id}-${other.id}` 
          : `${other.id}-${particle.id}`;
        
        if (!drawnConnections.has(connectionId)) {
          drawnConnections.add(connectionId);
          
          // Calculate connection intensity with memory traces
          const memoryBoost = (particle.activityScore + other.activityScore) * 0.5;
          const intensity = strength * (particle.energy + other.energy) * 0.5 * (1 + memoryBoost);
          
          // Calculate depth-based blur
          const avgZ = (particle.z + other.z) / 2;
          const depthBlur = lod >= 3 ? (avgZ / 100) * 2 : 0;
          
          if (depthBlur > 0) {
            ctx.filter = `blur(${depthBlur}px)`;
          }
          
          // Draw connection with enhanced gradient
          const gradient = ctx.createLinearGradient(
            particle.x, particle.y,
            other.x, other.y
          );
          
          // Color temperature shift
          const temp = (particle.colorTemp + other.colorTemp) * 0.5;
          const r = 59 + temp * 40;
          const g = 130 - temp * 30;
          const b = 246 - temp * 50;
          
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.3})`);
          gradient.addColorStop(0.5, `rgba(6, 182, 212, ${intensity * 0.4})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${intensity * 0.3})`);
          
          ctx.strokeStyle = gradient;
          ctx.globalAlpha = intensity;
          ctx.lineWidth = 1 + memoryBoost * 2;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          
          // Enhanced curve with pulsing
          const midX = (particle.x + other.x) / 2;
          const midY = (particle.y + other.y) / 2;
          const pulsePhase = Date.now() * 0.001 + particle.id;
          const curveOffset = Math.sin(pulsePhase) * 5 * (1 + memoryBoost);
          
          ctx.quadraticCurveTo(
            midX + curveOffset, 
            midY - curveOffset, 
            other.x, 
            other.y
          );
          ctx.stroke();
          
          // Reset filter
          if (depthBlur > 0) {
            ctx.filter = 'none';
          }
        }
      });
    });
    
    // Draw data flows
    if (lod >= 2) {
      this.renderDataFlows(ctx);
    }
    
    // Draw pulse waves
    this.renderPulseWaves(ctx);
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    // Sort particles by Z for proper depth rendering
    const sortedParticles = lod >= 3 
      ? [...this.particles].sort((a, b) => b.z - a.z)
      : this.particles;
    
    // Draw particles
    sortedParticles.forEach(particle => {
      const pulse = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
      const depthScale = lod >= 3 ? (150 - particle.z) / 150 : 1;
      const size = particle.baseRadius * pulse * (0.7 + particle.energy * 0.6) * depthScale;
      
      // Apply depth blur
      const depthBlur = lod >= 3 ? (particle.z / 100) * 1.5 : 0;
      if (depthBlur > 0) {
        ctx.filter = `blur(${depthBlur}px)`;
      }
      
      // Enhanced glow with memory traces
      const memoryGlow = particle.activityScore;
      const glowSize = size * (4 + memoryGlow * 2);
      const glowGradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, glowSize
      );
      
      // Temperature-shifted colors
      const r = 6 + particle.colorTemp * 50;
      const g = 182 - particle.colorTemp * 40;
      const b = 212 + particle.colorTemp * 30;
      
      glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${particle.energy * 0.6})`);
      glowGradient.addColorStop(0.5, `rgba(59, 130, 246, ${particle.energy * 0.3 * (1 + memoryGlow)})`);
      glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(
        particle.x - glowSize, 
        particle.y - glowSize, 
        glowSize * 2, 
        glowSize * 2
      );
      
      // Core particle with spark effect
      if (particle.sparkTimer > 0) {
        // Spark effect
        const sparkGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, size * 3
        );
        sparkGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        sparkGradient.addColorStop(0.3, 'rgba(147, 197, 253, 0.6)');
        sparkGradient.addColorStop(1, 'rgba(147, 197, 253, 0)');
        ctx.fillStyle = sparkGradient;
        ctx.fillRect(
          particle.x - size * 3,
          particle.y - size * 3,
          size * 6,
          size * 6
        );
      }
      
      // Core particle
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.energy})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Memory trace indicator
      if (memoryGlow > 0.5) {
        ctx.strokeStyle = `rgba(139, 92, 246, ${memoryGlow * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Reset filter
      if (depthBlur > 0) {
        ctx.filter = 'none';
      }
    });
    
    // Draw ripples with enhanced effects
    this.ripples.forEach(ripple => {
      ctx.strokeStyle = `rgba(139, 92, 246, ${ripple.opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner ripple
      if (lod >= 2) {
        ctx.strokeStyle = `rgba(147, 197, 253, ${ripple.opacity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    // Restore context
    ctx.restore();
  }
  
  createRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      speed: 4,
      opacity: 0.8
    });
    
    // Energize nearby particles
    this.particles.forEach(particle => {
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 150) {
        particle.energy = 1;
        const angle = Math.atan2(dy, dx);
        const force = (1 - distance / 150) * 10;
        particle.vx += Math.cos(angle) * force;
        particle.vy += Math.sin(angle) * force;
      }
    });
  }
  
  updateFromWorker(particleData) {
    // Update particle positions from worker thread
    particleData.forEach((data, i) => {
      if (this.particles[i]) {
        this.particles[i].x = data.x;
        this.particles[i].y = data.y;
        this.particles[i].vx = data.vx;
        this.particles[i].vy = data.vy;
        this.particles[i].energy = data.energy;
      }
    });
  }
  
  // New methods for advanced effects
  
  renderParticleTrails(ctx) {
    this.particles.forEach(particle => {
      if (particle.trail.length < 2) return;
      
      ctx.beginPath();
      particle.trail.forEach((point, i) => {
        const opacity = (i / particle.trail.length) * particle.energy * 0.3;
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      const gradient = ctx.createLinearGradient(
        particle.trail[0].x, particle.trail[0].y,
        particle.x, particle.y
      );
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
      gradient.addColorStop(1, `rgba(6, 182, 212, ${particle.energy * 0.3})`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = particle.radius * 0.5;
      ctx.stroke();
    });
  }
  
  renderDataFlows(ctx) {
    this.dataFlows.forEach(flow => {
      const progress = flow.progress;
      const x = flow.from.x + (flow.to.x - flow.from.x) * progress;
      const y = flow.from.y + (flow.to.y - flow.from.y) * progress;
      
      // Data packet
      const packetSize = 3;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, packetSize * 3);
      gradient.addColorStop(0, 'rgba(147, 197, 253, 0.9)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, packetSize, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  renderPulseWaves(ctx) {
    this.pulseWaves.forEach(wave => {
      const gradient = ctx.createRadialGradient(
        wave.x, wave.y, wave.radius * 0.8,
        wave.x, wave.y, wave.radius
      );
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
      gradient.addColorStop(0.7, `rgba(139, 92, 246, ${wave.opacity * 0.3})`);
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  createDataFlow(from, to) {
    this.dataFlows.push({
      from,
      to,
      progress: 0,
      speed: 0.02 + Math.random() * 0.02
    });
  }
  
  createPulseWave(x, y) {
    this.pulseWaves.push({
      x,
      y,
      radius: 0,
      speed: 2,
      opacity: 0.6
    });
  }
  
  handleGesture(gesture, mousePos) {
    if (gesture.type === 'circle') {
      // Create vortex effect
      this.createVortex(gesture.center.x, gesture.center.y, gesture.radius);
    } else if (gesture.type === 'swipe') {
      // Create directional wave
      this.createDirectionalWave(gesture.start, gesture.end);
    }
  }
  
  createVortex(x, y, radius) {
    this.particles.forEach(particle => {
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius * 2 && distance > 10) {
        // Tangential force for vortex
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        const force = (1 - distance / (radius * 2)) * 5;
        particle.vx += Math.cos(angle) * force;
        particle.vy += Math.sin(angle) * force;
        particle.energy = 1;
      }
    });
    
    // Create multiple pulse waves
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.createPulseWave(x, y), i * 100);
    }
  }
  
  createDirectionalWave(start, end) {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    this.particles.forEach(particle => {
      const particleAngle = Math.atan2(
        particle.y - start.y,
        particle.x - start.x
      );
      const angleDiff = Math.abs(particleAngle - angle);
      
      if (angleDiff < Math.PI / 4) {
        const force = (1 - angleDiff / (Math.PI / 4)) * 8;
        particle.vx += Math.cos(angle) * force;
        particle.vy += Math.sin(angle) * force;
        particle.energy = 1;
      }
    });
  }
  
  updateActivityZones() {
    // Find areas with high particle density
    const zones = [];
    const gridSize = 100;
    const grid = {};
    
    this.particles.forEach(particle => {
      const gridX = Math.floor(particle.x / gridSize);
      const gridY = Math.floor(particle.y / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!grid[key]) {
        grid[key] = { x: gridX * gridSize, y: gridY * gridSize, count: 0 };
      }
      grid[key].count++;
    });
    
    Object.values(grid).forEach(cell => {
      if (cell.count > 3) {
        zones.push({
          x: cell.x + gridSize / 2,
          y: cell.y + gridSize / 2,
          intensity: cell.count / 10
        });
      }
    });
    
    this.activityZones = zones;
  }
  
  applyActivityClustering() {
    this.activityZones.forEach(zone => {
      this.particles.forEach(particle => {
        const dx = zone.x - particle.x;
        const dy = zone.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200 && distance > 20) {
          const force = zone.intensity * (1 - distance / 200) * 0.5;
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force;
          particle.vy += Math.sin(angle) * force;
        }
      });
    });
  }
  
  applyChromAberration(ctx) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.1;
    
    // Red channel offset
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.translate(-2, 0);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(2, 0);
    
    // Blue channel offset
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
    ctx.translate(2, 0);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(-2, 0);
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Helper classes

class GestureTracker {
  constructor() {
    this.points = [];
    this.maxPoints = 20;
  }
  
  update(mousePos) {
    if (mousePos.x > 0 && mousePos.y > 0) {
      this.points.push({ ...mousePos, time: Date.now() });
      if (this.points.length > this.maxPoints) {
        this.points.shift();
      }
    }
  }
  
  getSpeed() {
    if (this.points.length < 2) return 0;
    const recent = this.points.slice(-5);
    let totalSpeed = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].x - recent[i-1].x;
      const dy = recent[i].y - recent[i-1].y;
      const dt = recent[i].time - recent[i-1].time;
      totalSpeed += Math.sqrt(dx * dx + dy * dy) / dt;
    }
    
    return totalSpeed / (recent.length - 1) * 1000; // pixels per second
  }
  
  detectGesture() {
    if (this.points.length < 10) return null;
    
    // Simple circle detection
    const recent = this.points.slice(-15);
    const center = {
      x: recent.reduce((sum, p) => sum + p.x, 0) / recent.length,
      y: recent.reduce((sum, p) => sum + p.y, 0) / recent.length
    };
    
    const distances = recent.map(p => 
      Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2))
    );
    
    const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    
    // Circle detected if variance is low
    if (variance < 100) {
      this.points = []; // Clear after detection
      return { type: 'circle', center, radius: avgDistance };
    }
    
    // Swipe detection
    const start = recent[0];
    const end = recent[recent.length - 1];
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    if (distance > 100 && this.getSpeed() > 200) {
      this.points = [];
      return { type: 'swipe', start, end };
    }
    
    return null;
  }
}

class PerformanceMonitor {
  constructor() {
    this.frames = [];
    this.targetFPS = 60;
    this.lastTime = performance.now();
  }
  
  startFrame() {
    this.frameStart = performance.now();
  }
  
  endFrame() {
    const frameTime = performance.now() - this.frameStart;
    this.frames.push(frameTime);
    
    if (this.frames.length > 60) {
      this.frames.shift();
    }
  }
  
  getLOD() {
    if (this.frames.length < 10) return 3; // High quality by default
    
    const avgFrameTime = this.frames.reduce((a, b) => a + b) / this.frames.length;
    const fps = 1000 / avgFrameTime;
    
    if (fps >= 55) return 3; // High quality
    if (fps >= 45) return 2; // Medium quality
    if (fps >= 30) return 1; // Low quality
    return 0; // Minimal quality
  }
}