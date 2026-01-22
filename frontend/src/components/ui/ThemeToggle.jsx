import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import SalesforceIcon from '../shared/SalesforceIcon';
import '../../styles/ThemeToggle.css';

/**
 * ThemeToggle - Quick toggle button for light/dark theme
 * Cycles through: Light → Dark → System
 */
const ThemeToggle = () => {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const cycleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const getIcon = () => {
    return (
      <div className="feature-icon-container feature-icon-green" style={{ width: '28px', height: '28px' }}>
        <SalesforceIcon name="lightbulb" size="x-small" />
      </div>
    );
  };

  const getTooltip = () => {
    if (themeMode === 'dark') {
      return 'Dark theme (click for System)';
    } else if (themeMode === 'system') {
      return 'System theme (click for Light)';
    } else {
      return 'Light theme (click for Dark)';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      title={getTooltip()}
      className="flex-center radius-sm hover-bg theme-toggle-btn"
      style={{ padding: 0 }}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;
