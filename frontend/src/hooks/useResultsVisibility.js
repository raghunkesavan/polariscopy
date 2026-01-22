import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

/**
 * Custom hook to manage results table row visibility settings
 * @param {string} calculatorType - 'btl', 'bridge', or 'core'
 * @returns {Object} - { visibleRows: Object, isRowVisible: Function, loading: boolean }
 */
export function useResultsVisibility(calculatorType) {
  const { supabase } = useSupabase();
  const [visibleRows, setVisibleRows] = useState({});
  const [loading, setLoading] = useState(true);

  // Load visibility settings from localStorage first, then Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try localStorage first for immediate access
        const localData = localStorage.getItem('results_table_visibility');
        if (localData) {
          const settings = JSON.parse(localData);
          const calcSettings = calculatorType === 'btl' ? settings.btl : 
                              calculatorType === 'bridge' ? settings.bridge :
                              calculatorType === 'core' ? settings.core : null;
          if (calcSettings) {
            setVisibleRows(calcSettings);
            setLoading(false);
            return;
          }
        }

        // Fallback to Supabase results_configuration table
        if (supabase) {
          const { data, error } = await supabase
            .from('results_configuration')
            .select('config')
            .eq('key', 'visibility')
            .eq('calculator_type', calculatorType)
            .maybeSingle();

          if (data && data.config) {
            setVisibleRows(data.config);
            // Also save to localStorage for faster future access
            const localData = localStorage.getItem('results_table_visibility');
            let allSettings = {};
            if (localData) {
              try {
                allSettings = JSON.parse(localData);
              } catch (e) { /* ignore */ }
            }
            allSettings[calculatorType] = data.config;
            localStorage.setItem('results_table_visibility', JSON.stringify(allSettings));
          }
        }
      } catch (err) {
        // Error loading settings
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [supabase, calculatorType]);

  // Listen for storage events to update when settings change
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'results_table_visibility' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          const calcSettings = calculatorType === 'btl' ? settings.btl : 
                              calculatorType === 'bridge' ? settings.bridge :
                              calculatorType === 'core' ? settings.core : null;
          if (calcSettings) {
            setVisibleRows(calcSettings);
          }
        } catch (err) {
          // Error parsing storage event
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [calculatorType]);

  /**
   * Check if a specific row should be visible
   * @param {string} rowName - Name of the row to check
   * @returns {boolean} - true if visible, false otherwise. Defaults to true if no settings found
   */
  const isRowVisible = (rowName) => {
    // If no settings loaded yet or settings are empty, show all rows by default
    if (Object.keys(visibleRows).length === 0) {
      return true;
    }
    // Return the visibility setting, default to true if not found
    return visibleRows[rowName] !== false;
  };

  return {
    visibleRows,
    isRowVisible,
    loading
  };
}
