import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * UserContext - Manages persistent user identity without SSO
 * 
 * Features:
 * - Stores user name in localStorage for persistence
 * - Auto-generates anonymous ID if no name set
 * - One-time prompt for user name on first visit
 * - Editable profile for changing name later
 * - Syncs with all quotes/cases automatically
 */

const UserContext = createContext(null);

const USER_STORAGE_KEY = 'polaris.user.profile.v1';

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = () => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      
      if (stored) {
        const profile = JSON.parse(stored);
        setUser(profile);
        setIsLoading(false);
      } else {
        // No profile exists - show name prompt
        setShowNamePrompt(true);
        setIsLoading(false);
      }
    } catch (error) {
      setShowNamePrompt(true);
      setIsLoading(false);
    }
  };

  const saveUserProfile = (name, email = '') => {
    const profile = {
      id: generateUserId(),
      name: name.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      setUser(profile);
      setShowNamePrompt(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = (updates) => {
    if (!user) return { success: false, error: 'No user profile exists' };

    const updatedProfile = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedProfile));
      setUser(updatedProfile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearUserProfile = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setShowNamePrompt(true);
  };

  const generateUserId = () => {
    // Generate a unique ID based on timestamp and random string
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `user_${timestamp}_${randomStr}`;
  };

  const getUserName = () => {
    return user?.name || 'Unknown User';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    
    const parts = user.name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const value = {
    user,
    isLoading,
    showNamePrompt,
    setShowNamePrompt,
    saveUserProfile,
    updateUserProfile,
    clearUserProfile,
    getUserName,
    getUserInitials
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
