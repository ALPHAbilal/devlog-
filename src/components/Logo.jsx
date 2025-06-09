export default function Logo({ size = 40 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200 hover:scale-105"
      >
        {/* Background Circle with Gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        {/* Outer ring */}
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="#10b981"
          strokeWidth="1"
          strokeOpacity="0.2"
          fill="url(#logoGradient)"
        />
        
        {/* Inner circle background */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="#0a1628"
          fillOpacity="0.8"
        />
        
        {/* Terminal Window Frame */}
        <rect
          x="10"
          y="12"
          width="20"
          height="16"
          rx="2"
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        
        {/* Terminal Window Header */}
        <rect
          x="10"
          y="12"
          width="20"
          height="4"
          rx="2"
          fill="#10b981"
          fillOpacity="0.15"
        />
        
        {/* Terminal Window Dots */}
        <circle cx="13" cy="14" r="0.8" fill="#10b981" fillOpacity="0.4" />
        <circle cx="16" cy="14" r="0.8" fill="#10b981" fillOpacity="0.4" />
        <circle cx="19" cy="14" r="0.8" fill="#10b981" fillOpacity="0.4" />
        
        {/* Terminal Prompt */}
        <text
          x="12"
          y="24"
          fontFamily="SF Mono, Monaco, Consolas, monospace"
          fontSize="10"
          fontWeight="600"
          fill="url(#textGradient)"
        >
          &gt;_
        </text>
        
        {/* Blinking Cursor Animation */}
        <rect
          x="22"
          y="19"
          width="2"
          height="6"
          fill="#10b981"
          fillOpacity="0.8"
        >
          <animate
            attributeName="fill-opacity"
            values="0.8;0;0.8"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
}