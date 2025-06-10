import { useState } from 'react';

export default function CSSBoxModel({ data, onUpdate }) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const startEdit = (field, value) => {
    setEditingField(field);
    setTempValue(value.toString());
  };

  const handleUpdate = (path, value) => {
    const newData = { ...data };
    const keys = path.split('.');
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = parseInt(value) || 0;
    onUpdate(newData);
    setEditingField(null);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      handleUpdate(field, tempValue);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setTempValue('');
    }
  };

  // Calculate dimensions
  const margin = data.margin;
  const border = data.border;
  const padding = data.padding;
  const content = data.content;
  
  const totalWidth = margin.left + margin.right + border.left + border.right + 
                     padding.left + padding.right + content.width;
  const totalHeight = margin.top + margin.bottom + border.top + border.bottom + 
                      padding.top + padding.bottom + content.height;

  // Visual scale factor to fit in reasonable space
  const scale = Math.min(1, 400 / Math.max(totalWidth, totalHeight));

  return (
    <div className="relative">
      {/* Visual Box Model */}
      <div className="flex justify-center mb-8">
        <div 
          className="relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            width: totalWidth,
            height: totalHeight
          }}
        >
          {/* Margin layer */}
          <div 
            className="absolute inset-0 border-2 border-dashed border-orange-500/30
                       transition-all duration-200 hover:border-orange-500/50
                       hover:bg-orange-500/5"
            style={{
              width: totalWidth,
              height: totalHeight
            }}
          >
            {/* Margin labels */}
            <EditableLabel
              value={margin.top}
              field="margin.top"
              unit={data.unit}
              position="top"
              color="orange"
              editingField={editingField}
              tempValue={tempValue}
              onEdit={startEdit}
              onUpdate={handleUpdate}
              onKeyDown={handleKeyDown}
              setTempValue={setTempValue}
            />
            <EditableLabel
              value={margin.right}
              field="margin.right"
              unit={data.unit}
              position="right"
              color="orange"
              editingField={editingField}
              tempValue={tempValue}
              onEdit={startEdit}
              onUpdate={handleUpdate}
              onKeyDown={handleKeyDown}
              setTempValue={setTempValue}
            />
            <EditableLabel
              value={margin.bottom}
              field="margin.bottom"
              unit={data.unit}
              position="bottom"
              color="orange"
              editingField={editingField}
              tempValue={tempValue}
              onEdit={startEdit}
              onUpdate={handleUpdate}
              onKeyDown={handleKeyDown}
              setTempValue={setTempValue}
            />
            <EditableLabel
              value={margin.left}
              field="margin.left"
              unit={data.unit}
              position="left"
              color="orange"
              editingField={editingField}
              tempValue={tempValue}
              onEdit={startEdit}
              onUpdate={handleUpdate}
              onKeyDown={handleKeyDown}
              setTempValue={setTempValue}
            />
          </div>

          {/* Border layer */}
          <div 
            className="absolute border-2 border-yellow-500/50 bg-yellow-500/10
                       transition-all duration-200 hover:border-yellow-500/70
                       hover:bg-yellow-500/15"
            style={{
              top: margin.top,
              left: margin.left,
              width: totalWidth - margin.left - margin.right,
              height: totalHeight - margin.top - margin.bottom
            }}
          >
            {/* Border labels */}
            <EditableLabel
              value={border.top}
              field="border.top"
              unit={data.unit}
              position="top"
              color="yellow"
              offset={margin.top}
              editingField={editingField}
              tempValue={tempValue}
              onEdit={startEdit}
              onUpdate={handleUpdate}
              onKeyDown={handleKeyDown}
              setTempValue={setTempValue}
            />
          </div>

          {/* Padding layer */}
          <div 
            className="absolute border-2 border-green-500/50 bg-green-500/10
                       transition-all duration-200 hover:border-green-500/70
                       hover:bg-green-500/15"
            style={{
              top: margin.top + border.top,
              left: margin.left + border.left,
              width: totalWidth - margin.left - margin.right - border.left - border.right,
              height: totalHeight - margin.top - margin.bottom - border.top - border.bottom
            }}
          >
            {/* Padding labels */}
            <EditableLabel
              value={padding.top}
              field="padding.top"
              unit={data.unit}
              position="top"
              color="green"
              offset={margin.top + border.top}
              editingField={editingField}
              tempValue={tempValue}
              onEdit={startEdit}
              onUpdate={handleUpdate}
              onKeyDown={handleKeyDown}
              setTempValue={setTempValue}
            />
          </div>

          {/* Content layer */}
          <div 
            className="absolute border-2 border-blue-500/50 bg-blue-500/10 
                       flex items-center justify-center
                       transition-all duration-200 hover:border-blue-500/70
                       hover:bg-blue-500/15 group"
            style={{
              top: margin.top + border.top + padding.top,
              left: margin.left + border.left + padding.left,
              width: content.width,
              height: content.height
            }}
          >
            {editingField === 'content.text' ? (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => {
                  const newData = { ...data };
                  newData.content.text = tempValue;
                  onUpdate(newData);
                  setEditingField(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newData = { ...data };
                    newData.content.text = tempValue;
                    onUpdate(newData);
                    setEditingField(null);
                  } else if (e.key === 'Escape') {
                    setEditingField(null);
                  }
                }}
                className="bg-blue-500/20 backdrop-blur-sm text-center text-blue-400 
                           font-medium focus:outline-none w-full rounded px-2 py-1
                           border border-blue-500/50"
                autoFocus
              />
            ) : (
              <button
                onClick={() => startEdit('content.text', content.text)}
                className="text-blue-500 font-medium px-3 py-1 rounded
                           hover:bg-blue-500/20 hover:text-blue-400
                           transition-all duration-150"
              >
                {content.text}
              </button>
            )}
            
            {/* Content dimensions - enhanced visibility */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2
                            flex items-center gap-2">
              <button
                onClick={() => startEdit('content.width', content.width)}
                className="text-xs text-text-secondary/50 hover:text-text-secondary
                           bg-dark-primary/60 hover:bg-dark-primary/80 
                           px-2 py-0.5 rounded transition-all duration-150
                           font-mono hover:scale-105"
              >
                {editingField === 'content.width' ? (
                  <input
                    type="number"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleUpdate('content.width', tempValue)}
                    onKeyDown={(e) => handleKeyDown(e, 'content.width')}
                    className="w-12 bg-transparent text-center focus:outline-none"
                    autoFocus
                  />
                ) : content.width}
              </button>
              <span className="text-text-secondary/30">×</span>
              <button
                onClick={() => startEdit('content.height', content.height)}
                className="text-xs text-text-secondary/50 hover:text-text-secondary
                           bg-dark-primary/60 hover:bg-dark-primary/80 
                           px-2 py-0.5 rounded transition-all duration-150
                           font-mono hover:scale-105"
              >
                {editingField === 'content.height' ? (
                  <input
                    type="number"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleUpdate('content.height', tempValue)}
                    onKeyDown={(e) => handleKeyDown(e, 'content.height')}
                    className="w-12 bg-transparent text-center focus:outline-none"
                    autoFocus
                  />
                ) : content.height}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs mt-8">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-3 h-3 border border-dashed border-orange-500/30 
                          group-hover:border-orange-500/50 transition-colors"></div>
          <span className="text-text-secondary/60 group-hover:text-text-secondary
                           transition-colors">margin</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-3 h-3 bg-yellow-500/10 border border-yellow-500/50
                          group-hover:bg-yellow-500/15 group-hover:border-yellow-500/70
                          transition-colors"></div>
          <span className="text-text-secondary/60 group-hover:text-text-secondary
                           transition-colors">border</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-3 h-3 bg-green-500/10 border border-green-500/50
                          group-hover:bg-green-500/15 group-hover:border-green-500/70
                          transition-colors"></div>
          <span className="text-text-secondary/60 group-hover:text-text-secondary
                           transition-colors">padding</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-3 h-3 bg-blue-500/10 border border-blue-500/50
                          group-hover:bg-blue-500/15 group-hover:border-blue-500/70
                          transition-colors"></div>
          <span className="text-text-secondary/60 group-hover:text-text-secondary
                           transition-colors">content</span>
        </div>
      </div>

      {/* Quick controls */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <div className="relative">
          <button
            onClick={() => {
              const newData = { ...data, unit: data.unit === 'px' ? 'rem' : 'px' };
              onUpdate(newData);
            }}
            className="text-xs px-4 py-1.5 
                       bg-dark-secondary/30 hover:bg-dark-secondary/50
                       border border-dark-secondary/50 hover:border-accent-green/50 
                       rounded-full hover:text-accent-green
                       transition-all duration-150 font-mono
                       hover:scale-105"
          >
            {data.unit}
          </button>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2
                          text-[10px] text-text-secondary/40 whitespace-nowrap">
            click to toggle
          </div>
        </div>
      </div>
    </div>
  );
}

// Editable label component
function EditableLabel({ 
  value, field, unit, position, color, offset = 0,
  editingField, tempValue, onEdit, onUpdate, onKeyDown, setTempValue 
}) {
  const isEditing = editingField === field;
  
  const colorClasses = {
    orange: 'text-orange-500/70',
    yellow: 'text-yellow-500/70',
    green: 'text-green-500/70',
    blue: 'text-blue-500/70'
  };

  const editingColorClasses = {
    orange: 'text-orange-400 bg-orange-500/20 border-orange-500/50',
    yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50',
    green: 'text-green-400 bg-green-500/20 border-green-500/50',
    blue: 'text-blue-400 bg-blue-500/20 border-blue-500/50'
  };

  const positionStyles = {
    top: { top: '-20px', left: '50%', transform: 'translateX(-50%)' },
    right: { right: '-20px', top: '50%', transform: 'translateY(-50%)' },
    bottom: { bottom: '-20px', left: '50%', transform: 'translateX(-50%)' },
    left: { left: '-20px', top: '50%', transform: 'translateY(-50%)' }
  };

  return (
    <div 
      className={`absolute text-xs font-medium transition-all duration-200
                  ${isEditing ? 'z-10' : 'z-0'}`}
      style={positionStyles[position]}
    >
      {isEditing ? (
        <div className={`relative ${editingColorClasses[color]} 
                        rounded px-2 py-1 border backdrop-blur-sm
                        shadow-lg animate-in fade-in slide-in-from-bottom-1`}>
          <input
            type="number"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => onUpdate(field, tempValue)}
            onKeyDown={(e) => onKeyDown(e, field)}
            className="w-14 bg-transparent text-center font-mono
                       focus:outline-none placeholder-current/50"
            placeholder={value}
            autoFocus
          />
          <span className="opacity-70">{unit}</span>
        </div>
      ) : (
        <button
          onClick={() => onEdit(field, value)}
          className={`${colorClasses[color]} hover:text-white
                     bg-dark-primary/60 hover:bg-dark-primary/80
                     backdrop-blur-sm px-2 py-0.5 rounded
                     transition-all duration-150 hover:scale-105
                     font-mono border border-transparent
                     hover:border-current/20`}
        >
          {value}{unit}
        </button>
      )}
    </div>
  );
}