# Calculator Component Breakdown Plan

## Current Status
Both BridgingCalculator.jsx and BTL_Calculator.jsx are still ~1,600 lines each. While we've extracted some **shared components** (ClientDetailsSection, QuoteReferenceHeader), we haven't broken down the **calculators themselves** into smaller, focused chunks.

## Proposed Component Structure

### BridgingCalculator Components (calculator/bridging/)
1. **CriteriaSection.jsx** ✅ CREATED
   - Handles all criteria questions/answers
   - ~120 lines
   - Props: questions, answers, onAnswerChange, chargeType, etc.

2. **LoanDetailsSection.jsx** ✅ CREATED
   - Property value, gross loan, first charge, term inputs
   - ~80 lines
   - Props: propertyValue, grossLoan, firstChargeValue, term, handlers

3. **MultiPropertyDetailsSection.jsx** (TODO)
   - Table for multiple property entries
   - ~150 lines
   - Props: properties, onAdd, onEdit, onDelete

4. **BridgingRatesTable.jsx** (TODO)
   - Displays calculated rates in table format
   - ~200 lines
   - Props: rates, onSelectRate, filters

5. **MonthlyPaymentBreakdown.jsx** (TODO)
   - Shows payment breakdown, fees, etc.
   - ~150 lines
   - Props: selectedRate, calculations, fees

6. **DIPSection.jsx** (TODO)
   - Decision in Principle form and PDF generation
   - ~200 lines
   - Props: dipData, onSubmit, quoteData

### BTL Calculator Components (calculator/btl/)
1. **BTLPropertyDetailsSection.jsx** (TODO)
   - Property value, rent, product scope, LTV inputs
   - ~100 lines
   - Props: propertyValue, monthlyRent, productScope, etc.

2. **BTLLoanDetailsSection.jsx** (TODO)
   - Loan type, specific amounts, product type
   - ~80 lines
   - Props: loanType, specificGrossLoan, productType, etc.

3. **AffordabilitySection.jsx** (TODO)
   - Affordability calculations, stress test
   - ~150 lines
   - Props: affordabilityData, monthlyRent, interestRate

4. **BTLCriteriaSection.jsx** (TODO)
   - Criteria questions specific to BTL
   - ~100 lines (can reuse CriteriaSection with BTL-specific logic)
   - Props: questions, answers, onAnswerChange

5. **BTLRatesTable.jsx** (TODO)
   - Displays BTL rates in table format
   - ~200 lines
   - Props: rates, onSelectRate, filters

6. **BTLPaymentBreakdown.jsx** (TODO)
   - Payment breakdown for BTL products
   - ~100 lines
   - Props: selectedRate, calculations

### Custom Hooks (hooks/calculator/)
1. **useRateCalculation.js** (TODO)
   - Handles rate fetching and filtering logic
   - Returns: { rates, loading, error, fetchRates }

2. **useLoanCalculations.js** (TODO)
   - Calculates LTV, net loan, fees, etc.
   - Returns: { netLoan, ltv, fees, totalCost }

3. **useAffordability.js** (TODO - BTL specific)
   - Handles affordability calculations
   - Returns: { canAfford, maxLoan, stressTest }

4. **useDIP.js** (TODO - Bridging specific)
   - Handles DIP form state and submission
   - Returns: { dipData, submitDIP, errors }

## Implementation Order

### Phase 1: BridgingCalculator Breakdown
1. ✅ CriteriaSection.jsx - COMPLETED
2. ✅ LoanDetailsSection.jsx - COMPLETED
3. MultiPropertyDetailsSection.jsx
4. Update BridgingCalculator.jsx to use these components
5. Test BridgingCalculator works correctly

### Phase 2: BTL Calculator Breakdown
1. BTLPropertyDetailsSection.jsx
2. BTLLoanDetailsSection.jsx
3. AffordabilitySection.jsx
4. Update BTL_Calculator.jsx to use these components
5. Test BTL Calculator works correctly

### Phase 3: Extract Calculation Hooks
1. useRateCalculation.js (shared)
2. useLoanCalculations.js (shared)
3. useAffordability.js (BTL-specific)
4. useDIP.js (Bridging-specific)

### Phase 4: Rates Display Components
1. BridgingRatesTable.jsx
2. BTLRatesTable.jsx
3. Consider creating shared RatesTable component

### Phase 5: Remaining Sections
1. MonthlyPaymentBreakdown.jsx
2. BTLPaymentBreakdown.jsx
3. DIPSection.jsx

## Expected Result
- **BridgingCalculator.jsx**: ~1,600 lines → ~400 lines (main orchestration)
- **BTL_Calculator.jsx**: ~1,600 lines → ~400 lines (main orchestration)
- Each section component: 80-200 lines (easy to understand and maintain)
- Each hook: 50-150 lines (focused single responsibility)

## Benefits
- **Single Responsibility**: Each component has ONE clear purpose
- **Testability**: Can test each section independently
- **Reusability**: Components can be reused or composed differently
- **Maintainability**: Easy to find and fix bugs in specific sections
- **Developer Experience**: Much easier to understand what each piece does
