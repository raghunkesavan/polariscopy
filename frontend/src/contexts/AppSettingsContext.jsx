import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSupabase } from './SupabaseContext';
import {
  MARKET_RATES as DEFAULT_MARKET_RATES,
  LOCALSTORAGE_CONSTANTS_KEY,
} from '../config/constants';

/**
 * AppSettingsContext
 * 
 * Provides centralized access to app settings (market rates, broker settings, etc.)
 * from Supabase database, with localStorage fallback.
 * 
 * This solves the issue where localStorage is unavailable or partitioned in
 * Salesforce iframe contexts due to third-party storage restrictions.
 * 
 * Priority order:
 * 1. Supabase app_settings table (source of truth)
 * 2. localStorage cache (for offline/quick access)
 * 3. Hardcoded defaults (failsafe)
 */

const AppSettingsContext = createContext(null);

// Helper to safely read from localStorage
function readLocalStorage(key) {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Helper to safely write to localStorage
function writeLocalStorage(key, value) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // localStorage may be unavailable (iframe restrictions, quota exceeded, etc.)
    console.warn('Unable to write to localStorage - may be in restricted iframe context');
  }
}

// Helper to detect if we're in an iframe
function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe - accessing window.top throws
    return true;
  }
}

export function AppSettingsProvider({ children }) {
  const { supabase } = useSupabase();
  
  // Initialize from localStorage synchronously (if available) before async Supabase fetch
  // This provides immediate values for components that render before Supabase responds
  const initialRates = (() => {
    const localOverrides = readLocalStorage(LOCALSTORAGE_CONSTANTS_KEY);
    if (localOverrides?.marketRates) {
      return localOverrides.marketRates;
    }
    return DEFAULT_MARKET_RATES;
  })();
  
  const [marketRates, setMarketRates] = useState(initialRates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isIframe] = useState(isInIframe);
  const [initialized, setInitialized] = useState(false);

  // Load settings from Supabase
  const loadFromSupabase = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['market_rates']);

      if (fetchError) {
        console.error('Error fetching app_settings:', fetchError);
        return null;
      }

      if (data && data.length > 0) {
        const settings = {};
        data.forEach(row => {
          if (row.key === 'market_rates' && row.value) {
            settings.marketRates = row.value;
          }
        });
        return settings;
      }

      return null;
    } catch (err) {
      console.error('Failed to load app settings from Supabase:', err);
      return null;
    }
  }, [supabase]);

  // Initialize settings on mount
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      setError(null);

      // Try to load from Supabase first (source of truth)
      const supabaseSettings = await loadFromSupabase();

      if (!mounted) return;

      if (supabaseSettings?.marketRates) {
        // Got settings from Supabase
        setMarketRates(supabaseSettings.marketRates);
        
        // Update localStorage cache for components that still use getMarketRates()
        const currentOverrides = readLocalStorage(LOCALSTORAGE_CONSTANTS_KEY) || {};
        writeLocalStorage(LOCALSTORAGE_CONSTANTS_KEY, {
          ...currentOverrides,
          marketRates: supabaseSettings.marketRates,
        });
        
        // Settings loaded from Supabase successfully
      } else {
        // Fallback to localStorage (already loaded in initialRates, but update state if different)
        const localOverrides = readLocalStorage(LOCALSTORAGE_CONSTANTS_KEY);
        if (localOverrides?.marketRates) {
          setMarketRates(localOverrides.marketRates);
          // Settings loaded from localStorage fallback
        } else {
          // Use defaults
          // Using hardcoded defaults (Supabase and localStorage unavailable)
          setMarketRates(DEFAULT_MARKET_RATES);
        }
      }

      setLoading(false);
      setInitialized(true);
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadFromSupabase]);

  // Refresh settings (can be called after admin updates)
  const refreshSettings = useCallback(async () => {
    setLoading(true);
    const supabaseSettings = await loadFromSupabase();
    if (supabaseSettings?.marketRates) {
      setMarketRates(supabaseSettings.marketRates);
      
      // Update localStorage cache
      const currentOverrides = readLocalStorage(LOCALSTORAGE_CONSTANTS_KEY) || {};
      writeLocalStorage(LOCALSTORAGE_CONSTANTS_KEY, {
        ...currentOverrides,
        marketRates: supabaseSettings.marketRates,
      });
    }
    setLoading(false);
  }, [loadFromSupabase]);

  const value = {
    marketRates,
    loading,
    error,
    isIframe,
    initialized,
    refreshSettings,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

AppSettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access app settings
 * Returns market rates and loading state
 */
export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}

/**
 * Hook specifically for market rates
 * Returns { STANDARD_BBR, STRESS_BBR, CURRENT_MVR } with proper defaults
 */
export function useMarketRates() {
  const { marketRates, loading } = useAppSettings();
  
  return {
    STANDARD_BBR: marketRates?.STANDARD_BBR ?? DEFAULT_MARKET_RATES.STANDARD_BBR,
    STRESS_BBR: marketRates?.STRESS_BBR ?? DEFAULT_MARKET_RATES.STRESS_BBR,
    CURRENT_MVR: marketRates?.CURRENT_MVR ?? DEFAULT_MARKET_RATES.CURRENT_MVR,
    loading,
  };
}

export default AppSettingsContext;
