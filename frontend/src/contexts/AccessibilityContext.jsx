import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

const DEFAULT_SETTINGS = {
  reducedMotion: false, // Disable animations and transitions
  highContrast: false, // Increase contrast ratios
  fontSize: 'medium', // 'small', 'medium', 'large', 'x-large'
  focusIndicators: false, // Enhanced focus indicators (default OFF)
  textSpacing: false, // Increased line height and letter spacing
  linkUnderlines: false, // Always underline links
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('app.accessibility.settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    
    // Check system preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion };
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced Motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // High Contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font Size
    root.setAttribute('data-font-size', settings.fontSize);

    // Focus Indicators
    if (settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Text Spacing
    if (settings.textSpacing) {
      root.classList.add('text-spacing');
    } else {
      root.classList.remove('text-spacing');
    }

    // Link Underlines
    if (settings.linkUnderlines) {
      root.classList.add('link-underlines');
    } else {
      root.classList.remove('link-underlines');
    }

    // Persist to localStorage
    localStorage.setItem('app.accessibility.settings', JSON.stringify(settings));
  }, [settings]);

  // Update individual setting
  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};
