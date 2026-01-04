import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface Tab {
  id: string;
  title: string;
  isUnsaved: boolean;
}

interface TabContextValue {
  tabs: Tab[];
  activeTabId: string | null;
  isInitialized: boolean;
  openTab: (document: { id: string; title?: string }) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (keepTabId: string) => void;
  closeTabsToRight: (tabId: string) => void;
  updateTabTitle: (tabId: string, newTitle: string) => void;
  setActiveTabId: (tabId: string | null) => void;
  switchToNextTab: () => void;
  switchToPrevTab: () => void;
  switchToTabByIndex: (index: number) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

const STORAGE_KEY = 'devlog_tabs';

export const useTabContext = (): TabContextValue => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

interface TabProviderProps {
  children: ReactNode;
}

export const TabProvider = ({ children }: TabProviderProps) => {
  // Tab state: array of { id, title, isUnsaved }
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { tabs: savedTabs, activeTabId: savedActiveId } = JSON.parse(stored);
        console.log('[TAB-RESTORE]', {
          tabCount: savedTabs?.length || 0,
          activeTabId: savedActiveId?.substring(0, 8),
          tabIds: savedTabs?.map((t: Tab) => t.id?.substring(0, 8))
        });
        if (savedTabs && savedTabs.length > 0) {
          setTabs(savedTabs);
          setActiveTabId(savedActiveId || savedTabs[0].id);
        }
      } else {
        console.log('[TAB-RESTORE] No saved tabs found');
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
  const openTab = useCallback((document: { id: string; title?: string }) => {
    const existingTab = tabs.find(t => t.id === document.id);
    if (existingTab) {
      setActiveTabId(document.id);
      return;
    }

    const newTab: Tab = {
      id: document.id,
      title: document.title || 'Untitled',
      isUnsaved: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(document.id);
  }, [tabs]);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      // If closing active tab, switch to adjacent tab
      if (activeTabId === tabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
        const newActiveTab = newTabs[newActiveIndex];
        if (newActiveTab) setActiveTabId(newActiveTab.id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      return newTabs;
    });
  }, [activeTabId]);

  // Close all tabs except one
  const closeOtherTabs = useCallback((keepTabId: string) => {
    setTabs(prev => prev.filter(t => t.id === keepTabId));
    setActiveTabId(keepTabId);
  }, []);

  // Close tabs to the right
  const closeTabsToRight = useCallback((tabId: string) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId);
      return prev.slice(0, index + 1);
    });
  }, []);

  // Update tab title (when document title changes)
  const updateTabTitle = useCallback((tabId: string, newTitle: string) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, title: newTitle || 'Untitled' } : t
    ));
  }, []);

  // Switch to next/previous tab
  const switchToNextTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (nextTab) setActiveTabId(nextTab.id);
  }, [tabs, activeTabId]);

  const switchToPrevTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    const prevTab = tabs[prevIndex];
    if (prevTab) setActiveTabId(prevTab.id);
  }, [tabs, activeTabId]);

  // Switch to tab by index (1-9)
  const switchToTabByIndex = useCallback((index: number) => {
    const tab = tabs[index];
    if (tab) {
      setActiveTabId(tab.id);
    }
  }, [tabs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
