import { cn } from '../utils/cn';

export default function CardContainer({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles - exact from Figma
        "group relative",
        "bg-gradient-to-br from-[#1a2942]/60 to-[#0f1d32]/60",
        "backdrop-blur-sm rounded-xl border border-white/10",
        "cursor-pointer self-start",

        // Hover effects
        "hover:border-emerald-500/30 transition-all duration-300",
        "hover:shadow-xl hover:shadow-emerald-500/10",

        className
      )}
    >
      {/* Hover gradient overlay - emerald tint on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0
                      group-hover:from-emerald-500/10 group-hover:to-transparent
                      transition-all duration-300 pointer-events-none" />

      {children}

      {/* Bottom accent line - emerald gradient on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5
                      bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0
                      group-hover:from-emerald-500/50 group-hover:via-emerald-500
                      group-hover:to-emerald-500/50 transition-all duration-500" />
    </div>
  );
}
