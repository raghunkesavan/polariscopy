import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import '../styles/settings.css';

const SettingsPage = () => {
  const { themeMode, setThemeMode } = useTheme();
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [activeTab, setActiveTab] = useState('theme');
  const [resetMessage, setResetMessage] = useState('');

  const handleResetAccessibility = () => {
    resetSettings();
    setResetMessage('Settings reset to defaults');
    setTimeout(() => setResetMessage(''), 3000);
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p>Customize your theme and accessibility preferences</p>
      
      <div className="settings-tabs">
        <button 
          className={`settings-tab-button ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          Theme
        </button>
        <button 
          className={`settings-tab-button ${activeTab === 'accessibility' ? 'active' : ''}`}
          onClick={() => setActiveTab('accessibility')}
        >
          Accessibility
        </button>
      </div>
      
      {activeTab === 'theme' && (
        <div className="settings-content">
          <h2>Theme Preference</h2>
          <p>Choose how the application appears. Your selection will be saved automatically.</p>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="theme" 
                value="light" 
                checked={themeMode === 'light'} 
                onChange={(e) => setThemeMode(e.target.value)} 
              />
              <span>Light Mode</span>
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="theme" 
                value="dark" 
                checked={themeMode === 'dark'} 
                onChange={(e) => setThemeMode(e.target.value)} 
              />
              <span>Dark Mode</span>
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="theme" 
                value="system" 
                checked={themeMode === 'system'} 
                onChange={(e) => setThemeMode(e.target.value)} 
              />
              <span>System Preference</span>
            </label>
          </div>
        </div>
      )}
      
      {activeTab === 'accessibility' && (
        <div className="settings-content">
          <h2>Accessibility Options</h2>
          
          <div className="settings-reset-button">
            <button className="slds-button slds-button_neutral" onClick={handleResetAccessibility}>
              Reset to Defaults
            </button>
          </div>
          
          {resetMessage && (
            <div className="settings-success-message">
              {resetMessage}
            </div>
          )}

          <div className="page-container page-container--form">
            <div className="settings-section">
              <div className="setting-item">
                <label className="toggle-label">
                  <div>
                    <span className="setting-label-text">Reduce Motion</span>
                    <p className="setting-description">Minimize animations and transitions</p>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.reducedMotion} 
                      onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>

              <div className="setting-item">
                <label className="toggle-label">
                  <div>
                    <span className="setting-label-text">High Contrast</span>
                    <p className="setting-description">Increase contrast for better readability</p>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.highContrast} 
                      onChange={(e) => updateSetting('highContrast', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>

              <div className="setting-item">
                <label className="toggle-label">
                  <div>
                    <span className="setting-label-text">Enhanced Focus Indicators</span>
                    <p className="setting-description">Show prominent focus outlines for keyboard navigation</p>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.focusIndicators} 
                      onChange={(e) => updateSetting('focusIndicators', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>

              <div className="setting-item">
                <label className="toggle-label">
                  <div>
                    <span className="setting-label-text">Text Spacing</span>
                    <p className="setting-description">Increase spacing between lines and paragraphs</p>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.textSpacing} 
                      onChange={(e) => updateSetting('textSpacing', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>

              <div className="setting-item">
                <label className="toggle-label">
                  <div>
                    <span className="setting-label-text">Link Underlines</span>
                    <p className="setting-description">Always show underlines on links</p>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.linkUnderlines} 
                      onChange={(e) => updateSetting('linkUnderlines', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <div className="setting-section-header">Font Size</div>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="small" 
                    checked={settings.fontSize === 'small'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Small</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="medium" 
                    checked={settings.fontSize === 'medium'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Medium (Default)</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="large" 
                    checked={settings.fontSize === 'large'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Large</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="x-large" 
                    checked={settings.fontSize === 'x-large'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Extra Large</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
