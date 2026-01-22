/**
 * Tests for useBTLInputs hook
 * Tests state management, quote loading, and input validation
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useBTLInputs } from '../../hooks/useBTLInputs';

describe('useBTLInputs', () => {
  let result;

  beforeEach(() => {
    const { result: hookResult } = renderHook(() => useBTLInputs());
    result = hookResult;
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      expect(result.current.propertyValue).toBe('');
      expect(result.current.monthlyRent).toBe('');
      expect(result.current.loanType).toBe('');
      expect(result.current.productScope).toBe('');
      expect(result.current.selectedRange).toBe('specialist');
      expect(result.current.maxLtvInput).toBe(75);
      expect(result.current.addFeesToggle).toBe(false);
      expect(result.current.feeCalculationType).toBe('pound');
    });

    it('should initialize answers as empty object', () => {
      expect(result.current.answers).toEqual({});
    });

    it('should initialize client details with empty fields', () => {
      expect(result.current.clientDetails).toHaveProperty('firstName');
      expect(result.current.clientDetails).toHaveProperty('lastName');
      expect(result.current.clientDetails).toHaveProperty('email');
    });
  });

  describe('updateInput', () => {
    it('should update property value', () => {
      act(() => {
        result.current.updateInput('propertyValue', '500000');
      });
      expect(result.current.propertyValue).toBe('500000');
    });

    it('should update monthly rent', () => {
      act(() => {
        result.current.updateInput('monthlyRent', '2500');
      });
      expect(result.current.monthlyRent).toBe('2500');
    });

    it('should update loan type', () => {
      act(() => {
        result.current.updateInput('loanType', 'maxLoan');
      });
      expect(result.current.loanType).toBe('maxLoan');
    });

    it('should update product scope', () => {
      act(() => {
        result.current.updateInput('productScope', 'Whole Market');
      });
      expect(result.current.productScope).toBe('Whole Market');
    });

    it('should update selected range', () => {
      act(() => {
        result.current.updateInput('selectedRange', 'core');
      });
      expect(result.current.selectedRange).toBe('core');
    });

    it('should update max LTV input', () => {
      act(() => {
        result.current.updateInput('maxLtvInput', 80);
      });
      expect(result.current.maxLtvInput).toBe(80);
    });

    it('should update additional fees toggle', () => {
      act(() => {
        result.current.updateInput('addFeesToggle', true);
      });
      expect(result.current.addFeesToggle).toBe(true);
    });

    it('should update fee calculation type', () => {
      act(() => {
        result.current.updateInput('feeCalculationType', 'percentage');
      });
      expect(result.current.feeCalculationType).toBe('percentage');
    });

    it('should update additional fee amount', () => {
      act(() => {
        result.current.updateInput('additionalFeeAmount', '1500');
      });
      expect(result.current.additionalFeeAmount).toBe('1500');
    });
  });

  describe('updateMultipleInputs', () => {
    it('should update multiple inputs at once', () => {
      act(() => {
        result.current.updateMultipleInputs({
          propertyValue: '750000',
          monthlyRent: '3000',
          loanType: 'specificGross'
        });
      });

      expect(result.current.propertyValue).toBe('750000');
      expect(result.current.monthlyRent).toBe('3000');
      expect(result.current.loanType).toBe('specificGross');
    });

    it('should preserve unchanged values when updating multiple', () => {
      act(() => {
        result.current.updateInput('selectedRange', 'core');
      });

      act(() => {
        result.current.updateMultipleInputs({
          propertyValue: '600000',
          monthlyRent: '2800'
        });
      });

      expect(result.current.propertyValue).toBe('600000');
      expect(result.current.monthlyRent).toBe('2800');
      expect(result.current.selectedRange).toBe('core'); // Preserved
    });
  });

  describe('updateAnswer', () => {
    it('should add new answer', () => {
      act(() => {
        result.current.updateAnswer('q1', 'Yes');
      });
      expect(result.current.answers.q1).toBe('Yes');
    });

    it('should update existing answer', () => {
      act(() => {
        result.current.updateAnswer('q1', 'No');
      });
      act(() => {
        result.current.updateAnswer('q1', 'Yes');
      });
      expect(result.current.answers.q1).toBe('Yes');
    });

    it('should handle multiple answers', () => {
      act(() => {
        result.current.updateAnswer('q1', 'Yes');
        result.current.updateAnswer('q2', 'No');
        result.current.updateAnswer('q3', '5');
      });

      expect(result.current.answers).toEqual({
        q1: 'Yes',
        q2: 'No',
        q3: '5'
      });
    });
  });

  describe('updateClientDetails', () => {
    it('should update first name', () => {
      act(() => {
        result.current.updateClientDetails('firstName', 'John');
      });
      expect(result.current.clientDetails.firstName).toBe('John');
    });

    it('should update multiple fields', () => {
      act(() => {
        result.current.updateClientDetails('firstName', 'Jane');
        result.current.updateClientDetails('lastName', 'Doe');
        result.current.updateClientDetails('email', 'jane@example.com');
      });

      expect(result.current.clientDetails.firstName).toBe('Jane');
      expect(result.current.clientDetails.lastName).toBe('Doe');
      expect(result.current.clientDetails.email).toBe('jane@example.com');
    });

    it('should preserve other fields when updating one', () => {
      act(() => {
        result.current.updateClientDetails('firstName', 'Alice');
        result.current.updateClientDetails('lastName', 'Smith');
      });

      act(() => {
        result.current.updateClientDetails('email', 'alice@example.com');
      });

      expect(result.current.clientDetails.firstName).toBe('Alice');
      expect(result.current.clientDetails.lastName).toBe('Smith');
      expect(result.current.clientDetails.email).toBe('alice@example.com');
    });
  });

  describe('loadFromQuote', () => {
    it('should load basic inputs from quote', () => {
      const mockQuote = {
        property_value: '850000',
        monthly_rent: '3500',
        loan_type: 'maxLoan',
        product_scope: 'Select Panel',
        selected_range: 'core'
      };

      act(() => {
        result.current.loadFromQuote(mockQuote);
      });

      expect(result.current.propertyValue).toBe('850000');
      expect(result.current.monthlyRent).toBe('3500');
      expect(result.current.loanType).toBe('maxLoan');
      expect(result.current.productScope).toBe('Select Panel');
      expect(result.current.selectedRange).toBe('core');
    });

    it('should load additional fees from quote', () => {
      const mockQuote = {
        add_fees_toggle: true,
        fee_calculation_type: 'percentage',
        additional_fee_amount: '2.5'
      };

      act(() => {
        result.current.loadFromQuote(mockQuote);
      });

      expect(result.current.addFeesToggle).toBe(true);
      expect(result.current.feeCalculationType).toBe('percentage');
      expect(result.current.additionalFeeAmount).toBe('2.5');
    });

    it('should load criteria answers from quote', () => {
      const mockQuote = {
        criteria_answers: {
          q1: 'Yes',
          q2: 'No',
          q3: '10'
        }
      };

      act(() => {
        result.current.loadFromQuote(mockQuote);
      });

      expect(result.current.answers).toEqual({
        q1: 'Yes',
        q2: 'No',
        q3: '10'
      });
    });

    it('should load client details from quote', () => {
      const mockQuote = {
        client_first_name: 'Bob',
        client_last_name: 'Johnson',
        client_email: 'bob@example.com',
        client_phone: '555-1234'
      };

      act(() => {
        result.current.loadFromQuote(mockQuote);
      });

      expect(result.current.clientDetails.firstName).toBe('Bob');
      expect(result.current.clientDetails.lastName).toBe('Johnson');
      expect(result.current.clientDetails.email).toBe('bob@example.com');
      expect(result.current.clientDetails.phone).toBe('555-1234');
    });

    it('should handle missing quote fields gracefully', () => {
      const mockQuote = {
        property_value: '500000'
        // Other fields missing
      };

      act(() => {
        result.current.loadFromQuote(mockQuote);
      });

      expect(result.current.propertyValue).toBe('500000');
      // Other fields should remain at defaults
      expect(result.current.monthlyRent).toBe('');
    });
  });

  describe('resetInputs', () => {
    it('should reset all inputs to defaults', () => {
      // Set some values
      act(() => {
        result.current.updateInput('propertyValue', '900000');
        result.current.updateInput('monthlyRent', '4000');
        result.current.updateInput('loanType', 'maxLoan');
        result.current.updateAnswer('q1', 'Yes');
        result.current.updateClientDetails('firstName', 'Charlie');
      });

      // Reset
      act(() => {
        result.current.resetInputs();
      });

      // Verify reset
      expect(result.current.propertyValue).toBe('');
      expect(result.current.monthlyRent).toBe('');
      expect(result.current.loanType).toBe('');
      expect(result.current.answers).toEqual({});
      expect(result.current.clientDetails.firstName).toBe('');
    });

    it('should reset additional fees to defaults', () => {
      act(() => {
        result.current.updateInput('addFeesToggle', true);
        result.current.updateInput('feeCalculationType', 'percentage');
        result.current.updateInput('additionalFeeAmount', '3.0');
      });

      act(() => {
        result.current.resetInputs();
      });

      expect(result.current.addFeesToggle).toBe(false);
      expect(result.current.feeCalculationType).toBe('pound');
      expect(result.current.additionalFeeAmount).toBe('');
    });
  });

  describe('getInputsForSave', () => {
    it('should return all inputs in save format', () => {
      act(() => {
        result.current.updateInput('propertyValue', '650000');
        result.current.updateInput('monthlyRent', '2900');
        result.current.updateInput('loanType', 'specificNet');
        result.current.updateInput('productScope', 'Whole Market');
      });

      const saved = result.current.getInputsForSave();

      expect(saved).toHaveProperty('property_value', '650000');
      expect(saved).toHaveProperty('monthly_rent', '2900');
      expect(saved).toHaveProperty('loan_type', 'specificNet');
      expect(saved).toHaveProperty('product_scope', 'Whole Market');
    });

    it('should include additional fees in save format', () => {
      act(() => {
        result.current.updateInput('addFeesToggle', true);
        result.current.updateInput('feeCalculationType', 'percentage');
        result.current.updateInput('additionalFeeAmount', '1.5');
      });

      const saved = result.current.getInputsForSave();

      expect(saved).toHaveProperty('add_fees_toggle', true);
      expect(saved).toHaveProperty('fee_calculation_type', 'percentage');
      expect(saved).toHaveProperty('additional_fee_amount', '1.5');
    });

    it('should include criteria answers in save format', () => {
      act(() => {
        result.current.updateAnswer('q1', 'Yes');
        result.current.updateAnswer('q2', 'No');
      });

      const saved = result.current.getInputsForSave();

      expect(saved).toHaveProperty('criteria_answers');
      expect(saved.criteria_answers).toEqual({
        q1: 'Yes',
        q2: 'No'
      });
    });

    it('should include client details in save format', () => {
      act(() => {
        result.current.updateClientDetails('firstName', 'David');
        result.current.updateClientDetails('lastName', 'Williams');
      });

      const saved = result.current.getInputsForSave();

      expect(saved).toHaveProperty('client_first_name', 'David');
      expect(saved).toHaveProperty('client_last_name', 'Williams');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string updates', () => {
      act(() => {
        result.current.updateInput('propertyValue', '500000');
      });
      act(() => {
        result.current.updateInput('propertyValue', '');
      });
      expect(result.current.propertyValue).toBe('');
    });

    it('should handle null values in quote loading', () => {
      const mockQuote = {
        property_value: null,
        monthly_rent: null
      };

      act(() => {
        result.current.loadFromQuote(mockQuote);
      });

      // Should handle gracefully without errors
      expect(result.current.propertyValue).toBeDefined();
    });

    it('should handle updating non-existent input keys gracefully', () => {
      expect(() => {
        act(() => {
          result.current.updateInput('nonExistentKey', 'value');
        });
      }).not.toThrow();
    });
  });
});
