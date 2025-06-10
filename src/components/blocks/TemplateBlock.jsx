import { useState } from 'react';
import { Package } from 'lucide-react';

// Template components
import CSSBoxModel from './templates/CSSBoxModel';
import PayloadTemplate from './templates/PayloadTemplate';
import TracebackAnalyzer from './templates/TracebackAnalyzer';
import GitCommandComposer from './templates/GitCommandComposer';

const templates = {
  'css-box-model': {
    name: 'CSS Box Model',
    description: 'Visual box model with customizable margins, borders, and padding',
    component: CSSBoxModel,
    defaultData: {
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      border: { top: 5, right: 5, bottom: 5, left: 5 },
      padding: { top: 15, right: 15, bottom: 15, left: 15 },
      content: { width: 200, height: 100, text: 'Content' },
      unit: 'px'
    }
  },
  'payload': {
    name: 'API Payload',
    description: 'API request builder with headers, methods, and JSON validation',
    component: PayloadTemplate,
    defaultData: {
      method: 'POST',
      endpoint: 'https://api.example.com/endpoint',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
      },
      payload: JSON.stringify({
        key: 'value',
        nested: {
          property: 'example'
        }
      }, null, 2)
    }
  },
  'traceback': {
    name: 'Python Traceback',
    description: 'Interactive Python error analyzer with frame inspection',
    component: TracebackAnalyzer,
    defaultData: {
      rawTraceback: '',
      parsed: false,
      frames: [],
      errorType: '',
      errorMessage: '',
      status: 'analyzing',
      solution: ''
    }
  },
  'git-commands': {
    name: 'Git Commands',
    description: 'Scenario-based Git command builder with safety warnings',
    component: GitCommandComposer,
    defaultData: {
      currentScenario: null,
      history: [],
      savedPlaceholders: {}
    }
  }
  // More templates can be added here
};

export default function TemplateBlock({ block, onUpdate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(block.template || null);
  const [templateData, setTemplateData] = useState(block.data || {});

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    setTemplateData(templates[templateKey].defaultData);
    onUpdate({ 
      template: templateKey, 
      data: templates[templateKey].defaultData 
    });
  };

  const handleDataUpdate = (newData) => {
    setTemplateData(newData);
    onUpdate({ data: newData });
  };

  // If no template selected, show template selector
  if (!selectedTemplate) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 text-text-secondary mb-6">
          <Package size={18} />
          <span className="text-sm font-medium">Choose a Template</span>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleTemplateSelect(key)}
              className="p-6 border border-dashed border-dark-secondary/50 rounded-lg
                         hover:border-accent-green/50 hover:bg-dark-secondary/10
                         transition-all text-left group"
            >
              <h3 className="text-text-primary font-medium mb-2 
                             group-hover:text-accent-green transition-colors">
                {template.name}
              </h3>
              <p className="text-text-secondary text-sm">
                {template.description || 'Interactive visual template'}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render selected template
  const TemplateComponent = templates[selectedTemplate].component;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <Package size={18} />
          <span className="text-sm font-medium">{templates[selectedTemplate].name}</span>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            onUpdate({ template: null, data: {} });
          }}
          className="text-xs text-text-secondary/50 hover:text-text-primary
                     transition-colors"
        >
          Change template
        </button>
      </div>
      
      <TemplateComponent 
        data={templateData}
        onUpdate={handleDataUpdate}
      />
    </div>
  );
}