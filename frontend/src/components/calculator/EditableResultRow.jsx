import React, { useState } from 'react';

/**
 * EditableResultRow Component
 * Renders an editable table row where each column value can be modified
 * with a reset button to restore original values
 * 
 * @param {string} label - The label for the row
 * @param {array} columns - Column headers
 * @param {object} columnValues - Current values for each column
 * @param {object} originalValues - Original values for each column (for reset)
 * @param {object} columnSuffixes - Optional per-column suffixes (e.g., {col1: "%", col2: " + BBR"})
 * @param {function} onValueChange - Callback when a value changes (newValue, columnKey)
 * @param {function} onReset - Callback when reset is clicked (columnKey)
 * @param {boolean} disabled - Whether editing is disabled
 * @param {boolean} displayOnly - When true, renders as plain text like other result rows (no input styling)
 * @param {string} suffix - Optional default suffix (e.g., "%") - overridden by columnSuffixes
 */
export default function EditableResultRow({
  label,
  columns,
  columnValues,
  originalValues,
  columnSuffixes,
  onValueChange,
  onReset,
  disabled = false,
  displayOnly = false,
  suffix = ''
}) {
  const [editingColumn, setEditingColumn] = useState(null);
  const [localValues, setLocalValues] = useState({});

  const handleInputChange = (columnKey, value, inputElement) => {
    // Get the suffix for this column
    const colSuffix = columnSuffixes?.[columnKey] || suffix;
    
    // If user is editing and there's a suffix, ensure we're only editing the numeric part
    let rawValue = value;
    
    if (colSuffix) {
      // If value ends with suffix, extract the raw value
      if (value.endsWith(colSuffix)) {
        rawValue = value.slice(0, -colSuffix.length);
      } else {
        // User might have deleted the suffix, so use the value as-is
        rawValue = value;
      }
    }
    
    // Update local state with raw value (without suffix)
    setLocalValues(prev => ({ ...prev, [columnKey]: rawValue.trim() }));
    
    // Only propagate non-empty values to parent
    if (rawValue.trim() !== '') {
      onValueChange(rawValue.trim(), columnKey);
    }
  };

  const handleBlur = (columnKey) => {
    const colSuffix = columnSuffixes?.[columnKey] || suffix;
    const localValue = localValues[columnKey];
    // If field is empty on blur, reset to original value
    if (localValue !== undefined && localValue.trim() === '') {
      onReset(columnKey);
      setLocalValues(prev => {
        const updated = { ...prev };
        delete updated[columnKey];
        return updated;
      });
    } else if (localValue !== undefined && localValue.trim() !== '') {
      // Apply the value with suffix if it's not empty
      const valueWithSuffix = localValue.trim() + colSuffix;
      onValueChange(valueWithSuffix, columnKey);
    }
  };

  const handleReset = (columnKey) => {
    onReset(columnKey);
    setLocalValues(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  return (
    <tr>
      <td className="vertical-align-middle font-weight-600">{label}</td>
      {columns.map((col) => {
        const isEditing = editingColumn === col;
        // Determine suffix for this specific column (falls back to default suffix prop)
        const effectiveSuffix = (columnSuffixes && columnSuffixes[col]) || suffix || '';

        // Get the raw value (without suffix)
        let rawValue = '';
        if (isEditing && localValues[col] !== undefined) {
          rawValue = localValues[col];
        } else {
          const storedValue = columnValues?.[col] ?? '';
          // Remove per-column suffix from stored value to get raw value
          if (effectiveSuffix && typeof storedValue === 'string' && storedValue.endsWith(effectiveSuffix)) {
            rawValue = storedValue.slice(0, -effectiveSuffix.length);
          } else {
            rawValue = storedValue;
          }
        }

        // When editing, show only raw value for easier editing (suffix added visually on blur)
        // When not editing, show with the per-column suffix
        const displayValue = isEditing ? rawValue : (rawValue + effectiveSuffix);
        
        const originalValue = originalValues?.[col] ?? '';
        const hasOverride = columnValues?.[col] !== originalValue && originalValue !== '';
        
        // If displayOnly mode, render as plain text like other result rows
        if (displayOnly) {
          return (
            <td key={col} className="vertical-align-top text-align-center">
              {displayValue || '—'}
            </td>
          );
        }
        
        return (
          <td key={col} className="vertical-align-middle" style={{ padding: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={displayValue}
                onChange={(e) => handleInputChange(col, e.target.value, e.target)}
                onBlur={() => {
                  handleBlur(col);
                  setEditingColumn(null);
                }}
                disabled={disabled}
                style={{
                  flex: 1,
                  padding: '0.25rem 0.5rem',
                  border: hasOverride ? '2px solid var(--token-info)' : '1px solid var(--token-border-medium)',
                  borderRadius: '4px',
                  fontSize: 'var(--token-font-size-sm)',
                  textAlign: 'center',
                  backgroundColor: hasOverride ? 'var(--token-color-gray-light)' : 'white',
                  cursor: disabled ? 'not-allowed' : 'text'
                }}
                onFocus={() => setEditingColumn(col)}
              />
              {hasOverride && !disabled && (
                <button
                  onClick={() => handleReset(col)}
                  style={{
                    padding: 'var(--token-spacing-xs) var(--token-spacing-sm)',
                    border: '1px solid var(--token-color-gray-border)',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--token-font-size-xs)',
                    color: 'var(--token-info)',
                    fontWeight: '600'
                  }}
                  title={`Reset to ${originalValue}`}
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
