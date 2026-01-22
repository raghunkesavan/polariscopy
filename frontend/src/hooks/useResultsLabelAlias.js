/**
 * Hook to get display labels for results table rows
 * Labels can be customized via global settings (GlobalSettings UI)
 * 
 * Usage:
 *   const { getLabel } = useResultsLabelAlias('btl'); // or 'bridge' or 'core'
 *   const displayLabel = getLabel('Gross Loan'); // Returns customized label or original
 */

import { useState, useEffect, useCallback } from 'react';
import { LOCALSTORAGE_CONSTANTS_KEY } from '../config/constants';
import { useSupabase } from '../contexts/SupabaseContext';

// Default label aliases - returns the original label by default
// All label alias configuration is managed in GlobalSettings.jsx
const DEFAULT_LABEL_ALIASES = {};

export function useResultsLabelAlias(calculatorType = 'btl') {
  const { supabase } = useSupabase();
  const [labelAliases, setLabelAliases] = useState(DEFAULT_LABEL_ALIASES);

  // Load overrides from Supabase and localStorage on mount
  useEffect(() => {
    const loadOverrides = async () => {
      try {
        // Load from results_configuration table for specific calculator type
        if (supabase && calculatorType) {
          const { data, error } = await supabase
            .from('results_configuration')
            .select('config')
            .eq('key', 'label_aliases')
            .eq('calculator_type', calculatorType)
            .maybeSingle();

          if (!error && data && data.config) {
            setLabelAliases(data.config);
            
            // Update localStorage for consistency
            let existingConstants = {};
            try {
              const stored = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
              if (stored) existingConstants = JSON.parse(stored);
            } catch (e) { /* ignore */ }
            
            localStorage.setItem(LOCALSTORAGE_CONSTANTS_KEY, JSON.stringify({
              ...existingConstants,
              [`resultsLabelAliases_${calculatorType}`]: data.config
            }));
            return;
          }
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const key = `resultsLabelAliases_${calculatorType}`;
          if (parsed[key] && typeof parsed[key] === 'object') {
            setLabelAliases(parsed[key]);
          }
        }
      } catch (e) {
        console.warn('Failed to load label aliases:', e);
      }
    };

    loadOverrides();

    // Listen for storage events (when another tab updates constants)
    const handleStorageChange = (e) => {
      if (e.key === LOCALSTORAGE_CONSTANTS_KEY) {
        loadOverrides();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    const handleCustomEvent = () => loadOverrides();
    window.addEventListener('constantsUpdated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('constantsUpdated', handleCustomEvent);
    };
  }, [supabase, calculatorType]);

  /**
   * Get the display label for a field
   * @param {string} internalName - The internal field name
   * @returns {string} - The display label (alias if configured, otherwise original)
   */
  const getLabel = useCallback((internalName) => {
    const result = labelAliases[internalName] || internalName;
    return result;
  }, [labelAliases]);

  /**
   * Get all label aliases (for admin UI)
   */
  const getAllAliases = useCallback(() => {
    return { ...labelAliases };
  }, [labelAliases]);

  return {
    getLabel,
    getAllAliases,
    labelAliases
  };
}

export default useResultsLabelAlias;
