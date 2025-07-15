export default function Layout({ children }) {
  return (
    <div className="h-screen bg-dark-primary overflow-hidden flex flex-col">
      {/* Subtle green accent line */}
      <div className="h-0.5 bg-accent-green/80 flex-shrink-0"></div>
      
      <div className="flex-grow min-h-0">
        {children}
      </div>
    </div>
  );
}