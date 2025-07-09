import { createContext, useContext, useState, useCallback } from 'react';

// Demo data that showcases Devlog's features
const DEMO_DOCUMENTS = [
  {
    id: 'demo-1',
    title: 'React Performance Optimization Guide',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['react', 'performance', 'optimization'],
    blocks: [
      {
        id: 'demo-block-1',
        type: 'heading',
        content: '# React Performance Optimization Guide',
        position: 0
      },
      {
        id: 'demo-block-2',
        type: 'text',
        content: 'This guide covers essential techniques for optimizing React applications. We\'ll explore memoization, code splitting, and virtualization strategies that can dramatically improve your app\'s performance.\n\n## Key Concepts\n\n- **React.memo()** - Prevent unnecessary re-renders\n- **useMemo()** - Cache expensive computations\n- **useCallback()** - Stabilize function references\n- **Code Splitting** - Load components on demand',
        position: 1,
        metadata: { isCollapsed: false }
      },
      {
        id: 'demo-block-3',
        type: 'code',
        content: `// Example: Memoizing an expensive list component
import { memo, useMemo } from 'react';

const ExpensiveList = memo(({ items, filter }) => {
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

export default ExpensiveList;`,
        position: 2,
        language: 'javascript',
        filePath: 'components/ExpensiveList.jsx',
        metadata: { version: 3 }
      },
      {
        id: 'demo-block-4',
        type: 'ai',
        content: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'When should I use React.memo vs useMemo?'
            },
            {
              role: 'assistant',
              content: 'Great question! Here\'s when to use each:\n\n**React.memo** - Use for components:\n- Wraps entire components to prevent re-renders\n- Best for components that receive the same props frequently\n- Example: List items, cards, or any pure presentational component\n\n**useMemo** - Use for values:\n- Caches the result of expensive calculations\n- Best for computed values derived from props/state\n- Example: Filtered lists, sorted data, or complex calculations\n\n**Rule of thumb**: If it\'s a component, use React.memo. If it\'s a value, use useMemo.'
            }
          ]
        }),
        position: 3
      },
      {
        id: 'demo-block-5',
        type: 'todo',
        content: JSON.stringify({
          items: [
            { id: 'todo-1', text: 'Implement React.memo on ProductList component', completed: true },
            { id: 'todo-2', text: 'Add useMemo for search filtering', completed: true },
            { id: 'todo-3', text: 'Profile with React DevTools', completed: false },
            { id: 'todo-4', text: 'Implement virtualization for large lists', completed: false }
          ]
        }),
        position: 4
      }
    ]
  },
  {
    id: 'demo-2',
    title: 'API Integration Debugging Session',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    tags: ['debugging', 'api', 'cors'],
    blocks: [
      {
        id: 'demo-block-6',
        type: 'heading',
        content: '# CORS Error Resolution',
        position: 0
      },
      {
        id: 'demo-block-7',
        type: 'text',
        content: '## Problem\n\nGetting CORS errors when calling our API from the frontend:\n\n```\nAccess to fetch at \'https://api.example.com/users\' from origin \'http://localhost:3000\' has been blocked by CORS policy\n```\n\n## Investigation\n\nThe issue occurs only in production, not in development. This suggests our proxy configuration in development is masking the real CORS issue.',
        position: 1
      },
      {
        id: 'demo-block-8',
        type: 'code',
        content: `// Backend fix: Express CORS configuration
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://app.example.com',
      'https://staging.example.com'
    ];
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Important for cookies/auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));`,
        position: 2,
        language: 'javascript',
        filePath: 'server/middleware/cors.js'
      }
    ]
  }
];

const DemoModeContext = createContext();

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
};

export const DemoModeProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [demoDocuments, setDemoDocuments] = useState(DEMO_DOCUMENTS);
  const [activeDemoDocument, setActiveDemoDocument] = useState(DEMO_DOCUMENTS[0]);

  // Simulate document operations
  const updateDemoDocument = useCallback((documentId, updates) => {
    setDemoDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId 
          ? { ...doc, ...updates, updated_at: new Date().toISOString() }
          : doc
      )
    );
    
    if (activeDemoDocument?.id === documentId) {
      setActiveDemoDocument(prev => ({ ...prev, ...updates }));
    }
  }, [activeDemoDocument]);

  // Simulate block operations
  const addDemoBlock = useCallback((documentId, block) => {
    const newBlock = {
      ...block,
      id: `demo-block-${Date.now()}`,
      position: activeDemoDocument?.blocks?.length || 0
    };

    setDemoDocuments(docs =>
      docs.map(doc =>
        doc.id === documentId
          ? { ...doc, blocks: [...(doc.blocks || []), newBlock] }
          : doc
      )
    );

    if (activeDemoDocument?.id === documentId) {
      setActiveDemoDocument(prev => ({
        ...prev,
        blocks: [...(prev.blocks || []), newBlock]
      }));
    }

    return newBlock;
  }, [activeDemoDocument]);

  const updateDemoBlock = useCallback((documentId, blockId, updates) => {
    setDemoDocuments(docs =>
      docs.map(doc =>
        doc.id === documentId
          ? {
              ...doc,
              blocks: doc.blocks.map(block =>
                block.id === blockId ? { ...block, ...updates } : block
              )
            }
          : doc
      )
    );

    if (activeDemoDocument?.id === documentId) {
      setActiveDemoDocument(prev => ({
        ...prev,
        blocks: prev.blocks.map(block =>
          block.id === blockId ? { ...block, ...updates } : block
        )
      }));
    }
  }, [activeDemoDocument]);

  const deleteDemoBlock = useCallback((documentId, blockId) => {
    setDemoDocuments(docs =>
      docs.map(doc =>
        doc.id === documentId
          ? {
              ...doc,
              blocks: doc.blocks
                .filter(block => block.id !== blockId)
                .map((block, index) => ({ ...block, position: index }))
            }
          : doc
      )
    );

    if (activeDemoDocument?.id === documentId) {
      setActiveDemoDocument(prev => ({
        ...prev,
        blocks: prev.blocks
          .filter(block => block.id !== blockId)
          .map((block, index) => ({ ...block, position: index }))
      }));
    }
  }, [activeDemoDocument]);

  const reorderDemoBlocks = useCallback((documentId, sourceIndex, destinationIndex) => {
    setDemoDocuments(docs =>
      docs.map(doc => {
        if (doc.id !== documentId) return doc;

        const blocks = [...doc.blocks];
        const [removed] = blocks.splice(sourceIndex, 1);
        blocks.splice(destinationIndex, 0, removed);

        return {
          ...doc,
          blocks: blocks.map((block, index) => ({ ...block, position: index }))
        };
      })
    );

    if (activeDemoDocument?.id === documentId) {
      const blocks = [...activeDemoDocument.blocks];
      const [removed] = blocks.splice(sourceIndex, 1);
      blocks.splice(destinationIndex, 0, removed);

      setActiveDemoDocument(prev => ({
        ...prev,
        blocks: blocks.map((block, index) => ({ ...block, position: index }))
      }));
    }
  }, [activeDemoDocument]);

  // Search simulation
  const searchDemoDocuments = useCallback((query) => {
    if (!query) return demoDocuments;

    const lowerQuery = query.toLowerCase();
    return demoDocuments.filter(doc => {
      // Search in title
      if (doc.title.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in tags
      if (doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
      
      // Search in blocks
      return doc.blocks.some(block => {
        if (block.content.toLowerCase().includes(lowerQuery)) return true;
        if (block.type === 'code' && block.filePath?.toLowerCase().includes(lowerQuery)) return true;
        return false;
      });
    });
  }, [demoDocuments]);

  const value = {
    isDemoMode,
    setIsDemoMode,
    demoDocuments,
    activeDemoDocument,
    setActiveDemoDocument,
    updateDemoDocument,
    addDemoBlock,
    updateDemoBlock,
    deleteDemoBlock,
    reorderDemoBlocks,
    searchDemoDocuments
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
};