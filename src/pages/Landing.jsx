import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoMinimal from '../components/LogoMinimal';
import { ChevronRight, Code2, Brain, Link2, Shield, Zap, GitBranch, FileCode, MessageSquare, Table, FolderTree, Heading } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState('code');

  // Demo content for different block types
  const demoContent = {
    code: {
      icon: <Code2 size={20} />,
      title: 'Code Blocks',
      content: `function fibonacci(n) {
  if (n <= 1) return n;
  
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  
  return dp[n];
}`,
      language: 'javascript',
      features: ['Syntax highlighting', 'File path tracking', 'Version history']
    },
    ai: {
      icon: <MessageSquare size={20} />,
      title: 'AI Conversations',
      content: [
        { role: 'user', text: 'How do I optimize React re-renders?' },
        { role: 'ai', text: 'Use React.memo() for components, useMemo() for expensive calculations, and useCallback() for function props. Also consider state placement - lift state only when necessary.' }
      ],
      features: ['Preserve ChatGPT/Claude chats', 'Editable messages', 'Markdown support']
    },
    tree: {
      icon: <FolderTree size={20} />,
      title: 'File Trees',
      content: {
        name: 'src',
        type: 'folder',
        children: [
          { name: 'components', type: 'folder', children: [
            { name: 'Dashboard.jsx', type: 'file' },
            { name: 'Block.jsx', type: 'file' }
          ]},
          { name: 'utils', type: 'folder', children: [
            { name: 'storage.js', type: 'file' }
          ]}
        ]
      },
      features: ['Visual project structure', 'Drag & drop organization', 'Links to code blocks']
    }
  };

  const features = [
    {
      icon: <Zap className="text-accent-green" size={32} />,
      title: 'Lightning Fast',
      description: 'Instant saves, keyboard shortcuts, and zero loading states. Built for developer speed.'
    },
    {
      icon: <Brain className="text-accent-green" size={32} />,
      title: 'Knowledge Graph',
      description: 'Link documents with [[connections]], build your personal wiki naturally.'
    },
    {
      icon: <Shield className="text-accent-green" size={32} />,
      title: 'Your Data, Your Control',
      description: 'Row-level security, offline-first design, and full export capabilities.'
    },
    {
      icon: <GitBranch className="text-accent-green" size={32} />,
      title: 'Version Tracking',
      description: 'Track code evolution, see what changed, and understand your learning journey.'
    },
    {
      icon: <Link2 className="text-accent-green" size={32} />,
      title: 'Everything Connected',
      description: 'Documents link naturally, tags organize automatically, search finds instantly.'
    },
    {
      icon: <FileCode className="text-accent-green" size={32} />,
      title: 'Developer First',
      description: 'Code blocks that understand context, file paths, and your workflow.'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-primary/80 backdrop-blur-md border-b border-dark-secondary/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMinimal size={32} />
            <h1 className="text-xl font-semibold">Devlog</h1>
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
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Where Your Developer Journey
              <br />
              <span className="text-accent-green">Becomes Knowledge</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
              Not just documentation. A living, breathing extension of your developer mind. 
              Capture every line of code, every debugging session, and every "aha!" moment.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-green text-dark-primary 
                           rounded-lg font-medium hover:bg-accent-green/80 transition-all group"
              >
                Start Building Your Second Brain
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 border border-dark-secondary text-text-primary rounded-lg 
                           hover:border-accent-green/50 hover:text-accent-green transition-all"
              >
                See It In Action
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-green mb-1">∞</div>
              <div className="text-text-secondary">Block Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-green mb-1">0ms</div>
              <div className="text-text-secondary">Save Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-green mb-1">100%</div>
              <div className="text-text-secondary">Your Data</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-20 px-6 bg-dark-secondary/20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-4">See Devlog in Action</h3>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Everything is a block. This simple concept unlocks infinite flexibility.
          </p>

          <div className="bg-dark-secondary rounded-lg border border-dark-secondary/50 overflow-hidden">
            {/* Demo Tabs */}
            <div className="border-b border-dark-primary/50 p-4 flex gap-2 overflow-x-auto">
              {Object.entries(demoContent).map(([key, demo]) => (
                <button
                  key={key}
                  onClick={() => setActiveDemo(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-all whitespace-nowrap ${
                    activeDemo === key
                      ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-primary/50'
                  }`}
                >
                  {demo.icon}
                  <span>{demo.title}</span>
                </button>
              ))}
            </div>

            {/* Demo Content */}
            <div className="p-6">
              {activeDemo === 'code' && (
                <div className="space-y-4">
                  <div className="bg-dark-primary rounded border border-dark-primary/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {demoContent.code.language}
                        </div>
                        <div className="text-text-secondary text-sm">utils/algorithms.js</div>
                      </div>
                      <div className="text-text-secondary text-xs">v3</div>
                    </div>
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{demoContent.code.content}</code>
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    {demoContent.code.features.map((feature, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-accent-green/10 text-accent-green rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeDemo === 'ai' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {demoContent.ai.content.map((msg, i) => (
                      <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-accent-green/20 text-text-primary' 
                            : 'bg-dark-primary text-text-primary'
                        }`}>
                          <div className="text-xs text-text-secondary mb-1">
                            {msg.role === 'user' ? 'You' : 'Claude'}
                          </div>
                          <div className="text-sm">{msg.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {demoContent.ai.features.map((feature, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-accent-green/10 text-accent-green rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeDemo === 'tree' && (
                <div className="space-y-4">
                  <div className="bg-dark-primary rounded border border-dark-primary/50 p-4">
                    <TreeNode node={demoContent.tree.content} />
                  </div>
                  <div className="flex gap-2">
                    {demoContent.tree.features.map((feature, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-accent-green/10 text-accent-green rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-4">Built for Real Developer Workflows</h3>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Every feature is designed to make capturing and connecting knowledge faster and more natural.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="bg-dark-secondary/30 border border-dark-secondary/50 rounded-lg p-6
                           hover:border-accent-green/30 hover:bg-dark-secondary/40 transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-dark-secondary/20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Transform How You Document</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-dark-secondary/50 rounded-lg p-6 border border-dark-secondary/50">
              <h4 className="text-xl font-semibold mb-3 text-accent-green">Learning & Exploration</h4>
              <p className="text-text-secondary mb-4">
                Create deep dives into new technologies. Link concepts, preserve AI explanations, 
                and build your understanding through connections.
              </p>
              <div className="text-sm font-mono text-text-secondary/70">
                [[React Performance]] → [[useMemo Patterns]] → [[React.memo Usage]]
              </div>
            </div>

            <div className="bg-dark-secondary/50 rounded-lg p-6 border border-dark-secondary/50">
              <h4 className="text-xl font-semibold mb-3 text-accent-green">Debugging Sessions</h4>
              <p className="text-text-secondary mb-4">
                Never lose another solution. Document errors, steps taken, and final fixes. 
                Your future self will thank you.
              </p>
              <div className="text-sm font-mono text-text-secondary/70">
                [[WebSocket Issues Dec 2024]] → [[WebSocket Best Practices]]
              </div>
            </div>

            <div className="bg-dark-secondary/50 rounded-lg p-6 border border-dark-secondary/50">
              <h4 className="text-xl font-semibold mb-3 text-accent-green">Project Documentation</h4>
              <p className="text-text-secondary mb-4">
                Living documentation that evolves with your project. Architecture decisions, 
                code examples, and design patterns all interconnected.
              </p>
              <div className="text-sm font-mono text-text-secondary/70">
                [[E-Commerce Architecture]] → [[API Design]] → [[Database Schema]]
              </div>
            </div>

            <div className="bg-dark-secondary/50 rounded-lg p-6 border border-dark-secondary/50">
              <h4 className="text-xl font-semibold mb-3 text-accent-green">Knowledge Building</h4>
              <p className="text-text-secondary mb-4">
                Your personal wiki emerges naturally. Tag concepts, link ideas, and watch 
                your knowledge compound over time.
              </p>
              <div className="text-sm font-mono text-text-secondary/70">
                #performance[memoization] #gotcha[async behavior] #pattern[singleton]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold mb-6">
            Your Journey in Code Deserves to Be Remembered
          </h3>
          <p className="text-xl text-text-secondary mb-8">
            Start building your second brain with Devlog. Because the best documentation 
            is the one that grows with you.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-green text-dark-primary 
                       rounded-lg font-medium text-lg hover:bg-accent-green/80 transition-all group"
          >
            Start Your Journey Today
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-text-secondary/70 mt-4">
            No credit card required. Your data stays yours.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-dark-secondary/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMinimal size={24} />
            <span className="text-sm text-text-secondary">© 2025 Devlog</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <a 
              href="https://github.com/yourusername/devlog" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-accent-green transition-colors"
            >
              GitHub
            </a>
            <a 
              href="#" 
              className="hover:text-accent-green transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Tree Node Component for File Tree Demo
function TreeNode({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div style={{ marginLeft: level * 20 }}>
      <div 
        className="flex items-center gap-2 py-1 cursor-pointer hover:text-accent-green transition-colors"
        onClick={() => node.type === 'folder' && setExpanded(!expanded)}
      >
        {node.type === 'folder' ? (
          <>
            <span className="text-text-secondary">{expanded ? '▼' : '▶'}</span>
            <span>📁 {node.name}</span>
          </>
        ) : (
          <>
            <span className="ml-4">📄</span>
            <span className="text-gray-400">{node.name}</span>
          </>
        )}
      </div>
      {expanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}