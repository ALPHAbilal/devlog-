import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';

// Load vis-timeline from CDN
const loadVisTimeline = () => {
  return new Promise((resolve, reject) => {
    if (window.vis) {
      resolve(window.vis);
      return;
    }

    // Load CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/vis-timeline@7.7.3/dist/vis-timeline-graph2d.min.css';
    document.head.appendChild(cssLink);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/vis-timeline@7.7.3/dist/vis-timeline-graph2d.min.js';
    script.onload = () => resolve(window.vis);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const IssueTrackerBlockVis = ({ block, onUpdate }) => {
  const timelineRef = useRef(null);
  const [timeline, setTimeline] = useState(null);
  const [visLoaded, setVisLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const saveTimeoutRef = useRef(null);

  // Initialize block data
  const blockData = block?.data || {};
  const [milestone, setMilestone] = useState(blockData.milestone || '');
  const [issues, setIssues] = useState(blockData.issues || []);
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);

  // Load vis-timeline on mount
  useEffect(() => {
    loadVisTimeline().then(() => {
      setVisLoaded(true);
    }).catch(err => {
      console.error('Failed to load vis-timeline:', err);
    });
  }, []);

  // Initialize timeline when vis is loaded
  useEffect(() => {
    if (!visLoaded || !timelineRef.current || timeline) return;

    // Configure groups for branching
    const groups = new window.vis.DataSet([
      { id: 'main', content: 'Issues', style: 'color: #e8e8e8; background: #1a2638;' },
      { id: 'attempts', content: 'Attempts', style: 'color: #e8e8e8; background: #0a1628;' }
    ]);

    // Convert issues to timeline items
    const items = [];
    let itemId = 1;

    issues.forEach((issue, issueIndex) => {
      // Add main issue item
      const issueDate = new Date(issue.createdAt || Date.now() - (issues.length - issueIndex) * 86400000);
      
      items.push({
        id: `issue-${issue.id}`,
        content: `
          <div class="timeline-issue-item">
            <div class="timeline-issue-title">${issue.title || 'Untitled Issue'}</div>
            <div class="timeline-issue-status status-${issue.status}">${issue.status}</div>
          </div>
        `,
        start: issueDate,
        group: 'main',
        type: 'box',
        className: `issue-item status-${issue.status}`,
        style: `background: ${issue.status === 'solved' ? '#10b981' : issue.status === 'in-progress' ? '#3b82f6' : '#ef4444'};`
      });

      // Add attempts as connected items
      if (issue.attempts && issue.attempts.length > 0) {
        issue.attempts.forEach((attempt, attemptIndex) => {
          const attemptDate = new Date(issueDate.getTime() + (attemptIndex + 1) * 3600000);
          
          items.push({
            id: `attempt-${attempt.id}`,
            content: `
              <div class="timeline-attempt-item">
                <div class="timeline-attempt-desc">${attempt.description || 'Attempt ' + (attemptIndex + 1)}</div>
                <div class="timeline-attempt-result ${attempt.result}">${attempt.result}</div>
              </div>
            `,
            start: attemptDate,
            group: 'attempts',
            type: 'point',
            className: `attempt-item result-${attempt.result}`,
            style: `color: ${attempt.result === 'success' ? '#10b981' : '#f59e0b'};`
          });
        });
      }
    });

    const itemsDataSet = new window.vis.DataSet(items);

    // Timeline options
    const options = {
      width: '100%',
      height: '400px',
      margin: { item: 10 },
      orientation: 'top',
      stack: false,
      showCurrentTime: false,
      zoomMin: 1000 * 60 * 60 * 24, // 1 day
      zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 year
      template: (item) => {
        return item.content;
      },
      groupTemplate: (group) => {
        return `<div class="timeline-group-label">${group.content}</div>`;
      },
      onInitialDrawComplete: () => {
        // Fit all items in view
        if (timeline && items.length > 0) {
          timeline.fit();
        }
      }
    };

    // Create timeline
    const timelineInstance = new window.vis.Timeline(timelineRef.current, itemsDataSet, groups, options);
    
    // Add event listeners
    timelineInstance.on('select', (properties) => {
      if (properties.items.length > 0) {
        setSelectedItem(properties.items[0]);
      }
    });

    setTimeline(timelineInstance);

    // Apply custom styles
    const style = document.createElement('style');
    style.textContent = `
      .vis-timeline {
        background: #0a1628;
        border: 1px solid #2a3648;
        border-radius: 8px;
      }
      .vis-panel.vis-background {
        background: #0a1628;
      }
      .vis-panel.vis-center {
        background: #0a1628;
      }
      .vis-time-axis .vis-text {
        color: #e8e8e8;
      }
      .vis-time-axis .vis-grid.vis-minor {
        border-color: #1a2638;
      }
      .vis-time-axis .vis-grid.vis-major {
        border-color: #2a3648;
      }
      .vis-labelset .vis-label {
        background: #1a2638;
        border: 1px solid #2a3648;
        color: #e8e8e8;
      }
      .vis-item {
        background: #1a2638;
        border: 1px solid #2a3648;
        color: #e8e8e8;
      }
      .vis-item.vis-selected {
        border: 2px solid #3b82f6;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      }
      .timeline-issue-item {
        padding: 4px 8px;
      }
      .timeline-issue-title {
        font-weight: 500;
        margin-bottom: 2px;
      }
      .timeline-issue-status {
        font-size: 0.75rem;
        opacity: 0.8;
      }
      .timeline-attempt-item {
        padding: 2px 6px;
        font-size: 0.875rem;
      }
      .timeline-attempt-desc {
        margin-bottom: 2px;
      }
      .timeline-attempt-result {
        font-size: 0.75rem;
        font-weight: 500;
      }
      .timeline-attempt-result.success {
        color: #10b981;
      }
      .timeline-attempt-result.failed {
        color: #f59e0b;
      }
      .timeline-group-label {
        padding: 4px 8px;
        font-weight: 500;
      }
      .vis-item.issue-item {
        border-radius: 6px;
        font-weight: 500;
      }
      .vis-item.attempt-item {
        border-radius: 50%;
        width: 10px !important;
        height: 10px !important;
      }
      .vis-item.attempt-item .vis-item-content {
        display: none;
      }
      .vis-item.attempt-item:hover .vis-item-content {
        display: block;
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1a2638;
        border: 1px solid #2a3648;
        border-radius: 4px;
        padding: 4px 8px;
        white-space: nowrap;
        z-index: 1000;
        margin-bottom: 4px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (timelineInstance) {
        timelineInstance.destroy();
      }
      style.remove();
    };
  }, [visLoaded, issues]);

  // Update timeline when issues change
  useEffect(() => {
    if (!timeline || !visLoaded) return;

    // Update items
    const items = [];
    issues.forEach((issue, issueIndex) => {
      const issueDate = new Date(issue.createdAt || Date.now() - (issues.length - issueIndex) * 86400000);
      
      items.push({
        id: `issue-${issue.id}`,
        content: `
          <div class="timeline-issue-item">
            <div class="timeline-issue-title">${issue.title || 'Untitled Issue'}</div>
            <div class="timeline-issue-status status-${issue.status}">${issue.status}</div>
          </div>
        `,
        start: issueDate,
        group: 'main',
        type: 'box',
        className: `issue-item status-${issue.status}`,
        style: `background: ${issue.status === 'solved' ? '#10b981' : issue.status === 'in-progress' ? '#3b82f6' : '#ef4444'};`
      });

      if (issue.attempts && issue.attempts.length > 0) {
        issue.attempts.forEach((attempt, attemptIndex) => {
          const attemptDate = new Date(issueDate.getTime() + (attemptIndex + 1) * 3600000);
          
          items.push({
            id: `attempt-${attempt.id}`,
            content: `
              <div class="timeline-attempt-item">
                <div class="timeline-attempt-desc">${attempt.description || 'Attempt ' + (attemptIndex + 1)}</div>
                <div class="timeline-attempt-result ${attempt.result}">${attempt.result}</div>
              </div>
            `,
            start: attemptDate,
            group: 'attempts',
            type: 'point',
            className: `attempt-item result-${attempt.result}`,
            style: `color: ${attempt.result === 'success' ? '#10b981' : '#f59e0b'};`
          });
        });
      }
    });

    timeline.setItems(items);
    if (items.length > 0) {
      timeline.fit();
    }
  }, [timeline, issues, visLoaded]);

  // Auto-save functionality
  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onUpdate({
        ...block,
        data: {
          milestone,
          issues
        }
      });
    }, 3000);
  }, [block, milestone, issues, onUpdate]);

  useEffect(() => {
    handleSave();
  }, [milestone, issues, handleSave]);

  // Add issue handler
  const handleAddIssue = () => {
    const newIssue = {
      id: `issue-${Date.now()}`,
      title: 'New Issue',
      description: '',
      status: 'active',
      attempts: [],
      createdAt: new Date().toISOString()
    };
    setIssues([...issues, newIssue]);
  };

  // Simple edit modal for selected items
  const renderEditPanel = () => {
    if (!selectedItem) return null;

    const [type, id] = selectedItem.split('-');
    
    if (type === 'issue') {
      const issue = issues.find(i => i.id === id);
      if (!issue) return null;

      return (
        <div className="absolute top-0 right-0 w-80 bg-dark-secondary/95 backdrop-blur-sm border border-dark-primary/50 rounded-lg p-4 m-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-3">Edit Issue</h3>
          <input
            value={issue.title}
            onChange={(e) => {
              const updated = issues.map(i => 
                i.id === issue.id ? { ...i, title: e.target.value } : i
              );
              setIssues(updated);
            }}
            className="w-full px-3 py-2 bg-dark-primary/50 border border-dark-primary rounded mb-2"
            placeholder="Issue title"
          />
          <textarea
            value={issue.description}
            onChange={(e) => {
              const updated = issues.map(i => 
                i.id === issue.id ? { ...i, description: e.target.value } : i
              );
              setIssues(updated);
            }}
            className="w-full px-3 py-2 bg-dark-primary/50 border border-dark-primary rounded mb-2"
            placeholder="Description"
            rows={3}
          />
          <select
            value={issue.status}
            onChange={(e) => {
              const updated = issues.map(i => 
                i.id === issue.id ? { ...i, status: e.target.value } : i
              );
              setIssues(updated);
            }}
            className="w-full px-3 py-2 bg-dark-primary/50 border border-dark-primary rounded mb-3"
          >
            <option value="active">Active</option>
            <option value="in-progress">In Progress</option>
            <option value="solved">Solved</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const updated = issues.filter(i => i.id !== issue.id);
                setIssues(updated);
                setSelectedItem(null);
              }}
              className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedItem(null)}
              className="px-3 py-1 bg-dark-primary/50 rounded hover:bg-dark-primary/70"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!visLoaded) {
    return (
      <div className="bg-dark-secondary/30 backdrop-blur-sm rounded-xl p-6 border border-dark-primary/50">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-dark-primary/50 rounded mb-4"></div>
          <div className="h-96 w-full bg-dark-primary/30 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-secondary/30 backdrop-blur-sm rounded-xl p-6 border border-dark-primary/50">
      {/* Milestone Header */}
      {(milestone || isEditingMilestone) && (
        <div className="mb-4">
          {isEditingMilestone ? (
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <input
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                onBlur={() => setIsEditingMilestone(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingMilestone(false);
                }}
                className="flex-1 px-3 py-1 bg-dark-primary/50 border border-dark-primary rounded"
                placeholder="Project milestone..."
                autoFocus
              />
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingMilestone(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Target className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold">{milestone}</h2>
            </div>
          )}
        </div>
      )}

      {/* Timeline Container */}
      <div className="relative">
        <div ref={timelineRef} className="timeline-container" />
        {renderEditPanel()}
      </div>

      {/* Add Issue Button */}
      <button
        onClick={handleAddIssue}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-primary/30 border border-dark-primary/50 rounded-lg hover:bg-dark-primary/50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Issue
      </button>
    </div>
  );
};

export default IssueTrackerBlockVis;