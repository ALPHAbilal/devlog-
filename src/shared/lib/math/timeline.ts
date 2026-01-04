// Mathematical utilities for professional timeline branching

/**
 * Calculate control points for cubic bezier curve
 * Creates smooth transitions between timeline and branches
 * @param {Object} startPoint - Starting point {x, y}
 * @param {Object} endPoint - Ending point {x, y}
 * @param {Object} direction - Direction vector {x, y}
 * @param {number} strength - Control point strength (0.4 is optimal)
 * @returns {Object} Control points {cp1, cp2}
 */
export function calculateBranchControlPoints(startPoint, endPoint, direction, strength = 0.4) {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // First control point maintains timeline direction
  const cp1 = {
    x: startPoint.x + direction.x * distance * strength,
    y: startPoint.y + direction.y * distance * strength
  };
  
  // Second control point approaches target smoothly
  const cp2 = {
    x: endPoint.x - direction.x * distance * strength,
    y: endPoint.y - direction.y * distance * strength
  };
  
  return { cp1, cp2 };
}

/**
 * Generate SVG path for timeline branch using cubic bezier
 * @param {Object} start - Start point {x, y}
 * @param {Object} end - End point {x, y}
 * @param {Object} direction - Branch direction {x, y}
 * @returns {string} SVG path data
 */
export function generateTimelineBranchPath(start, end, direction) {
  const { cp1, cp2 } = calculateBranchControlPoints(start, end, direction);
  
  return `M ${start.x},${start.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
}

/**
 * Calculate exact connection point between dot and line
 * Ensures pixel-perfect alignment
 * @param {Object} lineStart - Line start point {x, y}
 * @param {Object} lineEnd - Line end point {x, y}
 * @param {Object} dotCenter - Dot center {x, y}
 * @param {number} dotRadius - Radius of the dot
 * @param {number} strokeWidth - Width of the line stroke
 * @returns {Object} Connection point {x, y}
 */
export function calculateConnectionPoint(lineStart, lineEnd, dotCenter, dotRadius, strokeWidth) {
  // Calculate line direction vector
  const lineVector = {
    x: lineEnd.x - lineStart.x,
    y: lineEnd.y - lineStart.y
  };
  
  // Normalize line vector
  const length = Math.sqrt(lineVector.x ** 2 + lineVector.y ** 2);
  const unitVector = {
    x: lineVector.x / length,
    y: lineVector.y / length
  };
  
  // Calculate perpendicular for branch direction
  const perpendicular = {
    x: -unitVector.y,
    y: unitVector.x
  };
  
  // Project dot center onto line for exact connection
  const toDot = {
    x: dotCenter.x - lineStart.x,
    y: dotCenter.y - lineStart.y
  };
  
  const projection = toDot.x * unitVector.x + toDot.y * unitVector.y;
  const linePoint = {
    x: lineStart.x + projection * unitVector.x,
    y: lineStart.y + projection * unitVector.y
  };
  
  // Pixel-perfect offset accounting for stroke width
  const offset = dotRadius + strokeWidth * 0.5;
  const connectionPoint = {
    x: Math.round(linePoint.x + perpendicular.x * offset),
    y: Math.round(linePoint.y + perpendicular.y * offset)
  };
  
  return connectionPoint;
}

/**
 * Snap value to pixel grid for crisp rendering
 * Prevents sub-pixel blur
 * @param {number} value - Value to snap
 * @returns {number} Snapped value
 */
export function snapToPixel(value) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  return Math.round(value * devicePixelRatio) / devicePixelRatio;
}

/**
 * Calculate grid-aligned positions for timeline items
 * Ensures consistent spacing and alignment
 * @param {number} index - Item index
 * @param {number} gridSize - Grid size in pixels (default 8)
 * @param {number} baseSpacing - Base vertical spacing
 * @returns {Object} Aligned position {x, y}
 */
export function calculateGridPosition(index, gridSize = 8, baseSpacing = 80) {
  const y = index * baseSpacing;
  return {
    x: 0,
    y: Math.round(y / gridSize) * gridSize
  };
}

/**
 * Calculate smooth branch offset for attempts
 * Creates consistent horizontal spacing
 * @param {number} attemptIndex - Index of the attempt
 * @param {number} baseOffset - Base horizontal offset
 * @param {number} gridSize - Grid size for alignment
 * @returns {number} Aligned horizontal offset
 */
export function calculateBranchOffset(attemptIndex, baseOffset = 60, gridSize = 8) {
  const offset = baseOffset * (attemptIndex + 1);
  return Math.round(offset / gridSize) * gridSize;
}