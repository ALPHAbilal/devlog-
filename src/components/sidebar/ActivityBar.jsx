import { Search, FolderTree, Clock, Star, Inbox, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export const ACTIVITY_VIEWS = {
  SEARCH: 'search',
  EXPLORER: 'explorer',
  RECENT: 'recent',
  FAVORITES: 'favorites',
  INBOX: 'inbox',
};

const activities = [
  { id: ACTIVITY_VIEWS.SEARCH, icon: Search, label: 'Search', color: 'text-purple-400' },
  { id: ACTIVITY_VIEWS.EXPLORER, icon: FolderTree, label: 'Explorer', color: 'text-blue-400' },
  { id: ACTIVITY_VIEWS.RECENT, icon: Clock, label: 'Recent', color: 'text-emerald-400' },
  { id: ACTIVITY_VIEWS.FAVORITES, icon: Star, label: 'Favorites', color: 'text-amber-400' },
  { id: ACTIVITY_VIEWS.INBOX, icon: Inbox, label: 'Inbox', color: 'text-cyan-400' },
];

export function ActivityBar({ activeView, onViewChange, onSettingsClick }) {
  return (
    <div className="w-12 h-full bg-[#0a0a0a] flex flex-col items-center">
      {/* Activity Icons */}
      <div className="flex-1 pt-12 pb-2 space-y-1">
        <TooltipProvider>
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const isActive = activeView === activity.id;

            return (
              <Tooltip key={activity.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => onViewChange(activity.id)}
                    className={`
                      w-full h-10 flex items-center justify-center relative
                      transition-colors duration-200
                      ${isActive ? '' : 'hover:bg-white/5'}
                    `}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <Icon className={`
                      w-5 h-5 transition-all duration-200
                      ${isActive ? 'text-white/70' : 'text-white/40 hover:text-white/60'}
                    `} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-white/90 text-sm font-medium">{activity.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Settings at bottom */}
      <div className="py-2">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={onSettingsClick}
                className="w-full h-10 flex items-center justify-center hover:bg-white/5 transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-white/40 hover:text-white/70 transition-colors duration-200" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-white/90 text-sm font-medium">Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
