import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Check, AlertCircle, Clock, Code, Target, Lightbulb } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import './IssueTrackerBlock.css';

// Status indicators as React components with proper SVG icons
const StatusIndicator = ({ status, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const indicators = {
    active: (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
          <circle cx="10" cy="10" r="8" stroke="#ef4444" strokeWidth="2" />
          <circle cx="10" cy="10" r="3" fill="#ef4444" className="animate-pulse" />
        </svg>
      </div>
    ),
    'in-progress': (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 20 20" fill="none" className="w-full h-full animate-spin-slow">
          <circle cx="10" cy="10" r="8" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
          <path d="M10 6 L10 10 L13 13" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    failed: (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
          <circle cx="10" cy="10" r="8" stroke="#f97316" strokeWidth="2" />
          <path d="M7 7 L13 13 M13 7 L7 13" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    success: (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
          <circle cx="10" cy="10" r="8" fill="#10b981" />
          <path d="M6 10 L9 13 L14 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    solved: (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
          <circle cx="10" cy="10" r="8" fill="#10b981" />
          <path d="M6 10 L9 13 L14 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  };

  return (
    <div role="img" aria-label={`Status: ${status}`}>
      {indicators[status] || indicators.active}
    </div>
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
    <div className="relative ml-3 sm:ml-6 mb-4">
      {/* Connection line */}
      {!isLast && (
        <div className="absolute left-2 top-6 w-0.5 h-full bg-gradient-to-b from-gray-600 to-transparent opacity-50" />
      )}
      
      <div className="flex items-start gap-2 sm:gap-3">
        <StatusIndicator status={status} size="md" className="mt-1 z-10 flex-shrink-0" />
        
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100"
                placeholder="Describe the attempt..."
                rows={2}
              />
              
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="failed">Failed</option>
                  <option value="success">Success</option>
                </select>
                
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Code className="w-3 h-3" />
                  Code
                </button>
                
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                
                <button
                  onClick={onDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              {showCode && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 font-mono"
                  placeholder="Add code snippet..."
                  rows={4}
                />
              )}
            </div>
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="cursor-pointer hover:bg-gray-800 rounded p-2 -m-2 transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
              aria-label="Edit attempt"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-300 flex-1">{description || 'Click to add description'}</span>
                {result === 'success' ? (
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" aria-label="Success" />
                ) : (
                  <X className="w-3 h-3 text-red-500 flex-shrink-0" aria-label="Failed" />
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
                        className={className}
                        style={{
                          ...style,
                          background: 'rgb(31, 41, 55)',
                          padding: '8px',
                          borderRadius: '4px',
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
                            <span className="text-gray-500">No code</span>
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
    <div className="relative mb-6">
      {/* Connection line */}
      {!isLast && (
        <div className="absolute left-2 top-8 w-0.5 h-full bg-gradient-to-b from-gray-600 to-transparent" />
      )}
      
      <div className="flex items-start gap-3">
        <StatusIndicator status={status} className="mt-1 z-10 bg-gray-900" />
        
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                placeholder="Issue title..."
              />
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100"
                placeholder="Describe the issue..."
                rows={2}
              />
              
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100"
                >
                  <option value="active">Active</option>
                  <option value="in-progress">In Progress</option>
                  <option value="solved">Solved</option>
                </select>
                
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-400 hover:text-gray-100 flex items-center gap-1"
                >
                  <Code className="w-3 h-3" />
                  Code
                </button>
                
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                
                <button
                  onClick={onDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              {showCode && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 font-mono"
                  placeholder="Add code snippet..."
                  rows={4}
                />
              )}
            </div>
          ) : (
            <div>
              <div 
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:bg-gray-800 rounded p-2 -m-2"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-gray-400 hover:text-gray-100 transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  
                  <h3 className="font-medium text-gray-100">{title || 'Click to add title'}</h3>
                  
                  {status === 'solved' && <Check className="w-4 h-4 text-green-500" />}
                  {status === 'in-progress' && <Clock className="w-4 h-4 text-blue-500" />}
                  {status === 'active' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
                
                {description && (
                  <p className="text-sm text-gray-400 mt-1 ml-6">{description}</p>
                )}
                
                {code && code.trim() && (
                  <div className="mt-2 ml-6">
                    <Highlight
                      theme={themes.nightOwl}
                      code={code.trim()}
                      language="javascript"
                    >
                      {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre 
                          className={className}
                          style={{
                            ...style,
                            background: 'rgb(31, 41, 55)',
                            padding: '8px',
                            borderRadius: '4px',
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
                              <span className="text-gray-500">No code</span>
                            )}
                          </code>
                        </pre>
                      )}
                    </Highlight>
                  </div>
                )}
              </div>
              
              {isExpanded && (
                <div className="mt-4 ml-6 animate-fade-in">
                  {attempts.map((attempt, idx) => (
                    <AttemptItem
                      key={attempt.id}
                      attempt={attempt}
                      onUpdate={(updates) => handleUpdateAttempt(attempt.id, updates)}
                      onDelete={() => handleDeleteAttempt(attempt.id)}
                      isLast={idx === attempts.length - 1}
                    />
                  ))}
                  
                  <button
                    onClick={handleAddAttempt}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded transition-all hover:shadow-md"
                  >
                    <Plus className="w-3 h-3" />
                    Add Attempt
                  </button>
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
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="issue-skeleton h-8 w-48 rounded mb-4"></div>
        <div className="issue-skeleton h-20 w-full rounded mb-2"></div>
        <div className="issue-skeleton h-20 w-full rounded mb-2"></div>
        <div className="issue-skeleton h-12 w-32 rounded"></div>
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

  // Empty state when no issues exist
  if (issues.length === 0 && !milestone) {
    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="issue-tracker-empty">
          <svg viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M40 60 L50 70 L80 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            <circle cx="30" cy="30" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="90" cy="30" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="30" cy="90" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="90" cy="90" r="4" fill="currentColor" opacity="0.4"/>
          </svg>
          <h3 className="text-lg font-medium text-gray-100 mb-2">Track Your Problem-Solving Journey</h3>
          <p className="text-sm text-gray-400 mb-4 max-w-md">
            Document issues, track solution attempts, and build a knowledge base of your debugging experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setMilestone('New Project');
                setIsEditingMilestone(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Target className="w-4 h-4" />
              Set Milestone
            </button>
            <button
              onClick={handleAddIssue}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <AlertCircle className="w-4 h-4" />
              Add First Issue
            </button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
            <Lightbulb className="w-3 h-3" />
            <span>Tip: Start by setting a milestone for your project or feature</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 issue-tracker-block">
      {/* Milestone Header */}
      <div className="mb-6">
        {isEditingMilestone ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <input
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              onBlur={() => setIsEditingMilestone(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingMilestone(false)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
              placeholder="Enter milestone..."
              autoFocus
            />
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingMilestone(true)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 rounded p-2 -m-2"
          >
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-semibold text-gray-100">
              {milestone || 'Click to set milestone'}
            </h2>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-2">
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

      {/* Add Issue Button */}
      <button
        onClick={handleAddIssue}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg w-full transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
        aria-label="Add new issue"
      >
        <Plus className="w-4 h-4" />
        Add Issue
      </button>
    </div>
  );
};

export default IssueTrackerBlock;