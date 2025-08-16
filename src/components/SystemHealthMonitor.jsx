import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Activity, Lock, Database, RefreshCw, Zap } from 'lucide-react';
import lockManager from '../utils/locking/LockManager';
import transactionManager from '../utils/transactions/TransactionManager';
import circuitBreakerManager from '../utils/network/CircuitBreaker';
import dataIntegrityManager from '../utils/integrity/DataIntegrityManager';
import recoveryManager from '../utils/recovery/RecoveryManager';
import eventBus, { EVENT_TYPES } from '../utils/eventBus';

/**
 * System Health Monitor
 * 
 * Displays the status of all bulletproofing systems
 */
export default function SystemHealthMonitor({ show = false }) {
  const [systemStatus, setSystemStatus] = useState({
    locks: null,
    transactions: null,
    circuitBreakers: null,
    integrity: null,
    recovery: null
  });
  
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Update system status
  const updateStatus = () => {
    setSystemStatus({
      locks: lockManager.getStats(),
      transactions: transactionManager.getStats(),
      circuitBreakers: circuitBreakerManager.getAllHealth(),
      integrity: dataIntegrityManager.getIntegrityReport(),
      recovery: recoveryManager.getRecoveryStatus()
    });
  };

  // Listen for critical events
  useEffect(() => {
    if (!show) return;

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    // Listen for alerts
    const unsubscribers = [
      eventBus.on(EVENT_TYPES.CIRCUIT_OPENED, (event) => {
        addAlert('warning', `Circuit breaker ${event.name} opened`, event);
      }),
      eventBus.on(EVENT_TYPES.DEADLOCK_DETECTED, (event) => {
        addAlert('error', `Deadlock detected on ${event.resourceId}`, event);
      }),
      eventBus.on(EVENT_TYPES.DATA_CORRUPTION_DETECTED, (event) => {
        addAlert('error', `Data corruption in document ${event.documentId}`, event);
      }),
      eventBus.on(EVENT_TYPES.RECOVERY_COMPLETED, (event) => {
        addAlert('success', 'System recovery completed', event);
      })
    ];

    return () => {
      clearInterval(interval);
      unsubscribers.forEach(unsub => unsub());
    };
  }, [show]);

  const addAlert = (type, message, data) => {
    const alert = {
      id: Date.now(),
      type,
      message,
      data,
      timestamp: new Date()
    };
    
    setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
  };

  const handleRefresh = () => {
    setRefreshing(true);
    updateStatus();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getHealthColor = (healthy) => {
    return healthy ? 'text-green-500' : 'text-red-500';
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!show || !systemStatus.locks) return null;

  return (
    <div className="fixed top-20 left-20 w-96 max-h-[80vh] 
                    bg-dark-primary/98 backdrop-blur-lg
                    border border-dark-secondary rounded-lg
                    shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 
                      bg-dark-secondary/50 border-b border-dark-secondary">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-green" />
          <h3 className="text-lg font-semibold text-text-primary">System Health</h3>
        </div>
        <button
          onClick={handleRefresh}
          className={`p-2 rounded hover:bg-dark-secondary/50 transition-all
                     ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
        {/* Lock Manager Status */}
        <div className="p-4 border-b border-dark-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-medium text-text-primary">Lock Manager</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-secondary">Active Locks:</span>
              <span className="ml-2 text-text-primary">{systemStatus.locks.currentLocks}</span>
            </div>
            <div>
              <span className="text-text-secondary">Conflicts:</span>
              <span className="ml-2 text-text-primary">{systemStatus.locks.conflicts}</span>
            </div>
            <div>
              <span className="text-text-secondary">Deadlocks:</span>
              <span className="ml-2 text-text-primary">{systemStatus.locks.deadlocks}</span>
            </div>
            <div>
              <span className="text-text-secondary">Queued:</span>
              <span className="ml-2 text-text-primary">{systemStatus.locks.queuedRequests}</span>
            </div>
          </div>
        </div>

        {/* Transaction Manager Status */}
        <div className="p-4 border-b border-dark-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-medium text-text-primary">Transaction Manager</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-secondary">Active:</span>
              <span className="ml-2 text-text-primary">{systemStatus.transactions.activeTransactions}</span>
            </div>
            <div>
              <span className="text-text-secondary">Committed:</span>
              <span className="ml-2 text-text-primary">{systemStatus.transactions.committed}</span>
            </div>
            <div>
              <span className="text-text-secondary">Rolled Back:</span>
              <span className="ml-2 text-text-primary">{systemStatus.transactions.rolledBack}</span>
            </div>
            <div>
              <span className="text-text-secondary">Failed:</span>
              <span className="ml-2 text-red-400">{systemStatus.transactions.failed}</span>
            </div>
          </div>
        </div>

        {/* Circuit Breakers Status */}
        <div className="p-4 border-b border-dark-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-medium text-text-primary">Circuit Breakers</h4>
          </div>
          <div className="space-y-2">
            {Object.entries(systemStatus.circuitBreakers).map(([name, health]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{name}:</span>
                <div className="flex items-center gap-2">
                  <span className={getHealthColor(health.healthy)}>
                    {health.state}
                  </span>
                  <span className="text-text-secondary">
                    ({Math.round(health.rate * 100)}% success)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Integrity Status */}
        <div className="p-4 border-b border-dark-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-green-500" />
            <h4 className="text-sm font-medium text-text-primary">Data Integrity</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-secondary">Documents:</span>
              <span className="ml-2 text-text-primary">{systemStatus.integrity.totalDocuments}</span>
            </div>
            <div>
              <span className="text-text-secondary">Snapshots:</span>
              <span className="ml-2 text-text-primary">{systemStatus.integrity.totalSnapshots}</span>
            </div>
            <div>
              <span className="text-text-secondary">Corruptions:</span>
              <span className="ml-2 text-red-400">{systemStatus.integrity.corruptionEvents}</span>
            </div>
            <div>
              <span className="text-text-secondary">Last Check:</span>
              <span className="ml-2 text-text-primary">
                {systemStatus.integrity.lastCheck 
                  ? new Date(systemStatus.integrity.lastCheck).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Recovery Status */}
        <div className="p-4 border-b border-dark-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-orange-500" />
            <h4 className="text-sm font-medium text-text-primary">Recovery Manager</h4>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Status:</span>
              <span className={systemStatus.recovery.recoveryInProgress ? 'text-yellow-500' : 'text-green-500'}>
                {systemStatus.recovery.recoveryInProgress ? 'In Progress' : 'Ready'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Last Recovery:</span>
              <span className="text-text-primary">
                {systemStatus.recovery.lastRecoveryTime
                  ? new Date(systemStatus.recovery.lastRecoveryTime).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Auto-save:</span>
              <span className="text-text-primary">
                {systemStatus.recovery.lastAutoSave
                  ? new Date(systemStatus.recovery.lastAutoSave).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-text-primary mb-3">Recent Alerts</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">No recent alerts</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} 
                     className="flex items-start gap-2 p-2 
                              bg-dark-secondary/30 rounded text-xs">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-text-primary">{alert.message}</p>
                    <p className="text-text-secondary text-[10px] mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}