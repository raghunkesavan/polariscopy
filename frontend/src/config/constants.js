// App-wide editable constants. The UI provides a Constants tab to edit these at runtime.
export const LOAN_TYPES = {
  MAX_OPTIMUM_GROSS: 'Max Optimum Gross Loan',
  SPECIFIC_NET: 'Specific Net Loan',
  MAX_LTV: 'Maximum LTV Loan',
  SPECIFIC_GROSS: 'Specific Gross Loan',
};

export const PRODUCT_GROUPS = {
  SPECIALIST: 'Specialist',
  CORE: 'Core',
};

export const PROPERTY_TYPES = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  SEMI_COMMERCIAL: 'Semi-Commercial',
};

export const RETENTION_OPTIONS = {
  YES: 'Yes',
  NO: 'No',
};

export const RETENTION_LTV_RANGES = {
  LTV_65: '65',
  LTV_75: '75',
};

// Default product lists per property type. The Constants UI allows editing these.
export const PRODUCT_TYPES_LIST = {
  Residential: ['2yr Fix', '3yr Fix', '2yr Tracker'],
  Commercial: ['2yr Fix', '3yr Fix', '2yr Tracker'],
  'Semi-Commercial': ['2yr Fix', '3yr Fix', '2yr Tracker'],
  Core: ['2yr Fix', '3yr Fix', '2yr Tracker'],
};

// Fee columns to display in output per property type and retention/core variants.
export const FEE_COLUMNS = {
  Residential: [6, 4, 3, 2],
  Commercial: [6, 4, 2],
  'Semi-Commercial': [6, 4, 2],
  RetentionResidential: [5.5, 3.5, 2.5, 1.5],
  RetentionCommercial: [5.5, 3.5, 1.5],
  'RetentionSemi-Commercial': [5.5, 3.5, 1.5],
  Core: [6, 4, 3, 2],
  Core_Retention_65: [5.5, 3.5, 2.5, 1.5],
  Core_Retention_75: [5.5, 3.5, 2.5, 1.5],
};

// NOTE: MAX_LTV_BY_TIER removed — flat-above-commercial logic is handled in the calculator
// and retained LTV thresholds are sourced from the rates table. This file no longer
// exports MAX_LTV_BY_TIER per user request.

// Special override rule for "Flat above commercial" criteria. This object is
// editable from the Constants admin UI. It controls whether the override is
// enabled and the tier->LTV mapping to apply when the user answers "Yes" to 
// the "Flat Above Commercial?" criteria question.
export const FLAT_ABOVE_COMMERCIAL_RULE = {
  enabled: true,
  // LTV limits by tier when "Flat Above Commercial?" = Yes
  tierLtv: { '2': 65, '3': 75 },
};

// Helper: key used to persist editable constants in localStorage
export const LOCALSTORAGE_CONSTANTS_KEY = 'app.constants.override.v1';

// Market/base rates used in calculations and stress checks. These are editable
// via the Constants admin UI and persisted to localStorage when changed.
export const MARKET_RATES = {
  // Standard Bank Base Rate (decimal, e.g. 0.04 = 4%)
  STANDARD_BBR: 0.04,
  // Stress BBR used for stress calculations
  STRESS_BBR: 0.0425,
  // Mortgage Valuation Rate (MVR) or similar margin applied to valuations
  CURRENT_MVR: 0.0859,
};

// Helpers to read runtime overrides safely from localStorage
function readJson(key) {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getMarketRates() {
  const overrides = readJson(LOCALSTORAGE_CONSTANTS_KEY);
  const fromOverrides = overrides?.marketRates;
  if (fromOverrides && typeof fromOverrides === 'object') {
    return {
      STANDARD_BBR: typeof fromOverrides.STANDARD_BBR === 'number' ? fromOverrides.STANDARD_BBR : MARKET_RATES.STANDARD_BBR,
      STRESS_BBR: typeof fromOverrides.STRESS_BBR === 'number' ? fromOverrides.STRESS_BBR : MARKET_RATES.STRESS_BBR,
      CURRENT_MVR: typeof fromOverrides.CURRENT_MVR === 'number' ? fromOverrides.CURRENT_MVR : MARKET_RATES.CURRENT_MVR,
    };
  }
  return MARKET_RATES;
}

// Broker routes and default commission percentages
// These are editable via the Constants admin UI
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  PACKAGER: 'Packager',
};

// Default broker commission percentages by route (as decimal, e.g. 0.007 = 0.7%)
// Each route now has separate proc fees for BTL and Bridge calculators
export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': { btl: 0.7, bridge: 0.7 },
  'Mortgage club': { btl: 0.9, bridge: 0.9 },
  'Network': { btl: 0.9, bridge: 0.9 },
  'Packager': { btl: 0.9, bridge: 0.9 },
};

// Broker commission tolerance (±0.2% from default value)
// Users can only adjust commission within this range
export const BROKER_COMMISSION_TOLERANCE = 0.2;

// Default funding lines for DIP selection. Editable via the Constants UI
// Separate lists for BTL and Bridge calculators
export const FUNDING_LINES_BTL = [
  'Main Lending Line',
  'Bridge Facility',
  'Development Line',
  'Specialist Line'
];

export const FUNDING_LINES_BRIDGE = [
  'Main Lending Line',
  'Bridge Facility',
  'Development Line',
  'Specialist Line'
];

// UI Preferences - controls keyboard shortcuts and visual hints
export const UI_PREFERENCES = {
  // Enable keyboard shortcuts (Ctrl+S, Esc, etc.)
  keyboardShortcutsEnabled: true,
  // Show keyboard shortcut hints on buttons (e.g., "Ctrl+S" badges)
  showKeyboardHints: true,
};

// Slider configuration moved to rate records in database
// Each rate now defines its own min/max values for rolled months and deferred interest
