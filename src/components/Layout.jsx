import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  
  return (
    <div className="h-full bg-dark-primary flex flex-col">
      {/* Subtle green accent line */}
      <div className="h-0.5 bg-accent-green/80 flex-shrink-0"></div>
      
      <div className={`flex-1 min-h-0 ${isDashboard ? 'overflow-hidden' : 'overflow-auto'}`}>
        {children}
      </div>
    </div>
  );
}