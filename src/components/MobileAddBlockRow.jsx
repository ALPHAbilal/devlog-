import { useState, useEffect } from 'react';
import { Type, Code, MessageSquare, Heading, Folder, Table, Image, AlertCircle, X } from 'lucide-react';
import MobileBottomSheet from './MobileBottomSheet';

const blockTypes = [
  { type: 'text', label: 'Text', icon: Type, description: 'Regular text with markdown' },
  { type: 'heading', label: 'Heading', icon: Heading, description: 'Section header' },
  { type: 'code', label: 'Code', icon: Code, description: 'Syntax highlighted code' },
  { type: 'image', label: 'Image', icon: Image, description: 'Images and screenshots' },
  { type: 'table', label: 'Table', icon: Table, description: 'Data in rows and columns' },
  { type: 'ai', label: 'AI Chat', icon: MessageSquare, description: 'AI conversation' },
  { type: 'filetree', label: 'File Tree', icon: Folder, description: 'Project structure' },
  { type: 'issue-tracker', label: 'Issues', icon: AlertCircle, description: 'Track problems & solutions' },
];

export default function MobileAddBlockRow({ onSelect, onClose, show }) {
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    if (!show) {
      setSelectedType(null);
    }
  }, [show]);

  const handleSelect = (type) => {
    setSelectedType(type);
    // Add haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    
    // Small delay for visual feedback
    setTimeout(() => {
      onSelect(type);
      onClose();
    }, 150);
  };

  return (
    <MobileBottomSheet
      isOpen={show}
      onClose={onClose}
      title="Add Block"
      height="auto"
    >
      <div className="px-4 pb-6">
        {/* Grid layout - 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {blockTypes.map((blockType) => {
            const Icon = blockType.icon;
            const isSelected = selectedType === blockType.type;
            
            return (
              <button
                key={blockType.type}
                onClick={() => handleSelect(blockType.type)}
                className={`relative p-4 rounded-xl border transition-all duration-200
                          ${isSelected 
                            ? 'bg-accent-green/10 border-accent-green/50 scale-95' 
                            : 'bg-dark-secondary/50 border-dark-secondary/50 active:scale-95'
                          }
                          hover:bg-dark-secondary/70`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-lg transition-colors
                                ${isSelected 
                                  ? 'bg-accent-green/20 text-accent-green' 
                                  : 'bg-dark-primary/50 text-text-secondary'}`}>
                    <Icon size={24} />
                  </div>
                  <div className="text-center">
                    <div className={`font-medium text-sm
                                  ${isSelected ? 'text-accent-green' : 'text-text-primary'}`}>
                      {blockType.label}
                    </div>
                    <div className="text-xs text-text-secondary/60 mt-0.5 leading-tight">
                      {blockType.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick tip */}
        <div className="mt-4 p-3 bg-dark-secondary/30 rounded-lg">
          <p className="text-xs text-text-secondary text-center">
            Tip: Tap + between any blocks to add content exactly where you need it
          </p>
        </div>
      </div>
    </MobileBottomSheet>
  );
}