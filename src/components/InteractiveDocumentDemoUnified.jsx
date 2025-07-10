import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';
import Block from './Block';
import { 
  Plus, Edit3, Code2, Bot, Search, Hash, MessageSquare,
  FileText, Sparkles, ChevronDown, Command, GripVertical
} from 'lucide-react';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const demoRef = useRef(null);

  // Professional demo document with mixed content
  const [demoBlocks, setDemoBlocks] = useState([
    {
      id: 'demo-unified-1',
      type: 'heading',
      content: '# API Performance Investigation',
      position: 0
    },
    {
      id: 'demo-unified-2',
      type: 'text',
      content: `## Problem Statement

Our API endpoints are experiencing latency spikes during peak hours. Response times are exceeding 2 seconds for critical endpoints, impacting user experience.

### Metrics
- P95 latency: 2.3s (target: <500ms)
- Error rate: 0.4% (acceptable: <0.1%)
- CPU utilization: 85% during peaks`,
      position: 1
    },
    {
      id: 'demo-unified-3',
      type: 'code',
      content: `// Current implementation - performance monitoring
class APIMonitor {
  async trackRequest(endpoint, handler) {
    const start = performance.now();
    const metrics = {
      endpoint,
      timestamp: new Date().toISOString(),
      userId: this.context.userId
    };
    
    try {
      const result = await handler();
      metrics.duration = performance.now() - start;
      metrics.status = 'success';
      
      // Bottleneck: Synchronous logging
      this.logger.info('Request completed', metrics);
      return result;
    } catch (error) {
      metrics.duration = performance.now() - start;
      metrics.status = 'error';
      metrics.error = error.message;
      
      this.logger.error('Request failed', metrics);
      throw error;
    }
  }
}`,
      language: 'typescript',
      filePath: 'src/monitoring/APIMonitor.ts',
      position: 2
    },
    {
      id: 'demo-unified-4',
      type: 'ai',
      content: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'The synchronous logging seems to be adding latency. What\'s the best approach to optimize this without losing observability?'
          },
          {
            role: 'assistant',
            content: `Great observation! Synchronous logging is indeed a common performance bottleneck. Here's an optimized approach:

1. **Implement Async Logging with Buffering**
\`\`\`typescript
class AsyncLogger {
  private buffer: LogEntry[] = [];
  private flushInterval: number = 100; // ms
  
  async log(level: string, message: string, metadata: any) {
    this.buffer.push({ level, message, metadata, timestamp: Date.now() });
    
    if (this.buffer.length >= 100) {
      await this.flush();
    }
  }
  
  private async flush() {
    const entries = this.buffer.splice(0);
    await this.batchWrite(entries); // Non-blocking
  }
}
\`\`\`

2. **Use a Queue-Based System**
- Implement a message queue (Redis, RabbitMQ)
- Decouple logging from request handling
- Process logs asynchronously

3. **Consider Sampling for High-Volume Endpoints**
- Log only a percentage of successful requests
- Always log errors and slow requests
- Maintain statistical accuracy

This approach can reduce logging overhead from ~50ms to <1ms per request.`
          }
        ]
      }),
      position: 3
    },
    {
      id: 'demo-unified-5',
      type: 'code',
      content: `// Optimized implementation with async logging
class OptimizedAPIMonitor {
  private metricsQueue: MetricsQueue;
  
  constructor() {
    this.metricsQueue = new MetricsQueue({
      batchSize: 100,
      flushInterval: 100,
      onFlush: async (batch) => {
        // Non-blocking write to monitoring service
        await this.monitoringService.writeBatch(batch);
      }
    });
  }
  
  async trackRequest(endpoint: string, handler: () => Promise<any>) {
    const start = performance.now();
    const requestId = crypto.randomUUID();
    
    try {
      const result = await handler();
      
      // Non-blocking metric collection
      this.metricsQueue.push({
        requestId,
        endpoint,
        duration: performance.now() - start,
        status: 'success',
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      // Always log errors immediately
      await this.logError(requestId, endpoint, error);
      throw error;
    }
  }
}`,
      language: 'typescript',
      filePath: 'src/monitoring/OptimizedAPIMonitor.ts',
      position: 4
    },
    {
      id: 'demo-unified-6',
      type: 'text',
      content: `## Results After Implementation

The async logging optimization delivered immediate improvements:

### Performance Gains
- **P95 latency**: 2.3s → 450ms (80% reduction)
- **P99 latency**: 3.1s → 780ms  
- **Throughput**: +35% requests/second

### Resource Usage
- CPU utilization down to 45% during peaks
- Memory usage stable with buffering
- No loss in observability

### Next Steps
- [ ] Implement distributed tracing
- [ ] Add circuit breakers for external services
- [ ] Optimize database connection pooling`,
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
  }, []);

  // Handle block deletion
  const handleBlockDelete = useCallback((blockId) => {
    setDemoBlocks(blocks => 
      blocks.filter(block => block.id !== blockId)
    );
  }, []);

  // Add new block
  const handleAddBlock = useCallback((afterIndex, type = 'text') => {
    const newBlock = {
      id: `demo-unified-${Date.now()}`,
      type,
      content: type === 'text' ? '' : type === 'code' ? '// New code block' : '# New heading',
      position: afterIndex + 1,
      isNew: true
    };

    setDemoBlocks(blocks => {
      const newBlocks = [...blocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      return newBlocks.map((block, index) => ({ ...block, position: index }));
    });
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
  const BlockTypeSelector = ({ onSelect }) => (
    <div className="demo-block-selector">
      <button onClick={() => onSelect('text')} className="demo-block-type">
        <FileText size={16} />
        <span>Text</span>
      </button>
      <button onClick={() => onSelect('code')} className="demo-block-type">
        <Code2 size={16} />
        <span>Code</span>
      </button>
      <button onClick={() => onSelect('heading')} className="demo-block-type">
        <Hash size={16} />
        <span>Heading</span>
      </button>
      <button onClick={() => onSelect('ai')} className="demo-block-type">
        <MessageSquare size={16} />
        <span>AI Chat</span>
      </button>
    </div>
  );

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
            <h2 className="demo-document-title">API Performance Investigation</h2>
            <div className="demo-document-meta">
              <span className="demo-meta-item">
                <Hash size={14} />
                performance
              </span>
              <span className="demo-meta-item">
                <Hash size={14} />
                optimization
              </span>
              <span className="demo-meta-item">
                <Hash size={14} />
                debugging
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
                      onClick={() => handleAddBlock(index)}
                    >
                      <Plus size={16} />
                    </button>
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