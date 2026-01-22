import React from 'react';

/**
 * Accessible toggle switch used across calculator screens.
 * Keeps original DOM structure to avoid visual regressions.
 */
export default function ModernSwitch({
  label,
  ariaLabel,
  checked = false,
  onToggle,
  disabled = false,
  className = '',
  style = {},
  name,
  id,
}) {
  const handleToggle = () => {
    if (disabled) return;
    if (typeof onToggle === 'function') {
      onToggle(!checked);
    }
  };

  const resolvedAriaLabel = ariaLabel || label || name || 'Toggle';

  return (
    <div
      className={`modern-switch ${className}`.trim()}
      style={style}
      data-disabled={disabled || undefined}
    >
      {label && (
        <span className="switch-label" id={id ? `${id}-label` : undefined}>
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={resolvedAriaLabel}
        aria-labelledby={!ariaLabel && label && id ? `${id}-label` : undefined}
        onClick={handleToggle}
        className={`switch-track ${checked ? 'checked' : ''}`.trim()}
        disabled={disabled}
        id={id}
        name={name}
      >
        <span className={`switch-thumb ${checked ? 'checked' : ''}`.trim()} />
      </button>
    </div>
  );
}
