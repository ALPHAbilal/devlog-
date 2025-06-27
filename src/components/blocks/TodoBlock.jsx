import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Calendar, 
  ChevronDown, Check, X, AlertCircle,
  GripVertical, Filter
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { value: 'done', label: 'Done', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  { value: 'blocked', label: 'Blocked', color: 'text-red-400', bgColor: 'bg-red-400/10' }
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: 'text-red-400', icon: '🔴' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400', icon: '🟡' },
  { value: 'low', label: 'Low', color: 'text-blue-400', icon: '🔵' }
];

export default function TodoBlock({ block, onUpdate }) {
  const [todos, setTodos] = useState(block.data?.todos || []);
  const [filter, setFilter] = useState({ status: 'all', priority: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const draggedItem = useRef(null);
  const draggedOverItem = useRef(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Cmd/Ctrl + Enter to add new task when not editing
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !editingCell) {
        e.preventDefault();
        addTodo();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editingCell]);

  // Initialize todos with IDs if they don't have them
  useEffect(() => {
    const todosWithIds = todos.map(todo => ({
      id: todo.id || crypto.randomUUID(),
      task: todo.task || '',
      status: todo.status || 'todo',
      priority: todo.priority || 'medium',
      dueDate: todo.dueDate || '',
      tags: todo.tags || [],
      createdAt: todo.createdAt || new Date().toISOString()
    }));
    
    if (JSON.stringify(todosWithIds) !== JSON.stringify(todos)) {
      setTodos(todosWithIds);
      onUpdate({ data: { todos: todosWithIds } });
    }
  }, []);


  const addTodo = () => {
    const newTodo = {
      id: crypto.randomUUID(),
      task: 'New task',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      tags: [],
      createdAt: new Date().toISOString()
    };
    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    onUpdate({ data: { todos: newTodos } });
  };

  const updateTodo = (id, field, value) => {
    const newTodos = todos.map(todo => 
      todo.id === id ? { ...todo, [field]: value } : todo
    );
    setTodos(newTodos);
    onUpdate({ data: { todos: newTodos } });
  };

  const deleteTodo = (id) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    onUpdate({ data: { todos: newTodos } });
  };


  const startEditing = (todoId, field, currentValue) => {
    setEditingCell(`${todoId}-${field}`);
    setEditValue(currentValue || '');
  };

  const saveEdit = (todoId, field) => {
    updateTodo(todoId, field, editValue);
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Keyboard navigation
  const handleKeyDown = (e, todoId, field, todoIndex) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit(todoId, field);
      
      // Navigate to next field
      const fields = ['task', 'status', 'priority', 'dueDate'];
      const currentFieldIndex = fields.indexOf(field);
      const nextFieldIndex = (currentFieldIndex + 1) % fields.length;
      const nextField = fields[nextFieldIndex];
      
      // If we're at the last field, go to the next row
      if (nextFieldIndex === 0 && todoIndex < filteredTodos.length - 1) {
        const nextTodo = filteredTodos[todoIndex + 1];
        startEditing(nextTodo.id, 'task', nextTodo.task);
      } else if (nextFieldIndex !== 0) {
        const currentTodo = filteredTodos[todoIndex];
        startEditing(todoId, nextField, currentTodo[nextField]);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    draggedItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    draggedOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (draggedItem.current !== null && draggedOverItem.current !== null) {
      const draggedTodo = todos[draggedItem.current];
      const newTodos = [...todos];
      
      // Remove the dragged item
      newTodos.splice(draggedItem.current, 1);
      
      // Insert it at the new position
      newTodos.splice(draggedOverItem.current, 0, draggedTodo);
      
      setTodos(newTodos);
      onUpdate({ data: { todos: newTodos } });
    }
    
    draggedItem.current = null;
    draggedOverItem.current = null;
  };

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (filter.status !== 'all' && todo.status !== filter.status) return false;
    if (filter.priority !== 'all' && todo.priority !== filter.priority) return false;
    return true;
  });

  // Calculate progress and stats
  const progress = todos.length > 0 
    ? Math.round((todos.filter(t => t.status === 'done').length / todos.length) * 100)
    : 0;
  
  const stats = {
    total: todos.length,
    done: todos.filter(t => t.status === 'done').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    blocked: todos.filter(t => t.status === 'blocked').length
  };

  const StatusBadge = ({ status, todoId }) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    
    if (editingCell === `${todoId}-status`) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(todoId, 'status')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit(todoId, 'status');
            if (e.key === 'Escape') cancelEdit();
          }}
          className="w-full px-2 py-1 bg-dark-primary text-text-primary text-xs
                     border border-accent-green/50 rounded focus:outline-none"
          autoFocus
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    return (
      <button
        onClick={() => startEditing(todoId, 'status', status)}
        className={`px-2 py-1 rounded text-xs font-medium ${option.bgColor} ${option.color}
                    hover:opacity-80 transition-opacity`}
      >
        {option.label}
      </button>
    );
  };

  const PriorityBadge = ({ priority, todoId }) => {
    const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
    
    if (editingCell === `${todoId}-priority`) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(todoId, 'priority')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit(todoId, 'priority');
            if (e.key === 'Escape') cancelEdit();
          }}
          className="w-full px-2 py-1 bg-dark-primary text-text-primary text-xs
                     border border-accent-green/50 rounded focus:outline-none"
          autoFocus
        >
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    return (
      <button
        onClick={() => startEditing(todoId, 'priority', priority)}
        className={`inline-flex items-center gap-1 text-xs ${option.color}
                    hover:opacity-80 transition-opacity`}
      >
        <span>{option.icon}</span>
        <span>{option.label}</span>
      </button>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-text-primary">Tasks</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-text-secondary">
                {stats.total} total • {stats.done} done
              </div>
              <div className="w-24 h-1.5 bg-dark-secondary/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-green transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded transition-colors ${
              showFilters ? 'bg-dark-secondary/50 text-accent-green' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Filter size={16} />
          </button>
          <button
            onClick={addTodo}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent-green/10 
                       text-accent-green rounded hover:bg-accent-green/20 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">Add Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-dark-secondary/20 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Status:</span>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-2 py-1 bg-dark-primary text-text-primary text-xs
                         border border-dark-secondary/50 rounded focus:outline-none"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Priority:</span>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="px-2 py-1 bg-dark-primary text-text-primary text-xs
                         border border-dark-secondary/50 rounded focus:outline-none"
            >
              <option value="all">All</option>
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-secondary/50">
              <th className="w-8"></th>
              <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Task</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Status</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Priority</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Due Date</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTodos.map((todo, index) => (
              <tr
                key={todo.id}
                className="border-b border-dark-secondary/30 hover:bg-dark-secondary/10 transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
              >
                <td className="py-2 px-2">
                  <GripVertical size={14} className="text-text-secondary/50 cursor-move" />
                </td>
                <td className="py-2 px-3">
                  {editingCell === `${todo.id}-task` ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(todo.id, 'task')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(todo.id, 'task');
                        if (e.key === 'Escape') cancelEdit();
                        handleKeyDown(e, todo.id, 'task', index);
                      }}
                      className="w-full px-2 py-1 bg-dark-primary text-text-primary text-sm
                                 border border-accent-green/50 rounded focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => startEditing(todo.id, 'task', todo.task)}
                      className="text-sm text-text-primary hover:text-accent-green transition-colors text-left w-full"
                    >
                      {todo.task}
                    </button>
                  )}
                </td>
                <td className="py-2 px-3">
                  <StatusBadge status={todo.status} todoId={todo.id} />
                </td>
                <td className="py-2 px-3">
                  <PriorityBadge priority={todo.priority} todoId={todo.id} />
                </td>
                <td className="py-2 px-3">
                  {editingCell === `${todo.id}-dueDate` ? (
                    <input
                      type="date"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(todo.id, 'dueDate')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(todo.id, 'dueDate');
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="px-2 py-1 bg-dark-primary text-text-primary text-xs
                                 border border-accent-green/50 rounded focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => startEditing(todo.id, 'dueDate', todo.dueDate)}
                      className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Calendar size={12} />
                      {todo.dueDate || 'Set date'}
                    </button>
                  )}
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1 text-text-secondary/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTodos.length === 0 && (
        <div className="text-center py-8 text-text-secondary/50">
          {todos.length === 0 ? 'No tasks yet. Click "Add Task" to get started.' : 'No tasks match the current filters.'}
        </div>
      )}
    </div>
  );
}