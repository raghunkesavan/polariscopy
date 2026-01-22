# BTL Calculator Column Key Fix - Technical Documentation

## Problem Statement
When overriding rates or product fees in the **Specialist range**, the same override was incorrectly applied to the **Core range** as well. This occurred because both ranges shared the same column key format (e.g., `"Fee: 2%"`), causing them to reference the same state.

## Root Cause
The column key generation in `BTL_Calculator.jsx` only included the fee percentage without the range identifier:

```javascript
// ❌ OLD FORMAT (lines 779, 1714, 1764)
const colKey = `Fee: ${productFee}%`;  // Same key for both ranges!
```

This meant:
- Specialist range `2%` fee → Key: `"Fee: 2%"`
- Core range `2%` fee → Key: `"Fee: 2%"` (SAME KEY!)
- Overrides stored in state by key → Both ranges shared the same override

## Solution

### 1. **Updated Column Key Generation** (3 locations)
Added range prefix to make keys unique per range:

```javascript
// ✅ NEW FORMAT
const rangePrefix = selectedRange === 'specialist' ? 'Specialist' : 'Core';
const colKey = `${rangePrefix} - Fee: ${productFee}%`;
```

Now produces:
- Specialist range `2%` → `"Specialist - Fee: 2%"`
- Core range `2%` → `"Core - Fee: 2%"`

**Modified files:**
- `frontend/src/components/calculators/BTL_Calculator.jsx` (lines 779, 1714, 1764)

### 2. **Backward Compatibility Layer**
Added migration function to handle old saved quotes:

```javascript
/**
 * Migrates old format keys to new format
 * Old: "Fee: 2%" → New: "Specialist - Fee: 2%" or "Core - Fee: 2%"
 */
const migrateColumnKeys = (overrides, selectedRange) => {
  // Detects old format and adds range prefix
  // Preserves new format keys unchanged
  // Handles unknown formats gracefully
}
```

**Modified files:**
- `frontend/src/features/btl-calculator/hooks/useBTLResultsState.js`
- `frontend/src/features/btl-calculator/components/BTLCalculator.jsx`

## Impact Analysis

### ✅ **Safe Changes**
1. **Calculations**: No impact - calculation engine uses `colKey` as an identifier only, not in math
2. **PDF Generation**: No impact - PDFs don't use column keys
3. **Quote Saving**: Works with new format automatically
4. **Quote Loading**: Backward compatible - old quotes are migrated on load

### ✅ **Backward Compatibility**
When loading old quotes:
1. Old keys like `"Fee: 2%"` are detected
2. Current `selectedRange` is used to add prefix
3. Migrated to `"Specialist - Fee: 2%"` or `"Core - Fee: 2%"`
4. Works seamlessly - no data loss

### ✅ **Data Integrity**
- **Unknown key formats**: Preserved unchanged to prevent data loss
- **Already migrated keys**: Left unchanged (idempotent migration)
- **Mixed format keys**: Handles combination of old and new formats

## Testing Recommendations

### Manual Testing
1. **New Quotes**:
   - [ ] Override rate in Specialist range
   - [ ] Switch to Core range
   - [ ] Verify override does NOT appear
   - [ ] Override different value in Core range
   - [ ] Switch back to Specialist
   - [ ] Verify original override still present

2. **Old Quotes (Backward Compatibility)**:
   - [ ] Load quote saved before this fix
   - [ ] Verify overrides appear correctly
   - [ ] Verify calculations match original values
   - [ ] Save and reload - verify persistence

3. **Edge Cases**:
   - [ ] Multiple product fees (2%, 3%, 4%) - each independent
   - [ ] Switch between ranges multiple times
   - [ ] Save quote with mixed specialist/core overrides
   - [ ] Load quote and verify both ranges load correctly

### Automated Testing
Update test files to use new format:
- `frontend/src/utils/__tests__/*.test.js` - Use `"Specialist - Fee: 2%"` format in tests
- `frontend/src/features/btl-calculator/__tests__/*.test.jsx` - Update mock column keys

## Code Quality

### ✅ Follows Best Practices
- **No inline styles**: All changes are logic-only
- **SLDS compliant**: No CSS changes needed
- **Maintainable**: Clear variable names, comprehensive comments
- **No quick hacks**: Proper migration layer for backward compatibility
- **Documented**: JSDoc comments on all new functions

### ✅ Design Patterns
- **Separation of Concerns**: Migration logic in dedicated function
- **Defensive Programming**: Handles unknown formats gracefully
- **Idempotent Operations**: Migration can run multiple times safely
- **Single Responsibility**: Each function does one thing well

## Migration Path for Future

If column key format needs to change again:
1. Update `colKey` generation in 3 locations
2. Add new case to `migrateColumnKeys()` function
3. Test with old quotes from multiple versions
4. Migration function handles the transition automatically

## Performance Impact
**Negligible** - Migration happens only:
- Once per quote load (not per render)
- On small objects (typically <10 keys)
- Simple string operations (prefix detection/addition)

## Security Considerations
- No SQL injection risk - keys are generated from controlled inputs
- No XSS risk - keys are not rendered directly in HTML
- No data exposure - keys are internal identifiers only

---

**Date**: December 4, 2025  
**Author**: GitHub Copilot  
**Review Status**: Ready for Testing  
**Breaking Changes**: None (backward compatible)
