# TanStack React Query v5.52.0 - Complete Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Setup & Configuration](#setup--configuration)
5. [Queries](#queries)
6. [Mutations](#mutations)
7. [DevTools](#devtools)
8. [Important Defaults](#important-defaults)
9. [Caching & Data Management](#caching--data-management)
10. [Advanced Patterns](#advanced-patterns)
11. [Integration with Your Stack](#integration-with-your-stack)

---

## Overview

**TanStack Query** (formerly React Query) is the missing data-fetching library for React applications. It makes fetching, caching, synchronizing, and updating server state effortless.

### What Problems Does It Solve?

Server state is fundamentally different from client state:
- **Remote**: Owned by the server, exists outside your app
- **Asynchronous**: Requires async APIs to fetch/update
- **Shared**: Can be updated by other users/devices
- **Potentially Stale**: Can become outdated without your knowledge

TanStack Query provides:
- Automatic background refetching
- Request deduplication
- Stale-while-revalidate logic
- Built-in caching and garbage collection
- Optimistic updates support
- Mutation retry logic
- Network state management

---

## Installation

### npm
```bash
npm install @tanstack/react-query
```

### Development Tools
```bash
npm install --save-dev @tanstack/react-query-devtools
```

### Version Compatibility
- **React**: v18+ (you have v19 ✓)
- **Node**: v14+
- **TypeScript**: v4.7+ (you have v5.6 ✓)
- **Browser Support**: Chrome 91+, Firefox 90+, Edge 91+, Safari 15+

---

## Core Concepts

### 1. Query
A **query** is a declarative dependency on an asynchronous source of data tied to a **unique key**.

**Key characteristics:**
- Fetches data from a server
- Automatically cached
- Can be refetched, invalidated, or updated
- Tied to a unique `queryKey` (like database primary key)

### 2. Mutation
A **mutation** is used to create, update, or delete data on the server.

**Key characteristics:**
- For server-side effects (CREATE, UPDATE, DELETE)
- Manual invocation (unlike queries)
- Can invalidate/refetch queries on success
- Supports optimistic updates

### 3. QueryClient
The central hub managing all queries, mutations, and caching.

**Responsibilities:**
- Cache management
- Refetch coordination
- Invalidation logic
- Default configuration

---

## Setup & Configuration

### Basic Setup

```typescript
// src/api/queryClient.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes (garbage collection)
      retry: 3,                  // Retry failed queries 3 times
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

export default queryClient
```

### Provider Setup in App.tsx

```typescript
// src/main.tsx or src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import queryClient from './api/queryClient'
import App from './App'

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default Root
```

### Configuration Options

| Option | Default | Purpose |
|--------|---------|---------|
| `staleTime` | 0ms | Time before query becomes stale (0 = immediately) |
| `gcTime` | 5 minutes | Garbage collection time for inactive queries |
| `retry` | 3 | Number of retry attempts on failure |
| `retryDelay` | exponential backoff | Delay between retries |
| `refetchOnMount` | true | Refetch when component mounts |
| `refetchOnWindowFocus` | true | Refetch when window regains focus |
| `refetchOnReconnect` | true | Refetch when network reconnects |
| `refetchInterval` | undefined | Auto-refetch interval (milliseconds) |

---

## Queries

### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query'

// Define your fetch function
const fetchTodos = async () => {
  const response = await fetch('/api/todos')
  if (!response.ok) throw new Error('Failed to fetch todos')
  return response.json()
}

// Use in component
function Todos() {
  const { 
    data, 
    isPending, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['todos'],           // Unique key for caching
    queryFn: fetchTodos,           // Function that returns Promise
  })

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <ul>
        {data?.map((todo: any) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  )
}
```

### Query with Status States

```typescript
const { status, data, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

// Status values: 'pending' | 'error' | 'success'
switch (status) {
  case 'pending':
    return <Spinner />
  case 'error':
    return <ErrorComponent error={error} />
  case 'success':
    return <DataComponent data={data} />
}
```

### Query with Parameters

```typescript
function TodoDetail({ todoId }: { todoId: number }) {
  const { data: todo } = useQuery({
    queryKey: ['todos', todoId],  // Include params in key
    queryFn: () => fetch(`/api/todos/${todoId}`).then(r => r.json()),
    enabled: !!todoId,             // Only fetch when todoId is defined
  })

  return <div>{todo?.title}</div>
}
```

### Dependent Queries

```typescript
function UserPosts({ userId }: { userId: number }) {
  // First query
  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  })

  // Dependent query (waits for user)
  const { data: posts } = useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
    enabled: !!user,  // Only fetch when user is available
  })

  return <div>{user?.name}: {posts?.length} posts</div>
}
```

### Parallel Queries

```typescript
function Dashboard() {
  // All queries fetch in parallel
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  })

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(r => r.json()),
  })

  const commentsQuery = useQuery({
    queryKey: ['comments'],
    queryFn: () => fetch('/api/comments').then(r => r.json()),
  })

  if (usersQuery.isPending || postsQuery.isPending || commentsQuery.isPending) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <Users data={usersQuery.data} />
      <Posts data={postsQuery.data} />
      <Comments data={commentsQuery.data} />
    </div>
  )
}
```

### Infinite Queries

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function InfinitePosts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/posts?page=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  })

  return (
    <div>
      {data?.pages.map((page) =>
        page.posts.map((post: any) => (
          <div key={post.id}>{post.title}</div>
        ))
      )}
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

### Query Return Values

```typescript
const result = useQuery({ queryKey, queryFn })

// Common properties:
result.data              // Query data
result.error            // Error if query failed
result.status           // 'pending' | 'error' | 'success'
result.fetchStatus      // 'fetching' | 'paused' | 'idle'
result.isPending        // True during initial load
result.isLoading        // Alias for isPending
result.isError          // True if query errored
result.isSuccess        // True if data loaded
result.isFetching       // True during any fetch (including background)
result.isRefetching     // True during background refetch
result.isStale          // True if data is stale
result.dataUpdatedAt    // Timestamp of last update
result.refetch()        // Manual refetch function
result.remove()         // Remove from cache
```

---

## Mutations

### Basic Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

const addTodo = async (todo: { title: string }) => {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  })
  return response.json()
}

function AddTodoForm() {
  const queryClient = useQueryClient()
  
  const { mutate, isPending, error } = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      // Invalidate and refetch todos
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({ title: 'New Todo' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" />
      <button disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Todo'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  )
}
```

### Mutation with Lifecycle Callbacks

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  
  // Before mutation starts
  onMutate: async (newTodo) => {
    // Cancel pending queries
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    
    // Optimistic update
    const oldData = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old: any) => [
      ...old,
      newTodo
    ])
    
    // Return context for rollback
    return { oldData }
  },
  
  // On success
  onSuccess: (data, variables, context) => {
    console.log('Success!', data)
  },
  
  // On error
  onError: (error, variables, context) => {
    // Rollback optimistic update
    if (context?.oldData) {
      queryClient.setQueryData(['todos'], context.oldData)
    }
  },
  
  // Always
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

mutation.mutate({ title: 'New Todo' })
```

### Mutation Return Values

```typescript
const {
  mutate,           // (variables) => void
  mutateAsync,      // (variables) => Promise<TData>
  isPending,        // True while mutation is in progress
  isSuccess,        // True after successful mutation
  isError,          // True if mutation failed
  error,            // Error object
  data,             // Response data
  reset,            // Reset mutation state
  status,           // 'idle' | 'pending' | 'error' | 'success'
} = useMutation({ mutationFn })
```

### Optimistic Updates Pattern

```typescript
function TodoItem({ todo }: { todo: any }) {
  const queryClient = useQueryClient()
  
  const updateMutation = useMutation({
    mutationFn: (updatedTodo) =>
      fetch(`/api/todos/${updatedTodo.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTodo),
      }).then(r => r.json()),
    
    onMutate: async (updatedTodo) => {
      // Cancel ongoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      
      // Snapshot old data
      const previousTodos = queryClient.getQueryData(['todos'])
      
      // Update UI optimistically
      queryClient.setQueryData(['todos'], (old: any) =>
        old?.map((t: any) => t.id === updatedTodo.id ? updatedTodo : t)
      )
      
      return { previousTodos }
    },
    
    onError: (err, updatedTodo, context) => {
      // Rollback to previous
      queryClient.setQueryData(['todos'], context?.previousTodos)
    },
    
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
  
  return (
    <div>
      {todo.title}
      <button onClick={() => updateMutation.mutate({
        ...todo,
        completed: !todo.completed
      })}>
        Toggle
      </button>
    </div>
  )
}
```

---

## DevTools

### Installation (Already done in your setup)

```bash
npm install @tanstack/react-query-devtools
```

### Floating Mode (Recommended)

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {/* Place as high as possible in your app tree */}
      <ReactQueryDevtools 
        initialIsOpen={false}
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  )
}
```

### Embedded Mode

```typescript
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function App() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close' : 'Open'} DevTools
      </button>
      {isOpen && (
        <ReactQueryDevtoolsPanel onClose={() => setIsOpen(false)} />
      )}
    </QueryClientProvider>
  )
}
```

### DevTools Features
- View all active/inactive queries
- Inspect query state and cached data
- Trigger refetch/invalidate actions
- Monitor mutations
- Inspect query history
- Network timeline visualization

---

## Important Defaults

### Stale Time (Default: 0ms)

```typescript
// Query becomes stale immediately (refetch on mount, window focus, reconnect)
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// Query stays fresh for 5 minutes
useQuery({ 
  queryKey: ['todos'], 
  queryFn: fetchTodos,
  staleTime: 1000 * 60 * 5 
})
```

**Impact:**
- `staleTime: 0` → Aggressive refetching (default)
- `staleTime: ∞` → Data never refetches unless manually invalidated

### Garbage Collection (Default: 5 minutes)

```typescript
// Inactive queries removed after 5 minutes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5,
    },
  },
})

// Keep data in cache for 1 hour
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  gcTime: 1000 * 60 * 60,
})
```

### Retry Logic (Default: 3 retries)

```typescript
// Retry failed queries 3 times with exponential backoff
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// Disable retries
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  retry: false,
})

// Retry with custom logic
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  retry: (failureCount, error) => {
    // Don't retry 404s
    if (error.status === 404) return false
    // Retry up to 3 times
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

### Structural Sharing (Default: enabled)

```typescript
// TanStack Query detects if data changed
// If not, reference stays same (better for useMemo/useCallback)
// Disable only if data is non-JSON or performance is poor
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  structuralSharing: false, // Disable if needed
})
```

---

## Caching & Data Management

### Query Keys Pattern

```typescript
// Simple key
const queryKey = ['todos']

// Key with ID
const queryKey = ['todos', todoId]

// Nested key structure (recommended)
const queryKey = ['users', userId, 'posts', postId, 'comments']

// Keys with filters
const queryKey = ['todos', { status: 'completed', sortBy: 'date' }]

// Dynamic key generation
function todoKeys() {
  return {
    all: ['todos'] as const,
    lists: () => [...todoKeys.all, 'list'] as const,
    list: (filters: any) => [...todoKeys.lists(), filters] as const,
    details: () => [...todoKeys.all, 'detail'] as const,
    detail: (id: number) => [...todoKeys.details(), id] as const,
  }
}

// Usage
useQuery({
  queryKey: todoKeys.detail(todoId),
  queryFn: () => fetchTodo(todoId),
})
```

### Manual Cache Updates

```typescript
const queryClient = useQueryClient()

// Get cached data
const todos = queryClient.getQueryData(['todos'])

// Set cached data
queryClient.setQueryData(['todos'], (oldData: any) => [
  ...oldData,
  { id: 4, title: 'New Todo' }
])

// Set data for new query (creates entry if doesn't exist)
queryClient.setQueryData(['todos', 4], { id: 4, title: 'Todo 4' })

// Replace entire data
queryClient.setQueryData(['todos'], [
  { id: 1, title: 'Todo 1' },
  { id: 2, title: 'Todo 2' },
])
```

### Invalidation Patterns

```typescript
const queryClient = useQueryClient()

// Invalidate single query
queryClient.invalidateQueries({ queryKey: ['todos'] })

// Invalidate query and refetch in background
queryClient.invalidateQueries({
  queryKey: ['todos'],
  refetchType: 'active', // or 'inactive', 'all', 'none'
})

// Invalidate all queries matching pattern
queryClient.invalidateQueries({
  queryKey: ['todos'],
  exact: false, // Matches any key starting with ['todos']
})

// Invalidate only specific todo
queryClient.invalidateQueries({
  queryKey: ['todos', 1],
  exact: true,
})

// Invalidate multiple query types
queryClient.invalidateQueries({ queryKey: ['todos'] })
queryClient.invalidateQueries({ queryKey: ['posts'] })
```

### Prefetching

```typescript
const queryClient = useQueryClient()

// Prefetch before navigation
const handleNavigateTodoDetail = (todoId: number) => {
  queryClient.prefetchQuery({
    queryKey: ['todos', todoId],
    queryFn: () => fetchTodo(todoId),
  })
  // Then navigate
  navigate(`/todos/${todoId}`)
}

// Prefetch in useEffect
useEffect(() => {
  const todos = queryClient.getQueryData(['todos'])
  todos?.forEach((todo: any) => {
    queryClient.prefetchQuery({
      queryKey: ['todos', todo.id],
      queryFn: () => fetchTodo(todo.id),
    })
  })
}, [])
```

---

## Advanced Patterns

### Selection & Transformation

```typescript
// Select specific data from query
const { data: todoTitle } = useQuery({
  queryKey: ['todos', 1],
  queryFn: fetchTodo,
  select: (data) => data.title,
})

// Complex transformation
const { data: completedTodos } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) =>
    data
      .filter((todo: any) => todo.completed)
      .map((todo: any) => ({ ...todo, label: `✓ ${todo.title}` })),
})
```

### Background Refetching Indicator

```typescript
function Todos() {
  const { data, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return (
    <div>
      {isFetching && <span>⟳ Updating...</span>}
      <ul>
        {data?.map((todo: any) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}

// Global fetching indicator
function GlobalIndicator() {
  const isFetching = useIsFetching()
  return isFetching > 0 ? <div className="global-loader" /> : null
}
```

### Error Handling

```typescript
function TodosWithErrorHandling() {
  const { data, error, isError, refetch } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  if (isError) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    )
  }

  return <TodoList todos={data} />
}
```

### Pagination Pattern

```typescript
function TodosPaginated() {
  const [page, setPage] = useState(1)
  
  const { data, isPending } = useQuery({
    queryKey: ['todos', { page }],
    queryFn: () => fetchTodos({ page }),
  })

  return (
    <div>
      <TodoList todos={data?.items} />
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <span>Page {page}</span>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  )
}
```

### Suspense Mode (React 18+)

```typescript
import { useSuspenseQuery } from '@tanstack/react-query'

// Use Suspense for loading state
function TodosSuspense() {
  const { data } = useSuspenseQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return <TodoList todos={data} />
}

// Error boundary + Suspense
import { ErrorBoundary } from 'react-error-boundary'

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSpinner />}>
        <TodosSuspense />
      </Suspense>
    </ErrorBoundary>
  )
}
```

---

## Integration with Your Stack

### With Zustand (Client State)

**Pattern:**
- **TanStack Query**: Server state (API data, remote database)
- **Zustand**: Client state (UI state, user preferences, filters)

```typescript
// store.ts (Zustand)
import { create } from 'zustand'

interface TodoFilters {
  status: 'all' | 'completed' | 'pending'
  sortBy: 'date' | 'title'
}

interface TodoStore {
  filters: TodoFilters
  setFilters: (filters: Partial<TodoFilters>) => void
}

const useTodoStore = create<TodoStore>((set) => ({
  filters: { status: 'all', sortBy: 'date' },
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
}))

export default useTodoStore

// component.tsx (Integration)
import { useQuery } from '@tanstack/react-query'
import useTodoStore from './store'

function TodosFiltered() {
  const { filters } = useTodoStore()
  
  const { data: todos } = useQuery({
    queryKey: ['todos', filters], // Key changes when filters change
    queryFn: () => fetchTodos(filters),
  })

  return <TodoList todos={todos} />
}
```

### With Dexie (Local Database)

**Pattern:**
- Use Dexie for local caching/offline support
- Use TanStack Query for server sync

```typescript
// db.ts
import Dexie, { type Table } from 'dexie'

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: Date
}

export const db = new Dexie('TodoDB')
db.version(1).stores({
  todos: '++id',
})

export type TodoDB = typeof db

// hooks/useTodosWithSync.ts
export function useTodosWithSync() {
  const queryClient = useQueryClient()

  // Fetch from server
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const todos = await fetchTodos()
      // Sync to local DB
      await db.todos.bulkPut(todos)
      return todos
    },
  })

  // Provide fallback from local DB
  const [localTodos, setLocalTodos] = useState<Todo[]>([])

  useEffect(() => {
    db.todos.toArray().then(setLocalTodos)
  }, [])

  // Use server data if available, fall back to local
  const data = query.data ?? localTodos

  return { ...query, data }
}
```

### With Vite + React 19

**Create `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

### TypeScript Setup

```typescript
// types/api.ts
export interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TodoResponse {
  data: Todo[]
  meta: { page: number; total: number }
}

export interface TodoFilters {
  status?: 'completed' | 'pending'
  search?: string
}

// hooks/useTodos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Todo, TodoResponse } from '../types/api'

export function useTodos(filters?: TodoFilters) {
  return useQuery<TodoResponse, Error>({
    queryKey: ['todos', filters],
    queryFn: () =>
      fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(filters),
      }).then(r => r.json()),
  })
}

export function useAddTodo() {
  const queryClient = useQueryClient()

  return useMutation<Todo, Error, { title: string }>({
    mutationFn: async (newTodo) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
```

### Performance Optimization

```typescript
// Memoize query functions
const fetchTodos = useCallback(
  (filters?: TodoFilters) =>
    fetch('/api/todos', { body: JSON.stringify(filters) }).then(r => r.json()),
  []
)

// Use in query
const { data } = useQuery({
  queryKey: ['todos', filters],
  queryFn: () => fetchTodos(filters),
})

// Memoize expensive computations
const { data: todos } = useQuery({
  queryKey: ['todos', filters],
  queryFn: fetchTodos,
  select: useCallback((data: Todo[]) => {
    // Expensive computation
    return data.filter(...).map(...).sort(...)
  }, []),
})
```

---

## Best Practices

✅ **DO:**
- Use meaningful, hierarchical query keys
- Set appropriate `staleTime` for your use case
- Implement proper error boundaries
- Use DevTools during development
- Combine with Zustand for client state
- Invalidate related queries after mutations
- Type your query and mutation functions
- Use suspense for better UX

❌ **DON'T:**
- Store server state in Zustand
- Forget to provide QueryClientProvider
- Set `staleTime: 0` when not needed (aggressive refetching)
- Use `gcTime: 0` (will create memory issues)
- Mutate data directly without using mutations
- Ignore error states in UI
- Create multiple QueryClient instances

---

## Common Pitfalls

### Pitfall 1: Queries fire immediately
```typescript
// ❌ Bad: Query always fetches
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// ✅ Good: Only fetch when needed
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  enabled: !!userId, // Only fetch when userId exists
})
```

### Pitfall 2: Stale queries not refetching
```typescript
// ❌ Bad: Data stays stale forever
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
})

// ✅ Good: Balance between caching and freshness
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 1000 * 60 * 5, // 5 minutes
  refetchOnWindowFocus: true,
})
```

### Pitfall 3: Not invalidating after mutations
```typescript
// ❌ Bad: UI shows stale data
useMutation({
  mutationFn: addTodo,
  // Missing onSuccess
})

// ✅ Good: Refetch after mutation
useMutation({
  mutationFn: addTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

---

## Quick Reference API

### Hooks
- `useQuery()` - Fetch and cache data
- `useInfiniteQuery()` - Pagination support
- `useMutation()` - Create/update/delete
- `useQueryClient()` - Access QueryClient
- `useIsFetching()` - Global fetching state
- `useIsMutating()` - Global mutation state
- `useSuspenseQuery()` - Suspense integration

### QueryClient Methods
- `fetchQuery()` - Fetch and return data
- `prefetchQuery()` - Prefetch before rendering
- `setQueryData()` - Update cache manually
- `getQueryData()` - Read cache synchronously
- `invalidateQueries()` - Mark as stale
- `refetchQueries()` - Force refetch
- `cancelQueries()` - Cancel in-flight requests
- `removeQueries()` - Delete from cache

---

## Resources

- **Official Docs**: https://tanstack.com/query/v5/docs/react/overview
- **GitHub Repo**: https://github.com/TanStack/query
- **Community Discord**: https://tlinz.com/discord
- **Advanced Course**: query.gg

---

## Next Steps for Integration

1. ✅ Replace your existing data fetching logic with useQuery
2. ✅ Use useMutation for all create/update/delete operations
3. ✅ Set up proper error boundaries
4. ✅ Configure DevTools for development
5. ✅ Implement prefetching for better UX
6. ✅ Combine with Zustand for client state
7. ✅ Add TypeScript types for queries and mutations
8. ✅ Monitor and optimize staleTime/gcTime settings

---

**Version**: TanStack Query v5.52.0
**React**: v19.x compatible
**Last Updated**: December 2025