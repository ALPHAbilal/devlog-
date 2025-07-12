import { useState, useEffect } from 'react';
import { Check, User } from 'lucide-react';

const testimonials = [
  { name: "Sarah K.", company: "Netflix", message: "Found my WebSocket fix from 6 months ago!" },
  { name: "Mike D.", company: "Stripe", message: "Saved 3 hours debugging with my old solutions" },
  { name: "Lisa C.", company: "GitHub", message: "My regex collection is finally organized!" },
  { name: "James W.", company: "Meta", message: "Never losing another algorithm solution" },
  { name: "Emma R.", company: "Google", message: "The AI chat preservation is a game changer" },
];

const actions = [
  { user: "Alex from Berlin", action: "just saved a React optimization pattern" },
  { user: "Maria from SF", action: "found their Docker config from last year" },
  { user: "Tom from London", action: "organized 150+ code snippets" },
  { user: "Chen from Tokyo", action: "connected their debugging notes" },
  { user: "Sophie from Paris", action: "saved an AI solution for Redux" },
];

export default function SocialProofNotifications({ isActive }) {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [notificationQueue, setNotificationQueue] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    // Show initial notification after 5 seconds
    const initialTimer = setTimeout(() => {
      showRandomNotification();
    }, 5000);

    // Then show notifications every 15-20 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        showRandomNotification();
      }
    }, 15000 + Math.random() * 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isActive]);

  const showRandomNotification = () => {
    const isTestimonial = Math.random() > 0.5;
    const notification = isTestimonial
      ? testimonials[Math.floor(Math.random() * testimonials.length)]
      : actions[Math.floor(Math.random() * actions.length)];

    setCurrentNotification({ ...notification, id: Date.now(), type: isTestimonial ? 'testimonial' : 'action' });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setCurrentNotification(null);
    }, 5000);
  };

  if (!currentNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-slideUp">
      {currentNotification.type === 'testimonial' ? (
        <div className="bg-dark-secondary border border-accent-green/30 rounded-lg p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-accent-green/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-accent-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-text-primary">{currentNotification.name}</span>
                <span className="text-xs text-text-secondary">• {currentNotification.company}</span>
              </div>
              <p className="text-sm text-text-secondary italic">"{currentNotification.message}"</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-dark-secondary/90 backdrop-blur border border-dark-secondary rounded-lg px-4 py-3 shadow-lg
                        flex items-center gap-3">
          <Check size={16} className="text-accent-green flex-shrink-0" />
          <p className="text-sm">
            <span className="text-text-primary font-medium">{currentNotification.user}</span>
            <span className="text-text-secondary"> {currentNotification.action}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// Add this animation to your CSS
const styles = `
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 0.5s ease-out;
}
`;