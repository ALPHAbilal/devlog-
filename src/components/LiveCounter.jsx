import { useState, useEffect } from 'react';
import { Users, TrendingUp } from 'lucide-react';

export default function LiveCounter() {
  const [devCount, setDevCount] = useState(5247);
  const [solutionsSaved, setSolutionsSaved] = useState(127849);
  const [activeNow, setActiveNow] = useState(42);

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      // Random small increases to simulate activity
      if (Math.random() > 0.7) {
        setDevCount(prev => prev + 1);
      }
      if (Math.random() > 0.3) {
        setSolutionsSaved(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
      setActiveNow(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-30 space-y-2">
      {/* Active users */}
      <div className="bg-dark-secondary/90 backdrop-blur border border-accent-green/30 rounded-lg px-3 py-2 
                      flex items-center gap-2 text-sm animate-slideIn">
        <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
        <span className="text-text-secondary">
          <span className="text-accent-green font-medium">{activeNow}</span> developers active now
        </span>
      </div>

      {/* Solutions saved today */}
      <div className="bg-dark-secondary/90 backdrop-blur border border-dark-secondary/50 rounded-lg px-3 py-2 
                      flex items-center gap-2 text-sm animate-slideIn animation-delay-200">
        <TrendingUp size={14} className="text-accent-green" />
        <span className="text-text-secondary">
          <span className="text-text-primary font-medium">{solutionsSaved.toLocaleString()}</span> solutions saved today
        </span>
      </div>
    </div>
  );
}

// Add these animations to your CSS
const styles = `
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.5s ease-out;
}

.animation-delay-200 {
  animation-delay: 0.2s;
  animation-fill-mode: both;
}
`;