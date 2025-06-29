import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User, Plus, Copy, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import '../AIBlockScroll.css';

export default function AIBlock({ block, onUpdate }) {
  const [messages, setMessages] = useState(block.messages || []);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [collapsedMessages, setCollapsedMessages] = useState(new Set());
  const textareaRef = useRef(null);

  // Auto-resize textarea helper
  const autoResize = useCallback((textarea) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  // Initialize new message textarea
  useEffect(() => {
    if (isAddingMessage && textareaRef.current) {
      autoResize(textareaRef.current);
      textareaRef.current.focus();
    }
  }, [isAddingMessage, autoResize]);

  // Message management functions
  const addMessage = useCallback((role, content) => {
    if (!content.trim()) return;
    
    const newMessage = { role, content: content.trim() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    onUpdate(block.id, { messages: updatedMessages });
    setIsAddingMessage(false);
    
    // Auto-collapse long messages
    const lines = content.trim().split('\n');
    if (lines.length > 15) {
      setCollapsedMessages(prev => new Set([...prev, messages.length]));
    }
  }, [messages, onUpdate]);

  const updateMessage = useCallback((index, content) => {
    const updatedMessages = [...messages];
    updatedMessages[index].content = content;
    setMessages(updatedMessages);
    onUpdate(block.id, { messages: updatedMessages });
  }, [messages, onUpdate]);

  const copyMessage = useCallback((index) => {
    navigator.clipboard.writeText(messages[index].content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [messages]);

  const toggleCollapse = useCallback((index) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const MAX_COLLAPSED_LINES = 10;

  // Message Bubble Component
  const MessageBubble = useCallback(({ message, index }) => {
    const [localEditingContent, setLocalEditingContent] = useState(message.content);
    const editTextareaRef = useRef(null);
    const isEditing = editingIndex === index;
    const isUser = message.role === 'user';
    const isCollapsed = collapsedMessages.has(index);
    
    // Calculate display properties
    const lines = message.content.split('\n');
    const isLong = lines.length > 15 || message.content.length > 800;
    const displayContent = isCollapsed 
      ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n') + 
        (lines.length > MAX_COLLAPSED_LINES ? '\n...' : '')
      : message.content;

    // Start editing mode
    const startEdit = useCallback((e) => {
      e.stopPropagation();
      setEditingIndex(index);
      setLocalEditingContent(message.content);
    }, [index, message.content]);

    // Save edit
    const saveEdit = useCallback(() => {
      updateMessage(index, localEditingContent);
      setEditingIndex(null);
    }, [index, localEditingContent]);

    // Cancel edit
    const cancelEdit = useCallback(() => {
      setLocalEditingContent(message.content);
      setEditingIndex(null);
    }, [message.content]);

    // Handle edit textarea setup
    useEffect(() => {
      if (isEditing && editTextareaRef.current) {
        const textarea = editTextareaRef.current;
        autoResize(textarea);
        
        // Focus and position cursor at click location
        textarea.focus();
        
        // Get click position from event if available
        const clickEvent = window.__lastClickEvent;
        if (clickEvent && clickEvent.target === textarea.previousSibling) {
          const rect = textarea.getBoundingClientRect();
          const x = clickEvent.clientX - rect.left;
          const y = clickEvent.clientY - rect.top;
          
          // Approximate character position (this is a simplification)
          const charWidth = 8; // Approximate character width
          const lineHeight = 24; // Approximate line height
          const col = Math.round(x / charWidth);
          const row = Math.round(y / lineHeight);
          
          // Calculate position in text
          const textLines = localEditingContent.split('\n');
          let position = 0;
          for (let i = 0; i < Math.min(row, textLines.length - 1); i++) {
            position += textLines[i].length + 1; // +1 for newline
          }
          if (row < textLines.length) {
            position += Math.min(col, textLines[row].length);
          }
          
          textarea.setSelectionRange(position, position);
        }
        
        // Clean up
        window.__lastClickEvent = null;
      }
    }, [isEditing, localEditingContent]);

    return (
      <div className={`ai-message-item flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          ${isUser 
            ? 'bg-dark-secondary border border-dark-secondary/50' 
            : 'bg-gradient-to-br from-accent-green/20 to-accent-green/10 border border-accent-green/20'
          }
        `}>
          {isUser ? (
            <User size={16} className="text-text-secondary" />
          ) : (
            <Sparkles size={16} className="text-accent-green" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Role Label */}
          <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs text-text-secondary/70 font-medium">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            
            {/* Action buttons - always visible during edit, hover otherwise */}
            <div className={`flex gap-1 ${isEditing ? 'opacity-100' : 'opacity-0 hover:opacity-100'} transition-opacity`}>
              <button
                onClick={() => copyMessage(index)}
                className="p-0.5 hover:bg-dark-secondary/50 rounded"
                title="Copy message"
              >
                {copiedIndex === index ? (
                  <Check size={12} className="text-accent-green" />
                ) : (
                  <Copy size={12} className="text-text-secondary/50" />
                )}
              </button>
              
              {isLong && !isEditing && (
                <button
                  onClick={() => toggleCollapse(index)}
                  className="p-0.5 hover:bg-dark-secondary/50 rounded"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? 
                    <ChevronDown size={12} className="text-text-secondary/50" /> : 
                    <ChevronUp size={12} className="text-text-secondary/50" />
                  }
                </button>
              )}
            </div>
          </div>

          {/* Message Bubble */}
          <div className={`
            relative rounded-lg px-4 py-3 w-full
            ${isUser 
              ? 'bg-dark-secondary/40 border border-dark-secondary/60' 
              : 'bg-gradient-to-br from-dark-secondary/20 to-dark-secondary/10 border border-dark-secondary/30'
            }
          `}>
            {isEditing ? (
              <textarea
                ref={editTextareaRef}
                value={localEditingContent}
                onChange={(e) => {
                  setLocalEditingContent(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                  } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    saveEdit();
                  }
                }}
                onBlur={saveEdit}
                className="ai-edit-textarea block w-full bg-transparent text-text-primary resize-none
                         focus:outline-none font-sans text-[15px] leading-[1.6]
                         whitespace-pre-wrap break-words"
                style={{ 
                  minHeight: '24px',
                  maxHeight: '500px',
                  margin: '0',
                  padding: '0',
                  border: 'none',
                  overflow: 'auto'
                }}
                placeholder="Edit message... (Esc to cancel, Ctrl+Enter to save)"
              />
            ) : (
              <div 
                onClick={(e) => {
                  // Store click event for cursor positioning
                  window.__lastClickEvent = e;
                  startEdit(e);
                }}
                className="text-text-primary text-[15px] leading-[1.6] cursor-text
                         whitespace-pre-wrap break-words font-sans"
              >
                {displayContent}
                {isCollapsed && lines.length > MAX_COLLAPSED_LINES && (
                  <div className="mt-2 text-text-secondary/50 text-sm">
                    ({lines.length - MAX_COLLAPSED_LINES} more lines hidden)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [editingIndex, collapsedMessages, copyMessage, toggleCollapse, updateMessage, autoResize, copiedIndex]);

  return (
    <div className="ai-block-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-text-secondary">
        <Bot size={18} />
        <span className="text-sm font-medium">AI Conversation</span>
        <div className="flex-grow h-px bg-dark-secondary/30" />
      </div>

      {/* Messages Container */}
      <div className="ai-messages-wrapper space-y-4">
        {messages.length === 0 && !isAddingMessage && (
          <div className="text-center py-12">
            <Bot size={32} className="text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">
              No messages yet. Start by adding a conversation.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble 
            key={`${index}-${message.role}`} 
            message={message} 
            index={index} 
          />
        ))}
      </div>

      {/* Add Message Interface */}
      {isAddingMessage && (
        <div className="space-y-3 p-4 bg-dark-secondary/20 rounded-lg border border-dark-secondary/30">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const content = textareaRef.current?.value || '';
                addMessage('user', content);
              }}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                       bg-dark-secondary hover:bg-dark-secondary/80 text-text-primary"
            >
              <User size={14} className="inline mr-1" />
              User
            </button>
            <button
              onClick={() => {
                const content = textareaRef.current?.value || '';
                addMessage('ai', content);
              }}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                       bg-gradient-to-r from-accent-green/20 to-accent-green/10 
                       hover:from-accent-green/30 hover:to-accent-green/20
                       text-accent-green border border-accent-green/20"
            >
              <Sparkles size={14} className="inline mr-1" />
              AI
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            onChange={(e) => autoResize(e.target)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsAddingMessage(false);
              } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                addMessage('user', e.target.value);
              }
            }}
            className="w-full bg-dark-primary/50 text-text-primary p-4 rounded-lg
                     resize-none focus:outline-none focus:ring-2 focus:ring-accent-green/50
                     placeholder-text-secondary/50 text-[15px] leading-[1.8] font-sans
                     border border-dark-secondary/30"
            placeholder="Paste or type message content... (Ctrl+Enter to add as user)"
            style={{ 
              minHeight: '120px',
              maxHeight: '400px',
              overflow: 'auto'
            }}
          />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">
              Click role button or use Ctrl+Enter • Esc to cancel
            </span>
            <button
              onClick={() => setIsAddingMessage(false)}
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!isAddingMessage && (
        <button
          onClick={() => setIsAddingMessage(true)}
          className="w-full py-3 border border-dashed border-dark-secondary/50
                   rounded-lg text-text-secondary hover:text-text-primary
                   hover:border-accent-green/50 hover:bg-dark-secondary/10
                   transition-all flex items-center justify-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          <span className="text-sm">Add message</span>
        </button>
      )}
    </div>
  );
}