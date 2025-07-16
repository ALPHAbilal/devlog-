import { Globe } from 'lucide-react';

export default function LogoMinimal({ size = 32 }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Globe 
        size={size} 
        color="#10b981" 
        strokeWidth={2}
      />
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
      <Globe 
        size={size} 
        color="#10b981" 
        strokeWidth={2}
      />
    </div>
  );
}

// Logo with text for navbar/header
export function LogoWithText({ size = 32 }) {
  return (
    <div className="flex items-center gap-2">
      <Globe 
        size={size} 
        color="#10b981" 
        strokeWidth={2}
      />
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
      <Globe 
        size={size} 
        color="#10b981" 
        strokeWidth={2}
        className="animate-spin-slow"
      />
    </div>
  );
}