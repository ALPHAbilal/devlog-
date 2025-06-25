import { 
  Type, 
  Code, 
  MessageSquare, 
  Hash, 
  FolderTree, 
  Table, 
  FileText, 
  Calculator,
  CheckSquare,
  FileCode
} from 'lucide-react';

// Icon mapping for each block type
const blockIcons = {
  text: Type,
  code: Code,
  ai: MessageSquare,
  heading: Hash,
  filetree: FolderTree,
  table: Table,
  template: FileText,
  math: Calculator,
  todo: CheckSquare
};

// Color mapping for each block type
const blockColors = {
  text: 'text-blue-400',
  code: 'text-green-400',
  ai: 'text-purple-400',
  heading: 'text-yellow-400',
  filetree: 'text-cyan-400',
  table: 'text-orange-400',
  template: 'text-pink-400',
  math: 'text-indigo-400',
  todo: 'text-red-400'
};

export default function CompactBlockLine({ block, index, onClick, isSelected }) {
  const Icon = blockIcons[block.type] || FileCode;
  const colorClass = blockColors[block.type] || 'text-gray-400';
  
  // Extract preview text based on block type
  const getPreviewText = () => {
    switch (block.type) {
      case 'heading':
        return block.content || 'Untitled Heading';
      case 'text':
        return (block.content || '').substring(0, 100).replace(/\n/g, ' ');
      case 'code':
        return `${block.language || 'code'}: ${(block.content || '').substring(0, 80).replace(/\n/g, ' ')}`;
      case 'ai':
        const lastMessage = block.messages?.[block.messages.length - 1];
        return lastMessage ? `${lastMessage.role}: ${lastMessage.content.substring(0, 80)}` : 'AI Conversation';
      case 'table':
        const rows = block.rows?.length || 0;
        const cols = block.headers?.length || 0;
        return `Table (${rows}×${cols})`;
      case 'filetree':
        return `File Tree: ${block.name || 'Project Structure'}`;
      case 'template':
        return `Template: ${block.templateType || 'Unknown'}`;
      case 'math':
        return block.content || 'Math Expression';
      case 'todo':
        const completed = block.todos?.filter(t => t.completed).length || 0;
        const total = block.todos?.length || 0;
        return `Tasks: ${completed}/${total} completed`;
      default:
        return 'Unknown Block';
    }
  };
  
  // Get metadata based on block type
  const getMetadata = () => {
    const metadata = [];
    
    if (block.type === 'heading') {
      metadata.push(`H${block.level || 2}`);
    }
    
    if (block.type === 'code' && block.language) {
      metadata.push(block.language.toUpperCase());
    }
    
    if (block.type === 'ai' && block.messages?.length) {
      metadata.push(`${block.messages.length} messages`);
    }
    
    if (block.type === 'todo' && block.todos?.length) {
      const completed = block.todos.filter(t => t.completed).length;
      metadata.push(`${Math.round((completed / block.todos.length) * 100)}%`);
    }
    
    // Add word count for text blocks
    if ((block.type === 'text' || block.type === 'heading') && block.content) {
      const words = block.content.split(/\s+/).filter(w => w.length > 0).length;
      metadata.push(`${words} words`);
    }
    
    return metadata;
  };
  
  const previewText = getPreviewText();
  const metadata = getMetadata();
  
  return (
    <div 
      onClick={() => onClick(block.id)}
      className={`
        group flex items-center gap-3 px-4 py-2 
        border-l-2 transition-all duration-200 cursor-pointer
        hover:bg-dark-secondary/30
        ${isSelected 
          ? 'border-accent-green bg-dark-secondary/50' 
          : 'border-transparent hover:border-text-secondary/30'
        }
      `}
    >
      {/* Index */}
      <div className="text-text-secondary/40 text-xs font-mono w-8 flex-shrink-0">
        {String(index + 1).padStart(2, '0')}
      </div>
      
      {/* Icon */}
      <div className={`${colorClass} flex-shrink-0 transition-colors group-hover:text-text-primary`}>
        <Icon size={16} />
      </div>
      
      {/* Content Preview */}
      <div className="flex-1 min-w-0">
        <div className="text-text-primary text-sm truncate">
          {previewText}
        </div>
      </div>
      
      {/* Metadata */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {metadata.map((meta, i) => (
          <span 
            key={i}
            className="text-xs text-text-secondary/60 bg-dark-secondary/50 
                       px-2 py-0.5 rounded-full whitespace-nowrap"
          >
            {meta}
          </span>
        ))}
      </div>
    </div>
  );
}