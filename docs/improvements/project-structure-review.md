# Project Structure Review & Improvement Plan

## 🔍 Current State Analysis

### ✅ Good Practices Already in Place
1. **Clear separation of concerns**: Frontend/Backend split
2. **Organized folder structure**: contexts/, hooks/, utils/, components/
3. **Testing infrastructure**: Vitest configured for both frontend and backend
4. **Documentation**: Extensive markdown documentation
5. **Version control**: Git setup with proper .gitignore
6. **Environment configuration**: .env files for config management

### ❌ Issues Identified

#### 🚨 **CRITICAL: Extremely Large Files**
These files are too large and need refactoring:
- `BTL_Calculator.jsx` - **1,906 lines** 🔴
- `Constants.jsx` - **1,840 lines** 🔴
- `BridgingCalculator.jsx` - **1,829 lines** 🔴
- `RatesTable.jsx` - **836 lines** 🟡
- `IssueDIPModal.jsx` - **798 lines** 🟡
- `CriteriaTable.jsx` - **750 lines** 🟡
- `bridgeFusionCalculationEngine.js` - **781 lines** 🟡
- `btlCalculationEngine.js` - **677 lines** 🟡

**Best Practice**: Files should be under 300 lines. Anything over 500 is a maintenance nightmare.

#### 📁 **Root Directory Clutter**
27+ markdown documentation files in the root directory makes navigation difficult.

#### 🧪 **Minimal Test Coverage**
- Only 1 frontend test (ThemeToggle)
- Only 2 backend tests
- No tests for critical calculation engines

---

## 🎯 Recommended Refactoring Plan

### **Phase 1: Break Down Large Components (HIGH PRIORITY)**

#### 1.1 BTL_Calculator.jsx (1,906 lines → ~300 lines)

**Current Structure**: Monolithic calculator component

**Proposed New Structure**:
```
frontend/src/features/btl-calculator/
├── BTLCalculator.jsx (main orchestrator - 200 lines)
├── components/
│   ├── BTLInputForm.jsx (property value, rent, etc - 150 lines)
│   ├── BTLLoanControls.jsx (loan type selection - 100 lines)
│   ├── BTLFeeControls.jsx (fee toggles and inputs - 100 lines)
│   ├── BTLProductRangeSelector.jsx (core/specialist - 80 lines)
│   ├── BTLResultsDisplay.jsx (results table wrapper - 150 lines)
│   ├── BTLClientDetails.jsx (client info form - 150 lines)
│   └── BTLCriteriaSelector.jsx (criteria questions - 150 lines)
├── hooks/
│   ├── useBTLCalculation.js (calculation logic - 200 lines)
│   ├── useBTLInputs.js (state management - 150 lines)
│   └── useBTLValidation.js (input validation - 100 lines)
└── utils/
    └── btlHelpers.js (utility functions - 100 lines)
```

**Benefits**:
- Each file has a single responsibility
- Easy to test individual components
- Better code reusability
- Easier for new developers to understand

---

#### 1.2 BridgingCalculator.jsx (1,829 lines → ~300 lines)

**Proposed Structure**:
```
frontend/src/features/bridging-calculator/
├── BridgingCalculator.jsx (main - 200 lines)
├── components/
│   ├── BridgingInputForm.jsx (inputs - 150 lines)
│   ├── BridgingLoanControls.jsx (gross/net loan - 120 lines)
│   ├── BridgingTermSelector.jsx (term picker - 80 lines)
│   ├── BridgingFeeInputs.jsx (fees - 100 lines)
│   ├── BridgingResultsDisplay.jsx (results - 150 lines)
│   ├── BridgingMultiProperty.jsx (multi-property table - 200 lines)
│   └── BridgingClientDetails.jsx (client info - 150 lines)
├── hooks/
│   ├── useBridgingCalculation.js (calculations - 200 lines)
│   ├── useBridgingInputs.js (state - 150 lines)
│   └── useMultiProperty.js (multi-property logic - 150 lines)
└── utils/
    └── bridgingHelpers.js (utilities - 100 lines)
```

---

#### 1.3 Constants.jsx (1,840 lines → ~400 lines)

**Current Issue**: Admin constants management is doing too much

**Proposed Structure**:
```
frontend/src/features/admin-constants/
├── ConstantsManager.jsx (main - 150 lines)
├── components/
│   ├── ProductListEditor.jsx (product lists - 200 lines)
│   ├── FeeColumnsEditor.jsx (fee columns - 200 lines)
│   ├── MarketRatesEditor.jsx (market rates - 200 lines)
│   ├── BrokerSettingsEditor.jsx (broker settings - 200 lines)
│   ├── FundingLinesEditor.jsx (funding lines - 200 lines)
│   └── UIPreferencesEditor.jsx (UI prefs - 150 lines)
├── hooks/
│   ├── useConstantsSync.js (Supabase sync - 200 lines)
│   └── useConstantsValidation.js (validation - 100 lines)
└── utils/
    └── constantsHelpers.js (merge/sanitize logic - 150 lines)
```

---

### **Phase 2: Organize Root Directory**

**Current**: 27 markdown files in root
**Proposed**: Move to organized structure

```
docs/
├── architecture/
│   ├── calculation-engines.md (combine BTL + Bridge engine docs)
│   ├── database-schema.md
│   └── deployment.md
├── features/
│   ├── btl-calculator.md
│   ├── bridging-calculator.md
│   ├── broker-settings.md
│   ├── authentication.md
│   └── export-feature.md
├── guides/
│   ├── development-setup.md
│   ├── testing-guide.md (NEW)
│   └── contributing.md (NEW)
└── improvements/
    ├── completed/
    │   └── (move PHASE1_*, IMPLEMENTATION_* here)
    └── proposed/
        └── (move PROJECT_IMPROVEMENT_* here)
```

Keep in root: `README.md`, `package.json`, `.gitignore`, `vercel.json`

---

### **Phase 3: Implement Comprehensive Testing**

#### 3.1 Unit Tests for Calculation Engines (CRITICAL)

```javascript
// frontend/src/utils/__tests__/btlCalculationEngine.test.js
import { describe, it, expect } from 'vitest';
import { calculateBTLResults } from '../btlCalculationEngine';

describe('BTL Calculation Engine', () => {
  describe('ICR Calculations', () => {
    it('should calculate correct ICR at 125% for standard products', () => {
      const input = {
        monthlyRent: 1000,
        initialRate: 5.5,
        // ... other inputs
      };
      const result = calculateBTLResults(input);
      expect(result.icr).toBeCloseTo(125, 1);
    });

    it('should calculate correct ICR at 145% for HMO', () => {
      // Test HMO ICR calculation
    });
  });

  describe('LTV Calculations', () => {
    it('should respect max LTV limits', () => {
      // Test LTV limits
    });
  });

  describe('Fee Calculations', () => {
    it('should add fees correctly when toggle is on', () => {
      // Test fee inclusion
    });
  });
});
```

#### 3.2 Component Tests

```javascript
// frontend/src/features/btl-calculator/__tests__/BTLInputForm.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BTLInputForm from '../components/BTLInputForm';

describe('BTL Input Form', () => {
  it('should validate property value input', () => {
    render(<BTLInputForm />);
    const input = screen.getByLabelText(/property value/i);
    fireEvent.change(input, { target: { value: '-100' } });
    expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    // Test currency formatting
  });
});
```

#### 3.3 Integration Tests

```javascript
// frontend/src/features/btl-calculator/__tests__/BTLCalculator.integration.test.jsx
describe('BTL Calculator Integration', () => {
  it('should calculate and display results end-to-end', async () => {
    render(<BTLCalculator />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/property value/i), { 
      target: { value: '250000' } 
    });
    fireEvent.change(screen.getByLabelText(/monthly rent/i), { 
      target: { value: '1200' } 
    });
    
    // Click calculate
    fireEvent.click(screen.getByText(/calculate/i));
    
    // Verify results appear
    await screen.findByText(/results/i);
    expect(screen.getByText(/ltv/i)).toBeInTheDocument();
  });
});
```

#### 3.4 Backend API Tests

```javascript
// backend/__tests__/quotes.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Quotes API', () => {
  describe('POST /api/quotes', () => {
    it('should create a new BTL quote', async () => {
      const quoteData = {
        calculator_type: 'btl',
        name: 'Test Quote',
        calculation_data: { /* ... */ }
      };
      
      const response = await request(app)
        .post('/api/quotes')
        .send(quoteData)
        .expect(201);
      
      expect(response.body.quote).toHaveProperty('reference_number');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBeDefined();
    });
  });
});
```

---

## 📋 Implementation Checklist

### **Week 1: Setup & Planning**
- [ ] Review this document with team
- [ ] Set up feature branches for refactoring
- [ ] Create tests for existing critical functions before refactoring
- [ ] Set up test coverage reporting

### **Week 2-3: BTL Calculator Refactor**
- [ ] Extract BTLInputForm component
- [ ] Extract BTLLoanControls component
- [ ] Extract BTLFeeControls component
- [ ] Create useBTLCalculation hook
- [ ] Create useBTLInputs hook
- [ ] Write unit tests for each new component
- [ ] Integration test for full calculator flow

### **Week 4-5: Bridging Calculator Refactor**
- [ ] Similar breakdown to BTL
- [ ] Special focus on multi-property logic
- [ ] Tests for each component

### **Week 6: Constants Manager Refactor**
- [ ] Break down into editor components
- [ ] Create useConstantsSync hook
- [ ] Add validation tests

### **Week 7: Testing & Documentation**
- [ ] Achieve 80%+ test coverage on calculation engines
- [ ] Document new component structure
- [ ] Create developer onboarding guide
- [ ] Reorganize docs/ folder

### **Week 8: Cleanup & Optimization**
- [ ] Remove unused code
- [ ] Optimize bundle size
- [ ] Performance testing
- [ ] Final code review

---

## 🧪 Test Coverage Goals

### **Target Coverage** (by file type):
- **Calculation Engines**: 95%+ (critical business logic)
- **Utility Functions**: 90%+
- **Components**: 70%+ (focus on logic, not styling)
- **Hooks**: 85%+
- **API Routes**: 80%+

### **Testing Strategy**:
1. **Unit Tests**: Pure functions, utilities, calculations
2. **Component Tests**: User interactions, validation
3. **Integration Tests**: Full user flows
4. **E2E Tests** (future): Critical paths with Playwright

---

## 📊 Expected Benefits

### **Code Maintainability**
- ✅ Files under 300 lines each (currently 1,900+)
- ✅ Single responsibility components
- ✅ Easier to onboard new developers
- ✅ Faster debugging

### **Testing**
- ✅ 80%+ code coverage (currently ~5%)
- ✅ Catch bugs before production
- ✅ Confidence in refactoring
- ✅ Automated regression testing

### **Performance**
- ✅ Smaller bundle sizes (code splitting)
- ✅ Faster initial load
- ✅ Better tree-shaking

### **Developer Experience**
- ✅ Clear file organization
- ✅ Easy to find code
- ✅ Reusable components
- ✅ Better IDE performance

---

## 🚀 Quick Start: Add Your First Tests

### 1. Test Calculation Engine (Critical First Step)

Create: `frontend/src/utils/__tests__/btlCalculationEngine.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { calculateBTLResults } from '../btlCalculationEngine';

describe('BTL Calculation Engine', () => {
  it('should calculate basic BTL scenario correctly', () => {
    const input = {
      propertyValue: 250000,
      monthlyRent: 1200,
      rate: 5.5,
      tier: 2,
      // Add other required inputs
    };
    
    const results = calculateBTLResults(input);
    
    // Add assertions based on expected calculations
    expect(results).toBeDefined();
    expect(results.ltv).toBeGreaterThan(0);
    expect(results.icr).toBeGreaterThan(0);
  });
});
```

### 2. Run Tests

```bash
# Frontend
cd frontend
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### 3. View Coverage Report

After running coverage, open: `frontend/coverage/index.html`

---

## 💡 Pro Tips

1. **Start Small**: Begin with one calculator component, learn the pattern, then apply to others
2. **Test First**: Write tests before refactoring to prevent regressions
3. **Use Git Branches**: Create feature branches for each refactoring task
4. **Incremental Commits**: Commit after each component extraction
5. **Pair Review**: Have someone review the refactored code structure
6. **Document As You Go**: Update docs when moving files

---

## 📚 Recommended Reading

- [React Component Patterns](https://kentcdodds.com/blog/react-component-patterns)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Folder Structure Conventions](https://reactjs.org/docs/faq-structure.html)
- [Vitest Documentation](https://vitest.dev/)

---

## 🤝 Need Help?

If you get stuck during refactoring:
1. Check this document's examples
2. Look at the existing ThemeToggle test as a template
3. Ask for code review after each component extraction
4. Test incrementally - don't refactor everything at once!

---

**Remember**: Perfect is the enemy of good. Start with the biggest pain points (BTL_Calculator, Constants) and work your way down. Even breaking these into 2-3 smaller files each would be a massive improvement!
