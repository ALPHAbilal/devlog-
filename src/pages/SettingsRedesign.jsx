import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Lock, Database, Key, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextOptimized';
import { useSettings } from '../contexts/SettingsContext';
import { useSmartDatabaseUsage } from '../hooks/useSmartDatabaseUsage';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/settings-redesign.css';

// Component imports
import AccountSection from './settings-sections/AccountSection';
import SecuritySection from './settings-sections/SecuritySection';
import StorageSection from './settings-sections/StorageSection';
import ApiKeysSection from './settings-sections/ApiKeysSection';

export default function SettingsRedesign() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSetting, updateSettings } = useSettings();
  const { databaseSize, storageLimit, usagePercentage } = useSmartDatabaseUsage();

  // State management
  const [activeSection, setActiveSection] = useState('account');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Resize handler for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Section configurations
  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'apiKeys', label: 'API Keys', icon: Key },
    { id: 'storage', label: 'Data & Privacy', icon: Database },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  return (
    <div className="settings-redesign">
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={16} />
          </button>
          <h1>Settings</h1>
          <button className="menu-button" onClick={() => setShowMobileSidebar(true)}>
            <Menu size={20} />
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className={`settings-sidebar ${isMobile && showMobileSidebar ? 'open' : ''}`}>
        {!isMobile && (
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        )}

        <nav className="settings-nav" role="navigation" aria-label="Settings navigation">
          {sections.map(section => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(section.id);
                  setShowMobileSidebar(false);
                }}
                aria-label={`${section.label} settings`}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                <IconComponent size={16} aria-hidden="true" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div
          className="mobile-overlay"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="settings-content">
        <ErrorBoundary name="AccountSection" feature="settings">
          {activeSection === 'account' && <AccountSection />}
        </ErrorBoundary>
        <ErrorBoundary name="SecuritySection" feature="settings">
          {activeSection === 'security' && <SecuritySection />}
        </ErrorBoundary>
        <ErrorBoundary name="StorageSection" feature="settings">
          {activeSection === 'storage' && <StorageSection />}
        </ErrorBoundary>
        <ErrorBoundary name="ApiKeysSection" feature="settings">
          {activeSection === 'apiKeys' && <ApiKeysSection />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
