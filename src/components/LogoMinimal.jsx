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
        {/* DevLog Octo-D - GitHub-inspired logo with D head */}
        <g transform={`scale(${scale})`}>
          <defs>
            <linearGradient id="devlog-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0a7d57" />
            </linearGradient>
          </defs>
          
          {/* D Letter Head */}
          <path
            d="M 10 4 L 14 4 C 19 4 22 8 22 12 C 22 16 19 20 14 20 L 10 20 L 10 4 Z"
            fill="url(#devlog-gradient)"
            stroke="none"
          />
          
          {/* Inner cutout for D */}
          <path
            d="M 13 8 L 14 8 C 16.5 8 18 9.5 18 12 C 18 14.5 16.5 16 14 16 L 13 16 L 13 8 Z"
            fill="#050d1a"
            stroke="none"
          />
          
          {/* Tentacles */}
          <path
            d="M 11 18 Q 11 23 9 25 Q 7 27 6 26 Q 5 25 6 23 Q 7 21 8 19"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          <path
            d="M 14 19 Q 14 24 14 26 Q 14 28 13 27.5 Q 12 27 12 25 Q 12 23 12.5 21"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          <path
            d="M 17 19 Q 17 24 17 26 Q 17 28 18 27.5 Q 19 27 19 25 Q 19 23 18.5 21"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          <path
            d="M 20 18 Q 20 23 22 25 Q 24 27 25 26 Q 26 25 25 23 Q 24 21 23 19"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          <path
            d="M 8.5 17 Q 8 21 6 22 Q 4 23 3.5 22 Q 3 21 4 20 Q 5 19 6 18"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          <path
            d="M 22.5 17 Q 23 21 25 22 Q 27 23 27.5 22 Q 28 21 27 20 Q 26 19 25 18"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
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
        {/* Simplified version for small sizes */}
        <g transform={`scale(${scale})`}>
          {/* D Letter Head */}
          <path
            d="M 7 3 L 10 3 C 14 3 17 6 17 10 C 17 14 14 17 10 17 L 7 17 L 7 3 Z"
            fill="#10b981"
            stroke="none"
          />
          
          {/* Inner cutout for D */}
          <path
            d="M 10 6 L 10.5 6 C 12.5 6 14 7.5 14 10 C 14 12.5 12.5 14 10.5 14 L 10 14 L 10 6 Z"
            fill="#050d1a"
            stroke="none"
          />
          
          {/* Simplified tentacles */}
          <path
            d="M 8 15 Q 8 18 7 19 M 11 16 Q 11 19 11 20 M 14 16 Q 14 19 14 20 M 16 15 Q 16 18 17 19"
            stroke="#10b981"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
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
      <span className="font-semibold text-xl bg-gradient-to-r from-[#10b981] to-[#0a7d57] bg-clip-text text-transparent">
        DevLog
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
        {/* DevLog Octo-D with animated tentacles */}
        <g>
          <defs>
            <linearGradient id="devlog-gradient-anim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0a7d57" />
            </linearGradient>
          </defs>
          
          {/* D Letter Head */}
          <path
            d="M 10 4 L 14 4 C 19 4 22 8 22 12 C 22 16 19 20 14 20 L 10 20 L 10 4 Z"
            fill="url(#devlog-gradient-anim)"
            stroke="none"
          />
          
          {/* Inner cutout for D */}
          <path
            d="M 13 8 L 14 8 C 16.5 8 18 9.5 18 12 C 18 14.5 16.5 16 14 16 L 13 16 L 13 8 Z"
            fill="#050d1a"
            stroke="none"
          />
          
          {/* Animated tentacles */}
          <g className="tentacles">
            <path
              d="M 11 18 Q 11 23 9 25 Q 7 27 6 26 Q 5 25 6 23 Q 7 21 8 19"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="d"
                values="M 11 18 Q 11 23 9 25 Q 7 27 6 26 Q 5 25 6 23 Q 7 21 8 19;
                        M 11 18 Q 10 23 8 24 Q 6 26 5 25 Q 4 24 5 22 Q 6 20 8 19;
                        M 11 18 Q 11 23 9 25 Q 7 27 6 26 Q 5 25 6 23 Q 7 21 8 19"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
            
            <path
              d="M 14 19 Q 14 24 14 26 Q 14 28 13 27.5 Q 12 27 12 25 Q 12 23 12.5 21"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="d"
                values="M 14 19 Q 14 24 14 26 Q 14 28 13 27.5 Q 12 27 12 25 Q 12 23 12.5 21;
                        M 14 19 Q 13 24 13 26 Q 13 28 12 27 Q 11 26 11 24 Q 11 22 12.5 21;
                        M 14 19 Q 14 24 14 26 Q 14 28 13 27.5 Q 12 27 12 25 Q 12 23 12.5 21"
                dur="3s"
                repeatCount="indefinite"
                begin="0.5s"
              />
            </path>
            
            <path
              d="M 17 19 Q 17 24 17 26 Q 17 28 18 27.5 Q 19 27 19 25 Q 19 23 18.5 21"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="d"
                values="M 17 19 Q 17 24 17 26 Q 17 28 18 27.5 Q 19 27 19 25 Q 19 23 18.5 21;
                        M 17 19 Q 18 24 18 26 Q 18 28 19 27 Q 20 26 20 24 Q 20 22 18.5 21;
                        M 17 19 Q 17 24 17 26 Q 17 28 18 27.5 Q 19 27 19 25 Q 19 23 18.5 21"
                dur="3s"
                repeatCount="indefinite"
                begin="1s"
              />
            </path>
            
            <path
              d="M 20 18 Q 20 23 22 25 Q 24 27 25 26 Q 26 25 25 23 Q 24 21 23 19"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="d"
                values="M 20 18 Q 20 23 22 25 Q 24 27 25 26 Q 26 25 25 23 Q 24 21 23 19;
                        M 20 18 Q 21 23 23 24 Q 25 26 26 25 Q 27 24 26 22 Q 25 20 23 19;
                        M 20 18 Q 20 23 22 25 Q 24 27 25 26 Q 26 25 25 23 Q 24 21 23 19"
                dur="3s"
                repeatCount="indefinite"
                begin="1.5s"
              />
            </path>
          </g>
        </g>
      </svg>
    </div>
  );
}