export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Bright green border at top */}
      <div className="h-1 bg-accent-green"></div>
      
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}