/**
 * Custom hook for BTL calculation logic
 * Manages the calculation process, results, and loading states
 */

import { useState, useCallback, useEffect } from 'react';
import { computeBTLLoan } from '../../../utils/btlCalculationEngine';
import { computeTierFromAnswers } from '../../../utils/calculator/rateFiltering';

export function useBTLCalculation() {
  const [results, setResults] = useState([]);
  const [relevantRates, setRelevantRates] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [lastCalculationInputs, setLastCalculationInputs] = useState(null);

  /**
   * Validate inputs before calculation
   */
  const validateInputs = useCallback((inputs) => {
    const errors = [];

    if (!inputs.propertyValue || parseFloat(inputs.propertyValue) <= 0) {
      errors.push('Property value must be greater than 0');
    }

    if (!inputs.monthlyRent || parseFloat(inputs.monthlyRent) <= 0) {
      errors.push('Monthly rent must be greater than 0');
    }

    if (!inputs.loanType) {
      errors.push('Please select a loan calculation type');
    }

    if (!inputs.productScope) {
      errors.push('Please select a product scope');
    }

    if (inputs.loanType === 'specificGross' && (!inputs.specificGrossLoan || parseFloat(inputs.specificGrossLoan) <= 0)) {
      errors.push('Specific gross loan must be greater than 0');
    }

    if (inputs.loanType === 'specificNet' && (!inputs.specificNetLoan || parseFloat(inputs.specificNetLoan) <= 0)) {
      errors.push('Specific net loan must be greater than 0');
    }

    return errors.length > 0 ? errors.join(', ') : null;
  }, []);

  /**
   * Perform BTL calculation
   */
  const calculate = useCallback(async (inputs, ratesData, brokerSettings) => {
    setError(null);
    
    // Validate inputs
    const validationError = validateInputs(inputs);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsCalculating(true);
    
    try {
      // Compute tier from criteria answers
      const tier = computeTierFromAnswers(inputs.answers);

      // Filter rates based on property (scope), tier, and product type
      const filteredRates = ratesData.filter(rate => {
        // Check property match (maps to product scope)
        // rates_flat uses 'property' field (Residential, Commercial, Semi-Commercial, Core)
        if (rate.property && rate.property !== inputs.productScope) return false;
        
        // Check tier match
        if (rate.tier && tier && rate.tier !== String(tier)) return false;
        
        // Check product type match if specified
        // rates_flat uses 'product' field (2yr Fix, 3yr Fix, 2yr Tracker)
        if (inputs.productType && rate.product !== inputs.productType) return false;
        
        return true;
      });

      setRelevantRates(filteredRates);

      // Extract unique product_fee values from filtered rates to create columns (normalize to numbers)
      const uniqueFees = [
        ...new Set(
          filteredRates
            .map(r => Number(r.product_fee))
            .filter(f => Number.isFinite(f))
        )
      ].sort((a, b) => b - a);

      if (uniqueFees.length === 0) {
        setResults([]);
        setLastCalculationInputs(inputs);
        return [];
      }

      // Calculate results for each fee column
      const calculatedResults = uniqueFees.map(fee => {
        // Find the best rate for this specific product and fee.
        // If multiple rows match (e.g., data duplication across tiers), prefer:
        // 1) Exact tier match
        // 2) Higher max_ltv
        // 3) Most recent updated_at
        // 4) Highest id (as final tiebreak)
        const candidates = filteredRates.filter(r =>
          r.product === inputs.productType &&
          Number(r.product_fee) === Number(fee)
        );

        let selectedRate = null;
        if (candidates.length === 1) {
          selectedRate = candidates[0];
        } else if (candidates.length > 1) {
          const tierStr = String(tier);
          const exactTier = candidates.filter(r => String(r.tier) === tierStr);
          const pool = exactTier.length > 0 ? exactTier : candidates;
          selectedRate = pool.sort((a, b) => {
            const aLtv = Number(a.max_ltv) || 0;
            const bLtv = Number(b.max_ltv) || 0;
            if (bLtv !== aLtv) return bLtv - aLtv;
            const aUpd = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const bUpd = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            if (bUpd !== aUpd) return bUpd - aUpd;
            const aId = Number(a.id) || 0;
            const bId = Number(b.id) || 0;
            return bId - aId;
          })[0];
        }

        if (!selectedRate) {
          return null;
        }

        // Prepare calculation parameters for this column
        const colKey = `Fee: ${fee}%`;
        const calculationParams = {
          colKey,
          selectedRate,
          propertyValue: inputs.propertyValue,
          monthlyRent: inputs.monthlyRent,
          topSlicing: inputs.topSlicing || 0,
          loanType: inputs.loanType,
          specificGrossLoan: inputs.specificGrossLoan,
          specificNetLoan: inputs.specificNetLoan,
          maxLtvInput: inputs.maxLtvInput || 75,
          productType: inputs.productType,
          productScope: inputs.productScope,
          tier: tier,
          selectedRange: inputs.selectedRange,
          productFeePercent: fee,
          feeOverrides: inputs.productFeeOverrides || {},
          manualRolled: inputs.rolledMonthsPerColumn?.[colKey],
          manualDeferred: inputs.deferredInterestPerColumn?.[colKey],
          retentionChoice: inputs.retentionChoice,
          retentionLtv: inputs.retentionLtv || 75,
          brokerRoute: brokerSettings?.brokerRoute,
          procFeePct: brokerSettings?.procFeePct,
          brokerFeePct: brokerSettings?.brokerFeePct,
          brokerFeeFlat: brokerSettings?.brokerFeeFlat,
        };

        // Perform calculation using the engine
        return computeBTLLoan(calculationParams);
      }).filter(result => result !== null);

      setResults(calculatedResults || []);
      setLastCalculationInputs(inputs);
      
      return calculatedResults;
    } catch (err) {
      // Surface concise error to UI; avoid noisy console logs in production
      setError(err.message || 'Calculation failed. Please check your inputs.');
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [validateInputs]);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setRelevantRates([]);
    setError(null);
    setLastCalculationInputs(null);
  }, []);

  /**
   * Recalculate with new slider values
   * (Used when user adjusts rolled months or deferred interest)
   */
  const recalculateWithSliders = useCallback((inputs, ratesData, brokerSettings) => {
    // Only recalculate if we have previous calculation inputs
    if (!lastCalculationInputs) {
      return calculate(inputs, ratesData, brokerSettings);
    }

    // Merge slider updates with last calculation inputs
    const updatedInputs = {
      ...lastCalculationInputs,
      rolledMonthsPerColumn: inputs.rolledMonthsPerColumn,
      deferredInterestPerColumn: inputs.deferredInterestPerColumn,
      manualModeActivePerColumn: inputs.manualModeActivePerColumn
    };

    return calculate(updatedInputs, ratesData, brokerSettings);
  }, [lastCalculationInputs, calculate]);

  return {
    results,
    relevantRates,
    isCalculating,
    error,
    calculate,
    validateInputs,
    clearResults,
    recalculateWithSliders,
    lastCalculationInputs
  };
}
