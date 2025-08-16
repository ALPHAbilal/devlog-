import { Twitter } from 'lucide-react';

export default function DeveloperTestimonial({ name, handle, company, message, className = '' }) {
  return (
    <div className={`bg-dark-secondary/50 border border-dark-secondary rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Twitter size={16} className="text-text-secondary mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-text-primary">{name}</span>
            <span className="text-sm text-text-secondary">@{handle}</span>
            {company && (
              <>
                <span className="text-text-secondary">•</span>
                <span className="text-sm text-accent-green">{company}</span>
              </>
            )}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            "{message}"
          </p>
        </div>
      </div>
    </div>
  );
}

// Export some sample testimonials for use throughout the page
export const testimonials = [
  {
    name: 'Sarah Chen',
    handle: 'sarahcodes',
    company: 'Stripe',
    message: 'Found my WebSocket reconnection logic from 6 months ago in literally 2 seconds. This tool is magic.'
  },
  {
    name: 'Mike Rodriguez',
    handle: 'mikedev',
    company: 'Vercel',
    message: 'DevLog saved me from rewriting the same Docker multi-stage build config for the 5th time. Game changer.'
  },
  {
    name: 'Lisa Kumar',
    handle: 'lisa_builds',
    company: 'GitHub',
    message: 'The way it connects related solutions is incredible. Found a race condition fix I forgot I even wrote.'
  },
  {
    name: 'Tom Anderson',
    handle: 'debugging_tom',
    company: null,
    message: 'Switched from scattered markdown files. Now everything is connected and searchable. Why didn\'t this exist before?'
  }
];