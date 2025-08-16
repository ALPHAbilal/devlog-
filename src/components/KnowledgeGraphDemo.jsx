import { useState, useEffect, useRef } from 'react';
import { Code2, GitBranch, Database, Shield, Zap, Globe, Server, Lock } from 'lucide-react';

// Define the knowledge nodes and their connections
const knowledgeNodes = [
  {
    id: 'react-hooks',
    label: 'React Hooks',
    icon: <Code2 size={16} />,
    x: 50,
    y: 50,
    connections: ['performance', 'testing', 'state-management'],
    content: 'Custom useDebounce, useLocalStorage, useFetch patterns'
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: <Zap size={16} />,
    x: 25,
    y: 25,
    connections: ['react-hooks', 'webpack', 'database'],
    content: 'Memoization, lazy loading, bundle optimization'
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: <Shield size={16} />,
    x: 75,
    y: 25,
    connections: ['react-hooks', 'ci-cd'],
    content: 'Jest configs, React Testing Library patterns'
  },
  {
    id: 'state-management',
    label: 'State Management',
    icon: <Database size={16} />,
    x: 75,
    y: 75,
    connections: ['react-hooks', 'redux-patterns'],
    content: 'Redux, Zustand, Context optimization'
  },
  {
    id: 'webpack',
    label: 'Webpack',
    icon: <GitBranch size={16} />,
    x: 25,
    y: 75,
    connections: ['performance', 'docker'],
    content: 'Config snippets, optimization plugins'
  },
  {
    id: 'docker',
    label: 'Docker',
    icon: <Server size={16} />,
    x: 15,
    y: 50,
    connections: ['webpack', 'ci-cd'],
    content: 'Multi-stage builds, compose files'
  },
  {
    id: 'ci-cd',
    label: 'CI/CD',
    icon: <GitBranch size={16} />,
    x: 50,
    y: 15,
    connections: ['testing', 'docker'],
    content: 'GitHub Actions, deployment scripts'
  },
  {
    id: 'database',
    label: 'Database',
    icon: <Database size={16} />,
    x: 50,
    y: 85,
    connections: ['performance', 'security'],
    content: 'Query optimization, migration scripts'
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Lock size={16} />,
    x: 85,
    y: 50,
    connections: ['database', 'cors-setup'],
    content: 'Auth patterns, JWT implementation'
  },
  {
    id: 'cors-setup',
    label: 'CORS Setup',
    icon: <Globe size={16} />,
    x: 90,
    y: 30,
    connections: ['security', 'api-design'],
    content: 'Express CORS configs for different environments'
  },
  {
    id: 'api-design',
    label: 'API Design',
    icon: <Server size={16} />,
    x: 90,
    y: 70,
    connections: ['cors-setup', 'database'],
    content: 'REST patterns, GraphQL schemas'
  },
  {
    id: 'redux-patterns',
    label: 'Redux Patterns',
    icon: <Code2 size={16} />,
    x: 60,
    y: 60,
    connections: ['state-management'],
    content: 'Async actions, middleware setup'
  }
];

export default function KnowledgeGraphDemo() {
  const [activeNode, setActiveNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [clickPrompt, setClickPrompt] = useState(true);
  const svgRef = useRef(null);

  // Auto-activate a node for demonstration
  useEffect(() => {
    const demo = setTimeout(() => {
      setActiveNode('react-hooks');
      setClickPrompt(false);
    }, 2000);

    return () => clearTimeout(demo);
  }, []);

  const handleNodeClick = (nodeId) => {
    setActiveNode(nodeId);
    setClickPrompt(false);
  };

  const getNodePosition = (node) => ({
    x: `${node.x}%`,
    y: `${node.y}%`
  });

  const isConnected = (nodeId) => {
    if (!activeNode) return false;
    const active = knowledgeNodes.find(n => n.id === activeNode);
    return active?.connections.includes(nodeId) || 
           knowledgeNodes.find(n => n.id === nodeId)?.connections.includes(activeNode);
  };

  return (
    <section className="py-20 px-4 md:px-6 bg-dark-primary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See Your Knowledge <span className="text-accent-green">Connected</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Every solution you save becomes part of your searchable knowledge graph. 
            Related concepts link automatically, creating your personal documentation network.
          </p>
        </div>

        <div className="relative bg-dark-secondary rounded-lg p-8 border border-dark-secondary/50">
          {/* Click prompt */}
          {clickPrompt && (
            <div className="absolute top-4 left-4 bg-accent-green/10 text-accent-green 
                            px-3 py-2 rounded-lg text-sm animate-pulse z-20">
              Click any node to explore connections
            </div>
          )}

          {/* Graph container */}
          <div className="relative h-[500px] overflow-hidden">
            {/* SVG for connection lines */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              {knowledgeNodes.map(node => 
                node.connections.map(targetId => {
                  const target = knowledgeNodes.find(n => n.id === targetId);
                  if (!target) return null;
                  
                  const isActive = activeNode && (
                    node.id === activeNode || 
                    target.id === activeNode ||
                    (isConnected(node.id) && isConnected(target.id))
                  );
                  
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={isActive ? '#10b981' : '#1e3a5f'}
                      strokeWidth={isActive ? 2 : 1}
                      opacity={isActive ? 1 : 0.3}
                      className="transition-all duration-300"
                    />
                  );
                })
              )}
            </svg>

            {/* Nodes */}
            {knowledgeNodes.map(node => {
              const isActive = node.id === activeNode;
              const isRelated = isConnected(node.id);
              const position = getNodePosition(node);
              
              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                             transition-all duration-300 cursor-pointer z-10
                             ${isActive ? 'scale-125' : 'scale-100'}
                             ${isRelated && !isActive ? 'scale-110' : ''}`}
                  style={{ left: position.x, top: position.y }}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg
                    ${isActive 
                      ? 'bg-accent-green text-dark-primary' 
                      : isRelated
                        ? 'bg-dark-primary border-2 border-accent-green/50 text-accent-green'
                        : 'bg-dark-primary border border-dark-secondary text-text-secondary hover:text-text-primary hover:border-accent-green/30'
                    }
                  `}>
                    {node.icon}
                    <span className="text-xs font-medium whitespace-nowrap">{node.label}</span>
                  </div>

                  {/* Tooltip */}
                  {hoveredNode === node.id && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                                    bg-dark-primary border border-accent-green/30 rounded-lg p-3 
                                    shadow-xl z-20 w-48 pointer-events-none">
                      <p className="text-xs text-text-secondary">{node.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active node details */}
          {activeNode && (
            <div className="mt-8 p-4 bg-dark-primary rounded-lg border border-accent-green/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-text-primary">
                  {knowledgeNodes.find(n => n.id === activeNode)?.label}
                </h3>
                <span className="text-xs text-accent-green">
                  {knowledgeNodes.find(n => n.id === activeNode)?.connections.length} connections
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                {knowledgeNodes.find(n => n.id === activeNode)?.content}
              </p>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">Automatic</div>
            <p className="text-text-secondary">Links form naturally as you save solutions</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">Searchable</div>
            <p className="text-text-secondary">Find any solution in milliseconds</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-green mb-2">Contextual</div>
            <p className="text-text-secondary">See why and how solutions work</p>
          </div>
        </div>
      </div>
    </section>
  );
}