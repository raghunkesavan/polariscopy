import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  
  // Check if current route is a public calculator route (force light theme)
  const isPublicRoute = location.pathname.startsWith('/calculator/public/');
  
  // Theme can be 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('app.theme.mode');
    return saved || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState('g10'); // g10 = light, g100 = dark

  // Function to get system preference
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'g100' : 'g10';
  };

  // Update resolved theme based on mode (force light for public routes)
  useEffect(() => {
    let theme;
    
    // Force light theme for public calculator routes
    if (isPublicRoute) {
      theme = 'g10';
    } else if (themeMode === 'system') {
      theme = getSystemTheme();
    } else if (themeMode === 'dark') {
      theme = 'g100';
    } else {
      theme = 'g10';
    }
    setResolvedTheme(theme);
    
    // Update the data-carbon-theme attribute on html element (kept for backward compatibility with existing styles)
    document.documentElement.setAttribute('data-carbon-theme', theme);
    
    // Also add/remove dark mode class on body for custom styles
    if (theme === 'g100') {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  }, [themeMode, isPublicRoute]);

  // Listen for system theme changes when in system mode (skip for public routes)
  useEffect(() => {
    if (themeMode !== 'system' || isPublicRoute) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const theme = getSystemTheme();
      setResolvedTheme(theme);
      document.documentElement.setAttribute('data-carbon-theme', theme);
      
      // Update dark mode class
      if (theme === 'g100') {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark-mode');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, isPublicRoute]);

  // Persist theme mode to localStorage
  const changeThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('app.theme.mode', mode);
  };

  const value = {
    themeMode, // 'light', 'dark', or 'system'
    resolvedTheme, // 'g10' or 'g100' (Carbon theme names)
    setThemeMode: changeThemeMode,
    isDark: resolvedTheme === 'g100',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
