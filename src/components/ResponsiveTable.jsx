import { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, MoreVertical, Copy, Trash2, Edit } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { useTouchGestures } from '../hooks/useTouchGestures';

/**
 * ResponsiveTable Component
 * Adapts between traditional table layout (desktop) and card layout (mobile)
 */
export default function ResponsiveTable({ 
  columns, 
  data, 
  onRowClick, 
  onRowAction,
  className = '',
  enableSwipeActions = true,
  stickyHeader = true,
  maxHeight,
}) {
  const { isMobile, isTablet } = useResponsive();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [swipedRow, setSwipedRow] = useState(null);
  const tableRef = useRef(null);

  // Toggle row expansion on mobile
  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  // Desktop table view
  if (!isMobile && !isTablet) {
    return (
      <div className={`overflow-hidden rounded-lg border border-dark-secondary ${className}`}>
        <div 
          className={`overflow-auto momentum-scroll ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}
          ref={tableRef}
        >
          <table className="min-w-full divide-y divide-dark-secondary">
            <thead className={`bg-dark-secondary/50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key || index}
                    className={`px-6 py-3 text-left text-xs font-medium text-text-secondary 
                               uppercase tracking-wider ${column.className || ''}`}
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
                {onRowAction && (
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-dark-primary divide-y divide-dark-secondary/50">
              {data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-dark-secondary/30' : ''} 
                             transition-colors`}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key || colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-text-primary 
                                 ${column.cellClassName || ''}`}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {onRowAction && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowAction(row, 'menu');
                        }}
                        className="text-text-secondary hover:text-text-primary p-2 
                                   hover:bg-dark-secondary rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Mobile card view
  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((row, rowIndex) => {
        const isExpanded = expandedRows.has(row.id || rowIndex);
        const isSwiped = swipedRow === (row.id || rowIndex);

        return (
          <MobileTableCard
            key={row.id || rowIndex}
            row={row}
            columns={columns}
            isExpanded={isExpanded}
            isSwiped={isSwiped}
            onToggleExpand={() => toggleRowExpansion(row.id || rowIndex)}
            onSwipe={(direction) => {
              if (enableSwipeActions && onRowAction) {
                if (direction === 'left') {
                  setSwipedRow(row.id || rowIndex);
                } else {
                  setSwipedRow(null);
                }
              }
            }}
            onRowClick={onRowClick}
            onRowAction={onRowAction}
          />
        );
      })}
    </div>
  );
}

// Mobile card component
function MobileTableCard({ 
  row, 
  columns, 
  isExpanded, 
  isSwiped,
  onToggleExpand, 
  onSwipe,
  onRowClick,
  onRowAction 
}) {
  const cardRef = useRef(null);
  
  // Touch gestures for swipe actions
  useTouchGestures(cardRef, {
    onSwipeLeft: () => onSwipe('left'),
    onSwipeRight: () => onSwipe('right'),
    swipeThreshold: 80,
  });

  // Determine primary columns (first 2-3 columns shown by default)
  const primaryColumns = columns.slice(0, isSwiped ? 1 : 3);
  const secondaryColumns = columns.slice(isSwiped ? 1 : 3);

  return (
    <div 
      ref={cardRef}
      className="relative bg-dark-primary rounded-lg border border-dark-secondary 
                 overflow-hidden transition-transform"
      style={{
        transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)',
      }}
    >
      {/* Swipe actions backdrop */}
      {isSwiped && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500/20 
                        flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowAction?.(row, 'delete');
              onSwipe('right');
            }}
            className="p-3 text-red-400"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}

      {/* Card content */}
      <div 
        className="p-4 space-y-3"
        onClick={() => !isSwiped && onRowClick?.(row)}
      >
        {/* Primary data */}
        <div className="space-y-2">
          {primaryColumns.map((column, index) => {
            const value = column.render ? column.render(row[column.key], row) : row[column.key];
            
            return (
              <div key={column.key || index} className="flex justify-between items-start">
                {index === 0 ? (
                  // First column - make it prominent
                  <div className="font-medium text-text-primary">{value}</div>
                ) : (
                  <>
                    <span className="text-text-secondary text-sm">{column.header}:</span>
                    <span className="text-text-primary text-sm ml-2">{value}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Expand/collapse button if there are secondary columns */}
        {secondaryColumns.length > 0 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 
                         text-text-secondary text-sm hover:text-text-primary 
                         transition-colors touch-target-small"
            >
              {isExpanded ? (
                <>
                  <ChevronDown size={16} />
                  Show less
                </>
              ) : (
                <>
                  <ChevronRight size={16} />
                  Show more
                </>
              )}
            </button>

            {/* Secondary data - shown when expanded */}
            {isExpanded && (
              <div className="pt-3 border-t border-dark-secondary/50 space-y-2 animate-slide-down">
                {secondaryColumns.map((column, index) => {
                  const value = column.render ? column.render(row[column.key], row) : row[column.key];
                  
                  return (
                    <div key={column.key || index} className="flex justify-between items-start">
                      <span className="text-text-secondary text-sm">{column.header}:</span>
                      <span className="text-text-primary text-sm ml-2">{value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Action buttons (when not swiped) */}
        {onRowAction && !isSwiped && (
          <div className="flex justify-end gap-2 pt-3 border-t border-dark-secondary/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRowAction(row, 'edit');
              }}
              className="p-2 text-text-secondary hover:text-text-primary 
                         hover:bg-dark-secondary rounded transition-colors touch-target-small"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRowAction(row, 'copy');
              }}
              className="p-2 text-text-secondary hover:text-text-primary 
                         hover:bg-dark-secondary rounded transition-colors touch-target-small"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRowAction(row, 'menu');
              }}
              className="p-2 text-text-secondary hover:text-text-primary 
                         hover:bg-dark-secondary rounded transition-colors touch-target-small"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Horizontal scroll table for medium screens (optional)
export function HorizontalScrollTable({ columns, data, className = '' }) {
  const tableRef = useRef(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);

  const handleScroll = () => {
    if (!tableRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Scroll indicators */}
      {showLeftShadow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 
                        bg-gradient-to-r from-dark-primary to-transparent 
                        pointer-events-none z-10" />
      )}
      {showRightShadow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 
                        bg-gradient-to-l from-dark-primary to-transparent 
                        pointer-events-none z-10" />
      )}

      {/* Scrollable table */}
      <div 
        ref={tableRef}
        onScroll={handleScroll}
        className="overflow-x-auto momentum-scroll scrollbar-hidden"
      >
        <table className="min-w-full">
          <thead className="bg-dark-secondary/50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className="px-4 py-2 text-left text-xs font-medium text-text-secondary 
                             uppercase tracking-wider whitespace-nowrap"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-dark-primary divide-y divide-dark-secondary/50">
            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    className="px-4 py-3 text-sm text-text-primary whitespace-nowrap"
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}