import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Check, AlertCircle, Clock, Code, Target, Trash2 } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import './IssueTrackerBlock.css';

// Modern 2025 status indicators with enhanced visual feedback
const StatusIndicator = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5'
  };

  const statusStyles = {
    active: 'bg-gradient-to-br from-red-500 to-red-600',
    'in-progress': 'bg-gradient-to-br from-blue-500 to-blue-600',
    failed: 'bg-gradient-to-br from-orange-500 to-orange-600',
    success: 'bg-gradient-to-br from-accent-green to-green-500',
    solved: 'bg-gradient-to-br from-accent-green to-green-500'
  };

  const pulseStyles = {
    active: 'animate-pulse',
    'in-progress': 'animate-pulse',
    failed: '',
    success: '',
    solved: ''
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full ${statusStyles[status] || statusStyles.active} ${pulseStyles[status] || ''} shadow-lg transition-all duration-300`} 
         role="img" 
         aria-label={`Status: ${status}`} />
  );
};

// Attempt Item Component
const AttemptItem = ({ attempt, onUpdate, onDelete, isLast }) => {
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
    <div className="relative flex mb-4 attempt-item group">
      {/* Timeline structure */}
      <div className="w-16 relative flex-shrink-0">
        {/* Branch line from main timeline */}
        <div className="attempt-branch-line" />
        {/* Status dot */}
        <div className="absolute left-[55px] top-[15px] transition-transform duration-300 group-hover:scale-110">
          <StatusIndicator status={status} size="sm" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 pl-1">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-dark-secondary/50 border border-dark-primary/50 rounded-lg 
                         text-sm text-text-primary placeholder-text-secondary/50
                         focus:outline-none focus:border-accent-green/30 transition-colors"
                placeholder="Describe the attempt..."
                rows={2}
              />
              
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="px-3 py-1.5 bg-dark-secondary/50 border border-dark-primary/50 rounded-lg 
                           text-sm text-text-primary focus:outline-none focus:border-accent-green/30"
                >
                  <option value="failed">Failed</option>
                  <option value="success">Success</option>
                </select>
                
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary 
                           hover:bg-dark-secondary/30 rounded-lg transition-all duration-200 
                           flex items-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  Code
                </button>
                
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm text-accent-green hover:bg-accent-green/10 
                           rounded-lg transition-all duration-200"
                >
                  Save
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary 
                           hover:bg-dark-secondary/30 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={onDelete}
                  className="px-2 py-1.5 text-text-secondary hover:text-red-400 
                           hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  aria-label="Delete attempt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {showCode && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-secondary/50 border border-dark-primary/50 rounded-lg 
                           text-sm text-text-primary font-mono placeholder-text-secondary/50
                           focus:outline-none focus:border-accent-green/30"
                  placeholder="Add code snippet..."
                  rows={4}
                />
              )}
            </div>
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="cursor-pointer hover:bg-dark-secondary/20 rounded-lg p-2 -m-2 transition-all duration-200"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
              aria-label="Edit attempt"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-text-secondary flex-1">
                  {description || 'Click to add description'}
                </span>
                {result === 'success' ? (
                  <Check className="w-3.5 h-3.5 text-accent-green" aria-label="Success" />
                ) : (
                  <X className="w-3.5 h-3.5 text-red-400/70" aria-label="Failed" />
                )}
              </div>
              
              {code && code.trim() && (
                <div className="mt-2">
                  <Highlight
                    theme={themes.nightOwl}
                    code={code.trim()}
                    language="javascript"
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre 
                        className={`${className} text-xs`}
                        style={{
                          ...style,
                          background: 'rgba(30, 58, 95, 0.3)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          overflow: 'auto'
                        }}
                      >
                        <code>
                          {tokens && tokens.length > 0 ? (
                            tokens.map((line, i) => (
                              <div key={i} {...getLineProps({ line, key: i })}>
                                {line && line.map ? line.map((token, key) => (
                                  <span key={key} {...getTokenProps({ token, key })} />
                                )) : null}
                              </div>
                            ))
                          ) : (
                            <span className="text-text-secondary/50">No code</span>
                          )}
                        </code>
                      </pre>
                    )}
                  </Highlight>
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
    <div className={`relative flex mb-8 issue-item status-${status}`}>
      {/* Timeline column */}
      <div className="w-16 relative flex-shrink-0">
        {/* Vertical timeline segment */}
        {!isLast && (
          <div className={`issue-vertical-segment ${status === 'active' || status === 'in-progress' ? 'active' : ''}`} 
               style={{ top: '36px', height: 'calc(100% - 20px)' }} />
        )}
        
        {/* Timeline dot container with hover effect */}
        <div className="issue-timeline-dot top-2" tabIndex={0}>
          <StatusIndicator status={status} />
        </div>
        
        {/* Modern connector line */}
        <div className="issue-timeline-connector" />
      </div>
      
      {/* Content column with modern wrapper */}
      <div className="flex-1 pl-1">
        <div className="issue-content-wrapper">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-dark-secondary/50 border border-dark-primary/50 rounded-lg 
                         text-text-primary placeholder-text-secondary/50
                         focus:outline-none focus:border-accent-green/30 transition-colors"
                placeholder="Issue title..."
              />
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-dark-secondary/50 border border-dark-primary/50 rounded-lg 
                         text-sm text-text-primary placeholder-text-secondary/50
                         focus:outline-none focus:border-accent-green/30"
                placeholder="Describe the issue..."
                rows={2}
              />
              
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-1.5 bg-dark-secondary/50 border border-dark-primary/50 rounded-lg 
                           text-sm text-text-primary focus:outline-none focus:border-accent-green/30"
                >
                  <option value="active">Active</option>
                  <option value="in-progress">In Progress</option>
                  <option value="solved">Solved</option>
                </select>
                
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary 
                           hover:bg-dark-secondary/30 rounded-lg transition-all duration-200 
                           flex items-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  Code
                </button>
                
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm text-accent-green hover:bg-accent-green/10 
                           rounded-lg transition-all duration-200"
                >
                  Save
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary 
                           hover:bg-dark-secondary/30 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={onDelete}
                  className="px-2 py-1.5 text-text-secondary hover:text-red-400 
                           hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  aria-label="Delete attempt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {showCode && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-secondary/50 border border-dark-primary/50 rounded-lg 
                           text-sm text-text-primary font-mono placeholder-text-secondary/50
                           focus:outline-none focus:border-accent-green/30"
                  placeholder="Add code snippet..."
                  rows={4}
                />
              )}
            </div>
          ) : (
            <div>
              <div 
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:bg-dark-secondary/20 rounded-lg p-2 -m-2 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-text-secondary hover:text-text-primary transition-all duration-200 -ml-1"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                  </button>
                  
                  <h3 className="font-medium text-text-primary flex-1">
                    {title || 'Click to add title'}
                  </h3>
                  
                  {status === 'solved' && <Check className="w-4 h-4 text-accent-green ml-auto" />}
                  {status === 'in-progress' && <Clock className="w-4 h-4 text-blue-400 ml-auto" />}
                  {status === 'active' && <AlertCircle className="w-4 h-4 text-red-400/70 ml-auto" />}
                </div>
                
                {description && (
                  <p className="text-sm text-text-secondary mt-1 ml-5">{description}</p>
                )}
                
                {code && code.trim() && (
                  <div className="mt-2 ml-5">
                    <Highlight
                      theme={themes.nightOwl}
                      code={code.trim()}
                      language="javascript"
                    >
                      {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre 
                          className={`${className} text-xs`}
                          style={{
                            ...style,
                            background: 'rgba(30, 58, 95, 0.3)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            overflow: 'auto'
                          }}
                        >
                          <code>
                            {tokens && tokens.length > 0 ? (
                              tokens.map((line, i) => (
                                <div key={i} {...getLineProps({ line, key: i })}>
                                  {line && line.map ? line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token, key })} />
                                  )) : null}
                                </div>
                              ))
                            ) : (
                              <span className="text-text-secondary/50">No code</span>
                            )}
                          </code>
                        </pre>
                      )}
                    </Highlight>
                  </div>
                )}
              </div>
              
              {isExpanded && (
                <div className="mt-4 animate-in fade-in duration-200">
                  {attempts.map((attempt, idx) => (
                    <AttemptItem
                      key={attempt.id}
                      attempt={attempt}
                      onUpdate={(updates) => handleUpdateAttempt(attempt.id, updates)}
                      onDelete={() => handleDeleteAttempt(attempt.id)}
                      isLast={idx === attempts.length - 1}
                    />
                  ))}
                  
                  <div className="flex">
                    <div className="w-12 flex-shrink-0"></div>
                    <button
                      onClick={handleAddAttempt}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary 
                               hover:text-text-primary hover:bg-dark-secondary/30 rounded-lg 
                               transition-all duration-200 ml-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Attempt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
      {/* Milestone Header - Minimal when empty */}
      {(milestone || isEditingMilestone) && (
        <div className="mb-6">
          {isEditingMilestone ? (
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-text-secondary/50" />
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
                className="flex-1 px-3 py-2 bg-transparent border-b border-dark-primary/30 
                         text-text-primary placeholder-text-secondary/40
                         focus:outline-none focus:border-accent-green/30 transition-colors"
                placeholder="Project milestone..."
                autoFocus
              />
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingMilestone(true)}
              className="flex items-center gap-3 cursor-pointer hover:bg-dark-secondary/20 rounded-lg p-2 -m-2 
                       transition-all duration-200"
            >
              <Target className="w-5 h-5 text-accent-green" />
              <h2 className="text-lg font-semibold text-text-primary">
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
          className="flex items-center gap-2 px-3 py-1.5 mb-4 text-xs text-text-secondary/40 
                   hover:text-text-secondary hover:bg-dark-secondary/20 rounded-lg 
                   transition-all duration-200"
        >
          <Target className="w-3.5 h-3.5" />
          Add milestone
        </button>
      )}

      {/* Issues List with Timeline */}
      <div className="flex-1 overflow-y-auto issue-tracker-scroll pr-2">
        {issues.length > 0 ? (
          <div className="relative issue-timeline-container">
            {/* Main vertical timeline line with gradient */}
            <div className="issue-timeline-line" />
            
            <div className="pb-2">
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
          </div>
        ) : (
          <div className="relative">
            {/* Empty state with modern timeline hint */}
            <div className="absolute left-6 top-0 w-0.5 h-16 bg-gradient-to-b from-transparent via-dark-secondary/20 to-transparent" />
            <div className="absolute left-[16px] top-6">
              <div className="w-[18px] h-[18px] rounded-full bg-dark-secondary/10 border-2 border-dashed border-dark-secondary/30 animate-pulse" />
            </div>
            <div className="text-center py-8 pl-12 text-text-secondary/40 text-sm">
              Track issues and debugging attempts
            </div>
          </div>
        )}
      </div>

      {/* Modern Add Issue Button with enhanced interaction */}
      <button
        onClick={handleAddIssue}
        className="group flex items-center gap-2 px-4 py-2.5 mt-4 text-sm text-text-secondary/60 
                 hover:text-text-primary hover:bg-dark-secondary/20 rounded-lg w-full 
                 transition-all duration-300 border border-dashed border-dark-primary/20 
                 hover:border-accent-green/30 hover:shadow-lg hover:shadow-accent-green/5"
        aria-label="Add new issue"
      >
        <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
        {issues.length === 0 ? 'Add First Issue' : 'Add Issue'}
      </button>
    </div>
  );
};

export default IssueTrackerBlock;