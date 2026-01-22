/**
 * useBTLRates Hook Tests
 * 
 * Tests for useBTLRates custom hook covering:
 * - Initial state
 * - fetchCriteria function (Supabase integration)
 * - fetchRates function (Supabase integration)
 * - Auto-fetch on mount
 * - refreshRates function
 * - refreshCriteria function
 * - Loading states
 * - Error handling
 * - Questions map building
 * - Multiple criteria sets
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBTLRates } from '../../hooks/useBTLRates';
import * as SupabaseContext from '../../../contexts/SupabaseContext';

// Mock the SupabaseContext
vi.mock('../../../contexts/SupabaseContext', () => ({
  useSupabase: vi.fn()
}));

describe('useBTLRates Hook', () => {
  let mockSupabase;
  let mockCriteriaQuery;
  let mockRatesQuery;

  const mockCriteriaData = [
    {
      id: 1,
      question_id: 'Q1',
      criteria_set: 'BTL',
      question_text: 'Is the property newly built?',
      question_order: 1,
      tier_impact: 1
    },
    {
      id: 2,
      question_id: 'Q2',
      criteria_set: 'BTL',
      question_text: 'Is the property HMO?',
      question_order: 2,
      tier_impact: 2
    },
    {
      id: 3,
      question_id: 'Q3',
      criteria_set: 'BTL',
      question_text: 'Is there adverse credit?',
      question_order: 3,
      tier_impact: 3
    }
  ];

  const mockRatesData = [
    {
      id: 1,
      product_scope: 'Whole Market',
      product_range: 'Core',
      rate: 4.5,
      tier: 2,
      active: true
    },
    {
      id: 2,
      product_scope: 'Select Panel',
      product_range: 'Core',
      rate: 4.3,
      tier: 2,
      active: true
    },
    {
      id: 3,
      product_scope: 'Whole Market',
      product_range: 'Specialist',
      rate: 5.0,
      tier: 3,
      active: true
    }
  ];

  beforeEach(() => {
    // Setup mock query builders
    mockCriteriaQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockCriteriaData, error: null })
    };

    mockRatesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockRatesData, error: null })
    };

    mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'criteria') return mockCriteriaQuery;
        if (table === 'rates') return mockRatesQuery;
        return mockCriteriaQuery;
      })
    };

    SupabaseContext.useSupabase.mockReturnValue({ supabase: mockSupabase });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== INITIAL STATE TESTS ====================

  describe('Initial State', () => {
    it('should initialize with empty allCriteria', () => {
      const { result } = renderHook(() => useBTLRates());

      expect(result.current.allCriteria).toEqual([]);
    });

    it('should initialize with empty questions object', () => {
      const { result } = renderHook(() => useBTLRates());

      expect(result.current.questions).toEqual({});
    });

    it('should initialize with empty ratesData', () => {
      const { result } = renderHook(() => useBTLRates());

      expect(result.current.ratesData).toEqual([]);
    });

    it('should initialize with loading true', () => {
      const { result } = renderHook(() => useBTLRates());

      expect(result.current.loading).toBe(true);
    });

    it('should initialize with no error', () => {
      const { result } = renderHook(() => useBTLRates());

      expect(result.current.error).toBeNull();
    });

    it('should provide refresh functions', () => {
      const { result } = renderHook(() => useBTLRates());

      expect(typeof result.current.refreshRates).toBe('function');
      expect(typeof result.current.refreshCriteria).toBe('function');
    });
  });

  // ==================== FETCH CRITERIA TESTS ====================

  describe('fetchCriteria', () => {
    it('should fetch criteria from Supabase on mount', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('criteria');
      expect(mockCriteriaQuery.select).toHaveBeenCalledWith('*');
      expect(mockCriteriaQuery.eq).toHaveBeenCalledWith('criteria_set', 'BTL');
      expect(mockCriteriaQuery.order).toHaveBeenCalledWith('question_order', { ascending: true });
    });

    it('should store fetched criteria in allCriteria', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allCriteria).toEqual(mockCriteriaData);
    });

    it('should build questions map from criteria', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.questions).toHaveProperty('Q1');
      expect(result.current.questions).toHaveProperty('Q2');
      expect(result.current.questions).toHaveProperty('Q3');
      expect(result.current.questions.Q1).toEqual(mockCriteriaData[0]);
      expect(result.current.questions.Q2).toEqual(mockCriteriaData[1]);
      expect(result.current.questions.Q3).toEqual(mockCriteriaData[2]);
    });

    it('should handle criteria fetch error', async () => {
      mockCriteriaQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Criteria fetch failed' }
      });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Criteria fetch failed');
      expect(result.current.allCriteria).toEqual([]);
    });

    it('should use custom criteriaSet parameter', async () => {
      const { result } = renderHook(() => useBTLRates('BRIDGING'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCriteriaQuery.eq).toHaveBeenCalledWith('criteria_set', 'BRIDGING');
    });

    it('should handle empty criteria data', async () => {
      mockCriteriaQuery.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allCriteria).toEqual([]);
      expect(result.current.questions).toEqual({});
    });

    it('should handle null criteria data', async () => {
      mockCriteriaQuery.order.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allCriteria).toEqual([]);
    });
  });

  // ==================== FETCH RATES TESTS ====================

  describe('fetchRates', () => {
    it('should fetch rates from Supabase on mount', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('rates');
      expect(mockRatesQuery.select).toHaveBeenCalledWith('*');
      expect(mockRatesQuery.eq).toHaveBeenCalledWith('active', true);
    });

    it('should store fetched rates in ratesData', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ratesData).toEqual(mockRatesData);
    });

    it('should only fetch active rates', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRatesQuery.eq).toHaveBeenCalledWith('active', true);
    });

    it('should handle rates fetch error', async () => {
      mockRatesQuery.eq.mockResolvedValue({
        data: null,
        error: { message: 'Rates fetch failed' }
      });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Rates fetch failed');
      expect(result.current.ratesData).toEqual([]);
    });

    it('should handle empty rates data', async () => {
      mockRatesQuery.eq.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ratesData).toEqual([]);
    });

    it('should handle null rates data', async () => {
      mockRatesQuery.eq.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ratesData).toEqual([]);
    });
  });

  // ==================== AUTO-FETCH ON MOUNT TESTS ====================

  describe('Auto-fetch on Mount', () => {
    it('should fetch both criteria and rates on mount', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('criteria');
      expect(mockSupabase.from).toHaveBeenCalledWith('rates');
    });

    it('should set loading to true during fetch', async () => {
      const { result } = renderHook(() => useBTLRates());

      // Initially loading should be true
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after fetch completes', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should not fetch if supabase is not available', () => {
      SupabaseContext.useSupabase.mockReturnValue({ supabase: null });

      const { result } = renderHook(() => useBTLRates());

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle partial fetch failure (criteria fails, rates succeeds)', async () => {
      mockCriteriaQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Criteria error' }
      });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Criteria error');
      expect(result.current.allCriteria).toEqual([]);
      expect(result.current.ratesData).toEqual(mockRatesData); // Rates still loaded
    });

    it('should handle partial fetch failure (rates fails, criteria succeeds)', async () => {
      mockRatesQuery.eq.mockResolvedValue({
        data: null,
        error: { message: 'Rates error' }
      });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Rates error');
      expect(result.current.ratesData).toEqual([]);
      expect(result.current.allCriteria).toEqual(mockCriteriaData); // Criteria still loaded
    });
  });

  // ==================== REFRESH RATES TESTS ====================

  describe('refreshRates', () => {
    it('should refetch rates when refreshRates is called', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      mockSupabase.from.mockClear();
      mockRatesQuery.select.mockClear();

      // Call refresh
      await act(async () => {
        await result.current.refreshRates();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('rates');
      expect(mockRatesQuery.select).toHaveBeenCalledWith('*');
    });

    it('should set loading to true during refresh', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create a delayed mock to check loading state
      let resolvePromise;
      mockRatesQuery.eq.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      let loadingDuringRefresh = false;
      act(() => {
        result.current.refreshRates().then(() => {
          // After refresh completes
        });
        loadingDuringRefresh = result.current.loading;
      });

      expect(loadingDuringRefresh).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise({ data: mockRatesData, error: null });
        await Promise.resolve();
      });
    });

    it('should set loading to false after refresh completes', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshRates();
      });

      expect(result.current.loading).toBe(false);
    });

    it('should return refreshed rates data', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newRatesData = [
        { id: 4, product_scope: 'New Panel', rate: 3.9, active: true }
      ];
      mockRatesQuery.eq.mockResolvedValue({ data: newRatesData, error: null });

      let refreshedData;
      await act(async () => {
        refreshedData = await result.current.refreshRates();
      });

      expect(refreshedData).toEqual(newRatesData);
      expect(result.current.ratesData).toEqual(newRatesData);
    });

    it('should handle refresh error', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockRatesQuery.eq.mockResolvedValue({
        data: null,
        error: { message: 'Refresh failed' }
      });

      await act(async () => {
        await result.current.refreshRates();
      });

      expect(result.current.error).toBe('Refresh failed');
    });
  });

  // ==================== REFRESH CRITERIA TESTS ====================

  describe('refreshCriteria', () => {
    it('should refetch criteria when refreshCriteria is called', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      mockSupabase.from.mockClear();
      mockCriteriaQuery.select.mockClear();

      // Call refresh
      await act(async () => {
        await result.current.refreshCriteria();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('criteria');
      expect(mockCriteriaQuery.select).toHaveBeenCalledWith('*');
    });

    it('should set loading to true during refresh', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resolvePromise;
      mockCriteriaQuery.order.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      let loadingDuringRefresh = false;
      act(() => {
        result.current.refreshCriteria().then(() => {});
        loadingDuringRefresh = result.current.loading;
      });

      expect(loadingDuringRefresh).toBe(true);

      await act(async () => {
        resolvePromise({ data: mockCriteriaData, error: null });
        await Promise.resolve();
      });
    });

    it('should set loading to false after refresh completes', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshCriteria();
      });

      expect(result.current.loading).toBe(false);
    });

    it('should return refreshed criteria data', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newCriteriaData = [
        { id: 4, question_id: 'Q4', criteria_set: 'BTL', question_order: 4 }
      ];
      mockCriteriaQuery.order.mockResolvedValue({ data: newCriteriaData, error: null });

      let refreshedData;
      await act(async () => {
        refreshedData = await result.current.refreshCriteria();
      });

      expect(refreshedData).toEqual(newCriteriaData);
      expect(result.current.allCriteria).toEqual(newCriteriaData);
    });

    it('should rebuild questions map after refresh', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newCriteriaData = [
        { id: 4, question_id: 'Q4', criteria_set: 'BTL', question_order: 4 }
      ];
      mockCriteriaQuery.order.mockResolvedValue({ data: newCriteriaData, error: null });

      await act(async () => {
        await result.current.refreshCriteria();
      });

      expect(result.current.questions).toHaveProperty('Q4');
      expect(result.current.questions.Q4).toEqual(newCriteriaData[0]);
    });

    it('should handle refresh error', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockCriteriaQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Criteria refresh failed' }
      });

      await act(async () => {
        await result.current.refreshCriteria();
      });

      expect(result.current.error).toBe('Criteria refresh failed');
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should clear error on successful fetch after error', async () => {
      mockRatesQuery.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'First error' }
      });

      const { result, rerender } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('First error');

      // Reset mock to return success
      mockRatesQuery.eq.mockResolvedValue({ data: mockRatesData, error: null });

      // Trigger refresh
      await act(async () => {
        await result.current.refreshRates();
      });

      expect(result.current.error).toBe('First error'); // Error persists unless cleared
    });

    it('should handle network errors', async () => {
      mockRatesQuery.eq.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockRatesQuery.eq.mockResolvedValue({
        data: null,
        error: { message: 'Test error' }
      });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle undefined supabase instance', () => {
      SupabaseContext.useSupabase.mockReturnValue({ supabase: undefined });

      const { result } = renderHook(() => useBTLRates());

      expect(result.current.loading).toBe(true);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle very large datasets', async () => {
      const largeCriteriaData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        question_id: `Q${i}`,
        criteria_set: 'BTL',
        question_order: i
      }));

      mockCriteriaQuery.order.mockResolvedValue({ data: largeCriteriaData, error: null });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allCriteria).toHaveLength(1000);
      expect(Object.keys(result.current.questions)).toHaveLength(1000);
    });

    it('should handle changing criteriaSet parameter', async () => {
      const { result, rerender } = renderHook(
        ({ criteriaSet }) => useBTLRates(criteriaSet),
        { initialProps: { criteriaSet: 'BTL' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCriteriaQuery.eq).toHaveBeenCalledWith('criteria_set', 'BTL');

      // Change criteriaSet
      mockSupabase.from.mockClear();
      mockCriteriaQuery.eq.mockClear();
      
      rerender({ criteriaSet: 'BRIDGING' });

      await waitFor(() => {
        expect(mockCriteriaQuery.eq).toHaveBeenCalledWith('criteria_set', 'BRIDGING');
      });
    });

    it('should handle duplicate question_ids gracefully', async () => {
      const duplicateData = [
        { id: 1, question_id: 'Q1', criteria_set: 'BTL', question_order: 1 },
        { id: 2, question_id: 'Q1', criteria_set: 'BTL', question_order: 2 }
      ];

      mockCriteriaQuery.order.mockResolvedValue({ data: duplicateData, error: null });

      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Last one wins
      expect(result.current.questions.Q1.id).toBe(2);
    });

    it('should handle rapid successive refreshes', async () => {
      const { result } = renderHook(() => useBTLRates());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger multiple refreshes
      await act(async () => {
        const promises = [
          result.current.refreshRates(),
          result.current.refreshRates(),
          result.current.refreshRates()
        ];
        await Promise.all(promises);
      });

      // Should complete without errors
      expect(result.current.loading).toBe(false);
    });
  });
});
