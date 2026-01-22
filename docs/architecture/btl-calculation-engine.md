# BTL Calculation Engine - Implementation Summary

## Overview
The BTL calculation engine has been updated to match the integration `calculationEngine.js` pattern with full rate table integration.

## Key Improvements

### 1. Rate Table Integration ✅
Now reads limits directly from the `rates` table:
- **`min_loan`** / **`max_loan`**: Loan amount boundaries
- **`min_icr`**: Minimum Interest Coverage Ratio requirement
- **`max_ltv`**: Maximum Loan-to-Value ratio
- **`min_rolled_months`** / **`max_rolled_months`**: Rolled interest period limits
- **`min_defer_int`** / **`max_defer_int`**: Deferred interest percentage limits
- **`term_months`**: Loan term duration

### 2. Floor Rate Implementation ✅
Floor rates now sourced from the **`floor_rate`** column in the rates table:
```javascript
// Applied in applyFloorRate() method
if (selectedRate.floor_rate) {
  displayRate = max(displayRate, floor_rate%)
  stressRate = max(stressRate, floor_rate%)
}
```

**No hardcoded values** - each rate can have its own floor rate or none at all.

### 3. Market Rates from Constants ✅
BBR values sourced from `constants.js`:
- **`MARKET_RATES.STANDARD_BBR`**: 4% (0.04)
- **`MARKET_RATES.STRESS_BBR`**: 4.25% (0.0425)

### 4. Enhanced Max LTV Calculation ✅
The `getMaxLTV()` method now considers:
1. **For MAX_LTV loan type**: User slider input is primary (respects rate table as absolute max)
2. Rate table `max_ltv` value (absolute maximum cap)
3. Retention LTV rules (65% or 75%)
4. Special flat-above-commercial rules (tier-based: 65% for tier 2, 75% for tier 3)
5. Property type and tier combinations

**Key behavior**: When "Specific LTV required" is selected, the slider value directly controls the max LTV calculation, allowing precise LTV targeting.

### 5. Three Gross Loan Calculation Methods ✅

#### **Method A: Max LTV (default)**
```javascript
ltvCap = propertyValue × maxLtv
eligibleGross = min(ltvCap, maxFromRent, maxLoan)
```

#### **Method B: Specific Gross Loan**
```javascript
loanCap = min(specificGrossLoan, ltvCap, maxLoan)
eligibleGross = min(loanCap, maxFromRent)
```

#### **Method C: Specific Net Loan**
Works backwards to find gross loan that produces target net:
```javascript
denom = 1 - feePct - (payRate/12 × rolled) - (deferredRate/12 × term)
grossFromNet = specificNetLoan / denom
eligibleGross = min(grossFromNet, ltvCap, maxFromRent, maxLoan)
```

### 6. ICR-Based Loan Cap ✅
Rental income constraint applied:
```javascript
effectiveRent = monthlyRent + topSlicing
annualRent = effectiveRent × termMonths
remainingMonths = termMonths - rolledMonths

maxFromRent = annualRent / ((minICR/100) × (stressRate/12) × remainingMonths)
```

### 7. Optimization Algorithm ✅
For non-Core-Residential products, iterates through all combinations:
- **Rolled months**: 0 to `max_rolled_months` (step: 1 month)
- **Deferred rate**: 0 to `max_defer_int` (step: 0.0001%)
- Selects combination that **maximizes net loan**

## Core Formulas

### Rate Calculations
```javascript
// Display Rate
displayRate = isTracker ? (rate + STANDARD_BBR) : rate

// Stress Rate (for ICR)
stressRate = isTracker ? (rate + STRESS_BBR) : displayRate

// With floor applied
displayRate = max(displayRate, 5%)  // Core Residential only
```

### Loan Components
```javascript
productFee = gross × (productFeePercent / 100)
rolledInterest = gross × payRate × rolledMonths / 12
deferredInterest = gross × (deferredRate / 100) × termMonths / 12
netLoan = gross - productFee - rolledInterest - deferredInterest
```

### LTV & ICR
```javascript
ltv = gross / propertyValue
icr = (annualRent) / (annualizedInterest)
```

### Monthly Payment
```javascript
payRateAdjusted = displayRate - (deferredRate / 100)
directDebit = gross × payRateAdjusted / 12
```

## Usage in BTL_Calculator.jsx

The calculator calls the engine with all parameters:
```javascript
const result = computeBTLLoan({
  colKey,
  selectedRate,          // Rate record from database
  overriddenRate,        // User override (if any)
  propertyValue,
  monthlyRent,
  specificNetLoan,
  specificGrossLoan,
  maxLtvInput,
  topSlicing,
  loanType,              // MAX_LTV | SPECIFIC_GROSS | SPECIFIC_NET
  productType,
  productScope,
  tier,
  selectedRange,         // 'core' or 'specialist'
  criteria,              // Criteria answers
  retentionChoice,
  retentionLtv,
  productFeePercent,
  feeOverrides,
  manualRolled,          // Manual slider value
  manualDeferred,        // Manual slider value
  brokerRoute,
  procFeePct,
  brokerFeePct,
  brokerFeeFlat,
});
```

## Testing Recommendations

1. **Floor Rates**: Add `floor_rate` column to rates table, set values (e.g., 5 for 5%), verify rates don't go below floor
2. **Specific LTV Slider**: Select "Specific LTV required", move slider to 65%, verify max gross = property × 65%
3. **Retention Products**: Confirm LTV caps at 65%/75%
4. **Flat Above Commercial**: Test tier 2 (65%) and tier 3 (75%) limits
5. **ICR Constraint**: Verify rental income limits loan amount correctly
6. **Specific Net Loan**: Test reverse calculation accuracy
7. **Rate Table Limits**: Confirm min/max loan, ICR from database

## Rate Table Requirements

Ensure your `rates` table has these columns:
- `rate` (base rate/margin as percentage)
- `min_loan`, `max_loan`
- `min_icr` (as percentage, e.g., 125 = 125%)
- `max_ltv` (as percentage, e.g., 75 = 75%)
- `floor_rate` (minimum rate percentage, e.g., 5 = 5%, optional)
- `min_rolled_months`, `max_rolled_months`
- `min_defer_int`, `max_defer_int` (as percentage)
- `term_months`
- `admin_fee`, `exit_fee`
- `erc_1` through `erc_5` (ERC schedule)
- `revert_index`, `revert_margin` (revert rate info)

## Constants Configuration

In `constants.js`, ensure:
```javascript
export const MARKET_RATES = {
  STANDARD_BBR: 0.04,    // 4%
  STRESS_BBR: 0.0425,    // 4.25%
  CURRENT_MVR: 0.0859,   // 8.59%
};
```

---

**Implementation Date**: November 15, 2025  
**Based On**: `integration/calculationEngine.js` pattern  
**Status**: ✅ Complete
