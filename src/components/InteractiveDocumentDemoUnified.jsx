import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';
import Block from './Block';
import { 
  Plus, Edit3, Code2, Bot, Search, Hash, MessageSquare,
  FileText, Sparkles, ChevronDown, Command, GripVertical,
  Table, CheckSquare, FolderTree
} from 'lucide-react';
import DemoOnboarding from './DemoOnboarding';
import { useNavigate } from 'react-router-dom';
import '../styles/demo.css';

// Loading skeleton component
const DemoSkeleton = () => (
  <div className="demo-skeleton" style={{ height: '400px', borderRadius: '8px' }} />
);

export default function InteractiveDocumentDemoUnified() {
  const { 
    activeDemoDocument, 
    updateDemoBlock, 
    addDemoBlock, 
    deleteDemoBlock, 
    reorderDemoBlocks,
    searchDemoDocuments 
  } = useDemoMode();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState(null);
  const demoRef = useRef(null);

  // Relatable demo content that resonates with every developer
  const [demoBlocks, setDemoBlocks] = useState([
    {
      id: 'demo-unified-1',
      type: 'heading',
      content: '# My Development Solutions 🚀',
      position: 0
    },
    {
      id: 'demo-unified-2',
      type: 'text',
      content: `**That regex I always forget**

Found it! Here's the email validation regex that actually works:

\`\`\`regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
\`\`\`

**Why this works:** Handles most common email formats without being overly complex. Saved me hours of debugging last time!`,
      position: 1
    },
    {
      id: 'demo-unified-3',
      type: 'code',
      content: `// That React hook that fixed everything
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage: Prevented 1000s of API calls!
const searchTerm = useDebounce(userInput, 300);`,
      language: 'javascript',
      filePath: 'hooks/useDebounce.js',
      position: 2
    },
    {
      id: 'demo-unified-4',
      type: 'ai',
      content: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Why is my React component re-rendering so much?'
          },
          {
            role: 'assistant',
            content: `This is a common React performance issue! Here are the main culprits and solutions:

**1. Unstable Dependencies**
\`\`\`javascript
// ❌ Creates new object every render
<Child config={{theme: 'dark'}} />

// ✅ Stable reference
const config = useMemo(() => ({theme: 'dark'}), []);
<Child config={config} />
\`\`\`

**2. Inline Function Props**
\`\`\`javascript
// ❌ New function every render
<Button onClick={() => handleClick(id)} />

// ✅ Stable callback
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id]);
<Button onClick={handleButtonClick} />
\`\`\`

**3. Missing React.memo**
Wrap child components that receive props in React.memo() to prevent unnecessary re-renders when props haven't changed.

Use the React DevTools Profiler to identify which components are rendering and why!`
          }
        ]
      }),
      position: 3
    },
    {
      id: 'demo-unified-5',
      type: 'code',
      content: `// CORS fix that actually works (after 2 hours of debugging 😅)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://myapp.com',
      process.env.FRONTEND_URL
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // This was the missing piece!
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));`,
      language: 'javascript',
      filePath: 'server/middleware/cors.js',
      position: 4
    },
    {
      id: 'demo-unified-6',
      type: 'text',
      content: `**Quick Links to My Solutions**

**🔥 Frequently Used**
- [[Docker compose for dev environment]] - My go-to setup
- [[Git aliases that save time]] - Especially the \`git undo\` one
- [[VS Code snippets collection]] - React, TypeScript, testing
- [[Database optimization queries]] - That JOIN vs subquery comparison

**📚 Learning Notes**
- [[WebSocket reconnection strategy]] - Saved from production incident
- [[JWT refresh token flow]] - With the security considerations
- [[Webpack config that actually works]] - For React + TypeScript
- [[Testing async Redux actions]] - The pattern that clicked

**🏷️ Tags**
#debugging #performance #react #nodejs #postgresql #docker

**Pro tip:** Everything is searchable! Try typing "cors" or "hook" in the search above 👆`,
      position: 5
    }
  ]);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (demoRef.current) {
      observer.observe(demoRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const results = searchDemoDocuments(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchDemoDocuments]);

  // Handle block updates
  const handleBlockUpdate = useCallback((blockId, updates) => {
    setDemoBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
    setHasInteracted(true);
  }, []);

  // Handle block deletion
  const handleBlockDelete = useCallback((blockId) => {
    setDemoBlocks(blocks => 
      blocks.filter(block => block.id !== blockId)
    );
  }, []);

  // Show block selector
  const handleShowBlockSelector = useCallback((afterIndex) => {
    setShowBlockSelector(true);
    setSelectorPosition(afterIndex);
  }, []);

  // Add new block
  const handleAddBlock = useCallback((afterIndex, type) => {
    const newBlock = {
      id: `demo-unified-${Date.now()}`,
      type,
      content: type === 'text' ? '' : 
                type === 'code' ? '// New code block' : 
                type === 'heading' ? '# New heading' :
                type === 'ai' ? JSON.stringify({ messages: [] }) :
                type === 'table' ? JSON.stringify({ headers: ['Column 1', 'Column 2'], rows: [['', '']] }) :
                type === 'todo' ? JSON.stringify({ items: [{ id: Date.now(), text: '', checked: false }] }) :
                type === 'filetree' ? JSON.stringify({ name: 'root', type: 'folder', children: [] }) : '',
      position: afterIndex + 1,
      isNew: true
    };

    setDemoBlocks(blocks => {
      const newBlocks = [...blocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      return newBlocks.map((block, index) => ({ ...block, position: index }));
    });
    setHasInteracted(true);
    setShowBlockSelector(false);
    setSelectorPosition(null);
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, index) => {
    setIsDragging(true);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setDemoBlocks(blocks => {
      const newBlocks = [...blocks];
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(dropIndex, 0, draggedBlock);
      return newBlocks.map((block, index) => ({ ...block, position: index }));
    });

    setIsDragging(false);
    setDraggedIndex(null);
  }, [draggedIndex]);

  // Block type selector
  const BlockTypeSelector = ({ onSelect, onClose }) => {
    const selectorRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (selectorRef.current && !selectorRef.current.contains(e.target)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
      <div ref={selectorRef} className="demo-block-selector">
        <button onClick={() => onSelect('text')} className="demo-block-type">
          <FileText size={16} />
          <span>Text</span>
        </button>
        <button onClick={() => onSelect('heading')} className="demo-block-type">
          <Hash size={16} />
          <span>Heading</span>
        </button>
        <button onClick={() => onSelect('code')} className="demo-block-type">
          <Code2 size={16} />
          <span>Code</span>
        </button>
        <button onClick={() => onSelect('table')} className="demo-block-type">
          <Table size={16} />
          <span>Table</span>
        </button>
        <button onClick={() => onSelect('todo')} className="demo-block-type">
          <CheckSquare size={16} />
          <span>Todo List</span>
        </button>
        <button onClick={() => onSelect('ai')} className="demo-block-type">
          <MessageSquare size={16} />
          <span>AI Chat</span>
        </button>
        <button onClick={() => onSelect('filetree')} className="demo-block-type">
          <FolderTree size={16} />
          <span>File Tree</span>
        </button>
      </div>
    );
  };

  return (
    <div ref={demoRef} className="demo-wrapper">
      {/* Onboarding overlay */}
      {showOnboarding && isVisible && (
        <DemoOnboarding
          onComplete={() => {
            setShowOnboarding(false);
            navigate('/auth');
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Professional guidance outside demo */}
      <div className="demo-guidance">
        <span className="demo-indicator">Interactive Demo</span>
        <div className="demo-features">
          <span className="feature-indicator">
            <Edit3 size={16} />
            <span>Live editing</span>
          </span>
          <span className="feature-indicator">
            <Code2 size={16} />
            <span>Mixed content</span>
          </span>
          <span className="feature-indicator">
            <Bot size={16} />
            <span>AI conversations</span>
          </span>
          <span className="feature-indicator">
            <Plus size={16} />
            <span>Add blocks</span>
          </span>
        </div>
      </div>
      
      {isVisible ? (
        <div className="demo-container">
          {/* Document header */}
          <div className="demo-document-header">
            <h2 className="demo-document-title">My Development Solutions 🚀</h2>
            <div className="demo-document-meta">
              <span className="demo-meta-item">
                <Hash size={14} />
                react
              </span>
              <span className="demo-meta-item">
                <Hash size={14} />
                debugging
              </span>
              <span className="demo-meta-item">
                <Hash size={14} />
                snippets
              </span>
              <span className="demo-meta-item demo-meta-highlight">
                <Sparkles size={14} />
                Try editing!
              </span>
            </div>
          </div>

          {/* Document content */}
          <div className="demo-document-content">
            {demoBlocks.map((block, index) => (
              <div
                key={block.id}
                className={`demo-block-wrapper ${isDragging ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Drag handle */}
                <div className="demo-drag-handle">
                  <GripVertical size={16} />
                </div>

                {/* Block content */}
                <div className="demo-block-content">
                  <Block
                    block={block}
                    index={index}
                    onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                    onDelete={() => handleBlockDelete(block.id)}
                    allBlocks={demoBlocks}
                    isDemoMode={true}
                  />
                  
                  {/* Add block button */}
                  <div className="demo-add-block-container">
                    <button
                      className="demo-add-block-button"
                      onClick={() => handleShowBlockSelector(index)}
                    >
                      <Plus size={16} />
                    </button>
                    
                    {/* Block type selector */}
                    {showBlockSelector && selectorPosition === index && (
                      <BlockTypeSelector 
                        onSelect={(type) => handleAddBlock(index, type)}
                        onClose={() => {
                          setShowBlockSelector(false);
                          setSelectorPosition(null);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>


        </div>
      ) : (
        <DemoSkeleton />
      )}
    </div>
  );
}