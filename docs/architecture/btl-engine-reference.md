# BTL Calculation Engine - Quick Reference

## Implementation Complete ✅

Your BTL calculation engine now uses the same formulas and patterns as the integration `calculationEngine.js`.

## What Changed

### ✅ Rate Table Integration
- **Min/Max Loan**: `selectedRate.min_loan`, `selectedRate.max_loan`
- **Min ICR**: `selectedRate.min_icr`
- **Max LTV**: `selectedRate.max_ltv`
- **Rolled Limits**: `selectedRate.min_rolled_months`, `selectedRate.max_rolled_months`
- **Deferred Limits**: `selectedRate.min_defer_int`, `selectedRate.max_defer_int`
- **Term**: `selectedRate.term_months`

### ✅ Floor Rates
Core Residential products automatically get **5% minimum floor rate**.

### ✅ BBR from Constants
```javascript
MARKET_RATES.STANDARD_BBR  // 4%
MARKET_RATES.STRESS_BBR    // 4.25%
```

### ✅ Enhanced Max LTV Logic
Considers:
1. Rate table `max_ltv`
2. Retention LTV (65% or 75%)
3. Flat-above-commercial tier rules
4. User slider input

### ✅ Three Gross Loan Methods

| Method | Formula |
|--------|---------|
| **Max LTV** | `gross = min(propertyValue × maxLTV, maxFromRent, maxLoan)` |
| **Specific Gross** | `gross = min(specificGross, ltvCap, maxFromRent, maxLoan)` |
| **Specific Net** | `gross = specificNet / (1 - fees% - rolled% - deferred%)` |

### ✅ ICR Constraint
```javascript
maxFromRent = annualRent / ((minICR/100) × (stressRate/12) × remainingMonths)
eligibleGross = min(loanCap, maxFromRent)
```

### ✅ Optimization Algorithm
For specialist products, tests all combinations:
- **Rolled months**: 0 → `max_rolled_months` (step: 1)
- **Deferred rate**: 0 → `max_defer_int` (step: 0.0001%)
- Selects combination that **maximizes net loan**

## Testing the Changes

Run the test suite:
```powershell
cd frontend
npm test btlCalculationEngine.test.js
```

## Key Formulas

### Rate with Floor
```javascript
displayRate = max(baseRate, 5%)  // Core Residential only
```

### Net Loan
```javascript
net = gross - productFee - rolledInterest - deferredInterest
```

### ICR
```javascript
ICR = annualRent / annualizedInterest
```

### Direct Debit
```javascript
directDebit = gross × (payRate/12)
```

## Questions Answered

1. ✅ **Floor rates for core products**: Implemented (5% minimum)
2. ✅ **BBR rates from constants**: Using `MARKET_RATES`
3. ✅ **Min/max loan from rates table**: Prioritized over defaults
4. ✅ **Min ICR from rates table**: Used for ICR constraint
5. ✅ **All gross loan calculations**: Max LTV, Specific Gross, Specific Net
6. ✅ **Optimization**: Same 0.0001% step as integration engine

## Files Modified

1. **`btlCalculationEngine.js`** - Main calculation engine
2. **`BTL_CALCULATION_ENGINE_IMPLEMENTATION.md`** - Full documentation
3. **`btlCalculationEngine.test.js`** - Test suite

## Next Steps

1. Test with real rate data from your database
2. Verify floor rate applies correctly to Core Residential
3. Check retention LTV caps (65%/75%)
4. Validate ICR constraint with different rent values
5. Test specific net loan reverse calculation

---

**Status**: ✅ Implementation Complete  
**Pattern**: Matches `integration/calculationEngine.js`  
**Date**: November 15, 2025
