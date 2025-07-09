import { useMemo } from 'react';

export default function Sparkline({ data, width = 100, height = 30, className = '' }) {
  // data: Array of numbers representing activity levels (weekly data for 6 months)
  // Normalize data to fit within the height
  const normalizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return data.map(value => ({
      value,
      normalized: ((value - min) / range) * (height - 4) // Leave padding
    }));
  }, [data, height]);

  // Generate SVG path
  const path = useMemo(() => {
    if (normalizedData.length === 0) return '';
    
    const stepWidth = width / (normalizedData.length - 1 || 1);
    
    // Create smooth curve path
    const points = normalizedData.map((point, index) => ({
      x: index * stepWidth,
      y: height - point.normalized - 2 // Flip Y axis and add padding
    }));
    
    // Generate smooth cubic bezier curve
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const xMid = (points[i].x + points[i - 1].x) / 2;
      const yMid = (points[i].y + points[i - 1].y) / 2;
      const cp1x = (xMid + points[i - 1].x) / 2;
      const cp2x = (xMid + points[i].x) / 2;
      
      pathData += ` Q ${cp1x} ${points[i - 1].y}, ${xMid} ${yMid}`;
      pathData += ` Q ${cp2x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }
    
    return pathData;
  }, [normalizedData, width, height]);

  // Generate area path for gradient fill
  const areaPath = useMemo(() => {
    if (!path) return '';
    return `${path} L ${width} ${height} L 0 ${height} Z`;
  }, [path, width, height]);

  // Calculate trend (up, down, or flat)
  const trend = useMemo(() => {
    if (normalizedData.length < 2) return 'flat';
    const recentAvg = normalizedData.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
    const previousAvg = normalizedData.slice(-6, -3).reduce((sum, d) => sum + d.value, 0) / 3;
    
    if (recentAvg > previousAvg * 1.1) return 'up';
    if (recentAvg < previousAvg * 0.9) return 'down';
    return 'flat';
  }, [normalizedData]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-xs text-text-secondary opacity-50">No activity</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`} 
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`sparkline-gradient-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop 
              offset="0%" 
              stopColor={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'} 
              stopOpacity="0.3"
            />
            <stop 
              offset="100%" 
              stopColor={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'} 
              stopOpacity="0.05"
            />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#sparkline-gradient-${trend})`}
          className="transition-all duration-500"
        />
        
        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'}
          strokeWidth="2"
          className="transition-all duration-500"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
      </svg>
      
      
    </div>
  );
}