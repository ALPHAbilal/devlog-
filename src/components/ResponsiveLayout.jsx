import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, FileText, Settings, Plus, Search, User } from 'lucide-react';
import MobileNavigation from './MobileNavigation';
import MobileDrawer, { DrawerNavItem, DrawerSection, DrawerFooter } from './MobileDrawer';
import { useResponsive } from '@/shared/hooks';
import { useSwipe } from '@/shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResponsiveLayout({ children, sidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isTablet, height, getSafeAreaInsets } = useResponsive();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Get safe area insets for devices with notches
  const safeInsets = getSafeAreaInsets();
  const isDashboard = location.pathname === '/dashboard';
  
  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Swipe from left edge to open menu
  useSwipe(null, {
    onSwipeRight: () => {
      if (isMobile && !showMobileMenu) {
        setShowMobileMenu(true);
      }
    },
  });

  // Desktop layout with sidebar
  if (!isMobile && !isTablet) {
    return (
      <div className="h-screen bg-dark-primary flex flex-col">
        {/* Subtle green accent line */}
        <div className="h-0.5 bg-accent-green/80 flex-shrink-0"></div>
        
        <div className="flex flex-1 min-h-0">
          {/* Desktop Sidebar */}
          {sidebar && (
            <aside className="w-64 bg-dark-secondary/30 border-r border-dark-secondary 
                             flex-shrink-0 overflow-y-auto">
              {sidebar}
            </aside>
          )}
          
          {/* Main Content */}
          <main className={`flex-1 ${isDashboard ? 'overflow-hidden' : 'overflow-auto'}`}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Mobile/Tablet layout
  return (
    <div 
      className="h-screen bg-dark-primary flex flex-col"
      style={{ 
        paddingTop: safeInsets.top,
        height: `${height}px`,
      }}
    >
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-dark-secondary/50 
                         border-b border-dark-secondary flex-shrink-0">
        <button
          onClick={() => setShowMobileMenu(true)}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary 
                     hover:bg-dark-secondary rounded-lg transition-colors touch-target"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        <h1 className="text-lg font-semibold text-text-primary">Devlog</h1>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 -mr-2 text-text-secondary hover:text-text-primary 
                     hover:bg-dark-secondary rounded-lg transition-colors touch-target"
          aria-label="Search"
        >
          <Search size={24} />
        </button>
      </header>

      {/* Search Bar (slides down when active) */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-dark-secondary overflow-hidden"
          >
            <div className="p-3">
              <input
                type="search"
                placeholder="Search documents..."
                className="w-full px-4 py-2 bg-dark-primary text-text-primary rounded-lg
                           border border-dark-secondary focus:border-accent-green/50
                           focus:outline-none focus:ring-1 focus:ring-accent-green/30
                           placeholder-text-secondary/50"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main 
        className={`flex-1 min-h-0 ${isDashboard ? 'overflow-hidden' : 'overflow-auto momentum-scroll'}`}
        style={{ paddingBottom: `calc(${safeInsets.bottom}px + 4rem)` }}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {isMobile && <MobileNavigation />}

      {/* Mobile Drawer Menu */}
      <MobileDrawer
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        title="Menu"
        position="left"
        width="85%"
        maxWidth="320px"
      >
        <DrawerSection>
          <DrawerNavItem
            icon={Home}
            label="Dashboard"
            isActive={location.pathname === '/dashboard'}
            onClick={() => {
              navigate('/dashboard');
              setShowMobileMenu(false);
            }}
          />
          <DrawerNavItem
            icon={FileText}
            label="Documents"
            isActive={location.pathname.includes('/documents')}
            onClick={() => {
              navigate('/documents');
              setShowMobileMenu(false);
            }}
          />
          <DrawerNavItem
            icon={Settings}
            label="Settings"
            isActive={location.pathname === '/settings'}
            onClick={() => {
              navigate('/settings');
              setShowMobileMenu(false);
            }}
          />
        </DrawerSection>

        <DrawerSection title="Quick Actions">
          <div className="px-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-accent-green/20 
                             text-accent-green rounded-lg hover:bg-accent-green/30 
                             transition-colors">
              <Plus size={20} />
              <span className="font-medium">New Document</span>
            </button>
          </div>
        </DrawerSection>

        {/* Mobile Sidebar Content */}
        {sidebar && (
          <DrawerSection title="Workspace">
            <div className="px-4">
              {sidebar}
            </div>
          </DrawerSection>
        )}

        <DrawerFooter>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-green/20 rounded-full flex items-center justify-center">
              <User size={20} className="text-accent-green" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">User Name</div>
              <div className="text-xs text-text-secondary">Free Plan</div>
            </div>
          </div>
        </DrawerFooter>
      </MobileDrawer>

      {/* Floating Action Button (FAB) for mobile */}
      {isMobile && isDashboard && (
        <button
          onClick={() => navigate('/new')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-accent-green text-dark-primary 
                     rounded-full shadow-lg flex items-center justify-center
                     hover:bg-accent-green/80 transition-colors z-30"
          style={{ marginBottom: safeInsets.bottom }}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}

// Responsive Sidebar Component
export function ResponsiveSidebar({ children, className = '' }) {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile || isTablet) {
    // On mobile/tablet, sidebar content goes in the drawer
    return null;
  }
  
  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

// Page wrapper with responsive padding
export function ResponsivePage({ children, maxWidth = '7xl', padding = true }) {
  const { isMobile } = useResponsive();
  
  return (
    <div className={`
      ${padding ? (isMobile ? 'p-4' : 'p-6 lg:p-8') : ''}
      ${maxWidth ? `max-w-${maxWidth} mx-auto` : ''}
    `}>
      {children}
    </div>
  );
}

// Responsive Grid Component
export function ResponsiveGrid({ children, columns = { sm: 1, md: 2, lg: 3, xl: 4 } }) {
  const gridClasses = `
    grid gap-4
    grid-cols-${columns.sm}
    md:grid-cols-${columns.md}
    lg:grid-cols-${columns.lg}
    xl:grid-cols-${columns.xl}
  `;
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}