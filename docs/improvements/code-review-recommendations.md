# Code Review & Improvement Recommendations

**Project**: Polaris Finance Calculator  
**Review Date**: November 10, 2025  
**Scope**: Full project review for maintainability improvements

---

## Executive Summary

Your project is **functionally working well** with solid architecture. This review focuses on **maintainability, scalability, and developer experience** improvements that won't affect current functionality.

### Priority Levels
- 🔴 **HIGH**: Should address soon (technical debt, security)
- 🟡 **MEDIUM**: Improves maintainability significantly
- 🟢 **LOW**: Nice-to-have, quality of life improvements

---

## 1. Code Organization & Structure

### 🟡 MEDIUM: Extract Shared Utilities

**Current State**: Duplicate logic across components (BTL_Calculator and BridgingCalculator share 70%+ code)

**Recommendation**: Create shared utility modules

```javascript
// frontend/src/utils/calculatorHelpers.js
export function parseNumericInput(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(value);
}

export function calculateLTV(loanAmount, propertyValue) {
  if (!loanAmount || !propertyValue || propertyValue === 0) return 0;
  return (loanAmount / propertyValue) * 100;
}

export function calculateICR(monthlyRent, monthlyInterest) {
  if (!monthlyInterest || monthlyInterest === 0) return 0;
  return (monthlyRent / monthlyInterest) * 100;
}
```

**Impact**: 
- Reduces 500+ lines of duplicate code
- Easier to maintain calculation logic
- Consistent behavior across calculators

---

### 🟡 MEDIUM: Constants Management

**Current State**: Magic numbers and strings scattered throughout code

**Recommendation**: Centralize all constants

```javascript
// frontend/src/config/calculatorConstants.js
export const CALCULATOR_TYPES = {
  BTL: 'BTL',
  BRIDGING: 'BRIDGING',
  BRIDGE: 'BRIDGE' // Alias for BRIDGING
};

export const VALIDATION_LIMITS = {
  MIN_PROPERTY_VALUE: 50000,
  MAX_PROPERTY_VALUE: 10000000,
  MIN_LOAN_AMOUNT: 25000,
  MAX_LOAN_AMOUNT: 5000000,
  MIN_LTV: 0,
  MAX_LTV: 95,
  MIN_TERM_MONTHS: 6,
  MAX_TERM_MONTHS: 360
};

export const RATE_KEYS = {
  BRIDGING_FIX: 'bridging_fix',
  BRIDGING_VAR: 'bridging_var',
  FUSION: 'fusion'
};

export const PRODUCT_NAMES = {
  FUSION: 'Fusion',
  FIXED_BRIDGE: 'Fixed Bridge',
  VARIABLE_BRIDGE: 'Variable Bridge'
};

export const ERROR_MESSAGES = {
  INVALID_PROPERTY_VALUE: 'Property value must be between £50k and £10m',
  INVALID_LOAN_AMOUNT: 'Loan amount must be between £25k and £5m',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SAVE_FAILED: 'Failed to save quote. Please try again.'
};
```

**Impact**: 
- Single source of truth for all constants
- Easier to update values
- Better TypeScript support (if migrating later)

---

### 🟢 LOW: Component Size Reduction

**Current State**: 
- `BTL_Calculator.jsx`: 1243 lines
- `BridgingCalculator.jsx`: 1260 lines
- `Constants.jsx`: 867 lines

**Recommendation**: Break into smaller components

```javascript
// BTL_Calculator.jsx becomes:
BTLCalculator (main orchestrator - 300 lines)
├── BTLCriteriaPanel.jsx (criteria questions - 200 lines)
├── BTLLoanDetailsPanel.jsx (loan inputs - 150 lines)
├── BTLResultsPanel.jsx (results display - 200 lines)
├── BTLFilters.jsx (filtering options - 100 lines)
└── BTLModals.jsx (DIP/Quote modals - 200 lines)
```

**Benefits**:
- Easier to test individual pieces
- Faster development (work on smaller files)
- Better code reuse

---

## 2. Error Handling & Logging

### 🔴 HIGH: Excessive Console Logging

**Current Issue**: 100+ console.log statements in production code

**Recommendation**: Implement proper logging utility

```javascript
// frontend/src/utils/logger.js
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

const ENABLE_LOGGING = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true';

class Logger {
  constructor(context = '') {
    this.context = context;
  }

  _log(level, message, data) {
    if (!ENABLE_LOGGING && level !== LOG_LEVELS.ERROR) return;
    
    const timestamp = new Date().toISOString();
    const prefix = this.context ? `[${this.context}]` : '';
    
    console[level](`${timestamp} ${prefix}`, message, data || '');
  }

  error(message, data) {
    this._log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data) {
    this._log(LOG_LEVELS.DEBUG, message, data);
  }
}

export default Logger;

// Usage:
// import Logger from '../utils/logger';
// const log = new Logger('BTLCalculator');
// log.debug('Fetching rates', { productType, tier });
// log.error('Failed to save quote', error);
```

**Impact**: 
- Production logs won't clutter browser console
- Easier debugging in development
- Can add remote logging service later (Sentry, LogRocket)

---

### 🟡 MEDIUM: Error Boundary Implementation

**Current State**: Errors in Calculator components can crash entire page

**Recommendation**: Already have ErrorBoundary.jsx, but wrap more components

```jsx
// App.jsx
<ErrorBoundary>
  <BrowserRouter>
    <ErrorBoundary>
      <Routes>
        <Route path="/calculator" element={
          <ErrorBoundary fallback={<CalculatorErrorFallback />}>
            <Calculator />
          </ErrorBoundary>
        } />
        <Route path="/rates" element={
          <ErrorBoundary fallback={<RatesErrorFallback />}>
            <RatesTable />
          </ErrorBoundary>
        } />
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
</ErrorBoundary>

// Create specific fallback components
function CalculatorErrorFallback({ error }) {
  return (
    <div className="error-state">
      <h2>Calculator Error</h2>
      <p>Something went wrong. Your data is safe.</p>
      <button onClick={() => window.location.reload()}>
        Reload Calculator
      </button>
    </div>
  );
}
```

---

### 🟡 MEDIUM: Consistent Error Response Format

**Current State**: Backend returns different error formats

**Recommendation**: Standardize API error responses

```javascript
// backend/middleware/errorHandler.js
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Log error with context
  console.error('[API Error]', {
    path: req.path,
    method: req.method,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.details : undefined,
      timestamp: err.timestamp || new Date().toISOString()
    }
  });
}

// Usage in routes:
// throw new ApiError(400, 'Invalid loan amount', { min: 25000, max: 5000000 });
```

---

## 3. Code Quality & Best Practices

### 🟡 MEDIUM: Environment Variable Validation

**Current Issue**: Silent failures if env vars are missing

**Recommendation**: Add startup validation

```javascript
// backend/config/validateEnv.js
export function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PORT'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n📝 Please check your .env file');
    process.exit(1);
  }

  // Validate format
  if (!process.env.SUPABASE_URL.startsWith('https://')) {
    console.error('❌ SUPABASE_URL must start with https://');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

// server.js
import { validateEnvironment } from './config/validateEnv.js';
validateEnvironment();
```

---

### 🟢 LOW: Add JSDoc Comments for Complex Functions

**Current State**: Complex calculation logic lacks documentation

**Recommendation**: Add JSDoc comments

```javascript
/**
 * Calculates the maximum LTV based on property type, tier, and criteria
 * 
 * @param {Object} params - Calculation parameters
 * @param {string} params.propertyType - Type of property (Residential/Commercial/Semi-Commercial)
 * @param {number} params.tier - Tier number (1-3)
 * @param {boolean} params.isRetention - Whether this is a retention case
 * @param {number} params.retentionLtv - Retention LTV percentage if applicable
 * @param {boolean} params.isFlatAboveCommercial - Flat above commercial override
 * @param {Array} params.rates - Available rates to check max_ltv values
 * @returns {number} Maximum LTV percentage (0-100)
 * 
 * @example
 * const maxLtv = calculateMaxLtv({
 *   propertyType: 'Residential',
 *   tier: 2,
 *   isRetention: false,
 *   rates: [...ratesData]
 * }); // Returns: 75
 */
export function calculateMaxLtv({ propertyType, tier, isRetention, retentionLtv, isFlatAboveCommercial, rates }) {
  // Implementation...
}
```

---

### 🟡 MEDIUM: Input Validation Consistency

**Current State**: Validation scattered across components

**Recommendation**: Create validation utilities

```javascript
// frontend/src/utils/validators.js
export const validators = {
  propertyValue: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, error: 'Must be a number' };
    if (num < 50000) return { valid: false, error: 'Minimum £50,000' };
    if (num > 10000000) return { valid: false, error: 'Maximum £10,000,000' };
    return { valid: true };
  },

  loanAmount: (value, propertyValue) => {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, error: 'Must be a number' };
    if (num < 25000) return { valid: false, error: 'Minimum £25,000' };
    if (num > 5000000) return { valid: false, error: 'Maximum £5,000,000' };
    if (propertyValue && num > propertyValue) {
      return { valid: false, error: 'Cannot exceed property value' };
    }
    return { valid: true };
  },

  ltv: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, error: 'Must be a number' };
    if (num < 0) return { valid: false, error: 'Minimum 0%' };
    if (num > 95) return { valid: false, error: 'Maximum 95%' };
    return { valid: true };
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  },

  postcode: (value) => {
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(value.trim())) {
      return { valid: false, error: 'Invalid UK postcode' };
    }
    return { valid: true };
  }
};

// Usage:
// const { valid, error } = validators.propertyValue(propertyValue);
// if (!valid) setError(error);
```

---

## 4. Performance Optimizations

### 🟡 MEDIUM: Memoization & Unnecessary Re-renders

**Current Issue**: Large calculators re-render frequently

**Recommendation**: Add proper memoization

```javascript
// BTL_Calculator.jsx
import React, { useState, useMemo, useCallback, memo } from 'react';

// Memoize expensive calculations
const calculatedRates = useMemo(() => {
  if (!relevantRates.length) return [];
  
  return relevantRates.map(rate => {
    // Expensive calculations here
    return calculateRateDetails(rate, loanDetails);
  });
}, [relevantRates, loanDetails]); // Only recalculate when these change

// Memoize callbacks passed to child components
const handleAnswerChange = useCallback((questionKey, value) => {
  setAnswers(prev => ({ ...prev, [questionKey]: value }));
}, []);

// Memoize child components
const CriteriaPanel = memo(({ questions, answers, onAnswerChange }) => {
  // Component logic
});
```

---

### 🟢 LOW: API Request Optimization

**Current State**: Multiple sequential API calls

**Recommendation**: Batch requests where possible

```javascript
// frontend/src/utils/api.js
export async function fetchQuoteWithRelatedData(quoteId) {
  // Instead of:
  // const quote = await fetchQuote(quoteId);
  // const results = await fetchResults(quoteId);
  // const dipData = await fetchDipData(quoteId);
  
  // Do:
  const [quote, results, dipData] = await Promise.all([
    fetchQuote(quoteId),
    fetchResults(quoteId),
    fetchDipData(quoteId)
  ]);
  
  return { quote, results, dipData };
}

// Or better: Create a backend endpoint that returns everything
// GET /api/quotes/:id/full
```

---

### 🟡 MEDIUM: Export Functionality Optimization

**Current Issue**: Export fetches ALL quotes then results one-by-one

**Recommendation**: Use Supabase joins to fetch in one query

```javascript
// backend/routes/export.js - OPTIMIZED VERSION
router.get('/quotes', async (req, res) => {
  try {
    const { calculator_type } = req.query;
    
    let query = supabase
      .from('quotes')
      .select(`
        *,
        quote_results (*)
      `)
      .order('created_at', { ascending: false });
    
    if (calculator_type === 'BTL') {
      query = query.eq('calculator_type', 'BTL');
    } else if (calculator_type === 'BRIDGING') {
      query = query.eq('calculator_type', 'BRIDGING');
    }
    
    const { data: quotesWithResults, error } = await query;
    
    if (error) throw error;
    
    // Flatten data for CSV
    const flattenedData = quotesWithResults.flatMap(quote => {
      const quoteData = extractQuoteFields(quote);
      
      if (!quote.quote_results || quote.quote_results.length === 0) {
        return [{ ...quoteData, result_number: 0, total_results: 0 }];
      }
      
      return quote.quote_results.map((result, index) => ({
        ...quoteData,
        result_number: index + 1,
        total_results: quote.quote_results.length,
        ...result
      }));
    });
    
    return res.json({ data: flattenedData });
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: err.message });
  }
});
```

**Impact**: Reduces database queries from N+1 to 1, much faster export

---

## 5. Testing & Quality Assurance

### 🔴 HIGH: Add Basic Tests

**Current State**: No automated tests

**Recommendation**: Start with utility function tests

```javascript
// frontend/src/utils/__tests__/calculatorHelpers.test.js
import { describe, it, expect } from 'vitest';
import { calculateLTV, calculateICR, parseNumericInput } from '../calculatorHelpers';

describe('Calculator Helpers', () => {
  describe('calculateLTV', () => {
    it('calculates LTV correctly', () => {
      expect(calculateLTV(75000, 100000)).toBe(75);
      expect(calculateLTV(50000, 100000)).toBe(50);
    });

    it('handles zero property value', () => {
      expect(calculateLTV(75000, 0)).toBe(0);
    });

    it('handles null values', () => {
      expect(calculateLTV(null, 100000)).toBe(0);
      expect(calculateLTV(75000, null)).toBe(0);
    });
  });

  describe('parseNumericInput', () => {
    it('parses currency strings', () => {
      expect(parseNumericInput('£100,000')).toBe(100000);
      expect(parseNumericInput('$50,000.50')).toBe(50000.50);
    });

    it('handles already numeric values', () => {
      expect(parseNumericInput(100000)).toBe(100000);
    });

    it('returns null for invalid input', () => {
      expect(parseNumericInput('invalid')).toBe(null);
      expect(parseNumericInput('')).toBe(null);
    });
  });
});
```

**Setup**:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

```json
// package.json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

---

### 🟢 LOW: Add E2E Tests for Critical Flows

**Recommendation**: Use Playwright for critical user journeys

```javascript
// e2e/calculator-flow.spec.js
import { test, expect } from '@playwright/test';

test('BTL Calculator: Complete quote journey', async ({ page }) => {
  await page.goto('http://localhost:3000/calculator');
  
  // Select property type
  await page.selectOption('[name="propertyType"]', 'Residential');
  
  // Enter loan details
  await page.fill('[name="propertyValue"]', '200000');
  await page.fill('[name="grossLoan"]', '150000');
  await page.fill('[name="monthlyRent"]', '1200');
  
  // Submit
  await page.click('button:has-text("Calculate")');
  
  // Verify results appear
  await expect(page.locator('.calculation-results')).toBeVisible();
  await expect(page.locator('.rate-result')).toHaveCount.greaterThan(0);
  
  // Save quote
  await page.fill('[name="quoteName"]', 'Test Quote');
  await page.click('button:has-text("Save Quote")');
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 6. Security Improvements

### 🔴 HIGH: Environment Variable Exposure

**Current Issue**: Sensitive keys in client-side code

**Recommendation**: Verify only ANON key is in frontend

```javascript
// ✅ CORRECT - Frontend .env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ❌ WRONG - NEVER put service role key in frontend!
// VITE_SUPABASE_SERVICE_ROLE_KEY=xxx // DANGEROUS!

// ✅ CORRECT - Backend .env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Action**: Audit all `.env` files and gitignore them

```bash
# .gitignore
.env
.env.local
.env.*.local
**/.env
```

---

### 🟡 MEDIUM: Add Rate Limiting

**Current State**: No protection against abuse

**Recommendation**: Add rate limiting middleware

```javascript
// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const pdfLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 PDFs per minute
  message: 'Too many PDF requests, please slow down',
});

// server.js
import { apiLimiter, pdfLimiter } from './middleware/rateLimiter.js';

app.use('/api/', apiLimiter);
app.use('/api/dip/pdf', pdfLimiter);
app.use('/api/quote/pdf', pdfLimiter);
```

```bash
npm install express-rate-limit
```

---

### 🟡 MEDIUM: Input Sanitization

**Current Issue**: Direct user input stored without sanitization

**Recommendation**: Sanitize all user inputs

```javascript
// backend/middleware/sanitize.js
import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(obj) {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitizeInput(value)])
    );
  }
  
  return obj;
}

// Usage in routes
router.post('/quotes', (req, res) => {
  const sanitizedData = sanitizeInput(req.body);
  // Use sanitizedData instead of req.body
});
```

---

## 7. Documentation Improvements

### 🟡 MEDIUM: API Documentation

**Current State**: No API documentation

**Recommendation**: Add OpenAPI/Swagger documentation

```javascript
// backend/docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Polaris Finance Calculator API',
      version: '1.0.0',
      description: 'API for BTL and Bridging loan calculators',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://api.yourproduction.com', description: 'Production' }
    ],
  },
  apis: ['./routes/*.js'], // Path to API routes
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// In routes:
/**
 * @swagger
 * /api/quotes:
 *   post:
 *     summary: Create a new quote
 *     tags: [Quotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               calculator_type:
 *                 type: string
 *                 enum: [BTL, BRIDGING]
 *     responses:
 *       201:
 *         description: Quote created successfully
 */
```

Visit: http://localhost:3001/api-docs for interactive docs

---

### 🟢 LOW: Component Documentation

**Current State**: Complex components lack usage examples

**Recommendation**: Add Storybook or component docs

```jsx
// BTL_Calculator.stories.jsx
export default {
  title: 'Calculators/BTL Calculator',
  component: BTLCalculator,
};

export const Empty = {
  args: {
    initialQuote: null,
  },
};

export const WithLoadedQuote = {
  args: {
    initialQuote: {
      id: '123',
      name: 'Test Quote',
      calculator_type: 'BTL',
      payload: { /* ... */ }
    },
  },
};
```

---

## 8. Database & Data Management

### 🟡 MEDIUM: Database Indexes

**Current Issue**: Slow queries on large datasets

**Recommendation**: Add indexes for frequently queried fields

```sql
-- migrations/010_add_performance_indexes.sql

-- Speed up quotes list page
CREATE INDEX IF NOT EXISTS idx_quotes_created_at_desc 
ON quotes (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bridge_quotes_created_at_desc 
ON bridge_quotes (created_at DESC);

-- Speed up quote results lookup
CREATE INDEX IF NOT EXISTS idx_quote_results_quote_id_fee 
ON quote_results (quote_id, fee_column);

CREATE INDEX IF NOT EXISTS idx_bridge_quote_results_quote_id_product 
ON bridge_quote_results (quote_id, product_name);

-- Speed up filtering
CREATE INDEX IF NOT EXISTS idx_quotes_calculator_type 
ON quotes (calculator_type);

CREATE INDEX IF NOT EXISTS idx_quotes_borrower_type 
ON quotes (borrower_type);

-- Composite index for common filter combination
CREATE INDEX IF NOT EXISTS idx_quotes_type_created 
ON quotes (calculator_type, created_at DESC);

-- Add comments
COMMENT ON INDEX idx_quotes_created_at_desc IS 'Speeds up quotes list page sorting';
COMMENT ON INDEX idx_quote_results_quote_id_fee IS 'Speeds up results lookup in PDFs';
```

---

### 🟡 MEDIUM: Data Archiving Strategy

**Current State**: No data retention policy

**Recommendation**: Add soft deletes and archiving

```sql
-- migrations/011_add_soft_deletes.sql

-- Add deleted_at column
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add archived_at column
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create view for active quotes
CREATE OR REPLACE VIEW active_quotes AS
SELECT * FROM quotes WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_bridge_quotes AS
SELECT * FROM bridge_quotes WHERE deleted_at IS NULL;

-- Archive old quotes function (run monthly)
CREATE OR REPLACE FUNCTION archive_old_quotes()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE quotes 
  SET archived_at = NOW()
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND archived_at IS NULL
    AND deleted_at IS NULL;
    
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
```

---

### 🟢 LOW: Database Backup Verification

**Recommendation**: Add backup verification script

```javascript
// backend/scripts/verifyBackup.js
import { supabase } from '../config/supabase.js';

async function verifyDatabaseIntegrity() {
  console.log('Verifying database integrity...\n');
  
  const checks = [
    {
      name: 'Quotes table accessible',
      query: () => supabase.from('quotes').select('id').limit(1)
    },
    {
      name: 'Results table accessible',
      query: () => supabase.from('quote_results').select('id').limit(1)
    },
    {
      name: 'Rates table has data',
      query: async () => {
        const { data, error } = await supabase.from('rates').select('key');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No rates found');
        return { data };
      }
    },
    {
      name: 'Criteria table has data',
      query: async () => {
        const { data, error } = await supabase.from('criteria_config_flat').select('id');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No criteria found');
        return { data };
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      await check.query();
      console.log(`✅ ${check.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${check.name}:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

verifyDatabaseIntegrity();
```

```json
// package.json
"scripts": {
  "verify:db": "node scripts/verifyBackup.js"
}
```

---

## 9. Developer Experience

### 🟡 MEDIUM: TypeScript Migration (Long-term)

**Current State**: JavaScript only

**Recommendation**: Gradual TypeScript adoption

```typescript
// frontend/src/types/calculator.ts
export type CalculatorType = 'BTL' | 'BRIDGING';

export interface LoanDetails {
  propertyValue: number;
  grossLoan: number;
  netLoan: number;
  ltv: number;
  monthlyRent: number;
  topSlicing: number;
}

export interface Quote {
  id: string;
  name: string;
  calculator_type: CalculatorType;
  status: 'draft' | 'issued' | 'archived';
  loan_amount: number;
  ltv: number;
  payload: Record<string, any>;
  created_at: string;
  updated_at: string;
  reference_number: string;
}

export interface RateResult {
  fee_column: string;
  product_name: string;
  gross_loan: number;
  net_loan: number;
  ltv_percentage: number;
  icr: number;
  initial_rate: number;
  pay_rate: number;
  // ... other fields
}
```

**Benefits**:
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

---

### 🟢 LOW: Pre-commit Hooks

**Recommendation**: Add formatting and linting on commit

```bash
npm install --save-dev husky lint-staged prettier eslint
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# Setup
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

---

### 🟢 LOW: Development Environment Setup

**Recommendation**: Add development container config

```json
// .devcontainer/devcontainer.json
{
  "name": "Polaris Finance Calculator",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "forwardPorts": [3000, 3001],
  "postCreateCommand": "npm install && cd frontend && npm install && cd ../backend && npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss"
      ]
    }
  }
}
```

---

## 10. Deployment & DevOps

### 🟡 MEDIUM: CI/CD Pipeline

**Current State**: Manual deployment

**Recommendation**: Add GitHub Actions workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      
      - name: Run tests
        run: |
          cd frontend && npm test
          cd ../backend && npm test
      
      - name: Build frontend
        run: cd frontend && npm run build
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

### 🟡 MEDIUM: Health Check Endpoint

**Current State**: Basic /health endpoint

**Recommendation**: Add comprehensive health checks

```javascript
// backend/routes/health.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      memory: 'unknown',
      env: 'unknown'
    }
  };

  // Database check
  try {
    await supabase.from('quotes').select('id').limit(1);
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Memory check
  const used = process.memoryUsage();
  checks.checks.memory = {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    status: used.heapUsed / used.heapTotal < 0.9 ? 'healthy' : 'warning'
  };

  // Environment check
  checks.checks.env = {
    node_version: process.version,
    environment: process.env.NODE_ENV || 'development',
    supabase_configured: !!process.env.SUPABASE_URL
  };

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

export default router;
```

---

## Priority Implementation Plan

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ Add logger utility and replace console.log
2. ✅ Extract shared calculation utilities
3. ✅ Add environment variable validation
4. ✅ Implement rate limiting
5. ✅ Add database indexes

### Phase 2: Quality Improvements (2-4 weeks)
1. ✅ Create validation utilities
2. ✅ Standardize error handling
3. ✅ Add JSDoc comments to complex functions
4. ✅ Optimize export queries
5. ✅ Add basic unit tests

### Phase 3: Long-term Enhancements (1-3 months)
1. ✅ Break down large components
2. ✅ Add API documentation (Swagger)
3. ✅ Implement soft deletes and archiving
4. ✅ Set up CI/CD pipeline
5. ✅ Consider TypeScript migration

---

## Estimated Impact

| Category | Current State | After Improvements | Effort |
|----------|---------------|-------------------|--------|
| **Maintainability** | 6/10 | 9/10 | Medium |
| **Performance** | 7/10 | 9/10 | Low |
| **Security** | 7/10 | 9/10 | Low |
| **Developer Experience** | 6/10 | 9/10 | Medium |
| **Code Quality** | 6/10 | 8/10 | Medium |
| **Testing Coverage** | 0% | 40%+ | High |

---

## Next Steps

1. **Review with team**: Discuss priorities and timeline
2. **Create tickets**: Break down into implementable tasks
3. **Start with Phase 1**: Quick wins for immediate benefits
4. **Iterate**: Implement improvements incrementally
5. **Document**: Keep this document updated as changes are made

---

## Questions or Need Help?

This review provides actionable recommendations. Focus on:
- 🔴 **HIGH priority items** first (security, performance)
- 🟡 **MEDIUM items** for maintainability
- 🟢 **LOW items** as time permits

**Remember**: These improvements should be implemented **gradually** without breaking existing functionality. Each change should be tested thoroughly.
