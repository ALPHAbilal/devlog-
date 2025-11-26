import { useTabContext } from '../contexts/TabContext';
import { X, Plus, FileText, ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function TabBar({ onNewTab, onTabClick }) {
  const { tabs, activeTabId, closeTab, setActiveTabId } = useTabContext();
  const tabsRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  // Middle-click to close (browser convention)
  const handleMouseDown = (e, tabId) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  const handleTabSelect = (tabId) => {
    setActiveTabId(tabId);
    onTabClick?.(tabId);
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Mobile: Tab dropdown
  if (isMobile) {
    return (
      <div className="relative flex items-center h-12 bg-db-dark-base border-b border-white/5 px-3">
        {/* Current tab dropdown trigger */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-white/5 text-white/90 text-sm"
        >
          <FileText size={14} className="text-emerald-400 flex-shrink-0" />
          <span className="truncate">{activeTab?.title || 'No document'}</span>
          <ChevronDown size={16} className={`ml-auto transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* New tab button */}
        <button
          onClick={onNewTab}
          className="p-2 ml-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10
                     transition-all duration-150"
          title="New document"
        >
          <Plus size={20} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-12 left-3 right-3 z-50
                          bg-db-dark-primary border border-white/10 rounded-xl shadow-xl
                          max-h-[60vh] overflow-y-auto">
            {tabs.length === 0 ? (
              <div className="px-4 py-3 text-white/40 text-sm text-center">
                No documents open
              </div>
            ) : (
              tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabSelect(tab.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3
                             border-b border-white/5 last:border-0
                             ${tab.id === activeTabId ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/70'}`}
                >
                  <span className="truncate">{tab.title || 'Untitled'}</span>
                  <X
                    size={16}
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="text-white/40 hover:text-white/80 flex-shrink-0 ml-2"
                  />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Horizontal tabs
  return (
    <div className="h-11 flex items-center bg-db-dark-base border-b border-white/5">
      {/* Tabs scroll container */}
      <div
        ref={tabsRef}
        className="flex-1 flex items-center gap-0.5 px-2 overflow-x-auto scrollbar-hide"
      >
        {tabs.length === 0 ? (
          <div className="px-3 py-2 text-white/30 text-sm">
            No documents open
          </div>
        ) : (
          tabs.map((tab) => {
            const isActive = tab.id === activeTabId;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                onMouseDown={(e) => handleMouseDown(e, tab.id)}
                className={`
                  group relative flex items-center gap-2 h-8 px-3 rounded-md
                  text-[13px] font-medium whitespace-nowrap
                  transition-all duration-150 ease-out
                  min-w-[120px] max-w-[180px]
                  ${isActive
                    ? 'bg-white/10 text-white/95'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
              >
                {/* Document icon */}
                <FileText size={14} className={`flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-white/30'}`} />

                {/* Title */}
                <span className="truncate flex-1 text-left">
                  {tab.title || 'Untitled'}
                </span>

                {/* Close button */}
                <span
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className={`
                    flex-shrink-0 p-0.5 rounded-sm
                    transition-all duration-150
                    hover:bg-white/20 hover:text-white
                    ${isActive
                      ? 'text-white/40 hover:text-white'
                      : 'opacity-0 group-hover:opacity-100 text-white/40'
                    }
                  `}
                >
                  <X size={12} />
                </span>

                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* New tab button */}
      <div className="flex-shrink-0 px-2 border-l border-white/5">
        <button
          onClick={onNewTab}
          className="flex items-center justify-center w-8 h-8 rounded-md
                     text-white/50 hover:text-white hover:bg-white/10
                     transition-all duration-150"
          title="New document (Cmd+T)"
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
