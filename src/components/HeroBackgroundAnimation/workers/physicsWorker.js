// Physics calculations in Web Worker for performance
const workerCode = `
  // Simple noise function for worker context
  function noise(x, y, t) {
    return Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t) * 0.5 + 0.5;
  }
  
  self.onmessage = function(e) {
    const { type, particles, mousePos, timestamp } = e.data;
    
    if (type === 'update') {
      const updatedParticles = particles.map(particle => {
        // Perlin noise movement
        const noiseScale = 0.002;
        const noiseStrength = 0.5;
        const angle = noise(particle.x * noiseScale, particle.y * noiseScale, timestamp * 0.0001) * Math.PI * 2;
        
        let vx = particle.vx + Math.cos(angle) * noiseStrength;
        let vy = particle.vy + Math.sin(angle) * noiseStrength;
        
        // Mouse interaction
        if (mousePos.x > 0 && mousePos.y > 0) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150 && distance > 0) {
            const force = (1 - distance / 150) * 2;
            const angle = Math.atan2(dy, dx);
            vx += Math.cos(angle) * force;
            vy += Math.sin(angle) * force;
          }
        }
        
        // Apply velocity with damping
        const x = particle.x + vx;
        const y = particle.y + vy;
        vx *= 0.96;
        vy *= 0.96;
        
        // Energy calculation
        const speed = Math.sqrt(vx * vx + vy * vy);
        const energy = Math.min(1, Math.max(0.3, particle.energy - 0.005 + speed * 0.01));
        
        return {
          x,
          y,
          vx,
          vy,
          energy
        };
      });
      
      self.postMessage({
        type: 'update',
        particles: updatedParticles
      });
    }
  };
`;

export function createPhysicsWorker() {
  if (typeof Worker === 'undefined') {
    return null;
  }
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);
  
  // Clean up blob URL after worker is created
  URL.revokeObjectURL(workerUrl);
  
  return worker;
}