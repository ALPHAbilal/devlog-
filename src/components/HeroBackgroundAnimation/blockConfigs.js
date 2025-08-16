// Block type definitions with their visual characteristics
export const BLOCK_TYPES = {
  code: {
    weight: 3, // Higher weight = more common
    sizeRange: [80, 120],
    opacityRange: [0.4, 0.6],
    color: 'rgba(59, 130, 246, 0.1)', // Blue for code
  },
  text: {
    weight: 3,
    sizeRange: [60, 90],
    opacityRange: [0.3, 0.5],
    color: 'rgba(255, 255, 255, 0.05)',
  },
  ai: {
    weight: 2,
    sizeRange: [70, 100],
    opacityRange: [0.5, 0.7],
    color: 'rgba(168, 85, 247, 0.1)', // Purple for AI
  },
  heading: {
    weight: 2,
    sizeRange: [50, 70],
    opacityRange: [0.4, 0.6],
    color: 'rgba(255, 255, 255, 0.08)',
  },
  todo: {
    weight: 2,
    sizeRange: [50, 70],
    opacityRange: [0.3, 0.5],
    color: 'rgba(16, 185, 129, 0.1)', // Green for todos
  },
  version: {
    weight: 1,
    sizeRange: [80, 110],
    opacityRange: [0.4, 0.6],
    color: 'rgba(251, 146, 60, 0.1)', // Orange for version control
  },
  file: {
    weight: 2,
    sizeRange: [60, 80],
    opacityRange: [0.3, 0.5],
    color: 'rgba(255, 255, 255, 0.06)',
  },
  table: {
    weight: 1,
    sizeRange: [90, 120],
    opacityRange: [0.3, 0.4],
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

// Performance-aware block generation
function getDeviceBlockCount() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Adjust block count based on device capabilities
  if (width < 768) return 12; // Mobile
  if (width < 1024) return 20; // Tablet
  if (pixelRatio > 2) return 25; // High DPI screens
  return 30; // Desktop
}

// Generate block configuration with performance optimizations
export function generateBlocks(requestedCount) {
  const count = Math.min(requestedCount, getDeviceBlockCount());
  const blocks = [];
  const usedPositions = [];
  const viewportPadding = 100; // Blocks can start slightly outside viewport
  
  for (let i = 0; i < count; i++) {
    const type = getRandomBlockType();
    const config = BLOCK_TYPES[type];
    const size = randomInRange(...config.sizeRange);
    
    // Find non-overlapping position with viewport awareness
    let x, attempts = 0;
    const maxAttempts = 50;
    
    do {
      x = Math.random() * (window.innerWidth + (viewportPadding * 2)) - viewportPadding;
      attempts++;
    } while (
      attempts < maxAttempts &&
      usedPositions.some(pos => Math.abs(pos - x) < size * 0.8)
    );
    
    usedPositions.push(x);
    
    // Stagger initial Y positions for better distribution
    const yOffset = (i / count) * window.innerHeight;
    
    blocks.push({
      id: `block-${i}-${Date.now()}`,
      type,
      x,
      y: yOffset + randomInRange(-100, 100),
      size,
      opacity: randomInRange(...config.opacityRange),
      layer: Math.floor(Math.random() * 3), // 0-2 layers for depth
      duration: randomInRange(20, 45), // Slower for elegance
      delay: randomInRange(0, 5) + (i * 0.5), // Progressive delay
      color: config.color,
    });
  }
  
  // Sort by layer for proper z-indexing
  return blocks.sort((a, b) => a.layer - b.layer);
}