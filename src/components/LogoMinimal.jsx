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
        {/* DevLog - D Letter with gradient */}
        <g transform={`scale(${scale})`}>
          <defs>
            <linearGradient id="devlog-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0a7d57" />
            </linearGradient>
          </defs>
          
          {/* D Letter Shape */}
          <path
            d="M 8 4 L 14 4 C 20 4 24 8 24 16 C 24 24 20 28 14 28 L 8 28 L 8 4 Z"
            fill="url(#devlog-gradient)"
            fillRule="evenodd"
          />
          
          {/* Inner cutout for D */}
          <path
            d="M 11 7 L 14 7 C 18 7 21 10 21 16 C 21 22 18 25 14 25 L 11 25 L 11 7 Z"
            fill="#0a1628"
            fillRule="evenodd"
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
        {/* Simplified D for small sizes */}
        <g transform={`scale(${scale})`}>
          <path
            d="M 6 3 L 10 3 C 15 3 18 6 18 12 C 18 18 15 21 10 21 L 6 21 L 6 3 Z"
            fill="#10b981"
            fillRule="evenodd"
          />
          <path
            d="M 9 6 L 10 6 C 13 6 15 8 15 12 C 15 16 13 18 10 18 L 9 18 L 9 6 Z"
            fill="#0a1628"
            fillRule="evenodd"
          />
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
      <span className="font-semibold text-xl tracking-tight">
        <span className="bg-gradient-to-r from-[#10b981] to-[#0a7d57] bg-clip-text text-transparent">
          Dev
        </span>
        <span className="text-text-primary">
          log
        </span>
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
        {/* DevLog - Animated D */}
        <g>
          <defs>
            <linearGradient id="devlog-gradient-anim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981">
                <animate
                  attributeName="stop-color"
                  values="#10b981;#0a7d57;#10b981"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#0a7d57">
                <animate
                  attributeName="stop-color"
                  values="#0a7d57;#10b981;#0a7d57"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          
          {/* Animated D Letter */}
          <path
            d="M 8 4 L 14 4 C 20 4 24 8 24 16 C 24 24 20 28 14 28 L 8 28 L 8 4 Z"
            fill="url(#devlog-gradient-anim)"
            fillRule="evenodd"
          >
            <animate
              attributeName="d"
              values="M 8 4 L 14 4 C 20 4 24 8 24 16 C 24 24 20 28 14 28 L 8 28 L 8 4 Z;
                      M 8 4 L 14 4 C 20 4 24 9 24 16 C 24 23 20 28 14 28 L 8 28 L 8 4 Z;
                      M 8 4 L 14 4 C 20 4 24 8 24 16 C 24 24 20 28 14 28 L 8 28 L 8 4 Z"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Inner cutout */}
          <path
            d="M 11 7 L 14 7 C 18 7 21 10 21 16 C 21 22 18 25 14 25 L 11 25 L 11 7 Z"
            fill="#0a1628"
            fillRule="evenodd"
          />
        </g>
      </svg>
    </div>
  );
}