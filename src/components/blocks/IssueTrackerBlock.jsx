import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Check, AlertCircle, Clock, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Status indicators as React components
const StatusIndicator = ({ status, className = '' }) => {
  const indicators = {
    active: (
      <span className={`inline-flex items-center justify-center w-4 h-4 text-red-500 ${className}`}>
        ▣
      </span>
    ),
    'in-progress': (
      <span className={`inline-flex items-center justify-center w-4 h-4 text-blue-500 ${className}`}>
        ▢
      </span>
    ),
    failed: (
      <span className={`inline-flex items-center justify-center w-4 h-4 text-orange-500 ${className}`}>
        ◈
      </span>
    ),
    success: (
      <span className={`inline-flex items-center justify-center w-4 h-4 text-green-500 ${className}`}>
        ◆
      </span>
    ),
    solved: (
      <span className={`inline-flex items-center justify-center w-4 h-4 text-green-500 ${className}`}>
        ◆
      </span>
    )
  };

  return indicators[status] || indicators.active;
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
    <div className="relative ml-6 mb-4">
      {/* Connection line */}
      {!isLast && (
        <div className="absolute left-2 top-6 w-0.5 h-full bg-gray-700" />
      )}
      
      <div className="flex items-start gap-3">
        <StatusIndicator status={status} className="mt-1 z-10 bg-gray-900" />
        
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
              
              <div className="flex items-center gap-2">
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100"
                >
                  <option value="failed">Failed</option>
                  <option value="success">Success</option>
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
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
                
                <button
                  onClick={onDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
              className="cursor-pointer hover:bg-gray-800 rounded p-2 -m-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-300">{description || 'Click to add description'}</span>
                {result === 'success' ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-red-500" />
                )}
              </div>
              
              {code && (
                <div className="mt-2">
                  <SyntaxHighlighter
                    language="javascript"
                    style={vscDarkPlus}
                    customStyle={{
                      background: 'rgb(31, 41, 55)',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
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
        <div className="absolute left-2 top-8 w-0.5 h-full bg-gray-700" />
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
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
                
                <button
                  onClick={onDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
                    className="text-gray-400 hover:text-gray-100"
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
                
                {code && (
                  <div className="mt-2 ml-6">
                    <SyntaxHighlighter
                      language="javascript"
                      style={vscDarkPlus}
                      customStyle={{
                        background: 'rgb(31, 41, 55)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {code}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
              
              {isExpanded && (
                <div className="mt-4 ml-6">
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
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded"
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
  const [milestone, setMilestone] = useState(block.data?.milestone || '');
  const [issues, setIssues] = useState(block.data?.issues || []);
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
    <div className="bg-gray-900 rounded-lg p-4">
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
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg w-full"
      >
        <Plus className="w-4 h-4" />
        Add Issue
      </button>
    </div>
  );
};

export default IssueTrackerBlock;