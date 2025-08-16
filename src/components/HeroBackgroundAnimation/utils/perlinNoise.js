// Simplified Perlin noise implementation for organic movement
class PerlinNoise {
  constructor() {
    this.permutation = [];
    this.p = [];
    
    // Initialize permutation table
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    
    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
    
    // Duplicate for overflow
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i % 256];
    }
  }
  
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  lerp(t, a, b) {
    return a + t * (b - a);
  }
  
  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  noise(x, y, z = 0) {
    // Find unit cube that contains point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    // Find relative x, y, z of point in cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    // Compute fade curves for each of x, y, z
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    // Hash coordinates of the 8 cube corners
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;
    
    // Add blended results from 8 corners of cube
    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA], x, y, z),
          this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
          this.grad(this.p[BB], x - 1, y - 1, z))),
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
          this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
          this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)))
    );
  }
}

// Create singleton instance
const perlinInstance = new PerlinNoise();

export function noise(x, y, z = 0) {
  return perlinInstance.noise(x, y, z);
}

// Fractal noise for more complex patterns
export function fractalNoise(x, y, z = 0, octaves = 4, persistence = 0.5) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    total += perlinInstance.noise(x * frequency, y * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  
  return total / maxValue;
}