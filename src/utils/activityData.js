// Generate activity data based on document updates
export function generateActivityData(entry) {
  // Generate 14 days of activity data
  const days = 14;
  const data = [];
  const now = new Date();
  
  // Parse the entry's last update time
  const lastUpdate = new Date(entry.updatedAt);
  const createdAt = new Date(entry.createdAt);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Base activity on document characteristics
    let activity = 0;
    
    // Check if document was updated on this day
    const updateDate = new Date(lastUpdate);
    updateDate.setHours(0, 0, 0, 0);
    
    if (date.getTime() === updateDate.getTime()) {
      // High activity on update day
      activity = 8 + Math.random() * 4;
    } else if (date > createdAt && date < lastUpdate) {
      // Some activity between creation and last update
      activity = Math.random() * 6;
    } else if (date.getTime() === new Date(createdAt).setHours(0, 0, 0, 0)) {
      // Creation day has high activity
      activity = 10 + Math.random() * 2;
    }
    
    // Add some noise and variation based on document characteristics
    if (entry.blocks && entry.blocks.length > 0) {
      // More blocks = more potential activity
      const blockBonus = Math.min(entry.blocks.length / 10, 3);
      activity += blockBonus * Math.random();
      
      // Code blocks suggest more technical activity
      const codeBlocks = entry.blocks.filter(b => b.type === 'code').length;
      if (codeBlocks > 0) {
        activity += Math.random() * 2;
      }
      
      // AI blocks suggest research/learning activity
      const aiBlocks = entry.blocks.filter(b => b.type === 'ai').length;
      if (aiBlocks > 0) {
        activity += Math.random() * 1.5;
      }
    }
    
    // Add weekly patterns (lower on weekends)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      activity *= 0.7;
    }
    
    // Recent days might have declining activity if not updated recently
    const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 7 && i < 7) {
      activity *= (0.5 + (i / 14) * 0.5);
    }
    
    // Ensure non-negative values
    data.push(Math.max(0, Math.round(activity * 10) / 10));
  }
  
  return data;
}

// Get activity summary statistics
export function getActivityStats(data) {
  if (!data || data.length === 0) {
    return {
      total: 0,
      average: 0,
      trend: 'flat',
      recentAverage: 0,
      weeklyChange: 0
    };
  }
  
  const total = data.reduce((sum, val) => sum + val, 0);
  const average = total / data.length;
  
  // Calculate recent vs previous period
  const midPoint = Math.floor(data.length / 2);
  const recentData = data.slice(midPoint);
  const previousData = data.slice(0, midPoint);
  
  const recentAverage = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
  const previousAverage = previousData.reduce((sum, val) => sum + val, 0) / previousData.length;
  
  let trend = 'flat';
  if (recentAverage > previousAverage * 1.2) {
    trend = 'up';
  } else if (recentAverage < previousAverage * 0.8) {
    trend = 'down';
  }
  
  const weeklyChange = previousAverage > 0 
    ? ((recentAverage - previousAverage) / previousAverage) * 100 
    : 0;
  
  return {
    total: Math.round(total),
    average: Math.round(average * 10) / 10,
    trend,
    recentAverage: Math.round(recentAverage * 10) / 10,
    weeklyChange: Math.round(weeklyChange)
  };
}