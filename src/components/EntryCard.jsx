export default function EntryCard({ entry, onExpand }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div 
      onClick={() => onExpand(entry)}
      className="bg-card-gradient rounded-lg p-6 cursor-pointer 
                 transition-all duration-300 hover:scale-105 hover:shadow-xl
                 flex flex-col h-full"
    >
      {/* Header with date */}
      <div className="flex justify-between items-start mb-3">
        <div className="text-text-secondary text-sm">
          Document
        </div>
        {entry.updatedAt && (
          <div className="text-text-secondary text-xs">
            {formatDate(entry.updatedAt)}
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-text-primary text-lg font-medium mb-2">
        {entry.title}
      </h3>
      
      {/* Preview content */}
      <p className="text-text-secondary text-sm line-clamp-2 flex-grow">
        {entry.preview}
      </p>

      {/* Tags preview */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {entry.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="text-xs px-2 py-1 bg-dark-secondary/50 rounded-full 
                         text-text-secondary"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className="text-xs text-text-secondary">
              +{entry.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}