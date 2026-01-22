import React from 'react';

/**
 * SliderResultRow Component
 * Renders a slider control as a table row for interactive result fields
 * 
 * @param {string} label - The label for the row
 * @param {number} value - Current value (used as fallback if columnValues not provided)
 * @param {function} onChange - Callback when value changes, receives (newValue, columnKey)
 * @param {function} onReset - Optional callback when reset button clicked, receives (columnKey)
 * @param {number} min - Minimum value (fallback if columnMinValues not provided)
 * @param {number} max - Maximum value (fallback if columnMaxValues not provided)
 * @param {number} step - Step increment
 * @param {string} suffix - Optional suffix to display (e.g., "%", "months")
 * @param {boolean} disabled - Whether the slider is disabled
 * @param {boolean} displayOnly - When true, renders as plain text like other result rows (no slider)
 * @param {array} columns - Column headers for multi-column tables
 * @param {object} columnValues - Values for each column {columnKey: value}
 * @param {object} columnMinValues - Min values for each column {columnKey: min}
 * @param {object} columnMaxValues - Max values for each column {columnKey: max}
 * @param {object} columnDisabled - Whether each column is disabled {columnKey: boolean}
 * @param {object} columnOptimizedValues - Optimized values for each column {columnKey: optimizedValue}
 * @param {object} columnManualModeActive - Whether manual mode is active for each column {columnKey: boolean}
 * @param {function} formatValue - Optional formatter for displaying values (receives number, returns string)
 */
export default function SliderResultRow({ 
  label, 
  value, 
  onChange,
  onReset,
  min = 0, 
  max = 100, 
  step = 1, 
  suffix = '',
  disabled = false,
  displayOnly = false,
  columns = null,
  columnValues = null,
  columnMinValues = null,
  columnMaxValues = null,
  columnDisabled = null,
  columnOptimizedValues = null,
  columnManualModeActive = null,
  formatValue = null
}) {
  const handleChange = (e, columnKey = null) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue, columnKey);
  };

  // Multi-column mode
  if (Array.isArray(columns) && columns.length > 0) {
    // In displayOnly mode, use max values (fully utilized)
    if (displayOnly) {
      return (
        <tr>
          <td className="vertical-align-top font-weight-600">{label}</td>
          {columns.map((col) => {
            const colMax = columnMaxValues && columnMaxValues[col] !== undefined ? columnMaxValues[col] : max;
            const display = (n) => {
              if (typeof formatValue === 'function') {
                try { return formatValue(n); } catch { /* ignore */ }
              }
              return n;
            };
            return (
              <td key={col} className="vertical-align-top text-align-center">
                {display(colMax)}{suffix}
              </td>
            );
          })}
        </tr>
      );
    }
    
    return (
      <tr>
        <td className="vertical-align-middle font-weight-600">{label}</td>
        {columns.map((col) => {
          const colValue = columnValues && columnValues[col] !== undefined ? columnValues[col] : value;
          const colMin = columnMinValues && columnMinValues[col] !== undefined ? columnMinValues[col] : min;
          const colMax = columnMaxValues && columnMaxValues[col] !== undefined ? columnMaxValues[col] : max;
          const colDisabled = disabled || (columnDisabled && columnDisabled[col]);
          const colOptimized = columnOptimizedValues && columnOptimizedValues[col];
          // Use explicit manual mode flag instead of comparing values
          const isManuallyChanged = columnManualModeActive && columnManualModeActive[col] === true;
          
          const range = colMax - colMin;
          const percentage = range > 0 ? ((colValue - colMin) / range) * 100 : 0;
          
          const display = (n) => {
            if (typeof formatValue === 'function') {
              try { return formatValue(n); } catch { /* ignore */ }
            }
            return n;
          };

          return (
            <td key={col} className="vertical-align-middle" style={{ padding: 'var(--token-spacing-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="range"
                  min={colMin}
                  max={colMax}
                  step={step}
                  value={colValue}
                  onChange={(e) => handleChange(e, col)}
                  disabled={colDisabled}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    height: '6px',
                    borderRadius: 'var(--token-radius-sm)',
                    background: isManuallyChanged
                      ? `linear-gradient(to right, var(--token-warning) 0%, var(--token-warning) ${percentage}%, var(--token-border-subtle) ${percentage}%, var(--token-border-subtle) 100%)`
                      : colDisabled
                      ? 'var(--token-border-subtle)'
                      : `linear-gradient(to right, var(--token-interactive) 0%, var(--token-interactive) ${percentage}%, var(--token-border-subtle) ${percentage}%, var(--token-border-subtle) 100%)`,
                    outline: 'none',
                    cursor: colDisabled ? 'not-allowed' : 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    opacity: colDisabled ? 0.5 : 1
                  }}
                />
                <span 
                  style={{ 
                    minWidth: '60px', 
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 'var(--token-font-size-sm)',
                    color: colDisabled ? 'var(--token-text-secondary)' : (isManuallyChanged ? 'var(--token-warning)' : 'var(--token-text-primary)'),
                    opacity: colDisabled ? 0.6 : 1
                  }}
                >
                  {display(colValue)}{suffix}
                </span>
                {isManuallyChanged && onReset && !colDisabled && (
                  <button
                    onClick={() => onReset(col)}
                    disabled={colDisabled}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: colDisabled ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--token-font-size-xl-minus)',
                      color: 'var(--token-interactive)',
                      padding: '0 var(--token-spacing-xs)',
                      lineHeight: 1,
                      opacity: colDisabled ? 0.5 : 1
                    }}
                    title={`Reset to optimized value (${display(colOptimized)}${suffix})`}
                  >
                    ↺
                  </button>
                )}
              </div>
            </td>
          );
        })}
      </tr>
    );
  }

  // Single column mode
  const range = max - min;
  const percentage = range > 0 ? ((value - min) / range) * 100 : 0;
  
  const display = (n) => {
    if (typeof formatValue === 'function') {
      try { return formatValue(n); } catch { /* ignore */ }
    }
    return n;
  };

  // In displayOnly mode, show max value as text
  if (displayOnly) {
    return (
      <tr>
        <td className="vertical-align-top font-weight-600">{label}</td>
        <td className="vertical-align-top text-align-center">
          {display(max)}{suffix}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="vertical-align-middle font-weight-600">{label}</td>
      <td className="vertical-align-middle" style={{ padding: 'var(--token-spacing-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: '100px',
              height: '6px',
              borderRadius: 'var(--token-radius-sm)',
              background: `linear-gradient(to right, var(--token-interactive) 0%, var(--token-interactive) ${percentage}%, var(--token-border-subtle) ${percentage}%, var(--token-border-subtle) 100%)`,
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
          <span 
            style={{ 
              minWidth: '60px', 
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 'var(--token-font-size-sm)',
              color: 'var(--token-text-primary)'
            }}
          >
            {display(value)}{suffix}
          </span>
        </div>
      </td>
    </tr>
  );
}
