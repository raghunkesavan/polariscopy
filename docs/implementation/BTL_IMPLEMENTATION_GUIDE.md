# BTL Calculator Refactoring - Implementation Guide

## Overview
The BTL Calculator has been successfully refactored from a 2,046-line monolithic component into a modular, testable architecture with 12 focused files totaling ~1,525 lines (25% reduction).

## Quick Start

### Using the Refactored Calculator

```jsx
import { BTLCalculator } from '../features/btl-calculator';

// In your route or parent component:
<BTLCalculator initialQuote={quote} />
```

### Importing Individual Components

```jsx
import {
  // Main calculator
  BTLCalculator,
  
  // Input components
  BTLInputForm,
  BTLProductSelector,
  BTLRangeToggle,
  BTLAdditionalFees,
  
  // Results components
  BTLSliderControls,
  BTLResultsSummary,
  
  // Hooks
  useBTLInputs,
  useBTLCalculation,
  useBTLRates,
  useBTLResultsState
} from '../features/btl-calculator';
```

## Architecture

### Hooks (State & Logic)
All hooks follow the same pattern and are fully composable:

#### `useBTLInputs()` - Input State Management
```jsx
const inputs = useBTLInputs();

// Access state
inputs.propertyValue
inputs.monthlyRent
inputs.loanType
inputs.answers
inputs.clientDetails

// Update state
inputs.updateInput('propertyValue', '500000')
inputs.updateMultipleInputs({ propertyValue: '500000', monthlyRent: '2000' })
inputs.updateAnswer(questionId, answer)
inputs.updateClientDetails('firstName', 'John')

// Lifecycle
inputs.loadFromQuote(quote)
inputs.resetInputs()
inputs.getInputsForSave()
```

#### `useBTLCalculation()` - Calculation Logic
```jsx
const calculation = useBTLCalculation(inputs);

// Validate
const validation = calculation.validateInputs();
if (!validation.valid) {
  console.error(validation.error);
}

// Calculate
const results = calculation.calculate(inputs, rates, resultsState);

// Access results
calculation.results // Array of calculated results
calculation.columnsHeaders // Column headers

// Clear
calculation.clearResults()
```

#### `useBTLRates()` - Data Fetching
```jsx
const rates = useBTLRates();

// Fetch data
await rates.fetchCriteria()
await rates.fetchRates(inputs)

// Access data
rates.allCriteria
rates.questions
rates.relevantRates
rates.loading
rates.error

// Refresh
rates.refreshCriteria()
rates.refreshRates()
```

#### `useBTLResultsState()` - Results State
```jsx
const resultsState = useBTLResultsState();

// Slider controls
resultsState.updateRolledMonths(columnKey, 12)
resultsState.updateDeferredInterest(columnKey, 50)
resultsState.resetSlidersForColumn(columnKey)

// Editable overrides
resultsState.updateRateOverride(columnKey, 5.5)
resultsState.resetRateOverride(columnKey)
resultsState.updateProductFeeOverride(columnKey, 2.0)

// Optimized values
resultsState.storeOptimizedValues(columnKey, rolled, deferred)
resultsState.syncOptimizedValues()

// Lifecycle
resultsState.loadResultsFromQuote(quote)
resultsState.clearAllResults()
resultsState.getResultsForSave()
```

### Components (UI)

#### Input Components
All input components follow the same prop pattern:

```jsx
<BTLInputForm
  inputs={inputs}
  onInputChange={inputs.updateInput}
  isReadOnly={false}
/>

<BTLProductSelector
  inputs={inputs}
  onInputChange={inputs.updateInput}
  onTierChange={inputs.updateTier}
  isReadOnly={false}
/>

<BTLRangeToggle
  selectedRange={inputs.selectedRange}
  onChange={(value) => inputs.updateInput('selectedRange', value)}
  isReadOnly={false}
/>

<BTLAdditionalFees
  inputs={inputs}
  onInputChange={inputs.updateInput}
  isReadOnly={false}
/>
```

#### Results Components

```jsx
<BTLSliderControls
  columnKey="Fee: 2%"
  rolledMonths={resultsState.rolledMonthsPerColumn[columnKey]}
  deferredInterest={resultsState.deferredInterestPerColumn[columnKey]}
  optimizedRolled={resultsState.optimizedRolledPerColumn[columnKey]}
  optimizedDeferred={resultsState.optimizedDeferredPerColumn[columnKey]}
  isManualMode={resultsState.manualModeActivePerColumn[columnKey]}
  onRolledChange={resultsState.updateRolledMonths}
  onDeferredChange={resultsState.updateDeferredInterest}
  onReset={resultsState.resetSlidersForColumn}
  isReadOnly={false}
/>

<BTLResultsSummary
  results={calculation.results}
  columnsHeaders={calculation.columnsHeaders}
  onAddAsDIP={(idx) => console.log('Add as DIP:', idx)}
  onDeleteColumn={(idx) => console.log('Delete:', idx)}
  isReadOnly={false}
/>
```

## Integration Example

### Full Calculator Setup
```jsx
import React from 'react';
import { BTLCalculator } from '../features/btl-calculator';

export default function BTLPage() {
  return (
    <div className="page-container">
      <BTLCalculator />
    </div>
  );
}
```

### Custom Integration (Advanced)
```jsx
import React, { useEffect } from 'react';
import {
  useBTLInputs,
  useBTLCalculation,
  useBTLRates,
  BTLInputForm,
  BTLResultsSummary
} from '../features/btl-calculator';

export default function CustomBTLCalculator() {
  const inputs = useBTLInputs();
  const calculation = useBTLCalculation(inputs);
  const rates = useBTLRates();
  
  useEffect(() => {
    rates.fetchCriteria();
  }, []);
  
  const handleCalculate = async () => {
    const validation = calculation.validateInputs();
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    await rates.fetchRates(inputs);
    const results = calculation.calculate(inputs, rates.relevantRates);
    console.log('Calculated:', results);
  };
  
  return (
    <div>
      <BTLInputForm
        inputs={inputs}
        onInputChange={inputs.updateInput}
      />
      
      <button onClick={handleCalculate}>
        Calculate
      </button>
      
      <BTLResultsSummary
        results={calculation.results}
        columnsHeaders={calculation.columnsHeaders}
      />
    </div>
  );
}
```

## Testing

### Hook Testing Example
```jsx
import { renderHook, act } from '@testing-library/react';
import { useBTLInputs } from '../hooks/useBTLInputs';

describe('useBTLInputs', () => {
  it('should update property value', () => {
    const { result } = renderHook(() => useBTLInputs());
    
    act(() => {
      result.current.updateInput('propertyValue', '500000');
    });
    
    expect(result.current.propertyValue).toBe('500000');
  });
  
  it('should load from quote', () => {
    const { result } = renderHook(() => useBTLInputs());
    const mockQuote = {
      property_value: '750000',
      monthly_rent: '3000',
      loan_type: 'maxLoan'
    };
    
    act(() => {
      result.current.loadFromQuote(mockQuote);
    });
    
    expect(result.current.propertyValue).toBe('750000');
    expect(result.current.monthlyRent).toBe('3000');
    expect(result.current.loanType).toBe('maxLoan');
  });
});
```

### Component Testing Example
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import BTLRangeToggle from '../components/BTLRangeToggle';

describe('BTLRangeToggle', () => {
  it('should render both options', () => {
    render(
      <BTLRangeToggle
        selectedRange="core"
        onChange={jest.fn()}
      />
    );
    
    expect(screen.getByText('Core Range')).toBeInTheDocument();
    expect(screen.getByText('Specialist Range')).toBeInTheDocument();
  });
  
  it('should call onChange when clicked', () => {
    const onChange = jest.fn();
    render(
      <BTLRangeToggle
        selectedRange="core"
        onChange={onChange}
      />
    );
    
    fireEvent.click(screen.getByText('Specialist Range'));
    expect(onChange).toHaveBeenCalledWith('specialist');
  });
});
```

## Migration Guide

### Replacing Original Calculator

#### Step 1: Archive Original
```bash
mkdir -p frontend/src/archive
mv frontend/src/components/BTL_Calculator.jsx frontend/src/archive/
```

#### Step 2: Update Imports
Find all imports of the old calculator:
```bash
grep -r "BTL_Calculator" frontend/src/
```

Replace with:
```jsx
// Old
import BTLCalculator from './components/BTL_Calculator';

// New
import { BTLCalculator } from './features/btl-calculator';
```

#### Step 3: Update Routes
```jsx
// In your router file
import { BTLCalculator } from '../features/btl-calculator';

<Route path="/btl-calculator" element={<BTLCalculator />} />
```

## File Structure Reference

```
frontend/src/features/btl-calculator/
├── index.js                    # Central exports (use this for imports)
├── hooks/
│   ├── useBTLInputs.js         # Input state management (180 lines)
│   ├── useBTLCalculation.js    # Calculation logic (150 lines)
│   ├── useBTLRates.js          # Data fetching (120 lines)
│   └── useBTLResultsState.js   # Results state (210 lines)
├── components/
│   ├── BTLCalculator.jsx       # Main orchestrator (310 lines)
│   ├── BTLInputForm.jsx        # Basic inputs (100 lines)
│   ├── BTLProductSelector.jsx  # Product selection (90 lines)
│   ├── BTLRangeToggle.jsx      # Range toggle (35 lines)
│   ├── BTLAdditionalFees.jsx   # Additional fees (80 lines)
│   ├── BTLSliderControls.jsx   # Slider controls (110 lines)
│   └── BTLResultsSummary.jsx   # Results display (120 lines)
└── __tests__/                  # Tests (to be created)
    ├── hooks/
    └── components/
```

## Common Patterns

### Pattern 1: Load Quote
```jsx
const inputs = useBTLInputs();
const resultsState = useBTLResultsState();

const loadQuote = async (quoteId) => {
  const quote = await getQuote(supabase, quoteId);
  inputs.loadFromQuote(quote);
  resultsState.loadResultsFromQuote(quote);
};
```

### Pattern 2: Save Quote
```jsx
const saveQuote = async () => {
  const quoteData = {
    loan_type: 'BTL',
    ...inputs.getInputsForSave(),
    ...resultsState.getResultsForSave()
  };
  
  await upsertQuoteData(supabase, token, quoteId, quoteData);
};
```

### Pattern 3: Full Calculation Flow
```jsx
const runCalculation = async () => {
  // 1. Validate
  const validation = calculation.validateInputs();
  if (!validation.valid) {
    showToast('error', validation.error);
    return;
  }
  
  // 2. Fetch rates
  await rates.fetchRates(inputs);
  
  // 3. Calculate
  const results = calculation.calculate(inputs, rates.relevantRates, resultsState);
  
  // 4. Show results
  if (results && results.length > 0) {
    showToast('success', `Found ${results.length} products`);
  }
};
```

## Benefits Summary

### Code Quality
- ✅ **Single Responsibility**: Each file has one clear purpose
- ✅ **Testability**: Hooks and components can be tested in isolation
- ✅ **Reusability**: Hooks can be used in multiple components
- ✅ **Maintainability**: ~127 lines per file average (was 2,046)

### Developer Experience
- ✅ **Easy to Understand**: Clear file structure and naming
- ✅ **Easy to Debug**: Isolated concerns make bugs easier to track
- ✅ **Easy to Extend**: Add new features without touching unrelated code
- ✅ **Easy to Test**: Focused tests for focused components

### Performance
- ✅ **Better Memoization**: Hooks enable proper React memoization
- ✅ **Selective Re-renders**: Only affected components re-render
- ✅ **Code Splitting**: Components can be lazy-loaded

## Next Steps

1. **Write Tests** (3-4 days)
   - Hook tests: `useBTLInputs`, `useBTLCalculation`, `useBTLRates`, `useBTLResultsState`
   - Component tests: All 6 components
   - Integration tests: Full calculation flow

2. **QA Testing** (1-2 days)
   - Side-by-side comparison with original
   - Test all calculation scenarios
   - Verify quote save/load
   - Cross-browser testing

3. **Deploy** (1 day)
   - Archive original
   - Update imports
   - Deploy to staging
   - Production deployment

4. **Bridging Calculator** (6-8 days)
   - Apply same patterns
   - Reuse hook structure
   - Faster due to established patterns

## Questions?

See `BTL_REFACTORING_STATUS.md` for detailed progress tracking and technical decisions.
