import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';
import Block from './Block';
import { 
  Search, Plus, FileText, Hash, Calendar, BarChart2, 
  Sparkles, ChevronRight, X, Maximize2, Minimize2,
  Code2, MessageSquare, StickyNote, ChevronDown, ChevronUp,
  Edit3, Bot, FileCode, FolderTree, Activity, Shield
} from 'lucide-react';
import '../styles/demo.css';

// Lazy load heavy components
const CodeBlock = lazy(() => import('./blocks/CodeBlock'));
const AIBlock = lazy(() => import('./blocks/AIBlockRefined'));
const TextBlock = lazy(() => import('./blocks/TextBlock'));

// Demo content for each tab
const demoTabs = [
  { 
    id: 'notes', 
    label: 'Note Taking', 
    icon: <StickyNote size={18} />,
    description: 'Markdown-powered notes with real-time preview'
  },
  { 
    id: 'code', 
    label: 'Code Blocks', 
    icon: <Code2 size={18} />,
    description: 'Syntax highlighting for 100+ languages'
  },
  { 
    id: 'ai', 
    label: 'AI Conversations', 
    icon: <MessageSquare size={18} />,
    description: 'Preserve ChatGPT & Claude conversations'
  },
  { 
    id: 'search', 
    label: 'Instant Search', 
    icon: <Search size={18} />,
    description: 'Find anything in milliseconds'
  }
];

// Loading skeleton component
const DemoSkeleton = () => (
  <div className="demo-skeleton" style={{ height: '200px', borderRadius: '8px' }} />
);

export default function InteractiveDocumentDemoOptimized() {
  const { 
    activeDemoDocument, 
    updateDemoBlock, 
    addDemoBlock, 
    deleteDemoBlock, 
    reorderDemoBlocks,
    searchDemoDocuments 
  } = useDemoMode();

  const [activeTab, setActiveTab] = useState('code');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const demoRef = useRef(null);

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

  // Get relevant blocks for current tab
  const getTabContent = () => {
    switch (activeTab) {
      case 'notes':
        return activeDemoDocument.blocks.filter(b => 
          b.type === 'text' || b.type === 'heading'
        );
      case 'code':
        return activeDemoDocument.blocks.filter(b => 
          b.type === 'code'
        );
      case 'ai':
        return activeDemoDocument.blocks.filter(b => 
          b.type === 'ai'
        );
      case 'search':
        return null; // Special search interface
      default:
        return activeDemoDocument.blocks;
    }
  };

  // Tab-specific demos
  const renderTabContent = () => {
    switch (activeTab) {
      case 'notes':
        return <NoteTakingDemo blocks={getTabContent()} />;
      case 'code':
        return <CodeBlockDemo blocks={getTabContent()} />;
      case 'ai':
        return <AIConversationDemo blocks={getTabContent()} />;
      case 'search':
        return <SearchDemo 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
        />;
      default:
        return null;
    }
  };

  // Track demo interactions
  const trackInteraction = (feature) => {
    // Analytics tracking would go here
    console.log('Demo interaction:', feature);
  };

  return (
    <div ref={demoRef} className="demo-wrapper">
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
            <span>Syntax highlighting</span>
          </span>
          <span className="feature-indicator">
            <Bot size={16} />
            <span>AI integration</span>
          </span>
          <span className="feature-indicator">
            <Search size={16} />
            <span>Instant search</span>
          </span>
        </div>
      </div>
      
      {isVisible ? (
        <div className="demo-container">
          {/* Tabbed Navigation */}
          <div className="demo-tabs-nav">
            {demoTabs.map(tab => (
              <button
                key={tab.id}
                className={`demo-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  trackInteraction(`tab_${tab.id}`);
                }}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="demo-tab-content">
            <Suspense fallback={<DemoSkeleton />}>
              {renderTabContent()}
            </Suspense>
          </div>

          {/* Professional keyboard shortcuts */}
          <div className="demo-shortcuts">
            <div className="demo-shortcut">
              <kbd>⌘</kbd> + <kbd>K</kbd>
              <span>Quick search</span>
            </div>
            <div className="demo-shortcut">
              <kbd>⌘</kbd> + <kbd>N</kbd>
              <span>New block</span>
            </div>
            <div className="demo-shortcut">
              <kbd>⌘</kbd> + <kbd>P</kbd>
              <span>Command palette</span>
            </div>
            <div className="demo-shortcut">
              <kbd>ESC</kbd>
              <span>Exit edit mode</span>
            </div>
          </div>
        </div>
      ) : (
        <DemoSkeleton />
      )}
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, icon, children, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="demo-section">
      <button 
        className="demo-section-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {expanded && (
        <div className="demo-section-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Note Taking Demo
function NoteTakingDemo({ blocks }) {
  const sampleNote = {
    id: 'demo-note-1',
    type: 'text',
    content: `# API Rate Limiting Implementation
Performance optimization for high-throughput systems.

## Implementation Details
- Token bucket algorithm with Redis backend
- Exponential backoff for request retry logic
- Distributed rate limiting across microservices

\`\`\`typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: Request) => string;
}
\`\`\`

**Performance Metrics:**
- 99.9% uptime maintained
- <50ms response time under load
- Handles 10K+ concurrent requests`,
    isNew: false
  };

  return (
    <div className="space-y-4">
      {/* Professional guidance moved outside demo container */}
      <Block
        block={sampleNote}
        index={0}
        onUpdate={() => {}}
        onDelete={() => {}}
        allBlocks={[sampleNote]}
        isDemoMode={true}
      />
    </div>
  );
}

// Code Block Demo
function CodeBlockDemo({ blocks }) {
  const sampleCode = {
    id: 'demo-code-1',
    type: 'code',
    content: `// Distributed caching layer implementation
class DistributedCache {
  private redis: Redis;
  private fallbackCache: Map<string, CacheEntry>;
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn('Redis unavailable, using fallback', error);
      return this.fallbackCache.get(key)?.value || null;
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry = { value, timestamp: Date.now() };
    this.fallbackCache.set(key, entry);
    
    try {
      await this.redis.setex(key, ttl || 3600, JSON.stringify(value));
    } catch (error) {
      this.logger.error('Cache write failed', error);
    }
  }
}`,
    language: 'typescript',
    filePath: 'services/cache/DistributedCache.ts',
    metadata: { version: 3 }
  };

  return (
    <div className="space-y-4">
      {/* Professional guidance moved outside demo container */}
      <Block
        block={sampleCode}
        index={0}
        onUpdate={() => {}}
        onDelete={() => {}}
        allBlocks={[sampleCode]}
        isDemoMode={true}
      />
    </div>
  );
}

// AI Conversation Demo
function AIConversationDemo({ blocks }) {
  const sampleAI = {
    id: 'demo-ai-1',
    type: 'ai',
    content: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'Explain the architecture for implementing distributed tracing across microservices.'
        },
        {
          role: 'assistant',
          content: `Distributed tracing implementation requires a comprehensive approach across your microservice architecture:

## Core Components

1. **Trace Context Propagation**
   - Implement W3C Trace Context standard
   - Use correlation IDs across service boundaries
   - Inject trace headers in HTTP/gRPC calls

2. **Instrumentation Strategy**
\`\`\`typescript
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage?: Map<string, string>;
}

class DistributedTracer {
  async traceAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(operation, metadata);
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }
}
\`\`\`

3. **Collection Pipeline**
   - OpenTelemetry Collector for vendor-agnostic collection
   - Sampling strategies (head-based vs tail-based)
   - Buffer and batch optimization

4. **Storage & Analysis**
   - Jaeger or Zipkin for trace storage
   - Elasticsearch for long-term retention
   - Prometheus for metrics correlation

**Performance Considerations:**
- Overhead: <1% with proper sampling
- Storage: ~1KB per trace with 10 spans
- Latency impact: <0.5ms per instrumented call`
        }
      ]
    })
  };

  return (
    <div className="space-y-4">
      {/* Professional guidance moved outside demo container */}
      <Block
        block={sampleAI}
        index={0}
        onUpdate={() => {}}
        onDelete={() => {}}
        allBlocks={[sampleAI]}
        isDemoMode={true}
      />
    </div>
  );
}

// Search Demo
function SearchDemo({ searchQuery, setSearchQuery, searchResults }) {
  return (
    <div className="space-y-4">
      {/* Professional guidance moved outside demo container */}
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Try searching for 'React' or 'optimization'..."
          className="w-full bg-dark-primary pl-10 pr-4 py-3 rounded-lg border border-dark-secondary/50 
                   focus:border-accent-green/50 focus:outline-none text-text-primary"
          autoFocus
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-3">
          {searchResults.length > 0 ? (
            searchResults.map(doc => (
              <div key={doc.id} className="demo-block cursor-pointer">
                <div className="font-medium text-accent-green mb-1">{doc.title}</div>
                <div className="text-sm text-text-secondary">
                  {doc.tags.map(tag => `#${tag}`).join(' ')}
                </div>
                <div className="text-xs text-text-secondary/70 mt-2">
                  {doc.blocks.length} blocks • Updated {new Date(doc.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-secondary">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Sample Results */}
      {!searchQuery && (
        <div className="grid grid-cols-2 gap-3">
          <div className="demo-block">
            <div className="text-sm font-medium mb-1">Recent Searches</div>
            <div className="space-y-1">
              <div className="text-xs text-text-secondary">• React hooks</div>
              <div className="text-xs text-text-secondary">• Performance optimization</div>
              <div className="text-xs text-text-secondary">• API integration</div>
            </div>
          </div>
          <div className="demo-block">
            <div className="text-sm font-medium mb-1">Popular Tags</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-accent-green/10 text-accent-green rounded">#react</span>
              <span className="text-xs px-2 py-1 bg-accent-green/10 text-accent-green rounded">#javascript</span>
              <span className="text-xs px-2 py-1 bg-accent-green/10 text-accent-green rounded">#debugging</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}