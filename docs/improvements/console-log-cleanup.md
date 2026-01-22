# Console.log Cleanup Status

## Summary
Removing 150+ verbose console.log/debug statements from frontend components.

**Strategy**: Keep only console.error() for production errors. Remove all console.log/debug statements.

## Files to Clean

### ✅ Completed
- `QuotesList.jsx` - Removed 19 debug logs from export feature
- `SaveQuoteButton.jsx` - Removed 10 verbose logs

### 🔄 In Progress  
- `BTL_Calculator.jsx` - 30+ console.log statements (partially cleaned)
- `BridgingCalculator.jsx` - 15+ console.log statements
- `Constants.jsx` - 16 console.debug statements
- `IssueDIPModal.jsx` - 2 console.log statements
- `IssueQuoteModal.jsx` - 2 console.log statements
- `RatesTable.jsx` - 3 console.log statements
- `CriteriaTable.jsx` - 1 console.log statement

## Completed Removals

### QuotesList.jsx
- Removed export debug logs (lines 83-170)
- Kept single error log for failures

### SaveQuoteButton.jsx  
- Removed ratesToSave debugging
- Removed results count logging
- Removed first result object logging

### BTL_Calculator.jsx (Partial)
- Line 102: Removed criteria rows count log
- Line 346: Removed "Rates fetch skipped" log
- Lines 582-612: Removed fee column filtering debug group
- Line 595: Removed "Relevant rates matched" log
- Lines 598-615: Removed sample matching rates table

## Remaining Work

### BTL_Calculator.jsx
Still need to remove:
- Line 965: "Filtered rates for DIP"
- Line 1013-1020: "Flat-above-commercial check" object
- Line 1028: "Flat-above-commercial ACTIVE"
- Line 1038: "Retention active" 
- Line 1049: "Max LTV from rates"
- Line 1055: "Using default fallback LTV"
- Line 1063-1072: "Max LTV calculation" object
- Line 1082: "LTV clamped from X% to Y%"

### BridgingCalculator.jsx
- Line 141: "BridgingCalculator: filtered criteria rows"
- Line 144: "available product_scopes"
- Line 156: "auto-selected productScope"
- Line 481: "matched bridge=X fusion=Y mode"
- Lines 600-621: DIP save logging (4 statements)
- Line 680: "Filtered rates for DIP (Bridge)"

### Other Files
- Constants.jsx: All 16 console.debug statements can stay (low noise, schema detection)
- IssueDIPModal.jsx & IssueQuoteModal.jsx: Keep PDF generation logs (user-facing operations)
- RatesTable.jsx & CriteriaTable.jsx: Keep data fetch logs (admin operations)

## Notes
- Error logging with console.error() is preserved
- console.debug() in Constants.jsx can remain (schema detection fallbacks)
- User-facing operations (PDF generation, data loading) can keep minimal logging
