import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrialBanner({ trialStatus }) {
  const navigate = useNavigate();
  
  // Don't show banner if no trial status or if user has active subscription (not trial)
  if (!trialStatus || !trialStatus.is_trial || !trialStatus.is_active) {
    return null;
  }

  const { days_remaining, hours_remaining } = trialStatus;
  
  // Determine urgency level for styling
  const isUrgent = days_remaining <= 3;
  const isVeryUrgent = days_remaining <= 1;
  
  // Format the remaining time message
  const getTimeMessage = () => {
    if (days_remaining === 0 && hours_remaining > 0) {
      return `${hours_remaining} ${hours_remaining === 1 ? 'hour' : 'hours'} left`;
    } else if (days_remaining === 1) {
      return '1 day left';
    } else {
      return `${days_remaining} days left`;
    }
  };

  const bannerClasses = isVeryUrgent
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : isUrgent
    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    : 'bg-accent-green/20 text-accent-green border-accent-green/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-0 left-0 right-0 z-40 border-b ${bannerClasses}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isVeryUrgent ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Clock size={18} />
              </motion.div>
            ) : (
              <Clock size={18} />
            )}
            <span className="font-medium">
              Free trial: {getTimeMessage()}
            </span>
          </div>
          
          {!isVeryUrgent && (
            <span className="text-sm opacity-80">
              in your 14-day trial
            </span>
          )}
        </div>

        <button
          onClick={() => navigate('/upgrade')}
          className={`flex items-center gap-2 px-4 py-1 rounded-md font-medium text-sm
                     transition-all hover:scale-105 ${
                       isVeryUrgent
                         ? 'bg-red-500 text-white hover:bg-red-600'
                         : isUrgent
                         ? 'bg-orange-500 text-white hover:bg-orange-600'
                         : 'bg-accent-green text-dark-primary hover:bg-accent-green/90'
                     }`}
        >
          <Zap size={16} />
          <span>Upgrade Now</span>
        </button>
      </div>
    </motion.div>
  );
}