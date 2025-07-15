import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = "",
  autoFocus = false 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className={`
        absolute left-2.5 top-1/2 transform -translate-y-1/2 
        transition-all duration-200
        ${isFocused ? 'text-accent-green' : 'text-text-secondary'}
      `}>
        <Search size={14} />
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full pl-8 pr-8 py-1.5 
          bg-surface-2 border border-surface-2 rounded-lg
          text-sm text-text-primary placeholder-text-secondary/50
          transition-all duration-200
          focus:border-accent-green/50 focus:outline-none
          focus:ring-2 focus:ring-accent-green/20
          ${isFocused ? 'bg-surface-2/80' : ''}
        `}
      />
      
      {value && (
        <button
          onClick={handleClear}
          className={`
            absolute right-2 top-1/2 transform -translate-y-1/2 
            p-1 rounded transition-all duration-200
            ${isFocused 
              ? 'hover:bg-surface-3 text-text-secondary hover:text-text-primary' 
              : 'hover:bg-surface-3/50 text-text-secondary/50 hover:text-text-secondary'
            }
          `}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
      
      {/* Search highlight effect */}
      {isFocused && (
        <div className="absolute inset-0 rounded-lg pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-accent-green/5 animate-pulse" />
        </div>
      )}
    </div>
  );
}