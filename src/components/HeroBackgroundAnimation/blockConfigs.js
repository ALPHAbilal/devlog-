// Block type definitions with their visual characteristics
export const BLOCK_TYPES = {
  code: {
    weight: 3, // Higher weight = more common
    sizeRange: [80, 120],
    opacityRange: [0.15, 0.25],
    color: 'rgba(59, 130, 246, 0.1)', // Blue for code
  },
  text: {
    weight: 3,
    sizeRange: [60, 90],
    opacityRange: [0.1, 0.2],
    color: 'rgba(255, 255, 255, 0.05)',
  },
  ai: {
    weight: 2,
    sizeRange: [70, 100],
    opacityRange: [0.2, 0.3],
    color: 'rgba(168, 85, 247, 0.1)', // Purple for AI
  },
  heading: {
    weight: 2,
    sizeRange: [50, 70],
    opacityRange: [0.15, 0.25],
    color: 'rgba(255, 255, 255, 0.08)',
  },
  todo: {
    weight: 2,
    sizeRange: [50, 70],
    opacityRange: [0.1, 0.2],
    color: 'rgba(16, 185, 129, 0.1)', // Green for todos
  },
  version: {
    weight: 1,
    sizeRange: [80, 110],
    opacityRange: [0.15, 0.25],
    color: 'rgba(251, 146, 60, 0.1)', // Orange for version control
  },
  file: {
    weight: 2,
    sizeRange: [60, 80],
    opacityRange: [0.1, 0.2],
    color: 'rgba(255, 255, 255, 0.06)',
  },
  table: {
    weight: 1,
    sizeRange: [90, 120],
    opacityRange: [0.1, 0.15],
    color: 'rgba(255, 255, 255, 0.04)',
  },
};

// Generate a weighted random block type
function getRandomBlockType() {
  const types = Object.keys(BLOCK_TYPES);
  const weights = types.map(type => BLOCK_TYPES[type].weight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < types.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return types[i];
    }
  }
  
  return types[0]; // Fallback
}

// Generate random value within range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate block configuration
export function generateBlocks(count) {
  const blocks = [];
  const usedPositions = [];
  
  for (let i = 0; i < count; i++) {
    const type = getRandomBlockType();
    const config = BLOCK_TYPES[type];
    const size = randomInRange(...config.sizeRange);
    
    // Find non-overlapping position
    let x, attempts = 0;
    const maxAttempts = 50;
    
    do {
      x = Math.random() * (window.innerWidth - size);
      attempts++;
    } while (
      attempts < maxAttempts &&
      usedPositions.some(pos => Math.abs(pos - x) < size * 0.8)
    );
    
    usedPositions.push(x);
    
    blocks.push({
      id: `block-${i}-${Date.now()}`,
      type,
      x,
      y: Math.random() * window.innerHeight,
      size,
      opacity: randomInRange(...config.opacityRange),
      layer: Math.floor(Math.random() * 3) + 1, // 1-3 layers for depth
      duration: randomInRange(15, 40), // Slower movement for elegance
      delay: randomInRange(0, 20),
      color: config.color,
    });
  }
  
  // Sort by layer for proper z-indexing
  return blocks.sort((a, b) => a.layer - b.layer);
}