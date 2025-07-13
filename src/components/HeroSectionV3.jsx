import { ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSectionV3() {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    const demoSection = document.getElementById('problem-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center py-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6 w-full text-center">
        {/* Main content - single column, centered */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
          6 months from now,
          <br />
          you'll still know
          <br />
          <span className="text-accent-green">why this works</span>.
        </h1>
        
        <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
          DevLog captures your solutions with full context. 
          Because that brilliant fix at 2am shouldn't disappear into the void.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 
                     bg-accent-green text-dark-primary rounded-lg font-medium text-lg
                     hover:bg-accent-green/80 transition-all group shadow-lg shadow-accent-green/20"
          >
            Start Documenting Today
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={scrollToDemo}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 
                     border border-dark-secondary text-text-primary rounded-lg text-lg
                     hover:border-accent-green/50 transition-all"
          >
            See How It Works
            <ChevronDown size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>2-minute setup</span>
          </div>
          <div>•</div>
          <div>Free 14-day trial</div>
          <div>•</div>
          <div>No credit card required</div>
        </div>
      </div>
    </section>
  );
}