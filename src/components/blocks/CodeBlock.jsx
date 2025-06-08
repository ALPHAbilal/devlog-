import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ block, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(block.content || '');
  const [language, setLanguage] = useState(block.language || 'javascript');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate({ content: code, language });
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(block.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-dark-secondary text-text-primary px-3 py-1 rounded text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="jsx">JSX</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="bash">Bash</option>
          <option value="json">JSON</option>
        </select>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={handleSave}
          className="w-full bg-dark-primary text-text-primary p-4 rounded-lg
                     font-mono text-sm resize-y min-h-[100px]
                     focus:outline-none focus:ring-2 focus:ring-accent-green"
          placeholder="// Enter your code here..."
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="text-text-secondary text-xs">{block.language || 'javascript'}</span>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-dark-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check size={16} className="text-accent-green" />
          ) : (
            <Copy size={16} className="text-text-secondary" />
          )}
        </button>
      </div>
      <pre 
        onClick={() => setIsEditing(true)}
        className="bg-dark-primary text-text-primary p-4 rounded-lg overflow-x-auto
                   cursor-text hover:ring-1 hover:ring-dark-secondary transition-all"
      >
        <code className="font-mono text-sm">
          {block.content || '// Click to add code...'}
        </code>
      </pre>
    </div>
  );
}