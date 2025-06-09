import { useState, useRef, useEffect } from 'react';
import { Bot, User, Plus, Copy, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function AIBlock({ block, onUpdate }) {
  const [messages, setMessages] = useState(block.messages || []);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [collapsedMessages, setCollapsedMessages] = useState(new Set());
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const autoResize = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [isAddingMessage]);

  const addMessage = (role, content) => {
    if (content.trim()) {
      const updatedMessages = [...messages, { role, content: content.trim() }];
      setMessages(updatedMessages);
      onUpdate({ messages: updatedMessages });
      setIsAddingMessage(false);
    }
  };

  const updateMessage = (index, content) => {
    const updatedMessages = [...messages];
    updatedMessages[index].content = content;
    setMessages(updatedMessages);
    onUpdate({ messages: updatedMessages });
  };

  const removeMessage = (index) => {
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
    onUpdate({ messages: updatedMessages });
  };

  const copyMessage = (index) => {
    navigator.clipboard.writeText(messages[index].content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleCollapse = (index) => {
    const newCollapsed = new Set(collapsedMessages);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedMessages(newCollapsed);
  };

  const MessageBubble = ({ message, index }) => {
    const isUser = message.role === 'user';
    const isCollapsed = collapsedMessages.has(index);
    const isLong = message.content.length > 500;
    const displayContent = isCollapsed 
      ? message.content.substring(0, 150) + '...'
      : message.content;

    return (
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}>
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
            
            {/* Copy button in header */}
            <button
              onClick={() => copyMessage(index)}
              className="opacity-0 group-hover:opacity-100 transition-opacity
                         p-0.5 hover:bg-dark-secondary/50 rounded"
              title="Copy message"
            >
              {copiedIndex === index ? (
                <Check size={12} className="text-accent-green" />
              ) : (
                <Copy size={12} className="text-text-secondary/50 hover:text-text-secondary" />
              )}
            </button>
            
            {isLong && (
              <button
                onClick={() => toggleCollapse(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity
                           p-0.5 hover:bg-dark-secondary/50 rounded"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? 
                  <ChevronDown size={12} className="text-text-secondary/50 hover:text-text-secondary" /> : 
                  <ChevronUp size={12} className="text-text-secondary/50 hover:text-text-secondary" />
                }
              </button>
            )}
          </div>

          {/* Message Bubble */}
          <div className={`
            relative rounded-lg px-4 py-3
            ${isUser 
              ? 'bg-dark-secondary/40 border border-dark-secondary/60' 
              : 'bg-gradient-to-br from-dark-secondary/20 to-dark-secondary/10 border border-dark-secondary/30'
            }
            ${editingIndex === index ? 'ring-1 ring-accent-green/50' : ''}
          `}>
            {editingIndex === index ? (
              <textarea
                ref={textareaRef}
                value={message.content}
                onChange={(e) => {
                  updateMessage(index, e.target.value);
                  autoResize(e.target);
                }}
                onBlur={() => setEditingIndex(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingIndex(null);
                  }
                }}
                className="w-full bg-transparent text-text-primary resize-none
                           focus:outline-none font-sans text-[15px] leading-[1.6]"
                style={{ minHeight: '40px' }}
                autoFocus
              />
            ) : (
              <div 
                onClick={() => setEditingIndex(index)}
                className="text-text-primary text-[15px] leading-[1.6] cursor-text
                           whitespace-pre-wrap break-words font-sans"
              >
                {displayContent}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-text-secondary">
        <Bot size={18} />
        <span className="text-sm font-medium">AI Conversation</span>
        <div className="flex-grow h-px bg-dark-secondary/30" />
      </div>

      {/* Messages */}
      <div className="space-y-4">
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
            className="w-full bg-dark-secondary/30 text-text-primary p-3 rounded-md
                       resize-none focus:outline-none focus:ring-1 focus:ring-accent-green/50
                       placeholder-text-secondary/50 text-[15px] leading-[1.6] font-sans"
            placeholder="Paste or type message content... (Ctrl+Enter to add as user)"
            autoFocus
            style={{ minHeight: '80px' }}
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