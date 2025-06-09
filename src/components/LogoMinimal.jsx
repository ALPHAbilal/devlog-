export default function LogoMinimal({ size = 32 }) {
  return (
    <div 
      className="flex items-center justify-center bg-dark-secondary rounded"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simple, clean terminal prompt */}
        <g>
          {/* Chevron */}
          <path
            d="M7 8L11 12L7 16"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Underscore */}
          <path
            d="M13 15L17 15"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

// Alternative icon-based approach
export function LogoIcon({ size = 32 }) {
  return (
    <div 
      className="flex items-center justify-center bg-gradient-to-br from-accent-green/10 to-accent-green/5 
                 border border-accent-green/20 rounded-lg shadow-sm"
      style={{ width: size, height: size }}
    >
      <span className="font-mono font-bold text-accent-green" style={{ fontSize: size * 0.45 }}>
        &gt;_
      </span>
    </div>
  );
}