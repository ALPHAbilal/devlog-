import React from 'react';
import { useSmartDatabaseUsage } from '../../hooks/useSmartDatabaseUsage';

export default function StorageSection() {
  const { databaseSize, storageLimit, usagePercentage } = useSmartDatabaseUsage();

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Data & Privacy</h1>
        <p className="section-description">Manage your data storage, privacy settings, and information security</p>
      </div>

      <hr className="section-divider" />

      {/* Storage Card */}
      <div className="info-card" style={{ padding: '33px', gap: '24px' }}>
        {/* Size Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '30px', lineHeight: '36px' }}>
              {databaseSize || '0 B'}
            </span>
            <span style={{ fontSize: '14px', lineHeight: '20px', color: 'var(--text-muted)' }}>
              of {storageLimit || '500 MB'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(usagePercentage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Usage Text */}
        <p style={{ fontSize: '14px', lineHeight: '20px', color: 'var(--text-muted)', margin: 0 }}>
          {usagePercentage?.toFixed(1) || '0.0'}% of your storage is being used
        </p>
      </div>
    </div>
  );
}
