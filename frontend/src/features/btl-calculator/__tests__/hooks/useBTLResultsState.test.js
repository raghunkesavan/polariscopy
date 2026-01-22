/**
 * Tests for useBTLResultsState hook
 * Tests slider state, overrides, and optimized values management
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useBTLResultsState } from '../../hooks/useBTLResultsState';

describe('useBTLResultsState', () => {
  let result;

  beforeEach(() => {
    const { result: hookResult } = renderHook(() => useBTLResultsState());
    result = hookResult;
  });

  describe('Initial State', () => {
    it('should initialize with empty slider states', () => {
      expect(result.current.rolledMonthsPerColumn).toEqual({});
      expect(result.current.deferredInterestPerColumn).toEqual({});
      expect(result.current.manualModeActivePerColumn).toEqual({});
    });

    it('should initialize with empty override states', () => {
      expect(result.current.ratesOverrides).toEqual({});
      expect(result.current.productFeeOverrides).toEqual({});
    });

    it('should initialize with empty optimized states', () => {
      expect(result.current.optimizedRolledPerColumn).toEqual({});
      expect(result.current.optimizedDeferredPerColumn).toEqual({});
    });

    it('should initialize optimized values ref', () => {
      expect(result.current.optimizedValuesRef.current).toEqual({
        rolled: {},
        deferred: {}
      });
    });
  });

  describe('Slider State Management', () => {
    describe('updateRolledMonths', () => {
      it('should set rolled months for a column', () => {
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 12);
        });

        expect(result.current.rolledMonthsPerColumn['Fee: 2%']).toBe(12);
      });

      it('should activate manual mode when setting rolled months', () => {
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 10);
        });

        expect(result.current.manualModeActivePerColumn['Fee: 2%']).toBe(true);
      });

      it('should handle multiple columns independently', () => {
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 12);
          result.current.updateRolledMonths('Fee: 3%', 15);
        });

        expect(result.current.rolledMonthsPerColumn['Fee: 2%']).toBe(12);
        expect(result.current.rolledMonthsPerColumn['Fee: 3%']).toBe(15);
      });

      it('should update existing rolled months value', () => {
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 10);
        });
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 14);
        });

        expect(result.current.rolledMonthsPerColumn['Fee: 2%']).toBe(14);
      });
    });

    describe('updateDeferredInterest', () => {
      it('should set deferred interest for a column', () => {
        act(() => {
          result.current.updateDeferredInterest('Fee: 2%', 50);
        });

        expect(result.current.deferredInterestPerColumn['Fee: 2%']).toBe(50);
      });

      it('should activate manual mode when setting deferred interest', () => {
        act(() => {
          result.current.updateDeferredInterest('Fee: 2%', 75);
        });

        expect(result.current.manualModeActivePerColumn['Fee: 2%']).toBe(true);
      });

      it('should handle multiple columns independently', () => {
        act(() => {
          result.current.updateDeferredInterest('Fee: 2%', 50);
          result.current.updateDeferredInterest('Fee: 3%', 100);
        });

        expect(result.current.deferredInterestPerColumn['Fee: 2%']).toBe(50);
        expect(result.current.deferredInterestPerColumn['Fee: 3%']).toBe(100);
      });
    });

    describe('resetSlidersForColumn', () => {
      it('should clear rolled months for a column', () => {
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 12);
        });
        act(() => {
          result.current.resetSlidersForColumn('Fee: 2%');
        });

        expect(result.current.rolledMonthsPerColumn['Fee: 2%']).toBeUndefined();
      });

      it('should clear deferred interest for a column', () => {
        act(() => {
          result.current.updateDeferredInterest('Fee: 2%', 50);
        });
        act(() => {
          result.current.resetSlidersForColumn('Fee: 2%');
        });

        expect(result.current.deferredInterestPerColumn['Fee: 2%']).toBeUndefined();
      });

      it('should clear manual mode for a column', () => {
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 10);
        });
        act(() => {
          result.current.resetSlidersForColumn('Fee: 2%');
        });

        expect(result.current.manualModeActivePerColumn['Fee: 2%']).toBeUndefined();
      });

      it('should not affect other columns when resetting', () => {
        act(() => {
          result.current.updateRolledMonths('Fee: 2%', 12);
          result.current.updateRolledMonths('Fee: 3%', 15);
        });
        act(() => {
          result.current.resetSlidersForColumn('Fee: 2%');
        });

        expect(result.current.rolledMonthsPerColumn['Fee: 2%']).toBeUndefined();
        expect(result.current.rolledMonthsPerColumn['Fee: 3%']).toBe(15);
      });
    });
  });

  describe('Rate Override Management', () => {
    it('should set rate override for a column', () => {
      act(() => {
        result.current.updateRateOverride('Fee: 2%', '5.5');
      });

      expect(result.current.ratesOverrides['Fee: 2%']).toBe('5.5');
    });

    it('should handle multiple rate overrides', () => {
      act(() => {
        result.current.updateRateOverride('Fee: 2%', '5.5');
        result.current.updateRateOverride('Fee: 3%', '6.0');
      });

      expect(result.current.ratesOverrides['Fee: 2%']).toBe('5.5');
      expect(result.current.ratesOverrides['Fee: 3%']).toBe('6.0');
    });

    it('should reset rate override for a column', () => {
      act(() => {
        result.current.updateRateOverride('Fee: 2%', '5.5');
      });
      act(() => {
        result.current.resetRateOverride('Fee: 2%');
      });

      expect(result.current.ratesOverrides['Fee: 2%']).toBeUndefined();
    });

    it('should not affect other columns when resetting rate', () => {
      act(() => {
        result.current.updateRateOverride('Fee: 2%', '5.5');
        result.current.updateRateOverride('Fee: 3%', '6.0');
      });
      act(() => {
        result.current.resetRateOverride('Fee: 2%');
      });

      expect(result.current.ratesOverrides['Fee: 2%']).toBeUndefined();
      expect(result.current.ratesOverrides['Fee: 3%']).toBe('6.0');
    });
  });

  describe('Product Fee Override Management', () => {
    it('should set product fee override for a column', () => {
      act(() => {
        result.current.updateProductFeeOverride('Fee: 2%', '2.5');
      });

      expect(result.current.productFeeOverrides['Fee: 2%']).toBe('2.5');
    });

    it('should reset product fee override for a column', () => {
      act(() => {
        result.current.updateProductFeeOverride('Fee: 2%', '2.5');
      });
      act(() => {
        result.current.resetProductFeeOverride('Fee: 2%');
      });

      expect(result.current.productFeeOverrides['Fee: 2%']).toBeUndefined();
    });
  });

  describe('Optimized Values Management', () => {
    it('should store optimized values in ref', () => {
      act(() => {
        result.current.storeOptimizedValues('Fee: 2%', 12, 50);
      });

      expect(result.current.optimizedValuesRef.current.rolled['Fee: 2%']).toBe(12);
      expect(result.current.optimizedValuesRef.current.deferred['Fee: 2%']).toBe(50);
    });

    it('should sync optimized values to state', () => {
      act(() => {
        result.current.storeOptimizedValues('Fee: 2%', 10, 75);
        result.current.storeOptimizedValues('Fee: 3%', 15, 100);
      });
      act(() => {
        result.current.syncOptimizedValues();
      });

      expect(result.current.optimizedRolledPerColumn['Fee: 2%']).toBe(10);
      expect(result.current.optimizedDeferredPerColumn['Fee: 2%']).toBe(75);
      expect(result.current.optimizedRolledPerColumn['Fee: 3%']).toBe(15);
      expect(result.current.optimizedDeferredPerColumn['Fee: 3%']).toBe(100);
    });

    it('should reset optimized values', () => {
      act(() => {
        result.current.storeOptimizedValues('Fee: 2%', 12, 50);
      });
      act(() => {
        result.current.resetOptimizedValues();
      });

      expect(result.current.optimizedValuesRef.current).toEqual({
        rolled: {},
        deferred: {}
      });
    });
  });

  describe('clearAllResults', () => {
    it('should clear all slider states', () => {
      act(() => {
        result.current.updateRolledMonths('Fee: 2%', 12);
        result.current.updateDeferredInterest('Fee: 2%', 50);
      });
      act(() => {
        result.current.clearAllResults();
      });

      expect(result.current.rolledMonthsPerColumn).toEqual({});
      expect(result.current.deferredInterestPerColumn).toEqual({});
      expect(result.current.manualModeActivePerColumn).toEqual({});
    });

    it('should clear all overrides', () => {
      act(() => {
        result.current.updateRateOverride('Fee: 2%', '5.5');
        result.current.updateProductFeeOverride('Fee: 2%', '2.5');
      });
      act(() => {
        result.current.clearAllResults();
      });

      expect(result.current.ratesOverrides).toEqual({});
      expect(result.current.productFeeOverrides).toEqual({});
    });

    it('should clear all optimized values', () => {
      act(() => {
        result.current.storeOptimizedValues('Fee: 2%', 12, 50);
        result.current.syncOptimizedValues();
      });
      act(() => {
        result.current.clearAllResults();
      });

      expect(result.current.optimizedRolledPerColumn).toEqual({});
      expect(result.current.optimizedDeferredPerColumn).toEqual({});
      expect(result.current.optimizedValuesRef.current).toEqual({
        rolled: {},
        deferred: {}
      });
    });
  });

  describe('loadResultsFromQuote', () => {
    it('should load slider overrides from quote', () => {
      const mockQuote = {
        slider_overrides: {
          rolled: { 'Fee: 2%': 12, 'Fee: 3%': 15 },
          deferred: { 'Fee: 2%': 50, 'Fee: 3%': 75 }
        }
      };

      act(() => {
        result.current.loadResultsFromQuote(mockQuote);
      });

      expect(result.current.rolledMonthsPerColumn).toEqual({ 'Fee: 2%': 12, 'Fee: 3%': 15 });
      expect(result.current.deferredInterestPerColumn).toEqual({ 'Fee: 2%': 50, 'Fee: 3%': 75 });
    });

    it('should set manual mode for loaded overrides', () => {
      const mockQuote = {
        slider_overrides: {
          rolled: { 'Fee: 2%': 12 },
          deferred: { 'Fee: 2%': 50 }
        }
      };

      act(() => {
        result.current.loadResultsFromQuote(mockQuote);
      });

      expect(result.current.manualModeActivePerColumn['Fee: 2%']).toBe(true);
    });

    it('should load rate overrides from quote', () => {
      const mockQuote = {
        rates_overrides: {
          'Fee: 2%': '5.5',
          'Fee: 3%': '6.0'
        }
      };

      act(() => {
        result.current.loadResultsFromQuote(mockQuote);
      });

      expect(result.current.ratesOverrides).toEqual({
        'Fee: 2%': '5.5',
        'Fee: 3%': '6.0'
      });
    });

    it('should load product fee overrides from quote', () => {
      const mockQuote = {
        product_fee_overrides: {
          'Fee: 2%': '2.5'
        }
      };

      act(() => {
        result.current.loadResultsFromQuote(mockQuote);
      });

      expect(result.current.productFeeOverrides).toEqual({
        'Fee: 2%': '2.5'
      });
    });

    it('should handle missing slider_overrides gracefully', () => {
      const mockQuote = {
        rates_overrides: { 'Fee: 2%': '5.5' }
      };

      expect(() => {
        act(() => {
          result.current.loadResultsFromQuote(mockQuote);
        });
      }).not.toThrow();
    });
  });

  describe('getResultsForSave', () => {
    it('should return slider overrides in save format', () => {
      act(() => {
        result.current.updateRolledMonths('Fee: 2%', 12);
        result.current.updateDeferredInterest('Fee: 2%', 50);
      });

      const saved = result.current.getResultsForSave();

      expect(saved).toHaveProperty('slider_overrides');
      expect(saved.slider_overrides.rolled).toEqual({ 'Fee: 2%': 12 });
      expect(saved.slider_overrides.deferred).toEqual({ 'Fee: 2%': 50 });
    });

    it('should return rate overrides in save format', () => {
      act(() => {
        result.current.updateRateOverride('Fee: 2%', '5.5');
      });

      const saved = result.current.getResultsForSave();

      expect(saved).toHaveProperty('rates_overrides');
      expect(saved.rates_overrides).toEqual({ 'Fee: 2%': '5.5' });
    });

    it('should return product fee overrides in save format', () => {
      act(() => {
        result.current.updateProductFeeOverride('Fee: 2%', '2.5');
      });

      const saved = result.current.getResultsForSave();

      expect(saved).toHaveProperty('product_fee_overrides');
      expect(saved.product_fee_overrides).toEqual({ 'Fee: 2%': '2.5' });
    });

    it('should return empty objects when no overrides set', () => {
      const saved = result.current.getResultsForSave();

      expect(saved.slider_overrides).toEqual({ rolled: {}, deferred: {} });
      expect(saved.rates_overrides).toEqual({});
      expect(saved.product_fee_overrides).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values for sliders', () => {
      act(() => {
        result.current.updateRolledMonths('Fee: 2%', 0);
        result.current.updateDeferredInterest('Fee: 2%', 0);
      });

      expect(result.current.rolledMonthsPerColumn['Fee: 2%']).toBe(0);
      expect(result.current.deferredInterestPerColumn['Fee: 2%']).toBe(0);
    });

    it('should handle column keys with special characters', () => {
      const specialKey = 'Fee: 2.5% (Special)';
      
      act(() => {
        result.current.updateRolledMonths(specialKey, 12);
      });

      expect(result.current.rolledMonthsPerColumn[specialKey]).toBe(12);
    });

    it('should handle resetting non-existent columns gracefully', () => {
      expect(() => {
        act(() => {
          result.current.resetSlidersForColumn('NonExistent');
        });
      }).not.toThrow();
    });
  });
});
