import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Code2, MessageSquare, FileText, FolderTree, Hash, Table, CheckSquare, Image } from 'lucide-react';

// Block types with their icons and colors
const BLOCK_TYPES = [
  { type: 'code', icon: Code2, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
  { type: 'ai', icon: MessageSquare, color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
  { type: 'text', icon: FileText, color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { type: 'fileTree', icon: FolderTree, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { type: 'tag', icon: Hash, color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
];

// Generate constellation nodes
function generateNodes(count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const type = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
    return {
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      type: type.type,
      icon: type.icon,
      color: type.color,
      glow: type.glow,
      size: Math.random() * 20 + 30,
      connections: [],
    };
  });
}

// Generate connections between nodes
function generateConnections(nodes) {
  const connections = [];
  nodes.forEach((node, i) => {
    // Each node connects to 1-3 other nodes
    const connectionCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < connectionCount; j++) {
      const targetIndex = Math.floor(Math.random() * nodes.length);
      if (targetIndex !== i) {
        connections.push({
          source: i,
          target: targetIndex,
          id: `${i}-${targetIndex}`,
        });
      }
    }
  });
  return connections;
}

export default function BlockConstellation() {
  const containerRef = useRef(null);
  const [nodes] = useState(() => generateNodes());
  const [connections] = useState(() => generateConnections(nodes));
  const [hoveredNode, setHoveredNode] = useState(null);
  const controls = useAnimation();

  // Floating animation for nodes
  useEffect(() => {
    controls.start((i) => ({
      x: [0, Math.sin(i * 0.1) * 10, 0],
      y: [0, Math.cos(i * 0.1) * 10, 0],
      transition: {
        duration: 10 + i * 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }));
  }, [controls]);

  return (
    <div ref={containerRef} className="block-constellation">
      {/* SVG for connections */}
      <svg className="constellation-connections">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>
        
        {connections.map((connection) => {
          const sourceNode = nodes[connection.source];
          const targetNode = nodes[connection.target];
          const isActive = hoveredNode === connection.source || hoveredNode === connection.target;
          
          return (
            <motion.line
              key={connection.id}
              x1={`${sourceNode.x}%`}
              y1={`${sourceNode.y}%`}
              x2={`${targetNode.x}%`}
              y2={`${targetNode.y}%`}
              stroke="url(#connectionGradient)"
              strokeWidth={isActive ? 2 : 1}
              opacity={isActive ? 0.6 : 0.2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: Math.random() * 2 }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const Icon = node.icon;
        const isHovered = hoveredNode === i;
        
        return (
          <motion.div
            key={node.id}
            className="constellation-node"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: node.size,
              height: node.size,
            }}
            custom={i}
            animate={controls}
            onMouseEnter={() => setHoveredNode(i)}
            onMouseLeave={() => setHoveredNode(null)}
            whileHover={{ scale: 1.2 }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            {/* Glow effect */}
            <motion.div
              className="node-glow"
              style={{
                background: `radial-gradient(circle, ${node.glow} 0%, transparent 70%)`,
              }}
              animate={{
                scale: isHovered ? 1.5 : 1,
                opacity: isHovered ? 0.8 : 0.4,
              }}
            />
            
            {/* Node content */}
            <div
              className="node-content"
              style={{
                background: `linear-gradient(135deg, ${node.color}20 0%, ${node.color}10 100%)`,
                border: `1px solid ${node.color}40`,
              }}
            >
              <Icon size={node.size * 0.4} color={node.color} />
            </div>
            
            {/* Pulse animation */}
            <motion.div
              className="node-pulse"
              style={{
                border: `1px solid ${node.color}`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          </motion.div>
        );
      })}
      
      {/* Transform indicator */}
      <motion.div
        className="transform-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 4,
          times: [0, 0.1, 0.9, 1],
          repeat: Infinity,
          repeatDelay: 6,
        }}
      >
        <div className="transform-text">
          <Code2 size={16} /> → <FileText size={16} />
          <span>Transform blocks instantly</span>
        </div>
      </motion.div>
    </div>
  );
}