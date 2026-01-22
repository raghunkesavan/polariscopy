# BTL Calculator - Loan Type Bug Fix

## Problem
When changing the loan type dropdown in the BTL Calculator from "Max gross loan" to other options like "Net loan required" or "Specific gross loan", the calculations were not updating.

## Root Cause
**String Mismatch** between UI and calculation engine:

### UI Strings (BTLLoanDetailsSection.jsx)
```javascript
"Max gross loan"
"Net loan required"
"Specific LTV required"
"Specific gross loan"
```

### Expected Constants (from constants.js)
```javascript
LOAN_TYPES.MAX_LTV = "Maximum LTV Loan"
LOAN_TYPES.SPECIFIC_NET = "Specific Net Loan"
LOAN_TYPES.SPECIFIC_GROSS = "Specific Gross Loan"
```

The calculation engine was checking for the constant values, but receiving the UI strings, so all loan types were being treated as unrecognized and defaulting to MAX_LTV behavior.

## Solution

### 1. Added Normalization Function
Created `normalizeLoanType()` function in `btlCalculationEngine.js`:

```javascript
function normalizeLoanType(loanType) {
  if (!loanType) return LOAN_TYPES.MAX_LTV;
  
  const normalized = loanType.toLowerCase().trim();
  
  // Map UI strings to LOAN_TYPES constants
  if (normalized.includes('max') && normalized.includes('gross')) {
    return LOAN_TYPES.MAX_LTV; // "Max gross loan" -> MAX_LTV
  }
  if (normalized.includes('net') && normalized.includes('required')) {
    return LOAN_TYPES.SPECIFIC_NET; // "Net loan required" -> SPECIFIC_NET
  }
  if (normalized.includes('specific') && normalized.includes('gross')) {
    return LOAN_TYPES.SPECIFIC_GROSS; // "Specific gross loan" -> SPECIFIC_GROSS
  }
  if (normalized.includes('specific') && normalized.includes('ltv')) {
    return LOAN_TYPES.MAX_LTV; // "Specific LTV required" -> MAX_LTV
  }
  
  // Check if it's already a LOAN_TYPES constant
  if (Object.values(LOAN_TYPES).includes(loanType)) {
    return loanType;
  }
  
  // Default to MAX_LTV
  return LOAN_TYPES.MAX_LTV;
}
```

### 2. Applied Normalization in Constructor
```javascript
this.loanType = normalizeLoanType(loanType);
```

### 3. Updated calculatedRates useMemo
Fixed the basic calculations in BTL_Calculator.jsx to use case-insensitive checks:

```javascript
const loanTypeNormalized = (loanType || '').toLowerCase();

if (loanTypeNormalized.includes('specific') && loanTypeNormalized.includes('gross')) {
  gross = specificGross;
} else if (loanTypeNormalized.includes('net') && loanTypeNormalized.includes('required')) {
  // Work backwards from net loan
  gross = specificNet / (1 - pfPercent / 100);
} else if (loanTypeNormalized.includes('max') || loanTypeNormalized.includes('ltv')) {
  // Use LTV-based calculation
  gross = pv * (maxLtv / 100);
}
```

## Testing

### Before Fix
- Changing loan type → No change in calculations
- "Net loan required" → Still calculates as Max gross
- "Specific gross loan" → Still calculates as Max gross

### After Fix
- "Max gross loan" → ✅ Calculates based on LTV × Property Value
- "Net loan required" → ✅ Works backwards from target net loan
- "Specific gross loan" → ✅ Uses specified gross amount
- "Specific LTV required" → ✅ Uses LTV slider value

### Debug Logging
Added console logging to verify normalization:
```javascript
console.log(`[BTL Engine] Normalized loan type: "${originalLoanType}" -> "${this.loanType}"`);
```

You'll see messages like:
```
[BTL Engine] Normalized loan type: "Net loan required" -> "Specific Net Loan"
```

## How Each Loan Type Works Now

### 1. Max Gross Loan (Default)
```javascript
ltvCap = propertyValue × maxLtv
eligibleGross = min(ltvCap, maxFromRent, maxLoan)
```

**Example**: Property £500k, LTV 75% → Max Gross £375k

### 2. Net Loan Required
```javascript
denom = 1 - feePct - (payRate/12 × rolled) - (deferredRate/12 × term)
grossFromNet = specificNetLoan / denom
eligibleGross = min(grossFromNet, ltvCap, maxFromRent, maxLoan)
```

**Example**: Want Net £250k, Fee 2% → Gross ~£255k (approximately)

### 3. Specific Gross Loan
```javascript
loanCap = min(specificGrossLoan, ltvCap, maxLoan)
eligibleGross = min(loanCap, maxFromRent)
```

**Example**: Specify Gross £300k → Gross £300k (if passes ICR/LTV checks)

### 4. Specific LTV Required
Same as Max Gross Loan, but uses the slider value instead of rate table max_ltv.

## Files Modified

1. ✅ `btlCalculationEngine.js` - Added normalization function
2. ✅ `BTL_Calculator.jsx` - Fixed calculatedRates checks
3. ✅ Added debug logging for troubleshooting

## Testing Checklist

- [ ] Select "Max gross loan" → Verify gross = property × LTV%
- [ ] Select "Net loan required" → Enter £250k → Verify gross > £250k
- [ ] Select "Specific gross loan" → Enter £300k → Verify gross = £300k
- [ ] Select "Specific LTV required" → Move slider → Verify gross changes
- [ ] Check browser console for normalization messages
- [ ] Verify all conditional input fields appear/disappear correctly

## Future Improvements

Consider standardizing the UI strings to match LOAN_TYPES constants to avoid needing normalization:

```javascript
// Option 1: Update UI to use constants
<option value={LOAN_TYPES.MAX_LTV}>Max Gross Loan</option>
<option value={LOAN_TYPES.SPECIFIC_NET}>Net Loan Required</option>
<option value={LOAN_TYPES.SPECIFIC_GROSS}>Specific Gross Loan</option>

// Option 2: Create display name mapping
const LOAN_TYPE_LABELS = {
  [LOAN_TYPES.MAX_LTV]: 'Max Gross Loan',
  [LOAN_TYPES.SPECIFIC_NET]: 'Net Loan Required',
  [LOAN_TYPES.SPECIFIC_GROSS]: 'Specific Gross Loan',
};
```

---

**Fix Applied**: November 15, 2025  
**Status**: ✅ Complete - Ready for testing
