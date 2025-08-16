import { useState, useEffect } from 'react';

export default function CircularProgress({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
  showPercentage = true,
  animated = true 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayValue / 100) * circumference;

  // Animate the progress
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  // Get color based on percentage
  const getProgressColor = () => {
    if (percentage >= 90) return '#dc2626'; // Red
    if (percentage >= 80) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  // Format bytes
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="progress-svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-circle"
          style={{
            transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        />
      </svg>

      {/* Center content */}
      <div className="progress-content">
        {showPercentage && (
          <>
            <div className="progress-percentage">{Math.round(displayValue)}%</div>
            <div className="progress-label">Used</div>
          </>
        )}
      </div>

      {/* Touch area for interaction */}
      <div 
        className="progress-touch-area"
        onClick={() => {
          // Haptic feedback
          if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }}
      />

      {/* Usage details */}
      <div className="usage-details">
        <span className="usage-value">{formatBytes(value)}</span>
        <span className="usage-separator">/</span>
        <span className="usage-max">{formatBytes(max)}</span>
      </div>
    </div>
  );
}