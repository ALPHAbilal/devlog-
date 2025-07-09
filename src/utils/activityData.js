// Generate activity data based on document updates
export function generateActivityData(entry) {
  // Generate 6 months (26 weeks) of activity data
  const weeks = 26;
  const data = [];
  const now = new Date();
  
  // Parse the entry's last update time
  const lastUpdate = new Date(entry.updatedAt);
  const createdAt = new Date(entry.createdAt);
  
  for (let i = weeks - 1; i >= 0; i--) {
    // Calculate the start of each week (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    // Adjust to Monday
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Base activity on document characteristics
    let weeklyActivity = 0;
    let activeDays = 0;
    
    // Check if document was created or updated during this week
    if (createdAt >= weekStart && createdAt <= weekEnd) {
      // High activity on creation week
      weeklyActivity += 50 + Math.random() * 20;
      activeDays += 3;
    }
    
    if (lastUpdate >= weekStart && lastUpdate <= weekEnd && 
        Math.abs(lastUpdate - createdAt) > 86400000) { // Not same day as creation
      // High activity on update week
      weeklyActivity += 40 + Math.random() * 20;
      activeDays += 2;
    }
    
    // Activity between creation and last update
    if (weekStart > createdAt && weekEnd < lastUpdate) {
      // Some baseline activity
      weeklyActivity += Math.random() * 30;
      activeDays += Math.floor(Math.random() * 3) + 1;
    }
    
    // Add some noise and variation based on document characteristics
    if (entry.blocks && entry.blocks.length > 0 && weeklyActivity > 0) {
      // More blocks = more potential activity
      const blockBonus = Math.min(entry.blocks.length / 10, 5);
      weeklyActivity += blockBonus * Math.random() * 5;
      
      // Code blocks suggest more technical activity
      const codeBlocks = entry.blocks.filter(b => b.type === 'code').length;
      if (codeBlocks > 0) {
        weeklyActivity += Math.random() * 10;
      }
      
      // AI blocks suggest research/learning activity
      const aiBlocks = entry.blocks.filter(b => b.type === 'ai').length;
      if (aiBlocks > 0) {
        weeklyActivity += Math.random() * 8;
      }
    }
    
    // Recent weeks might have declining activity if not updated recently
    const weeksSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24 * 7));
    if (weeksSinceUpdate > 4 && i < 8) {
      // Decay factor for old documents
      weeklyActivity *= (0.3 + (i / weeks) * 0.7);
    }
    
    // Add some seasonal variation (slight sine wave)
    const seasonalFactor = 1 + 0.2 * Math.sin((i / 26) * Math.PI * 2);
    weeklyActivity *= seasonalFactor;
    
    // Average activity per active day (0-20 scale)
    const averageActivity = activeDays > 0 ? weeklyActivity / activeDays : 0;
    
    // Ensure non-negative values and reasonable scale
    data.push(Math.max(0, Math.min(20, Math.round(averageActivity * 10) / 10)));
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
  
  // Calculate recent vs previous period (last 4 weeks vs previous 4 weeks)
  const recentWeeks = 4;
  const recentData = data.slice(-recentWeeks);
  const previousData = data.slice(-recentWeeks * 2, -recentWeeks);
  
  const recentAverage = recentData.length > 0 
    ? recentData.reduce((sum, val) => sum + val, 0) / recentData.length 
    : 0;
  const previousAverage = previousData.length > 0 
    ? previousData.reduce((sum, val) => sum + val, 0) / previousData.length 
    : 0;
  
  let trend = 'flat';
  if (recentAverage > previousAverage * 1.15) {
    trend = 'up';
  } else if (recentAverage < previousAverage * 0.85) {
    trend = 'down';
  }
  
  const monthlyChange = previousAverage > 0 
    ? ((recentAverage - previousAverage) / previousAverage) * 100 
    : 0;
  
  return {
    total: Math.round(total),
    average: Math.round(average * 10) / 10,
    trend,
    recentAverage: Math.round(recentAverage * 10) / 10,
    monthlyChange: Math.round(monthlyChange)
  };
}