/**
 * Bridge/Fusion Rate Tables
 * 
 * These rates are extracted from the Excel source of truth:
 * - Issued - Bridge Calc 051125.xlsx (Rates sheet)
 * 
 * This file provides static rate constants for testing and fallback purposes.
 * Production rates should be loaded from the database.
 */

/**
 * Variable Bridging Rates (Monthly Coupon)
 * Keyed by LTV bucket (60, 70, 75)
 */
export const VARIABLE_RATES = {
  60: {
    'Resi BTL single unit': 0.004,      // 0.40%
    'Resi Large Loan': 0.005,            // 0.50%
    'Resi Portfolio': 0.0045,            // 0.45%
    'Dev Exit': 0.0045,                  // 0.45%
    'Permitted/Light Dev': 0.0045,       // 0.45%
    'Semi & Full Commercial': 0.0045,    // 0.45%
    'Semi & Full Commercial Large Loan': 0.005, // 0.50%
    '2nd charge': 0.0045,                // 0.45%
  },
  70: {
    'Resi BTL single unit': 0.005,      // 0.50%
    'Resi Large Loan': 0.006,            // 0.60%
    'Resi Portfolio': 0.0055,            // 0.55%
    'Dev Exit': 0.0055,                  // 0.55%
    'Permitted/Light Dev': 0.0055,       // 0.55%
    'Semi & Full Commercial': 0.0055,    // 0.55%
    'Semi & Full Commercial Large Loan': 0.006, // 0.60%
    '2nd charge': 0.0055,                // 0.55%
  },
  75: {
    'Resi BTL single unit': 0.006,      // 0.60%
    'Resi Large Loan': 0.007,            // 0.70%
    'Resi Portfolio': 0.0065,            // 0.65%
    'Dev Exit': 0.0065,                  // 0.65%
    'Permitted/Light Dev': 0.0065,       // 0.65%
    'Semi & Full Commercial': 0.0065,    // 0.65%
    'Semi & Full Commercial Large Loan': 0.007, // 0.70%
    '2nd charge': null,                  // Use Rate Override
  },
};

/**
 * Fixed Bridging Rates (Monthly Coupon)
 * Keyed by LTV bucket (60, 70, 75)
 */
export const FIXED_RATES = {
  60: {
    'Resi BTL single unit': 0.0075,     // 0.75%
    'Resi Large Loan': 0.0085,           // 0.85%
    'Resi Portfolio': 0.008,             // 0.80%
    'Dev Exit': 0.008,                   // 0.80%
    'Permitted/Light Dev': 0.008,        // 0.80%
    'Semi & Full Commercial': 0.008,     // 0.80%
    'Semi & Full Commercial Large Loan': 0.0085, // 0.85%
    '2nd charge': 0.008,                 // 0.80%
  },
  70: {
    'Resi BTL single unit': 0.0085,     // 0.85%
    'Resi Large Loan': 0.0095,           // 0.95%
    'Resi Portfolio': 0.009,             // 0.90%
    'Dev Exit': 0.009,                   // 0.90%
    'Permitted/Light Dev': 0.009,        // 0.90%
    'Semi & Full Commercial': 0.009,     // 0.90%
    'Semi & Full Commercial Large Loan': 0.0095, // 0.95%
    '2nd charge': 0.009,                 // 0.90%
  },
  75: {
    'Resi BTL single unit': 0.0095,     // 0.95%
    'Resi Large Loan': 0.0105,           // 1.05%
    'Resi Portfolio': 0.01,              // 1.00%
    'Dev Exit': 0.01,                    // 1.00%
    'Permitted/Light Dev': 0.01,         // 1.00%
    'Semi & Full Commercial': 0.01,      // 1.00%
    'Semi & Full Commercial Large Loan': 0.0105, // 1.05%
    '2nd charge': null,                  // Use Rate Override
  },
};

/**
 * Fusion Rate Bands
 * Rates determined by gross loan amount
 */
export const FUSION_BANDS = {
  Residential: [
    { name: 'Tier 1', min: 0, max: 500000, margin: 0.04 },         // 4.00%
    { name: 'Tier 2', min: 500001, max: 1000000, margin: 0.0375 }, // 3.75%
    { name: 'Tier 3', min: 1000001, max: 2000000, margin: 0.035 }, // 3.50%
    { name: 'Tier 4', min: 2000001, max: 5000000, margin: 0.0325 }, // 3.25%
    { name: 'Tier 5', min: 5000001, max: Infinity, margin: 0.03 }, // 3.00%
  ],
  Commercial: [
    { name: 'Tier 1', min: 0, max: 500000, margin: 0.045 },        // 4.50%
    { name: 'Tier 2', min: 500001, max: 1000000, margin: 0.0425 }, // 4.25%
    { name: 'Tier 3', min: 1000001, max: 2000000, margin: 0.04 },  // 4.00%
    { name: 'Tier 4', min: 2000001, max: 5000000, margin: 0.0375 }, // 3.75%
    { name: 'Tier 5', min: 5000001, max: Infinity, margin: 0.035 }, // 3.50%
  ],
};

/**
 * Loan Limits by Product
 */
export const LOAN_LIMITS = {
  'Resi BTL single unit': { min: 100000, max: 4000000 },
  'Resi Large Loan': { min: 4000001, max: 20000000 },
  'Resi Portfolio': { min: 100000, max: 50000000 },
  'Dev Exit': { min: 100000, max: 30000000 },
  'Permitted/Light Dev': { min: 100000, max: 20000000 },
  'Semi & Full Commercial': { min: 100000, max: 3000000 },
  'Semi & Full Commercial Large Loan': { min: 3000001, max: 15000000 },
  '2nd charge': { min: 100000, max: 4000000 },
};

/**
 * Default Parameters
 */
export const DEFAULTS = {
  bbr: 0.04, // Bank of England Base Rate (4%)
  arrangementFee: 0.02, // 2%
  fusion: {
    term: 24,
    rolledMonths: 6,
    deferredPct: 0,
  },
  bridge: {
    term: 12,
    rolledMonths: 3,
  },
};

export default {
  VARIABLE_RATES,
  FIXED_RATES,
  FUSION_BANDS,
  LOAN_LIMITS,
  DEFAULTS,
};
