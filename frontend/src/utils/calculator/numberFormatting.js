/**
 * Number formatting utilities for calculator components
 * Pure functions with no side effects - safe for extraction
 */

/**
 * Parse numeric value from various input formats
 * Handles formatted currency strings, empty values, etc.
 * @param {*} v - Value to parse (string, number, null, undefined)
 * @returns {number} Parsed number or NaN if invalid
 */
export function parseNumber(v) {
  if (v === undefined || v === null || v === '') return NaN;
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Format number as currency input (for input fields)
 * Used in Bridging calculator
 * @param {*} v - Value to format
 * @returns {string} Formatted string or empty string if invalid
 */
export function formatCurrencyInput(v) {
  const n = parseNumber(v);
  return Number.isFinite(n) ? n.toLocaleString('en-GB') : '';
}

/**
 * Format number as currency display (for read-only display)
 * Used in BTL calculator
 * @param {number} n - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted currency string or '—' if invalid
 */
export function formatCurrency(n, decimals = 0) {
  if (!Number.isFinite(n)) return '—';
  return `£${Number(n).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Format number as percentage
 * Used in BTL calculator
 * @param {number} n - Number to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string or '—' if invalid
 */
export function formatPercent(n, decimals = 2) {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toFixed(decimals)}%`;
}
