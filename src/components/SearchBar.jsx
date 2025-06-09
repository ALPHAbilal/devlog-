import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative flex-grow">
      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 
                        text-text-secondary/60 w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your journey..."
        className="w-full bg-dark-secondary/40 border border-dark-secondary/50 
                   rounded py-2 pl-8 pr-3 text-text-primary text-sm
                   placeholder-text-secondary/60 focus:outline-none 
                   focus:border-accent-green/50 focus:bg-dark-secondary/50 
                   transition-all hover:bg-dark-secondary/50"
      />
    </div>
  );
}