import { NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, Search, User, Grid3X3 } from 'lucide-react';

export default function MobileNavigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/dashboard?search=true', icon: Search, label: 'Search' },
    { path: '/dashboard?new=true', icon: Plus, label: 'New' },
    { path: '/dashboard', icon: Grid3X3, label: 'Projects' },
    { path: '/settings', icon: User, label: 'Profile' }
  ];

  // Don't show on landing page or auth pages
  if (location.pathname === '/' || location.pathname.includes('/auth')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-primary border-t border-dark-secondary/50 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.label === 'Search' && location.search.includes('search=true')) ||
                          (item.label === 'New' && location.search.includes('new=true'));
          
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-accent-green' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={(e) => {
                // Handle special actions
                if (item.label === 'New') {
                  e.preventDefault();
                  // Trigger new document creation
                  window.dispatchEvent(new CustomEvent('createNewDocument'));
                } else if (item.label === 'Search') {
                  e.preventDefault();
                  // Trigger search focus
                  window.dispatchEvent(new CustomEvent('focusSearch'));
                }
              }}
            >
              <item.icon 
                size={20} 
                className={isActive ? 'stroke-2' : 'stroke-1.5'}
              />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}