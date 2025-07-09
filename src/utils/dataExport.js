// Data export/import utilities
export const exportData = () => {
  try {
    const entries = localStorage.getItem('journeyLoggerEntries');
    const settings = localStorage.getItem('devlogSettings');
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: JSON.parse(entries || '[]'),
      settings: JSON.parse(settings || '{}')
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devlog-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!data.version || !data.entries) {
          throw new Error('Invalid backup file');
        }
        
        // Merge or replace data
        const existingEntries = JSON.parse(
          localStorage.getItem('journeyLoggerEntries') || '[]'
        );
        
        // Simple merge - you might want a more sophisticated strategy
        const mergedEntries = [...existingEntries, ...data.entries];
        
        localStorage.setItem('journeyLoggerEntries', 
          JSON.stringify(mergedEntries));
        
        if (data.settings) {
          localStorage.setItem('devlogSettings', 
            JSON.stringify(data.settings));
        }
        
        resolve({ imported: data.entries.length });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.readAsText(file);
  });
};

export const getStorageUsage = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key).length + key.length;
    }
  }
  // Convert to MB
  return (total / 1024 / 1024).toFixed(2);
};