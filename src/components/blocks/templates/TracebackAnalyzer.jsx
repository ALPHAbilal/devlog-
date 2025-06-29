import { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, CheckCircle, XCircle, 
         FileCode, Hash, Package, Lightbulb, Copy, Check } from 'lucide-react';

export default function TracebackAnalyzer({ block, data, onUpdate }) {
  const [expandedFrames, setExpandedFrames] = useState({});
  const [copied, setCopied] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // Parse traceback on mount or when raw traceback changes
  useEffect(() => {
    if (data.rawTraceback && !data.parsed) {
      parseTraceback(data.rawTraceback);
    }
  }, [data.rawTraceback]);

  const parseTraceback = (rawText) => {
    const lines = rawText.trim().split('\n');
    const frames = [];
    let errorType = '';
    let errorMessage = '';
    
    // Extract error type and message from the last line
    const lastLine = lines[lines.length - 1];
    const errorMatch = lastLine.match(/^(\w+Error|Exception): (.+)$/);
    if (errorMatch) {
      errorType = errorMatch[1];
      errorMessage = errorMatch[2];
    }

    // Parse stack frames
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      
      // Match frame header: File "filename", line X, in function_name
      const frameMatch = line.match(/File "([^"]+)", line (\d+), in (.+)$/);
      if (frameMatch) {
        const [, filename, lineNumber, functionName] = frameMatch;
        
        // Get the code line (usually the next line)
        let codeLine = '';
        if (i + 1 < lines.length - 1 && lines[i + 1].trim()) {
          codeLine = lines[i + 1].trim();
        }
        
        frames.push({
          id: `frame-${frames.length}`,
          filename,
          lineNumber: parseInt(lineNumber),
          functionName,
          codeLine,
          notes: '',
          variables: {},
          resolved: false
        });
      }
    }

    onUpdate(block.id, {
      ...data,
      parsed: true,
      errorType,
      errorMessage,
      frames,
      status: 'analyzing'
    });
  };

  const toggleFrame = (frameId) => {
    setExpandedFrames(prev => ({
      ...prev,
      [frameId]: !prev[frameId]
    }));
  };

  const updateFrame = (frameId, updates) => {
    const newFrames = data.frames.map(frame => 
      frame.id === frameId ? { ...frame, ...updates } : frame
    );
    onUpdate(block.id, { ...data, frames: newFrames });
  };

  const addVariable = (frameId) => {
    const varName = `var${Object.keys(data.frames.find(f => f.id === frameId).variables).length + 1}`;
    updateFrame(frameId, {
      variables: {
        ...data.frames.find(f => f.id === frameId).variables,
        [varName]: ''
      }
    });
  };

  const updateVariable = (frameId, varName, value) => {
    const frame = data.frames.find(f => f.id === frameId);
    updateFrame(frameId, {
      variables: {
        ...frame.variables,
        [varName]: value
      }
    });
  };

  const deleteVariable = (frameId, varName) => {
    const frame = data.frames.find(f => f.id === frameId);
    const newVars = { ...frame.variables };
    delete newVars[varName];
    updateFrame(frameId, { variables: newVars });
  };

  const copyTraceback = () => {
    navigator.clipboard.writeText(data.rawTraceback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'analyzing': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'unresolved': return 'text-red-500 bg-red-500/10 border-red-500/30';
      default: return 'text-text-secondary bg-dark-secondary/30 border-dark-secondary/50';
    }
  };

  const getErrorTypeColor = (errorType) => {
    if (errorType.includes('Syntax')) return 'text-purple-500';
    if (errorType.includes('Type')) return 'text-blue-500';
    if (errorType.includes('Value')) return 'text-yellow-500';
    if (errorType.includes('Key') || errorType.includes('Index')) return 'text-orange-500';
    if (errorType.includes('Import') || errorType.includes('Module')) return 'text-pink-500';
    return 'text-red-500';
  };

  // If no traceback yet, show input area
  if (!data.rawTraceback) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-text-secondary mb-4">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">Paste Python Traceback</span>
        </div>
        
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            if (tempValue.trim()) {
              onUpdate(block.id, { ...data, rawTraceback: tempValue });
              setTempValue('');
            }
          }}
          placeholder={`Traceback (most recent call last):
  File "app.py", line 45, in process_data
    result = calculate_metrics(data)
  File "utils.py", line 12, in calculate_metrics
    return sum(values) / len(values)
ZeroDivisionError: division by zero`}
          className="w-full h-48 p-4 bg-dark-primary/30 border border-dark-secondary/50
                     rounded-lg text-text-primary font-mono text-sm
                     focus:outline-none focus:ring-1 focus:ring-accent-green/50
                     placeholder-text-secondary/30 resize-none"
          spellCheck={false}
        />
        
        <button
          onClick={() => {
            if (tempValue.trim()) {
              onUpdate(block.id, { ...data, rawTraceback: tempValue });
              setTempValue('');
            }
          }}
          className="px-4 py-2 bg-accent-green/10 hover:bg-accent-green/20
                     border border-accent-green/30 hover:border-accent-green/50
                     text-accent-green rounded-lg transition-all"
        >
          Analyze Traceback
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with error type and status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-lg font-mono font-semibold ${getErrorTypeColor(data.errorType)}`}>
              {data.errorType || 'Exception'}
            </span>
            <select
              value={data.status || 'analyzing'}
              onChange={(e) => onUpdate(block.id, { ...data, status: e.target.value })}
              className={`px-3 py-1 rounded-full text-xs font-medium border
                         ${getStatusColor(data.status || 'analyzing')}
                         bg-dark-primary focus:outline-none cursor-pointer`}
              style={{ backgroundColor: 'rgb(10, 22, 40)' }}
            >
              <option value="analyzing">🔍 Analyzing</option>
              <option value="resolved">✓ Resolved</option>
              <option value="unresolved">✗ Unresolved</option>
            </select>
          </div>
          <p className="text-text-secondary text-sm font-mono">{data.errorMessage}</p>
        </div>
        
        <button
          onClick={copyTraceback}
          className="p-2 text-text-secondary/50 hover:text-text-secondary
                     hover:bg-dark-secondary/30 rounded transition-all"
          title="Copy original traceback"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Solution field */}
      {data.status === 'resolved' && (
        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-green-500" />
            <span className="text-sm font-medium text-green-500">Solution</span>
          </div>
          <textarea
            value={data.solution || ''}
            onChange={(e) => onUpdate(block.id, { ...data, solution: e.target.value })}
            placeholder="Describe how you fixed this error..."
            className="w-full p-2 bg-dark-primary/30 border border-dark-secondary/50
                       rounded text-text-primary text-sm
                       focus:outline-none focus:ring-1 focus:ring-green-500/50
                       placeholder-text-secondary/30 resize-none"
            rows={2}
          />
        </div>
      )}

      {/* Stack frames */}
      <div className="space-y-2">
        <div className="text-xs text-text-secondary/50 uppercase tracking-wider mb-2">
          Stack Trace ({data.frames?.length || 0} frames)
        </div>
        
        {data.frames?.map((frame, index) => {
          const isExpanded = expandedFrames[frame.id];
          const isResolved = frame.resolved;
          
          return (
            <div
              key={frame.id}
              className={`border rounded-lg transition-all
                         ${isResolved 
                           ? 'border-green-500/20 bg-green-500/5' 
                           : 'border-dark-secondary/50 bg-dark-secondary/10'
                         }
                         ${isExpanded ? 'shadow-lg' : ''}`}
            >
              {/* Frame header */}
              <button
                onClick={() => toggleFrame(frame.id)}
                className="w-full p-3 flex items-center gap-3 text-left
                           hover:bg-dark-secondary/20 transition-colors rounded-t-lg"
              >
                <span className="text-text-secondary/50">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <FileCode size={14} />
                  <span className="font-mono">{frame.filename}</span>
                  <span className="text-text-secondary/30">:</span>
                  <span className="text-accent-green">{frame.lineNumber}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-secondary/50">in</span>
                  <span className="font-mono text-text-primary">{frame.functionName}()</span>
                </div>
                
                {isResolved && (
                  <CheckCircle size={16} className="text-green-500 ml-auto" />
                )}
              </button>

              {/* Frame details */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-dark-secondary/30">
                  {/* Code line */}
                  {frame.codeLine && (
                    <div className="mt-3 p-2 bg-dark-primary/30 rounded font-mono text-sm">
                      <code className="text-red-400/70">{frame.codeLine}</code>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-text-secondary/70 block mb-1">
                      📝 Notes
                    </label>
                    <textarea
                      value={frame.notes}
                      onChange={(e) => updateFrame(frame.id, { notes: e.target.value })}
                      placeholder="What did you discover about this frame?"
                      className="w-full p-2 bg-dark-primary/30 border border-dark-secondary/50
                                 rounded text-text-primary text-sm
                                 focus:outline-none focus:ring-1 focus:ring-accent-green/50
                                 placeholder-text-secondary/30 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Variables */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-text-secondary/70">
                        🔍 Variable States
                      </label>
                      <button
                        onClick={() => addVariable(frame.id)}
                        className="text-xs text-accent-green/70 hover:text-accent-green
                                   transition-colors"
                      >
                        + Add Variable
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      {Object.entries(frame.variables).map(([varName, varValue]) => (
                        <div key={varName} className="flex items-center gap-2 group">
                          {editingField === `var-${frame.id}-${varName}` ? (
                            <input
                              type="text"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => {
                                const newVars = { ...frame.variables };
                                delete newVars[varName];
                                newVars[tempValue] = varValue;
                                updateFrame(frame.id, { variables: newVars });
                                setEditingField(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newVars = { ...frame.variables };
                                  delete newVars[varName];
                                  newVars[tempValue] = varValue;
                                  updateFrame(frame.id, { variables: newVars });
                                  setEditingField(null);
                                } else if (e.key === 'Escape') {
                                  setEditingField(null);
                                }
                              }}
                              className="px-2 py-1 bg-dark-primary/50 rounded text-sm
                                         font-mono text-accent-green focus:outline-none
                                         focus:ring-1 focus:ring-accent-green/50"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingField(`var-${frame.id}-${varName}`);
                                setTempValue(varName);
                              }}
                              className="px-2 py-1 text-sm font-mono text-accent-green/70
                                         hover:text-accent-green hover:bg-dark-primary/30
                                         rounded transition-colors"
                            >
                              {varName}
                            </button>
                          )}
                          
                          <span className="text-text-secondary/30">=</span>
                          
                          <input
                            type="text"
                            value={varValue}
                            onChange={(e) => updateVariable(frame.id, varName, e.target.value)}
                            placeholder="value"
                            className="flex-1 px-2 py-1 bg-dark-primary/30 rounded
                                       text-sm font-mono text-text-secondary
                                       focus:outline-none focus:ring-1 focus:ring-accent-green/50"
                          />
                          
                          <button
                            onClick={() => deleteVariable(frame.id, varName)}
                            className="opacity-0 group-hover:opacity-100 text-text-secondary/30
                                       hover:text-red-400 transition-all p-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mark as resolved */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => updateFrame(frame.id, { resolved: !frame.resolved })}
                      className={`px-3 py-1 text-xs font-medium rounded-full
                                 transition-all ${
                                   frame.resolved
                                     ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                                     : 'bg-dark-secondary/30 text-text-secondary border border-dark-secondary/50'
                                 }`}
                    >
                      {frame.resolved ? '✓ Resolved' : 'Mark as resolved'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset button */}
      <div className="flex justify-end">
        <button
          onClick={() => onUpdate(block.id, { 
            rawTraceback: '', 
            parsed: false, 
            frames: [], 
            errorType: '', 
            errorMessage: '',
            status: 'analyzing',
            solution: ''
          })}
          className="text-xs text-text-secondary/50 hover:text-text-secondary
                     transition-colors"
        >
          Analyze new traceback
        </button>
      </div>
    </div>
  );
}