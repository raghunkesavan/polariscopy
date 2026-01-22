# BTL Calculator Tests

This directory contains comprehensive tests for the refactored BTL Calculator.

## Test Structure

```
__tests__/
├── hooks/                          # Hook tests
│   ├── useBTLInputs.test.js       ✅ Complete - 35+ tests
│   ├── useBTLResultsState.test.js ✅ Complete - 40+ tests
│   ├── useBTLCalculation.test.js  ⬜ To be added
│   └── useBTLRates.test.js        ⬜ To be added
└── components/                     # Component tests
    ├── BTLRangeToggle.test.jsx    ✅ Complete - 20+ tests
    ├── BTLInputForm.test.jsx      ⬜ To be added
    ├── BTLProductSelector.test.jsx⬜ To be added
    ├── BTLAdditionalFees.test.jsx ⬜ To be added
    ├── BTLSliderControls.test.jsx ⬜ To be added
    ├── BTLResultsSummary.test.jsx ⬜ To be added
    └── BTLCalculator.test.jsx     ⬜ To be added
```

## Running Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run BTL Calculator Tests Only
```bash
npm test btl-calculator
```

### Run Hook Tests
```bash
npm test hooks
```

### Run Component Tests
```bash
npm test components
```

### Watch Mode (During Development)
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Coverage Goals

- **Hooks**: 90%+ coverage (critical business logic)
- **Components**: 80%+ coverage (UI interactions)
- **Overall**: 80%+ coverage

## Completed Tests

### ✅ useBTLInputs Hook (35+ tests)
Tests state management for all calculator inputs:
- Initial state validation
- Single input updates (`updateInput`)
- Multiple input updates (`updateMultipleInputs`)
- Criteria answers (`updateAnswer`)
- Client details (`updateClientDetails`)
- Quote loading (`loadFromQuote`)
- Reset functionality (`resetInputs`)
- Save format (`getInputsForSave`)
- Edge cases (null, empty, invalid values)

**Key Test Areas**:
- Property value, monthly rent, loan type
- Product scope, range selection
- Additional fees (toggle, type, amount)
- Criteria answers (questions/answers)
- Client details (name, email, phone)
- Quote persistence (load/save)

### ✅ useBTLResultsState Hook (40+ tests)
Tests complex results state management:
- Slider state (rolled months, deferred interest)
- Manual mode tracking
- Rate overrides (per column)
- Product fee overrides (per column)
- Optimized values (ref and state sync)
- Clear all functionality
- Quote loading/saving
- Multiple column independence

**Key Test Areas**:
- Slider updates and resets
- Override management (rates, fees)
- Optimized value collection
- Manual mode activation
- Per-column state isolation
- Persistence (load/save quote)

### ✅ BTLRangeToggle Component (20+ tests)
Tests range selection UI:
- Rendering both options (Core/Specialist)
- Active/inactive visual states
- Click interactions
- onChange callbacks
- Read-only mode (disabled state)
- Accessibility (keyboard, roles)
- Edge cases (invalid values, null handlers)
- Visual feedback consistency

**Key Test Areas**:
- Visual styling (active/inactive)
- User interactions (clicks)
- Disabled state
- Accessibility compliance
- Edge case handling

### ✅ BTLAdditionalFees Component (35+ tests)
Tests additional broker fees functionality:
- Rendering: toggle, conditional inputs, labels
- Toggle interaction: on/off, checked state
- Calculation type selection: pound/percentage
- Fee amount input: value display, changes, placeholders
- Help text: contextual messages for pound vs percentage
- Read-only mode: disabled state, no callbacks
- Conditional rendering: show/hide based on toggle
- Edge cases: empty, large numbers, null values
- Accessibility: labels, roles, keyboard navigation

**Key Test Areas**:
- Fee toggle (enable/disable)
- Calculation type (fixed £ vs %)
- Amount input validation
- Contextual help text
- Conditional UI rendering
- Accessibility compliance

### ✅ BTLSliderControls Component (40+ tests)
Tests slider interactions for rolled months and deferred interest:
- Rendering: both sliders, value display, badges
- Rolled months slider: range (0-18), onChange, custom max
- Deferred interest slider: range (0-100), onChange, custom max
- Reset functionality: button click, manual mode
- Read-only mode: disabled sliders, no callbacks
- Value display priority: manual > optimized > zero
- Edge cases: undefined columnKey, null callbacks, negative values
- Accessibility: labels, keyboard, roles
- Visual feedback: badges, consistent styling

**Key Test Areas**:
- Dual slider controls
- Manual vs optimized values
- Reset to optimized functionality
- Manual mode badge display
- Range constraints (0-18, 0-100)
- Accessibility compliance

## Test Patterns

### Hook Testing Pattern
```javascript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('useMyHook', () => {
  it('should update state', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.updateValue('newValue');
    });
    
    expect(result.current.value).toBe('newValue');
  });
});
```

### Component Testing Pattern
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('MyComponent', () => {
  it('should call onChange when clicked', () => {
    const onChange = vi.fn();
    render(<MyComponent onChange={onChange} />);
    
    fireEvent.click(screen.getByText('Button'));
    expect(onChange).toHaveBeenCalled();
  });
});
```

## Testing Philosophy

### What We Test
1. **Public API**: All exported functions, props, and return values
2. **User Interactions**: Clicks, inputs, keyboard navigation
3. **State Changes**: Input updates, calculations, resets
4. **Data Persistence**: Load/save quote workflows
5. **Edge Cases**: Null, undefined, empty, invalid values
6. **Accessibility**: Keyboard navigation, screen readers

### What We Don't Test
1. **Implementation Details**: Internal state variables, private functions
2. **Third-party Libraries**: React, Supabase (assume they work)
3. **Styling**: CSS classes (unless related to functionality)
4. **Mock Data**: We test behavior, not specific data values

## Next Steps

### Priority 1: Remaining Components
- [ ] `BTLInputForm.test.jsx` - Property value, rent, top slicing inputs
- [ ] `BTLProductSelector.test.jsx` - Product scope, retention, LTV, tier display
- [ ] `BTLResultsSummary.test.jsx` - Results table, action buttons

### Priority 2: Critical Hooks
- [ ] `useBTLCalculation.test.js` - validateInputs, calculate, recalculate
- [ ] `useBTLRates.test.js` - fetchCriteria, fetchRates (with Supabase mocks)

### Priority 3: Integration
- [ ] `BTLCalculator.test.jsx` - Full workflow (load → calculate → save)

## Coverage Metrics (Current)

### Hooks
- ✅ useBTLInputs: ~95% coverage (35 tests)
- ✅ useBTLResultsState: ~90% coverage (40 tests)
- ⬜ useBTLCalculation: 0% coverage
- ⬜ useBTLRates: 0% coverage

### Components
- ✅ BTLRangeToggle: ~85% coverage (20 tests)
- ✅ BTLAdditionalFees: ~90% coverage (35 tests)
- ✅ BTLSliderControls: ~90% coverage (40 tests)
- ⬜ BTLInputForm: 0% coverage
- ⬜ BTLProductSelector: 0% coverage
- ⬜ BTLResultsSummary: 0% coverage
- ⬜ BTLCalculator: 0% coverage

**Overall Progress**: ~45% of target test suite complete (145+ tests written)

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests (CI/CD pipeline)
- Before deployment

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass before committing
3. Maintain 80%+ coverage on new code
4. Update this README with test descriptions

## Troubleshooting

### Tests Not Running
```bash
# Clear cache
npm run test -- --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Import Errors
- Ensure all imports use correct paths
- Check that Vitest config includes test files
- Verify React Testing Library is installed

### Mock Errors
- Use `vi.fn()` for function mocks
- Mock Supabase client for data tests
- Mock React Router for navigation tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Hooks](https://react-hooks-testing-library.com/)
- [BTL_IMPLEMENTATION_GUIDE.md](../../../BTL_IMPLEMENTATION_GUIDE.md)
