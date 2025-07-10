import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, RotateCcw, Search, Save, Link2, 
  Code2, MessageSquare, FolderTree, Clock, Zap, CheckCircle,
  AlertCircle, ChevronRight, Copy, GitBranch, Users, Brain
} from 'lucide-react';

// Helper component for file tree rendering
const FileTreeComponent = ({ tree, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div style={{ marginLeft: level * 20 }}>
      <div 
        className="flex items-center gap-2 py-1 cursor-pointer hover:text-accent-green transition-colors"
        onClick={() => tree.children && setExpanded(!expanded)}
      >
        {tree.children ? (
          <>
            <span className="text-text-secondary">{expanded ? '▼' : '▶'}</span>
            <FolderTree size={16} />
            <span>{tree.name}</span>
          </>
        ) : (
          <>
            <span className="ml-6">📄</span>
            <span className="text-gray-400">{tree.name}</span>
          </>
        )}
      </div>
      {expanded && tree.children && (
        <div>
          {tree.children.map((child, i) => (
            <FileTreeComponent key={i} tree={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function EnhancedInteractiveDemo() {
  const [currentWorkflow, setCurrentWorkflow] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const intervalRef = useRef(null);

  const workflows = [
    {
      id: 'debug',
      title: 'Debug Session Documentation',
      icon: <AlertCircle size={20} />,
      description: 'Never lose another debugging solution',
      steps: [
        {
          title: 'Encountering an Error',
          content: {
            type: 'error',
            message: 'TypeError: Cannot read property \'map\' of undefined',
            code: 'const items = response.data.items.map(item => item.name)',
            context: 'Debugging a React component data fetch issue'
          },
          duration: 3000
        },
        {
          title: 'Create New Document',
          content: {
            type: 'create',
            documentTitle: 'React Data Fetch Error - Dec 2024',
            tags: ['#react', '#debugging', '#api']
          },
          duration: 2000
        },
        {
          title: 'Save Error Context',
          content: {
            type: 'text',
            text: '## Error Context\\n\\nGetting undefined when trying to map over API response in ProductList component.\\n\\nError occurs after deploying to production, works fine locally.'
          },
          duration: 3000
        },
        {
          title: 'Preserve AI Solution',
          content: {
            type: 'ai',
            messages: [
              { role: 'user', text: 'Why does response.data.items return undefined in production but not locally?' },
              { role: 'ai', text: 'This often happens due to API response structure differences. In production, the API might return data in a different format. Add defensive checks:\\n\\n`const items = response?.data?.items || []`\\n\\nAlso check if your production API has different response wrapping.' }
            ]
          },
          duration: 4000
        },
        {
          title: 'Add Working Solution',
          content: {
            type: 'code',
            language: 'javascript',
            filePath: 'src/components/ProductList.jsx',
            code: `// Fixed version with defensive checks
const fetchProducts = async () => {
  try {
    const response = await api.get('/products');
    // Handle different response structures
    const items = response?.data?.items || response?.data || [];
    setProducts(Array.isArray(items) ? items : []);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    setProducts([]);
  }
};`
          },
          duration: 4000
        },
        {
          title: 'Search Later',
          content: {
            type: 'search',
            query: 'undefined map production',
            results: [
              { title: 'React Data Fetch Error - Dec 2024', match: '...response.data.items returns undefined in production...' }
            ]
          },
          duration: 3000
        }
      ]
    },
    {
      id: 'learning',
      title: 'Learning New Concepts',
      icon: <Brain size={20} />,
      description: 'Build your personal knowledge base',
      steps: [
        {
          title: 'Studying React Hooks',
          content: {
            type: 'learning',
            topic: 'React Custom Hooks',
            source: 'Reading documentation and tutorials'
          },
          duration: 2000
        },
        {
          title: 'Organize with Structure',
          content: {
            type: 'structured',
            blocks: [
              { type: 'heading', text: '# React Custom Hooks Guide' },
              { type: 'heading', text: '## What are Custom Hooks?' },
              { type: 'text', text: 'Functions that start with "use" and can call other hooks. They enable logic reuse between components.' }
            ]
          },
          duration: 3000
        },
        {
          title: 'Add Code Examples',
          content: {
            type: 'code',
            language: 'javascript',
            filePath: 'hooks/useLocalStorage.js',
            code: `export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}`
          },
          duration: 4000
        },
        {
          title: 'Link Related Concepts',
          content: {
            type: 'links',
            connections: [
              { from: 'Custom Hooks Guide', to: 'useState Deep Dive' },
              { from: 'Custom Hooks Guide', to: 'Performance Optimization' },
              { from: 'useLocalStorage', to: 'Browser Storage APIs' }
            ]
          },
          duration: 3000
        },
        {
          title: 'Quick Knowledge Access',
          content: {
            type: 'search',
            query: 'useLocalStorage',
            instant: true,
            results: [
              { title: 'Custom Hooks Guide', snippet: 'useLocalStorage implementation' },
              { title: 'Browser Storage APIs', snippet: 'localStorage vs sessionStorage' }
            ]
          },
          duration: 2000
        }
      ]
    },
    {
      id: 'team',
      title: 'Team Knowledge Sharing',
      icon: <Users size={20} />,
      description: 'Collaborate on documentation',
      steps: [
        {
          title: 'Document API Endpoint',
          content: {
            type: 'api',
            title: 'User Authentication API',
            description: 'Documenting our auth flow for the team'
          },
          duration: 2000
        },
        {
          title: 'Add Request Examples',
          content: {
            type: 'code',
            language: 'bash',
            filePath: 'api/auth/login.sh',
            code: `# POST /api/auth/login
curl -X POST https://api.devlog.app/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'`
          },
          duration: 3000
        },
        {
          title: 'Response Documentation',
          content: {
            type: 'code',
            language: 'json',
            filePath: 'api/auth/responses.json',
            code: `// Success Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "role": "developer"
    },
    "token": "jwt_token_here",
    "expiresIn": 3600
  }
}`
          },
          duration: 3000
        },
        {
          title: 'Project Structure',
          content: {
            type: 'filetree',
            tree: {
              name: 'auth-service',
              children: [
                { name: 'controllers', type: 'folder' },
                { name: 'middleware', type: 'folder' },
                { name: 'models', type: 'folder' },
                { name: 'routes', type: 'folder' }
              ]
            }
          },
          duration: 2500
        },
        {
          title: 'Team Collaboration',
          content: {
            type: 'collaboration',
            activities: [
              { user: 'Sarah', action: 'added error handling docs' },
              { user: 'Marcus', action: 'updated response schemas' },
              { user: 'You', action: 'added integration examples' }
            ]
          },
          duration: 3000
        }
      ]
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      const workflow = workflows[currentWorkflow];
      const step = workflow.steps[currentStep];
      
      intervalRef.current = setTimeout(() => {
        if (currentStep < workflow.steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else if (currentWorkflow < workflows.length - 1) {
          setCurrentWorkflow(currentWorkflow + 1);
          setCurrentStep(0);
        } else {
          setIsPlaying(false);
        }
      }, step.duration);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, currentWorkflow, currentStep]);

  // Typing animation effect
  useEffect(() => {
    const step = workflows[currentWorkflow].steps[currentStep];
    if (step.content.type === 'text' || step.content.type === 'code') {
      const text = step.content.text || step.content.code || '';
      let index = 0;
      setTypedText('');
      
      const typeInterval = setInterval(() => {
        if (index < text.length) {
          setTypedText(text.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [currentWorkflow, currentStep]);

  const handleStepClick = (workflowIndex, stepIndex) => {
    setCurrentWorkflow(workflowIndex);
    setCurrentStep(stepIndex);
    setIsPlaying(false);
  };

  const renderStepContent = () => {
    const workflow = workflows[currentWorkflow];
    const step = workflow.steps[currentStep];
    const content = step.content;

    switch (content.type) {
      case 'error':
        return (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="font-semibold text-red-400 mb-1">{content.message}</div>
                  <div className="text-sm text-text-secondary">{content.context}</div>
                </div>
              </div>
            </div>
            <div className="bg-dark-primary rounded-lg p-4 font-mono text-sm">
              <div className="text-red-400">{content.code}</div>
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="space-y-4">
            <div className="bg-dark-primary rounded-lg p-6 border-2 border-accent-green/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent-green/20 rounded">
                  <Code2 className="text-accent-green" size={20} />
                </div>
                <input
                  type="text"
                  value={content.documentTitle}
                  readOnly
                  className="flex-1 bg-transparent text-xl font-semibold outline-none"
                />
              </div>
              <div className="flex gap-2">
                {content.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-accent-green/10 text-accent-green rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="px-4 py-2 bg-accent-green text-dark-primary rounded font-medium">
                Create Document
              </div>
            </div>
          </div>
        );

      case 'text':
      case 'code':
        return (
          <div className="bg-dark-primary rounded-lg p-4 border border-dark-primary/50">
            {content.type === 'code' && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {content.language}
                  </div>
                  <div className="text-text-secondary text-sm">{content.filePath}</div>
                </div>
                <Copy size={16} className="text-text-secondary cursor-pointer hover:text-text-primary" />
              </div>
            )}
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {typedText}
              <span className="animate-pulse">|</span>
            </pre>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-3">
            {content.messages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-accent-green/20 text-text-primary' 
                    : 'bg-dark-primary text-text-primary border border-dark-primary/50'
                }`}>
                  <div className="text-xs text-text-secondary mb-1">
                    {msg.role === 'user' ? 'You' : 'Claude'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <div className="bg-dark-primary rounded-lg p-3 flex items-center gap-3">
              <Search size={20} className="text-text-secondary" />
              <input
                type="text"
                value={content.query}
                readOnly
                className="flex-1 bg-transparent outline-none"
              />
              <div className="text-xs text-accent-green">⏎</div>
            </div>
            {content.results && (
              <div className="space-y-2">
                {content.results.map((result, i) => (
                  <div key={i} className="bg-dark-primary rounded-lg p-4 border border-accent-green/30 cursor-pointer hover:border-accent-green/50 transition-all">
                    <div className="font-semibold text-accent-green mb-1">{result.title}</div>
                    {result.match && (
                      <div className="text-sm text-text-secondary">{result.match}</div>
                    )}
                    {result.snippet && (
                      <div className="text-sm text-text-secondary">{result.snippet}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'links':
        return (
          <div className="relative h-64">
            {content.connections.map((conn, i) => (
              <div key={i} className="absolute" style={{ top: `${i * 80}px`, left: '50px' }}>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-2 bg-dark-primary rounded border border-dark-primary/50">
                    {conn.from}
                  </div>
                  <Link2 size={20} className="text-accent-green" />
                  <div className="px-3 py-2 bg-dark-primary rounded border border-dark-primary/50">
                    {conn.to}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'collaboration':
        return (
          <div className="space-y-3">
            {content.activities.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-dark-primary rounded">
                <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center text-xs font-semibold">
                  {activity.user[0]}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-text-secondary ml-2">{activity.action}</span>
                </div>
                <Clock size={16} className="text-text-secondary" />
              </div>
            ))}
          </div>
        );

      case 'learning':
        return (
          <div className="text-center p-8">
            <div className="inline-flex p-4 bg-accent-green/10 rounded-lg mb-4">
              <Brain className="text-accent-green" size={32} />
            </div>
            <h4 className="text-xl font-semibold mb-2">{content.topic}</h4>
            <p className="text-text-secondary">{content.source}</p>
          </div>
        );

      case 'structured':
        return (
          <div className="space-y-3">
            {content.blocks.map((block, i) => (
              <div key={i} className="bg-dark-primary rounded p-4">
                {block.type === 'heading' ? (
                  <div className={`font-semibold ${
                    block.text.startsWith('# ') ? 'text-2xl' : 'text-xl'
                  }`}>
                    {block.text.replace(/^#+\s/, '')}
                  </div>
                ) : (
                  <div className="text-text-secondary">{block.text}</div>
                )}
              </div>
            ))}
          </div>
        );

      case 'api':
        return (
          <div className="bg-dark-primary rounded-lg p-6 border border-dark-primary/50">
            <div className="flex items-center gap-3 mb-3">
              <Code2 className="text-accent-green" size={24} />
              <h4 className="text-xl font-semibold">{content.title}</h4>
            </div>
            <p className="text-text-secondary">{content.description}</p>
          </div>
        );

      case 'filetree':
        return (
          <div className="bg-dark-primary rounded-lg p-4">
            <FileTreeComponent tree={content.tree} />
          </div>
        );

      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <section id="demo" className="py-20 px-6 bg-dark-secondary/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">See Devlog in Action</h3>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Watch real developer workflows and see how Devlog transforms your documentation process
          </p>
        </div>

        {/* Workflow Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {workflows.map((workflow, index) => (
            <button
              key={workflow.id}
              onClick={() => {
                setCurrentWorkflow(index);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg border transition-all ${
                currentWorkflow === index
                  ? 'bg-accent-green/20 border-accent-green text-accent-green'
                  : 'bg-dark-secondary border-dark-secondary/50 hover:border-accent-green/30'
              }`}
            >
              {workflow.icon}
              <div className="text-left">
                <div className="font-semibold">{workflow.title}</div>
                <div className="text-xs text-text-secondary">{workflow.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Container */}
        <div className="bg-dark-secondary rounded-lg overflow-hidden shadow-2xl">
          {/* Progress Bar */}
          <div className="bg-dark-primary/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              {workflows[currentWorkflow].steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => handleStepClick(currentWorkflow, index)}
                  className={`flex-1 relative`}
                >
                  <div className={`h-2 rounded-full transition-all ${
                    index <= currentStep ? 'bg-accent-green' : 'bg-dark-primary'
                  }`} />
                  <div className={`absolute -bottom-6 left-0 right-0 text-xs text-center whitespace-nowrap overflow-hidden text-ellipsis px-2 ${
                    index === currentStep ? 'text-accent-green' : 'text-text-secondary'
                  }`}>
                    {step.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 min-h-[400px] mt-6">
            <div className="max-w-3xl mx-auto">
              {renderStepContent()}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-dark-primary/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentWorkflow(0);
                  setCurrentStep(0);
                  setIsPlaying(false);
                }}
                className="p-2 hover:bg-dark-primary rounded transition-colors"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-4 py-2 bg-accent-green text-dark-primary rounded font-medium hover:bg-accent-green/80 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pause' : 'Play Demo'}
              </button>
              
              <button
                onClick={() => {
                  const workflow = workflows[currentWorkflow];
                  if (currentStep < workflow.steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  } else if (currentWorkflow < workflows.length - 1) {
                    setCurrentWorkflow(currentWorkflow + 1);
                    setCurrentStep(0);
                  }
                }}
                className="p-2 hover:bg-dark-primary rounded transition-colors"
                disabled={currentWorkflow === workflows.length - 1 && currentStep === workflows[currentWorkflow].steps.length - 1}
              >
                <SkipForward size={20} />
              </button>
            </div>

            <div className="text-sm text-text-secondary">
              Workflow {currentWorkflow + 1} of {workflows.length}
            </div>
          </div>
        </div>

        {/* Feature Callouts */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="inline-flex p-3 bg-accent-green/10 rounded-lg mb-3">
              <Zap className="text-accent-green" size={24} />
            </div>
            <h4 className="font-semibold mb-2">Instant Capture</h4>
            <p className="text-sm text-text-secondary">
              Save code, errors, and AI conversations without breaking flow
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex p-3 bg-accent-green/10 rounded-lg mb-3">
              <Search className="text-accent-green" size={24} />
            </div>
            <h4 className="font-semibold mb-2">Lightning Search</h4>
            <p className="text-sm text-text-secondary">
              Find any solution in milliseconds with full-text search
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex p-3 bg-accent-green/10 rounded-lg mb-3">
              <GitBranch className="text-accent-green" size={24} />
            </div>
            <h4 className="font-semibold mb-2">Version Tracking</h4>
            <p className="text-sm text-text-secondary">
              See how your solutions evolved with automatic versioning
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}