import { useState, useEffect } from 'react';
import { Search, Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSectionV2() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Simulate the search animation with requestAnimationFrame for better performance
  useEffect(() => {
    let timeoutId;
    let mounted = true;
    
    const sequence = async () => {
      if (!mounted) return;
      
      // Wait a bit then start typing
      await new Promise(resolve => timeoutId = setTimeout(resolve, 1500));
      if (!mounted) return;
      
      // Type "cors error"
      const term = 'cors error';
      for (let i = 0; i <= term.length; i++) {
        if (!mounted) return;
        setSearchTerm(term.substring(0, i));
        await new Promise(resolve => timeoutId = setTimeout(resolve, 100));
      }
      
      // Trigger search
      await new Promise(resolve => timeoutId = setTimeout(resolve, 300));
      if (!mounted) return;
      setIsSearching(true);
      
      // Show result quickly
      await new Promise(resolve => timeoutId = setTimeout(resolve, 300));
      if (!mounted) return;
      setIsSearching(false);
      setShowResult(true);
      
      // Reset after a delay
      await new Promise(resolve => timeoutId = setTimeout(resolve, 4000));
      if (!mounted) return;
      setSearchTerm('');
      setShowResult(false);
    };

    const interval = setInterval(() => {
      if (mounted) sequence();
    }, 8000);
    sequence(); // Run immediately

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, []);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('problem-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Value proposition */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Never solve the
              <br />
              <span className="text-accent-green">same problem</span>
              <br />
              twice.
            </h1>
            
            <p className="text-xl text-text-secondary mb-8 leading-relaxed">
              Your code solutions, instantly searchable. 
              Build your personal knowledge base that grows with every bug you fix.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 
                         bg-accent-green text-dark-primary rounded-lg font-medium
                         hover:bg-accent-green/80 transition-all group"
              >
                Start Building Your Second Brain
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 
                         border border-dark-secondary text-text-primary rounded-lg
                         hover:border-accent-green/50 transition-all"
              >
                See How It Works
                <ChevronDown size={20} />
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Setup in 2 minutes</span>
              </div>
              <div>•</div>
              <div>No credit card required</div>
            </div>
          </div>

          {/* Right side - Animated demo */}
          <div className="relative">
            <div className="bg-dark-secondary rounded-lg p-6 shadow-2xl border border-dark-secondary/50">
              {/* Mock search bar */}
              <div className="bg-dark-primary rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Search size={20} className="text-text-secondary" />
                  <input
                    type="text"
                    value={searchTerm}
                    readOnly
                    placeholder="Search your solutions..."
                    className="bg-transparent outline-none text-text-primary flex-1"
                  />
                  {isSearching && (
                    <div className="text-accent-green text-sm">Searching...</div>
                  )}
                </div>
              </div>

              {/* Search result */}
              <div className={`transition-all duration-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                {showResult && (
                  <>
                    <div className="text-xs text-accent-green mb-2 flex items-center gap-2">
                      <Clock size={12} />
                      Found in 0.3 seconds
                    </div>
                    
                    <div className="bg-dark-primary rounded-lg p-4 border border-accent-green/30">
                      <h3 className="font-medium text-text-primary mb-2">
                        ✅ CORS Configuration for Express.js
                      </h3>
                      <pre className="text-sm text-text-secondary mb-3 font-mono">
{`app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));`}
                      </pre>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>Last used: 2 weeks ago</span>
                        <span>•</span>
                        <span>Project: E-commerce API</span>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-text-secondary">
                      Also found: 
                      <span className="text-accent-green"> 4 related solutions</span>
                    </div>
                  </>
                )}
              </div>

              {/* Placeholder when not showing result */}
              {!showResult && (
                <div className="space-y-3">
                  <div className="h-20 bg-dark-primary rounded animate-pulse" />
                  <div className="h-20 bg-dark-primary rounded animate-pulse opacity-50" />
                </div>
              )}
            </div>

            {/* Floating metrics */}
            <div className="absolute -bottom-4 -right-4 bg-dark-primary border border-accent-green/30 
                            rounded-lg px-4 py-2 shadow-lg">
              <div className="text-2xl font-bold text-accent-green">50x</div>
              <div className="text-xs text-text-secondary">Faster than searching</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}