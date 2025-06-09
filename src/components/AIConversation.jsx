export default function AIConversation({ messages }) {
  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div key={index} className="flex gap-4">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${message.role === 'user' ? 'bg-dark-secondary' : 'bg-dark-secondary'}`}>
            <span className="text-text-primary text-sm">
              {message.role === 'user' ? 'U' : 'AI'}
            </span>
          </div>
          
          {/* Message Content */}
          <div className="flex-1">
            <div className="text-text-secondary text-sm mb-2">
              {message.role === 'user' ? 'User' : 'AI'}
            </div>
            <div className="text-text-primary">
              {message.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}