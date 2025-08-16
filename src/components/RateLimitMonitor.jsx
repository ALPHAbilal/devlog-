import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { rateLimiter } from '../utils/rateLimiter';

export default function RateLimitMonitor() {
  const [status, setStatus] = useState({
    allowed: true,
    ip_requests: 0,
    user_requests: 0,
    ip_limit: 20,
    user_limit: 100
  });
  const [lastCheck, setLastCheck] = useState(new Date());

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await rateLimiter.checkRateLimit('global');
        setStatus(result);
        setLastCheck(new Date());
      } catch (error) {
        // If rate limited, show the error state
        setStatus({
          allowed: false,
          reason: error.reason,
          retry_after: error.retryAfter
        });
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 10 seconds
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const getUsagePercentage = () => {
    if (!status.allowed) return 100;
    const limit = status.user_limit || status.ip_limit;
    const requests = status.user_requests || status.ip_requests || 0;
    return Math.round((requests / limit) * 100);
  };

  const getStatusColor = () => {
    const percentage = getUsagePercentage();
    if (!status.allowed) return 'text-red-500';
    if (percentage > 80) return 'text-orange-500';
    if (percentage > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!status.allowed) return <AlertTriangle className="w-5 h-5" />;
    const percentage = getUsagePercentage();
    if (percentage > 80) return <AlertTriangle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-dark-secondary/90 backdrop-blur-sm 
                    border border-dark-secondary/50 rounded-lg p-4 shadow-lg 
                    max-w-xs z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Users className="w-4 h-4" />
          Rate Limit Status
        </h3>
        <div className={`flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-xs font-medium">
            {status.allowed ? `${getUsagePercentage()}%` : 'Limited'}
          </span>
        </div>
      </div>

      {status.allowed ? (
        <>
          <div className="space-y-1 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>Requests:</span>
              <span className="font-mono">
                {status.user_requests || status.ip_requests || 0} / {status.user_limit || status.ip_limit}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Resets in:</span>
              <span className="font-mono">~60s</span>
            </div>
          </div>

          <div className="mt-2 bg-dark-primary/50 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                getUsagePercentage() > 80 ? 'bg-orange-500' :
                getUsagePercentage() > 60 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${getUsagePercentage()}%` }}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2 text-xs">
          <p className="text-red-400">
            Rate limit exceeded. Try again in {status.retry_after || 60} seconds.
          </p>
          <div className="flex items-center gap-1 text-text-secondary">
            <Clock className="w-3 h-3" />
            <span>Last check: {lastCheck.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-dark-secondary/50 text-xs text-text-secondary/70">
        {status.user_limit ? 'Authenticated' : 'Anonymous'} limits apply
      </div>
    </div>
  );
}