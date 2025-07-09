import { useState, useRef, useEffect } from 'react';
import { Bot, User, Plus, Copy, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function AIBlock({ block, onUpdate }) {
  const [messages, setMessages] = useState(block.messages || []);
  const [editingIndex, setEditingIndex] = useState(null);

  const MessageBubble = ({ message, index }) => {
    const isUser = message.role === 'user';
    const isEditing = editingIndex === index;

    return (
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar - Fixed width */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-dark-secondary" />
        
        {/* Message container - This should maintain same width */}
        <div className="flex-1 max-w-[85%] border-2 border-red-500">
          <div className="bg-dark-secondary/40 rounded-lg px-4 py-3">
            {isEditing ? (
              <div className="border-2 border-green-500">
                <textarea
                  value={message.content}
                  onChange={(e) => {
                    const updatedMessages = [...messages];
                    updatedMessages[index].content = e.target.value;
                    setMessages(updatedMessages);
                  }}
                  onBlur={() => setEditingIndex(null)}
                  className="w-full bg-transparent resize-none outline-none"
                  style={{
                    margin: 0,
                    padding: 0,
                    border: 'none',
                    font: 'inherit',
                    lineHeight: 'inherit',
                    minHeight: '100px'
                  }}
                />
              </div>
            ) : (
              <div 
                onClick={() => setEditingIndex(index)}
                className="cursor-text border-2 border-blue-500"
              >
                {message.content}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3>Debug AI Block</h3>
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} index={idx} />
      ))}
      <button 
        onClick={() => {
          setMessages([...messages, { role: 'user', content: 'Test message that is long enough to see the width difference when editing' }]);
        }}
        className="bg-accent-green px-4 py-2 rounded"
      >
        Add Test Message
      </button>
    </div>
  );
}