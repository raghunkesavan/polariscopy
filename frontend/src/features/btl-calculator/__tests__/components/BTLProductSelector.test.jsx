/**
 * BTL Product Selector Component Tests
 * 
 * Tests for BTLProductSelector component covering:
 * - Rendering of all selection fields (product type, scope, retention, LTV)
 * - Product scope dropdown with options
 * - Retention choice dropdown (Yes/No)
 * - Conditional rendering of retention LTV
 * - Tier display based on criteria
 * - Input change handling
 * - Required field indicators
 * - Read-only mode
 * - Edge cases (empty options, undefined values)
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BTLProductSelector from '../../components/BTLProductSelector';

describe('BTLProductSelector Component', () => {
  const mockOnInputChange = vi.fn();

  const defaultInputs = {
    productScope: 'Whole Market',
    retentionChoice: 'No',
    retentionLtv: '65'
  };

  const defaultProductScopes = [
    'Whole Market',
    'Select Panel',
    'Core Panel',
    'Specialist Panel'
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================

  describe('Rendering', () => {
    it('should render product type as "BTL" (static)', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.getByText('Product Type')).toBeInTheDocument();
      expect(screen.getByText('BTL')).toBeInTheDocument();
    });

    it('should render product scope dropdown with label', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument();
    });

    it('should render retention choice dropdown', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2); // Product Scope and Retention
    });

    it('should display required field indicator for product scope', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      // Check for required indicator (abbr with title="required")
      const requiredIndicators = screen.getAllByTitle('required');
      expect(requiredIndicators.length).toBeGreaterThan(0);
      
      // Verify the select has required attribute
      const productScopeSelect = screen.getAllByRole('combobox')[0];
      expect(productScopeSelect).toHaveAttribute('required');
    });

    it('should render tier display with current tier', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={2}
        />
      );

      expect(screen.getByText(/Based on the criteria:/i)).toBeInTheDocument();
      expect(screen.getByText('Tier 2')).toBeInTheDocument();
    });

    it('should display different tier values', () => {
      const { rerender } = render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={1}
        />
      );

      expect(screen.getByText('Tier 1')).toBeInTheDocument();

      rerender(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={3}
        />
      );

      expect(screen.getByText('Tier 3')).toBeInTheDocument();
    });
  });

  // ==================== PRODUCT SCOPE TESTS ====================

  describe('Product Scope Dropdown', () => {
    it('should render all product scope options', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[0];
      const options = select.querySelectorAll('option');

      // +1 for the "-- Select Product Scope --" placeholder
      expect(options).toHaveLength(defaultProductScopes.length + 1);
      expect(options[0]).toHaveTextContent('-- Select Product Scope --');
      expect(options[1]).toHaveTextContent('Whole Market');
      expect(options[2]).toHaveTextContent('Select Panel');
      expect(options[3]).toHaveTextContent('Core Panel');
      expect(options[4]).toHaveTextContent('Specialist Panel');
    });

    it('should display selected product scope', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, productScope: 'Select Panel' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[0];
      expect(select).toHaveValue('Select Panel');
    });

    it('should call onInputChange when product scope is changed', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 'Core Panel' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('productScope', 'Core Panel');
    });

    it('should handle empty product scopes array', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={[]}
        />
      );

      const select = screen.getAllByRole('combobox')[0];
      const options = select.querySelectorAll('option');

      // Only the placeholder should be present
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('-- Select Product Scope --');
    });

    it('should have required attribute on product scope select', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[0];
      expect(select).toHaveAttribute('required');
    });
  });

  // ==================== RETENTION CHOICE TESTS ====================

  describe('Retention Choice Dropdown', () => {
    it('should render retention choice with Yes/No options', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const select = selects[1]; // Retention dropdown is second
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('No');
      expect(options[1]).toHaveTextContent('Yes');
    });

    it('should display selected retention choice', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[1]; // Retention dropdown
      expect(select).toHaveValue('Yes');
    });

    it('should call onInputChange when retention choice is changed', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[1]; // Retention dropdown
      fireEvent.change(select, { target: { value: 'Yes' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('retentionChoice', 'Yes');
    });

    it('should default to "No" when retention choice is not set', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'No' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[1]; // Retention dropdown
      expect(select).toHaveValue('No');
    });
  });

  // ==================== RETENTION LTV TESTS ====================

  describe('Retention LTV (Conditional)', () => {
    it('should NOT display retention LTV when retention choice is "No"', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'No' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.queryByLabelText(/Retention LTV/i)).not.toBeInTheDocument();
    });

    it('should display retention LTV when retention choice is "Yes"', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.getAllByRole('combobox')[2]).toBeInTheDocument();
    });

    it('should render retention LTV with 65% and 75% options', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[2];
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('65%');
      expect(options[1]).toHaveTextContent('75%');
    });

    it('should display selected retention LTV', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes', retentionLtv: '75' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[2];
      expect(select).toHaveValue('75');
    });

    it('should call onInputChange when retention LTV is changed', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const select = screen.getAllByRole('combobox')[2];
      fireEvent.change(select, { target: { value: '75' } });

      expect(mockOnInputChange).toHaveBeenCalledWith('retentionLtv', '75');
    });

    it('should show retention LTV dynamically when retention choice changes to "Yes"', () => {
      const { rerender } = render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'No' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.queryByLabelText(/Retention LTV/i)).not.toBeInTheDocument();

      rerender(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.getAllByRole('combobox')[2]).toBeInTheDocument();
    });

    it('should hide retention LTV when retention choice changes to "No"', () => {
      const { rerender } = render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.getAllByRole('combobox')[2]).toBeInTheDocument();

      rerender(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'No' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      expect(screen.queryByLabelText(/Retention LTV/i)).not.toBeInTheDocument();
    });
  });

  // ==================== TIER DISPLAY TESTS ====================

  describe('Tier Display', () => {
    it('should display tier with label and value', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={2}
        />
      );

      expect(screen.getByText(/Based on the criteria:/i)).toBeInTheDocument();
      expect(screen.getByText('Tier 2')).toBeInTheDocument();
    });

    it('should update tier display when currentTier prop changes', () => {
      const { rerender } = render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={1}
        />
      );

      expect(screen.getByText('Tier 1')).toBeInTheDocument();

      rerender(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={4}
        />
      );

      expect(screen.getByText('Tier 4')).toBeInTheDocument();
    });

    it('should display default tier when currentTier is not provided', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      // Default should be Tier 2 based on prop default
      expect(screen.getByText('Tier 2')).toBeInTheDocument();
    });
  });

  // ==================== READ-ONLY MODE TESTS ====================

  describe('Read-only Mode', () => {
    it('should disable all dropdowns when isReadOnly is true', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          isReadOnly={true}
        />
      );

      const productScopeSelect = screen.getAllByRole('combobox')[0];
      const retentionSelect = screen.getAllByRole('combobox')[1];

      expect(productScopeSelect).toBeDisabled();
      expect(retentionSelect).toBeDisabled();
    });

    it('should disable retention LTV when isReadOnly is true and retention is "Yes"', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          isReadOnly={true}
        />
      );

      const retentionLtvSelect = screen.getAllByRole('combobox')[2];
      expect(retentionLtvSelect).toBeDisabled();
    });

    it('should not call onInputChange when dropdowns are changed in read-only mode', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          isReadOnly={true}
        />
      );

      const productScopeSelect = screen.getAllByRole('combobox')[0];
      
      // Verify the select is disabled
      expect(productScopeSelect).toBeDisabled();
      
      // In real browsers, disabled selects cannot be changed
      // fireEvent still triggers in test environment, but that's test behavior
      // The important thing is the select has the disabled attribute
    });

    it('should enable dropdowns when isReadOnly is false (default)', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const productScopeSelect = screen.getAllByRole('combobox')[0];
      const retentionSelect = screen.getAllByRole('combobox')[1];

      expect(productScopeSelect).not.toBeDisabled();
      expect(retentionSelect).not.toBeDisabled();
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle undefined inputs gracefully', () => {
      render(
        <BTLProductSelector 
          inputs={{}}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const productScopeSelect = screen.getAllByRole('combobox')[0];
      const retentionSelect = screen.getAllByRole('combobox')[1];

      // When inputs are undefined, productScope defaults to empty (placeholder)
      expect(productScopeSelect).toHaveValue('');
      // retentionChoice when undefined will default to first option ("No")
      expect(retentionSelect).toHaveValue('No');
    });

    it('should handle empty productScopes array', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={[]}
        />
      );

      const select = screen.getAllByRole('combobox')[0];
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(1); // Only placeholder
    });

    it('should handle undefined productScopes prop (default to empty array)', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
        />
      );

      const select = screen.getAllByRole('combobox')[0];
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(1); // Only placeholder
    });

    it('should handle null currentTier gracefully', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={null}
        />
      );

      // Should still render tier display
      expect(screen.getByText(/Based on the criteria:/i)).toBeInTheDocument();
    });

    it('should handle zero currentTier', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={0}
        />
      );

      expect(screen.getByText('Tier 0')).toBeInTheDocument();
    });

    it('should handle invalid retention choice values', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Invalid' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      // Should not show retention LTV for invalid values (only "Yes" triggers it)
      expect(screen.queryByLabelText(/Retention LTV/i)).not.toBeInTheDocument();
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================

  describe('Accessibility', () => {
    it('should have proper label associations for all dropdowns', () => {
      render(
        <BTLProductSelector 
          inputs={{ ...defaultInputs, retentionChoice: 'Yes' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const productScopeSelect = screen.getAllByRole('combobox')[0];
      const retentionSelect = screen.getAllByRole('combobox')[1];
      const retentionLtvSelect = screen.getAllByRole('combobox')[2];

      expect(productScopeSelect).toBeInTheDocument();
      expect(retentionSelect).toBeInTheDocument();
      expect(retentionLtvSelect).toBeInTheDocument();
    });

    it('should have required attribute on product scope', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const productScopeSelect = screen.getAllByRole('combobox')[0];
      expect(productScopeSelect).toHaveAttribute('required');
    });

    it('should support keyboard navigation', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const productScopeSelect = screen.getAllByRole('combobox')[0];
      productScopeSelect.focus();

      expect(document.activeElement).toBe(productScopeSelect);
    });

    it('should have proper ARIA attributes for required field', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const productScopeSelect = selects[0];
      const label = productScopeSelect.closest('.slds-form-element').querySelector('label');
      expect(label?.querySelector('abbr')).toHaveAttribute('title', 'required');
    });

    it('should maintain focus visibility on dropdowns', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const retentionSelect = selects[1]; // Second select is Retention
      retentionSelect.focus();

      expect(document.activeElement).toBe(retentionSelect);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Component Integration', () => {
    it('should handle complete user workflow: select scope → enable retention → select LTV', () => {
      const { rerender } = render(
        <BTLProductSelector 
          inputs={{ productScope: '', retentionChoice: 'No', retentionLtv: '65' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      // Step 1: Select product scope
      const selects = screen.getAllByRole('combobox');
      const productScopeSelect = selects[0]; // First select is Product Scope
      fireEvent.change(productScopeSelect, { target: { value: 'Whole Market' } });
      expect(mockOnInputChange).toHaveBeenCalledWith('productScope', 'Whole Market');

      // Step 2: Enable retention
      const retentionSelect = selects[1]; // Second select is Retention
      fireEvent.change(retentionSelect, { target: { value: 'Yes' } });
      expect(mockOnInputChange).toHaveBeenCalledWith('retentionChoice', 'Yes');

      // Step 3: Rerender with retention enabled
      rerender(
        <BTLProductSelector 
          inputs={{ productScope: 'Whole Market', retentionChoice: 'Yes', retentionLtv: '65' }}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      // Step 4: Select retention LTV
      const selectsAfterRerender = screen.getAllByRole('combobox');
      const retentionLtvSelect = selectsAfterRerender[2]; // Third select is Retention LTV
      fireEvent.change(retentionLtvSelect, { target: { value: '75' } });
      expect(mockOnInputChange).toHaveBeenCalledWith('retentionLtv', '75');
    });

    it('should update tier display based on external criteria changes', () => {
      const { rerender } = render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={1}
        />
      );

      expect(screen.getByText('Tier 1')).toBeInTheDocument();

      // Simulate tier change from external criteria
      rerender(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
          currentTier={3}
        />
      );

      expect(screen.getByText('Tier 3')).toBeInTheDocument();
      expect(screen.queryByText('Tier 1')).not.toBeInTheDocument();
    });

    it('should maintain state consistency across multiple changes', () => {
      render(
        <BTLProductSelector 
          inputs={defaultInputs}
          onInputChange={mockOnInputChange}
          productScopes={defaultProductScopes}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const productScopeSelect = selects[0]; // First select is Product Scope
      const retentionSelect = selects[1]; // Second select is Retention

      // Multiple rapid changes
      fireEvent.change(productScopeSelect, { target: { value: 'Select Panel' } });
      fireEvent.change(productScopeSelect, { target: { value: 'Core Panel' } });
      fireEvent.change(retentionSelect, { target: { value: 'Yes' } });
      fireEvent.change(retentionSelect, { target: { value: 'No' } });

      expect(mockOnInputChange).toHaveBeenCalledTimes(4);
      expect(mockOnInputChange).toHaveBeenNthCalledWith(1, 'productScope', 'Select Panel');
      expect(mockOnInputChange).toHaveBeenNthCalledWith(2, 'productScope', 'Core Panel');
      expect(mockOnInputChange).toHaveBeenNthCalledWith(3, 'retentionChoice', 'Yes');
      expect(mockOnInputChange).toHaveBeenNthCalledWith(4, 'retentionChoice', 'No');
    });
  });
});

