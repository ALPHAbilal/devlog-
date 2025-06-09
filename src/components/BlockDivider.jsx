import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function BlockDivider({ onAdd }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative h-10 -my-2 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAdd}
    >
      {/* Invisible hover zone that's always clickable */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Subtle line hint when not hovered */}
        <div className={`absolute inset-x-8 h-px transition-opacity duration-150 ${
          isHovered ? 'opacity-0' : 'bg-gradient-to-r from-transparent via-dark-secondary/20 to-transparent'
        }`} />
        
        {/* Plus button - bigger and more visible */}
        <div
          className={`bg-dark-primary border border-dark-secondary/40 
                     text-text-secondary rounded-full w-7 h-7 
                     flex items-center justify-center
                     transition-all duration-150 ease-out
                     shadow-sm
                     ${isHovered 
                       ? 'opacity-100 scale-100 border-accent-green/50 text-accent-green bg-dark-secondary/50' 
                       : 'opacity-0 scale-90'}`}
          aria-label="Add block"
        >
          <Plus size={16} />
        </div>
      </div>
    </div>
  );
}