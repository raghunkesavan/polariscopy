# State Management Domain - Pattern Deep Dive

## Overview
This project uses **React Context API** as the primary state management solution. No Redux, Zustand, or MobX. State is managed through multiple context providers at the app root level, with custom hooks for reusable stateful logic.

---

## Required Patterns

### 1. Context Provider Structure

**Pattern**: Create context + provider + custom hook in single file

**Example - AuthContext.jsx** (full real example):
```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

// ✅ Custom hook for consuming context (prevents null checks everywhere)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ Provider component with all state and methods
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Access level definitions
  const ACCESS_LEVELS = {
    ADMIN: 1,
    UW_TEAM_LEAD: 2,
    HEAD_OF_UW: 3,
    UNDERWRITER: 4,
    PRODUCT_TEAM: 5,
  };

  // Permission checks (methods exposed via context)
  const hasPermission = (requiredLevel) => {
    if (!user || !user.access_level) return false;
    return user.access_level <= requiredLevel;
  };

  const canEditCalculators = () => {
    return user && user.access_level >= 1 && user.access_level <= 4;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setError(null);
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

  // ✅ Expose all state and methods via value object
  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    fetchUser,
    hasPermission,
    canEditCalculators,
    isAdmin,
    ACCESS_LEVELS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Key points**:
- Context created with `createContext()`
- Custom hook (`useAuth`) throws error if used outside provider
- Provider manages all state (`useState`) and side effects (`useEffect`)
- Methods (login, logout, permission checks) exposed via context value
- Loading and error states included in context

---

### 2. Required Contexts (App Root Level)

**Pattern**: Wrap all contexts at app root in App.jsx

**Example - App.jsx**:
```jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { UserProvider } from './contexts/UserContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

const AppContent = () => {
  // App routing and content
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AccessibilityProvider>
          <SupabaseProvider>
            <AuthProvider>
              <UserProvider>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </UserProvider>
            </AuthProvider>
          </SupabaseProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
```

**Required contexts**:
1. **AuthContext** - User authentication, permissions, access levels
2. **SupabaseContext** - Supabase client instance
3. **ThemeContext** - Dark mode state and toggle
4. **ToastContext** - Global toast notifications
5. **UserProvider** - User preferences and settings
6. **AccessibilityProvider** - Accessibility settings

---

### 3. Supabase Context Pattern

**Pattern**: Simple provider that exposes Supabase client

**Example - SupabaseContext.jsx**:
```jsx
import { createClient } from '@supabase/supabase-js';
import React, { createContext, useContext } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SupabaseContext = createContext({
  supabase: null,
  user: null,
});

export function SupabaseProvider({ children }) {
  const mockUser = { role: 'authenticated' };

  const value = {
    supabase,
    user: mockUser,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
```

**Key points**:
- Supabase client initialized once at module level
- Provider simply exposes the client (no state changes)
- Environment variables loaded via `import.meta.env` (Vite pattern)

---

### 4. Local Component State Pattern

**Pattern**: Use useState for UI-only state, useEffect for side effects

**Example - Form state management**:
```jsx
import React, { useState, useEffect } from 'react';

function PropertyInputForm({ onSubmit }) {
  // ✅ Local state for form fields
  const [propertyValue, setPropertyValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ Validate on field changes (side effect)
  useEffect(() => {
    const newErrors = {};
    if (propertyValue && parseFloat(propertyValue) < 50000) {
      newErrors.propertyValue = 'Minimum property value is £50,000';
    }
    if (monthlyRent && parseFloat(monthlyRent) < 0) {
      newErrors.monthlyRent = 'Monthly rent must be positive';
    }
    setErrors(newErrors);
  }, [propertyValue, monthlyRent]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;
    
    setIsSubmitting(true);
    await onSubmit({ propertyValue, monthlyRent });
    setIsSubmitting(false);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={propertyValue}
        onChange={(e) => setPropertyValue(e.target.value)}
        disabled={isSubmitting}
      />
      {errors.propertyValue && <span className="error">{errors.propertyValue}</span>}
      
      <input
        value={monthlyRent}
        onChange={(e) => setMonthlyRent(e.target.value)}
        disabled={isSubmitting}
      />
      {errors.monthlyRent && <span className="error">{errors.monthlyRent}</span>}
      
      <button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

**Key points**:
- UI state (form fields, validation errors, submitting status) lives in component
- Side effects (validation) run via `useEffect`
- Loading states (`isSubmitting`) prevent duplicate submissions

---

### 5. Custom Hooks Pattern

**Pattern**: Extract reusable stateful logic into custom hooks (prefix with 'use')

**Example - Custom hook structure**:
```jsx
// hooks/calculator/useBrokerSettings.js
import { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';

export function useBrokerSettings(userId) {
  const { supabase } = useSupabase();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('app_constants')
          .select('*')
          .eq('user_id', userId)
          .eq('category', 'broker_settings')
          .single();
        
        if (fetchError) throw fetchError;
        
        setSettings(data);
      } catch (err) {
        setError(err.message);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [userId, supabase]);
  
  return { settings, loading, error };
}
```

**Key points**:
- Hook name starts with `use` (React convention)
- Encapsulates state (`useState`) and effects (`useEffect`)
- Returns object with state and status flags
- Reusable across multiple components

---

### 6. State Persistence Pattern

**Pattern**: Persist user preferences to localStorage with sync to Supabase

**Example - Theme persistence**:
```jsx
// contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // ✅ Initialize from localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app.theme') || 'light';
  });
  
  // ✅ Sync to localStorage on change
  useEffect(() => {
    localStorage.setItem('app.theme', theme);
    
    // Apply theme to document
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-carbon-theme', 'g100');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.removeAttribute('data-carbon-theme');
    }
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const value = {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme: theme,
  };
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Key points**:
- Initialize state from `localStorage.getItem()`
- Use `useEffect` to persist changes to localStorage
- Lazily initialize state with function: `useState(() => localStorage.getItem(...))`
- Apply side effects (DOM changes) in same `useEffect`

---

### 7. Settings Reactivity Pattern

**Pattern**: Listen to localStorage 'storage' events for cross-tab/component reactivity

**Example - Reactive settings listener**:
```jsx
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'app.constants.override.v1';

export function useAppConstants() {
  const [constants, setConstants] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultConstants();
  });
  
  // ✅ Listen to storage events for reactivity
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        const newValue = e.newValue ? JSON.parse(e.newValue) : getDefaultConstants();
        setConstants(newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const updateConstants = (newConstants) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConstants));
    setConstants(newConstants);
    
    // ✅ Dispatch storage event manually for same-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(newConstants),
      oldValue: localStorage.getItem(STORAGE_KEY),
    }));
  };
  
  return { constants, updateConstants };
}
```

**Key points**:
- Listen to `window.addEventListener('storage', ...)` for changes
- Storage events fire automatically for other tabs
- Manually dispatch `StorageEvent` for same-tab reactivity
- Clean up event listeners in `useEffect` return function

---

### 8. State Immutability Pattern

**Pattern**: Always use functional updates for complex state (never mutate state directly)

**Example - Functional state updates**:
```jsx
import React, { useState } from 'react';

function QuoteCalculator() {
  const [results, setResults] = useState({});
  
  // ❌ INCORRECT - Mutating state directly
  const updateResultBad = (colKey, newData) => {
    results[colKey] = newData; // NO - mutates state!
    setResults(results); // NO - React won't detect change!
  };
  
  // ✅ CORRECT - Functional update with spread
  const updateResult = (colKey, newData) => {
    setResults(prev => ({
      ...prev,
      [colKey]: {
        ...prev[colKey],
        ...newData,
      },
    }));
  };
  
  // ✅ CORRECT - Array updates with map/filter
  const [feeColumns, setFeeColumns] = useState(['0-2%', '2-3%', '3%+']);
  
  const removeFeeColumn = (colToRemove) => {
    setFeeColumns(prev => prev.filter(col => col !== colToRemove));
  };
  
  const addFeeColumn = (newCol) => {
    setFeeColumns(prev => [...prev, newCol]);
  };
  
  // ✅ CORRECT - Nested object updates
  const [quote, setQuote] = useState({ client: { name: '', email: '' } });
  
  const updateClientName = (name) => {
    setQuote(prev => ({
      ...prev,
      client: {
        ...prev.client,
        name,
      },
    }));
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

**Key points**:
- NEVER mutate state directly (`state.foo = bar`)
- Use spread operator (`{ ...prev, key: value }`) for object updates
- Use array methods (`[...prev, item]`, `prev.filter(...)`) for array updates
- Use functional updates (`setState(prev => ...)`) when depending on previous state

---

### 9. Performance Optimization Pattern

**Pattern**: Use useMemo and useCallback to prevent unnecessary re-renders

**Example**:
```jsx
import React, { useState, useMemo, useCallback } from 'react';

function ExpensiveCalculator({ propertyValue, monthlyRent, rate }) {
  const [manualOverrides, setManualOverrides] = useState({});
  
  // ✅ Memoize expensive calculation
  const calculatedLoan = useMemo(() => {
    // Expensive calculation only runs when dependencies change
    console.log('Recalculating loan...');
    return performComplexCalculation(propertyValue, monthlyRent, rate);
  }, [propertyValue, monthlyRent, rate]);
  
  // ✅ Memoize callback to prevent child re-renders
  const handleOverrideChange = useCallback((key, value) => {
    setManualOverrides(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []); // Empty deps - callback never changes
  
  // ✅ Memoize derived data
  const finalLoan = useMemo(() => {
    return {
      ...calculatedLoan,
      ...manualOverrides,
    };
  }, [calculatedLoan, manualOverrides]);
  
  return (
    <div>
      <LoanDisplay loan={finalLoan} />
      <OverrideInputs onChange={handleOverrideChange} />
    </div>
  );
}
```

**Key points**:
- Use `useMemo` for expensive computations
- Use `useCallback` for stable callback references (prevents child re-renders)
- Include all dependencies in dependency array
- Don't over-optimize: only memoize when performance issues exist

---

## Architectural Constraints

### 1. No External State Management Libraries

**Rule**: Do NOT use Redux, Zustand, MobX, or any other state management library

```jsx
// ❌ NO
import { createStore } from 'redux';
import { create } from 'zustand';

// ✅ YES - Use React Context API only
import { createContext, useContext } from 'react';
```

---

### 2. Context Consumer Pattern

**Rule**: Always access context via custom hooks, never via `<Context.Consumer>`

```jsx
// ❌ NO - Don't use Context.Consumer
<AuthContext.Consumer>
  {value => <div>{value.user}</div>}
</AuthContext.Consumer>

// ✅ YES - Use custom hook
const { user } = useAuth();
return <div>{user}</div>;
```

---

### 3. State Lifting

**Rule**: Lift shared state to nearest common ancestor, keep local state local

```jsx
// ✅ CORRECT - Shared state in parent
function Calculator() {
  const [propertyValue, setPropertyValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  
  return (
    <>
      <PropertyInput value={propertyValue} onChange={setPropertyValue} />
      <RentInput value={monthlyRent} onChange={setMonthlyRent} />
      <Results propertyValue={propertyValue} monthlyRent={monthlyRent} />
    </>
  );
}

// ✅ CORRECT - Local state stays local
function AccordionSection() {
  const [expanded, setExpanded] = useState(false); // Only this component needs this
  
  return (
    <div onClick={() => setExpanded(!expanded)}>
      {expanded && <Content />}
    </div>
  );
}
```

---

## Summary Checklist

When managing state, ensure:

- [ ] Use React Context API (no Redux/Zustand/MobX)
- [ ] Create context + provider + custom hook in single file
- [ ] Custom hook throws error if used outside provider
- [ ] All required contexts wrapped at App root level
- [ ] UI-only state lives in component (useState)
- [ ] Shared state lifted to nearest common ancestor
- [ ] Reusable stateful logic extracted to custom hooks (use* prefix)
- [ ] State never mutated directly (always use functional updates)
- [ ] User preferences persisted to localStorage
- [ ] Listen to 'storage' events for reactivity
- [ ] Use useMemo/useCallback for performance-critical code
- [ ] Loading and error states included in contexts
