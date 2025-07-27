import { motion } from 'framer-motion';
import { FileText, Link2, Hash, Search, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

// Sample knowledge graph nodes
const GRAPH_NODES = [
  { id: 1, title: 'API Integration', x: 20, y: 30, links: [2, 3, 5] },
  { id: 2, title: 'Error Handling', x: 50, y: 20, links: [1, 4] },
  { id: 3, title: 'Auth Flow', x: 80, y: 40, links: [1, 5] },
  { id: 4, title: 'CORS Solution', x: 30, y: 60, links: [2, 5] },
  { id: 5, title: 'Best Practices', x: 60, y: 70, links: [1, 3, 4] },
];

// Tag cloud items
const TAGS = [
  { name: 'react', count: 23, color: '#61dafb' },
  { name: 'typescript', count: 18, color: '#3178c6' },
  { name: 'api', count: 15, color: '#10b981' },
  { name: 'debug', count: 12, color: '#ef4444' },
  { name: 'performance', count: 9, color: '#8b5cf6' },
];

export default function KnowledgeGraph() {
  const [activeNode, setActiveNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Simulate search queries
  useEffect(() => {
    const queries = ['error handling', 'api integration', 'auth flow', 'performance'];
    let queryIndex = 0;

    const interval = setInterval(() => {
      setShowSearch(true);
      setSearchQuery(queries[queryIndex]);
      
      // Simulate finding a node
      setTimeout(() => {
        setActiveNode(Math.floor(Math.random() * GRAPH_NODES.length) + 1);
        setTimeout(() => {
          setShowSearch(false);
          setSearchQuery('');
          setActiveNode(null);
        }, 2000);
      }, 1000);

      queryIndex = (queryIndex + 1) % queries.length;
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="knowledge-graph">
      {/* Document nodes */}
      <svg className="graph-connections">
        {/* Draw connections */}
        {GRAPH_NODES.map((node) =>
          node.links.map((targetId) => {
            const target = GRAPH_NODES.find((n) => n.id === targetId);
            if (!target) return null;
            
            const isActive = activeNode === node.id || activeNode === targetId;
            
            return (
              <motion.line
                key={`${node.id}-${targetId}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={isActive ? '#10b981' : '#475569'}
                strokeWidth={isActive ? 2 : 1}
                opacity={isActive ? 0.8 : 0.2}
                strokeDasharray={isActive ? '0' : '5 5'}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: node.id * 0.1 }}
              />
            );
          })
        )}
      </svg>

      {/* Graph nodes */}
      {GRAPH_NODES.map((node) => {
        const isActive = activeNode === node.id;
        
        return (
          <motion.div
            key={node.id}
            className="graph-node"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isActive ? 1.2 : 1, 
              opacity: 1,
            }}
            transition={{ 
              delay: node.id * 0.1,
              scale: { type: "spring", stiffness: 300 }
            }}
            whileHover={{ scale: 1.1 }}
          >
            <div className={`node-icon ${isActive ? 'active' : ''}`}>
              <FileText size={16} />
            </div>
            <div className="node-title">{node.title}</div>
            
            {/* Link indicator */}
            <motion.div
              className="link-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0 }}
            >
              <Link2 size={12} />
              [[{node.title}]]
            </motion.div>
          </motion.div>
        );
      })}

      {/* Tag cloud */}
      <div className="tag-cloud">
        {TAGS.map((tag, i) => (
          <motion.div
            key={tag.name}
            className="tag-item"
            style={{ 
              fontSize: `${0.8 + tag.count / 20}rem`,
              color: tag.color,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: i * 0.2 }}
            whileHover={{ opacity: 1, scale: 1.1 }}
          >
            <Hash size={12} />
            {tag.name}
            <span className="tag-count">{tag.count}</span>
          </motion.div>
        ))}
      </div>

      {/* Search animation */}
      <motion.div
        className="search-animation"
        initial={{ opacity: 0 }}
        animate={{ opacity: showSearch ? 1 : 0 }}
      >
        <div className="search-box">
          <Search size={16} />
          <motion.span
            key={searchQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {searchQuery}
          </motion.span>
        </div>
        
        {/* Search traversal effect */}
        {showSearch && (
          <motion.div
            className="search-traverse"
            animate={{
              x: [0, 100, 200, 150],
              y: [0, -50, 30, -20],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
            }}
          >
            <Sparkles size={12} />
          </motion.div>
        )}
      </motion.div>

      {/* Folder structure hint */}
      <motion.div
        className="folder-structure"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 2 }}
      >
        <div className="folder-item">📁 Projects</div>
        <div className="folder-item indent">📁 API Development</div>
        <div className="folder-item indent-2">📄 Authentication</div>
        <div className="folder-item indent-2">📄 Error Handling</div>
        <div className="folder-item indent">📁 Frontend</div>
      </motion.div>
    </div>
  );
}