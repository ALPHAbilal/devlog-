import { useState, useEffect } from 'react';
import { Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSectionV2() {
  const navigate = useNavigate();
  const [currentBlock, setCurrentBlock] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typedContent, setTypedContent] = useState('');

  // Demo content showing documentation workflow
  const demoBlocks = [
    {
      type: 'heading',
      content: 'WebSocket Connection Handling',
      typed: true
    },
    {
      type: 'text',
      content: 'Implemented reconnection logic with exponential backoff to handle network interruptions gracefully.',
      typed: true
    },
    {
      type: 'code',
      content: `const reconnect = () => {
  const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
  setTimeout(() => connect(), delay);
};`,
      typed: false
    },
    {
      type: 'link',
      content: '[[WebSocket Best Practices]] [[Error Handling Patterns]]',
      typed: false
    }
  ];

  // Simulate the documentation workflow
  useEffect(() => {
    let timeoutId;
    let mounted = true;
    
    const sequence = async () => {
      if (!mounted) return;
      
      // Wait before starting
      await new Promise(resolve => timeoutId = setTimeout(resolve, 1000));
      if (!mounted) return;
      
      // Show blocks one by one
      for (let i = 0; i < demoBlocks.length; i++) {
        if (!mounted) return;
        setCurrentBlock(i);
        
        if (demoBlocks[i].typed) {
          setIsTyping(true);
          const content = demoBlocks[i].content;
          
          // Type out the content
          for (let j = 0; j <= content.length; j++) {
            if (!mounted) return;
            setTypedContent(content.substring(0, j));
            await new Promise(resolve => timeoutId = setTimeout(resolve, 50));
          }
          setIsTyping(false);
        }
        
        await new Promise(resolve => timeoutId = setTimeout(resolve, 1500));
      }
      
      // Reset after showing all blocks
      await new Promise(resolve => timeoutId = setTimeout(resolve, 2000));
      if (!mounted) return;
      setCurrentBlock(0);
      setTypedContent('');
    };

    const interval = setInterval(() => {
      if (mounted) sequence();
    }, 10000);
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
              Document as you
              <br />
              <span className="text-accent-green">code</span>.
              <br />
              Find when you need.
            </h1>
            
            <p className="text-xl text-text-secondary mb-8 leading-relaxed">
              The documentation tool that thinks like a developer. 
              Capture solutions, link concepts, and build your searchable knowledge base.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 
                         bg-accent-green text-dark-primary rounded-lg font-medium
                         hover:bg-accent-green/80 transition-all group"
              >
                Start Documenting Better
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

          {/* Right side - Documentation demo */}
          <div className="relative">
            <div className="bg-dark-secondary rounded-lg shadow-2xl border border-dark-secondary/50 overflow-hidden">
              {/* Editor header */}
              <div className="bg-dark-primary px-4 py-3 border-b border-dark-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="text-sm text-text-secondary">Documenting your solution...</span>
                </div>
                <div className="text-xs text-text-secondary">
                  Press <code className="px-1.5 py-0.5 bg-dark-secondary rounded">/ </code> for commands
                </div>
              </div>

              {/* Editor content */}
              <div className="p-6 space-y-4 min-h-[400px]">
                {/* Heading block */}
                {currentBlock >= 0 && (
                  <div className={`transition-all duration-300 ${currentBlock >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h2 className="text-2xl font-bold text-text-primary">
                      {demoBlocks[0].typed && currentBlock === 0 && isTyping ? typedContent : (currentBlock >= 0 ? demoBlocks[0].content : '')}
                      {currentBlock === 0 && isTyping && <span className="animate-pulse">|</span>}
                    </h2>
                  </div>
                )}

                {/* Text block */}
                {currentBlock >= 1 && (
                  <div className={`transition-all duration-300 ${currentBlock >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <p className="text-text-secondary">
                      {demoBlocks[1].typed && currentBlock === 1 && isTyping ? typedContent : (currentBlock >= 1 ? demoBlocks[1].content : '')}
                      {currentBlock === 1 && isTyping && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                )}

                {/* Code block */}
                {currentBlock >= 2 && (
                  <div className={`transition-all duration-300 ${currentBlock >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-dark-primary rounded-lg p-4 border border-dark-secondary/50">
                      <pre className="text-sm font-mono text-accent-green">
                        <code>{demoBlocks[2].content}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* Link block */}
                {currentBlock >= 3 && (
                  <div className={`transition-all duration-300 ${currentBlock >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex gap-2">
                      <span className="text-sm px-3 py-1 bg-accent-green/10 text-accent-green rounded-full hover:bg-accent-green/20 cursor-pointer transition-colors">
                        [[WebSocket Best Practices]]
                      </span>
                      <span className="text-sm px-3 py-1 bg-accent-green/10 text-accent-green rounded-full hover:bg-accent-green/20 cursor-pointer transition-colors">
                        [[Error Handling Patterns]]
                      </span>
                    </div>
                  </div>
                )}

                {/* Slash command hint */}
                {currentBlock < demoBlocks.length - 1 && (
                  <div className="text-xs text-text-secondary/50 animate-pulse">
                    Type to continue documenting...
                  </div>
                )}
              </div>
            </div>

            {/* Floating features */}
            <div className="absolute -bottom-4 -right-4 bg-dark-primary border border-accent-green/30 
                            rounded-lg px-4 py-2 shadow-lg">
              <div className="text-sm font-medium text-accent-green">Rich Markdown</div>
              <div className="text-xs text-text-secondary">Code, links, and more</div>
            </div>

            {/* Feature tags */}
            <div className="absolute -top-3 right-4 flex gap-2">
              <span className="text-xs px-2 py-1 bg-accent-green/20 text-accent-green rounded-full">
                Slash Commands
              </span>
              <span className="text-xs px-2 py-1 bg-accent-green/20 text-accent-green rounded-full">
                Live Preview
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}