import { useMemo } from 'react';

/**
 * ActivityWaveChart - Stepped wave visualization for document activity
 * Matches Figma design: https://www.figma.com/design/vm4zgEWrWUCuEbGzuNCuWq/Untitled?node-id=3-1346
 *
 * @param {Array<number>} data - Array of 30 values (0-100) representing daily activity
 * @param {number} width - Chart width in pixels (default: 258)
 * @param {number} height - Chart height in pixels (default: 80)
 * @param {string} className - Additional CSS classes
 */
export default function ActivityWaveChart({
  data,
  width = 258,
  height = 80,
  className = ''
}) {
  // Generate SVG path for stepped wave
  const wavePath = useMemo(() => {
    if (!data || data.length === 0) return '';

    const points = data.length;
    const stepWidth = width / points;
    const padding = 4; // Padding from edges

    // Create stepped wave path
    let path = `M ${padding},${height}`;

    data.forEach((value, i) => {
      const x = padding + (i * stepWidth);
      const y = height - (value / 100 * (height - padding * 2)) - padding;

      if (i === 0) {
        path += ` L ${x},${y}`;
      } else {
        // Create step effect
        const prevX = padding + ((i - 1) * stepWidth);
        path += ` L ${prevX},${y} L ${x},${y}`;
      }
    });

    // Close the path at bottom right
    path += ` L ${width - padding},${height} Z`;

    return path;
  }, [data, width, height]);

  // Generate overlay wave for depth effect (50% height)
  const overlayPath = useMemo(() => {
    if (!data || data.length === 0) return '';

    const points = data.length;
    const stepWidth = width / points;
    const padding = 4;
    const overlayHeight = height * 0.5; // 50% of total height

    let path = `M ${padding},${height}`;

    data.forEach((value, i) => {
      const x = padding + (i * stepWidth);
      const y = height - (value / 100 * (overlayHeight - padding * 2)) - padding;

      if (i === 0) {
        path += ` L ${x},${y}`;
      } else {
        const prevX = padding + ((i - 1) * stepWidth);
        path += ` L ${prevX},${y} L ${x},${y}`;
      }
    });

    path += ` L ${width - padding},${height} Z`;

    return path;
  }, [data, width, height]);

  return (
    <div
      className={`relative overflow-hidden rounded-[10px] bg-white/5 ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        {/* Base wave - lighter color */}
        <path
          d={wavePath}
          fill="url(#baseGradient)"
          className="transition-opacity duration-300"
        />

        {/* Overlay wave - creates depth effect */}
        <path
          d={overlayPath}
          fill="url(#overlayGradient)"
          className="transition-opacity duration-300"
        />

        {/* Gradients matching Figma design */}
        <defs>
          <linearGradient id="baseGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.3)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0.1)" />
          </linearGradient>
          <linearGradient id="overlayGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.6)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0.3)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip hover areas for each day */}
      <div className="absolute inset-0 flex">
        {data.map((value, i) => (
          <div
            key={i}
            className="flex-1 cursor-pointer"
            title={`${30 - i} days ago: ${value > 5 ? Math.round((value - 5) / 90 * 100) + ' edits' : 'No activity'}`}
          />
        ))}
      </div>
    </div>
  );
}
