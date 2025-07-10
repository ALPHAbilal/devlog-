import eventBus, { EVENT_TYPES } from '../eventBus';
import lockManager from '../locking/LockManager';
import dataIntegrityManager from '../integrity/DataIntegrityManager';

/**
 * Transaction Manager
 * 
 * Provides ACID-like transactions for client-side operations:
 * - Atomicity: All operations succeed or all fail
 * - Consistency: Data integrity is maintained
 * - Isolation: Transactions don't interfere with each other
 * - Durability: Changes persist or are rolled back completely
 */
class TransactionManager {
  constructor() {
    this.activeTransactions = new Map(); // transactionId -> transaction
    this.transactionLog = [];
    this.maxLogSize = 100;
    
    // Saga registry for complex workflows
    this.sagas = new Map();
    
    // Transaction statistics
    this.stats = {
      started: 0,
      committed: 0,
      rolledBack: 0,
      failed: 0,
      compensated: 0
    };
  }

  /**
   * Start a new transaction
   */
  async beginTransaction(options = {}) {
    const transactionId = this.generateTransactionId();
    const transaction = {
      id: transactionId,
      startTime: Date.now(),
      operations: [],
      locks: new Set(),
      snapshots: new Map(),
      status: 'ACTIVE',
      metadata: options.metadata || {},
      isolationLevel: options.isolationLevel || 'READ_COMMITTED'
    };

    this.activeTransactions.set(transactionId, transaction);
    this.stats.started++;

    eventBus.emit(EVENT_TYPES.TRANSACTION_STARTED, { transactionId });
    
    return {
      transactionId,
      add: (operation) => this.addOperation(transactionId, operation),
      commit: () => this.commit(transactionId),
      rollback: () => this.rollback(transactionId),
      getStatus: () => this.getTransactionStatus(transactionId)
    };
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add operation to transaction
   */
  async addOperation(transactionId, operation) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== 'ACTIVE') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    // Validate operation
    this.validateOperation(operation);

    // Create operation record
    const operationRecord = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: operation.type,
      target: operation.target,
      action: operation.action,
      data: operation.data,
      compensate: operation.compensate || null,
      executed: false,
      timestamp: Date.now()
    };

    // Acquire locks if needed
    if (operation.requiresLock) {
      const lockId = this.getLockId(operation);
      const lockResult = await lockManager.acquireLock(lockId, {
        metadata: { transactionId },
        priority: 2
      });

      if (!lockResult.success) {
        throw new Error(`Failed to acquire lock for ${lockId}`);
      }

      transaction.locks.add(lockId);
    }

    // Take snapshot for rollback
    if (operation.snapshot) {
      const snapshot = await this.createSnapshot(operation);
      transaction.snapshots.set(operationRecord.id, snapshot);
    }

    transaction.operations.push(operationRecord);
    return operationRecord.id;
  }

  /**
   * Validate operation structure
   */
  validateOperation(operation) {
    const requiredFields = ['type', 'target', 'action'];
    for (const field of requiredFields) {
      if (!operation[field]) {
        throw new Error(`Operation missing required field: ${field}`);
      }
    }

    const validTypes = ['document', 'block', 'metadata', 'storage'];
    if (!validTypes.includes(operation.type)) {
      throw new Error(`Invalid operation type: ${operation.type}`);
    }

    const validActions = ['create', 'update', 'delete', 'move'];
    if (!validActions.includes(operation.action)) {
      throw new Error(`Invalid operation action: ${operation.action}`);
    }
  }

  /**
   * Get lock ID for operation
   */
  getLockId(operation) {
    return `${operation.type}:${operation.target}`;
  }

  /**
   * Create snapshot for rollback
   */
  async createSnapshot(operation) {
    // This would create a snapshot based on operation type
    // For now, return a simple snapshot
    return {
      type: operation.type,
      target: operation.target,
      data: JSON.parse(JSON.stringify(operation.data)),
      timestamp: Date.now()
    };
  }

  /**
   * Commit transaction
   */
  async commit(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== 'ACTIVE') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    transaction.status = 'COMMITTING';

    try {
      // Execute all operations
      for (const operation of transaction.operations) {
        await this.executeOperation(operation);
        operation.executed = true;
      }

      // Mark as committed
      transaction.status = 'COMMITTED';
      transaction.endTime = Date.now();
      this.stats.committed++;

      // Log transaction
      this.logTransaction(transaction);

      // Release all locks
      await this.releaseLocks(transaction);

      // Clean up
      this.activeTransactions.delete(transactionId);

      eventBus.emit(EVENT_TYPES.TRANSACTION_COMMITTED, {
        transactionId,
        duration: transaction.endTime - transaction.startTime,
        operations: transaction.operations.length
      });

      return {
        success: true,
        transactionId,
        operations: transaction.operations.length
      };

    } catch (error) {
      console.error(`Transaction ${transactionId} commit failed:`, error);
      transaction.status = 'FAILED';
      this.stats.failed++;

      // Attempt rollback
      try {
        await this.rollback(transactionId);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
        throw new Error(`Transaction failed and rollback failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Execute single operation
   */
  async executeOperation(operation) {
    // This would execute the actual operation
    // For now, simulate execution
    console.log(`Executing operation: ${operation.type}.${operation.action} on ${operation.target}`);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Emit operation event
    eventBus.emit(EVENT_TYPES.OPERATION_EXECUTED, {
      operationId: operation.id,
      type: operation.type,
      action: operation.action
    });
  }

  /**
   * Rollback transaction
   */
  async rollback(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    transaction.status = 'ROLLING_BACK';

    try {
      // Reverse executed operations
      const executedOps = transaction.operations.filter(op => op.executed);
      
      for (const operation of executedOps.reverse()) {
        if (operation.compensate) {
          // Use custom compensation
          await this.executeCompensation(operation);
        } else {
          // Use snapshot to restore
          const snapshot = transaction.snapshots.get(operation.id);
          if (snapshot) {
            await this.restoreSnapshot(snapshot);
          }
        }
      }

      // Mark as rolled back
      transaction.status = 'ROLLED_BACK';
      transaction.endTime = Date.now();
      this.stats.rolledBack++;

      // Log transaction
      this.logTransaction(transaction);

      // Release all locks
      await this.releaseLocks(transaction);

      // Clean up
      this.activeTransactions.delete(transactionId);

      eventBus.emit(EVENT_TYPES.TRANSACTION_ROLLED_BACK, {
        transactionId,
        reason: 'Manual rollback',
        operations: executedOps.length
      });

      return {
        success: true,
        transactionId,
        rolledBackOperations: executedOps.length
      };

    } catch (error) {
      console.error(`Rollback failed for transaction ${transactionId}:`, error);
      transaction.status = 'ROLLBACK_FAILED';
      throw error;
    }
  }

  /**
   * Execute compensation logic
   */
  async executeCompensation(operation) {
    if (typeof operation.compensate === 'function') {
      await operation.compensate(operation);
      this.stats.compensated++;
    }
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(snapshot) {
    // This would restore the snapshot
    console.log(`Restoring snapshot for ${snapshot.type}:${snapshot.target}`);
    
    // Use data integrity manager to restore
    if (snapshot.type === 'document') {
      await dataIntegrityManager.restoreSnapshot(snapshot.target);
    }
  }

  /**
   * Release transaction locks
   */
  async releaseLocks(transaction) {
    for (const lockId of transaction.locks) {
      lockManager.releaseLock(lockId);
    }
    transaction.locks.clear();
  }

  /**
   * Log transaction for audit
   */
  logTransaction(transaction) {
    const logEntry = {
      id: transaction.id,
      status: transaction.status,
      startTime: transaction.startTime,
      endTime: transaction.endTime,
      duration: transaction.endTime - transaction.startTime,
      operationCount: transaction.operations.length,
      metadata: transaction.metadata
    };

    this.transactionLog.push(logEntry);

    // Keep log size manageable
    if (this.transactionLog.length > this.maxLogSize) {
      this.transactionLog.shift();
    }
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      // Check log
      const logEntry = this.transactionLog.find(entry => entry.id === transactionId);
      return logEntry ? logEntry.status : 'NOT_FOUND';
    }
    return transaction.status;
  }

  /**
   * Register a saga
   */
  registerSaga(name, saga) {
    this.sagas.set(name, saga);
  }

  /**
   * Execute a saga
   */
  async executeSaga(sagaName, context) {
    const saga = this.sagas.get(sagaName);
    if (!saga) {
      throw new Error(`Saga ${sagaName} not found`);
    }

    const transaction = await this.beginTransaction({
      metadata: { saga: sagaName }
    });

    try {
      // Execute saga steps
      for (const step of saga.steps) {
        const operation = {
          type: step.type,
          target: step.target,
          action: step.action,
          data: typeof step.data === 'function' ? step.data(context) : step.data,
          compensate: step.compensate,
          requiresLock: step.requiresLock !== false,
          snapshot: step.snapshot !== false
        };

        await transaction.add(operation);
      }

      // Commit the saga
      return await transaction.commit();

    } catch (error) {
      console.error(`Saga ${sagaName} failed:`, error);
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTransactions: this.activeTransactions.size,
      logSize: this.transactionLog.length
    };
  }

  /**
   * Clean up stale transactions
   */
  cleanupStaleTransactions(maxAge = 5 * 60 * 1000) {
    const now = Date.now();
    const staleTransactions = [];

    for (const [id, transaction] of this.activeTransactions) {
      if (now - transaction.startTime > maxAge && transaction.status === 'ACTIVE') {
        staleTransactions.push(id);
      }
    }

    // Rollback stale transactions
    staleTransactions.forEach(async (id) => {
      console.warn(`Rolling back stale transaction: ${id}`);
      try {
        await this.rollback(id);
      } catch (error) {
        console.error(`Failed to rollback stale transaction ${id}:`, error);
      }
    });

    return staleTransactions.length;
  }
}

// Transaction event types
export const TRANSACTION_EVENTS = {
  TRANSACTION_STARTED: 'transaction:started',
  TRANSACTION_COMMITTED: 'transaction:committed',
  TRANSACTION_ROLLED_BACK: 'transaction:rolledBack',
  OPERATION_EXECUTED: 'transaction:operation:executed'
};

// Add to main event types
Object.assign(EVENT_TYPES, TRANSACTION_EVENTS);

// Example saga for document operations
export const documentSaga = {
  steps: [
    {
      type: 'document',
      target: (ctx) => ctx.documentId,
      action: 'update',
      data: (ctx) => ctx.updates,
      compensate: async (op) => {
        // Restore from snapshot
        console.log('Compensating document update');
      }
    },
    {
      type: 'metadata',
      target: (ctx) => ctx.documentId,
      action: 'update',
      data: (ctx) => ({ lastModified: Date.now() })
    }
  ]
};

// Export singleton instance
const transactionManager = new TransactionManager();

export default transactionManager;