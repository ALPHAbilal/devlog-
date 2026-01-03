import { useState, useRef, useEffect } from 'react';
import { Grip, MoreVertical, Maximize2, Minimize2 } from 'lucide-react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { useResponsive, useComponentResponsive } from '@/shared/hooks';
import { useTouchGestures } from '@/shared/hooks';

/**
 * ResponsiveDashboardGrid Component
 * A flexible grid system that adapts from single column on mobile to multi-column on desktop
 */
export default function ResponsiveDashboardGrid({ 
  widgets, 
  onReorder,
  enableReorder = true,
  gap = 4,
  columns = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4, '2xl': 4 },
}) {
  const { isMobile, getCurrentBreakpoint } = useResponsive();
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [reorderMode, setReorderMode] = useState(false);
  const containerRef = useRef(null);
  const { containerSize } = useComponentResponsive(containerRef);

  // Get current column count based on breakpoint
  const currentBreakpoint = getCurrentBreakpoint();
  const columnCount = columns[currentBreakpoint] || 1;

  // Calculate optimal widget size
  const widgetWidth = containerSize.width 
    ? (containerSize.width - (gap * 16 * (columnCount - 1))) / columnCount 
    : 'auto';

  return (
    <div ref={containerRef} className="w-full h-full p-fluid-md">
      {/* Mobile reorder mode toggle */}
      {isMobile && enableReorder && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Dashboard</h2>
          <button
            onClick={() => setReorderMode(!reorderMode)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors touch-target-small
                       ${reorderMode 
                         ? 'bg-accent-green text-dark-primary' 
                         : 'bg-dark-secondary text-text-secondary hover:text-text-primary'}`}
          >
            {reorderMode ? 'Done' : 'Edit Layout'}
          </button>
        </div>
      )}

      {/* Grid Container */}
      {enableReorder && (isMobile || reorderMode) ? (
        <Reorder.Group
          axis={isMobile ? "y" : "xy"}
          values={widgets}
          onReorder={onReorder}
          className={`grid gap-${gap} grid-cols-${columnCount}`}
        >
          {widgets.map((widget) => (
            <ReorderableWidget
              key={widget.id}
              widget={widget}
              isExpanded={expandedWidget === widget.id}
              onToggleExpand={() => setExpandedWidget(
                expandedWidget === widget.id ? null : widget.id
              )}
              isMobile={isMobile}
              reorderMode={reorderMode}
              columnCount={columnCount}
            />
          ))}
        </Reorder.Group>
      ) : (
        <div className={`grid gap-${gap} grid-cols-1 
                        sm:grid-cols-${columns.sm} 
                        md:grid-cols-${columns.md} 
                        lg:grid-cols-${columns.lg} 
                        xl:grid-cols-${columns.xl}
                        2xl:grid-cols-${columns['2xl']}`}>
          {widgets.map((widget) => (
            <StaticWidget
              key={widget.id}
              widget={widget}
              isExpanded={expandedWidget === widget.id}
              onToggleExpand={() => setExpandedWidget(
                expandedWidget === widget.id ? null : widget.id
              )}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Reorderable Widget Component
function ReorderableWidget({ widget, isExpanded, onToggleExpand, isMobile, reorderMode, columnCount }) {
  const dragControls = useDragControls();
  const widgetRef = useRef(null);
  
  // Touch gestures for mobile actions
  useTouchGestures(widgetRef, {
    onLongPress: isMobile && !reorderMode ? () => {
      // Trigger haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
      // Show widget options
    } : undefined,
  });

  // Dynamic grid span for expanded widgets
  const gridSpan = isExpanded 
    ? `col-span-${Math.min(columnCount, 2)} row-span-2` 
    : 'col-span-1 row-span-1';

  return (
    <Reorder.Item
      value={widget}
      id={widget.id}
      dragListener={false}
      dragControls={dragControls}
      className={`${gridSpan} ${reorderMode ? 'cursor-move' : ''}`}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
    >
      <motion.div
        ref={widgetRef}
        layout
        className={`h-full bg-dark-primary rounded-lg border border-dark-secondary 
                   overflow-hidden group hover:border-dark-secondary/80 transition-all
                   ${reorderMode ? 'ring-2 ring-accent-green/30' : ''}`}
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between p-3 border-b border-dark-secondary/50">
          <div className="flex items-center gap-2 flex-1">
            {reorderMode && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-move touch-none"
              >
                <Grip size={18} className="text-text-secondary" />
              </div>
            )}
            <h3 className="font-medium text-text-primary truncate">{widget.title}</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-text-secondary hover:text-text-primary 
                         hover:bg-dark-secondary rounded transition-colors opacity-0 
                         group-hover:opacity-100 touch-target-small"
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            {!reorderMode && (
              <button
                className="p-1.5 text-text-secondary hover:text-text-primary 
                           hover:bg-dark-secondary rounded transition-colors opacity-0 
                           group-hover:opacity-100 md:opacity-0 touch-target-small"
              >
                <MoreVertical size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Widget Content */}
        <div className={`p-4 ${isExpanded ? 'h-full' : 'h-48'} overflow-auto`}>
          {widget.content}
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

// Static Widget Component (non-reorderable)
function StaticWidget({ widget, isExpanded, onToggleExpand, isMobile }) {
  const gridSpan = isExpanded ? 'md:col-span-2 md:row-span-2' : '';

  return (
    <motion.div
      layout
      className={`${gridSpan} bg-dark-primary rounded-lg border border-dark-secondary 
                 overflow-hidden group hover:border-dark-secondary/80 transition-all`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-dark-secondary/50">
        <h3 className="font-medium text-text-primary truncate">{widget.title}</h3>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleExpand}
            className={`p-1.5 text-text-secondary hover:text-text-primary 
                       hover:bg-dark-secondary rounded transition-colors
                       ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                       touch-target-small`}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            className={`p-1.5 text-text-secondary hover:text-text-primary 
                       hover:bg-dark-secondary rounded transition-colors
                       ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                       touch-target-small`}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className={`p-4 ${isExpanded ? 'min-h-[400px]' : 'h-48'} overflow-auto`}>
        {widget.content}
      </div>
    </motion.div>
  );
}

// Widget Templates
export const WidgetTemplates = {
  // Stats Widget
  stats: (data) => (
    <div className="space-y-4">
      <div className="text-3xl font-bold text-text-primary">{data.value}</div>
      <div className="text-sm text-text-secondary">{data.label}</div>
      {data.change && (
        <div className={`text-sm ${data.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {data.change > 0 ? '+' : ''}{data.change}% from last period
        </div>
      )}
    </div>
  ),

  // Chart Widget (placeholder)
  chart: (data) => (
    <div className="h-full flex items-center justify-center text-text-secondary">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-sm">{data.chartType} Chart</div>
      </div>
    </div>
  ),

  // List Widget
  list: (items) => (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-text-primary">
          <span className="w-2 h-2 bg-accent-green rounded-full flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  ),

  // Activity Widget
  activity: (activities) => (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div key={index} className="flex gap-3 text-sm">
          <div className="w-8 h-8 bg-dark-secondary rounded-full flex items-center 
                          justify-center flex-shrink-0">
            {activity.icon}
          </div>
          <div className="flex-1">
            <div className="text-text-primary">{activity.title}</div>
            <div className="text-text-secondary text-xs">{activity.time}</div>
          </div>
        </div>
      ))}
    </div>
  ),
};

// Example usage with sample widgets
export const sampleWidgets = [
  {
    id: '1',
    title: 'Total Documents',
    content: WidgetTemplates.stats({ value: '127', label: 'Documents', change: 12 }),
  },
  {
    id: '2',
    title: 'Recent Activity',
    content: WidgetTemplates.activity([
      { icon: '📝', title: 'Created new document', time: '2 hours ago' },
      { icon: '✏️', title: 'Edited "Project Notes"', time: '5 hours ago' },
      { icon: '🗑️', title: 'Deleted old draft', time: '1 day ago' },
    ]),
  },
  {
    id: '3',
    title: 'Quick Stats',
    content: WidgetTemplates.chart({ chartType: 'Line' }),
  },
  {
    id: '4',
    title: 'Top Tags',
    content: WidgetTemplates.list(['JavaScript', 'React', 'Node.js', 'TypeScript', 'CSS']),
  },
];