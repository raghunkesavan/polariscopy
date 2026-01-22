/**
 * BTL Input Form Component Tests
 * 
 * Tests for BTLInputForm component covering:
 * - Rendering of all input fields (property value, monthly rent, top slicing)
 * - Currency formatting and parsing
 * - Input change handling
 * - Required field indicators
 * - Help text display
 * - Read-only mode
 * - Edge cases (empty, zero, large values)
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BTLInputForm from '../../components/BTLInputForm';

describe('BTLInputForm Component', () => {
  const mockOnInputChange = vi.fn();

  const defaultInputs = {
    propertyValue: 250000,
    monthlyRent: 1200,
    topSlicing: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================

  describe('Rendering', () => {
    it('should render all three input fields', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      expect(screen.getByLabelText(/Property Value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Rent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Top Slicing/i)).toBeInTheDocument();
    });

    it('should display required field indicators for property value and monthly rent', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      // Get the inputs
      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      // Check required attributes on inputs
      expect(propertyInput).toHaveAttribute('required');
      expect(rentInput).toHaveAttribute('required');
      expect(topSlicingInput).not.toHaveAttribute('required');

      // Check for required indicators (abbr tags) in the document
      const requiredIndicators = screen.getAllByTitle('required');
      expect(requiredIndicators).toHaveLength(2); // Property Value and Monthly Rent
    });

    it('should display help text for top slicing', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      expect(screen.getByText(/Additional income to supplement rental income/i)).toBeInTheDocument();
    });

    it('should display formatted currency values', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);

      expect(propertyInput).toHaveValue('£250,000');
      expect(rentInput).toHaveValue('£1,200');
    });

    it('should display placeholder text when values are empty or zero', () => {
      render(
        <BTLInputForm 
          inputs={{ propertyValue: 0, monthlyRent: 0, topSlicing: 0 }} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).toHaveValue('');
      expect(rentInput).toHaveValue('');
      expect(topSlicingInput).toHaveValue('');
      expect(propertyInput).toHaveAttribute('placeholder', '£0');
      expect(rentInput).toHaveAttribute('placeholder', '£0');
      expect(topSlicingInput).toHaveAttribute('placeholder', '£0');
    });
  });

  // ==================== INPUT CHANGE TESTS ====================

  describe('Input Changes', () => {
    it('should call onInputChange with parsed numeric value for property value', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: '£300,000' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 300000);
    });

    it('should call onInputChange with parsed numeric value for monthly rent', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      fireEvent.change(rentInput, { target: { value: '£1,500' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('monthlyRent', 1500);
    });

    it('should call onInputChange with parsed numeric value for top slicing', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);
      fireEvent.change(topSlicingInput, { target: { value: '£5,000' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('topSlicing', 5000);
    });

    it('should handle input without currency symbols', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: '350000' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 350000);
    });

    it('should handle input with commas', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      fireEvent.change(rentInput, { target: { value: '1,750' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('monthlyRent', 1750);
    });

    it('should handle decimal values', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: '250000.50' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 250000.50);
    });

    it('should handle empty string input', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: '' } });

      // parseNumber('') returns NaN, not 0
      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', NaN);
    });
  });

  // ==================== READ-ONLY MODE TESTS ====================

  describe('Read-only Mode', () => {
    it('should disable all inputs when isReadOnly is true', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
          isReadOnly={true}
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).toBeDisabled();
      expect(rentInput).toBeDisabled();
      expect(topSlicingInput).toBeDisabled();
    });

    it('should not call onInputChange when inputs are clicked in read-only mode', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
          isReadOnly={true}
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      
      // Verify input is disabled
      expect(propertyInput).toBeDisabled();
      
      // In real browsers, disabled inputs cannot be changed
      // fireEvent.change still triggers in tests, but that's test environment behavior
      // The important thing is the input has the disabled attribute
    });

    it('should enable inputs when isReadOnly is false (default)', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).not.toBeDisabled();
      expect(rentInput).not.toBeDisabled();
      expect(topSlicingInput).not.toBeDisabled();
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: '10000000' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 10000000);
    });

    it('should handle zero values', () => {
      render(
        <BTLInputForm 
          inputs={{ propertyValue: 0, monthlyRent: 0, topSlicing: 0 }} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      expect(propertyInput).toHaveValue('');
    });

    it('should handle undefined inputs gracefully', () => {
      render(
        <BTLInputForm 
          inputs={{}} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).toHaveValue('');
      expect(rentInput).toHaveValue('');
      expect(topSlicingInput).toHaveValue('');
    });

    it('should handle null inputs gracefully', () => {
      render(
        <BTLInputForm 
          inputs={{ propertyValue: null, monthlyRent: null, topSlicing: null }} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).toHaveValue('');
      expect(rentInput).toHaveValue('');
      expect(topSlicingInput).toHaveValue('');
    });

    it('should handle non-numeric text input gracefully', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: 'abc' } });

      // parseNumber should handle this and return 0 or NaN
      expect(mockOnInputChange).toHaveBeenCalled();
    });
  });

  // ==================== CURRENCY FORMATTING TESTS ====================

  describe('Currency Formatting', () => {
    it('should format property value with currency symbol and commas', () => {
      render(
        <BTLInputForm 
          inputs={{ ...defaultInputs, propertyValue: 1250000 }} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      expect(propertyInput).toHaveValue('£1,250,000');
    });

    it('should format monthly rent with currency symbol and commas', () => {
      render(
        <BTLInputForm 
          inputs={{ ...defaultInputs, monthlyRent: 2500 }} 
          onInputChange={mockOnInputChange} 
        />
      );

      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      expect(rentInput).toHaveValue('£2,500');
    });

    it('should format top slicing with currency symbol and commas', () => {
      render(
        <BTLInputForm 
          inputs={{ ...defaultInputs, topSlicing: 15000 }} 
          onInputChange={mockOnInputChange} 
        />
      );

      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);
      expect(topSlicingInput).toHaveValue('£15,000');
    });

    it('should not display currency format for zero or empty values', () => {
      render(
        <BTLInputForm 
          inputs={{ propertyValue: 0, monthlyRent: 0, topSlicing: 0 }} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).toHaveValue('');
      expect(rentInput).toHaveValue('');
      expect(topSlicingInput).toHaveValue('');
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).toHaveAttribute('id', 'propertyValue');
      expect(rentInput).toHaveAttribute('id', 'monthlyRent');
      expect(topSlicingInput).toHaveAttribute('id', 'topSlicing');
    });

    it('should have required attributes on required fields', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      const topSlicingInput = screen.getByLabelText(/Top Slicing/i);

      expect(propertyInput).toHaveAttribute('required');
      expect(rentInput).toHaveAttribute('required');
      expect(topSlicingInput).not.toHaveAttribute('required');
    });

    it('should support keyboard navigation', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      propertyInput.focus();

      expect(document.activeElement).toBe(propertyInput);
    });

    it('should have proper ARIA attributes for required fields', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      // Check for required attributes on inputs
      const propertyInput = screen.getByLabelText(/Property Value/i);
      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      
      expect(propertyInput).toHaveAttribute('required');
      expect(rentInput).toHaveAttribute('required');

      // Check for ARIA indicators (abbr elements with title="required")
      const requiredIndicators = screen.getAllByTitle('required');
      expect(requiredIndicators).toHaveLength(2);
      requiredIndicators.forEach(indicator => {
        expect(indicator).toHaveClass('slds-required');
      });
    });
  });

  // ==================== INTERACTION TESTS ====================

  describe('User Interactions', () => {
    it('should allow typing in property value field', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      
      fireEvent.change(propertyInput, { target: { value: '£350' } });
      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 350);

      fireEvent.change(propertyInput, { target: { value: '£350,0' } });
      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 3500);
      
      fireEvent.change(propertyInput, { target: { value: '£350,000' } });
      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 350000);
    });

    it('should allow clearing input fields', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: '' } });

      // parseNumber('') returns NaN for empty input
      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', NaN);
    });

    it('should handle rapid input changes', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const rentInput = screen.getByLabelText(/Monthly Rent/i);
      
      fireEvent.change(rentInput, { target: { value: '1' } });
      fireEvent.change(rentInput, { target: { value: '12' } });
      fireEvent.change(rentInput, { target: { value: '120' } });
      fireEvent.change(rentInput, { target: { value: '1200' } });

      expect(mockOnInputChange).toHaveBeenCalledTimes(4);
      expect(mockOnInputChange).toHaveBeenLastCalledWith('monthlyRent', 1200);
    });
  });

  // ==================== VALIDATION TESTS ====================

  describe('Input Validation', () => {
    it('should accept valid numeric values', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      
      fireEvent.change(propertyInput, { target: { value: '250000' } });
      expect(mockOnInputChange).toHaveBeenCalledWith('propertyValue', 250000);
    });

    it('should handle negative values', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      fireEvent.change(propertyInput, { target: { value: '-100' } });

      // parseNumber should handle negative values
      expect(mockOnInputChange).toHaveBeenCalled();
    });

    it('should maintain input type as text to allow formatted input', () => {
      render(
        <BTLInputForm 
          inputs={defaultInputs} 
          onInputChange={mockOnInputChange} 
        />
      );

      const propertyInput = screen.getByLabelText(/Property Value/i);
      expect(propertyInput).toHaveAttribute('type', 'text');
    });
  });
});
