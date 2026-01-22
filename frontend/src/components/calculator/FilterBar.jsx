import React from 'react';

/**
 * FilterBar - Reusable filter controls for calculator results
 * Used in BTL, Bridging, and other calculator pages
 * 
 * @param {array} filters - Array of filter objects with { label, value, onChange, options, type }
 * @param {object} tierInfo - Optional tier display info { label, value }
 */
export default function FilterBar({ filters = [], tierInfo = null }) {
  return (
    <div className="slds-grid slds-wrap slds-m-bottom_medium gap-sm" style={{ 
      alignItems: 'flex-end',
      padding: 'var(--token-spacing-md) 0'
    }}>
      {/* Render filters */}
      {filters.map((filter, index) => (
        <div key={index} className="slds-form-element" style={{ minWidth: filter.minWidth || '150px' }}>
          <label className="slds-form-element__label">{filter.label}</label>
          <div className="slds-form-element__control">
            {filter.type === 'select' ? (
              <select
                className="slds-select"
                value={filter.value}
                onChange={filter.onChange}
                disabled={filter.disabled}
              >
                {filter.options?.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : filter.type === 'number' ? (
              <input
                type="number"
                className="slds-input"
                value={filter.value}
                onChange={filter.onChange}
                disabled={filter.disabled}
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
            ) : (
              <input
                type="text"
                className="slds-input"
                value={filter.value}
                onChange={filter.onChange}
                disabled={filter.disabled}
                placeholder={filter.placeholder}
              />
            )}
          </div>
        </div>
      ))}

      {/* Tier display (optional) */}
      {tierInfo && (
        <div className="tier-display" style={{ marginLeft: 'auto' }}>
          <span className="tier-label">{tierInfo.label}</span>
          <strong className="tier-value">{tierInfo.value}</strong>
        </div>
      )}
    </div>
  );
}
