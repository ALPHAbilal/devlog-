import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TabContext = createContext();

const STORAGE_KEY = 'devlog_tabs';

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

export const TabProvider = ({ children }) => {
  // Tab state: array of { id, title, isUnsaved }
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { tabs: savedTabs, activeTabId: savedActiveId } = JSON.parse(stored);
        if (savedTabs && savedTabs.length > 0) {
          console.log('[RELOAD-TRACE-1] TabContext: Restoring tabs from localStorage', {
            tabCount: savedTabs.length,
            activeTabId: savedActiveId?.substring(0, 8),
            timestamp: performance.now().toFixed(2)
          });
          setTabs(savedTabs);
          setActiveTabId(savedActiveId || savedTabs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load tabs from storage:', e);
    }
    setIsInitialized(true);
  }, []);

  // Persist tabs to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tabs,
        activeTabId
      }));
    } catch (e) {
      console.error('Failed to save tabs to storage:', e);
    }
  }, [tabs, activeTabId, isInitialized]);

  // Open a new tab (or switch to existing)
  const openTab = useCallback((document) => {
    const existingTab = tabs.find(t => t.id === document.id);
    if (existingTab) {
      setActiveTabId(document.id);
      return;
    }

    const newTab = {
      id: document.id,
      title: document.title || 'Untitled',
      isUnsaved: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(document.id);
  }, [tabs]);

  // Close a tab
  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      // If closing active tab, switch to adjacent tab
      if (activeTabId === tabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      return newTabs;
    });
  }, [activeTabId]);

  // Close all tabs except one
  const closeOtherTabs = useCallback((keepTabId) => {
    setTabs(prev => prev.filter(t => t.id === keepTabId));
    setActiveTabId(keepTabId);
  }, []);

  // Close tabs to the right
  const closeTabsToRight = useCallback((tabId) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId);
      return prev.slice(0, index + 1);
    });
  }, []);

  // Update tab title (when document title changes)
  const updateTabTitle = useCallback((tabId, newTitle) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, title: newTitle || 'Untitled' } : t
    ));
  }, []);

  // Switch to next/previous tab
  const switchToNextTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTabId(tabs[nextIndex].id);
  }, [tabs, activeTabId]);

  const switchToPrevTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTabId(tabs[prevIndex].id);
  }, [tabs, activeTabId]);

  // Switch to tab by index (1-9)
  const switchToTabByIndex = useCallback((index) => {
    if (index >= 0 && index < tabs.length) {
      setActiveTabId(tabs[index].id);
    }
  }, [tabs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + T = New tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('devlog:newTab'));
      }

      // Cmd/Ctrl + W = Close tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }

      // Cmd/Ctrl + Tab = Next tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        switchToNextTab();
      }

      // Cmd/Ctrl + Shift + Tab = Previous tab
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        switchToPrevTab();
      }

      // Cmd/Ctrl + 1-9 = Switch to tab by index
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        switchToTabByIndex(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, closeTab, switchToNextTab, switchToPrevTab, switchToTabByIndex]);

  const value = {
    tabs,
    activeTabId,
    isInitialized,
    openTab,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    updateTabTitle,
    setActiveTabId,
    switchToNextTab,
    switchToPrevTab,
    switchToTabByIndex,
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
};
