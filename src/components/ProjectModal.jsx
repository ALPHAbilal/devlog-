import React, { useState, useEffect } from 'react';
import { X, Folder, Palette, Type } from 'lucide-react';

const PROJECT_COLORS = [
  '#10b981', // accent-green (default)
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#14b8a6', // teal
  '#84cc16', // lime
];

const PROJECT_ICONS = [
  'folder',
  'folder-open',
  'folder-plus',
  'folder-minus',
  'folder-x',
  'folder-check',
  'folder-search',
  'folder-heart'
];

export default function ProjectModal({ 
  isOpen, 
  onClose, 
  onSave, 
  project = null,
  title = 'Create New Project' 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#10b981',
    icon: 'folder'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        color: project.color || '#10b981',
        icon: project.icon || 'folder'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        color: '#10b981',
        icon: 'folder'
      });
    }
    setErrors({});
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Project name is required';
    }
    if (formData.title.length > 100) {
      newErrors.title = 'Project name must be less than 100 characters';
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim()
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-secondary rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-primary flex items-center space-x-2">
            <Folder size={24} style={{ color: formData.color }} />
            <span>{title}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-primary/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
              <Type size={16} />
              <span>Project Name</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., E-commerce Platform"
              className={`
                w-full px-4 py-2 bg-dark-primary border rounded-lg
                text-primary placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-accent-green/50
                ${errors.title ? 'border-red-500' : 'border-gray-700'}
              `}
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your project..."
              rows={3}
              className={`
                w-full px-4 py-2 bg-dark-primary border rounded-lg
                text-primary placeholder-gray-500 resize-none
                focus:outline-none focus:ring-2 focus:ring-accent-green/50
                ${errors.description ? 'border-red-500' : 'border-gray-700'}
              `}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-3">
              <Palette size={16} />
              <span>Project Color</span>
            </label>
            <div className="flex space-x-2">
              {PROJECT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`
                    w-10 h-10 rounded-lg border-2 transition-all
                    ${formData.color === color 
                      ? 'border-white scale-110' 
                      : 'border-transparent hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-primary hover:bg-dark-primary/80 
                       text-gray-300 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent-green hover:bg-accent-green/80 
                       text-white font-medium rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}