export default function LogoProfessional({ size = 36 }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Professional gradient */}
          <linearGradient id="devlogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          
          {/* Shadow filter */}
          <filter id="devlogShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
          </filter>
        </defs>
        
        {/* Background shape - rounded square */}
        <rect
          x="2"
          y="2"
          width="32"
          height="32"
          rx="8"
          fill="#0a1628"
          stroke="url(#devlogGradient)"
          strokeWidth="1"
          strokeOpacity="0.3"
          filter="url(#devlogShadow)"
        />
        
        {/* Code editor window design */}
        <g opacity="0.9">
          {/* Window bar */}
          <rect
            x="8"
            y="8"
            width="20"
            height="3"
            rx="1.5"
            fill="url(#devlogGradient)"
            fillOpacity="0.2"
          />
          
          {/* Terminal content area */}
          <rect
            x="8"
            y="11"
            width="20"
            height="17"
            fill="#0a1628"
            fillOpacity="0.5"
          />
          
          {/* Terminal prompt - clean and modern */}
          <path
            d="M11 18 L14 21 L11 24"
            stroke="url(#devlogGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Cursor line */}
          <rect
            x="17"
            y="19"
            width="8"
            height="2"
            rx="1"
            fill="url(#devlogGradient)"
            fillOpacity="0.6"
          />
        </g>
      </svg>
    </div>
  );
}