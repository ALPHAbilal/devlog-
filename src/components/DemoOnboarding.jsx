import { useState, useEffect } from 'react';
import { X, ChevronRight, Sparkles, Search, Plus, Edit3, Check } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    target: '.demo-container',
    title: 'Welcome to Your Second Brain! 🧠',
    content: 'This is exactly how DevLog works. You can edit, search, and organize everything.',
    placement: 'center',
    action: 'Got it!',
    icon: <Sparkles />
  },
  {
    id: 'edit',
    target: '.demo-block-content',
    title: 'Everything is Editable',
    content: 'Click on any text block to edit it. Try changing "My Development Solutions" to your name!',
    placement: 'top',
    action: 'Next',
    icon: <Edit3 />,
    highlight: true
  },
  {
    id: 'add',
    target: '.demo-add-block-button',
    title: 'Add Your Own Content',
    content: 'Click the + button to add code snippets, notes, or AI conversations',
    placement: 'left',
    action: 'Cool!',
    icon: <Plus />,
    highlight: true
  },
  {
    id: 'search',
    target: '.demo-guidance',
    title: 'Instant Search Everything',
    content: 'All your content is instantly searchable. Never lose a solution again!',
    placement: 'bottom',
    action: 'Show me more',
    icon: <Search />
  },
  {
    id: 'complete',
    target: '.demo-container',
    title: 'You\'re Ready to Roll! 🎉',
    content: 'Start building your knowledge base now. Your future self will thank you!',
    placement: 'center',
    action: 'Start My Free Trial',
    icon: <Check />,
    isLast: true
  }
];

export default function DemoOnboarding({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (currentStep < steps.length) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [currentStep]);

  const updatePosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    const target = document.querySelector(step.target);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const placement = step.placement;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'center':
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
        break;
      case 'top':
        top = rect.top - 20;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 20;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 20;
        break;
    }

    setPosition({ top, left });
  };

  const handleNext = () => {
    const step = steps[currentStep];
    if (step.isLast) {
      onComplete();
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible || currentStep >= steps.length) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip}>
        {step.highlight && (
          <div
            className="absolute border-2 border-accent-green rounded-lg pointer-events-none"
            style={{
              ...getHighlightPosition(step.target),
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className={`fixed z-50 bg-dark-secondary border border-accent-green/30 rounded-lg p-4 max-w-sm shadow-2xl
                    transform -translate-x-1/2 -translate-y-1/2 demo-tooltip-${step.placement}`}
        style={{
          top: position.top + 'px',
          left: position.left + 'px',
          animation: 'fadeInScale 0.3s ease-out'
        }}
      >
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="text-accent-green">{step.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">{step.title}</h3>
            <p className="text-sm text-text-secondary">{step.content}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentStep ? 'bg-accent-green' : 'bg-dark-primary'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-all
                       ${step.isLast 
                         ? 'bg-accent-green text-dark-primary hover:bg-accent-green/80' 
                         : 'bg-dark-primary text-text-primary hover:bg-dark-primary/80'}`}
          >
            {step.action}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

function getHighlightPosition(selector) {
  const element = document.querySelector(selector);
  if (!element) return { top: 0, left: 0, width: 0, height: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16
  };
}