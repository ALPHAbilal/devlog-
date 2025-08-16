import { useState } from 'react';
import { FileText, Link2, Hash, ArrowRight, Plus, BookOpen, GitBranch } from 'lucide-react';

const demoDocuments = [
  {
    id: 1,
    title: 'CORS Configuration for Express.js',
    tags: ['cors', 'express', 'security', 'api'],
    links: ['Authentication Setup', 'API Rate Limiting'],
    content: `app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));`,
    lastUsed: '2 weeks ago',
    wordCount: 342
  },
  {
    id: 2,
    title: 'Authentication Setup',
    tags: ['auth', 'jwt', 'security'],
    links: ['CORS Configuration for Express.js', 'User Session Management'],
    content: 'JWT implementation with refresh tokens...',
    lastUsed: '3 days ago',
    wordCount: 567
  },
  {
    id: 3,
    title: 'React Custom Hooks Collection',
    tags: ['react', 'hooks', 'patterns'],
    links: ['State Management Patterns', 'Performance Optimization'],
    content: 'useDebounce, useLocalStorage, useFetch...',
    lastUsed: '1 day ago',
    wordCount: 892
  },
  {
    id: 4,
    title: 'Docker Multi-Stage Build',
    tags: ['docker', 'devops', 'optimization'],
    links: ['CI/CD Pipeline', 'Environment Variables'],
    content: 'Optimized Dockerfile for Node.js apps...',
    lastUsed: '1 week ago',
    wordCount: 445
  }
];

export default function LinkingDemo() {
  const [selectedDoc, setSelectedDoc] = useState(demoDocuments[0]);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'graph'

  return (
    <section className="py-20 px-4 md:px-6 bg-dark-primary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Build Your <span className="text-accent-green">Knowledge Network</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Every document you create becomes part of your personal knowledge base. 
            Link related concepts, tag by technology, and watch your expertise grow.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Your Documents */}
          <div className="space-y-4">
            <div className="bg-dark-secondary rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                  <BookOpen size={20} />
                  Your Knowledge Base
                </h3>
                <button className="flex items-center gap-1 px-3 py-1 bg-accent-green text-dark-primary 
                                 rounded text-sm font-medium hover:bg-accent-green/80 transition-colors">
                  <Plus size={16} />
                  New Document
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-4 border-b border-dark-secondary">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`pb-2 text-sm font-medium transition-all ${
                    activeTab === 'recent' 
                      ? 'text-accent-green border-b-2 border-accent-green' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Recent Documents
                </button>
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`pb-2 text-sm font-medium transition-all ${
                    activeTab === 'graph' 
                      ? 'text-accent-green border-b-2 border-accent-green' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Connection Map
                </button>
              </div>
              
              {activeTab === 'recent' ? (
                <div className="space-y-2">
                  {demoDocuments.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-3 rounded-lg cursor-pointer transition-all
                        ${selectedDoc.id === doc.id 
                          ? 'bg-accent-green/10 border border-accent-green/50' 
                          : 'bg-dark-primary hover:bg-dark-primary/70 border border-transparent'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-text-primary mb-1">{doc.title}</h4>
                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <span>{doc.lastUsed}</span>
                            <span>{doc.wordCount} words</span>
                            <span>{doc.links.length} links</span>
                          </div>
                        </div>
                        {doc.links.length > 0 && (
                          <GitBranch size={16} className="text-accent-green mt-1" />
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {doc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs text-accent-green">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="relative h-48 flex items-center justify-center">
                    {/* Simple connection visualization */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-8">
                        <div className="w-20 h-20 bg-accent-green/10 rounded-lg flex items-center justify-center">
                          <FileText size={24} className="text-accent-green" />
                        </div>
                        <div className="w-20 h-20 bg-accent-green/20 rounded-lg flex items-center justify-center">
                          <FileText size={28} className="text-accent-green" />
                        </div>
                        <div className="w-20 h-20 bg-accent-green/10 rounded-lg flex items-center justify-center">
                          <FileText size={24} className="text-accent-green" />
                        </div>
                      </div>
                      {/* Connection lines */}
                      <svg className="absolute inset-0 pointer-events-none">
                        <line x1="35%" y1="50%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" opacity="0.3" />
                        <line x1="50%" y1="50%" x2="65%" y2="50%" stroke="#10b981" strokeWidth="2" opacity="0.3" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mt-4">
                    Your documents form a connected knowledge graph through links and tags
                  </p>
                </div>
              )}
            </div>

            {/* Knowledge Stats */}
            <div className="bg-dark-secondary/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Your Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-accent-green">127</div>
                  <div className="text-xs text-text-secondary">Documents Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-green">342</div>
                  <div className="text-xs text-text-secondary">Connections Made</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-green">48</div>
                  <div className="text-xs text-text-secondary">Topics Tagged</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-green">89%</div>
                  <div className="text-xs text-text-secondary">Solutions Reused</div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Document */}
          <div className="bg-dark-secondary rounded-lg p-6">
            {selectedDoc && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      {selectedDoc.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedDoc.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-accent-green/10 
                                                   text-accent-green rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <FileText size={20} className="text-text-secondary" />
                </div>

                {/* Document content preview */}
                <div className="bg-dark-primary rounded-lg p-4 mb-6 font-mono text-sm">
                  <pre className="text-text-secondary">{selectedDoc.content}</pre>
                </div>

                {/* Linked documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                      <Link2 size={16} />
                      Connected Documents
                    </h4>
                    <button 
                      onClick={() => setShowLinkMenu(!showLinkMenu)}
                      className="text-xs text-accent-green hover:text-accent-green/80 flex items-center gap-1">
                      <Plus size={12} />
                      Add Connection
                    </button>
                  </div>
                  {selectedDoc.links.map(link => (
                    <div key={link} 
                         className="flex items-center gap-2 p-2 bg-dark-primary rounded
                                    hover:bg-dark-primary/70 cursor-pointer group transition-all">
                      <ArrowRight size={16} className="text-accent-green" />
                      <span className="text-sm text-text-primary group-hover:text-accent-green">
                        [[{link}]]
                      </span>
                    </div>
                  ))}
                  
                  {/* Link creation demo */}
                  {showLinkMenu && (
                    <div className="mt-2 p-3 bg-dark-primary rounded-lg border border-accent-green/30">
                      <p className="text-xs text-text-secondary mb-2">Start typing to link documents:</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-accent-green">[[</span>
                        <input 
                          type="text" 
                          placeholder="React Custom Hooks..."
                          className="bg-transparent outline-none text-sm text-text-primary flex-1"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Document metadata */}
                <div className="mt-6 pt-4 border-t border-dark-secondary/50 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>Created 3 months ago</span>
                    <span>Updated {selectedDoc.lastUsed}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">Document First</div>
            <p className="text-text-secondary">Capture solutions with full context as you discover them</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">Connect Naturally</div>
            <p className="text-text-secondary">Link related concepts and watch patterns emerge</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">Compound Knowledge</div>
            <p className="text-text-secondary">Your documentation grows more valuable over time</p>
          </div>
        </div>
      </div>
    </section>
  );
}