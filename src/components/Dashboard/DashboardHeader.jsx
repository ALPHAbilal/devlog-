import { Search, Plus, Settings, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardHeader({
  entries = [],
  searchTerm = '',
  onSearchChange,
  searchBarRef,
  user,
  showProfileMenu,
  setShowProfileMenu,
  onSignOut,
  onCreateNew,
  onToggleMobileSidebar,
  isMobile
}) {
  const navigate = useNavigate();

  return (
    <div className="relative z-50 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 p-6 flex-shrink-0">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={onToggleMobileSidebar}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-white/90" />
            </button>
          )}

          {/* Status indicator and document count */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
            <h1 className="text-white/90">
              All Documents <span className="text-white/40">({entries.length})</span>
            </h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* New Button */}
          <button
            onClick={onCreateNew}
            className="hidden md:flex items-center gap-2 h-9 px-4 bg-white/5 hover:bg-emerald-500/10 text-white/70 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 transition-all rounded-lg"
          >
            <Plus className="w-4 h-4" />
            New
          </button>

          {/* Profile Menu */}
          <div className="relative profile-menu-container">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-9 w-9 rounded-lg p-0 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center"
            >
              <div className="h-6 w-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'D'}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-[#1a2942]/95 backdrop-blur-xl border-white/10 border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm leading-none text-white/90">
                    {user?.user_metadata?.full_name || 'Developer'}
                  </p>
                  <p className="text-xs leading-none text-white/50 mt-1">
                    {user?.email || 'developer@devlog.app'}
                  </p>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-white/70 hover:text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white/90 rounded transition-colors text-sm cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  <button
                    onClick={onSignOut}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 rounded transition-colors text-sm cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar - Full Width */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          ref={searchBarRef}
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
        />
      </div>
    </div>
  );
}
