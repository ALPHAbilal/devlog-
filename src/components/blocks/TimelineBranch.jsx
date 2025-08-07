import React from 'react';
import { calculateBranchControlPoints, snapToPixel } from '../../utils/timelineMath';

// SVG component for smooth timeline branch connections
const TimelineBranch = ({ 
  startX = 0, 
  startY = 0, 
  endX = 80, 
  endY = 32,
  strokeWidth = 2,
  strokeColor = 'var(--timeline-line, #2a3648)',
  className = ''
}) => {
  // Snap coordinates to pixel grid for crisp rendering
  const start = {
    x: snapToPixel(startX),
    y: snapToPixel(startY)
  };
  
  const end = {
    x: snapToPixel(endX),
    y: snapToPixel(endY)
  };
  
  // Calculate control points for cubic bezier curve
  // Direction vector for horizontal branching
  const direction = { x: 1, y: 0 };
  const { cp1, cp2 } = calculateBranchControlPoints(start, end, direction);
  
  // Generate cubic bezier path for smooth curve
  const pathData = `
    M ${start.x},${start.y}
    C ${snapToPixel(cp1.x)},${snapToPixel(cp1.y)} ${snapToPixel(cp2.x)},${snapToPixel(cp2.y)} ${end.x},${end.y}
  `.trim();

  return (
    <svg 
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${endX - startX + 10}px`,
        height: `${endY - startY + 10}px`,
        overflow: 'visible'
      }}
    >
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        shapeRendering="geometricPrecision"
      />
    </svg>
  );
};

// Component for vertical connection between attempts
export const VerticalConnector = ({ 
  startY = 0, 
  endY = 40,
  x = 0,
  strokeWidth = 2,
  strokeColor = 'var(--timeline-line, #2a3648)'
}) => {
  // Snap to pixel grid for crisp lines
  const snappedX = snapToPixel(x);
  const snappedStartY = snapToPixel(startY);
  const snappedEndY = snapToPixel(endY);
  const height = snappedEndY - snappedStartY;
  
  return (
    <svg 
      className="absolute pointer-events-none"
      style={{
        left: `${snappedX}px`,
        top: `${snappedStartY}px`,
        width: `${strokeWidth + 4}px`,
        height: `${height}px`,
        overflow: 'visible'
      }}
    >
      <line
        x1={strokeWidth / 2}
        y1="0"
        x2={strokeWidth / 2}
        y2={height}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        shapeRendering="crispEdges"
      />
    </svg>
  );
};

export default TimelineBranch;