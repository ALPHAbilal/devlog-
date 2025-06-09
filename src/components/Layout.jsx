export default function Layout({ children }) {
  return (
    <div className="h-screen bg-dark-primary overflow-hidden flex flex-col">
      {/* Bright green border at top */}
      <div className="h-1 bg-accent-green flex-shrink-0"></div>
      
      <div className="flex-grow overflow-hidden">
        {children}
      </div>
    </div>
  );
}