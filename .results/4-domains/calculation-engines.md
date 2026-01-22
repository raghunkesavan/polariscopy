# Calculation Engines Domain - Pattern Deep Dive

## Overview
The calculation engines domain contains the core business logic for BTL (Buy-to-Let) and Bridging loan calculations. These are **pure, deterministic functions** that compute loan amounts, ICR (Interest Coverage Ratio), LTV (Loan-to-Value), fees, and other financial metrics.

---

## Required Patterns

### 1. BTL Calculation Engine Structure

**Pattern**: Use class-based engine with initialization and compute methods

**Example - btlCalculationEngine.js** (real code excerpt):
```javascript
import { parseNumber } from './calculator/numberFormatting';
import { LOAN_TYPES, PRODUCT_GROUPS, PROPERTY_TYPES, MARKET_RATES } from '../config/constants';

export class BTLCalculationEngine {
  constructor(params) {
    this.params = params;
    this.initialize();
  }

  /** Initialize all calculation parameters */
  initialize() {
    const {
      colKey,
      selectedRate,
      overriddenRate,
      propertyValue,
      monthlyRent,
      specificNetLoan,
      specificGrossLoan,
      maxLtvInput,
      topSlicing,
      loanType,
      productType,
      productScope,
      tier,
      selectedRange,
      criteria,
      retentionChoice,
      retentionLtv,
      productFeePercent,
      feeOverrides,
      limits = {},
      manualRolled,
      manualDeferred,
      brokerRoute,
      procFeePct,
      brokerFeePct,
      brokerFeeFlat,
    } = this.params;

    // Core identifiers
    this.colKey = colKey;
    this.selectedRate = selectedRate;
    this.overriddenRate = overriddenRate ?? null;
    this.productType = productType;
    this.productScope = productScope;
    this.tier = tier;
    this.selectedRange = selectedRange;
    this.criteria = criteria || {};
    this.retentionChoice = retentionChoice;
    this.retentionLtv = retentionLtv;
    
    // Normalize loan type (UI strings -> LOAN_TYPES constants)
    this.loanType = normalizeLoanType(loanType);
    
    this.limits = limits;
    this.brokerRoute = brokerRoute;

    // Numeric conversions with parseNumber utility
    this.propertyValue = parseNumber(propertyValue);
    this.monthlyRent = parseNumber(monthlyRent);
    this.specificNetLoan = parseNumber(specificNetLoan);
    this.specificGrossLoan = parseNumber(specificGrossLoan);
    this.maxLtvInput = parseNumber(maxLtvInput) / 100; // Convert to decimal
    this.topSlicing = parseNumber(topSlicing);

    // Fee percentage handling (per-column overrides)
    const feeValue = feeOverrides?.[colKey] != null ? feeOverrides[colKey] : productFeePercent;
    this.productFeePercent = parseNumber(feeValue);
    this.feePctDecimal = this.productFeePercent / 100;

    // Rate setup
    this.baseRate = selectedRate?.rate;
    this.actualRate = this.overriddenRate ?? this.baseRate;
    
    // Check product type flags
    this.isTracker = /tracker/i.test(productType || '');
    this.isCore = selectedRange === 'core' || productScope === 'Core';
    this.isResidential = productScope === 'Residential';
    
    // Manual slider overrides
    this.manualRolled = manualRolled;
    this.manualDeferred = manualDeferred;
    
    // Broker fees
    this.procFeePct = parseNumber(procFeePct) || 0;
    this.brokerFeePct = parseNumber(brokerFeePct) || 0;
    this.brokerFeeFlat = parseNumber(brokerFeeFlat) || 0;

    // Limits and constraints from rate table
    this.minLoan = selectedRate?.min_loan ?? limits.MIN_LOAN ?? 50000;
    this.maxLoan = selectedRate?.max_loan ?? limits.MAX_LOAN ?? 25000000;
    this.termMonths = selectedRate?.initial_term ?? selectedRate?.term_months ?? limits.TERM_MONTHS ?? 24;
    
    // ICR requirements from rate table
    this.minimumICR = selectedRate?.min_icr ?? (this.isTracker ? 130 : 145);
    
    // Rolled and deferred limits from rate table
    this.maxRolledMonths = selectedRate?.max_rolled_months ?? limits.MAX_ROLLED_MONTHS ?? 24;
    this.minRolledMonths = selectedRate?.min_rolled_months ?? 0;
    this.maxDeferredRate = selectedRate?.max_defer_int ?? limits.MAX_DEFERRED ?? 1.5;
    this.minDeferredRate = selectedRate?.min_defer_int ?? 0;
    
    // Market rates from constants
    this.standardBBR = MARKET_RATES.STANDARD_BBR ?? 0.04;
    this.stressBBR = MARKET_RATES.STRESS_BBR ?? 0.0425;
    
    // Max LTV from rate table or user input
    this.rateLtvLimit = selectedRate?.max_ltv ? parseNumber(selectedRate.max_ltv) / 100 : null;
    
    // Floor rate from rate table (for Core products)
    this.floorRate = selectedRate?.floor_rate ? parseNumber(selectedRate.floor_rate) : null;
    
    // Max top slicing from rate table (percentage, default 20%)
    this.maxTopSlicingPct = selectedRate?.max_top_slicing ? parseNumber(selectedRate.max_top_slicing) : 20;
    
    // Calculate maximum allowed top slicing value
    this.maxTopSlicingValue = this.monthlyRent * (this.maxTopSlicingPct / 100);
    
    // Validate and cap top slicing to maximum allowed
    if (this.topSlicing > this.maxTopSlicingValue) {
      this.topSlicing = this.maxTopSlicingValue;
    }
  }

  /** Apply floor rate from rate table */
  applyFloorRate(rate) {
    if (this.floorRate !== null && this.floorRate !== undefined) {
      const floorRateDecimal = this.floorRate / 100;
      return Math.max(rate, floorRateDecimal);
    }
    return rate;
  }

  /** Compute display rate and stress rate with floor applied */
  computeRates() {
    const { actualRate, isTracker, standardBBR, stressBBR, isCore } = this;
    
    // For tracker, add BBR to get display rate
    const baseDisplayRate = isTracker 
      ? (actualRate / 100) + standardBBR 
      : actualRate / 100;
    
    // Apply floor rate for Core products
    const displayRate = isCore ? this.applyFloorRate(baseDisplayRate) : baseDisplayRate;
    
    // Stress rate for ICR calculation
    const stressRate = isTracker 
      ? (actualRate / 100) + stressBBR 
      : displayRate;
    
    return { displayRate, stressRate };
  }

  /** Main compute method - returns full result object */
  compute() {
    // Compute rates first
    const { displayRate, stressRate } = this.computeRates();
    
    // Calculate loan amounts based on loan type
    let grossLoan, netLoan, ltv;
    
    switch (this.loanType) {
      case LOAN_TYPES.MAX_LTV:
        // Calculate maximum loan based on LTV
        grossLoan = this.propertyValue * this.maxLtvInput;
        netLoan = grossLoan * (1 - this.feePctDecimal);
        ltv = this.maxLtvInput;
        break;
        
      case LOAN_TYPES.SPECIFIC_NET:
        // User specified net loan required
        netLoan = this.specificNetLoan;
        grossLoan = netLoan / (1 - this.feePctDecimal);
        ltv = grossLoan / this.propertyValue;
        break;
        
      case LOAN_TYPES.SPECIFIC_GROSS:
        // User specified gross loan
        grossLoan = this.specificGrossLoan;
        netLoan = grossLoan * (1 - this.feePctDecimal);
        ltv = grossLoan / this.propertyValue;
        break;
        
      default:
        throw new Error(`Unknown loan type: ${this.loanType}`);
    }
    
    // Apply min/max loan constraints
    if (grossLoan < this.minLoan) {
      grossLoan = this.minLoan;
      netLoan = grossLoan * (1 - this.feePctDecimal);
      ltv = grossLoan / this.propertyValue;
    }
    if (grossLoan > this.maxLoan) {
      grossLoan = this.maxLoan;
      netLoan = grossLoan * (1 - this.feePctDecimal);
      ltv = grossLoan / this.propertyValue;
    }
    
    // Calculate ICR (Interest Coverage Ratio)
    const monthlyInterest = (grossLoan * stressRate) / 12;
    const effectiveRent = this.monthlyRent + this.topSlicing;
    const icr = effectiveRent / monthlyInterest;
    
    // Calculate fees
    const productFee = grossLoan * this.feePctDecimal;
    const procFee = grossLoan * (this.procFeePct / 100);
    const brokerFee = (grossLoan * (this.brokerFeePct / 100)) + this.brokerFeeFlat;
    
    // Return full result object
    return {
      colKey: this.colKey,
      grossLoan,
      netLoan,
      ltv,
      displayRate,
      stressRate,
      icr,
      productFee,
      procFee,
      brokerFee,
      totalFees: productFee + procFee + brokerFee,
      monthlyInterest,
      effectiveRent,
      meetsICR: icr >= this.minimumICR / 100,
      withinLTVLimit: this.rateLtvLimit ? ltv <= this.rateLtvLimit : true,
    };
  }
}

/** Main exported function */
export function computeBTLLoan(params) {
  const engine = new BTLCalculationEngine(params);
  return engine.compute();
}
```

**Key principles**:
- **Pure functions**: Same inputs always produce same outputs
- **No side effects**: No network calls, no DOM manipulation, no logging
- **Deterministic**: Calculations must be reproducible
- **Class-based structure**: Initialize once, compute many times
- **Parameter validation**: Use `parseNumber` utility for all numeric inputs
- **Rate table integration**: Prioritize rate table values over defaults

---

### 2. Number Formatting Utilities

**Pattern**: Always use numberFormatting utilities for parsing and displaying

**Example**:
```javascript
import { parseNumber, formatCurrency, formatPercent } from './calculator/numberFormatting';

// ✅ Parse user input (handles £, %, commas, etc.)
const propertyValue = parseNumber('£350,000'); // 350000
const rate = parseNumber('5.5%'); // 5.5
const ltv = parseNumber('75'); // 75

// ✅ Format for display
const displayLoan = formatCurrency(grossLoan); // "£262,500.00"
const displayRate = formatPercent(rate); // "5.50%"
const displayLTV = formatPercent(ltv); // "75.00%"

// ✅ Format with options
const shortCurrency = formatCurrency(grossLoan, { decimals: 0 }); // "£262,500"
const rateWith3Decimals = formatPercent(rate, { decimals: 3 }); // "5.500%"
```

---

### 3. Rate Filtering Logic

**Pattern**: Use rateFiltering.js functions for rate selection

**Example**:
```javascript
import { pickBestRate, computeTierFromAnswers } from './rateFiltering';

// ✅ Compute tier from criteria answers
const tier = computeTierFromAnswers(criteria);
// Returns: 1 | 2 | 3 | 4

// ✅ Pick best rate from available rates
const bestRate = pickBestRate(
  availableRates, // Array of rate objects from rates table
  {
    propertyType: 'HMO',
    loanType: 'Max LTV',
    productScope: 'Residential',
    tier,
    retentionChoice: 'No',
  }
);

// bestRate object structure:
// {
//   rate: 5.5,
//   max_ltv: 75,
//   min_icr: 145,
//   max_rolled_months: 24,
//   max_defer_int: 1.5,
//   product_fee: 2,
//   floor_rate: null,
//   is_retention: false,
//   ...
// }
```

---

### 4. Fee Column Structure

**Pattern**: Calculations performed per fee column (0-2%, 2-3%, 3%+); results stored in per-column state

**Example - Calculator component state**:
```jsx
function BTLCalculator() {
  // ✅ Results keyed by column (e.g., '2-3%', '3%+')
  const [results, setResults] = useState({
    '0-2%': null,
    '2-3%': null,
    '3%+': null,
  });
  
  // ✅ Update single column result
  const updateColumnResult = (colKey, newResult) => {
    setResults(prev => ({
      ...prev,
      [colKey]: newResult,
    }));
  };
  
  // ✅ Calculate for all columns
  const calculateAllColumns = () => {
    Object.keys(results).forEach(colKey => {
      const result = computeBTLLoan({
        ...sharedParams,
        colKey,
        productFeePercent: getFeePercentForColumn(colKey),
      });
      updateColumnResult(colKey, result);
    });
  };
}
```

---

### 5. Optimization Strategies (Manual vs Auto Mode)

**Pattern**: Engines support manual mode (user overrides) and auto mode (optimized values)

**Example**:
```javascript
// ✅ Auto mode - engine optimizes rolled months and deferred interest
const autoResult = computeBTLLoan({
  ...params,
  manualRolled: null, // null = auto optimize
  manualDeferred: null, // null = auto optimize
});

// ✅ Manual mode - user controls via sliders
const manualResult = computeBTLLoan({
  ...params,
  manualRolled: 12, // User set to 12 months
  manualDeferred: 1.0, // User set to 1.0%
});

// Engine logic:
// if (this.manualRolled !== null) {
//   rolledMonths = this.manualRolled;
// } else {
//   rolledMonths = optimizeRolledMonths(); // Auto calculation
// }
```

---

### 6. Bridging/Fusion Calculation Engine

**Pattern**: Use BridgeFusionCalculator class for bridging loans

**Example**:
```javascript
import { BridgeFusionCalculator } from './bridgeFusionCalculationEngine';

// ✅ Initialize calculator
const calculator = new BridgeFusionCalculator({
  propertyValue: 500000,
  purchasePrice: 450000,
  loanAmount: 350000,
  rate: 0.89, // Monthly rate (0.89% per month)
  term: 12, // Months
  productFee: 2, // 2% of loan
  isRetained: false,
  // ... other params
});

// ✅ Compute deferred interest loan
const result = calculator.computeDeferredInterest();

// Result structure:
// {
//   grossLoan: 350000,
//   netLoan: 343000,
//   totalInterest: 37450,
//   grossLoanPlusInterest: 387450,
//   monthlyPayment: 0, // Deferred = no monthly payments
//   ltv: 0.70,
//   exitFees: 3500,
//   totalRepayment: 390950,
// }

// ✅ Compute serviced loan
const servicedResult = calculator.computeServiced();

// Result structure:
// {
//   grossLoan: 350000,
//   netLoan: 343000,
//   monthlyPayment: 3115, // Monthly interest payments
//   ltv: 0.70,
//   exitFees: 3500,
//   totalRepayment: 387900,
// }
```

---

## Architectural Constraints

### 1. Pure Functions Only

**Rule**: Calculation engines MUST be pure functions with NO side effects

```javascript
// ❌ INCORRECT - Side effects in calculation
export function computeBTLLoan(params) {
  console.log('Computing loan...'); // NO - logging is side effect
  fetch('/api/save-calculation', { body: params }); // NO - network call is side effect
  document.title = 'Calculating...'; // NO - DOM manipulation is side effect
  
  return result;
}

// ✅ CORRECT - Pure function
export function computeBTLLoan(params) {
  const engine = new BTLCalculationEngine(params);
  return engine.compute();
}
```

---

### 2. Input Validation

**Rule**: ALL numeric inputs must be validated and sanitized before passing to engines

```javascript
import { parseNumber } from './calculator/numberFormatting';

// ✅ CORRECT - Parse and validate
const propertyValue = parseNumber(userInput.propertyValue);
if (isNaN(propertyValue) || propertyValue < 0) {
  throw new Error('Invalid property value');
}

const result = computeBTLLoan({
  propertyValue, // Already validated and parsed
  // ...
});

// ❌ INCORRECT - Pass raw input
const result = computeBTLLoan({
  propertyValue: userInput.propertyValue, // NO - might be "£350,000" string!
  // ...
});
```

---

### 3. Rate Table Priority

**Rule**: ALWAYS prioritize rate table values over hardcoded defaults

```javascript
// ✅ CORRECT - Rate table first, then fallback
this.minimumICR = selectedRate?.min_icr ?? (this.isTracker ? 130 : 145);
this.maxLoan = selectedRate?.max_loan ?? limits.MAX_LOAN ?? 25000000;

// ❌ INCORRECT - Hardcoded values
this.minimumICR = 145; // NO - ignores rate table
this.maxLoan = 25000000; // NO - ignores rate table and limits config
```

---

### 4. Result Object Structure

**Rule**: All calculation results must include standardized fields

```javascript
// ✅ Required fields in every result object
return {
  colKey: string,           // Fee column identifier
  grossLoan: number,        // Gross loan amount
  netLoan: number,          // Net loan (after product fee)
  ltv: number,              // Loan-to-value ratio (decimal, e.g., 0.75 for 75%)
  displayRate: number,      // Display rate (decimal, e.g., 0.055 for 5.5%)
  stressRate: number,       // Stress rate for ICR calculation (decimal)
  icr: number,              // Interest coverage ratio (e.g., 150 for 150%)
  productFee: number,       // Product fee amount
  procFee: number,          // Procuration fee amount
  brokerFee: number,        // Broker fee amount
  totalFees: number,        // Sum of all fees
  meetsICR: boolean,        // Whether ICR requirement is met
  withinLTVLimit: boolean,  // Whether LTV is within limit
};
```

---

## Common Calculations

### ICR Formula
```javascript
// Interest Coverage Ratio (ICR)
const monthlyInterest = (grossLoan * stressRate) / 12;
const effectiveRent = monthlyRent + topSlicing;
const icr = (effectiveRent / monthlyInterest) * 100; // As percentage
const meetsICR = icr >= minimumICR; // minimumICR from rate table (e.g., 145%)
```

### LTV Formula
```javascript
// Loan-to-Value (LTV)
const ltv = grossLoan / propertyValue; // Decimal (e.g., 0.75)
const ltvPercent = ltv * 100; // Percentage (e.g., 75%)
```

### Net Loan Formula
```javascript
// Net loan after product fee
const productFee = grossLoan * (productFeePercent / 100);
const netLoan = grossLoan - productFee;

// Or reverse calculation
const grossLoan = netLoan / (1 - productFeePercent / 100);
```

### Compound Interest (Bridging)
```javascript
// Deferred interest calculation
const monthlyRate = annualRate / 12; // e.g., 10.8% annual = 0.9% monthly
const totalInterest = grossLoan * monthlyRate * termMonths;
const grossLoanPlusInterest = grossLoan + totalInterest;
```

---

## Summary Checklist

When creating calculation engines, ensure:

- [ ] Pure functions (no side effects)
- [ ] Deterministic (same inputs → same outputs)
- [ ] All numeric inputs parsed with `parseNumber`
- [ ] All outputs formatted with `formatCurrency`/`formatPercent`
- [ ] Rate table values prioritized over defaults
- [ ] Per-column calculations (fee column structure)
- [ ] Support both manual and auto optimization modes
- [ ] Standardized result object structure
- [ ] Input validation before computation
- [ ] Min/max constraints applied from rate table
