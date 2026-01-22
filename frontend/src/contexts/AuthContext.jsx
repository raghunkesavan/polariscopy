import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast, removeToast } = useToast();
  
  // Idle timeout: 30 minutes in milliseconds (set to 1 min for testing)
  const IDLE_TIMEOUT = 30 * 60 * 1000; // TODO: Change back to 30 * 60 * 1000 for production
  const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout (for testing)
  const lastActivityRef = useRef(Date.now());
  const [warningShown, setWarningShown] = useState(false);
  const warningToastIdRef = useRef(null);

  // Access level definitions
  const ACCESS_LEVELS = {
    ADMIN: 1,
    UW_TEAM_LEAD: 2,
    HEAD_OF_UW: 3,
    UNDERWRITER: 4,
    PRODUCT_TEAM: 5,
  };

  // Permission checks
  const hasPermission = (requiredLevel) => {
    if (!user || !user.access_level) return false;
    // Lower number = higher permission (1 = Admin is highest)
    return user.access_level <= requiredLevel;
  };

  const canEditCalculators = () => {
    // Allow Admin (1), UW Team Lead (2), Head of UW (3) and Underwriter (4)
    // to edit calculator fields. Product Team (5) remains excluded.
    return user && user.access_level >= 1 && user.access_level <= 4;
  };

  const canAccessAdmin = () => {
    // Levels 1-5 except 4 (Underwriter) can access admin pages
    return user && user.access_level !== 4;
  };

  const canEditRatesAndCriteria = () => {
    // Levels 1-5 except 4 (Underwriter) can edit rates/constants/criteria
    return user && user.access_level !== 4;
  };

  const isUnderwriter = () => {
    return user && user.access_level === 4;
  };

  const isAdmin = () => {
    return user && user.access_level === 1;
  };

  // Fetch current user info
  const fetchUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
      setError(null);
      return data.user;
    } catch (err) {
      setError(err.message);
      logout();
      return null;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error object from backend: { success: false, error: { code: 'X', message: 'Y' } }
        const errorMessage = data.error?.message || data.error || 'Login failed';
        throw new Error(errorMessage);
      }

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setError(null);
      
      // Reset activity timer on login
      lastActivityRef.current = Date.now();
      setWarningShown(false);
      
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error object from backend: { success: false, error: { code: 'X', message: 'Y' } }
        const errorMessage = data.error?.message || data.error || 'Password change failed';
        throw new Error(errorMessage);
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        await fetchUser(token);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Auto-logout on idle timeout
  useEffect(() => {
    if (!token || !user) return;

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Reset activity timer and warning
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      if (warningShown) {
        setWarningShown(false);
        // Remove the warning toast immediately when user interacts
        if (warningToastIdRef.current) {
          removeToast(warningToastIdRef.current);
          warningToastIdRef.current = null;
        }
      }
    };

    // Check for idle timeout every 5 seconds for better accuracy
    const checkIdleTimeout = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeRemaining = IDLE_TIMEOUT - timeSinceActivity;
      
      // Update countdown or show initial warning when within WARNING_TIME
      if (timeRemaining <= WARNING_TIME && timeRemaining > 0) {
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        
        // Remove old warning toast if exists
        if (warningToastIdRef.current) {
          removeToast(warningToastIdRef.current);
        }
        
        // Show updated warning toast
        const toastId = Date.now();
        warningToastIdRef.current = toastId;
        showToast({
          kind: 'warning',
          title: 'Session Timeout Warning',
          subtitle: `You will be logged out in ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''} due to inactivity. Click anywhere to stay logged in.`,
          timeout: 0 // Don't auto-dismiss, we'll handle it manually
        });
        setWarningShown(true);
      }
      
      // Logout when time expires
      if (timeSinceActivity >= IDLE_TIMEOUT) {
        setWarningShown(false);
        // Remove warning toast before logout
        if (warningToastIdRef.current) {
          removeToast(warningToastIdRef.current);
          warningToastIdRef.current = null;
        }
        clearInterval(checkIdleTimeout);
        logout();
        showToast({
          kind: 'error',
          title: 'Session Expired',
          subtitle: 'You have been logged out due to inactivity.',
          timeout: 8000
        });
      }
    }, 5000); // Check every 5 seconds

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetActivity);
    });

    return () => {
      // Cleanup
      clearInterval(checkIdleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
    };
  }, [token, user, warningShown]);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    changePassword,
    fetchUser,
    hasPermission,
    canEditCalculators,
    canAccessAdmin,
    canEditRatesAndCriteria,
    isUnderwriter,
    isAdmin,
    ACCESS_LEVELS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
