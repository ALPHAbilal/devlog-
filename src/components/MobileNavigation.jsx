import { NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, Search, User, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-primary/95 
                    backdrop-blur-lg border-t border-dark-secondary/50 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.label === 'Search' && location.search.includes('search=true')) ||
                          (item.label === 'New' && location.search.includes('new=true'));
          
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 h-full 
                         transition-all duration-200 touch-manipulation ${
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
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 
                             bg-accent-green rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                <item.icon 
                  size={22} 
                  className={isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}