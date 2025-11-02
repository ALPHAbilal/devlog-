import { useMemo } from 'react';

/**
 * ActivityWaveChart - Smooth wave visualization for document activity
 * Matches Figma design constraints: Card 160px, Chart zone 63-86px
 *
 * @param {Array<number>} data - Array of 30 values (0-100) representing daily activity percentages
 * @param {Array<number>} counts - Array of 30 actual edit counts for tooltips
 * @param {number} height - Chart height in pixels (default: 70)
 * @param {string} className - Additional CSS classes
 */
export default function ActivityWaveChart({
  data,
  counts,
  height = 70,
  className = ''
}) {
  // Fixed viewBox dimensions for consistent scaling
  const viewBoxWidth = 300;
  const viewBoxHeight = 70;
  // Generate SVG path for wave - simple line path matching Figma
  const wavePath = useMemo(() => {
    if (!data || data.length === 0) return '';

    const padding = 10;
    const maxHeight = 50;

    // Generate path - start from bottom left
    let path = `M 0 ${viewBoxHeight}`;

    // Create line segments for each data point
    data.forEach((value, i) => {
      const x = (i / 29) * viewBoxWidth;
      const normalizedHeight = (value / 100) * maxHeight;
      const y = viewBoxHeight - normalizedHeight - padding;
      path += ` L ${x} ${y}`;
    });

    // Close path at bottom right
    path += ` L ${viewBoxWidth} ${viewBoxHeight} Z`;

    return path;
  }, [data]);

  // Generate stroke line path - follows the wave contour
  const strokePath = useMemo(() => {
    if (!data || data.length === 0) return '';

    const padding = 10;
    const maxHeight = 50;

    // Start from first point (not bottom)
    const firstValue = data[0];
    const firstY = viewBoxHeight - (firstValue / 100) * maxHeight - padding;
    let path = `M 0 ${firstY}`;

    // Create line segments for each data point
    data.forEach((value, i) => {
      const x = (i / 29) * viewBoxWidth;
      const normalizedHeight = (value / 100) * maxHeight;
      const y = viewBoxHeight - normalizedHeight - padding;
      path += ` L ${x} ${y}`;
    });

    return path;
  }, [data]);

  return (
    <div className={`relative w-full ${className}`} style={{ height: `${height}px` }}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(96, 165, 250)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="rgb(96, 165, 250)" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Filled area */}
        <path
          d={wavePath}
          fill="url(#waveGradient)"
          className="transition-all duration-500"
        />

        {/* Stroke line on top */}
        <path
          d={strokePath}
          fill="none"
          stroke="rgb(96, 165, 250)"
          strokeWidth="2"
          className="transition-all duration-500"
        />
      </svg>

      {/* Tooltip hover areas for each day */}
      <div className="absolute inset-0 flex">
        {data && data.map((value, i) => {
          const editCount = counts ? counts[i] : 0;
          const daysAgo = 29 - i;
          const tooltipText = editCount === 0
            ? `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago: No activity`
            : `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago: ${editCount} ${editCount === 1 ? 'edit' : 'edits'}`;

          return (
            <div
              key={i}
              className="flex-1 cursor-pointer"
              title={tooltipText}
            />
          );
        })}
      </div>
    </div>
  );
}
