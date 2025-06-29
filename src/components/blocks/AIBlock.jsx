import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function AIBlock({ block, onUpdate }) {
  const [messages, setMessages] = useState(block.messages || []);
  const [newMessage, setNewMessage] = useState({ role: 'user', content: '' });
  const [isAddingMessage, setIsAddingMessage] = useState(false);

  const addMessage = () => {
    if (newMessage.content.trim()) {
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      onUpdate(block.id, { messages: updatedMessages });
      setNewMessage({ role: 'user', content: '' });
      setIsAddingMessage(false);
    }
  };

  const removeMessage = (index) => {
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
    onUpdate(block.id, { messages: updatedMessages });
  };

  const updateMessage = (index, content) => {
    const updatedMessages = [...messages];
    updatedMessages[index].content = content;
    setMessages(updatedMessages);
    onUpdate(block.id, { messages: updatedMessages });
  };

  return (
    <div className="bg-card-gradient rounded-lg p-6 space-y-4">
      {messages.length === 0 && !isAddingMessage && (
        <p className="text-text-secondary text-center py-8">
          Click + to add AI conversation messages
        </p>
      )}

      {messages.map((message, index) => (
        <div key={index} className="flex gap-4 group">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${message.role === 'user' ? 'bg-dark-secondary' : 'bg-accent-green/20'}`}>
            <span className="text-text-primary text-sm font-medium">
              {message.role === 'user' ? 'U' : 'AI'}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-text-secondary text-sm">
                {message.role === 'user' ? 'User' : 'AI'}
              </span>
              <button
                onClick={() => removeMessage(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-text-secondary hover:text-red-500" />
              </button>
            </div>
            <textarea
              value={message.content}
              onChange={(e) => updateMessage(index, e.target.value)}
              className="w-full bg-transparent text-text-primary resize-none
                         focus:outline-none focus:bg-dark-secondary/30 rounded p-2 -ml-2"
              rows={message.content.split('\n').length || 1}
            />
          </div>
        </div>
      ))}

      {isAddingMessage && (
        <div className="flex gap-4">
          <select
            value={newMessage.role}
            onChange={(e) => setNewMessage({ ...newMessage, role: e.target.value })}
            className="bg-dark-secondary text-text-primary px-3 py-1 rounded"
          >
            <option value="user">User</option>
            <option value="ai">AI</option>
          </select>
          <textarea
            value={newMessage.content}
            onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
            onBlur={addMessage}
            className="flex-1 bg-dark-secondary/50 text-text-primary p-2 rounded
                       focus:outline-none focus:ring-2 focus:ring-accent-green"
            placeholder="Enter message content..."
            autoFocus
          />
        </div>
      )}

      <button
        onClick={() => setIsAddingMessage(true)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary
                   transition-colors"
      >
        <Plus size={16} />
        Add message
      </button>
    </div>
  );
}