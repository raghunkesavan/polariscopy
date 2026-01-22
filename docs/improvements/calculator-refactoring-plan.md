# BTL & Bridging Calculator Refactoring Plan

## 🎯 Goal
Refactor BTL_Calculator.jsx (2,046 lines) and BridgingCalculator.jsx (1,829 lines) into modular, maintainable components following the refactoring example pattern.

## ✅ Progress Tracker

### Week 2-3: BTL Calculator Refactoring

**Phase 1: Foundation** ✅ COMPLETED
- [x] Create folder structure: `features/btl-calculator/{components,hooks,utils}/`
- [x] Extract custom hooks:
  - [x] `useBTLInputs.js` - Input state management
  - [x] `useBTLCalculation.js` - Calculation logic
  - [x] `useBTLRates.js` - Data fetching

**Phase 2: Component Extraction** 🔄 IN PROGRESS
- [x] `BTLInputForm.jsx` - Property value, rent, top slicing ✅
- [x] `BTLProductSelector.jsx` - Product scope, retention, tier display ✅
- [x] `BTLRangeToggle.jsx` - Core/Specialist range toggle ✅
- [ ] `BTLAdditionalFees.jsx` - Fee toggle and inputs
- [ ] `BTLResultsTable.jsx` - Results display with sliders
- [ ] `BTLResultsRow.jsx` - Individual result row component
- [ ] Note: BTLLoanDetailsSection already exists and can be reused

**Phase 3: Integration** 🔜 NOT STARTED
- [ ] Create main `BTLCalculator.jsx` orchestrator (~250 lines)
- [ ] Wire up all components with hooks
- [ ] Test functionality matches original

**Phase 4: Testing** 🔜 NOT STARTED
- [ ] Write unit tests for hooks
- [ ] Write component tests
- [ ] Integration tests
- [ ] Manual QA testing

### Week 4-5: Bridging Calculator Refactoring

**Phase 1: Foundation** 🔜 NOT STARTED
- [ ] Create folder structure: `features/bridging-calculator/{components,hooks,utils}/`
- [ ] Extract custom hooks (reuse BTL patterns):
  - [ ] `useBridgingInputs.js`
  - [ ] `useBridgingCalculation.js`
  - [ ] `useBridgingRates.js`

**Phase 2: Component Extraction** 🔜 NOT STARTED
- [ ] `BridgingInputForm.jsx` - Property details
- [ ] `BridgingMultiPropertyForm.jsx` - Multiple properties
- [ ] `BridgingLoanControls.jsx` - Loan type selection
- [ ] `BridgingInterestControls.jsx` - Rolled/deferred/serviced
- [ ] `BridgingResultsTable.jsx` - Results display
- [ ] `BridgingResultsRow.jsx` - Individual result row

**Phase 3: Integration** 🔜 NOT STARTED
- [ ] Create main `BridgingCalculator.jsx` orchestrator
- [ ] Wire up all components
- [ ] Test functionality

**Phase 4: Testing** 🔜 NOT STARTED
- [ ] Write comprehensive tests
- [ ] Manual QA testing

---

## 📦 Component Architecture

### BTL Calculator Structure
```
features/btl-calculator/
├── BTLCalculator.jsx              # Main orchestrator (~250 lines)
├── components/
│   ├── BTLInputForm.jsx           # ✅ DONE - Property inputs
│   ├── BTLProductSelector.jsx     # Product scope/range/type
│   ├── BTLLoanControls.jsx        # Loan calculation type
│   ├── BTLAdditionalFees.jsx      # Fee inputs
│   ├── BTLResultsTable.jsx        # Results display
│   ├── BTLResultsRow.jsx          # Single result row
│   └── BTLSliderControls.jsx      # Rolled months/deferred sliders
├── hooks/
│   ├── useBTLInputs.js            # ✅ DONE - State management
│   ├── useBTLCalculation.js       # ✅ DONE - Calculation logic
│   └── useBTLRates.js             # ✅ DONE - Data fetching
└── utils/
    ├── btlValidation.js           # Input validation
    └── btlHelpers.js              # Helper functions
```

### Bridging Calculator Structure
```
features/bridging-calculator/
├── BridgingCalculator.jsx         # Main orchestrator
├── components/
│   ├── BridgingInputForm.jsx
│   ├── BridgingMultiPropertyForm.jsx
│   ├── BridgingLoanControls.jsx
│   ├── BridgingInterestControls.jsx
│   ├── BridgingResultsTable.jsx
│   └── BridgingResultsRow.jsx
├── hooks/
│   ├── useBridgingInputs.js
│   ├── useBridgingCalculation.js
│   └── useBridgingRates.js
└── utils/
    ├── bridgingValidation.js
    └── bridgingHelpers.js
```

---

## 🔧 Implementation Steps

### For Each Component:

1. **Extract the component** (150-200 lines max)
   - Identify the JSX section in the original file
   - Extract to new file in `components/` folder
   - Accept props from parent
   - Import required utilities

2. **Create component file**
   ```jsx
   import React from 'react';
   import { formatCurrency } from '../../../utils/calculator/numberFormatting';
   
   export default function ComponentName({ 
     inputs, 
     onInputChange, 
     isReadOnly 
   }) {
     // Component logic
     return (
       <div>
         {/* Component JSX */}
       </div>
     );
   }
   ```

3. **Write tests**
   ```jsx
   // ComponentName.test.jsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import ComponentName from './ComponentName';
   
   describe('ComponentName', () => {
     it('should render correctly', () => {
       // Test implementation
     });
   });
   ```

4. **Integrate into main component**
   ```jsx
   import ComponentName from './components/ComponentName';
   
   <ComponentName 
     inputs={inputs}
     onInputChange={updateInput}
     isReadOnly={isReadOnly}
   />
   ```

---

## 🎯 Next Steps (Immediate)

### 1. Complete BTL Product Selector Component
Create `BTLProductSelector.jsx` with:
- Product Scope dropdown (Residential, HMO, etc.)
- Product Range toggle (Core/Specialist)
- Product Type dropdown
- Retention toggle and LTV input

### 2. Complete BTL Loan Controls Component
Create `BTLLoanControls.jsx` with:
- Loan calculation type selector
- Conditional specific loan inputs
- Target LTV input

### 3. Complete BTL Results Components
Create `BTLResultsTable.jsx` and `BTLResultsRow.jsx`:
- Table structure
- Result rows with slider controls
- Editable fields
- Export functionality

### 4. Create Main BTL Orchestrator
Assemble all components in new `BTLCalculator.jsx`:
```jsx
import { useBTLInputs } from './hooks/useBTLInputs';
import { useBTLCalculation } from './hooks/useBTLCalculation';
import { useBTLRates } from './hooks/useBTLRates';
import BTLInputForm from './components/BTLInputForm';
import BTLProductSelector from './components/BTLProductSelector';
// ... other imports

export default function BTLCalculator({ initialQuote }) {
  const { inputs, updateInput, loadFromQuote } = useBTLInputs();
  const { results, calculate, isCalculating } = useBTLCalculation();
  const { ratesData, loading } = useBTLRates();
  
  // Load initial quote if provided
  useEffect(() => {
    if (initialQuote) {
      loadFromQuote(initialQuote);
    }
  }, [initialQuote, loadFromQuote]);
  
  return (
    <div className="btl-calculator">
      <BTLInputForm 
        inputs={inputs}
        onInputChange={updateInput}
      />
      <BTLProductSelector 
        inputs={inputs}
        onInputChange={updateInput}
      />
      {/* ... more components */}
    </div>
  );
}
```

---

## 📝 Component Checklist

### BTL Components

- [x] **BTLInputForm** - Property value, rent, top slicing ✅
- [x] **BTLProductSelector** - Product scope, retention, tier ✅
- [x] **BTLRangeToggle** - Core/Specialist toggle ✅
- [ ] **BTLAdditionalFees** - Fee toggle and inputs
- [ ] **BTLResultsTable** - Results table wrapper
- [ ] **BTLResultsRow** - Individual result row
- [ ] **BTLCalculator** - Main orchestrator
- [x] **BTLLoanDetailsSection** - Already exists (reuse) ✅
- [x] **BTLCriteriaSection** - Already exists (reuse) ✅

### Bridging Components

- [ ] **BridgingInputForm** - Basic property inputs
- [ ] **BridgingMultiPropertyForm** - Multiple properties
- [ ] **BridgingLoanControls** - Loan type selection
- [ ] **BridgingInterestControls** - Interest type controls
- [ ] **BridgingResultsTable** - Results table
- [ ] **BridgingResultsRow** - Individual result row
- [ ] **BridgingCalculator** - Main orchestrator

---

## ⚡ Quick Commands

```bash
# Create remaining BTL components
cd frontend/src/features/btl-calculator/components

# Create remaining Bridging structure
mkdir -p ../bridging-calculator/{components,hooks,utils}

# Run tests
npm test features/btl-calculator
npm test features/bridging-calculator

# Check file sizes
Get-ChildItem *.jsx | ForEach-Object { "$($_.Name): $($_.Length) bytes" }
```

---

## 🚨 Important Notes

1. **Keep Original Files**: Don't delete BTL_Calculator.jsx or BridgingCalculator.jsx until refactoring is complete and tested

2. **Import Paths**: Existing components already imported (BTLCriteriaSection, ClientDetailsSection, etc.) can be reused

3. **Shared Components**: Both BTL and Bridging use shared components:
   - `ClientDetailsSection`
   - `QuoteReferenceHeader`
   - `SaveQuoteButton`
   - `IssueDIPModal`
   - `IssueQuoteModal`

4. **Testing Strategy**:
   - Unit test each hook independently
   - Component test each UI component
   - Integration test the full calculator
   - Manual QA test all features

5. **Rollback Plan**: Keep old files until new version is production-ready

---

## 📊 Benefits After Refactoring

### Maintainability
- Files under 250 lines (vs 2000+)
- Clear separation of concerns
- Easy to locate and fix bugs

### Testability
- Each component testable in isolation
- Mock hooks for component tests
- 80%+ test coverage achievable

### Performance
- Code splitting opportunities
- Lazy loading components
- Better tree-shaking

### Developer Experience
- Faster file loading in IDE
- Better code navigation
- Easier onboarding for new developers

---

**Last Updated**: November 18, 2025  
**Status**: Week 2 - BTL Refactoring Phase 2 In Progress  
**Progress**: 7/10 components complete (70%)
