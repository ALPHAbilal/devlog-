import React from 'react';

// SVG component for smooth timeline branch connections
const TimelineBranch = ({ 
  startX = 0, 
  startY = 0, 
  endX = 80, 
  endY = 32,
  curveRadius = 16,
  strokeWidth = 2,
  strokeColor = 'var(--timeline-line, #2a3648)',
  className = ''
}) => {
  // Calculate the path data for smooth branch line
  // M = Move to start
  // L = Line to curve start
  // Q = Quadratic bezier curve
  // L = Line to end
  const pathData = `
    M ${startX} ${startY}
    L ${startX} ${endY - curveRadius}
    Q ${startX} ${endY} ${startX + curveRadius} ${endY}
    L ${endX} ${endY}
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
  return (
    <svg 
      className="absolute pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${startY}px`,
        width: `${strokeWidth + 4}px`,
        height: `${endY - startY}px`,
        overflow: 'visible'
      }}
    >
      <line
        x1={strokeWidth / 2}
        y1="0"
        x2={strokeWidth / 2}
        y2={endY - startY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default TimelineBranch;