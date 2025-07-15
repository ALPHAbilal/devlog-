import { useNavigate } from 'react-router-dom';
import { MessageSquare, Save, Search, Clock, Shield, Zap } from 'lucide-react';
import LogoMinimal from '../../components/LogoMinimal';

export default function AIConversationSaver() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Save className="text-accent-green" size={24} />,
      title: 'Preserve Every AI Interaction',
      description: 'Save ChatGPT, Claude, and other AI conversations directly in your documentation. Never lose valuable generated solutions.'
    },
    {
      icon: <Search className="text-accent-green" size={24} />,
      title: 'Searchable AI History',
      description: 'Find that perfect explanation or code solution from past AI conversations instantly with full-text search.'
    },
    {
      icon: <MessageSquare className="text-accent-green" size={24} />,
      title: 'Context-Rich Documentation',
      description: 'Keep AI responses alongside your code, maintaining full context of the problem and solution.'
    },
    {
      icon: <Clock className="text-accent-green" size={24} />,
      title: 'Version Your AI Learning',
      description: 'Track how AI-generated solutions evolve over time as you refine and improve them.'
    },
    {
      icon: <Shield className="text-accent-green" size={24} />,
      title: 'Private & Secure',
      description: 'Your AI conversations stay private. No data sharing with third parties.'
    },
    {
      icon: <Zap className="text-accent-green" size={24} />,
      title: 'Instant Organization',
      description: 'Automatically organize AI conversations by project, topic, or custom tags.'
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 
                          text-accent-green rounded-full text-sm font-medium mb-6">
            <MessageSquare size={16} />
            AI Conversation Preservation
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Never Lose Another
            <br />
            <span className="text-accent-green">AI-Generated Solution</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
            DevLog is the only developer documentation tool that preserves AI conversations 
            alongside your code. Save, organize, and search through every ChatGPT or Claude 
            interaction that helped solve your coding challenges.
          </p>
          
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-4 
                     bg-accent-green text-dark-primary rounded-lg font-medium text-lg
                     hover:bg-accent-green/80 transition-all group shadow-lg shadow-accent-green/20"
          >
            Start Preserving AI Conversations
            <MessageSquare size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 md:px-6 bg-dark-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            The AI Knowledge Loss Problem
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-dark-secondary/50 rounded-lg p-6 border border-red-400/30">
              <h3 className="text-xl font-semibold mb-3 text-red-400">Without AI Preservation</h3>
              <ul className="space-y-2 text-text-secondary">
                <li>• Lost conversations after closing tabs</li>
                <li>• Can't find that perfect explanation again</li>
                <li>• No context for why AI suggested that solution</li>
                <li>• Scattered across multiple AI tools</li>
                <li>• No way to track solution evolution</li>
              </ul>
            </div>
            
            <div className="bg-dark-secondary/50 rounded-lg p-6 border border-accent-green/30">
              <h3 className="text-xl font-semibold mb-3 text-accent-green">With DevLog</h3>
              <ul className="space-y-2 text-text-secondary">
                <li>• Every conversation saved permanently</li>
                <li>• Instant search across all AI interactions</li>
                <li>• Full context preserved with your code</li>
                <li>• Centralized in your knowledge base</li>
                <li>• Track how solutions improve over time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Built for Developers Who Use AI
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-dark-secondary/30 rounded-lg p-6 border border-dark-secondary 
                           hover:border-accent-green/30 transition-all group"
              >
                <div className="p-3 bg-dark-primary rounded-lg inline-block mb-4 
                                group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-6 bg-dark-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How AI Conversation Preservation Works
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-green rounded-full 
                              flex items-center justify-center text-dark-primary font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Create an AI Block</h3>
                <p className="text-text-secondary">
                  Add an AI conversation block to any document with a single slash command.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-green rounded-full 
                              flex items-center justify-center text-dark-primary font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Paste Your Conversation</h3>
                <p className="text-text-secondary">
                  Copy from ChatGPT, Claude, or any AI tool and paste directly into the block.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-green rounded-full 
                              flex items-center justify-center text-dark-primary font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Organize & Connect</h3>
                <p className="text-text-secondary">
                  Link AI conversations to related code blocks, documents, and projects.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-green rounded-full 
                              flex items-center justify-center text-dark-primary font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Search & Retrieve</h3>
                <p className="text-text-secondary">
                  Find any AI solution instantly with full-text search across all conversations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Building Your AI Knowledge Base
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join developers who never lose valuable AI-generated solutions.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-4 
                     bg-accent-green text-dark-primary rounded-lg font-medium text-lg
                     hover:bg-accent-green/80 transition-all group shadow-lg shadow-accent-green/20"
          >
            Try DevLog Free for 14 Days
            <MessageSquare size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-text-secondary">
            No credit card required • 2-minute setup • Cancel anytime
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