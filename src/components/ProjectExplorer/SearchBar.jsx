import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

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
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "absolute left-2.5 top-1/2 transform -translate-y-1/2",
          "transition-all duration-200",
          isFocused ? "text-db-emerald" : "text-db-text-secondary"
        )}
      >
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
        className={cn(
          "w-full px-4 py-2 pl-8 pr-8",
          "bg-db-dark-tertiary/50",
          "border border-db-glass-border",
          "rounded-db-md",
          "text-sm text-db-text-primary",
          "placeholder:text-db-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-db-emerald/50",
          "focus:border-db-emerald/50",
          "transition-all duration-200"
        )}
      />

      {value && (
        <button
          onClick={handleClear}
          className={cn(
            "absolute right-2 top-1/2 transform -translate-y-1/2",
            "p-1 rounded transition-all duration-200",
            isFocused
              ? "hover:bg-db-emerald/10 text-db-text-secondary hover:text-db-text-primary"
              : "hover:bg-db-emerald/5 text-db-text-muted hover:text-db-text-secondary"
          )}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}

      {/* Search highlight effect */}
      {isFocused && (
        <div className="absolute inset-0 rounded-db-md pointer-events-none">
          <div className="absolute inset-0 rounded-db-md bg-db-emerald/5 animate-pulse" />
        </div>
      )}
    </div>
  );
}