# Bridging Second Charge Rate Logic - Analysis & Issue

## Overview
This document extracts the rate logic for bridging second charge calculations, focusing on the LTV-based rate selection issue.

## Problem Statement
**2nd charge rates are not being pulled correctly based on LTV**

The system is not selecting the appropriate rate rows when calculating second charge bridging loans, resulting in incorrect or missing rate selections.

---

## Current Rate Filtering Logic (BridgingCalculator.jsx lines 698-798)

### 1. Second Charge Detection
```javascript
// Line 723-730
const isSecondFlag = (r.second_charge === true) || (r.is_second === true);
const looksLikeSecond = /second/i.test(String(r.charge_type || r.product || r.type || r.charge || r.tier || ''));
const isSecond = isSecondFlag || looksLikeSecond;
```

**Detection Methods:**
- Boolean flags: `r.second_charge` or `r.is_second`
- Text matching: regex test on `charge_type`, `product`, `type`, `charge`, or `tier` fields
- Case-insensitive match for "second"

### 2. Charge Type Filter Logic
```javascript
// Line 731-739
// When 'Second' is selected we now INCLUDE all bridge rates (both second-charge flagged and standard),
// allowing the engine to apply second-charge capping universally. When 'First' is selected we exclude
// explicit second-charge rows. Otherwise (All) we include everything.
if (parsedCharge === 'first' && isSecond) return false;

// sub-product: skip sub-product filtering when Second charge is selected
if (parsedCharge !== 'second' && parsedSub) {
  const s = (r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.product || '').toString().toLowerCase();
  if (!s.includes(parsedSub)) return false;
}
```

**Filter Behavior:**
- **First Charge selected**: Exclude any rate row detected as second charge (`isSecond = true`)
- **Second Charge selected**: Include ALL bridge rates (both second-charge and standard rates)
  - Sub-product filtering is SKIPPED
- **All selected**: Include everything

### 3. LTV-Based Filtering for Bridge Rates
```javascript
// Line 745-756
const rowMin = parseNumber(r.min_ltv ?? r.minltv ?? r.min_LTV ?? r.minLTV ?? r.min_loan_ltv);
const rowMax = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
if (Number.isFinite(loanLtv)) {
  // Apply cap for bucket logic: 70% for second charge, 75% for standard bridge
  const cap = isSecond ? 70 : 75;
  const effectiveLtv = Math.min(loanLtv, cap);
  // Enforce only the minimum; allow values above rowMax so engine can cap gross internally
  if (Number.isFinite(rowMin) && effectiveLtv < rowMin) return false;
  // Never exclude on rowMax for bridge products; engine will handle capping
}
return true;
```

**LTV Filter Rules:**
1. Calculate `effectiveLtv` by capping user's LTV:
   - Second charge: cap at 70%
   - Standard bridge: cap at 75%
2. **Only enforce MINIMUM LTV**: Exclude rate if `effectiveLtv < rowMin`
3. **Do NOT enforce MAXIMUM LTV**: Allow rates above `rowMax`, engine will cap

**Computed LTV (from loanCalculations.js):**
```javascript
// Formula: ((Loan Amount + First Charge) / Property Value) × 100
export function computeLoanLtv(propertyValue, specificNetLoan, grossLoan, firstChargeValue) {
  const pv = parseNumber(propertyValue);
  const fcv = parseNumber(firstChargeValue) || 0; // First charge for combined LTV
  
  // Priority: specificNetLoan > grossLoan
  const loan = parseNumber(specificNetLoan) || parseNumber(grossLoan);
  
  if (!Number.isFinite(pv) || pv <= 0 || !Number.isFinite(loan)) return NaN;
  
  // Combined LTV = (new loan + first charge) / property value
  return ((loan + fcv) / pv) * 100;
}
```

---

## Second Charge Calculation Engine Logic

### Second Charge Cap Logic (bridgeFusionCalculationEngine.js lines 263-300)

```javascript
// === SECOND CHARGE MAX EXPOSURE CAP ===
// Business rule: combined exposure (first charge + new gross loan) must not exceed 70% LTV.
// If user supplied a gross above cap, we reduce (cap) it before any fee/interest calculations.
// If first charge already exceeds 70%, the loan amount must be zero.
let capApplied = false;
let maxSecondChargeGross = null;

if (secondChargeFlag && pv > 0) {
  const seventyPctPv = pv * 0.70;
  maxSecondChargeGross = Math.max(0, seventyPctPv - firstChargeValNum);
  
  if (gross > maxSecondChargeGross) {
    gross = maxSecondChargeGross;
    capApplied = true;
  }
}
```

**Second Charge Rules:**
1. **70% LTV Cap**: Combined exposure (first charge + gross loan) ≤ 70% of property value
2. **Maximum Gross**: `maxSecondChargeGross = (PV × 0.70) - firstChargeAmount`
3. **Automatic Capping**: If requested gross > max, reduce to max and flag `capApplied = true`
4. **Zero Loan Scenario**: If first charge ≥ 70% LTV, max gross = 0

### LTV Bucket Determination for Rate Selection

```javascript
// Line 410-412 in bridgeFusionCalculationEngine.js
// Calculate LTV bucket. For second charge products the bucket is determined on the combined exposure
const exposureForBucket = gross + (secondChargeFlag ? firstChargeValNum : 0);
const ltvBucket = this.getLtvBucket(exposureForBucket, pv);
```

**Bucket Logic:**
```javascript
static getLtvBucket(gross, propertyValue) {
  if (!propertyValue || propertyValue <= 0) return 75;
  const ltvPct = (gross / propertyValue) * 100;
  if (ltvPct <= 60) return 60;
  if (ltvPct <= 70) return 70;
  return 75;
}
```

**Second Charge Bucket Calculation:**
- Uses **combined exposure** (gross + first charge) to determine bucket
- Returns 60, 70, or 75 based on total exposure LTV
- This bucket is used to select the correct rate from the rate record

---

## 🔴 IDENTIFIED ISSUES

### Issue 1: Filter Logic Includes All Rates for Second Charge
**Location**: Line 731-739 in BridgingCalculator.jsx

**Problem:**
When `chargeType === 'second'`, the filter includes ALL bridge rates (both second-charge specific and standard first-charge rates). This means:

1. Standard first-charge rates (with LTV buckets 60-75%) are included
2. Second-charge specific rates (with LTV buckets appropriate for 2nd charge) are included
3. NO preference is given to second-charge specific rates

**Impact:**
The `pickBestRate` function may select a standard first-charge rate instead of a second-charge specific rate, even when second-charge rates exist in the database.

### Issue 2: LTV Capping in Filter May Mismatch Engine Bucket
**Location**: Lines 745-756 in BridgingCalculator.jsx

**Problem:**
The filter applies a 70% cap to `effectiveLtv` for bucket logic:
```javascript
const cap = isSecond ? 70 : 75;
const effectiveLtv = Math.min(loanLtv, cap);
```

But the **calculation engine** (line 410-412) uses the **actual combined exposure** to determine the bucket:
```javascript
const exposureForBucket = gross + (secondChargeFlag ? firstChargeValNum : 0);
const ltvBucket = this.getLtvBucket(exposureForBucket, pv);
```

**Scenario:**
- User enters: Property Value = £500,000, First Charge = £300,000 (60% LTV), New Loan = £100,000
- Combined LTV = (300k + 100k) / 500k = 80%
- **Filter's effectiveLtv**: min(80, 70) = 70% → selects rates with min_ltv ≤ 70%
- **Engine's bucket**: 80% LTV → bucket = 75
- **Mismatch**: Filter may include 70% bucket rates, but engine uses 75% bucket rates

This discrepancy can cause:
1. Wrong rates included/excluded in filter
2. Rate selected may not have the correct LTV bucket for the engine's calculation

### Issue 3: Only Minimum LTV Enforced
**Location**: Line 753 in BridgingCalculator.jsx

**Current Code:**
```javascript
// Enforce only the minimum; allow values above rowMax so engine can cap gross internally
if (Number.isFinite(rowMin) && effectiveLtv < rowMin) return false;
// Never exclude on rowMax for bridge products; engine will handle capping
```

**Problem:**
For second charge, the filter allows rates with `min_ltv` up to the capped 70%. However:

1. If the database has second-charge rates with `min_ltv = 65%`, `max_ltv = 70%`
2. And standard rates with `min_ltv = 60%`, `max_ltv = 75%`
3. For a 68% combined LTV, BOTH will be included
4. The "best rate" selection may pick the wrong one

**Expected Behavior:**
Should prioritize second-charge specific rates when available, not mix with standard rates.

---

## 🔧 RECOMMENDED FIXES

### Fix 1: Prioritize Second-Charge Specific Rates
**Location**: Lines 710-756 in BridgingCalculator.jsx

**Change:**
When `chargeType === 'second'`, prefer second-charge specific rates. If none exist, fall back to standard rates.

```javascript
// Bridge rate filtering
const bridgeOut = raw.filter((r) => {
  // ... existing productScope and set_key checks ...
  
  // Detect second-charge rates
  const isSecondFlag = (r.second_charge === true) || (r.is_second === true);
  const looksLikeSecond = /second/i.test(String(r.charge_type || r.product || r.type || r.charge || r.tier || ''));
  const isSecond = isSecondFlag || looksLikeSecond;
  
  // NEW: When user selects 'Second', prioritize second-charge specific rates
  if (parsedCharge === 'second') {
    // OPTION A: Strict - only include second-charge rates
    if (!isSecond) return false;
    
    // OPTION B: Fallback - prefer second-charge, but allow standard if no second-charge rates found
    // (implement in two-pass filter)
  }
  
  // When 'First' is selected, exclude second-charge rates
  if (parsedCharge === 'first' && isSecond) return false;
  
  // ... rest of filtering ...
});

// OPTION B implementation (two-pass):
let bridgeOut = raw.filter(/* ...filter with isSecond check... */);
if (parsedCharge === 'second' && bridgeOut.length === 0) {
  // No second-charge specific rates found, fall back to standard rates
  bridgeOut = raw.filter(/* ...filter without isSecond check... */);
}
```

### Fix 2: Align Filter LTV Cap with Engine Bucket Calculation
**Location**: Lines 745-756 in BridgingCalculator.jsx

**Problem:** Filter uses capped LTV (70% for 2nd charge), but engine uses actual combined LTV for bucket

**Change:**
Use the same combined exposure calculation in the filter as the engine uses:

```javascript
// Calculate combined LTV for second charge (matching engine logic)
let combinedLtv = loanLtv; // Default to calculated LTV
if (parsedCharge === 'second') {
  const pv = parseNumber(propertyValue);
  const fcv = parseNumber(firstChargeValue) || 0;
  const grossInput = parseNumber(grossLoan);
  
  if (Number.isFinite(pv) && pv > 0 && Number.isFinite(grossInput)) {
    // This matches engine's exposureForBucket calculation
    combinedLtv = ((grossInput + fcv) / pv) * 100;
  }
}

// Use combinedLtv for filtering
const rowMin = parseNumber(r.min_ltv ?? /* ... */);
const rowMax = parseNumber(r.max_ltv ?? /* ... */);

if (Number.isFinite(combinedLtv)) {
  // For second charge, use actual combined LTV (may exceed 70%)
  // But only select rates that can handle this bucket
  const ltvForSelection = parsedCharge === 'second' ? combinedLtv : Math.min(loanLtv, 75);
  
  if (Number.isFinite(rowMin) && ltvForSelection < rowMin) return false;
  
  // NEW: For second charge, also enforce max to select correct bucket
  if (parsedCharge === 'second' && Number.isFinite(rowMax) && ltvForSelection > rowMax) return false;
}
```

### Fix 3: Add Debug Logging for Second Charge Rate Selection

```javascript
if (parsedCharge === 'second') {
  console.log('=== SECOND CHARGE RATE FILTERING ===');
  console.log('Property Value:', propertyValue);
  console.log('First Charge:', firstChargeValue);
  console.log('Gross Loan:', grossLoan);
  console.log('Combined LTV:', loanLtv);
  console.log('Second-charge rates found:', bridgeOut.filter(r => 
    r.second_charge || /second/i.test(String(r.product || r.type))
  ).length);
  console.log('Standard rates found:', bridgeOut.filter(r => 
    !r.second_charge && !/second/i.test(String(r.product || r.type))
  ).length);
  console.log('Sample rates:', bridgeOut.slice(0, 3).map(r => ({
    product: r.product,
    type: r.type,
    min_ltv: r.min_ltv,
    max_ltv: r.max_ltv,
    rate: r.rate,
    is_second: r.second_charge || /second/i.test(String(r.product || r.type))
  })));
}
```

---

## Testing Scenarios

### Scenario 1: Second Charge with Combined LTV < 70%
- Property Value: £500,000
- First Charge: £200,000 (40%)
- New Loan: £100,000
- Combined LTV: 60%
- **Expected**: Should select 60% bucket second-charge rate

### Scenario 2: Second Charge with Combined LTV = 70%
- Property Value: £500,000
- First Charge: £250,000 (50%)
- New Loan: £100,000
- Combined LTV: 70%
- **Expected**: Should select 70% bucket second-charge rate, cap gross at limit

### Scenario 3: Second Charge with Combined LTV > 70% (exceeds cap)
- Property Value: £500,000
- First Charge: £300,000 (60%)
- New Loan: £150,000 (requested)
- Combined LTV: 90% (requested)
- **Expected**: 
  - Cap gross at £50,000 (70% - 60% = 10% of £500k)
  - Combined LTV: 70%
  - Select 70% bucket second-charge rate
  - Show warning that requested loan exceeds cap

### Scenario 4: First Charge Already at/Exceeds 70%
- Property Value: £500,000
- First Charge: £350,000 (70%)
- New Loan: £50,000 (requested)
- **Expected**:
  - Max available loan: £0
  - Show error: "Cannot provide second charge loan - first charge already at/exceeds 70% LTV limit"

---

## Database Rate Structure Requirements

For proper second charge rate selection, the database should have:

### Second-Charge Specific Rates
```
set_key: 'Bridging_Second_Var' or 'Bridging_Second_Fix'
product: 'Second Charge' or contains 'second'
charge_type: 'Second' or 'second charge'
min_ltv: 60, 65, 70 (combined LTV buckets)
max_ltv: 65, 70, 70 (combined LTV buckets)
rate: [monthly margin or coupon for second charge]
```

### Standard First-Charge Rates
```
set_key: 'Bridging_Var' or 'Bridging_Fix'
product: 'Variable Bridge' or 'Fixed Bridge'
charge_type: 'First' or null
min_ltv: 60, 70, 75
max_ltv: 70, 75, 75
rate: [monthly margin or coupon for first charge]
```

**Key Difference**: Second-charge rates should have explicit markers (`charge_type`, `product`, or boolean flags) AND appropriate LTV buckets (max 70%).

---

## Summary of Issues

| Issue | Location | Impact | Severity |
|-------|----------|--------|----------|
| Includes all bridge rates for 2nd charge | Lines 731-739 | Wrong rate selected | **HIGH** |
| LTV cap mismatch (filter vs engine) | Lines 745-756, engine 410 | Incorrect rate bucket | **HIGH** |
| Only min LTV enforced | Line 753 | Wrong rate range included | **MEDIUM** |
| No prioritization of 2nd charge rates | Line 731 | Standard rates used instead | **HIGH** |

## Next Steps

1. **Implement Fix 1**: Prioritize second-charge specific rates
2. **Implement Fix 2**: Align filter LTV calculation with engine
3. **Add Debug Logging**: Track rate selection for second charge
4. **Verify Database**: Ensure second-charge rates are properly marked and have correct LTV buckets
5. **Test All Scenarios**: Validate fixes with test cases above
