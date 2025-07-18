import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User, Plus, Copy, Check, ChevronDown, ChevronUp, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { parseMarkdown } from '../../utils/parseMarkdown.jsx';
import '../AIBlockScroll.css';

export default function AIBlock({ block, onUpdate }) {
  const [messages, setMessages] = useState(block.messages || []);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [collapsedMessages, setCollapsedMessages] = useState(new Set(block.metadata?.collapsedMessages || []));
  const [isBlockCollapsed, setIsBlockCollapsed] = useState(block.metadata?.isBlockCollapsed || false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [parsedMessages, setParsedMessages] = useState([]);
  const [selectedRole, setSelectedRole] = useState('user');
  const textareaRef = useRef(null);

  // Auto-resize textarea helper
  const autoResize = useCallback((textarea) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  // Check if text looks like a conversation
  const looksLikeConversation = useCallback((text) => {
    const conversationPatterns = [
      /^(User|You|Human|Me):\s*/mi,
      /^(Assistant|AI|ChatGPT|Claude|Bot):\s*/mi,
      /^(Question|Q):\s*/mi,
      /^(Answer|A):\s*/mi,
    ];
    
    // Check if text contains multiple role indicators
    let matchCount = 0;
    for (const pattern of conversationPatterns) {
      if (pattern.test(text)) {
        matchCount++;
        if (matchCount >= 2) return true;
      }
    }
    
    // Also check for alternating pattern without explicit labels
    const lines = text.split('\n').filter(line => line.trim());
    return lines.length >= 4 && lines.some((_, i) => i % 2 === 0);
  }, []);

  // Parse conversation text into messages
  const parseConversation = useCallback((text) => {
    const messages = [];
    const lines = text.split('\n');
    
    // Patterns for role detection
    const userPatterns = /^(User|You|Human|Me|Question|Q):\s*/i;
    const aiPatterns = /^(Assistant|AI|ChatGPT|Claude|Bot|Answer|A):\s*/i;
    
    let currentMessage = null;
    let lastRole = 'ai'; // Start with AI so first message defaults to user
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line starts with a role indicator
      if (userPatterns.test(trimmedLine)) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }
        // Start new user message
        currentMessage = {
          role: 'user',
          content: trimmedLine.replace(userPatterns, '').trim()
        };
        lastRole = 'user';
      } else if (aiPatterns.test(trimmedLine)) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }
        // Start new AI message
        currentMessage = {
          role: 'ai',
          content: trimmedLine.replace(aiPatterns, '').trim()
        };
        lastRole = 'ai';
      } else if (trimmedLine) {
        // Continue current message or start new one with alternating role
        if (currentMessage) {
          currentMessage.content += '\n' + trimmedLine;
        } else {
          // No role indicator found, alternate roles
          currentMessage = {
            role: lastRole === 'user' ? 'ai' : 'user',
            content: trimmedLine
          };
          lastRole = currentMessage.role;
        }
      } else if (currentMessage && trimmedLine === '') {
        // Empty line might indicate message boundary
        messages.push(currentMessage);
        currentMessage = null;
      }
    }
    
    // Don't forget the last message
    if (currentMessage) {
      messages.push(currentMessage);
    }
    
    return messages.filter(m => m.content.trim());
  }, []);

  // Initialize new message textarea
  useEffect(() => {
    if (isAddingMessage && textareaRef.current) {
      autoResize(textareaRef.current);
      textareaRef.current.focus();
    }
  }, [isAddingMessage, autoResize]);

  // Handle paste event
  const handlePaste = useCallback((e) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if it looks like a conversation
    if (pastedText.includes('\n') && looksLikeConversation(pastedText)) {
      e.preventDefault();
      const parsed = parseConversation(pastedText);
      setParsedMessages(parsed);
      setShowImportPreview(true);
    }
  }, [looksLikeConversation, parseConversation]);

  // Message management functions
  const addMessage = useCallback((role, content) => {
    if (!content.trim()) return;
    
    const newMessage = { role, content: content.trim() };
    const updatedMessages = [...messages, newMessage];
    console.log('🟢 AI Block: Adding message', {
      blockId: block.id,
      role,
      contentLength: content.length,
      previousMessageCount: messages.length,
      newMessageCount: updatedMessages.length
    });
    setMessages(updatedMessages);
    onUpdate(block.id, { messages: updatedMessages });
    setIsAddingMessage(false);
    
    // Auto-collapse long messages
    const lines = content.trim().split('\n');
    if (lines.length > 15) {
      setCollapsedMessages(prev => new Set([...prev, messages.length]));
    }
  }, [messages, onUpdate, block.id]);

  // Import multiple messages at once
  const importMessages = useCallback(() => {
    if (parsedMessages.length === 0) return;
    
    const updatedMessages = [...messages, ...parsedMessages];
    setMessages(updatedMessages);
    onUpdate(block.id, { messages: updatedMessages });
    setShowImportPreview(false);
    setParsedMessages([]);
    
    // Auto-collapse long messages
    parsedMessages.forEach((msg, idx) => {
      const lines = msg.content.split('\n');
      if (lines.length > 15) {
        setCollapsedMessages(prev => new Set([...prev, messages.length + idx]));
      }
    });
  }, [messages, parsedMessages, onUpdate, block.id]);

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
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-blue-500/20 border-2 border-blue-500/30' 
            : 'bg-gradient-to-br from-accent-green/20 to-accent-green/10 border-2 border-accent-green/30'
          }
        `}>
          {isUser ? (
            <User size={20} className="text-blue-400" />
          ) : (
            <Sparkles size={20} className="text-accent-green" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Role Label */}
          <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
            <span className={`text-sm font-semibold ${isUser ? 'text-blue-400' : 'text-accent-green'}`}>
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            
            {/* Action buttons - always visible for long messages, full opacity on hover */}
            <div className={`flex gap-1 ${isLong || isEditing ? 'opacity-50 hover:opacity-100' : 'opacity-0 hover:opacity-100'} transition-opacity`}>
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
            relative rounded-lg px-4 py-3 w-full border-l-4
            ${isUser 
              ? 'bg-dark-secondary/40 border border-dark-secondary/60 border-l-blue-500' 
              : 'bg-gradient-to-br from-dark-secondary/20 to-dark-secondary/10 border border-dark-secondary/30 border-l-accent-green'
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
                         whitespace-pre-wrap break-words font-sans prose-sm"
              >
                {/* Parse markdown for better display */}
                <div className="space-y-2">
                  {displayContent.split('\n').map((line, lineIndex) => (
                    <div key={lineIndex}>
                      {line.trim() ? parseMarkdown(line) : <br />}
                    </div>
                  ))}
                </div>
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

  // Update metadata when collapse states change
  useEffect(() => {
    // Check if metadata actually changed to prevent infinite loops
    const currentCollapsedArray = Array.from(collapsedMessages);
    const prevCollapsedArray = block.metadata?.collapsedMessages || [];
    const prevIsBlockCollapsed = block.metadata?.isBlockCollapsed || false;
    
    const collapsedChanged = currentCollapsedArray.length !== prevCollapsedArray.length || 
      !currentCollapsedArray.every(val => prevCollapsedArray.includes(val));
    const blockCollapsedChanged = isBlockCollapsed !== prevIsBlockCollapsed;
    
    if (collapsedChanged || blockCollapsedChanged) {
      const metadata = {
        ...block.metadata,
        collapsedMessages: currentCollapsedArray,
        isBlockCollapsed
      };
      onUpdate(block.id, { metadata });
    }
  }, [collapsedMessages, isBlockCollapsed, block.id, block.metadata, onUpdate]);

  const toggleBlockCollapse = useCallback(() => {
    setIsBlockCollapsed(prev => !prev);
  }, []);

  // Import Preview Modal Component
  const ImportPreviewModal = () => {
    if (!showImportPreview || parsedMessages.length === 0) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImportPreview(false)}>
        <div 
          className="bg-dark-primary border border-dark-secondary/50 rounded-lg p-6 max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-accent-green" />
              <h3 className="text-lg font-semibold text-text-primary">Import Conversation</h3>
              <span className="text-sm text-text-secondary">({parsedMessages.length} messages detected)</span>
            </div>
            <button
              onClick={() => setShowImportPreview(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[50vh]">
            {parsedMessages.map((msg, idx) => (
              <div key={idx} className="flex gap-3 p-3 rounded-lg bg-dark-secondary/20">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => {
                      const updated = [...parsedMessages];
                      updated[idx].role = updated[idx].role === 'user' ? 'ai' : 'user';
                      setParsedMessages(updated);
                    }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${msg.role === 'user' 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/30' 
                        : 'bg-gradient-to-br from-accent-green/20 to-accent-green/10 hover:from-accent-green/30 hover:to-accent-green/20 border-2 border-accent-green/30'
                      }
                    `}
                    title="Click to toggle role"
                  >
                    {msg.role === 'user' ? (
                      <User size={18} className="text-blue-400" />
                    ) : (
                      <Sparkles size={18} className="text-accent-green" />
                    )}
                  </button>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1">
                    <span className={msg.role === 'user' ? 'text-blue-400' : 'text-accent-green'}>
                      {msg.role === 'user' ? 'User' : 'AI'}
                    </span>
                    <span className="text-text-secondary/50 ml-2">(click icon to switch)</span>
                  </div>
                  <div className="text-sm text-text-primary whitespace-pre-wrap">
                    {msg.content.length > 200 
                      ? msg.content.substring(0, 200) + '...' 
                      : msg.content
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-dark-secondary/30">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <AlertCircle size={16} />
              <span>Click role icons to fix any incorrectly detected roles</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportPreview(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={importMessages}
                className="px-4 py-2 bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 transition-colors font-medium"
              >
                Import All
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-block-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-text-secondary">
        <Bot size={18} />
        <span className="text-sm font-medium">AI Conversation</span>
        {messages.length > 0 && (
          <span className="text-xs text-text-secondary/70">({messages.length} messages)</span>
        )}
        <div className="flex-grow h-px bg-dark-secondary/30" />
        {messages.length > 0 && (
          <button
            onClick={toggleBlockCollapse}
            className="p-1 hover:bg-dark-secondary/50 rounded transition-colors"
            title={isBlockCollapsed ? "Expand conversation" : "Collapse conversation"}
          >
            {isBlockCollapsed ? 
              <ChevronDown size={16} className="text-text-secondary/70" /> : 
              <ChevronUp size={16} className="text-text-secondary/70" />
            }
          </button>
        )}
      </div>

      {/* Messages Container */}
      {!isBlockCollapsed && (
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
      )}

      {/* Collapsed State Summary */}
      {isBlockCollapsed && messages.length > 0 && (
        <div 
          onClick={toggleBlockCollapse}
          className="bg-dark-secondary/20 rounded-lg p-4 cursor-pointer hover:bg-dark-secondary/30 transition-colors"
        >
          <div className="space-y-2">
            {messages.slice(0, 3).map((message, index) => {
              const firstLine = message.content.split('\n')[0];
              // Remove markdown symbols for cleaner preview
              const cleanedLine = firstLine
                .replace(/^#+\s+/, '') // Remove heading markers
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                .replace(/\*(.*?)\*/g, '$1') // Remove italic
                .replace(/`(.*?)`/g, '$1') // Remove inline code
                .substring(0, 80);
              
              return (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-text-secondary/70 flex-shrink-0">
                    {message.role === 'user' ? 'U:' : 'AI:'}
                  </span>
                  <span className="text-text-secondary truncate">
                    {cleanedLine}...
                  </span>
                </div>
              );
            })}
            {messages.length > 3 && (
              <div className="text-xs text-text-secondary/50 text-center">
                ... and {messages.length - 3} more messages
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Message Interface - Improved UI */}
      {!isBlockCollapsed && isAddingMessage && (
        <div className="space-y-4 bg-dark-secondary/10 rounded-lg p-4 border border-dark-secondary/30">
          {/* Role Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Adding as:</span>
            <div className="flex rounded-lg bg-dark-secondary/30 p-1">
              <button
                onClick={() => setSelectedRole('user')}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5
                  ${selectedRole === 'user'
                    ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                <User size={14} />
                User
              </button>
              <button
                onClick={() => setSelectedRole('ai')}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5
                  ${selectedRole === 'ai'
                    ? 'bg-accent-green/20 text-accent-green shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                <Sparkles size={14} />
                AI
              </button>
            </div>
          </div>
          
          {/* Textarea with paste handler */}
          <textarea
            ref={textareaRef}
            onChange={(e) => autoResize(e.target)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsAddingMessage(false);
                setSelectedRole('user');
              } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                const content = e.target.value;
                if (content.trim()) {
                  addMessage(selectedRole, content);
                }
              } else if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
                e.preventDefault();
                setSelectedRole('user');
              } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                e.preventDefault();
                setSelectedRole('ai');
              }
            }}
            className={`
              w-full text-text-primary p-4 rounded-lg resize-none
              focus:outline-none focus:ring-2 placeholder-text-secondary/50 
              text-[15px] leading-[1.8] font-sans border transition-all
              ${selectedRole === 'user' 
                ? 'bg-blue-500/5 border-blue-500/20 focus:ring-blue-500/50' 
                : 'bg-accent-green/5 border-accent-green/20 focus:ring-accent-green/50'
              }
            `}
            placeholder={`Type or paste message content...`}
            style={{ 
              minHeight: '120px',
              maxHeight: '400px',
              overflow: 'auto'
            }}
          />
          
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-secondary">
              Paste multi-line text for auto-import
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsAddingMessage(false);
                  setSelectedRole('user');
                }}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const content = textareaRef.current?.value || '';
                  if (content.trim()) {
                    addMessage(selectedRole, content);
                  }
                }}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${selectedRole === 'user'
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
                    : 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/30'
                  }
                `}
              >
                Add {selectedRole === 'user' ? 'User' : 'AI'} Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!isBlockCollapsed && !isAddingMessage && (
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
      
      {/* Import Preview Modal */}
      <ImportPreviewModal />
    </div>
  );
}