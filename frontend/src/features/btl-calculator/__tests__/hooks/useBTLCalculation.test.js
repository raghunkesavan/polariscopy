/**
 * useBTLCalculation Hook Tests
 * 
 * Tests for useBTLCalculation custom hook covering:
 * - Initial state
 * - validateInputs function (all validation rules)
 * - calculate function (success scenarios)
 * - calculate function (error scenarios)
 * - clearResults function
 * - recalculateWithSliders function
 * - Integration with computeBTLLoan utility
 * - Loading states
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBTLCalculation } from '../../hooks/useBTLCalculation';
import * as btlEngine from '../../../../utils/btlCalculationEngine';
import * as rateFiltering from '../../../../utils/calculator/rateFiltering';

// Mock the calculation engine
vi.mock('../../../../utils/btlCalculationEngine', () => ({
  computeBTLLoan: vi.fn()
}));

vi.mock('../../../utils/calculator/rateFiltering', () => ({
  computeTierFromAnswers: vi.fn()
}));

describe('useBTLCalculation Hook', () => {
  const mockRatesData = [
    {
      id: 1,
      product_scope: 'Whole Market',
      product_range: 'Core',
      product_type: 'BTL',
      rate: 4.5,
      tier: 2
    },
    {
      id: 2,
      product_scope: 'Whole Market',
      product_range: 'Specialist',
      product_type: 'BTL',
      rate: 5.0,
      tier: 2
    },
    {
      id: 3,
      product_scope: 'Select Panel',
      product_range: 'Core',
      product_type: 'BTL',
      rate: 4.3,
      tier: 2
    }
  ];

  const validInputs = {
    propertyValue: 250000,
    monthlyRent: 1200,
    topSlicing: 0,
    loanType: 'maxGross',
    productScope: 'Whole Market',
    selectedRange: 'Core',
    productType: 'BTL',
    maxLtvInput: 75,
    addFeesToggle: false,
    feeCalculationType: 'percentage',
    additionalFeeAmount: 0,
    retentionChoice: 'No',
    retentionLtv: 75,
    answers: { Q1: 'Yes', Q2: 'No' },
    rolledMonthsPerColumn: {},
    deferredInterestPerColumn: {}
  };

  const mockBrokerSettings = {
    procFee: 0,
    lenderLegalFee: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rateFiltering.computeTierFromAnswers.mockReturnValue(2);
    btlEngine.computeBTLLoan.mockReturnValue([
      { grossLoan: 187500, netLoan: 187500, ltv: 75, rate: 4.5 }
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== INITIAL STATE TESTS ====================

  describe('Initial State', () => {
    it('should initialize with empty results', () => {
      const { result } = renderHook(() => useBTLCalculation());

      expect(result.current.results).toEqual([]);
    });

    it('should initialize with empty relevantRates', () => {
      const { result } = renderHook(() => useBTLCalculation());

      expect(result.current.relevantRates).toEqual([]);
    });

    it('should initialize with isCalculating as false', () => {
      const { result } = renderHook(() => useBTLCalculation());

      expect(result.current.isCalculating).toBe(false);
    });

    it('should initialize with no error', () => {
      const { result } = renderHook(() => useBTLCalculation());

      expect(result.current.error).toBeNull();
    });

    it('should initialize with null lastCalculationInputs', () => {
      const { result } = renderHook(() => useBTLCalculation());

      expect(result.current.lastCalculationInputs).toBeNull();
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useBTLCalculation());

      expect(typeof result.current.calculate).toBe('function');
      expect(typeof result.current.clearResults).toBe('function');
      expect(typeof result.current.recalculateWithSliders).toBe('function');
    });
  });

  // ==================== VALIDATE INPUTS TESTS ====================

  describe('validateInputs', () => {
    it('should return null for valid inputs', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toBeNull();
    });

    it('should return error when propertyValue is missing', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, propertyValue: 0 };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Property value must be greater than 0');
    });

    it('should return error when propertyValue is negative', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, propertyValue: -1000 };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Property value must be greater than 0');
    });

    it('should return error when monthlyRent is missing', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, monthlyRent: 0 };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Monthly rent must be greater than 0');
    });

    it('should return error when monthlyRent is negative', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, monthlyRent: -500 };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Monthly rent must be greater than 0');
    });

    it('should return error when loanType is missing', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, loanType: '' };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Please select a loan calculation type');
    });

    it('should return error when productScope is missing', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, productScope: '' };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Please select a product scope');
    });

    it('should return error when loanType is specificGross but specificGrossLoan is missing', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, loanType: 'specificGross', specificGrossLoan: 0 };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Specific gross loan must be greater than 0');
    });

    it('should return error when loanType is specificNet but specificNetLoan is missing', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, loanType: 'specificNet', specificNetLoan: 0 };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Specific net loan must be greater than 0');
    });

    it('should return multiple errors concatenated', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, propertyValue: 0, monthlyRent: 0, loanType: '' };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Property value must be greater than 0');
      expect(result.current.error).toContain('Monthly rent must be greater than 0');
      expect(result.current.error).toContain('Please select a loan calculation type');
    });
  });

  // ==================== CALCULATE FUNCTION TESTS ====================

  describe('calculate function', () => {
    it('should set isCalculating to true during calculation', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      let calculatingDuringCall = false;

      await act(async () => {
        const promise = result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
        calculatingDuringCall = result.current.isCalculating;
        await promise;
      });

      expect(calculatingDuringCall).toBe(true);
    });

    it('should set isCalculating to false after calculation completes', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.isCalculating).toBe(false);
    });

    it('should call computeTierFromAnswers with answers', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(rateFiltering.computeTierFromAnswers).toHaveBeenCalledWith(validInputs.answers);
    });

    it('should filter rates by product scope', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.relevantRates).toHaveLength(2); // Only Whole Market rates
      expect(result.current.relevantRates.every(r => r.product_scope === 'Whole Market')).toBe(true);
    });

    it('should filter rates by product range', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.relevantRates).toHaveLength(2);
      const coreRates = result.current.relevantRates.filter(r => r.product_range === 'Core');
      expect(coreRates).toHaveLength(1); // Only 1 Core rate in Whole Market
    });

    it('should call computeBTLLoan with filtered rates and params', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(btlEngine.computeBTLLoan).toHaveBeenCalled();
      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      
      // Check rates are filtered
      expect(callArgs[0].every(r => r.product_scope === 'Whole Market')).toBe(true);
      
      // Check params structure
      expect(callArgs[1]).toMatchObject({
        propertyValue: 250000,
        monthlyRent: 1200,
        topSlicing: 0,
        loanCalculationRequested: 'maxGross',
        tier: 2
      });
    });

    it('should store results from computeBTLLoan', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const mockResults = [
        { grossLoan: 187500, netLoan: 187500, ltv: 75 },
        { grossLoan: 189000, netLoan: 187110, ltv: 75.6 }
      ];
      btlEngine.computeBTLLoan.mockReturnValue(mockResults);

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.results).toEqual(mockResults);
    });

    it('should store lastCalculationInputs', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.lastCalculationInputs).toEqual(validInputs);
    });

    it('should return calculated results', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const mockResults = [{ grossLoan: 187500 }];
      btlEngine.computeBTLLoan.mockReturnValue(mockResults);

      let returnedResults;
      await act(async () => {
        returnedResults = await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(returnedResults).toEqual(mockResults);
    });

    it('should handle specificGross loan type', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const specificInputs = {
        ...validInputs,
        loanType: 'specificGross',
        specificGrossLoan: 200000
      };

      await act(async () => {
        await result.current.calculate(specificInputs, mockRatesData, mockBrokerSettings);
      });

      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].specificGrossLoan).toBe(200000);
    });

    it('should handle specificNet loan type', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const specificInputs = {
        ...validInputs,
        loanType: 'specificNet',
        specificNetLoan: 195000
      };

      await act(async () => {
        await result.current.calculate(specificInputs, mockRatesData, mockBrokerSettings);
      });

      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].specificNetLoan).toBe(195000);
    });

    it('should handle retention choice', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const retentionInputs = {
        ...validInputs,
        retentionChoice: 'Yes',
        retentionLtv: 65
      };

      await act(async () => {
        await result.current.calculate(retentionInputs, mockRatesData, mockBrokerSettings);
      });

      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].retentionChoice).toBe('Yes');
      expect(callArgs[1].retentionLtv).toBe(65);
    });

    it('should handle additional fees', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const feesInputs = {
        ...validInputs,
        addFeesToggle: true,
        feeCalculationType: 'fixed',
        additionalFeeAmount: 500
      };

      await act(async () => {
        await result.current.calculate(feesInputs, mockRatesData, mockBrokerSettings);
      });

      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].addFeesToggle).toBe(true);
      expect(callArgs[1].feeCalculationType).toBe('fixed');
      expect(callArgs[1].additionalFeeAmount).toBe(500);
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should set error when validation fails', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, propertyValue: 0 };

      await act(async () => {
        await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.results).toEqual([]);
    });

    it('should return null when validation fails', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const invalidInputs = { ...validInputs, propertyValue: 0 };

      let returnValue;
      await act(async () => {
        returnValue = await result.current.calculate(invalidInputs, mockRatesData, mockBrokerSettings);
      });

      expect(returnValue).toBeNull();
    });

    it('should handle computeBTLLoan throwing error', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      btlEngine.computeBTLLoan.mockImplementation(() => {
        throw new Error('Calculation engine error');
      });

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Calculation engine error');
      expect(result.current.isCalculating).toBe(false);
    });

    it('should set generic error message when error has no message', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      btlEngine.computeBTLLoan.mockImplementation(() => {
        throw {};
      });

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toContain('Calculation failed');
    });

    it('should clear previous error on successful calculation', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      // First, trigger an error
      await act(async () => {
        await result.current.calculate({ ...validInputs, propertyValue: 0 }, mockRatesData, mockBrokerSettings);
      });
      expect(result.current.error).toBeTruthy();

      // Then, do a valid calculation
      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==================== CLEAR RESULTS TESTS ====================

  describe('clearResults function', () => {
    it('should clear results array', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      // First calculate
      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });
      expect(result.current.results.length).toBeGreaterThan(0);

      // Then clear
      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toEqual([]);
    });

    it('should clear relevantRates array', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });
      expect(result.current.relevantRates.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.relevantRates).toEqual([]);
    });

    it('should clear error', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate({ ...validInputs, propertyValue: 0 }, mockRatesData, mockBrokerSettings);
      });
      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear lastCalculationInputs', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });
      expect(result.current.lastCalculationInputs).toBeTruthy();

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.lastCalculationInputs).toBeNull();
    });
  });

  // ==================== RECALCULATE WITH SLIDERS TESTS ====================

  describe('recalculateWithSliders function', () => {
    it('should use lastCalculationInputs when available', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      // First calculation
      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      // Clear mock to check next call
      btlEngine.computeBTLLoan.mockClear();

      // Recalculate with sliders
      const sliderInputs = {
        rolledMonthsPerColumn: { col0: 12 },
        deferredInterestPerColumn: { col0: 50 },
        manualModeActivePerColumn: { col0: true }
      };

      await act(async () => {
        await result.current.recalculateWithSliders(sliderInputs, mockRatesData, mockBrokerSettings);
      });

      // Should be called with merged inputs
      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].propertyValue).toBe(validInputs.propertyValue);
      expect(callArgs[1].rolledMonthsPerColumn).toEqual(sliderInputs.rolledMonthsPerColumn);
      expect(callArgs[1].deferredInterestPerColumn).toEqual(sliderInputs.deferredInterestPerColumn);
    });

    it('should perform regular calculate when no lastCalculationInputs', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      const sliderInputs = {
        ...validInputs,
        rolledMonthsPerColumn: { col0: 12 },
        deferredInterestPerColumn: { col0: 50 }
      };

      await act(async () => {
        await result.current.recalculateWithSliders(sliderInputs, mockRatesData, mockBrokerSettings);
      });

      expect(btlEngine.computeBTLLoan).toHaveBeenCalled();
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    it('should merge slider values with lastCalculationInputs', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      // Initial calculation
      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      btlEngine.computeBTLLoan.mockClear();

      // Update only sliders
      const sliderUpdates = {
        rolledMonthsPerColumn: { col0: 18 },
        deferredInterestPerColumn: { col0: 75 },
        manualModeActivePerColumn: { col0: true }
      };

      await act(async () => {
        await result.current.recalculateWithSliders(sliderUpdates, mockRatesData, mockBrokerSettings);
      });

      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      
      // Original values preserved
      expect(callArgs[1].propertyValue).toBe(250000);
      expect(callArgs[1].monthlyRent).toBe(1200);
      
      // Slider values updated
      expect(callArgs[1].rolledMonthsPerColumn).toEqual({ col0: 18 });
      expect(callArgs[1].deferredInterestPerColumn).toEqual({ col0: 75 });
      expect(callArgs[1].manualModeActivePerColumn).toEqual({ col0: true });
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle empty ratesData array', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      btlEngine.computeBTLLoan.mockReturnValue([]);

      await act(async () => {
        await result.current.calculate(validInputs, [], mockBrokerSettings);
      });

      expect(result.current.relevantRates).toEqual([]);
      expect(result.current.results).toEqual([]);
    });

    it('should handle undefined brokerSettings', async () => {
      const { result } = renderHook(() => useBTLCalculation());

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, undefined);
      });

      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].brokerSettings).toEqual({});
    });

    it('should handle null computeBTLLoan return', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      btlEngine.computeBTLLoan.mockReturnValue(null);

      await act(async () => {
        await result.current.calculate(validInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.results).toEqual([]);
    });

    it('should handle missing optional inputs', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const minimalInputs = {
        propertyValue: 250000,
        monthlyRent: 1200,
        loanType: 'maxGross',
        productScope: 'Whole Market',
        selectedRange: 'Core',
        answers: {}
      };

      await act(async () => {
        await result.current.calculate(minimalInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toBeNull();
      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].topSlicing).toBe(0);
      expect(callArgs[1].additionalFeeAmount).toBe(0);
    });

    it('should handle very large numbers', async () => {
      const { result } = renderHook(() => useBTLCalculation());
      const largeInputs = {
        ...validInputs,
        propertyValue: 10000000,
        monthlyRent: 50000
      };

      await act(async () => {
        await result.current.calculate(largeInputs, mockRatesData, mockBrokerSettings);
      });

      expect(result.current.error).toBeNull();
      const callArgs = btlEngine.computeBTLLoan.mock.calls[0];
      expect(callArgs[1].propertyValue).toBe(10000000);
      expect(callArgs[1].monthlyRent).toBe(50000);
    });
  });
});
