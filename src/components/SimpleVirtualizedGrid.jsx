import React from 'react';

export default function SimpleVirtualizedGrid({ 
  entries = [], 
  onExpand,
  searchTerm,
  selectedDocuments = new Set(),
  onSelectDocument,
  selectionMode = false
}) {
  const handleCardClick = (entry) => {
    if (onExpand) {
      onExpand(entry);
    }
  };

  return (
    <div style={{ 
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '20px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        paddingBottom: '20px'
      }}>
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            onClick={() => handleCardClick(entry)}
            style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)',
              padding: '20px',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              minHeight: '150px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{
              color: '#e2e8f0',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {entry.title}
            </h3>
            <p style={{
              color: 'rgba(226, 232, 240, 0.6)',
              fontSize: '14px',
              lineHeight: '1.5',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}>
              {entry.preview}
            </p>
            {entry.tags && entry.tags.length > 0 && (
              <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {entry.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: 'rgba(226, 232, 240, 0.7)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}