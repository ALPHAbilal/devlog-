interface LogoMinimalProps {
  size?: number;
}

export default function LogoMinimal({ size = 32 }: LogoMinimalProps): JSX.Element {
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
        {/* DevLog - Connected Knowledge Blocks forming 'D' */}
        <g transform={`scale(${scale})`}>
          <defs>
            <linearGradient id="devlog-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0a7d57" />
            </linearGradient>
            <linearGradient id="devlog-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0a7d57" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Connection lines */}
          <g strokeWidth="1.5" stroke="url(#devlog-gradient-light)" strokeLinecap="round">
            {/* Top to right connections */}
            <line x1="11" y1="9" x2="18" y2="9" opacity="0.6" />
            <line x1="21" y1="9" x2="21" y2="16" opacity="0.6" />

            {/* Bottom connection */}
            <line x1="11" y1="23" x2="18" y2="23" opacity="0.6" />

            {/* Vertical connections */}
            <line x1="11" y1="12" x2="11" y2="20" opacity="0.6" />
          </g>

          {/* Main blocks forming 'D' shape */}
          {/* Top-left block */}
          <rect
            x="8"
            y="6"
            width="6"
            height="6"
            rx="1.5"
            fill="url(#devlog-gradient)"
          />

          {/* Top-right block */}
          <rect
            x="18"
            y="6"
            width="6"
            height="6"
            rx="1.5"
            fill="url(#devlog-gradient)"
          />

          {/* Bottom-left block */}
          <rect
            x="8"
            y="20"
            width="6"
            height="6"
            rx="1.5"
            fill="url(#devlog-gradient)"
          />

          {/* Bottom-right block */}
          <rect
            x="18"
            y="20"
            width="6"
            height="6"
            rx="1.5"
            fill="url(#devlog-gradient)"
          />

          {/* Middle-right block (completing the D curve) */}
          <rect
            x="21"
            y="13"
            width="6"
            height="6"
            rx="1.5"
            fill="url(#devlog-gradient)"
            transform="rotate(45 24 16)"
          />

          {/* Connection dots */}
          <g fill="#10b981">
            <circle cx="11" cy="9" r="1" />
            <circle cx="21" cy="9" r="1" />
            <circle cx="11" cy="23" r="1" />
            <circle cx="21" cy="23" r="1" />
            <circle cx="24" cy="16" r="1" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Icon-only version for smaller sizes
interface LogoIconProps {
  size?: number;
}

export function LogoIcon({ size = 32 }: LogoIconProps): JSX.Element {
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
        {/* Simplified D shape with dots for small sizes */}
        <g transform={`scale(${scale})`}>
          {/* Dots forming D shape */}
          <circle cx="8" cy="6" r="2" fill="#10b981" />
          <circle cx="8" cy="12" r="2" fill="#10b981" />
          <circle cx="8" cy="18" r="2" fill="#10b981" />

          <circle cx="14" cy="6" r="2" fill="#10b981" />
          <circle cx="14" cy="18" r="2" fill="#10b981" />

          <circle cx="18" cy="9" r="2" fill="#10b981" />
          <circle cx="18" cy="15" r="2" fill="#10b981" />

          {/* Subtle connections */}
          <g stroke="#10b981" strokeWidth="1" opacity="0.3">
            <line x1="10" y1="6" x2="12" y2="6" />
            <line x1="10" y1="18" x2="12" y2="18" />
            <line x1="16" y1="9" x2="18" y2="12" />
            <line x1="18" y1="12" x2="16" y2="15" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Logo with text for navbar/header
interface LogoWithTextProps {
  size?: number;
}

export function LogoWithText({ size = 32 }: LogoWithTextProps): JSX.Element {
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
interface LogoAnimatedProps {
  size?: number;
}

export function LogoAnimated({ size = 48 }: LogoAnimatedProps): JSX.Element {
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
        {/* DevLog - Animated connected blocks */}
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

          {/* Animated connection lines */}
          <g strokeWidth="1.5" stroke="url(#devlog-gradient-anim)" strokeLinecap="round">
            <line x1="11" y1="9" x2="18" y2="9">
              <animate
                attributeName="opacity"
                values="0;0.6;0.6;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
            <line x1="21" y1="9" x2="21" y2="16">
              <animate
                attributeName="opacity"
                values="0;0;0.6;0.6;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
            <line x1="11" y1="23" x2="18" y2="23">
              <animate
                attributeName="opacity"
                values="0;0;0;0.6;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
            <line x1="11" y1="12" x2="11" y2="20">
              <animate
                attributeName="opacity"
                values="0;0.6;0.6;0.6;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
          </g>

          {/* Animated blocks */}
          <g fill="url(#devlog-gradient-anim)">
            {/* Top-left block */}
            <rect x="8" y="6" width="6" height="6" rx="1.5">
              <animate
                attributeName="opacity"
                values="0.3;1;1;1;0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </rect>

            {/* Top-right block */}
            <rect x="18" y="6" width="6" height="6" rx="1.5">
              <animate
                attributeName="opacity"
                values="0.3;0.3;1;1;0.3"
                dur="3s"
                repeatCount="indefinite"
                begin="0.5s"
              />
            </rect>

            {/* Bottom-left block */}
            <rect x="8" y="20" width="6" height="6" rx="1.5">
              <animate
                attributeName="opacity"
                values="0.3;1;1;1;0.3"
                dur="3s"
                repeatCount="indefinite"
                begin="0.3s"
              />
            </rect>

            {/* Bottom-right block */}
            <rect x="18" y="20" width="6" height="6" rx="1.5">
              <animate
                attributeName="opacity"
                values="0.3;0.3;0.3;1;0.3"
                dur="3s"
                repeatCount="indefinite"
                begin="1s"
              />
            </rect>

            {/* Middle-right block */}
            <rect x="21" y="13" width="6" height="6" rx="1.5" transform="rotate(45 24 16)">
              <animate
                attributeName="opacity"
                values="0.3;0.3;1;1;0.3"
                dur="3s"
                repeatCount="indefinite"
                begin="0.7s"
              />
            </rect>
          </g>

          {/* Animated connection dots */}
          <g fill="#10b981">
            <circle cx="11" cy="9" r="1">
              <animate
                attributeName="r"
                values="0;1;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="21" cy="9" r="1">
              <animate
                attributeName="r"
                values="0;0;1;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="11" cy="23" r="1">
              <animate
                attributeName="r"
                values="0;0;0;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="21" cy="23" r="1">
              <animate
                attributeName="r"
                values="0;0;0;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="24" cy="16" r="1">
              <animate
                attributeName="r"
                values="0;0;1;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </g>
      </svg>
    </div>
  );
}
