/**
 * Shared calculation utilities for BTL and Bridging calculators
 */

/**
 * Parse numeric input from various formats (currency strings, numbers, etc.)
 * @param {string|number} value - Input value to parse
 * @returns {number|null} Parsed number or null if invalid
 */
export function parseNumericInput(value) {
  if (value === undefined || value === null) return null;
  // Accept numbers
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  // Accept numeric strings (strip commas/currency etc.)
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Format number as currency (GBP)
 * @param {number} value - Number to format
 * @param {boolean} includeDecimals - Include decimal places (default: false)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, includeDecimals = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '£0';
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0
  }).format(value);
}

/**
 * Format number as percentage
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate LTV (Loan to Value) percentage
 * @param {number} loanAmount - Loan amount
 * @param {number} propertyValue - Property value
 * @returns {number} LTV percentage (0-100)
 */
export function calculateLTV(loanAmount, propertyValue) {
  const loan = parseNumericInput(loanAmount);
  const value = parseNumericInput(propertyValue);
  
  if (!loan || !value || value === 0) return 0;
  return (loan / value) * 100;
}

/**
 * Calculate ICR (Interest Coverage Ratio)
 * @param {number} monthlyRent - Monthly rental income
 * @param {number} monthlyInterest - Monthly interest payment
 * @returns {number} ICR percentage
 */
export function calculateICR(monthlyRent, monthlyInterest) {
  const rent = parseNumericInput(monthlyRent);
  const interest = parseNumericInput(monthlyInterest);
  
  if (!interest || interest === 0) return 0;
  if (!rent) return 0;
  
  return (rent / interest) * 100;
}

/**
 * Calculate monthly interest payment
 * @param {number} loanAmount - Loan amount
 * @param {number} annualRate - Annual interest rate (as percentage, e.g., 5.5)
 * @returns {number} Monthly interest payment
 */
export function calculateMonthlyInterest(loanAmount, annualRate) {
  const loan = parseNumericInput(loanAmount);
  const rate = parseNumericInput(annualRate);
  
  if (!loan || !rate) return 0;
  
  return (loan * (rate / 100)) / 12;
}

/**
 * Calculate net loan from gross loan and fees
 * @param {number} grossLoan - Gross loan amount
 * @param {number} productFee - Product fee (percentage or pounds)
 * @param {number} isPercentage - Whether fee is percentage (true) or flat amount (false)
 * @returns {number} Net loan amount
 */
export function calculateNetLoan(grossLoan, productFee, isPercentage = true) {
  const gross = parseNumericInput(grossLoan);
  const fee = parseNumericInput(productFee);
  
  if (!gross) return 0;
  if (!fee) return gross;
  
  if (isPercentage) {
    return gross - (gross * (fee / 100));
  } else {
    return gross - fee;
  }
}

/**
 * Calculate APRC (Annual Percentage Rate of Charge)
 * @param {number} initialRate - Initial interest rate
 * @param {number} fees - Total fees
 * @param {number} loanAmount - Loan amount
 * @param {number} termYears - Loan term in years
 * @returns {number} APRC percentage
 */
export function calculateAPRC(initialRate, fees, loanAmount, termYears) {
  const rate = parseNumericInput(initialRate);
  const totalFees = parseNumericInput(fees);
  const loan = parseNumericInput(loanAmount);
  const term = parseNumericInput(termYears);
  
  if (!loan || !term) return 0;
  
  const feePercent = totalFees ? (totalFees / loan) * 100 : 0;
  return rate + (feePercent / term);
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  const num = parseNumericInput(value);
  if (num === null) return min;
  return Math.min(Math.max(num, min), max);
}

/**
 * Round to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
export function roundTo(value, decimals = 2) {
  const num = parseNumericInput(value);
  if (num === null) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}

/**
 * Check if value is within range (inclusive)
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
export function isInRange(value, min, max) {
  const num = parseNumericInput(value);
  if (num === null) return false;
  return num >= min && num <= max;
}

/**
 * Extract numeric value from payload object
 * @param {Object} payload - Payload object
 * @param {string} key - Key to extract
 * @returns {number|null} Extracted numeric value
 */
export function extractNumericFromPayload(payload, key) {
  if (!payload) return null;
  
  let value = payload[key];
  
  // Try parsing if it's a string JSON
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      value = parsed[key];
    } catch {
      return null;
    }
  }
  
  return parseNumericInput(value);
}

/**
 * Extract string value from payload object
 * @param {Object} payload - Payload object
 * @param {string} key - Key to extract
 * @returns {string|null} Extracted string value
 */
export function extractStringFromPayload(payload, key) {
  if (!payload) return null;
  
  let value = payload[key];
  
  // Try parsing if it's a string JSON
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      value = parsed[key];
    } catch {
      return null;
    }
  }
  
  return value ? String(value) : null;
}
