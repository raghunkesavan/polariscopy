# Unit Testing Quick Start Guide

## 🚀 Getting Started with Testing

Your project already has Vitest configured! Here's how to start writing tests.

---

## 📋 Prerequisites

✅ Already installed:
- `vitest` - Test runner
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Additional matchers
- `@testing-library/user-event` - User interaction simulation

---

## 🧪 Running Tests

```bash
# Frontend tests
cd frontend

# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run tests with UI (visual interface)
npm run test:ui
```

```bash
# Backend tests
cd backend

npm test
npm run test:watch
npm run test:coverage
```

---

## 📁 Where to Put Tests

### Option 1: Co-located (Recommended)
Place test files next to the code they test:

```
src/
├── components/
│   ├── BTLInputForm.jsx
│   └── BTLInputForm.test.jsx          ← Test next to component
├── utils/
│   ├── btlCalculationEngine.js
│   └── btlCalculationEngine.test.js   ← Test next to utility
└── hooks/
    ├── useBTLCalculation.js
    └── useBTLCalculation.test.js      ← Test next to hook
```

### Option 2: Separate __tests__ folders (Current setup)
```
src/
├── components/
│   └── BTLInputForm.jsx
├── utils/
│   ├── btlCalculationEngine.js
│   └── __tests__/
│       └── btlCalculationEngine.test.js
```

Both work! Choose what your team prefers.

---

## 📝 Test File Naming Conventions

- Component tests: `ComponentName.test.jsx`
- Utility tests: `utilityName.test.js`
- Hook tests: `useHookName.test.js`
- Integration tests: `feature.integration.test.jsx`

---

## 🎯 Your First Test: Calculator Engine

### Step 1: Create the test file

`frontend/src/utils/__tests__/btlCalculationEngine.test.js`

```javascript
import { describe, it, expect } from 'vitest';

// Import the function you want to test
// Adjust based on your actual exports
import { calculateMaxGrossLoan } from '../btlCalculationEngine';

describe('BTL Calculation Engine', () => {
  describe('Max Gross Loan Calculation', () => {
    it('should calculate max gross loan correctly', () => {
      // Arrange: Set up test data
      const input = {
        propertyValue: 250000,
        monthlyRent: 1200,
        rate: 5.5,
        icrRequirement: 125,
        maxLtv: 80
      };

      // Act: Run the function
      const result = calculateMaxGrossLoan(input);

      // Assert: Check the result
      expect(result).toBeDefined();
      expect(result.grossLoan).toBeGreaterThan(0);
      expect(result.grossLoan).toBeLessThanOrEqual(200000); // 80% of 250k
      expect(result.ltv).toBeLessThanOrEqual(80);
    });

    it('should handle edge case: zero rent', () => {
      const input = {
        propertyValue: 250000,
        monthlyRent: 0,
        rate: 5.5,
        icrRequirement: 125,
        maxLtv: 80
      };

      const result = calculateMaxGrossLoan(input);

      // With zero rent, loan should be 0 or error should be thrown
      expect(result.grossLoan).toBe(0);
    });

    it('should respect maximum LTV limit', () => {
      const input = {
        propertyValue: 100000,
        monthlyRent: 5000, // Very high rent
        rate: 5.5,
        icrRequirement: 125,
        maxLtv: 75 // Max 75% LTV
      };

      const result = calculateMaxGrossLoan(input);

      expect(result.ltv).toBeLessThanOrEqual(75);
      expect(result.grossLoan).toBeLessThanOrEqual(75000);
    });
  });

  describe('ICR Calculation', () => {
    it('should calculate ICR at 125% for standard products', () => {
      const monthlyRent = 1200;
      const monthlyPayment = 768; // Should result in 125% ICR
      
      const icr = (monthlyRent / monthlyPayment) * 100;
      
      expect(icr).toBeCloseTo(125, 1); // Within 0.1%
    });

    it('should calculate ICR at 145% for HMO', () => {
      const monthlyRent = 1200;
      const monthlyPayment = 827; // Should result in 145% ICR
      
      const icr = (monthlyRent / monthlyPayment) * 100;
      
      expect(icr).toBeCloseTo(145, 1);
    });
  });
});
```

### Step 2: Run the test

```bash
cd frontend
npm test btlCalculationEngine
```

---

## 🎨 Testing React Components

### Example: Test an Input Component

`frontend/src/components/BTLInputForm.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BTLInputForm from './BTLInputForm';

describe('BTLInputForm Component', () => {
  it('should render all input fields', () => {
    const mockOnChange = vi.fn();
    const inputs = {
      propertyValue: '250000',
      monthlyRent: '1200'
    };

    render(<BTLInputForm inputs={inputs} onInputChange={mockOnChange} />);

    // Check if inputs are rendered
    expect(screen.getByLabelText(/property value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
  });

  it('should call onChange handler when input changes', () => {
    const mockOnChange = vi.fn();
    const inputs = { propertyValue: '250000' };

    render(<BTLInputForm inputs={inputs} onInputChange={mockOnChange} />);

    const input = screen.getByLabelText(/property value/i);
    fireEvent.change(input, { target: { value: '300000' } });

    expect(mockOnChange).toHaveBeenCalledWith('propertyValue', '300000');
  });

  it('should display validation error for negative values', () => {
    const mockOnChange = vi.fn();
    const inputs = { propertyValue: '' };

    render(<BTLInputForm inputs={inputs} onInputChange={mockOnChange} />);

    const input = screen.getByLabelText(/property value/i);
    fireEvent.change(input, { target: { value: '-100' } });

    // Assuming your component shows validation errors
    expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    const inputs = { propertyValue: '250000' };

    render(<BTLInputForm inputs={inputs} onInputChange={vi.fn()} />);

    const input = screen.getByLabelText(/property value/i);
    
    // Check if value is displayed with currency formatting
    expect(input.value).toBe('£250,000');
  });
});
```

---

## 🪝 Testing Custom Hooks

### Example: Test a Calculation Hook

`frontend/src/hooks/useBTLCalculation.test.js`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBTLCalculation } from './useBTLCalculation';

describe('useBTLCalculation Hook', () => {
  it('should initialize with empty results', () => {
    const inputs = {};
    const { result } = renderHook(() => useBTLCalculation(inputs));

    expect(result.current.results).toEqual([]);
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should calculate results when calculate is called', async () => {
    const inputs = {
      propertyValue: '250000',
      monthlyRent: '1200',
      rate: 5.5
    };

    const { result } = renderHook(() => useBTLCalculation(inputs));

    // Trigger calculation
    result.current.calculate();

    // Wait for calculation to complete
    await waitFor(() => {
      expect(result.current.isCalculating).toBe(false);
    });

    // Check results
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('should set error for invalid inputs', async () => {
    const inputs = {
      propertyValue: '-100', // Invalid
      monthlyRent: '1200'
    };

    const { result } = renderHook(() => useBTLCalculation(inputs));

    result.current.calculate();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

---

## 🌐 Testing API Routes (Backend)

### Example: Test Quotes API

`backend/__tests__/quotes.api.test.js`

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Quotes API', () => {
  describe('POST /api/quotes', () => {
    it('should create a new BTL quote', async () => {
      const quoteData = {
        calculator_type: 'btl',
        name: 'Test Quote',
        calculation_data: {
          propertyValue: 250000,
          monthlyRent: 1200
        }
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(quoteData)
        .expect(201);

      expect(response.body.quote).toBeDefined();
      expect(response.body.quote.reference_number).toBeTruthy();
      expect(response.body.quote.calculator_type).toBe('btl');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .post('/api/quotes')
        .send({ calculator_type: 'btl' })
        .expect(401);
    });
  });

  describe('GET /api/quotes/:id', () => {
    it('should retrieve a quote by ID', async () => {
      // First create a quote
      const createResponse = await request(app)
        .post('/api/quotes')
        .send({
          calculator_type: 'btl',
          name: 'Test'
        });

      const quoteId = createResponse.body.quote.id;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/quotes/${quoteId}`)
        .expect(200);

      expect(response.body.quote.id).toBe(quoteId);
    });

    it('should return 404 for non-existent quote', async () => {
      await request(app)
        .get('/api/quotes/non-existent-id')
        .expect(404);
    });
  });
});
```

---

## 📊 Useful Testing Matchers

```javascript
// Equality
expect(value).toBe(5);                    // Strict equality
expect(value).toEqual({ a: 1, b: 2 });   // Deep equality (objects/arrays)

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(100);
expect(value).toBeCloseTo(3.14, 2);      // Within 0.01

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(5);

// Objects
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', value);

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(3);
expect(fn).toHaveBeenCalledWith(arg1, arg2);

// DOM (with @testing-library/jest-dom)
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveClass('active');
expect(element).toHaveAttribute('aria-label');
expect(element).toHaveTextContent('Hello');
```

---

## 🎭 Mocking

### Mock Functions

```javascript
import { vi } from 'vitest';

// Create a mock function
const mockFn = vi.fn();

// Mock with return value
const mockFn = vi.fn(() => 'return value');

// Mock with multiple return values
const mockFn = vi.fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

// Check how it was called
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Mock Modules

```javascript
// Mock an entire module
vi.mock('../utils/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mock data' }))
}));

// Mock specific exports
vi.mock('../utils/api', () => ({
  fetchData: vi.fn(),
  postData: vi.fn()
}));
```

### Mock Supabase

```javascript
// Create mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    update: vi.fn(() => Promise.resolve({ data: [], error: null })),
    delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
  }))
};
```

---

## 🏃 Test Coverage Goals

Aim for these coverage targets:

- **Calculation Engines**: 95%+ (critical business logic)
- **Utility Functions**: 90%+
- **Custom Hooks**: 85%+
- **API Routes**: 80%+
- **Components**: 70%+ (focus on logic, not styling)

---

## 📚 Test Organization Tips

### 1. Group Related Tests

```javascript
describe('BTL Calculator', () => {
  describe('Input Validation', () => {
    it('should validate property value');
    it('should validate monthly rent');
  });

  describe('Calculations', () => {
    it('should calculate LTV');
    it('should calculate ICR');
  });

  describe('Edge Cases', () => {
    it('should handle zero values');
    it('should handle very large values');
  });
});
```

### 2. Use beforeEach for Setup

```javascript
describe('Component Tests', () => {
  let mockOnChange;
  let defaultProps;

  beforeEach(() => {
    mockOnChange = vi.fn();
    defaultProps = {
      value: '250000',
      onChange: mockOnChange
    };
  });

  it('test 1', () => {
    render(<Component {...defaultProps} />);
    // ...
  });

  it('test 2', () => {
    render(<Component {...defaultProps} value="300000" />);
    // ...
  });
});
```

### 3. Test One Thing at a Time

```javascript
// ❌ Bad: Testing multiple things
it('should work', () => {
  // Tests validation
  // Tests calculation
  // Tests display
  // Tests saving
});

// ✅ Good: Separate tests
it('should validate input');
it('should calculate result');
it('should display result');
it('should save quote');
```

---

## 🐛 Debugging Tests

```javascript
// Print to console during test
it('should work', () => {
  console.log('Debug:', value);
  // or
  screen.debug(); // Prints current DOM
});

// Pause test execution
it('should work', async () => {
  await screen.findByText('Hello');
  // Test will pause here if element not found
});

// Use .only to run single test
it.only('this test only', () => {
  // Only this test will run
});

// Skip tests
it.skip('skip this test', () => {
  // This test won't run
});
```

---

## ✅ Next Steps

1. **Start Simple**: Write tests for pure functions first (calculation engine)
2. **Add Component Tests**: Test one component at a time
3. **Check Coverage**: Run `npm run test:coverage` regularly
4. **Iterate**: Improve tests based on bugs you find
5. **Make it a Habit**: Write tests for new code from day one

---

## 📖 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Remember**: Tests are an investment. They take time upfront but save massive time debugging later!
