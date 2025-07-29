import { useEffect, useRef, useState } from 'react';
import { Code2, MessageSquare, FileText, AlertCircle, CheckCircle, GitBranch, Hash, Search } from 'lucide-react';

// Knowledge node types with their visual representations
const NODE_TYPES = [
  { 
    type: 'code', 
    icon: Code2, 
    color: '#3b82f6', 
    glow: '#60a5fa',
    label: 'Code Snippet',
    preview: '<function solve() />'
  },
  { 
    type: 'ai-chat', 
    icon: MessageSquare, 
    color: '#8b5cf6', 
    glow: '#a78bfa',
    label: 'AI Solution',
    preview: 'ChatGPT: "Try using..."'
  },
  { 
    type: 'documentation', 
    icon: FileText, 
    color: '#10b981', 
    glow: '#34d399',
    label: 'Documentation',
    preview: 'API Reference'
  },
  { 
    type: 'error', 
    icon: AlertCircle, 
    color: '#ef4444', 
    glow: '#f87171',
    label: 'Error Pattern',
    preview: 'TypeError: Cannot...'
  },
  { 
    type: 'solution', 
    icon: CheckCircle, 
    color: '#22c55e', 
    glow: '#4ade80',
    label: 'Solution',
    preview: '✓ Fixed by...'
  },
  { 
    type: 'version', 
    icon: GitBranch, 
    color: '#f59e0b', 
    glow: '#fbbf24',
    label: 'Version',
    preview: 'v2.1.0'
  },
  { 
    type: 'search', 
    icon: Search, 
    color: '#06b6d4', 
    glow: '#22d3ee',
    label: 'Search Query',
    preview: '"how to fix..."'
  }
];

export default function KnowledgeConstellation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, downPos: null });
  const animationRef = useRef(null);
  const gsapContextRef = useRef(null);
  const cursorFieldRef = useRef(null);
  const tempConnectionsRef = useRef([]);
  
  const [isVisible, setIsVisible] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  
  useEffect(() => {
    // Performance checks
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setIsVisible(false);
      return;
    }
    
    const gsap = window.gsap;
    if (!gsap) {
      console.error('GSAP not loaded');
      return;
    }
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    
    // Setup canvas
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize nodes
    const nodeCount = isMobile ? 20 : 40;
    const nodes = [];
    const connections = [];
    
    // Create knowledge nodes
    for (let i = 0; i < nodeCount; i++) {
      const type = NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)];
      const node = {
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        type: type.type,
        color: type.color,
        glow: type.glow,
        label: type.label,
        preview: type.preview,
        icon: type.icon,
        radius: isMobile ? 4 : 6,
        glowRadius: 0,
        opacity: 0,
        scale: 0,
        connections: [],
        discovered: false,
        labelOpacity: 0,
        previewOpacity: 0
      };
      nodes.push(node);
    }
    
    nodesRef.current = nodes;
    connectionsRef.current = connections;
    
    // GSAP context for animations
    gsapContextRef.current = gsap.context(() => {
      // Initial node appearance animation
      nodes.forEach((node, i) => {
        gsap.to(node, {
          opacity: 0.6,
          scale: 1,
          duration: 1,
          delay: i * 0.02,
          ease: "back.out(1.7)",
          onComplete: () => {
            // Start floating animation
            gsap.to(node, {
              x: `+=${(Math.random() - 0.5) * 100}`,
              y: `+=${(Math.random() - 0.5) * 100}`,
              duration: 10 + Math.random() * 10,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
          }
        });
      });
      
      // Create cursor field
      cursorFieldRef.current = {
        x: 0,
        y: 0,
        radius: 100,
        strength: 0
      };
      
      // Smooth cursor tracking
      gsap.ticker.add(() => {
        gsap.quickTo(cursorFieldRef.current, {
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
    
    // Mouse event handlers
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      
      // Update cursor field strength based on movement speed
      const speed = Math.sqrt(
        Math.pow(mouseRef.current.x - cursorFieldRef.current.x, 2) +
        Math.pow(mouseRef.current.y - cursorFieldRef.current.y, 2)
      );
      cursorFieldRef.current.strength = Math.min(speed / 10, 1);
    };
    
    const handleMouseDown = (e) => {
      if (e.button === 0) { // Left click only
        mouseRef.current.isDown = true;
        mouseRef.current.downPos = { 
          x: mouseRef.current.x, 
          y: mouseRef.current.y 
        };
      }
    };
    
    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
      mouseRef.current.downPos = null;
      
      // Clear temporary connections
      tempConnectionsRef.current = [];
    };
    
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Create knowledge ripple effect
      createKnowledgeRipple(clickX, clickY);
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('click', handleClick);
    
    // Create knowledge ripple
    const createKnowledgeRipple = (x, y) => {
      const ripple = {
        x,
        y,
        radius: 0,
        opacity: 0.8,
        maxRadius: 200
      };
      
      gsap.to(ripple, {
        radius: ripple.maxRadius,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          // Illuminate connected nodes
          nodes.forEach(node => {
            const distance = Math.sqrt(
              Math.pow(node.x - ripple.x, 2) + 
              Math.pow(node.y - ripple.y, 2)
            );
            
            if (distance < ripple.radius) {
              const intensity = 1 - (distance / ripple.radius);
              gsap.to(node, {
                glowRadius: 20 * intensity,
                opacity: Math.min(1, node.opacity + intensity * 0.4),
                duration: 0.3
              });
              
              // Auto-connect nearby nodes
              nodes.forEach(otherNode => {
                if (otherNode !== node) {
                  const nodeDist = Math.sqrt(
                    Math.pow(otherNode.x - node.x, 2) + 
                    Math.pow(otherNode.y - node.y, 2)
                  );
                  
                  if (nodeDist < 150 && distance < ripple.radius && 
                      Math.sqrt(Math.pow(otherNode.x - ripple.x, 2) + 
                      Math.pow(otherNode.y - ripple.y, 2)) < ripple.radius) {
                    createConnection(node, otherNode, true);
                  }
                }
              });
            }
          });
        },
        onComplete: () => {
          // Fade glow
          nodes.forEach(node => {
            gsap.to(node, {
              glowRadius: 0,
              opacity: 0.6,
              duration: 1
            });
          });
        }
      });
    };
    
    // Create connection between nodes
    const createConnection = (node1, node2, temporary = false) => {
      const existingConnection = connections.find(conn => 
        (conn.from === node1 && conn.to === node2) || 
        (conn.from === node2 && conn.to === node1)
      );
      
      if (!existingConnection) {
        const connection = {
          from: node1,
          to: node2,
          opacity: 0,
          strength: temporary ? 0.3 : 0.6,
          temporary,
          pulsePhase: 0
        };
        
        if (temporary) {
          tempConnectionsRef.current.push(connection);
          gsap.to(connection, {
            opacity: connection.strength,
            duration: 0.3,
            ease: "power2.out"
          });
          
          // Fade out temporary connections
          gsap.to(connection, {
            opacity: 0,
            duration: 2,
            delay: 3,
            onComplete: () => {
              const index = tempConnectionsRef.current.indexOf(connection);
              if (index > -1) {
                tempConnectionsRef.current.splice(index, 1);
              }
            }
          });
        } else {
          connections.push(connection);
          node1.connections.push(node2);
          node2.connections.push(node1);
          
          gsap.to(connection, {
            opacity: connection.strength,
            duration: 0.5,
            ease: "power2.out"
          });
          
          // Pulse animation
          gsap.to(connection, {
            pulsePhase: Math.PI * 2,
            duration: 3,
            repeat: -1,
            ease: "none"
          });
        }
      }
    };
    
    // Update node physics and interactions
    const updateNodes = () => {
      nodes.forEach((node, i) => {
        // Cursor interaction
        const dx = cursorFieldRef.current.x - node.x;
        const dy = cursorFieldRef.current.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cursorFieldRef.current.radius) {
          const force = 1 - (distance / cursorFieldRef.current.radius);
          const angle = Math.atan2(dy, dx);
          
          // Discover nodes on proximity
          if (!node.discovered && distance < 50) {
            node.discovered = true;
            gsap.to(node, {
              scale: 1.5,
              opacity: 1,
              duration: 0.5,
              ease: "back.out(1.7)"
            });
            
            // Show label
            gsap.to(node, {
              labelOpacity: 1,
              duration: 0.3
            });
            
            // Show preview on very close proximity
            if (distance < 30) {
              gsap.to(node, {
                previewOpacity: 1,
                duration: 0.3
              });
            }
          }
          
          // Magnetic effect
          if (distance < 30) {
            node.vx += Math.cos(angle) * force * 2;
            node.vy += Math.sin(angle) * force * 2;
          } else {
            // Gentle attraction
            node.vx += Math.cos(angle) * force * 0.5;
            node.vy += Math.sin(angle) * force * 0.5;
          }
          
          // Glow effect
          gsap.to(node, {
            glowRadius: 15 * force,
            duration: 0.1
          });
        } else {
          // Hide labels when far
          if (node.labelOpacity > 0) {
            gsap.to(node, {
              labelOpacity: 0,
              previewOpacity: 0,
              duration: 0.5
            });
          }
          
          gsap.to(node, {
            glowRadius: 0,
            scale: 1,
            duration: 0.5
          });
        }
        
        // Mouse drag connection
        if (mouseRef.current.isDown && mouseRef.current.downPos) {
          const startDist = Math.sqrt(
            Math.pow(node.x - mouseRef.current.downPos.x, 2) + 
            Math.pow(node.y - mouseRef.current.downPos.y, 2)
          );
          
          const endDist = Math.sqrt(
            Math.pow(node.x - mouseRef.current.x, 2) + 
            Math.pow(node.y - mouseRef.current.y, 2)
          );
          
          if (startDist < 30 && endDist < 150) {
            // Find nodes along the drag path
            nodes.forEach((otherNode, j) => {
              if (i !== j) {
                const otherDist = Math.sqrt(
                  Math.pow(otherNode.x - mouseRef.current.x, 2) + 
                  Math.pow(otherNode.y - mouseRef.current.y, 2)
                );
                
                if (otherDist < 30) {
                  createConnection(node, otherNode, false);
                }
              }
            });
          }
        }
        
        // Update position
        node.vx *= 0.98; // Friction
        node.vy *= 0.98;
        
        node.x += node.vx;
        node.y += node.vy;
        
        // Boundary collision
        if (node.x < node.radius) {
          node.x = node.radius;
          node.vx = Math.abs(node.vx) * 0.8;
        } else if (node.x > canvas.width - node.radius) {
          node.x = canvas.width - node.radius;
          node.vx = -Math.abs(node.vx) * 0.8;
        }
        
        if (node.y < node.radius) {
          node.y = node.radius;
          node.vy = Math.abs(node.vy) * 0.8;
        } else if (node.y > canvas.height - node.radius) {
          node.y = canvas.height - node.radius;
          node.vy = -Math.abs(node.vy) * 0.8;
        }
        
        // Node repulsion
        nodes.forEach((otherNode, j) => {
          if (i !== j) {
            const ndx = otherNode.x - node.x;
            const ndy = otherNode.y - node.y;
            const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
            
            if (ndist < 50) {
              const repelForce = (50 - ndist) / 50;
              const repelAngle = Math.atan2(ndy, ndx);
              node.vx -= Math.cos(repelAngle) * repelForce * 0.5;
              node.vy -= Math.sin(repelAngle) * repelForce * 0.5;
            }
          }
        });
      });
      
      // Gradually create connections based on proximity and type
      nodes.forEach((node, i) => {
        nodes.forEach((otherNode, j) => {
          if (i < j) { // Avoid duplicate checks
            const distance = Math.sqrt(
              Math.pow(otherNode.x - node.x, 2) + 
              Math.pow(otherNode.y - node.y, 2)
            );
            
            // Connect similar types or complementary types
            const shouldConnect = (
              (node.type === otherNode.type && distance < 100) ||
              (node.type === 'error' && otherNode.type === 'solution' && distance < 150) ||
              (node.type === 'search' && otherNode.type === 'ai-chat' && distance < 150) ||
              (node.type === 'code' && otherNode.type === 'documentation' && distance < 120)
            );
            
            if (shouldConnect && Math.random() > 0.99 && connections.length < nodeCount) {
              createConnection(node, otherNode, false);
            }
          }
        });
      });
    };
    
    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      [...connections, ...tempConnectionsRef.current].forEach(connection => {
        if (connection.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = connection.opacity;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          
          // Draw connection line
          ctx.beginPath();
          ctx.moveTo(connection.from.x, connection.from.y);
          
          // Add slight curve for organic feel
          const midX = (connection.from.x + connection.to.x) / 2;
          const midY = (connection.from.y + connection.to.y) / 2;
          const offset = Math.sin(connection.pulsePhase || 0) * 10;
          
          ctx.quadraticCurveTo(
            midX + offset, 
            midY - offset, 
            connection.to.x, 
            connection.to.y
          );
          ctx.stroke();
          
          // Draw pulse
          if (connection.pulsePhase) {
            const pulsePos = (Math.sin(connection.pulsePhase) + 1) / 2;
            const pulseX = connection.from.x + (connection.to.x - connection.from.x) * pulsePos;
            const pulseY = connection.from.y + (connection.to.y - connection.from.y) * pulsePos;
            
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.globalAlpha = connection.opacity * 0.8;
            ctx.fill();
          }
          
          ctx.restore();
        }
      });
      
      // Draw nodes
      nodes.forEach(node => {
        if (node.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = node.opacity;
          
          // Draw glow
          if (node.glowRadius > 0) {
            const glowGradient = ctx.createRadialGradient(
              node.x, node.y, 0,
              node.x, node.y, node.glowRadius + node.radius * node.scale
            );
            glowGradient.addColorStop(0, node.glow + '40');
            glowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glowGradient;
            ctx.fillRect(
              node.x - node.glowRadius - node.radius * node.scale,
              node.y - node.glowRadius - node.radius * node.scale,
              (node.glowRadius + node.radius * node.scale) * 2,
              (node.glowRadius + node.radius * node.scale) * 2
            );
          }
          
          // Draw node
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * node.scale, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Draw inner glow
          const innerGradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, node.radius * node.scale
          );
          innerGradient.addColorStop(0, node.glow + '80');
          innerGradient.addColorStop(1, node.color);
          ctx.fillStyle = innerGradient;
          ctx.fill();
          
          ctx.restore();
        }
      });
      
      // Draw cursor field visualization (subtle)
      if (cursorFieldRef.current.strength > 0.1) {
        ctx.save();
        ctx.globalAlpha = cursorFieldRef.current.strength * 0.1;
        
        const fieldGradient = ctx.createRadialGradient(
          cursorFieldRef.current.x,
          cursorFieldRef.current.y,
          0,
          cursorFieldRef.current.x,
          cursorFieldRef.current.y,
          cursorFieldRef.current.radius
        );
        fieldGradient.addColorStop(0, '#10b981');
        fieldGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = fieldGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      
      updateNodes();
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('click', handleClick);
      
      if (gsapContextRef.current) {
        gsapContextRef.current.revert();
      }
    };
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      ref={containerRef}
      className="knowledge-constellation-container"
      role="presentation"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="knowledge-constellation-canvas"
      />
      
      {/* Node labels overlay */}
      <div className="knowledge-labels-overlay">
        {nodesRef.current.map((node) => (
          <div
            key={node.id}
            className="knowledge-label"
            style={{
              left: node.x,
              top: node.y,
              opacity: node.labelOpacity || 0,
              transform: `translate(-50%, -150%) scale(${node.scale || 1})`
            }}
          >
            <div className="knowledge-label-content">
              <span className="knowledge-label-type">{node.label}</span>
              {node.previewOpacity > 0 && (
                <span className="knowledge-label-preview" style={{ opacity: node.previewOpacity }}>
                  {node.preview}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Instructions */}
      <div className="constellation-instructions">
        <p>Hover to discover • Click to illuminate • Drag to connect</p>
      </div>
    </div>
  );
}