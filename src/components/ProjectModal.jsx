import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, Palette, Type, Loader2 } from 'lucide-react';

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Focus trap ref
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Focus first input on open
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with improved blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal wrapper - positioned slightly above center */}
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        {/* Modal panel with enhanced styling */}
        <div 
          ref={modalRef}
          className="relative w-full max-w-lg transform overflow-hidden rounded-xl 
                     bg-[#161b22] shadow-2xl transition-all duration-200
                     animate-in fade-in-0 zoom-in-95 
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0 
                     data-[state=closed]:zoom-out-95"
          data-state={isOpen ? "open" : "closed"}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            boxShadow: `
              0 4px 6px -1px rgba(0, 0, 0, 0.3),
              0 10px 15px -3px rgba(0, 0, 0, 0.2),
              0 20px 25px -5px rgba(0, 0, 0, 0.1)
            `
          }}
        >
          {/* Close button - positioned absolutely */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-[#94a3b8] 
                     transition-colors hover:bg-[#1f2428] hover:text-[#e0e7ff]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="px-6 pb-6 pt-6">
            {/* Header */}
            <h2 id="modal-title" className="mb-6 text-xl font-medium text-[#e0e7ff]">
              {title}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Name */}
              <div>
                <label htmlFor="project-name" className="mb-2 block text-sm font-medium text-[#94a3b8]">
                  Project Name <span className="text-[#10b981]">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="project-name"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., E-commerce Platform"
                  className={`
                    w-full rounded-lg border bg-[#1f2428] px-4 py-3 text-[#e0e7ff] 
                    transition-colors placeholder:text-[#6b7280] 
                    hover:border-[#5a5a5a] focus:border-[#10b981] focus:outline-none 
                    focus:ring-2 focus:ring-[#10b981]/20
                    ${errors.title ? 'border-[#ef4444]' : 'border-[#44494d]'}
                  `}
                  aria-invalid={errors.title ? 'true' : 'false'}
                  aria-describedby={errors.title ? 'name-error' : undefined}
                />
                {errors.title && (
                  <p id="name-error" className="mt-2 text-sm text-[#ef4444]">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="project-description" className="mb-2 block text-sm font-medium text-[#94a3b8]">
                  Description
                  <span className="ml-2 text-xs text-[#6b7280]">(optional)</span>
                </label>
                <textarea
                  id="project-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your project..."
                  rows={3}
                  className={`
                    w-full rounded-lg border bg-[#1f2428] px-4 py-3 text-[#e0e7ff] 
                    transition-colors placeholder:text-[#6b7280] resize-none
                    hover:border-[#5a5a5a] focus:border-[#10b981] focus:outline-none 
                    focus:ring-2 focus:ring-[#10b981]/20
                    ${errors.description ? 'border-[#ef4444]' : 'border-[#44494d]'}
                  `}
                  aria-invalid={errors.description ? 'true' : 'false'}
                  aria-describedby={errors.description ? 'desc-error' : undefined}
                />
                {errors.description && (
                  <p id="desc-error" className="mt-2 text-sm text-[#ef4444]">{errors.description}</p>
                )}
              </div>

              {/* Color Picker */}
              <div>
                <label className="mb-3 block text-sm font-medium text-[#94a3b8]">
                  Project Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`
                        h-10 w-10 rounded-lg border-2 transition-all duration-150
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        focus:ring-offset-[#161b22] active:scale-95
                        ${formData.color === color 
                          ? 'border-white shadow-lg' 
                          : 'border-transparent hover:border-white/20'
                        }
                      `}
                      style={{ 
                        backgroundColor: color,
                        focusRingColor: color 
                      }}
                      aria-label={`Select color ${color}`}
                      aria-pressed={formData.color === color}
                    />
                  ))}
                </div>
              </div>

              {/* Error message */}
              {errors.submit && (
                <div className="rounded-lg bg-[#2d1b1b] border border-[#ef4444]/20 p-3">
                  <p className="text-sm text-[#ef4444]">{errors.submit}</p>
                </div>
              )}
            </form>
          </div>

          {/* Footer with actions */}
          <div className="flex justify-end gap-3 border-t border-[#2d333b] bg-[#0d1117] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#94a3b8] 
                       transition-all hover:bg-[#1f2428] hover:text-[#e0e7ff]
                       focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-[#10b981] px-4 py-2 text-sm font-medium text-white 
                       transition-all hover:bg-[#0ea570] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       focus:outline-none focus:ring-2 focus:ring-[#10b981]/20
                       flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{project ? 'Update Project' : 'Create Project'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}