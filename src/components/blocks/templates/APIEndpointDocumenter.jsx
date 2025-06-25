import React, { useState } from 'react';
import { 
  Code2, Plus, Trash2, ChevronDown, ChevronRight, 
  Copy, Check, Shield, Key, FileText, AlertCircle,
  Server, Globe, Database, Lock
} from 'lucide-react';

const METHOD_COLORS = {
  GET: 'text-green-400 bg-green-400/10',
  POST: 'text-blue-400 bg-blue-400/10',
  PUT: 'text-yellow-400 bg-yellow-400/10',
  PATCH: 'text-orange-400 bg-orange-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
  HEAD: 'text-purple-400 bg-purple-400/10',
  OPTIONS: 'text-pink-400 bg-pink-400/10'
};

const PARAM_TYPES = ['string', 'number', 'boolean', 'array', 'object', 'file'];
const PARAM_LOCATIONS = ['path', 'query', 'header', 'body'];

const AUTH_TYPES = {
  none: { label: 'No Auth', icon: Globe },
  bearer: { label: 'Bearer Token', icon: Key },
  basic: { label: 'Basic Auth', icon: Lock },
  apiKey: { label: 'API Key', icon: Shield },
  oauth2: { label: 'OAuth 2.0', icon: Server }
};

export default function APIEndpointDocumenter({ data, onUpdate }) {
  const [expandedSections, setExpandedSections] = useState({
    request: true,
    parameters: true,
    responses: true,
    examples: true
  });
  const [copiedField, setCopiedField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // Initialize data structure
  const endpoint = {
    method: data.method || 'GET',
    path: data.path || '/api/v1/resource',
    title: data.title || 'Get Resource',
    description: data.description || 'Retrieve a specific resource by ID',
    authentication: data.authentication || 'bearer',
    parameters: data.parameters || [],
    requestBody: data.requestBody || null,
    responses: data.responses || [
      {
        status: 200,
        description: 'Successful response',
        example: '{\n  "id": "123",\n  "name": "Example",\n  "created_at": "2024-01-01T00:00:00Z"\n}'
      }
    ],
    examples: data.examples || []
  };

  const updateEndpoint = (field, value) => {
    onUpdate({ ...data, [field]: value });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startEditing = (field, value) => {
    setEditingField(field);
    setTempValue(value);
  };

  const saveEdit = () => {
    if (editingField) {
      const [section, index, field] = editingField.split('-');
      
      if (section === 'endpoint') {
        updateEndpoint(field, tempValue);
      } else if (section === 'param') {
        const newParams = [...endpoint.parameters];
        newParams[index][field] = tempValue;
        updateEndpoint('parameters', newParams);
      } else if (section === 'response') {
        const newResponses = [...endpoint.responses];
        newResponses[index][field] = tempValue;
        updateEndpoint('responses', newResponses);
      }
    }
    setEditingField(null);
    setTempValue('');
  };

  const addParameter = () => {
    updateEndpoint('parameters', [
      ...endpoint.parameters,
      {
        name: 'param_name',
        location: 'query',
        type: 'string',
        required: false,
        description: 'Parameter description',
        example: 'example_value'
      }
    ]);
  };

  const removeParameter = (index) => {
    updateEndpoint('parameters', endpoint.parameters.filter((_, i) => i !== index));
  };

  const addResponse = () => {
    updateEndpoint('responses', [
      ...endpoint.responses,
      {
        status: 201,
        description: 'Created',
        example: '{\n  "message": "Resource created successfully"\n}'
      }
    ]);
  };

  const removeResponse = (index) => {
    updateEndpoint('responses', endpoint.responses.filter((_, i) => i !== index));
  };

  const generateCurlExample = () => {
    let curl = `curl -X ${endpoint.method} '${endpoint.path}'`;
    
    if (endpoint.authentication === 'bearer') {
      curl += ` \\\n  -H 'Authorization: Bearer YOUR_TOKEN'`;
    } else if (endpoint.authentication === 'apiKey') {
      curl += ` \\\n  -H 'X-API-Key: YOUR_API_KEY'`;
    }
    
    if (endpoint.method !== 'GET' && endpoint.requestBody) {
      curl += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${endpoint.requestBody}'`;
    }
    
    return curl;
  };

  const generateOpenAPISpec = () => {
    const spec = {
      [endpoint.path]: {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.title,
          description: endpoint.description,
          parameters: endpoint.parameters.map(param => ({
            name: param.name,
            in: param.location,
            required: param.required,
            schema: { type: param.type },
            description: param.description
          })),
          responses: endpoint.responses.reduce((acc, resp) => ({
            ...acc,
            [resp.status]: {
              description: resp.description,
              content: {
                'application/json': {
                  example: JSON.parse(resp.example)
                }
              }
            }
          }), {})
        }
      }
    };
    
    return JSON.stringify(spec, null, 2);
  };

  const EditableField = ({ value, field, className = '', multiline = false }) => {
    if (editingField === field) {
      return multiline ? (
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingField(null);
              setTempValue('');
            }
          }}
          className={`w-full px-2 py-1 bg-dark-primary text-text-primary 
                      border border-accent-green/50 rounded focus:outline-none 
                      focus:border-accent-green resize-y ${className}`}
          autoFocus
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') {
              setEditingField(null);
              setTempValue('');
            }
          }}
          className={`px-2 py-1 bg-dark-primary text-text-primary 
                      border border-accent-green/50 rounded focus:outline-none 
                      focus:border-accent-green ${className}`}
          autoFocus
        />
      );
    }
    
    return (
      <span
        onClick={() => startEditing(field, value)}
        className={`cursor-pointer hover:text-accent-green transition-colors ${className}`}
      >
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-md font-mono text-sm font-medium
                            ${METHOD_COLORS[endpoint.method]}`}>
              {endpoint.method}
            </span>
            <code className="text-text-primary font-mono">
              <EditableField 
                value={endpoint.path} 
                field="endpoint--path"
                className="text-base"
              />
            </code>
          </div>
          <h3 className="text-xl font-medium text-text-primary mb-1">
            <EditableField 
              value={endpoint.title} 
              field="endpoint--title"
            />
          </h3>
          <p className="text-text-secondary">
            <EditableField 
              value={endpoint.description} 
              field="endpoint--description"
              multiline
            />
          </p>
        </div>
        
        {/* Authentication Badge */}
        <div className="flex items-center gap-2">
          <select
            value={endpoint.authentication}
            onChange={(e) => updateEndpoint('authentication', e.target.value)}
            className="px-3 py-1.5 bg-dark-secondary/50 text-text-primary text-sm
                       border border-dark-secondary rounded-md focus:outline-none
                       focus:border-accent-green/50"
          >
            {Object.entries(AUTH_TYPES).map(([key, auth]) => (
              <option key={key} value={key}>{auth.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Request Section */}
      <div className="border border-dark-secondary/50 rounded-lg">
        <button
          onClick={() => toggleSection('request')}
          className="w-full px-4 py-3 flex items-center justify-between
                     hover:bg-dark-secondary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Server size={18} className="text-text-secondary" />
            <span className="font-medium text-text-primary">Request</span>
          </div>
          {expandedSections.request ? 
            <ChevronDown size={18} className="text-text-secondary" /> : 
            <ChevronRight size={18} className="text-text-secondary" />
          }
        </button>
        
        {expandedSections.request && (
          <div className="p-4 border-t border-dark-secondary/30">
            {/* Method selector */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-1 block">HTTP Method</label>
              <div className="flex gap-2">
                {Object.keys(METHOD_COLORS).map(method => (
                  <button
                    key={method}
                    onClick={() => updateEndpoint('method', method)}
                    className={`px-3 py-1 rounded text-sm font-mono transition-all
                                ${endpoint.method === method 
                                  ? METHOD_COLORS[method] 
                                  : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Body */}
            {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Request Body</label>
                <div className="relative">
                  <textarea
                    value={endpoint.requestBody || '{\n  \n}'}
                    onChange={(e) => updateEndpoint('requestBody', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-primary/50 text-text-primary font-mono text-sm
                               border border-dark-secondary/50 rounded focus:outline-none
                               focus:border-accent-green/50 resize-y"
                    rows={6}
                    placeholder="JSON request body..."
                  />
                  <button
                    onClick={() => handleCopy(endpoint.requestBody || '', 'requestBody')}
                    className="absolute top-2 right-2 p-1 text-text-secondary/50 
                               hover:text-text-primary transition-colors"
                  >
                    {copiedField === 'requestBody' ? 
                      <Check size={16} className="text-accent-green" /> : 
                      <Copy size={16} />
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parameters Section */}
      <div className="border border-dark-secondary/50 rounded-lg">
        <button
          onClick={() => toggleSection('parameters')}
          className="w-full px-4 py-3 flex items-center justify-between
                     hover:bg-dark-secondary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Database size={18} className="text-text-secondary" />
            <span className="font-medium text-text-primary">Parameters</span>
            <span className="text-xs text-text-secondary">
              ({endpoint.parameters.length})
            </span>
          </div>
          {expandedSections.parameters ? 
            <ChevronDown size={18} className="text-text-secondary" /> : 
            <ChevronRight size={18} className="text-text-secondary" />
          }
        </button>
        
        {expandedSections.parameters && (
          <div className="p-4 border-t border-dark-secondary/30">
            <div className="space-y-3">
              {endpoint.parameters.map((param, index) => (
                <div key={index} className="p-3 bg-dark-primary/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="text-accent-green font-mono">
                        <EditableField 
                          value={param.name} 
                          field={`param-${index}-name`}
                        />
                      </code>
                      <span className="text-xs px-2 py-0.5 bg-dark-secondary/50 rounded text-text-secondary">
                        {param.location}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-dark-secondary/50 rounded text-text-secondary">
                        {param.type}
                      </span>
                      {param.required && (
                        <span className="text-xs px-2 py-0.5 bg-red-400/10 text-red-400 rounded">
                          required
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeParameter(index)}
                      className="p-1 text-text-secondary/50 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <p className="text-sm text-text-secondary mb-2">
                    <EditableField 
                      value={param.description} 
                      field={`param-${index}-description`}
                      multiline
                    />
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <select
                      value={param.location}
                      onChange={(e) => {
                        const newParams = [...endpoint.parameters];
                        newParams[index].location = e.target.value;
                        updateEndpoint('parameters', newParams);
                      }}
                      className="px-2 py-1 bg-dark-primary text-text-primary
                                 border border-dark-secondary/50 rounded focus:outline-none"
                    >
                      {PARAM_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    
                    <select
                      value={param.type}
                      onChange={(e) => {
                        const newParams = [...endpoint.parameters];
                        newParams[index].type = e.target.value;
                        updateEndpoint('parameters', newParams);
                      }}
                      className="px-2 py-1 bg-dark-primary text-text-primary
                                 border border-dark-secondary/50 rounded focus:outline-none"
                    >
                      {PARAM_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => {
                          const newParams = [...endpoint.parameters];
                          newParams[index].required = e.target.checked;
                          updateEndpoint('parameters', newParams);
                        }}
                        className="rounded border-dark-secondary/50"
                      />
                      <span className="text-text-secondary">Required</span>
                    </label>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addParameter}
                className="w-full py-2 border border-dashed border-dark-secondary/50 rounded-lg
                           text-text-secondary hover:text-text-primary hover:border-accent-green/50
                           transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span className="text-sm">Add Parameter</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Responses Section */}
      <div className="border border-dark-secondary/50 rounded-lg">
        <button
          onClick={() => toggleSection('responses')}
          className="w-full px-4 py-3 flex items-center justify-between
                     hover:bg-dark-secondary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-text-secondary" />
            <span className="font-medium text-text-primary">Responses</span>
            <span className="text-xs text-text-secondary">
              ({endpoint.responses.length})
            </span>
          </div>
          {expandedSections.responses ? 
            <ChevronDown size={18} className="text-text-secondary" /> : 
            <ChevronRight size={18} className="text-text-secondary" />
          }
        </button>
        
        {expandedSections.responses && (
          <div className="p-4 border-t border-dark-secondary/30 space-y-3">
            {endpoint.responses.map((response, index) => (
              <div key={index} className="border border-dark-secondary/30 rounded-lg">
                <div className="p-3 flex items-center justify-between border-b border-dark-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-sm font-mono
                                    ${response.status < 300 ? 'bg-green-400/10 text-green-400' :
                                      response.status < 400 ? 'bg-yellow-400/10 text-yellow-400' :
                                      'bg-red-400/10 text-red-400'}`}>
                      {response.status}
                    </span>
                    <span className="text-text-secondary text-sm">
                      <EditableField 
                        value={response.description} 
                        field={`response-${index}-description`}
                      />
                    </span>
                  </div>
                  <button
                    onClick={() => removeResponse(index)}
                    className="p-1 text-text-secondary/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="p-3 relative">
                  <textarea
                    value={response.example}
                    onChange={(e) => {
                      const newResponses = [...endpoint.responses];
                      newResponses[index].example = e.target.value;
                      updateEndpoint('responses', newResponses);
                    }}
                    className="w-full px-3 py-2 bg-dark-primary/50 text-text-primary font-mono text-sm
                               border border-dark-secondary/50 rounded focus:outline-none
                               focus:border-accent-green/50 resize-y"
                    rows={6}
                  />
                  <button
                    onClick={() => handleCopy(response.example, `response-${index}`)}
                    className="absolute top-2 right-2 p-1 text-text-secondary/50 
                               hover:text-text-primary transition-colors"
                  >
                    {copiedField === `response-${index}` ? 
                      <Check size={16} className="text-accent-green" /> : 
                      <Copy size={16} />
                    }
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={addResponse}
              className="w-full py-2 border border-dashed border-dark-secondary/50 rounded-lg
                         text-text-secondary hover:text-text-primary hover:border-accent-green/50
                         transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span className="text-sm">Add Response</span>
            </button>
          </div>
        )}
      </div>

      {/* Code Examples Section */}
      <div className="border border-dark-secondary/50 rounded-lg">
        <button
          onClick={() => toggleSection('examples')}
          className="w-full px-4 py-3 flex items-center justify-between
                     hover:bg-dark-secondary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-text-secondary" />
            <span className="font-medium text-text-primary">Code Examples</span>
          </div>
          {expandedSections.examples ? 
            <ChevronDown size={18} className="text-text-secondary" /> : 
            <ChevronRight size={18} className="text-text-secondary" />
          }
        </button>
        
        {expandedSections.examples && (
          <div className="p-4 border-t border-dark-secondary/30 space-y-4">
            {/* cURL Example */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-primary">cURL</h4>
                <button
                  onClick={() => handleCopy(generateCurlExample(), 'curl')}
                  className="p-1 text-text-secondary/50 hover:text-text-primary transition-colors"
                >
                  {copiedField === 'curl' ? 
                    <Check size={16} className="text-accent-green" /> : 
                    <Copy size={16} />
                  }
                </button>
              </div>
              <pre className="p-3 bg-dark-primary/50 rounded text-sm text-text-primary font-mono overflow-x-auto">
                {generateCurlExample()}
              </pre>
            </div>

            {/* JavaScript Fetch Example */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-primary">JavaScript (Fetch)</h4>
                <button
                  onClick={() => {
                    const fetchCode = `fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  }${endpoint.requestBody ? `,
  body: JSON.stringify(${endpoint.requestBody})` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
                    handleCopy(fetchCode, 'js');
                  }}
                  className="p-1 text-text-secondary/50 hover:text-text-primary transition-colors"
                >
                  {copiedField === 'js' ? 
                    <Check size={16} className="text-accent-green" /> : 
                    <Copy size={16} />
                  }
                </button>
              </div>
              <pre className="p-3 bg-dark-primary/50 rounded text-sm text-text-primary font-mono overflow-x-auto">
{`fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  }${endpoint.requestBody ? `,
  body: JSON.stringify(${endpoint.requestBody})` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
              </pre>
            </div>

            {/* Export Options */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleCopy(generateOpenAPISpec(), 'openapi')}
                className="px-3 py-1.5 bg-dark-secondary/50 text-text-secondary text-sm rounded
                           hover:bg-dark-secondary hover:text-text-primary transition-colors
                           flex items-center gap-2"
              >
                {copiedField === 'openapi' ? 
                  <Check size={14} className="text-accent-green" /> : 
                  <FileText size={14} />
                }
                Export OpenAPI
              </button>
              <button
                onClick={() => {
                  const markdown = `## ${endpoint.title}\n\n${endpoint.description}\n\n**Endpoint:** \`${endpoint.method} ${endpoint.path}\`\n\n**Authentication:** ${AUTH_TYPES[endpoint.authentication].label}`;
                  handleCopy(markdown, 'markdown');
                }}
                className="px-3 py-1.5 bg-dark-secondary/50 text-text-secondary text-sm rounded
                           hover:bg-dark-secondary hover:text-text-primary transition-colors
                           flex items-center gap-2"
              >
                {copiedField === 'markdown' ? 
                  <Check size={14} className="text-accent-green" /> : 
                  <FileText size={14} />
                }
                Export Markdown
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}