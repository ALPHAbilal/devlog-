// Lightweight particle system - optimized for performance
class Particle {
  constructor(x, y, id) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 1.5 + 0.5;
    this.opacity = Math.random() * 0.3 + 0.2;
    this.connections = [];
  }
  
  update(mousePos, bounds, interactionRadius) {
    // Simple random walk movement
    this.vx += (Math.random() - 0.5) * 0.1;
    this.vy += (Math.random() - 0.5) * 0.1;
    
    // Gentle mouse interaction
    if (mousePos.x > 0 && mousePos.y > 0) {
      const dx = mousePos.x - this.x;
      const dy = mousePos.y - this.y;
      const distSq = dx * dx + dy * dy;
      const radiusSq = interactionRadius * interactionRadius;
      
      if (distSq < radiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / interactionRadius) * 0.5;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }
    }
    
    // Apply velocity with strong damping
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.92;
    this.vy *= 0.92;
    
    // Soft boundary bounce
    const margin = 20;
    if (this.x < margin || this.x > bounds.width - margin) {
      this.vx *= -0.5;
      this.x = Math.max(margin, Math.min(bounds.width - margin, this.x));
    }
    if (this.y < margin || this.y > bounds.height - margin) {
      this.vy *= -0.5;
      this.y = Math.max(margin, Math.min(bounds.height - margin, this.y));
    }
  }
}

export default class LightweightParticleSystem {
  constructor({ count, bounds, connectionRadius, interactionRadius }) {
    this.particles = [];
    this.bounds = bounds;
    this.connectionRadius = connectionRadius;
    this.interactionRadius = interactionRadius;
    this.ripples = [];
    this.frameCount = 0;
    
    // Create particles in a distributed pattern
    for (let i = 0; i < count; i++) {
      const x = Math.random() * bounds.width;
      const y = Math.random() * bounds.height;
      this.particles.push(new Particle(x, y, i));
    }
  }
  
  update(mousePos) {
    this.frameCount++;
    
    // Update particles
    this.particles.forEach(particle => {
      particle.update(mousePos, this.bounds, this.interactionRadius);
      particle.connections = [];
    });
    
    // Update connections (optimized with early exit)
    const radiusSq = this.connectionRadius * this.connectionRadius;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Limit connections per particle
      let connectionCount = 0;
      
      for (let j = i + 1; j < this.particles.length; j++) {
        if (connectionCount >= 3) break; // Max 3 connections per particle
        
        const other = this.particles[j];
        const dx = other.x - particle.x;
        
        // Early exit if x distance is too large
        if (Math.abs(dx) > this.connectionRadius) continue;
        
        const dy = other.y - particle.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < radiusSq) {
          const distance = Math.sqrt(distSq);
          const strength = 1 - distance / this.connectionRadius;
          
          particle.connections.push({
            other,
            strength: strength * 0.5 // Reduce connection opacity
          });
          connectionCount++;
        }
      }
    }
    
    // Update ripples (simplified)
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += 2;
      ripple.opacity -= 0.02;
      return ripple.opacity > 0;
    });
  }
  
  render(ctx, mousePos) {
    // Clear with subtle trail effect
    ctx.fillStyle = 'rgba(10, 15, 28, 0.15)';
    ctx.fillRect(0, 0, this.bounds.width, this.bounds.height);
    
    // Draw connections (simplified)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.lineWidth = 0.5;
    
    this.particles.forEach(particle => {
      particle.connections.forEach(({ other, strength }) => {
        ctx.globalAlpha = strength * 0.3;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      });
    });
    
    ctx.globalAlpha = 1;
    
    // Draw particles (simplified)
    this.particles.forEach(particle => {
      // Simple glow effect
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 4
      );
      gradient.addColorStop(0, `rgba(147, 197, 253, ${particle.opacity})`);
      gradient.addColorStop(1, 'rgba(147, 197, 253, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        particle.x - particle.radius * 4,
        particle.y - particle.radius * 4,
        particle.radius * 8,
        particle.radius * 8
      );
      
      // Core particle
      ctx.fillStyle = `rgba(219, 234, 254, ${particle.opacity * 1.5})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw ripples (simplified)
    this.ripples.forEach(ripple => {
      ctx.strokeStyle = `rgba(139, 92, 246, ${ripple.opacity * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  
  createRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      opacity: 0.6
    });
    
    // Gentle push to nearby particles
    this.particles.forEach(particle => {
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < 10000 && distSq > 0) { // 100px radius
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / 100) * 2;
        particle.vx += (dx / dist) * force;
        particle.vy += (dy / dist) * force;
      }
    });
  }
  
  // Stub for compatibility
  updateFromWorker() {
    // Not used in lightweight version
  }
}