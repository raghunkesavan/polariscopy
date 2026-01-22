/**
 * BTL Results Summary Component Tests
 * 
 * Tests for BTLResultsSummary component covering:
 * - Rendering of results table with key calculated fields
 * - Column headers display
 * - Empty state handling
 * - Value formatting (currency, percent, ratio)
 * - Action buttons (Add as DIP, Delete)
 * - Read-only mode
 * - Multiple columns/results
 * - Edge cases (null, undefined, missing fields)
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import BTLResultsSummary from '../../components/BTLResultsSummary';

describe('BTLResultsSummary Component', () => {
  const mockOnAddAsDIP = vi.fn();
  const mockOnDeleteColumn = vi.fn();

  const defaultColumnsHeaders = [
    'Product Fee 0%',
    'Product Fee 1%',
    'Product Fee 2%'
  ];

  const defaultResults = [
    {
      grossLoan: 200000,
      netLoan: 198000,
      ltv: 80,
      netLtv: 79.2,
      rate: 4.5,
      icr: 145,
      monthlyInterestCost: 750,
      totalCostToBorrower: 15000,
      aprc: 4.8
    },
    {
      grossLoan: 202000,
      netLoan: 199980,
      ltv: 80.8,
      netLtv: 80,
      rate: 4.3,
      icr: 148,
      monthlyInterestCost: 725,
      totalCostToBorrower: 17000,
      aprc: 4.6
    },
    {
      grossLoan: 204000,
      netLoan: 201960,
      ltv: 81.6,
      netLtv: 80.8,
      rate: 4.1,
      icr: 151,
      monthlyInterestCost: 700,
      totalCostToBorrower: 19000,
      aprc: 4.4
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================

  describe('Rendering', () => {
    it('should render card with header', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('Calculation Results')).toBeInTheDocument();
    });

    it('should render all key field labels', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('Gross Loan')).toBeInTheDocument();
      expect(screen.getByText('Net Loan')).toBeInTheDocument();
      expect(screen.getByText('LTV')).toBeInTheDocument();
      expect(screen.getByText('Net LTV')).toBeInTheDocument();
      expect(screen.getByText('Rate')).toBeInTheDocument();
      expect(screen.getByText('ICR')).toBeInTheDocument();
      expect(screen.getByText('Monthly Interest')).toBeInTheDocument();
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText('APRC')).toBeInTheDocument();
    });

    it('should render all column headers', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('Product Fee 0%')).toBeInTheDocument();
      expect(screen.getByText('Product Fee 1%')).toBeInTheDocument();
      expect(screen.getByText('Product Fee 2%')).toBeInTheDocument();
    });

    it('should render results table with correct structure', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Should have thead and tbody
      expect(table.querySelector('thead')).toBeInTheDocument();
      expect(table.querySelector('tbody')).toBeInTheDocument();
    });

    it('should render implementation note', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText(/This is a summary view showing key fields/i)).toBeInTheDocument();
    });
  });

  // ==================== EMPTY STATE TESTS ====================

  describe('Empty State', () => {
    it('should display empty state message when results is empty array', () => {
      render(
        <BTLResultsSummary
          results={[]}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText(/No results to display/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should display empty state when results is undefined', () => {
      render(
        <BTLResultsSummary
          results={undefined}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText(/No results to display/i)).toBeInTheDocument();
    });

    it('should display empty state when results is null', () => {
      render(
        <BTLResultsSummary
          results={null}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText(/No results to display/i)).toBeInTheDocument();
    });
  });

  // ==================== VALUE FORMATTING TESTS ====================

  describe('Value Formatting', () => {
    it('should format currency values with £ symbol and commas', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('£200,000')).toBeInTheDocument();
      expect(screen.getByText('£198,000')).toBeInTheDocument();
    });

    it('should format percentage values with % symbol', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // LTV values - multiple columns may have same value
      const ltvElements = screen.getAllByText('80.00%');
      expect(ltvElements.length).toBeGreaterThan(0);
      expect(screen.getByText('79.20%')).toBeInTheDocument();
    });

    it('should format ratio values with 2 decimal places', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // ICR values
      expect(screen.getByText('145.00')).toBeInTheDocument();
      expect(screen.getByText('148.00')).toBeInTheDocument();
    });

    it('should display em dash for null values', () => {
      const resultsWithNull = [
        {
          ...defaultResults[0],
          grossLoan: null,
          netLoan: null
        }
      ];

      render(
        <BTLResultsSummary
          results={resultsWithNull}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const table = screen.getByRole('table');
      const cells = table.querySelectorAll('td');
      
      // First two fields (Gross Loan, Net Loan) should show em dash
      expect(cells[0]).toHaveTextContent('—');
      expect(cells[1]).toHaveTextContent('—');
    });

    it('should display em dash for undefined values', () => {
      const resultsWithUndefined = [
        {
          ltv: 80,
          rate: 4.5
          // Other fields undefined
        }
      ];

      render(
        <BTLResultsSummary
          results={resultsWithUndefined}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const table = screen.getByRole('table');
      const emDashes = within(table).getAllByText('—');
      
      // Should have em dashes for undefined fields
      expect(emDashes.length).toBeGreaterThan(0);
    });

    it('should display em dash for empty string values', () => {
      const resultsWithEmpty = [
        {
          ...defaultResults[0],
          grossLoan: '',
          netLoan: ''
        }
      ];

      render(
        <BTLResultsSummary
          results={resultsWithEmpty}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const table = screen.getByRole('table');
      const cells = table.querySelectorAll('td');
      
      expect(cells[0]).toHaveTextContent('—');
      expect(cells[1]).toHaveTextContent('—');
    });
  });

  // ==================== MULTIPLE COLUMNS TESTS ====================

  describe('Multiple Columns', () => {
    it('should render single column correctly', () => {
      render(
        <BTLResultsSummary
          results={[defaultResults[0]]}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('Product Fee 0%')).toBeInTheDocument();
      expect(screen.queryByText('Product Fee 1%')).not.toBeInTheDocument();
    });

    it('should render three columns correctly', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('Product Fee 0%')).toBeInTheDocument();
      expect(screen.getByText('Product Fee 1%')).toBeInTheDocument();
      expect(screen.getByText('Product Fee 2%')).toBeInTheDocument();
    });

    it('should handle mismatch between results and headers gracefully', () => {
      render(
        <BTLResultsSummary
          results={[defaultResults[0], defaultResults[1]]}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // Should still render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should display values for each column independently', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // Each column should have different gross loan values
      expect(screen.getByText('£200,000')).toBeInTheDocument(); // Column 1
      expect(screen.getByText('£202,000')).toBeInTheDocument(); // Column 2
      expect(screen.getByText('£204,000')).toBeInTheDocument(); // Column 3
    });
  });

  // ==================== ACTION BUTTONS TESTS ====================

  describe('Action Buttons', () => {
    it('should render "Add as DIP" and "Delete" buttons for each column', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const addButtons = screen.getAllByText('Add as DIP');
      const deleteButtons = screen.getAllByText('Delete');

      expect(addButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    it('should call onAddAsDIP with correct column index when "Add as DIP" is clicked', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const addButtons = screen.getAllByText('Add as DIP');
      
      fireEvent.click(addButtons[0]);
      expect(mockOnAddAsDIP).toHaveBeenCalledWith(0);

      fireEvent.click(addButtons[1]);
      expect(mockOnAddAsDIP).toHaveBeenCalledWith(1);

      fireEvent.click(addButtons[2]);
      expect(mockOnAddAsDIP).toHaveBeenCalledWith(2);
    });

    it('should call onDeleteColumn with correct column index when "Delete" is clicked', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      
      fireEvent.click(deleteButtons[0]);
      expect(mockOnDeleteColumn).toHaveBeenCalledWith(0);

      fireEvent.click(deleteButtons[1]);
      expect(mockOnDeleteColumn).toHaveBeenCalledWith(1);

      fireEvent.click(deleteButtons[2]);
      expect(mockOnDeleteColumn).toHaveBeenCalledWith(2);
    });

    it('should handle missing onAddAsDIP callback gracefully', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const addButtons = screen.getAllByText('Add as DIP');
      
      // Should not throw error when clicked
      expect(() => fireEvent.click(addButtons[0])).not.toThrow();
    });

    it('should handle missing onDeleteColumn callback gracefully', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      
      // Should not throw error when clicked
      expect(() => fireEvent.click(deleteButtons[0])).not.toThrow();
    });

    it('should have proper title attributes on buttons', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const addButtons = screen.getAllByText('Add as DIP');
      const deleteButtons = screen.getAllByText('Delete');

      expect(addButtons[0]).toHaveAttribute('title', 'Add Product Fee 0% as DIP');
      expect(deleteButtons[0]).toHaveAttribute('title', 'Delete Product Fee 0% column');
    });
  });

  // ==================== READ-ONLY MODE TESTS ====================

  describe('Read-only Mode', () => {
    it('should hide action buttons when isReadOnly is true', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
          isReadOnly={true}
        />
      );

      expect(screen.queryByText('Add as DIP')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should show action buttons when isReadOnly is false (default)', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getAllByText('Add as DIP')).toHaveLength(3);
      expect(screen.getAllByText('Delete')).toHaveLength(3);
    });

    it('should still display results table in read-only mode', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
          isReadOnly={true}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Gross Loan')).toBeInTheDocument();
      expect(screen.getByText('£200,000')).toBeInTheDocument();
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const resultsWithZero = [
        {
          ...defaultResults[0],
          grossLoan: 0,
          rate: 0,
          icr: 0
        }
      ];

      render(
        <BTLResultsSummary
          results={resultsWithZero}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('£0')).toBeInTheDocument();
      expect(screen.getByText('0.00%')).toBeInTheDocument();
      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const resultsWithLarge = [
        {
          ...defaultResults[0],
          grossLoan: 10000000,
          totalCostToBorrower: 500000
        }
      ];

      render(
        <BTLResultsSummary
          results={resultsWithLarge}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('£10,000,000')).toBeInTheDocument();
      expect(screen.getByText('£500,000')).toBeInTheDocument();
    });

    it('should handle decimal values correctly', () => {
      const resultsWithDecimals = [
        {
          ...defaultResults[0],
          ltv: 79.456,
          rate: 4.375,
          icr: 145.678
        }
      ];

      render(
        <BTLResultsSummary
          results={resultsWithDecimals}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // Should format to 2 decimal places
      expect(screen.getByText('79.46%')).toBeInTheDocument();
      expect(screen.getByText('4.38%')).toBeInTheDocument();
      expect(screen.getByText('145.68')).toBeInTheDocument();
    });

    it('should handle empty columnsHeaders array', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={[]}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // Should still render table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Gross Loan')).toBeInTheDocument();
    });

    it('should handle undefined columnsHeaders prop', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // Should still render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      const resultsWithNegative = [
        {
          ...defaultResults[0],
          monthlyInterestCost: -750,
          totalCostToBorrower: -15000
        }
      ];

      render(
        <BTLResultsSummary
          results={resultsWithNegative}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('£-750')).toBeInTheDocument();
      expect(screen.getByText('£-15,000')).toBeInTheDocument();
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================

  describe('Accessibility', () => {
    it('should have proper table structure with thead and tbody', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const table = screen.getByRole('table');
      expect(table.querySelector('thead')).toBeInTheDocument();
      expect(table.querySelector('tbody')).toBeInTheDocument();
    });

    it('should use th elements for column headers', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should use th elements for row headers (field labels)', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders.length).toBe(9); // 9 key fields
    });

    it('should have proper scope attributes on headers', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });

      const rowHeaders = screen.getAllByRole('rowheader');
      rowHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'row');
      });
    });

    it('should have proper heading hierarchy', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Calculation Results');
    });

    it('should have proper button roles for action buttons', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(6); // 3 Add as DIP + 3 Delete
    });

    it('should support keyboard navigation on buttons', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const addButtons = screen.getAllByText('Add as DIP');
      addButtons[0].focus();

      expect(document.activeElement).toBe(addButtons[0]);
    });

    it('should have data-label attributes on table cells for responsive design', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      const table = screen.getByRole('table');
      const cells = table.querySelectorAll('td[data-label]');
      
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Component Integration', () => {
    it('should handle complete results display and action workflow', () => {
      render(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      // Verify results are displayed
      expect(screen.getByText('£200,000')).toBeInTheDocument();
      const ltvElements = screen.getAllByText('80.00%');
      expect(ltvElements.length).toBeGreaterThan(0);

      // Perform actions
      const addButtons = screen.getAllByText('Add as DIP');
      const deleteButtons = screen.getAllByText('Delete');

      fireEvent.click(addButtons[1]);
      expect(mockOnAddAsDIP).toHaveBeenCalledWith(1);

      fireEvent.click(deleteButtons[2]);
      expect(mockOnDeleteColumn).toHaveBeenCalledWith(2);
    });

    it('should update display when results change', () => {
      const { rerender } = render(
        <BTLResultsSummary
          results={[defaultResults[0]]}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('£200,000')).toBeInTheDocument();

      // Update results
      const newResults = [
        {
          ...defaultResults[0],
          grossLoan: 300000
        }
      ];

      rerender(
        <BTLResultsSummary
          results={newResults}
          columnsHeaders={['Product Fee 0%']}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText('£300,000')).toBeInTheDocument();
      expect(screen.queryByText('£200,000')).not.toBeInTheDocument();
    });

    it('should transition between empty and populated states', () => {
      const { rerender } = render(
        <BTLResultsSummary
          results={[]}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.getByText(/No results to display/i)).toBeInTheDocument();

      rerender(
        <BTLResultsSummary
          results={defaultResults}
          columnsHeaders={defaultColumnsHeaders}
          onAddAsDIP={mockOnAddAsDIP}
          onDeleteColumn={mockOnDeleteColumn}
        />
      );

      expect(screen.queryByText(/No results to display/i)).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
