# NBP LTV Implementation Analysis

## Overview
Add new field **NBP LTV** to calculator results across the entire platform.
- **Formula**: `(NBP / Property Value) * 100`
- **Display**: Percentage value (e.g., 75.5%)
- **Scope**: BTL, Bridging, and Fusion calculators

---

## 1. CALCULATION ENGINES (Core Logic)

### 1.1 Bridging/Fusion Calculator
**File**: `frontend/src/utils/bridgeFusionCalculationEngine.js`
**Location**: Line ~612-628 (in `solve()` method return object)

**Current NBP Calculation**:
```javascript
// NBP = Net Loan + max(2% of gross loan, arrangement fee)
const maxFeeForNBP = Math.max(gross * 0.02, arrangementFeeGBP);
const nbp = netLoanGBP + maxFeeForNBP;
```

**Action Required**:
1. Add NBP LTV calculation after NBP calculation (line ~614)
2. Add to return object (line ~626)

**New Code**:
```javascript
const nbp = netLoanGBP + maxFeeForNBP;
const nbpLTV = pv > 0 ? (nbp / pv) * 100 : 0; // NEW LINE

return {
  // ... existing fields ...
  npb: nbp,
  nbpLTV: nbpLTV, // NEW FIELD
  // ... rest of fields ...
};
```

---

### 1.2 BTL Calculator
**File**: `frontend/src/utils/btlCalculationEngine.js`
**Location**: Line ~713-807 (in `compute()` method)

**Current NBP Calculation**:
```javascript
// NBP (Net Borrowing Position) - Uses min of 2% of gross loan or actual product/arrangement fee
const nbp = bestLoan.netLoan + Math.min(bestLoan.grossLoan * 0.02, bestLoan.productFeeAmount);
```

**Action Required**:
1. Add NBP LTV calculation after NBP (line ~715)
2. Add to return object (line ~807)

**New Code**:
```javascript
const nbp = bestLoan.netLoan + Math.min(bestLoan.grossLoan * 0.02, bestLoan.productFeeAmount);
const nbpLTV = this.propertyValue > 0 ? (nbp / this.propertyValue) * 100 : 0; // NEW LINE

return {
  // ... existing fields ...
  nbp,
  nbpLTV, // NEW FIELD (add after line 807)
  // ... rest of fields ...
};
```

---

## 2. DATABASE SCHEMA

### 2.1 BTL Quote Results Table
**File**: `database/schema/create_quote_results_table.sql` (needs to be created or check existing migrations)
**Action**: Add column `nbp_ltv NUMERIC`

```sql
ALTER TABLE quote_results ADD COLUMN IF NOT EXISTS nbp_ltv NUMERIC;
COMMENT ON COLUMN quote_results.nbp_ltv IS 'NBP LTV percentage: (NBP / Property Value) * 100';
```

---

### 2.2 Bridge Quote Results Table
**File**: `database/schema/create_bridge_results_table.sql`
**Current Columns**: Includes `nbp` but NOT `nbp_ltv`

**Action**: Add column after `nbp` (line ~54)

```sql
ALTER TABLE bridge_quote_results ADD COLUMN IF NOT EXISTS nbp_ltv NUMERIC;
COMMENT ON COLUMN bridge_quote_results.nbp_ltv IS 'NBP LTV percentage: (NBP / Property Value) * 100';
```

---

## 3. BACKEND API (Save to Database)

### 3.1 Quotes Route
**File**: `backend/routes/quotes.js`
**Location**: Where results are saved to database

**Action**: Ensure `nbp_ltv` is included in INSERT/UPDATE statements for both:
- `quote_results` table (BTL)
- `bridge_quote_results` table (Bridging/Fusion)

**Search for**: `INSERT INTO quote_results` or `INSERT INTO bridge_quote_results`
**Add**: `nbp_ltv` to column list and values

---

## 4. GLOBAL SETTINGS (Admin UI)

### 4.1 Results Label Aliases
**File**: `frontend/src/components/admin/GlobalSettings.jsx`
**Location**: Lines 40-70 (DEFAULT_LABEL_ALIASES_BTL and DEFAULT_LABEL_ALIASES_BRIDGE)

**Action**: Add to BOTH BTL and Bridge default label sets

**BTL** (after 'NBP' around line 60):
```javascript
const DEFAULT_LABEL_ALIASES_BTL = {
  // ... existing labels ...
  'NBP': 'NBP',
  'NBP LTV': 'NBP LTV', // NEW
  // ... rest ...
};
```

**Bridge** (similar location in DEFAULT_LABEL_ALIASES_BRIDGE):
```javascript
const DEFAULT_LABEL_ALIASES_BRIDGE = {
  // ... existing labels ...
  'NBP': 'NBP',
  'NBP LTV': 'NBP LTV', // NEW
  // ... rest ...
};
```

---

### 4.2 Results Visibility Settings
**File**: `frontend/src/hooks/useResultsVisibility.js`
**Action**: Default visibility should include NBP LTV

**Check**: If there's a default visible fields array, add `'NBP LTV'`

---

### 4.3 Results Row Order Settings  
**File**: `frontend/src/hooks/useResultsRowOrder.js`
**Action**: Default row order should include NBP LTV after NBP

---

## 5. PDF GENERATION

### 5.1 BTL Quote PDF
**File**: `frontend/src/components/pdf/BTLQuotePDF.jsx`
**Location**: Where results are rendered in PDF

**Action**: Add NBP LTV row after NBP row
**Format**: Display as percentage (e.g., "75.50%")

---

### 5.2 BTL DIP PDF
**File**: `frontend/src/components/pdf/BTLDIPPDF.jsx`
**Action**: Same as BTL Quote PDF

---

### 5.3 Bridging Quote PDF
**File**: `frontend/src/components/pdf/BridgingQuotePDF.jsx`
**Action**: Add NBP LTV row after NBP

---

### 5.4 Bridging DIP PDF
**File**: `frontend/src/components/pdf/BridgingDIPPDF.jsx`
**Action**: Same as Bridging Quote PDF

---

### 5.5 Backend PDF Generation
**File**: `backend/routes/quotePdf.js` and `backend/routes/dipPdf.js`
**Action**: Ensure NBP LTV is included in PDF data if backend generates PDFs

---

## 6. FRONTEND UI COMPONENTS

### 6.1 Results Table Rendering
**Files**:
- `frontend/src/features/btl-calculator/components/ResultsTable.jsx`
- `frontend/src/components/calculators/BridgingResultsTable.jsx`

**Action**: NBP LTV should automatically appear if:
1. Calculation engine returns it
2. Label alias is configured
3. Visibility settings include it

**Verify**: Results table uses dynamic rendering from calculation results

---

### 6.2 Quote Details View
**Files**:
- `frontend/src/components/quotes/QuoteDetailCard.jsx` (or similar)

**Action**: Display NBP LTV in quote details alongside other result fields

---

## 7. EXPORT FUNCTIONALITY

### 7.1 CSV Export
**Files**:
- `frontend/src/utils/exportQuotes.js` (or similar export utility)
- `backend/routes/export.js`

**Action**: Include NBP LTV column in CSV exports

---

## 8. FORMATTING & UTILITIES

### 8.1 Number Formatting
**File**: `frontend/src/utils/calculator/numberFormatting.js`

**Action**: Create helper function for percentage formatting if not exists

```javascript
export function formatPercentage(value, decimals = 2) {
  if (value == null || isNaN(value)) return 'N/A';
  return `${parseFloat(value).toFixed(decimals)}%`;
}
```

**Usage**: `formatPercentage(result.nbpLTV)` → "75.50%"

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Core Calculation (CRITICAL - Don't break existing)
- [ ] 1. Add NBP LTV calculation to `bridgeFusionCalculationEngine.js` (line ~614)
- [ ] 2. Add NBP LTV to return object in `bridgeFusionCalculationEngine.js` (line ~626)
- [ ] 3. Add NBP LTV calculation to `btlCalculationEngine.js` (line ~715)
- [ ] 4. Add NBP LTV to return object in `btlCalculationEngine.js` (line ~807)
- [ ] 5. Test calculators to ensure existing results still work

### Phase 2: Database
- [ ] 6. Create migration to add `nbp_ltv` column to `quote_results` table
- [ ] 7. Create migration to add `nbp_ltv` column to `bridge_quote_results` table
- [ ] 8. Update backend `quotes.js` to save `nbp_ltv` when creating/updating quotes

### Phase 3: Admin Settings
- [ ] 9. Add 'NBP LTV' to DEFAULT_LABEL_ALIASES_BTL in `GlobalSettings.jsx`
- [ ] 10. Add 'NBP LTV' to DEFAULT_LABEL_ALIASES_BRIDGE in `GlobalSettings.jsx`
- [ ] 11. Verify visibility and row order hooks handle new field automatically

### Phase 4: PDFs
- [ ] 12. Add NBP LTV row to `BTLQuotePDF.jsx`
- [ ] 13. Add NBP LTV row to `BTLDIPPDF.jsx`
- [ ] 14. Add NBP LTV row to `BridgingQuotePDF.jsx`
- [ ] 15. Add NBP LTV row to `BridgingDIPPDF.jsx`
- [ ] 16. Update backend PDF routes if needed

### Phase 5: Testing
- [ ] 17. Test BTL calculator: Verify NBP LTV appears and calculates correctly
- [ ] 18. Test Bridging calculator: Verify NBP LTV appears
- [ ] 19. Test Fusion calculator: Verify NBP LTV appears
- [ ] 20. Test quote save: Verify NBP LTV saves to database
- [ ] 21. Test quote load: Verify NBP LTV loads from database
- [ ] 22. Test PDF generation: Verify NBP LTV shows in all PDFs
- [ ] 23. Test CSV export: Verify NBP LTV column exists
- [ ] 24. Test global settings: Verify label can be customized

---

## SAFETY NOTES

### What NOT to Change:
1. ❌ Do NOT modify existing NBP calculation logic
2. ❌ Do NOT change property value variable names
3. ❌ Do NOT alter return object structure (only ADD new field)
4. ❌ Do NOT modify database table names
5. ❌ Do NOT change existing result field names

### Testing Strategy:
1. ✅ Test existing quote with known NBP value
2. ✅ Verify NBP LTV = (NBP / Property Value) * 100
3. ✅ Ensure all existing fields still populate
4. ✅ Check PDF renders all old fields + new NBP LTV
5. ✅ Verify database saves and retrieves NBP LTV

---

## EXAMPLE CALCULATION

**Scenario**:
- Property Value: £500,000
- NBP: £375,000

**Expected NBP LTV**:
```
NBP LTV = (375000 / 500000) * 100
        = 0.75 * 100
        = 75.0%
```

**Display**: "75.00%" or "75.0%" depending on decimal places

---

## FILES TO MODIFY (Summary)

### Calculation Engines (2 files):
1. `frontend/src/utils/bridgeFusionCalculationEngine.js`
2. `frontend/src/utils/btlCalculationEngine.js`

### Database (2 files):
3. `database/migrations/XXX_add_nbp_ltv_to_quote_results.sql` (new)
4. `database/migrations/XXX_add_nbp_ltv_to_bridge_results.sql` (new)

### Backend (1 file):
5. `backend/routes/quotes.js`

### Admin Settings (1 file):
6. `frontend/src/components/admin/GlobalSettings.jsx`

### PDFs (4 files):
7. `frontend/src/components/pdf/BTLQuotePDF.jsx`
8. `frontend/src/components/pdf/BTLDIPPDF.jsx`
9. `frontend/src/components/pdf/BridgingQuotePDF.jsx`
10. `frontend/src/components/pdf/BridgingDIPPDF.jsx`

### Optional (if needed):
11. `frontend/src/utils/calculator/numberFormatting.js` (add percentage formatter)
12. `frontend/src/utils/exportQuotes.js` (CSV export)

**Total**: 12 files minimum, 14 maximum

---

## READY TO PROCEED?

Once you've reviewed this analysis, we can proceed with implementation in phases to ensure nothing breaks.

Should I start with Phase 1 (Core Calculation)?
