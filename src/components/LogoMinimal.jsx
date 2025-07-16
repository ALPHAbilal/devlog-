export default function LogoMinimal({ size = 32 }) {
  const scale = size / 32;
  
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
        {/* DevLog - 4 dots in grid pattern */}
        <g transform={`scale(${scale})`}>
          <defs>
            <linearGradient id="devlog-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0a7d57" />
            </linearGradient>
          </defs>
          
          {/* 4 dots in 2x2 grid */}
          {/* Top-left dot */}
          <circle
            cx="11"
            cy="11"
            r="4"
            fill="url(#devlog-gradient)"
          />
          
          {/* Top-right dot */}
          <circle
            cx="21"
            cy="11"
            r="4"
            fill="url(#devlog-gradient)"
          />
          
          {/* Bottom-left dot */}
          <circle
            cx="11"
            cy="21"
            r="4"
            fill="url(#devlog-gradient)"
          />
          
          {/* Bottom-right dot */}
          <circle
            cx="21"
            cy="21"
            r="4"
            fill="url(#devlog-gradient)"
          />
        </g>
      </svg>
    </div>
  );
}

// Icon-only version for smaller sizes
export function LogoIcon({ size = 32 }) {
  const scale = size / 24;
  
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
        {/* Simplified 4 dots for small sizes */}
        <g transform={`scale(${scale})`}>
          {/* 4 dots with solid color for better visibility at small sizes */}
          <circle cx="8" cy="8" r="3" fill="#10b981" />
          <circle cx="16" cy="8" r="3" fill="#10b981" />
          <circle cx="8" cy="16" r="3" fill="#10b981" />
          <circle cx="16" cy="16" r="3" fill="#10b981" />
        </g>
      </svg>
    </div>
  );
}

// Logo with text for navbar/header
export function LogoWithText({ size = 32 }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMinimal size={size} />
      <span className="font-semibold text-xl tracking-tight text-text-primary">
        Devlog
      </span>
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
      >
        {/* DevLog - Animated 4 dots */}
        <g>
          <defs>
            <linearGradient id="devlog-gradient-anim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0a7d57" />
            </linearGradient>
          </defs>
          
          {/* Animated dots with pulse effect */}
          {/* Top-left dot */}
          <circle
            cx="11"
            cy="11"
            r="4"
            fill="url(#devlog-gradient-anim)"
          >
            <animate
              attributeName="r"
              values="4;5;4"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Top-right dot */}
          <circle
            cx="21"
            cy="11"
            r="4"
            fill="url(#devlog-gradient-anim)"
          >
            <animate
              attributeName="r"
              values="4;5;4"
              dur="2s"
              repeatCount="indefinite"
              begin="0.5s"
            />
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="2s"
              repeatCount="indefinite"
              begin="0.5s"
            />
          </circle>
          
          {/* Bottom-left dot */}
          <circle
            cx="11"
            cy="21"
            r="4"
            fill="url(#devlog-gradient-anim)"
          >
            <animate
              attributeName="r"
              values="4;5;4"
              dur="2s"
              repeatCount="indefinite"
              begin="1s"
            />
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="2s"
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
          
          {/* Bottom-right dot */}
          <circle
            cx="21"
            cy="21"
            r="4"
            fill="url(#devlog-gradient-anim)"
          >
            <animate
              attributeName="r"
              values="4;5;4"
              dur="2s"
              repeatCount="indefinite"
              begin="1.5s"
            />
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="2s"
              repeatCount="indefinite"
              begin="1.5s"
            />
          </circle>
        </g>
      </svg>
    </div>
  );
}