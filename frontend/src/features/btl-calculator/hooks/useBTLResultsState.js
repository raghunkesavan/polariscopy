/**
 * BTL Results State Hook
 * Manages complex state for results table including sliders, editable fields, and optimized values
 */

import { useState, useRef } from 'react';

export function useBTLResultsState() {
  // Slider controls for results - per-column state
  const [rolledMonthsPerColumn, setRolledMonthsPerColumn] = useState({});
  const [deferredInterestPerColumn, setDeferredInterestPerColumn] = useState({});
  
  // Track whether manual mode has been activated (stays true until reset)
  const [manualModeActivePerColumn, setManualModeActivePerColumn] = useState({});
  
  // Optimized values from calculation engine - per-column state
  const [optimizedRolledPerColumn, setOptimizedRolledPerColumn] = useState({});
  const [optimizedDeferredPerColumn, setOptimizedDeferredPerColumn] = useState({});
  
  // Ref to collect optimized values during render without causing re-renders
  const optimizedValuesRef = useRef({ rolled: {}, deferred: {} });

  // Editable rate and product fee overrides - per-column state
  const [ratesOverrides, setRatesOverrides] = useState({});
  const [productFeeOverrides, setProductFeeOverrides] = useState({});

  /**
   * Update rolled months for a specific column
   */
  const updateRolledMonths = (columnKey, value) => {
    setRolledMonthsPerColumn(prev => ({ ...prev, [columnKey]: value }));
    setManualModeActivePerColumn(prev => ({ ...prev, [columnKey]: true }));
  };

  /**
   * Update deferred interest for a specific column
   */
  const updateDeferredInterest = (columnKey, value) => {
    setDeferredInterestPerColumn(prev => ({ ...prev, [columnKey]: value }));
    setManualModeActivePerColumn(prev => ({ ...prev, [columnKey]: true }));
  };

  /**
   * Reset sliders for a specific column to optimized values
   */
  const resetSlidersForColumn = (columnKey) => {
    setRolledMonthsPerColumn(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
    setDeferredInterestPerColumn(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
    setManualModeActivePerColumn(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  /**
   * Update rate override for a specific column
   */
  const updateRateOverride = (columnKey, value) => {
    setRatesOverrides(prev => ({ ...prev, [columnKey]: value }));
  };

  /**
   * Reset rate override for a specific column
   */
  const resetRateOverride = (columnKey) => {
    setRatesOverrides(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  /**
   * Update product fee override for a specific column
   */
  const updateProductFeeOverride = (columnKey, value) => {
    setProductFeeOverrides(prev => ({ ...prev, [columnKey]: value }));
  };

  /**
   * Reset product fee override for a specific column
   */
  const resetProductFeeOverride = (columnKey) => {
    setProductFeeOverrides(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  /**
   * Store optimized values from calculation engine
   * Called during render to collect values without triggering re-renders
   */
  const storeOptimizedValues = (columnKey, rolledMonths, deferredCapPct) => {
    optimizedValuesRef.current.rolled[columnKey] = rolledMonths;
    optimizedValuesRef.current.deferred[columnKey] = deferredCapPct;
  };

  /**
   * Sync optimized values from ref to state
   * Called after render cycle completes
   */
  const syncOptimizedValues = () => {
    setOptimizedRolledPerColumn(optimizedValuesRef.current.rolled);
    setOptimizedDeferredPerColumn(optimizedValuesRef.current.deferred);
  };

  /**
   * Reset all optimized values (start of new calculation)
   */
  const resetOptimizedValues = () => {
    optimizedValuesRef.current = { rolled: {}, deferred: {} };
  };

  /**
   * Clear all results state (when clearing results)
   */
  const clearAllResults = () => {
    setRolledMonthsPerColumn({});
    setDeferredInterestPerColumn({});
    setManualModeActivePerColumn({});
    setOptimizedRolledPerColumn({});
    setOptimizedDeferredPerColumn({});
    setRatesOverrides({});
    setProductFeeOverrides({});
    optimizedValuesRef.current = { rolled: {}, deferred: {} };
  };

  /**
   * Migrate old column keys to new format with range prefix
   * Old format: "Fee: 2%" 
   * New format: "Specialist - Fee: 2%" or "Core - Fee: 2%"
   * 
   * @param {Object} overrides - Original overrides object
   * @param {string} selectedRange - Current selected range ('specialist' or 'core')
   * @returns {Object} Migrated overrides with new keys
   */
  const migrateColumnKeys = (overrides, selectedRange) => {
    if (!overrides || typeof overrides !== 'object') return overrides;
    
    const rangePrefix = selectedRange === 'specialist' ? 'Specialist' : 'Core';
    const migratedOverrides = {};
    
    Object.entries(overrides).forEach(([key, value]) => {
      // Check if key already has range prefix (new format)
      if (key.startsWith('Specialist - ') || key.startsWith('Core - ')) {
        // Already in new format - keep as is
        migratedOverrides[key] = value;
      } else if (key.startsWith('Fee: ')) {
        // Old format - add range prefix based on current selected range
        const newKey = `${rangePrefix} - ${key}`;
        migratedOverrides[newKey] = value;
      } else {
        // Unknown format - keep as is to avoid data loss
        migratedOverrides[key] = value;
      }
    });
    
    return migratedOverrides;
  };

  /**
   * Load results state from quote data
   * Includes backward compatibility for old column key format
   * 
   * @param {Object} quote - Quote data from database
   * @param {string} selectedRange - Current selected range ('specialist' or 'core')
   */
  const loadResultsFromQuote = (quote, selectedRange = 'specialist') => {
    // Load slider overrides if available
    if (quote.slider_overrides) {
      const { rolled, deferred } = quote.slider_overrides;
      
      // Migrate keys to new format with range prefix
      const migratedRolled = migrateColumnKeys(rolled, selectedRange);
      const migratedDeferred = migrateColumnKeys(deferred, selectedRange);
      
      if (migratedRolled) setRolledMonthsPerColumn(migratedRolled);
      if (migratedDeferred) setDeferredInterestPerColumn(migratedDeferred);
      
      // Mark manual mode for columns with overrides
      const manualColumns = {};
      Object.keys(migratedRolled || {}).forEach(key => { manualColumns[key] = true; });
      Object.keys(migratedDeferred || {}).forEach(key => { manualColumns[key] = true; });
      setManualModeActivePerColumn(manualColumns);
    }

    // Load rate overrides with migration
    if (quote.rates_overrides) {
      const migratedRatesOverrides = migrateColumnKeys(quote.rates_overrides, selectedRange);
      setRatesOverrides(migratedRatesOverrides);
    }

    // Load product fee overrides with migration
    if (quote.product_fee_overrides) {
      const migratedProductFeeOverrides = migrateColumnKeys(quote.product_fee_overrides, selectedRange);
      setProductFeeOverrides(migratedProductFeeOverrides);
    }
  };

  /**
   * Get results state for saving to quote
   */
  const getResultsForSave = () => {
    return {
      slider_overrides: {
        rolled: rolledMonthsPerColumn,
        deferred: deferredInterestPerColumn
      },
      rates_overrides: ratesOverrides,
      product_fee_overrides: productFeeOverrides
    };
  };

  return {
    // State values
    rolledMonthsPerColumn,
    deferredInterestPerColumn,
    manualModeActivePerColumn,
    optimizedRolledPerColumn,
    optimizedDeferredPerColumn,
    optimizedValuesRef,
    ratesOverrides,
    productFeeOverrides,
    
    // Slider functions
    updateRolledMonths,
    updateDeferredInterest,
    resetSlidersForColumn,
    
    // Rate override functions
    updateRateOverride,
    resetRateOverride,
    
    // Product fee override functions
    updateProductFeeOverride,
    resetProductFeeOverride,
    
    // Optimized values functions
    storeOptimizedValues,
    syncOptimizedValues,
    resetOptimizedValues,
    
    // Lifecycle functions
    clearAllResults,
    loadResultsFromQuote,
    getResultsForSave
  };
}
