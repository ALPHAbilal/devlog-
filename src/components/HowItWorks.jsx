import { Code2, FileText, Link2, Search, Zap, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: <Code2 size={32} />,
    title: 'Solve a problem',
    description: 'Debug an issue, implement a feature, or learn something new.',
    highlight: 'Your daily work'
  },
  {
    number: '02',
    icon: <FileText size={32} />,
    title: 'Document immediately',
    description: 'While the context is fresh, create a DevLog entry with your solution.',
    highlight: 'Rich markdown editor'
  },
  {
    number: '03',
    icon: <Sparkles size={32} />,
    title: 'Add context',
    description: 'Include code blocks, explanations, and the "why" behind your solution.',
    highlight: 'Full context capture'
  },
  {
    number: '04',
    icon: <Link2 size={32} />,
    title: 'Connect & organize',
    description: 'Tag by technology, link to related docs, build your knowledge network.',
    highlight: 'Smart organization'
  },
  {
    number: '05',
    icon: <Search size={32} />,
    title: 'Find instantly',
    description: 'When you need it again, search and find your documented solution in seconds.',
    highlight: 'Lightning fast search'
  },
  {
    number: '06',
    icon: <Zap size={32} />,
    title: 'Ship faster',
    description: 'Stop re-solving problems. Your knowledge compounds over time.',
    highlight: 'Exponential growth'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 md:px-6 bg-dark-primary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How <span className="text-accent-green">DevLog</span> Works
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Turn your daily problem-solving into a permanent knowledge base. 
            It's not about finding time to document — it's about documenting as you work.
          </p>
        </div>

        {/* Process steps */}
        <div className="fluid-grid-features mb-16">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative group"
            >
              {/* Connector line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-8 h-0.5 bg-gradient-to-r 
                                from-accent-green/50 to-transparent"
                  style={{
                    display: (index + 1) % 3 === 0 ? 'none' : 'block'
                  }}
                />
              )}
              
              <div className="bg-dark-secondary/30 rounded-lg p-6 border border-dark-secondary 
                              hover:border-accent-green/50 transition-all duration-300 h-full
                              group-hover:bg-dark-secondary/50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-accent-green/30 text-4xl font-bold">
                    {step.number}
                  </div>
                  <div className="p-3 bg-accent-green/10 rounded-lg text-accent-green
                                  group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-text-secondary mb-3">
                  {step.description}
                </p>
                <div className="text-xs text-accent-green font-medium">
                  {step.highlight}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key differentiators */}
        <div className="bg-dark-secondary/20 rounded-lg p-8 border border-dark-secondary/50">
          <h3 className="text-2xl font-bold text-center mb-8">
            Why DevLog is Different
          </h3>
          
          <div className="fluid-grid-features">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Document in the flow
              </h4>
              <p className="text-sm text-text-secondary">
                Not a separate task. Document while you code, when context is fresh.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">🧠</div>
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Built for developers
              </h4>
              <p className="text-sm text-text-secondary">
                Code blocks, markdown, tags, links. Everything you need, nothing you don't.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Compounds over time
              </h4>
              <p className="text-sm text-text-secondary">
                Every solution documented makes you faster. Your knowledge base grows with you.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-text-secondary mb-6">
            Ready to stop losing your hard-won knowledge?
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-green text-dark-primary 
                       rounded-lg font-medium text-lg hover:bg-accent-green/80 transition-all
                       shadow-lg shadow-accent-green/20"
          >
            Start Building Your Knowledge Base
            <Sparkles size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}