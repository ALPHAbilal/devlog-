import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X, Check, AlertCircle, Clock, Code, Target, Trash2 } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import TimelineBranch, { VerticalConnector } from './TimelineBranch';
import './IssueTrackerBlock.css';

// Minimal status indicators - clean and functional
const StatusIndicator = ({ status, size = 'md' }) => {
  const baseClass = size === 'sm' ? 'timeline-dot attempt-dot' : 'timeline-dot';
  const statusClass = `status-${status}`;
  
  return (
    <div 
      className={`${baseClass} ${statusClass}`}
      role="img" 
      aria-label={`Status: ${status}`} 
    />
  );
};

// Attempt Item Component
const AttemptItem = ({ attempt, onUpdate, onDelete, index, isLast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(attempt.description || '');
  const [code, setCode] = useState(attempt.code || '');
  const [showCode, setShowCode] = useState(false);
  const [result, setResult] = useState(attempt.result || 'failed');

  const handleSave = () => {
    onUpdate({
      ...attempt,
      description,
      code,
      result,
      solution: result === 'success'
    });
    setIsEditing(false);
  };

  const status = result === 'success' ? 'success' : 'failed';

  return (
    <div className="attempt-branch">
      <div className="timeline-marker">
        <StatusIndicator status={status} size="sm" />
      </div>
      
      <div className="attempt-content">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="timeline-textarea"
              placeholder="Describe the attempt..."
              rows={2}
            />
            
            <div className="flex flex-wrap gap-2">
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="timeline-select"
              >
                <option value="failed">Failed</option>
                <option value="success">Success</option>
              </select>
              
              <button
                onClick={() => setShowCode(!showCode)}
                className="timeline-button flex items-center gap-1"
              >
                <Code className="w-3 h-3" />
                Code
              </button>
              
              <button
                onClick={handleSave}
                className="timeline-button timeline-button-primary"
              >
                Save
              </button>
              
              <button
                onClick={() => setIsEditing(false)}
                className="timeline-button"
              >
                Cancel
              </button>
              
              <button
                onClick={onDelete}
                className="timeline-button"
                aria-label="Delete attempt"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            {showCode && (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="timeline-textarea font-mono"
                placeholder="Add code snippet..."
                rows={4}
              />
            )}
          </div>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="cursor-pointer w-full"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
            aria-label="Edit attempt"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {description || 'Click to add description'}
              </span>
              {result === 'success' ? (
                <Check className="w-3.5 h-3.5 text-green-500 ml-2 flex-shrink-0" aria-label="Success" />
              ) : (
                <X className="w-3.5 h-3.5 text-red-500 ml-2 flex-shrink-0" aria-label="Failed" />
              )}
            </div>
            
            {code && code.trim() && (
              <div className="code-snippet mt-2">
                <code>{code.trim()}</code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Issue Item Component  
const IssueItem = ({ issue, onUpdate, onDelete, isLast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [title, setTitle] = useState(issue.title || '');
  const [description, setDescription] = useState(issue.description || '');
  const [code, setCode] = useState(issue.code || '');
  const [showCode, setShowCode] = useState(false);
  const [status, setStatus] = useState(issue.status || 'active');
  const [attempts, setAttempts] = useState(issue.attempts || []);

  const handleSave = () => {
    onUpdate({
      ...issue,
      title,
      description,
      code,
      status,
      attempts
    });
    setIsEditing(false);
  };

  const handleAddAttempt = () => {
    const newAttempt = {
      id: `attempt-${Date.now()}`,
      description: '',
      code: '',
      result: 'failed',
      solution: false
    };
    setAttempts([...attempts, newAttempt]);
  };

  const handleUpdateAttempt = (attemptId, updates) => {
    setAttempts(attempts.map(a => a.id === attemptId ? updates : a));
  };

  const handleDeleteAttempt = (attemptId) => {
    setAttempts(attempts.filter(a => a.id !== attemptId));
  };

  // Auto-update status based on attempts
  useEffect(() => {
    if (attempts.some(a => a.result === 'success')) {
      setStatus('solved');
    }
  }, [attempts]);

  return (
    <div className="issue-wrapper">
      {/* Timeline marker */}
      <div className="timeline-marker">
        <StatusIndicator status={status} />
      </div>
      
      {/* Issue content */}
      <div className="issue-content">
        <div className="timeline-content">
          {isEditing ? (
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="timeline-input"
                placeholder="Issue title..."
              />
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="timeline-textarea"
                placeholder="Describe the issue..."
                rows={2}
              />
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="timeline-select"
                >
                  <option value="active">Active</option>
                  <option value="in-progress">In Progress</option>
                  <option value="solved">Solved</option>
                </select>
                
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="timeline-button flex items-center gap-1"
                >
                  <Code className="w-3 h-3" />
                  Code
                </button>
                
                <button
                  onClick={handleSave}
                  className="timeline-button timeline-button-primary"
                >
                  Save
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="timeline-button"
                >
                  Cancel
                </button>
                
                <button
                  onClick={onDelete}
                  className="timeline-button"
                  aria-label="Delete issue"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              
              {showCode && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="timeline-textarea font-mono"
                  placeholder="Add code snippet..."
                  rows={4}
                />
              )}
            </div>
          ) : (
            <>
              <div 
                onClick={() => setIsEditing(true)}
                className="timeline-header"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="p-0 border-0 bg-transparent cursor-pointer"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? 'Collapse issue' : 'Expand issue'}
                >
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
                
                <h3 className="timeline-title">
                  {title || 'Click to add title'}
                </h3>
                
                {status === 'solved' && <Check className="timeline-status-icon text-green-500" />}
                {status === 'in-progress' && <Clock className="timeline-status-icon text-blue-500" />}
                {status === 'active' && <AlertCircle className="timeline-status-icon text-red-500" />}
              </div>
              
              {description && (
                <p className="timeline-description">{description}</p>
              )}
              
              {code && code.trim() && (
                <div className="code-snippet mt-2">
                  <code>{code.trim()}</code>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Attempts section */}
        {isExpanded && !isEditing && (
          <div className="mt-3">
            {attempts.length > 0 && (
              <div className="attempts-container">
                {/* SVG branch from main timeline to attempts */}
                <TimelineBranch 
                  startX={-16}
                  startY={-8}
                  endX={24}
                  endY={20}
                  curveRadius={12}
                />
                
                {attempts.map((attempt, idx) => (
                  <div key={attempt.id} className="relative">
                    {/* Vertical connector between attempts */}
                    {idx > 0 && (
                      <VerticalConnector
                        x={24}
                        startY={-12}
                        endY={0}
                      />
                    )}
                    
                    <AttemptItem
                      attempt={attempt}
                      index={idx}
                      isLast={idx === attempts.length - 1}
                      onUpdate={(updates) => handleUpdateAttempt(attempt.id, updates)}
                      onDelete={() => handleDeleteAttempt(attempt.id)}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={handleAddAttempt}
              className="timeline-button flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3 h-3" />
              Add Attempt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main IssueTrackerBlock Component
const IssueTrackerBlock = ({ block, onUpdate }) => {
  // Ensure block has proper structure
  if (!block) {
    return (
      <div className="bg-dark-secondary/30 backdrop-blur-sm rounded-xl p-6 border border-dark-primary/50">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-dark-primary/50 rounded mb-4"></div>
          <div className="h-20 w-full bg-dark-primary/30 rounded mb-2"></div>
          <div className="h-20 w-full bg-dark-primary/30 rounded mb-2"></div>
          <div className="h-10 w-32 bg-dark-primary/30 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Initialize with proper defaults
  const blockData = block.data || {};
  const [milestone, setMilestone] = useState(blockData.milestone || '');
  const [issues, setIssues] = useState(blockData.issues || []);
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const saveTimeoutRef = useRef(null);

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

  // Trigger save when data changes
  useEffect(() => {
    handleSave();
  }, [milestone, issues, handleSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleAddIssue = () => {
    const newIssue = {
      id: `issue-${Date.now()}`,
      title: '',
      description: '',
      code: '',
      status: 'active',
      attempts: []
    };
    setIssues([...issues, newIssue]);
  };

  const handleUpdateIssue = (issueId, updates) => {
    setIssues(issues.map(issue => issue.id === issueId ? updates : issue));
  };

  const handleDeleteIssue = (issueId) => {
    setIssues(issues.filter(issue => issue.id !== issueId));
  };

  return (
    <div className="bg-dark-secondary/30 backdrop-blur-sm rounded-xl p-6 border border-dark-primary/50 max-h-[600px] flex flex-col">
      {/* Milestone Header */}
      {(milestone || isEditingMilestone) && (
        <div className="mb-4">
          {isEditingMilestone ? (
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <input
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                onBlur={() => {
                  if (milestone) {
                    setIsEditingMilestone(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingMilestone(false);
                  } else if (e.key === 'Escape') {
                    setMilestone('');
                    setIsEditingMilestone(false);
                  }
                }}
                className="timeline-input flex-1"
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
              <h2 className="text-lg font-semibold">
                {milestone}
              </h2>
            </div>
          )}
        </div>
      )}

      {/* Optional milestone button if not set */}
      {!milestone && !isEditingMilestone && issues.length > 0 && (
        <button
          onClick={() => setIsEditingMilestone(true)}
          className="timeline-button flex items-center gap-1.5 mb-3"
        >
          <Target className="w-3.5 h-3.5" />
          Add milestone
        </button>
      )}

      {/* Issues List with Timeline */}
      <div className="flex-1 overflow-y-auto issue-tracker-scroll">
        {issues.length > 0 ? (
          <div className="issue-timeline-container">
            {/* Main vertical timeline line */}
            <div className="issue-timeline-line" aria-hidden="true" />
            
            {issues.map((issue, idx) => (
              <IssueItem
                key={issue.id}
                issue={issue}
                onUpdate={(updates) => handleUpdateIssue(issue.id, updates)}
                onDelete={() => handleDeleteIssue(issue.id)}
                isLast={idx === issues.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="timeline-empty">
            Track issues and debugging attempts
          </div>
        )}
      </div>

      {/* Add Issue Button */}
      <button
        onClick={handleAddIssue}
        className="add-issue-button"
        aria-label="Add new issue"
      >
        <Plus className="w-3.5 h-3.5" />
        {issues.length === 0 ? 'Add First Issue' : 'Add Issue'}
      </button>
    </div>
  );
};

export default IssueTrackerBlock;