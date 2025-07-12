import { useState, useEffect } from 'react';
import { FileText, Hash, Link2, ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const typingSteps = [
  { text: '', cursor: true },
  { text: 'F', cursor: true },
  { text: 'Fi', cursor: true },
  { text: 'Fix', cursor: true },
  { text: 'Fixe', cursor: true },
  { text: 'Fixed', cursor: true },
  { text: 'Fixed ', cursor: true },
  { text: 'Fixed C', cursor: true },
  { text: 'Fixed CO', cursor: true },
  { text: 'Fixed COR', cursor: true },
  { text: 'Fixed CORS', cursor: true },
  { text: 'Fixed CORS ', cursor: true },
  { text: 'Fixed CORS e', cursor: true },
  { text: 'Fixed CORS er', cursor: true },
  { text: 'Fixed CORS err', cursor: true },
  { text: 'Fixed CORS erro', cursor: true },
  { text: 'Fixed CORS error', cursor: true },
  { text: 'Fixed CORS error ', cursor: true },
  { text: 'Fixed CORS error i', cursor: true },
  { text: 'Fixed CORS error in', cursor: true },
  { text: 'Fixed CORS error in ', cursor: true },
  { text: 'Fixed CORS error in p', cursor: true },
  { text: 'Fixed CORS error in pr', cursor: true },
  { text: 'Fixed CORS error in pro', cursor: true },
  { text: 'Fixed CORS error in prod', cursor: true },
  { text: 'Fixed CORS error in produ', cursor: true },
  { text: 'Fixed CORS error in produc', cursor: true },
  { text: 'Fixed CORS error in product', cursor: true },
  { text: 'Fixed CORS error in producti', cursor: true },
  { text: 'Fixed CORS error in productio', cursor: true },
  { text: 'Fixed CORS error in production', cursor: false }
];

export default function HeroSectionV3() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showDocument, setShowDocument] = useState(false);
  const [highlightFeature, setHighlightFeature] = useState(null);

  useEffect(() => {
    const sequence = async () => {
      // Reset
      setCurrentStep(0);
      setShowDocument(false);
      
      // Type the title
      for (let i = 0; i < typingSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      
      // Show document creation
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowDocument(true);
      
      // Highlight features
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHighlightFeature('tags');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHighlightFeature('link');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHighlightFeature('code');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHighlightFeature(null);
    };

    const interval = setInterval(sequence, 10000);
    sequence(); // Run immediately

    return () => clearInterval(interval);
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
              Document as you
              <br />
              <span className="text-accent-green">code</span>.
              <br />
              Find when you
              <br />
              <span className="text-accent-green">need</span>.
            </h1>
            
            <p className="text-xl text-text-secondary mb-8 leading-relaxed">
              Build your personal knowledge base while you work. 
              Every solution documented, organized, and instantly searchable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 
                         bg-accent-green text-dark-primary rounded-lg font-medium
                         hover:bg-accent-green/80 transition-all group"
              >
                Start Documenting Today
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
                <Sparkles size={16} className="text-accent-green" />
                <span>Rich markdown editor</span>
              </div>
              <div>•</div>
              <div>Code blocks with syntax highlighting</div>
            </div>
          </div>

          {/* Right side - Document creation demo */}
          <div className="relative">
            <div className="bg-dark-secondary rounded-lg shadow-2xl border border-dark-secondary/50 overflow-hidden">
              {/* Document header */}
              <div className="bg-dark-primary px-6 py-4 border-b border-dark-secondary">
                <h2 className="text-lg font-medium text-text-primary">
                  {typingSteps[currentStep].text}
                  {typingSteps[currentStep].cursor && (
                    <span className="animate-pulse">|</span>
                  )}
                </h2>
              </div>

              {/* Document content */}
              <div className={`p-6 transition-all duration-500 ${showDocument ? 'opacity-100' : 'opacity-0'}`}>
                {showDocument && (
                  <div className="space-y-4">
                    {/* Tags */}
                    <div className={`flex gap-2 transition-all duration-300 ${
                      highlightFeature === 'tags' ? 'scale-105' : ''
                    }`}>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-green/10 
                                     text-accent-green rounded text-sm">
                        <Hash size={12} />cors
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-green/10 
                                     text-accent-green rounded text-sm">
                        <Hash size={12} />express
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-green/10 
                                     text-accent-green rounded text-sm">
                        <Hash size={12} />production-fix
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-text-secondary">
                      Finally fixed the CORS issue that was blocking our API calls in production. 
                      The problem was with the wildcard origin in the staging config.
                    </p>

                    {/* Link */}
                    <div className={`transition-all duration-300 ${
                      highlightFeature === 'link' ? 'scale-105' : ''
                    }`}>
                      <p className="text-text-secondary">
                        Related to: <span className="text-accent-green cursor-pointer hover:underline">
                          [[Authentication Setup]]
                        </span>
                      </p>
                    </div>

                    {/* Code block */}
                    <div className={`bg-dark-primary rounded-lg p-4 font-mono text-sm transition-all duration-300 ${
                      highlightFeature === 'code' ? 'scale-105 ring-2 ring-accent-green/30' : ''
                    }`}>
                      <div className="text-text-secondary/70 mb-2">// Express CORS config</div>
                      <pre className="text-accent-green">
{`app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://app.example.com'
    : '*',
  credentials: true
}));`}
                      </pre>
                    </div>

                    {/* Note */}
                    <div className="text-sm text-text-secondary bg-yellow-500/10 border border-yellow-500/20 
                                    rounded p-3">
                      <strong>Note:</strong> Always specify exact origins in production. 
                      Wildcard (*) should only be used in development.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feature callouts */}
            <div className="absolute -bottom-4 -left-4 bg-dark-primary border border-accent-green/30 
                            rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent-green" />
                <span className="text-sm text-text-primary">Rich documentation</span>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-dark-primary border border-accent-green/30 
                            rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <Link2 size={16} className="text-accent-green" />
                <span className="text-sm text-text-primary">Link related docs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}