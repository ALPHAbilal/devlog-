export const mockEntries = [
  {
    id: 1,
    type: 'ai_interaction',
    title: 'Container',
    preview: 'type the user message here...',
    fullContent: {
      messages: [
        { role: 'user', content: 'type the user message here...' },
        { role: 'ai', content: 'type the AI answer here...' }
      ]
    },
    tags: ['AI interaction', 'code snippet', 'lesson learned', 'problem', 'solution'],
    project: 'E-commerce Website',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    type: 'container',
    title: 'Container',
    preview: 'React hooks optimization technique for better performance...',
    fullContent: 'Detailed explanation of React hooks optimization including useMemo, useCallback, and React.memo for preventing unnecessary re-renders.',
    tags: ['React', 'Performance', 'Hooks'],
    project: 'Weather App',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: 3,
    type: 'ai_interaction',
    title: 'Container',
    preview: 'How to implement JWT authentication in Node.js...',
    fullContent: {
      messages: [
        { role: 'user', content: 'How to implement JWT authentication in Node.js?' },
        { role: 'ai', content: 'To implement JWT authentication in Node.js, you need to: 1) Install jsonwebtoken package, 2) Create token generation function, 3) Implement middleware for token verification...' }
      ]
    },
    tags: ['Node.js', 'Authentication', 'JWT'],
    project: 'E-commerce Website',
    createdAt: new Date('2024-01-13'),
  },
  {
    id: 4,
    type: 'container',
    title: 'Container',
    preview: 'CSS Grid layout best practices and common patterns...',
    fullContent: 'Comprehensive guide on CSS Grid including grid-template-areas, auto-fill vs auto-fit, and responsive design patterns.',
    tags: ['CSS', 'Layout', 'Grid'],
    project: 'Task Manager',
    createdAt: new Date('2024-01-12'),
  },
  {
    id: 5,
    type: 'ai_interaction',
    title: 'Container',
    preview: 'Debugging async/await issues in JavaScript...',
    fullContent: {
      messages: [
        { role: 'user', content: 'My async function is not waiting for the promise to resolve' },
        { role: 'ai', content: 'Common issues with async/await: 1) Forgetting to use await keyword, 2) Not handling errors with try/catch, 3) Using await in non-async functions...' }
      ]
    },
    tags: ['JavaScript', 'Async', 'Debugging'],
    project: 'Weather App',
    createdAt: new Date('2024-01-11'),
  },
  {
    id: 6,
    type: 'container',
    title: 'Container',
    preview: 'TypeScript generics explained with practical examples...',
    fullContent: 'Understanding TypeScript generics: function generics, interface generics, constraint generics, and real-world use cases.',
    tags: ['TypeScript', 'Generics', 'Types'],
    project: 'E-commerce Website',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 7,
    type: 'container',
    title: 'Container',
    preview: 'Docker compose for local development environment...',
    fullContent: 'Setting up Docker Compose for a full-stack application with Node.js, PostgreSQL, and Redis.',
    tags: ['Docker', 'DevOps', 'Setup'],
    project: 'Task Manager',
    createdAt: new Date('2024-01-09'),
  },
  {
    id: 8,
    type: 'ai_interaction',
    title: 'Container',
    preview: 'Best practices for state management in React...',
    fullContent: {
      messages: [
        { role: 'user', content: 'What are the best practices for state management in React?' },
        { role: 'ai', content: 'Best practices include: 1) Keep state as local as possible, 2) Use Context API for medium complexity, 3) Consider Redux/Zustand for complex apps, 4) Avoid unnecessary state lifting...' }
      ]
    },
    tags: ['React', 'State Management', 'Best Practices'],
    project: 'Weather App',
    createdAt: new Date('2024-01-08'),
  },
  {
    id: 9,
    type: 'container',
    title: 'Container',
    preview: 'GraphQL vs REST API comparison and use cases...',
    fullContent: 'Detailed comparison of GraphQL and REST APIs, including pros/cons, performance considerations, and when to use each.',
    tags: ['API', 'GraphQL', 'REST'],
    project: 'E-commerce Website',
    createdAt: new Date('2024-01-07'),
  }
];

export const mockProjects = [
  { id: 1, name: 'E-commerce Website', entryCount: 24 },
  { id: 2, name: 'Weather App', entryCount: 12 },
  { id: 3, name: 'Task Manager', entryCount: 8 }
];