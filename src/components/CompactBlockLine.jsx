import { 
  Type, 
  Code, 
  MessageSquare, 
  Hash, 
  FolderTree, 
  Table, 
  CheckSquare,
  FileCode,
  ChevronRight,
  Image
} from 'lucide-react';

// Icon mapping for each block type
const blockIcons = {
  text: Type,
  code: Code,
  ai: MessageSquare,
  heading: Hash,
  filetree: FolderTree,
  table: Table,
  todo: CheckSquare,
  image: Image,
  'inline-image': Image
};

// Subtle gradient accents for each block type
const blockAccents = {
  text: 'from-blue-500/10 to-blue-600/5',
  code: 'from-accent-green/10 to-accent-green/5',
  ai: 'from-purple-500/10 to-purple-600/5',
  heading: 'from-yellow-500/10 to-yellow-600/5',
  filetree: 'from-cyan-500/10 to-cyan-600/5',
  table: 'from-orange-500/10 to-orange-600/5',
  todo: 'from-red-500/10 to-red-600/5',
  image: 'from-teal-500/10 to-teal-600/5',
  'inline-image': 'from-teal-500/10 to-teal-600/5'
};

// Helper function to clean markdown from text
const cleanMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // Remove heading markers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]') // Convert images
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // Document links
    .replace(/#(\w+)\[([^\]]+)\]/g, '$2') // Remove tag syntax
    .trim();
};

export default function CompactBlockLine({ block, index, onClick, isSelected }) {
  const Icon = blockIcons[block.type] || FileCode;
  const gradientClass = blockAccents[block.type] || 'from-gray-500/10 to-gray-600/5';
  
  // Extract preview text based on block type
  const getPreviewText = () => {
    switch (block.type) {
      case 'heading':
        return cleanMarkdown(block.content || 'Untitled Heading');
      case 'text':
        const cleanedText = cleanMarkdown(block.content || '');
        return cleanedText.substring(0, 100).replace(/\n/g, ' ');
      case 'code':
        return `${block.language || 'code'}: ${(block.content || '').substring(0, 80).replace(/\n/g, ' ')}`;
      case 'ai':
        const lastMessage = block.messages?.[block.messages.length - 1];
        if (lastMessage) {
          const cleanedAIContent = cleanMarkdown(lastMessage.content);
          return `${lastMessage.role}: ${cleanedAIContent.substring(0, 80)}`;
        }
        return 'AI Conversation';
      case 'table':
        const rows = block.data?.rows?.length || 0;
        const cols = block.data?.headers?.length || 0;
        return `Table (${rows}×${cols})`;
      case 'filetree':
        return `File Tree: ${block.name || 'Project Structure'}`;
      case 'todo':
        const completed = block.todos?.filter(t => t.completed).length || 0;
        const total = block.todos?.length || 0;
        return `Tasks: ${completed}/${total} completed`;
      case 'image':
        const imageCount = block.images?.length || (block.url ? 1 : 0);
        if (imageCount === 0) return 'Empty image block';
        if (imageCount === 1) {
          const firstImage = block.images?.[0] || block;
          return firstImage.alt || 'Image';
        }
        return `Gallery: ${imageCount} images`;
      case 'inline-image':
        return block.alt || 'Inline image';
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
      // Count words in cleaned text for more accurate count
      const cleanedContent = cleanMarkdown(block.content);
      const words = cleanedContent.split(/\s+/).filter(w => w.length > 0).length;
      metadata.push(`${words} words`);
    }
    
    // Add image count and size for image blocks
    if (block.type === 'image') {
      const imageCount = block.images?.length || (block.url ? 1 : 0);
      if (imageCount > 0) {
        metadata.push(`${imageCount} ${imageCount === 1 ? 'image' : 'images'}`);
        
        // Calculate total size if available
        if (block.images?.length > 0) {
          const totalSize = block.images.reduce((sum, img) => sum + (img.size || 0), 0);
          if (totalSize > 0) {
            metadata.push(`${(totalSize / 1024 / 1024).toFixed(1)} MB`);
          }
        } else if (block.size) {
          metadata.push(`${(block.size / 1024).toFixed(1)} KB`);
        }
      }
    }
    
    // Add dimensions for inline images
    if (block.type === 'inline-image' && block.dimensions) {
      metadata.push(`${block.dimensions.width}×${block.dimensions.height}`);
    }
    
    return metadata;
  };
  
  const previewText = getPreviewText();
  const metadata = getMetadata();
  
  return (
    <div 
      onClick={() => onClick(block.id)}
      className={`
        group relative overflow-hidden cursor-pointer
        transition-all duration-300 ease-out
        ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
      `}
    >
      {/* Background gradient */}
      <div className={`
        absolute inset-0 bg-gradient-to-r ${gradientClass}
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${isSelected ? 'opacity-100' : ''}
      `} />
      
      {/* Left accent bar */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-0.5 
        bg-gradient-to-b ${gradientClass.replace('/10', '/40').replace('/5', '/20')}
        transform origin-left transition-all duration-300
        ${isSelected ? 'scale-x-[200%]' : 'scale-x-0 group-hover:scale-x-100'}
      `} />
      
      <div className="relative flex items-center gap-4 px-6 py-3">
        {/* Index with subtle background */}
        <div className="relative">
          <div className="absolute inset-0 bg-dark-secondary/20 rounded blur-sm" />
          <div className="relative text-text-secondary/30 text-xs font-mono px-2 py-1">
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>
        
        {/* Icon with gradient background */}
        <div className="relative">
          <div className={`
            absolute inset-0 bg-gradient-to-br ${gradientClass}
            rounded-lg blur-md scale-150 opacity-50
          `} />
          <div className="relative p-2 bg-dark-secondary/50 rounded-lg
                          border border-dark-secondary/50 group-hover:border-text-secondary/20
                          transition-all duration-300">
            <Icon size={14} className="text-text-secondary/70 group-hover:text-text-primary transition-colors" />
          </div>
        </div>
        
        {/* Content Preview with subtle typography */}
        <div className="flex-1 min-w-0">
          <div className="text-text-primary/90 text-sm truncate font-light
                          group-hover:text-text-primary transition-colors">
            {previewText}
          </div>
        </div>
        
        {/* Metadata with glass effect */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {metadata.map((meta, i) => (
            <span 
              key={i}
              className="text-xs text-text-secondary/50 
                         bg-dark-primary/30 backdrop-blur-sm
                         border border-dark-secondary/20
                         px-3 py-1 rounded-full whitespace-nowrap
                         group-hover:border-text-secondary/30 
                         group-hover:text-text-secondary/70
                         transition-all duration-300"
            >
              {meta}
            </span>
          ))}
        </div>
        
        {/* Hover indicator */}
        <ChevronRight 
          size={14} 
          className="text-text-secondary/20 group-hover:text-text-secondary/50 
                     transform translate-x-1 group-hover:translate-x-0
                     opacity-0 group-hover:opacity-100
                     transition-all duration-300" 
        />
      </div>
    </div>
  );
}