import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Bot, User, Plus, Copy, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function AIBlock({ block, onUpdate }) {
  const [messages, setMessages] = useState(block.messages || []);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [collapsedMessages, setCollapsedMessages] = useState(new Set());
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const scrollLockRef = useRef(false);
  const lastScrollPositionRef = useRef(0);

  // Lock scroll position during any state changes
  const lockScroll = useCallback(() => {
    const container = scrollContainerRef.current?.closest('.overflow-y-auto');
    if (container) {
      lastScrollPositionRef.current = container.scrollTop;
      scrollLockRef.current = true;
    }
  }, []);

  const unlockScroll = useCallback(() => {
    scrollLockRef.current = false;
  }, []);

  // Preserve scroll position on any container changes
  useLayoutEffect(() => {
    if (scrollLockRef.current) {
      const container = scrollContainerRef.current?.closest('.overflow-y-auto');
      if (container && lastScrollPositionRef.current !== undefined) {
        container.scrollTop = lastScrollPositionRef.current;
      }
    }
  });

  // Monitor and preserve scroll position during edit mode
  useEffect(() => {
    if (editingIndex !== null) {
      const container = scrollContainerRef.current?.closest('.overflow-y-auto');
      if (!container) return;

      let rafId;
      let lastKnownScrollTop = container.scrollTop;

      // Continuously monitor and restore scroll position
      const preserveScroll = () => {
        if (container.scrollTop !== lastKnownScrollTop && scrollLockRef.current) {
          container.scrollTop = lastKnownScrollTop;
        }
        rafId = requestAnimationFrame(preserveScroll);
      };

      // Start monitoring
      scrollLockRef.current = true;
      preserveScroll();

      // Cleanup
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        scrollLockRef.current = false;
      };
    }
  }, [editingIndex]);

  // Auto-resize textarea
  const autoResize = (textarea) => {
    if (textarea) {
      const scrollTop = textarea.scrollTop;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
      textarea.scrollTop = scrollTop;
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [isAddingMessage]);

  const addMessage = (role, content) => {
    if (content.trim()) {
      lockScroll();
      const updatedMessages = [...messages, { role, content: content.trim() }];
      setMessages(updatedMessages);
      onUpdate({ messages: updatedMessages });
      setIsAddingMessage(false);
      
      // Auto-collapse long messages
      const lines = content.trim().split('\n');
      if (lines.length > 15) {
        const newCollapsed = new Set(collapsedMessages);
        newCollapsed.add(messages.length);
        setCollapsedMessages(newCollapsed);
      }
      
      setTimeout(unlockScroll, 50);
    }
  };

  const updateMessage = (index, content) => {
    const updatedMessages = [...messages];
    updatedMessages[index].content = content;
    setMessages(updatedMessages);
    onUpdate({ messages: updatedMessages });
  };

  const removeMessage = (index) => {
    lockScroll();
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
    onUpdate({ messages: updatedMessages });
    setTimeout(unlockScroll, 50);
  };

  const copyMessage = (index) => {
    navigator.clipboard.writeText(messages[index].content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleCollapse = (index) => {
    lockScroll();
    const newCollapsed = new Set(collapsedMessages);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedMessages(newCollapsed);
    setTimeout(unlockScroll, 50);
  };

  const MAX_COLLAPSED_LINES = 10;
  
  const MessageBubble = ({ message, index }) => {
    const messageTextareaRef = useRef(null);
    const wasCollapsedRef = useRef(false);
    const cursorPositionRef = useRef(null);
    const messageContainerRef = useRef(null);
    const isUser = message.role === 'user';
    const isCollapsed = collapsedMessages.has(index);
    
    // Calculate if message should be collapsible
    const lines = message.content.split('\n');
    const isLong = lines.length > 15 || message.content.length > 800;
    
    // Show full content when editing, otherwise respect collapsed state
    const displayContent = (editingIndex === index) 
      ? message.content
      : isCollapsed 
        ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n') + 
          (lines.length > MAX_COLLAPSED_LINES ? '\n...' : '')
        : message.content;
    
    // Handle entering edit mode with proper cursor positioning
    const handleEditClick = useCallback((e) => {
      if (editingIndex === index) return;
      
      // Lock scroll immediately
      lockScroll();
      
      // Calculate cursor position from click
      if (e.target.classList.contains('message-content')) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(e.target);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          cursorPositionRef.current = preCaretRange.toString().length;
        }
      }
      
      setEditingIndex(index);
      wasCollapsedRef.current = isCollapsed;
    }, [index, isCollapsed]);
    
    // Setup textarea when entering edit mode
    useLayoutEffect(() => {
      if (editingIndex === index && messageTextareaRef.current) {
        const textarea = messageTextareaRef.current;
        
        // Resize without triggering reflow
        requestAnimationFrame(() => {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
          
          // Position cursor
          if (cursorPositionRef.current !== null) {
            textarea.setSelectionRange(
              cursorPositionRef.current,
              cursorPositionRef.current
            );
            cursorPositionRef.current = null;
          }
          
          textarea.focus({ preventScroll: true });
        });
      }
    }, [editingIndex, index]);

    const handleBlur = useCallback((e) => {
      // Don't blur if clicking within the same message bubble
      const messageContainer = e.currentTarget.closest('.message-bubble');
      if (messageContainer && messageContainer.contains(e.relatedTarget)) {
        return;
      }
      
      lockScroll();
      setEditingIndex(null);
      
      // Restore collapsed state if needed
      if (wasCollapsedRef.current && isLong) {
        setTimeout(() => {
          const newCollapsed = new Set(collapsedMessages);
          newCollapsed.add(index);
          setCollapsedMessages(newCollapsed);
          unlockScroll();
        }, 50);
      } else {
        setTimeout(unlockScroll, 50);
      }
    }, [index, isLong]);

    const handleKeyDown = useCallback((e) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        if (e.key === 'Enter') e.preventDefault();
        
        lockScroll();
        setEditingIndex(null);
        
        if (wasCollapsedRef.current && isLong) {
          setTimeout(() => {
            const newCollapsed = new Set(collapsedMessages);
            newCollapsed.add(index);
            setCollapsedMessages(newCollapsed);
            unlockScroll();
          }, 50);
        } else {
          setTimeout(unlockScroll, 50);
        }
      }
    }, [index, isLong]);

    return (
      <div ref={messageContainerRef} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}>
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
          {/* Role Label with Actions */}
          <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs text-text-secondary/70 font-medium">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            
            {/* Copy button - no hover state to prevent reflow */}
            <button
              onClick={() => copyMessage(index)}
              className="transition-opacity p-0.5 rounded"
              style={{ opacity: editingIndex === index ? 1 : undefined }}
              title="Copy message"
            >
              {copiedIndex === index ? (
                <Check size={12} className="text-accent-green" />
              ) : (
                <Copy size={12} className="text-text-secondary/50" />
              )}
            </button>
            
            {isLong && (
              <button
                onClick={() => toggleCollapse(index)}
                className="transition-opacity p-0.5 rounded"
                style={{ opacity: editingIndex === index ? 1 : undefined }}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? 
                  <ChevronDown size={12} className="text-text-secondary/50" /> : 
                  <ChevronUp size={12} className="text-text-secondary/50" />
                }
              </button>
            )}
          </div>

          {/* Message Bubble */}
          <div className={`
            message-bubble relative rounded-lg px-4 py-3 w-full
            ${isUser 
              ? 'bg-dark-secondary/40 border border-dark-secondary/60' 
              : 'bg-gradient-to-br from-dark-secondary/20 to-dark-secondary/10 border border-dark-secondary/30'
            }
          `}>
            {editingIndex === index ? (
              <textarea
                ref={messageTextareaRef}
                value={message.content}
                onChange={(e) => {
                  updateMessage(index, e.target.value);
                  autoResize(e.target);
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="block w-full bg-transparent text-text-primary resize-none
                           focus:outline-none font-sans text-[15px] leading-[1.6]
                           whitespace-pre-wrap break-words"
                style={{ 
                  minHeight: 'auto',
                  maxHeight: '500px',
                  margin: '0',
                  padding: '0',
                  border: 'none',
                  width: '100%',
                  display: 'block',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  letterSpacing: 'inherit',
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  scrollbarGutter: 'stable both-edges'
                }}
                placeholder="Edit message... (Esc to cancel, Ctrl+Enter to save)"
              />
            ) : (
              <div 
                onClick={handleEditClick}
                className="message-content text-text-primary text-[15px] leading-[1.6] cursor-text
                           whitespace-pre-wrap break-words font-sans block w-full"
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
  };

  return (
    <div ref={scrollContainerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-text-secondary">
        <Bot size={18} />
        <span className="text-sm font-medium">AI Conversation</span>
        <div className="flex-grow h-px bg-dark-secondary/30" />
      </div>

      {/* Messages */}
      <div className="space-y-4 ai-messages-container">
        {messages.length === 0 && !isAddingMessage && (
          <div className="text-center py-12">
            <Bot size={32} className="text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">
              No messages yet. Start by adding a conversation.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} index={index} />
        ))}
      </div>

      {/* Add Message Interface */}
      {isAddingMessage && (
        <div className="space-y-3 p-4 bg-dark-secondary/20 rounded-lg border border-dark-secondary/30">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const textarea = document.querySelector('#new-message-textarea');
                addMessage('user', textarea.value);
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                         bg-dark-secondary hover:bg-dark-secondary/80 text-text-primary`}
            >
              <User size={14} className="inline mr-1" />
              User
            </button>
            <button
              onClick={() => {
                const textarea = document.querySelector('#new-message-textarea');
                addMessage('ai', textarea.value);
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                         bg-gradient-to-r from-accent-green/20 to-accent-green/10 
                         hover:from-accent-green/30 hover:to-accent-green/20
                         text-accent-green border border-accent-green/20`}
            >
              <Sparkles size={14} className="inline mr-1" />
              AI
            </button>
          </div>
          
          <textarea
            id="new-message-textarea"
            ref={textareaRef}
            onChange={(e) => autoResize(e.target)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsAddingMessage(false);
              }
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                addMessage('user', e.target.value);
              }
            }}
            className="w-full bg-dark-primary/50 text-text-primary p-4 rounded-lg
                       resize-none focus:outline-none focus:ring-2 focus:ring-accent-green/50
                       placeholder-text-secondary/50 text-[15px] leading-[1.8] font-sans
                       border border-dark-secondary/30"
            placeholder="Paste or type message content... (Ctrl+Enter to add as user)"
            autoFocus
            style={{ 
              minHeight: '120px',
              maxHeight: '400px',
              overflowY: 'auto',
              scrollbarGutter: 'stable'
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