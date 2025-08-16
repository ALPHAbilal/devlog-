/**
 * ShareAnalytics Component
 * 
 * Visual analytics dashboard for share statistics
 */

import { useState, useEffect } from 'react';
import { 
  BarChart, TrendingUp, Users, Eye, Clock, 
  Calendar, Globe, Activity, PieChart
} from 'lucide-react';
import { shareService } from '../services/shareService';

export function ShareAnalytics({ shareId, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [shareId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await shareService.getShareAnalytics(shareId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-2 text-text-secondary">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-text-secondary">
        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No analytics data available</p>
      </div>
    );
  }

  // Calculate additional metrics
  const engagementRate = analytics.totalViews > 0 
    ? ((analytics.actionBreakdown.comment || 0) + (analytics.actionBreakdown.edit || 0)) / analytics.totalViews * 100
    : 0;

  const viewsPerUser = analytics.uniqueViewers > 0
    ? (analytics.totalViews / analytics.uniqueViewers).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Share Analytics
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 bg-dark-primary border border-dark-lighter/50 
                   rounded-lg text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="1d">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Eye}
          label="Total Views"
          value={analytics.totalViews}
          color="blue"
        />
        <MetricCard
          icon={Users}
          label="Unique Viewers"
          value={analytics.uniqueViewers}
          color="green"
        />
        <MetricCard
          icon={TrendingUp}
          label="Views/User"
          value={viewsPerUser}
          color="purple"
        />
        <MetricCard
          icon={Activity}
          label="Engagement"
          value={`${engagementRate.toFixed(0)}%`}
          color="orange"
        />
      </div>

      {/* Action Breakdown */}
      {Object.keys(analytics.actionBreakdown).length > 0 && (
        <div className="bg-dark-primary rounded-lg p-4">
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Action Breakdown
          </h4>
          <div className="space-y-2">
            {Object.entries(analytics.actionBreakdown).map(([action, count]) => {
              const percentage = (count / analytics.totalViews * 100).toFixed(0);
              return (
                <div key={action} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary capitalize w-20">
                    {action}
                  </span>
                  <div className="flex-1 bg-dark-secondary rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        action === 'view' ? 'bg-blue-500' :
                        action === 'comment' ? 'bg-purple-500' :
                        action === 'edit' ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-text-primary w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Timeline */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="bg-dark-primary rounded-lg p-4">
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-2 border-l-2 border-dark-lighter pl-3
                         hover:border-blue-500 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.action === 'view' ? 'bg-blue-400' :
                  activity.action === 'comment' ? 'bg-purple-400' :
                  activity.action === 'edit' ? 'bg-orange-400' :
                  'bg-green-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-primary font-medium">
                      {activity.user}
                    </span>
                    <span className="text-text-secondary">
                      {activity.action}ed
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary/70">
                    {new Date(activity.time).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Trends Chart (Placeholder) */}
      <div className="bg-dark-primary rounded-lg p-4">
        <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          View Trends
        </h4>
        <div className="h-32 flex items-center justify-center text-text-secondary/50">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400'
  };

  return (
    <div className="bg-dark-primary rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary">
        {value}
      </div>
    </div>
  );
}