export default function LogoMinimal({ size = 32 }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* DevLog unique logo - D with connected nodes */}
        <g>
          {/* Main D shape with gradient */}
          <defs>
            <linearGradient id="devlog-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          
          {/* D letter shape */}
          <path
            d="M8 6h6c5.523 0 10 4.477 10 10s-4.477 10-10 10H8V6z"
            stroke="url(#devlog-gradient)"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Connected nodes representing linked documents */}
          <circle cx="13" cy="11" r="2" fill="#10b981" />
          <circle cx="19" cy="16" r="2" fill="#10b981" opacity="0.8" />
          <circle cx="13" cy="21" r="2" fill="#10b981" opacity="0.6" />
          
          {/* Connection lines */}
          <path
            d="M13 13v6M14.5 12.5l3.5 3.5"
            stroke="#10b981"
            strokeWidth="1.5"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
}

// Icon-only version for smaller sizes
export function LogoIcon({ size = 32 }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified version for small sizes */}
        <g>
          <path
            d="M6 4h4.5C14.642 4 18 7.358 18 11.5S14.642 19 10.5 19H6V4z"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="10" cy="8" r="1.5" fill="#10b981" />
          <circle cx="14" cy="11.5" r="1.5" fill="#10b981" opacity="0.8" />
          <circle cx="10" cy="15" r="1.5" fill="#10b981" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

// Logo with text for navbar/header
export function LogoWithText({ size = 32 }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMinimal size={size} />
      <span className="font-semibold text-xl">DevLog</span>
    </div>
  );
}

// Animated logo for loading states
export function LogoAnimated({ size = 48 }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-pulse"
      >
        <g>
          <path
            d="M8 6h6c5.523 0 10 4.477 10 10s-4.477 10-10 10H8V6z"
            stroke="#10b981"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Animated nodes */}
          <circle cx="13" cy="11" r="2" fill="#10b981">
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="19" cy="16" r="2" fill="#10b981">
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="2s"
              repeatCount="indefinite"
              begin="0.5s"
            />
          </circle>
          <circle cx="13" cy="21" r="2" fill="#10b981">
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="2s"
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
          
          <path
            d="M13 13v6M14.5 12.5l3.5 3.5"
            stroke="#10b981"
            strokeWidth="1.5"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
}