/**
 * BTL Results Summary Component
 * Displays key calculated results for each product fee column
 * 
 * Note: This is a simplified summary component. The full BTLResultsTable
 * component would be 300-400 lines and handle:
 * - Expandable rows per column
 * - All 28+ calculated fields
 * - Integration with SliderResultRow and EditableResultRow
 * - Column visibility and ordering
 * - CSV export preparation
 * - Delete functionality
 * - Add as DIP workflow
 */

import React from 'react';
import { formatCurrency, formatPercent } from '../../../utils/calculator/numberFormatting';
import '../../../styles/Calculator.scss';

export default function BTLResultsSummary({
  results = [],
  columnsHeaders = [],
  onAddAsDIP,
  onDeleteColumn,
  isReadOnly = false,
  calculatorType = 'btl' // 'btl' or 'core'
}) {
  if (!results || results.length === 0) {
    return (
      <div className="no-results">
        <p className="slds-text-body_regular slds-text-color_weak">
          No results to display. Calculate to see results.
        </p>
      </div>
    );
  }

  // Key fields to display in summary
  const keyFields = [
    { key: 'grossLoan', label: 'Gross Loan', format: 'currency' },
    { key: 'netLoan', label: 'Net Loan', format: 'currency' },
    { key: 'ltv', label: 'LTV', format: 'percent' },
    { key: 'netLtv', label: 'Net LTV', format: 'percent' },
    { key: 'rate', label: 'Rate', format: 'percent' },
    { key: 'icr', label: 'ICR', format: 'ratio' },
    { key: 'rolledMonths', label: 'Rolled Months', format: 'months' },
    { key: 'servicedMonths', label: 'Serviced Months', format: 'months' },
    { key: 'monthlyInterestCost', label: 'Monthly Interest', format: 'currency' },
    { key: 'totalCostToBorrower', label: 'Total Cost', format: 'currency' },
    { key: 'aprc', label: 'APRC', format: 'percent' }
  ];

  const formatValue = (value, format) => {
    if (value === null || value === undefined || value === '') return '—';
    
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value, 2);
      case 'ratio':
        return typeof value === 'number' ? value.toFixed(2) : value;
      case 'months':
        return typeof value === 'number' ? `${value} months` : value;
      default:
        return value;
    }
  };

  return (
    <div className="btl-results-summary">
      <div className="slds-card">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h2 className="slds-card__header-title">
                <span className="slds-text-heading_small">Calculation Results</span>
              </h2>
            </div>
          </header>
        </div>
        
        <div className="slds-card__body slds-card__body_inner">
          {/* Results Table */}
          <div className="results-table-wrapper" data-calculator-type={calculatorType}>
            <table className="slds-table slds-table_cell-buffer slds-table_bordered">
              <thead>
                <tr className="slds-line-height_reset">
                  <th scope="col" className="th-label">
                    <div className="slds-truncate" title="Field">Field</div>
                  </th>
                  {columnsHeaders.map((header, idx) => {
                    const colNum = idx + 1;
                    return (
                      <th 
                        key={idx} 
                        scope="col" 
                        className="th-data-col"
                        style={{ 
                          backgroundColor: `var(--results-header-${calculatorType}-col${colNum}-bg, var(--results-header-col${((idx % 3) + 1)}-bg))`,
                          color: `var(--results-header-${calculatorType}-col${colNum}-text, var(--results-header-col${((idx % 3) + 1)}-text))`
                        }}
                      >
                        <div className="slds-truncate" title={header}>{header}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {keyFields.map((field, fieldIdx) => (
                  <tr key={fieldIdx} className="slds-hint-parent">
                    <th scope="row" data-label={field.label}>
                      <div className="slds-truncate" title={field.label}>
                        <strong>{field.label}</strong>
                      </div>
                    </th>
                    {results.map((result, colIdx) => (
                      <td key={colIdx} data-label={columnsHeaders[colIdx]}>
                        <div className="slds-truncate">
                          {formatValue(result[field.key], field.format)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons Row */}
          {!isReadOnly && (
            <div className="slds-grid slds-gutters slds-wrap action-buttons-row">
              {columnsHeaders.map((header, idx) => (
                <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
                  <div className="slds-button-group" role="group">
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => onAddAsDIP && onAddAsDIP(idx)}
                      title={`Add ${header} as DIP`}
                    >
                      Add as DIP
                    </button>
                    <button
                      type="button"
                      className="slds-button slds-button_destructive"
                      onClick={() => onDeleteColumn && onDeleteColumn(idx)}
                      title={`Delete ${header} column`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Implementation Note */}
      <div className="slds-box slds-theme_warning slds-m-top_medium">
        <p className="slds-text-body_small">
          <strong>Note:</strong> This is a summary view showing key fields. The full results table 
          would include 28+ calculated fields with expandable sections, slider controls, editable 
          fields, and advanced features. See BTL_REFACTORING_STATUS.md for implementation details.
        </p>
      </div>
    </div>
  );
}
