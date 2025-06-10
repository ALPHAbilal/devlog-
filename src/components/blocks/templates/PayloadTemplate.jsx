import { useState, useEffect } from 'react';
import { Copy, Check, AlertCircle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

export default function PayloadTemplate({ data, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Validate JSON whenever data changes
  useEffect(() => {
    try {
      JSON.parse(data.payload);
      setJsonError(null);
    } catch (error) {
      setJsonError(error.message);
    }
  }, [data.payload]);

  const handlePayloadEdit = (value) => {
    try {
      // Try to parse to check validity
      JSON.parse(value);
      setJsonError(null);
      onUpdate({ ...data, payload: value });
    } catch (error) {
      // Still update but show error
      setJsonError(error.message);
      onUpdate({ ...data, payload: value });
    }
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(data.payload);
      const formatted = JSON.stringify(parsed, null, 2);
      onUpdate({ ...data, payload: formatted });
      setJsonError(null);
    } catch (error) {
      setJsonError(error.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateHeader = (key, value) => {
    const newHeaders = { ...data.headers };
    if (value === '') {
      delete newHeaders[key];
    } else {
      newHeaders[key] = value;
    }
    onUpdate({ ...data, headers: newHeaders });
  };

  const addHeader = () => {
    const newKey = `header${Object.keys(data.headers).length + 1}`;
    updateHeader(newKey, 'value');
    setEditingField(`header-key-${newKey}`);
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Color scheme based on method
  const methodColors = {
    GET: 'text-green-500 bg-green-500/10 border-green-500/30',
    POST: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    PUT: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    DELETE: 'text-red-500 bg-red-500/10 border-red-500/30',
    PATCH: 'text-purple-500 bg-purple-500/10 border-purple-500/30'
  };

  return (
    <div className="space-y-4">
      {/* Endpoint Configuration */}
      <div className="space-y-3">
        {/* Method and URL */}
        <div className="flex items-center gap-2">
          <select
            value={data.method}
            onChange={(e) => onUpdate({ ...data, method: e.target.value })}
            className={`px-3 py-1.5 rounded border font-mono text-sm
                       focus:outline-none cursor-pointer
                       focus:ring-1 focus:ring-accent-green/50
                       transition-all duration-150
                       ${methodColors[data.method] || methodColors.GET}`}
            style={{
              backgroundColor: 'rgb(10, 22, 40)',
              backgroundImage: 'none'
            }}
          >
            <option value="GET" style={{ backgroundColor: 'rgb(10, 22, 40)' }}>GET</option>
            <option value="POST" style={{ backgroundColor: 'rgb(10, 22, 40)' }}>POST</option>
            <option value="PUT" style={{ backgroundColor: 'rgb(10, 22, 40)' }}>PUT</option>
            <option value="DELETE" style={{ backgroundColor: 'rgb(10, 22, 40)' }}>DELETE</option>
            <option value="PATCH" style={{ backgroundColor: 'rgb(10, 22, 40)' }}>PATCH</option>
          </select>
          
          <input
            type="text"
            value={data.endpoint}
            onChange={(e) => onUpdate({ ...data, endpoint: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 px-3 py-1.5 rounded border border-dark-secondary/50
                       bg-dark-primary/50 text-text-primary font-mono text-sm
                       focus:outline-none focus:ring-1 focus:ring-accent-green/50
                       hover:border-dark-secondary transition-colors"
          />
        </div>

        {/* Headers Section */}
        <div className="border border-dark-secondary/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('headers')}
            className="w-full px-3 py-2 bg-dark-secondary/20 hover:bg-dark-secondary/30
                       flex items-center justify-between transition-colors"
          >
            <span className="text-sm font-medium text-text-secondary">
              Headers {Object.keys(data.headers).length > 0 && 
                <span className="text-xs text-text-secondary/50 ml-2">
                  ({Object.keys(data.headers).length})
                </span>
              }
            </span>
            {collapsedSections.headers ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {!collapsedSections.headers && (
            <div className="p-3 space-y-2">
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 group">
                  {editingField === `header-key-${key}` ? (
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={() => {
                        const newHeaders = { ...data.headers };
                        delete newHeaders[key];
                        newHeaders[tempValue] = value;
                        onUpdate({ ...data, headers: newHeaders });
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newHeaders = { ...data.headers };
                          delete newHeaders[key];
                          newHeaders[tempValue] = value;
                          onUpdate({ ...data, headers: newHeaders });
                          setEditingField(null);
                        } else if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      className="flex-1 px-2 py-1 bg-dark-primary/50 rounded
                                 text-sm font-mono focus:outline-none
                                 focus:ring-1 focus:ring-accent-green/50"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingField(`header-key-${key}`);
                        setTempValue(key);
                      }}
                      className="flex-1 text-left px-2 py-1 rounded text-sm font-mono
                                 text-accent-green hover:bg-dark-primary/30 transition-colors"
                    >
                      {key}
                    </button>
                  )}
                  
                  <span className="text-text-secondary/30">:</span>
                  
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateHeader(key, e.target.value)}
                    placeholder="value"
                    className="flex-1 px-2 py-1 bg-dark-primary/30 rounded
                               text-sm font-mono text-text-secondary
                               focus:outline-none focus:ring-1 focus:ring-accent-green/50
                               hover:bg-dark-primary/50 transition-colors"
                  />
                  
                  <button
                    onClick={() => updateHeader(key, '')}
                    className="opacity-0 group-hover:opacity-100 text-text-secondary/50
                               hover:text-red-400 transition-all p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                onClick={addHeader}
                className="w-full px-2 py-1 border border-dashed border-dark-secondary/50
                           rounded text-xs text-text-secondary/50 hover:text-text-secondary
                           hover:border-accent-green/50 transition-colors"
              >
                + Add Header
              </button>
            </div>
          )}
        </div>

        {/* Payload Section */}
        <div className="border border-dark-secondary/30 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-dark-secondary/20 flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              Payload
              {jsonError && (
                <span className="text-xs text-red-400 ml-2 inline-flex items-center gap-1">
                  <AlertCircle size={12} />
                  Invalid JSON
                </span>
              )}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={formatJSON}
                className="p-1 text-text-secondary/50 hover:text-text-secondary
                           transition-colors"
                title="Format JSON"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={copyToClipboard}
                className="p-1 text-text-secondary/50 hover:text-text-secondary
                           transition-colors"
                title="Copy payload"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          
          <div className="relative">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 p-3 pointer-events-none select-none">
              <div className="text-text-secondary/20 font-mono text-sm leading-[1.5]">
                {data.payload.split('\n').map((_, i) => (
                  <div key={i} className="text-right pr-2" style={{ minWidth: '2ch' }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            
            <textarea
              value={data.payload}
              onChange={(e) => handlePayloadEdit(e.target.value)}
              className={`w-full p-3 bg-dark-primary/30 text-text-primary font-mono text-sm
                         focus:outline-none focus:ring-1 focus:ring-accent-green/50
                         resize-none transition-colors
                         ${jsonError ? 'text-red-400/70' : ''}`}
              style={{ paddingLeft: '3.5rem' }}
              rows={10}
              spellCheck={false}
              placeholder='{\n  "key": "value"\n}'
            />
          </div>
        </div>

        {/* Preset Templates */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-text-secondary/50">Quick templates:</span>
          {Object.entries(payloadPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => onUpdate({
                ...data,
                method: preset.method,
                endpoint: preset.endpoint,
                headers: preset.headers,
                payload: JSON.stringify(preset.payload, null, 2)
              })}
              className="px-2 py-1 text-xs bg-dark-secondary/30 hover:bg-dark-secondary/50
                         rounded border border-dark-secondary/30 hover:border-accent-green/30
                         text-text-secondary hover:text-text-primary transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Preset payload templates
const payloadPresets = {
  openai: {
    name: 'OpenAI Chat',
    method: 'POST',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    payload: {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' }
      ],
      temperature: 0.7
    }
  },
  anthropic: {
    name: 'Claude API',
    method: 'POST',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_API_KEY',
      'anthropic-version': '2023-06-01'
    },
    payload: {
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: 'Hello, Claude!' }
      ]
    }
  },
  graphql: {
    name: 'GraphQL Query',
    method: 'POST',
    endpoint: 'https://api.example.com/graphql',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: {
      query: `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}`,
      variables: { id: '123' }
    }
  },
  webhook: {
    name: 'Webhook Event',
    method: 'POST',
    endpoint: 'https://hooks.example.com/webhook',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': 'YOUR_SECRET'
    },
    payload: {
      event: 'user.created',
      timestamp: new Date().toISOString(),
      data: {
        userId: '12345',
        email: 'user@example.com'
      }
    }
  }
};