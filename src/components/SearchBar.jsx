import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
                        text-text-secondary w-5 h-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search entries..."
        className="w-full bg-dark-secondary/50 border border-dark-secondary 
                   rounded-lg py-3 pl-10 pr-4 text-text-primary 
                   placeholder-text-secondary focus:outline-none 
                   focus:border-accent-green"
      />
    </div>
  );
}