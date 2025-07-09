import { ChevronRight, ArrowDown } from 'lucide-react';

export default function HeroWithScreenshots() {
  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-green/10 
                       text-accent-green rounded-full text-sm mb-6">
          <span className="animate-pulse">●</span>
          <span>Trusted by 5,000+ developers</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Your code-first
          <br />
          <span className="text-accent-green">second brain</span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
          Never lose another solution. Capture, connect, and search your 
          development insights without leaving your flow.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
          <button
            onClick={() => window.location.href = '/auth'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 
                       bg-accent-green text-dark-primary rounded-lg font-medium text-lg
                       hover:bg-accent-green/80 transition-all group"
          >
            Start Free Trial
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 
                       border border-dark-secondary text-text-primary rounded-lg text-lg
                       hover:border-accent-green/50 transition-all group"
          >
            <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
            Try Live Demo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            ✓ <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            ✓ <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            ✓ <span>2-minute setup</span>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-[800px] h-[800px] bg-accent-green/5 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
}