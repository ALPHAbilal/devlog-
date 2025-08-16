import { useState, useEffect } from 'react';
import { Activity, Database, Zap, TrendingUp, Clock, Layers } from 'lucide-react';
import { useMultiLayerStorage } from '../hooks/useMultiLayerStorage';
import eventBus, { EVENT_TYPES } from '../utils/eventBus';

/**
 * Performance Monitor Component
 * 
 * Displays real-time performance metrics for the multi-layer storage system
 */
export default function PerformanceMonitor({ show = false }) {
  const { metrics, syncStatus, clearCache } = useMultiLayerStorage();
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    lastOperation: null,
    operationTime: 0,
    operations: []
  });

  useEffect(() => {
    if (!show) return;

    const operations = [];
    
    // Track storage operations
    const trackOperation = (type, startTime) => {
      const duration = Date.now() - startTime;
      const op = {
        type,
        duration,
        timestamp: Date.now()
      };
      
      operations.push(op);
      if (operations.length > 10) operations.shift();
      
      setRealtimeMetrics({
        lastOperation: type,
        operationTime: duration,
        operations: [...operations]
      });
    };

    // Listen to events
    let operationStart = Date.now();
    
    const unsubStart = eventBus.on(EVENT_TYPES.SYNC_STARTED, () => {
      operationStart = Date.now();
    });
    
    const unsubComplete = eventBus.on(EVENT_TYPES.SYNC_COMPLETED, () => {
      trackOperation('sync', operationStart);
    });
    
    const unsubStorage = eventBus.on(EVENT_TYPES.STORAGE_CHANGED, (event) => {
      trackOperation(event.action, Date.now() - 10); // Estimate 10ms for local ops
    });

    return () => {
      unsubStart();
      unsubComplete();
      unsubStorage();
    };
  }, [show]);

  if (!show || !metrics) return null;

  const { storage, sync } = metrics;
  const avgOpTime = realtimeMetrics.operations.length > 0
    ? realtimeMetrics.operations.reduce((sum, op) => sum + op.duration, 0) / realtimeMetrics.operations.length
    : 0;

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <Activity size={20} />
        <h3>Performance Monitor</h3>
      </div>

      <div className="metrics-grid">
        {/* Cache Performance */}
        <div className="metric-card">
          <div className="metric-icon">
            <Zap size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Cache Hit Rate</div>
            <div className="metric-value">{storage.hitRate || '0%'}</div>
            <div className="metric-detail">
              {storage.cacheHits}/{storage.reads} reads
            </div>
          </div>
        </div>

        {/* Storage Layers */}
        <div className="metric-card">
          <div className="metric-icon">
            <Layers size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Storage Layers</div>
            <div className="metric-value">3 Active</div>
            <div className="metric-detail">
              Memory • IndexedDB • Cloud
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="metric-card">
          <div className="metric-icon">
            <Database size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Sync Status</div>
            <div className="metric-value">
              {syncStatus?.syncInProgress ? 'Syncing...' : 
               syncStatus?.online ? 'Online' : 'Offline'}
            </div>
            <div className="metric-detail">
              {syncStatus?.pendingChanges || 0} pending
            </div>
          </div>
        </div>

        {/* Average Operation Time */}
        <div className="metric-card">
          <div className="metric-icon">
            <Clock size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Avg Operation</div>
            <div className="metric-value">{avgOpTime.toFixed(0)}ms</div>
            <div className="metric-detail">
              Last: {realtimeMetrics.lastOperation || 'none'}
            </div>
          </div>
        </div>
      </div>

      {/* Operations Timeline */}
      <div className="operations-timeline">
        <h4>Recent Operations</h4>
        <div className="timeline">
          {realtimeMetrics.operations.map((op, index) => (
            <div key={index} className="timeline-item">
              <div className="operation-type">{op.type}</div>
              <div className="operation-time">{op.duration}ms</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Metrics */}
      {sync && (
        <div className="sync-metrics">
          <h4>Sync Performance</h4>
          <div className="sync-stats">
            <div className="stat">
              <span className="stat-label">Success Rate:</span>
              <span className="stat-value">
                {sync.totalSyncs > 0 
                  ? `${(sync.successfulSyncs / sync.totalSyncs * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg Sync Time:</span>
              <span className="stat-value">{sync.averageSyncTime.toFixed(0)}ms</span>
            </div>
            <div className="stat">
              <span className="stat-label">Conflicts Resolved:</span>
              <span className="stat-value">{sync.conflictsResolved}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="monitor-actions">
        <button onClick={clearCache} className="action-btn">
          Clear Memory Cache
        </button>
        <button onClick={() => eventBus.emit(EVENT_TYPES.UI_REFRESH_REQUESTED)} className="action-btn">
          Force Sync
        </button>
      </div>
    </div>
  );
}