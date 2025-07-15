import { useNavigate } from 'react-router-dom';
import { Check, X, Code, Wifi, MessageSquare, GitBranch, Zap, Shield } from 'lucide-react';
import LogoMinimal from '../../components/LogoMinimal';

export default function NotionAlternative() {
  const navigate = useNavigate();

  const comparisonData = [
    {
      feature: 'Built for Developers',
      devlog: true,
      notion: false,
      description: 'Purpose-built for code documentation'
    },
    {
      feature: 'Syntax Highlighting',
      devlog: true,
      notion: 'Limited',
      description: 'Full language support with themes'
    },
    {
      feature: 'Code Version Tracking',
      devlog: true,
      notion: false,
      description: 'Track code evolution over time'
    },
    {
      feature: 'AI Conversation Blocks',
      devlog: true,
      notion: false,
      description: 'Preserve ChatGPT/Claude interactions'
    },
    {
      feature: 'Offline-First Architecture',
      devlog: true,
      notion: false,
      description: 'Work without internet connection'
    },
    {
      feature: 'File Path Tracking',
      devlog: true,
      notion: false,
      description: 'Connect code to project structure'
    },
    {
      feature: 'Developer Knowledge Graph',
      devlog: true,
      notion: false,
      description: 'Visualize code connections'
    },
    {
      feature: 'Instant Search',
      devlog: true,
      notion: true,
      description: 'Fast full-text search'
    },
    {
      feature: 'Wiki-Style Linking',
      devlog: true,
      notion: true,
      description: 'Connect related documents'
    },
    {
      feature: 'Block-Based Editor',
      devlog: true,
      notion: true,
      description: 'Modular content blocks'
    },
    {
      feature: 'Pricing (Individual)',
      devlog: '$9/mo',
      notion: '$10/mo',
      description: 'Monthly subscription cost'
    },
    {
      feature: 'Free Tier',
      devlog: '10 documents',
      notion: 'Limited blocks',
      description: 'Free plan limitations'
    }
  ];

  const devlogAdvantages = [
    {
      icon: <Code className="text-accent-green" size={32} />,
      title: 'Developer-First Design',
      description: 'Every feature built specifically for coding workflows, not generic note-taking.'
    },
    {
      icon: <Wifi className="text-accent-green" size={32} />,
      title: 'Works Offline',
      description: 'Full functionality without internet. Your documentation is always accessible.'
    },
    {
      icon: <MessageSquare className="text-accent-green" size={32} />,
      title: 'AI Preservation',
      description: 'The only tool that saves AI conversations alongside your code.'
    },
    {
      icon: <GitBranch className="text-accent-green" size={32} />,
      title: 'Code Versioning',
      description: 'Track how your solutions evolve without complex Git workflows.'
    },
    {
      icon: <Zap className="text-accent-green" size={32} />,
      title: 'Lightning Fast',
      description: 'Optimized for developer workflows with instant search and navigation.'
    },
    {
      icon: <Shield className="text-accent-green" size={32} />,
      title: 'Privacy First',
      description: 'Your code stays private. No AI training on your documentation.'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-primary/80 backdrop-blur-md border-b border-dark-secondary/20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <LogoMinimal size={32} />
            <h1 className="text-xl font-semibold">DevLog</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 bg-accent-green text-dark-primary rounded font-medium 
                         hover:bg-accent-green/80 transition-colors"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            The <span className="text-accent-green">Notion Alternative</span>
            <br />
            Built for Developers
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
            While Notion is great for general notes, DevLog is purpose-built for developer 
            documentation with code-first features Notion can't match.
          </p>
          
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-4 
                     bg-accent-green text-dark-primary rounded-lg font-medium text-lg
                     hover:bg-accent-green/80 transition-all group shadow-lg shadow-accent-green/20"
          >
            Switch from Notion to DevLog
            <Code size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 md:px-6 bg-dark-secondary/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            DevLog vs Notion: Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-secondary">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <LogoMinimal size={20} />
                      DevLog
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold">Notion</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-dark-secondary/50 hover:bg-dark-secondary/20">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium">{row.feature}</div>
                        <div className="text-sm text-text-secondary">{row.description}</div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof row.devlog === 'boolean' ? (
                        row.devlog ? (
                          <Check className="text-accent-green mx-auto" size={24} />
                        ) : (
                          <X className="text-red-400 mx-auto" size={24} />
                        )
                      ) : (
                        <span className={row.feature.includes('Pricing') ? 'text-accent-green font-semibold' : ''}>
                          {row.devlog}
                        </span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof row.notion === 'boolean' ? (
                        row.notion ? (
                          <Check className="text-accent-green mx-auto" size={24} />
                        ) : (
                          <X className="text-red-400 mx-auto" size={24} />
                        )
                      ) : (
                        <span className="text-text-secondary">{row.notion}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why DevLog Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why Developers Choose DevLog Over Notion
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devlogAdvantages.map((advantage, index) => (
              <div
                key={index}
                className="bg-dark-secondary/30 rounded-lg p-6 border border-dark-secondary 
                           hover:border-accent-green/30 transition-all group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  {advantage.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{advantage.title}</h3>
                <p className="text-text-secondary">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Migration Section */}
      <section className="py-20 px-4 md:px-6 bg-dark-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Easy Migration from Notion
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-dark-secondary/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-accent-green">1.</span> Export from Notion
              </h3>
              <p className="text-text-secondary mb-4">
                Export your Notion workspace as Markdown files. DevLog's markdown support 
                makes migration seamless.
              </p>
            </div>
            
            <div className="bg-dark-secondary/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-accent-green">2.</span> Import to DevLog
              </h3>
              <p className="text-text-secondary mb-4">
                Copy your content into DevLog documents. Our block editor understands 
                Notion's structure.
              </p>
            </div>
            
            <div className="bg-dark-secondary/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-accent-green">3.</span> Enhance with Code Features
              </h3>
              <p className="text-text-secondary mb-4">
                Add syntax highlighting, version tracking, and AI blocks to supercharge 
                your documentation.
              </p>
            </div>
            
            <div className="bg-dark-secondary/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-accent-green">4.</span> Work Offline
              </h3>
              <p className="text-text-secondary mb-4">
                Enjoy full functionality without internet. Your documentation is always 
                available when you need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-secondary/30 rounded-lg p-8 border border-accent-green/30">
            <p className="text-xl mb-6 italic">
              "I switched from Notion to DevLog and never looked back. The code-specific 
              features like syntax highlighting and version tracking save me hours every week. 
              Plus, being able to work offline is a game-changer."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-green/20 rounded-full flex items-center justify-center">
                <span className="text-accent-green font-bold">JD</span>
              </div>
              <div>
                <div className="font-semibold">Jane Developer</div>
                <div className="text-sm text-text-secondary">Senior Full Stack Developer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready for Documentation Built for Developers?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join thousands of developers who've upgraded from Notion to DevLog.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-4 
                     bg-accent-green text-dark-primary rounded-lg font-medium text-lg
                     hover:bg-accent-green/80 transition-all group shadow-lg shadow-accent-green/20"
          >
            Try DevLog Free for 14 Days
            <Code size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-text-secondary">
            No credit card required • Import from Notion • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-dark-secondary/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMinimal size={24} />
            <span className="text-sm text-text-secondary">© 2025 DevLog. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm">
            <button onClick={() => navigate('/privacy')} className="text-text-secondary hover:text-text-primary">
              Privacy
            </button>
            <button onClick={() => navigate('/terms')} className="text-text-secondary hover:text-text-primary">
              Terms
            </button>
            <a href="mailto:support@devlog.design" className="text-text-secondary hover:text-text-primary">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}