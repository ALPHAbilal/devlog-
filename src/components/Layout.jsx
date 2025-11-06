import { useLocation } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';

export default function Layout({ children }) {
  const location = useLocation();
  // Check if current page is dashboard or document page (should handle scrolling internally)
  const isDashboard = location.pathname === '/dashboard' ||
                     location.pathname.startsWith('/dashboard/') ||
                     location.pathname.startsWith('/document/');

  return (
    <div className="h-full bg-dark-primary flex flex-col">
      {/* Subtle green accent line */}
      <div className="h-0.5 bg-accent-green/80 flex-shrink-0"></div>

      <div className={`flex-1 min-h-0 ${isDashboard ? 'overflow-hidden' : 'overflow-auto'} pb-16 md:pb-0`}>
        {children}
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}