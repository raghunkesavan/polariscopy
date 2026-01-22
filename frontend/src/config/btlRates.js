/**
 * BTL Rate Tables - Extracted from BTL Loan Hub Excel Calculator
 * Source of truth: "BTL Loan Hub 29.10.2025 Retention - issued v2.xlsx"
 * 
 * These rates are used for testing and as a fallback when database rates are unavailable.
 * 
 * Structure:
 * - Rates are organized by property type, product type (Tracker/Fixed), and tier
 * - Each tier has rates for different fee levels (2%, 4%, 6%)
 * - Tiers: 1 (Standard), 2 (Solutions), 3 (Specialist)
 */

// Market rates from Excel "Product Data" sheet
export const MARKET_RATES = {
  BBR: 4.00,    // Bank Base Rate (percent)
  MVR: 8.59,    // Margin Value Rate (percent)
  STRESS_BBR: 4.25, // Stress BBR for ICR calculations
};

// Residential Tracker rates by Tier (margin above BBR)
// From Excel Product Data sheet
export const RESIDENTIAL_TRACKER_RATES = {
  // Standard tier
  tier1: {
    fee2: 3.64,  // 7.64% full rate (BBR + margin)
    fee4: 2.59,  // 6.59% full rate
    fee6: 1.59,  // 5.59% full rate
  },
  // Solutions tier
  tier2: {
    fee2: 4.14,  // 8.14% full rate
    fee4: 3.09,  // 7.09% full rate
    fee6: 2.09,  // 6.09% full rate
  },
  // Specialist tier
  tier3: {
    fee2: 4.44,  // 8.44% full rate
    fee4: 3.39,  // 7.39% full rate
    fee6: 2.39,  // 6.39% full rate
  },
};

// Residential 2yr Fix rates by Tier
export const RESIDENTIAL_2YR_FIX_RATES = {
  tier1: {
    fee2: 6.69,
    fee4: 5.64,
    fee6: 4.64,
  },
  tier2: {
    fee2: 7.19,
    fee4: 6.14,
    fee6: 5.14,
  },
  tier3: {
    fee2: 7.49,
    fee4: 6.44,
    fee6: 5.44,
  },
};

// Residential 3yr Fix rates by Tier
export const RESIDENTIAL_3YR_FIX_RATES = {
  tier1: {
    fee2: 6.69,
    fee4: 5.64,
    fee6: 4.64,
  },
  tier2: {
    fee2: 7.19,
    fee4: 6.14,
    fee6: 5.14,
  },
  tier3: {
    fee2: 7.49,
    fee4: 6.44,
    fee6: 5.44,
  },
};

// Semi-Commercial rates (higher than residential)
export const SEMI_COMMERCIAL_TRACKER_RATES = {
  tier1: {
    fee2: 4.64,
    fee4: 3.59,
    fee6: 2.59,
  },
  tier2: {
    fee2: 5.14,
    fee4: 4.09,
    fee6: 3.09,
  },
  tier3: {
    fee2: 5.44,
    fee4: 4.39,
    fee6: 3.39,
  },
};

// Commercial rates (highest tier)
export const COMMERCIAL_TRACKER_RATES = {
  tier1: {
    fee2: 5.14,
    fee4: 4.09,
    fee6: 3.09,
  },
  tier2: {
    fee2: 5.64,
    fee4: 4.59,
    fee6: 3.59,
  },
  tier3: {
    fee2: 5.94,
    fee4: 4.89,
    fee6: 3.89,
  },
};

// Revert rates from Excel
// Format: { index: 'BBR'|'MVR', margin: number }
export const REVERT_RATES = {
  tracker: {
    index: 'MVR',
    margin: 0,  // MVR + 0%
  },
  fixed: {
    index: 'MVR',
    margin: 0,  // MVR + 0%
  },
};

// ICR requirements by product type
// From Excel Product Data sheet
export const ICR_REQUIREMENTS = {
  tracker: {
    tier1: 125,  // 125%
    tier2: 130,  // 130%
    tier3: 130,  // 130%
  },
  fixed: {
    tier1: 145,  // 145%
    tier2: 145,  // 145%
    tier3: 145,  // 145%
  },
};

// Max LTV by property type and tier
export const MAX_LTV = {
  residential: {
    tier1: 75,  // 75%
    tier2: 75,
    tier3: 75,
  },
  semiCommercial: {
    tier1: 70,
    tier2: 70,
    tier3: 70,
  },
  commercial: {
    tier1: 65,
    tier2: 65,
    tier3: 65,
  },
};

// Retention LTV limits
export const RETENTION_LTV = {
  65: 65,
  75: 75,
};

// Loan limits from Excel
export const LOAN_LIMITS = {
  MIN_LOAN: 50000,
  MAX_LOAN: 25000000,
  MAX_LOAN_CORE: 5000000,  // Core products have lower max
};

// Rolled/Deferred limits from Excel
export const ROLLED_DEFERRED_LIMITS = {
  MAX_ROLLED_MONTHS: 24,
  MIN_ROLLED_MONTHS: 0,
  MAX_DEFERRED_TRACKER: 1.5,  // 1.5%
  MAX_DEFERRED_FIX: 1.5,
  MIN_DEFERRED: 0,
};

// Product fees (from column headers)
export const PRODUCT_FEES = {
  standard: [2, 4, 6],
  retention: [1.5, 2.5, 3.5, 5.5],
};

// ERC (Early Repayment Charge) schedules
export const ERC_SCHEDULES = {
  '2yr_fix': [
    { year: 1, percent: 2 },
    { year: 2, percent: 1 },
  ],
  '3yr_fix': [
    { year: 1, percent: 3 },
    { year: 2, percent: 2 },
    { year: 3, percent: 1 },
  ],
  tracker: [
    { year: 1, percent: 1 },
    { year: 2, percent: 0.5 },
  ],
};

// Title Insurance thresholds
export const TITLE_INSURANCE = {
  MIN_FEE: 392,
  RATE: 0.0013,  // 0.13%
  IPT_MULTIPLIER: 1.12,  // 12% Insurance Premium Tax
  MAX_LOAN: 3000000,  // Only applicable up to £3m
};

// Helper function to get rate for a specific configuration
export function getBTLRate(propertyType, productType, tier, feePercent) {
  const tierKey = `tier${tier}`;
  const feeKey = `fee${feePercent}`;
  
  let rateTable;
  
  if (propertyType === 'Residential') {
    if (productType.includes('Tracker')) {
      rateTable = RESIDENTIAL_TRACKER_RATES;
    } else if (productType.includes('2yr Fix') || productType.includes('2yr_fix')) {
      rateTable = RESIDENTIAL_2YR_FIX_RATES;
    } else if (productType.includes('3yr Fix') || productType.includes('3yr_fix')) {
      rateTable = RESIDENTIAL_3YR_FIX_RATES;
    }
  } else if (propertyType === 'Semi-Commercial') {
    rateTable = SEMI_COMMERCIAL_TRACKER_RATES;
  } else if (propertyType === 'Commercial') {
    rateTable = COMMERCIAL_TRACKER_RATES;
  }
  
  if (!rateTable || !rateTable[tierKey]) return null;
  
  return rateTable[tierKey][feeKey] || null;
}

// Helper to get full rate (margin + BBR for trackers)
export function getFullRate(propertyType, productType, tier, feePercent) {
  const margin = getBTLRate(propertyType, productType, tier, feePercent);
  if (margin === null) return null;
  
  const isTracker = productType.toLowerCase().includes('tracker');
  return isTracker ? margin + MARKET_RATES.BBR : margin;
}

export default {
  MARKET_RATES,
  RESIDENTIAL_TRACKER_RATES,
  RESIDENTIAL_2YR_FIX_RATES,
  RESIDENTIAL_3YR_FIX_RATES,
  SEMI_COMMERCIAL_TRACKER_RATES,
  COMMERCIAL_TRACKER_RATES,
  REVERT_RATES,
  ICR_REQUIREMENTS,
  MAX_LTV,
  RETENTION_LTV,
  LOAN_LIMITS,
  ROLLED_DEFERRED_LIMITS,
  PRODUCT_FEES,
  ERC_SCHEDULES,
  TITLE_INSURANCE,
  getBTLRate,
  getFullRate,
};
