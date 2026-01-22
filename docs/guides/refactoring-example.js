/**
 * EXAMPLE: Refactoring BTL_Calculator.jsx
 * 
 * This shows exactly how to break down a large component
 * Use this as a template for your refactoring work
 */

// =============================================================================
// BEFORE: Monolithic Component (simplified example)
// =============================================================================

/*
// BTL_Calculator.jsx - 1,906 lines
export default function BTL_Calculator() {
  // 100+ lines of state
  const [propertyValue, setPropertyValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [topSlicing, setTopSlicing] = useState('');
  const [loanType, setLoanType] = useState('maxGross');
  const [specificGrossLoan, setSpecificGrossLoan] = useState('');
  const [specificNetLoan, setSpecificNetLoan] = useState('');
  const [productType, setProductType] = useState('');
  const [selectedRange, setSelectedRange] = useState('specialist');
  const [tier, setTier] = useState(2);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  // ... 90+ more state variables

  // 200+ lines of calculation logic
  const calculateResults = () => {
    // Complex calculation logic
  };

  // 100+ lines of event handlers
  const handlePropertyValueChange = (e) => { ... };
  const handleMonthlyRentChange = (e) => { ... };
  // ... 50+ more handlers

  // 1,500+ lines of JSX
  return (
    <div>
      <h1>BTL Calculator</h1>
      
      {/* 300 lines of input fields *\/}
      <div>
        <label>Property Value</label>
        <input value={propertyValue} onChange={handlePropertyValueChange} />
        {/* ... many more inputs *\/}
      </div>

      {/* 200 lines of loan controls *\/}
      <div>
        <select value={loanType} onChange={...}>
          <option value="maxGross">Max Gross</option>
          {/* ... *\/}
        </select>
      </div>

      {/* 500 lines of results table *\/}
      <table>
        {/* ... complex table *\/}
      </table>

      {/* 300 lines of criteria questions *\/}
      <div>
        {/* ... criteria form *\/}
      </div>
    </div>
  );
}
*/

// =============================================================================
// AFTER: Modular Component Structure
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Main Orchestrator Component (200 lines)
// features/btl-calculator/BTLCalculator.jsx
// -----------------------------------------------------------------------------

import { useState } from 'react';
import BTLInputForm from './components/BTLInputForm';
import BTLLoanControls from './components/BTLLoanControls';
import BTLResultsDisplay from './components/BTLResultsDisplay';
import BTLCriteriaSelector from './components/BTLCriteriaSelector';
import BTLClientDetails from './components/BTLClientDetails';
import { useBTLCalculation } from './hooks/useBTLCalculation';
import { useBTLInputs } from './hooks/useBTLInputs';
import SaveQuoteButton from '../../components/SaveQuoteButton';

export default function BTLCalculator() {
  // Custom hook manages all input state
  const {
    inputs,
    updateInput,
    updateMultipleInputs,
    resetInputs
  } = useBTLInputs();

  // Custom hook handles calculation logic
  const {
    results,
    isCalculating,
    calculate,
    error
  } = useBTLCalculation(inputs);

  return (
    <div className="btl-calculator">
      <h1>BTL Calculator</h1>
      
      <BTLInputForm 
        inputs={inputs}
        onInputChange={updateInput}
      />

      <BTLLoanControls
        loanType={inputs.loanType}
        specificGrossLoan={inputs.specificGrossLoan}
        specificNetLoan={inputs.specificNetLoan}
        onLoanTypeChange={(type) => updateInput('loanType', type)}
        onSpecificLoanChange={updateInput}
      />

      <BTLCriteriaSelector
        answers={inputs.answers}
        onAnswersChange={(answers) => updateInput('answers', answers)}
      />

      <BTLClientDetails
        clientDetails={inputs.clientDetails}
        onDetailsChange={(details) => updateInput('clientDetails', details)}
      />

      <button onClick={calculate} disabled={isCalculating}>
        {isCalculating ? 'Calculating...' : 'Calculate'}
      </button>

      {error && <div className="error">{error}</div>}

      <BTLResultsDisplay 
        results={results}
        isLoading={isCalculating}
      />

      <SaveQuoteButton
        calculatorType="BTL"
        calculationData={inputs}
        allColumnData={results}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Input Form Component (150 lines)
// features/btl-calculator/components/BTLInputForm.jsx
// -----------------------------------------------------------------------------

export default function BTLInputForm({ inputs, onInputChange }) {
  const handleCurrencyChange = (field) => (e) => {
    const value = parseCurrency(e.target.value);
    onInputChange(field, value);
  };

  return (
    <div className="btl-input-form">
      <div className="form-group">
        <label htmlFor="propertyValue">Property Value</label>
        <input
          id="propertyValue"
          type="text"
          value={formatCurrency(inputs.propertyValue)}
          onChange={handleCurrencyChange('propertyValue')}
          placeholder="£0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="monthlyRent">Monthly Rent</label>
        <input
          id="monthlyRent"
          type="text"
          value={formatCurrency(inputs.monthlyRent)}
          onChange={handleCurrencyChange('monthlyRent')}
          placeholder="£0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="topSlicing">Top Slicing</label>
        <input
          id="topSlicing"
          type="text"
          value={formatCurrency(inputs.topSlicing)}
          onChange={handleCurrencyChange('topSlicing')}
          placeholder="£0"
        />
      </div>

      {/* More input fields... */}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Loan Controls Component (120 lines)
// features/btl-calculator/components/BTLLoanControls.jsx
// -----------------------------------------------------------------------------

export default function BTLLoanControls({
  loanType,
  specificGrossLoan,
  specificNetLoan,
  onLoanTypeChange,
  onSpecificLoanChange
}) {
  return (
    <div className="btl-loan-controls">
      <div className="form-group">
        <label htmlFor="loanType">Loan Calculation Type</label>
        <select
          id="loanType"
          value={loanType}
          onChange={(e) => onLoanTypeChange(e.target.value)}
        >
          <option value="maxGross">Max Gross Loan</option>
          <option value="maxNet">Max Net Loan</option>
          <option value="specificGross">Specific Gross Loan</option>
          <option value="specificNet">Specific Net Loan</option>
          <option value="targetLtv">Target LTV</option>
        </select>
      </div>

      {loanType === 'specificGross' && (
        <div className="form-group">
          <label htmlFor="specificGrossLoan">Specific Gross Loan</label>
          <input
            id="specificGrossLoan"
            type="text"
            value={formatCurrency(specificGrossLoan)}
            onChange={(e) => onSpecificLoanChange('specificGrossLoan', parseCurrency(e.target.value))}
            placeholder="£0"
          />
        </div>
      )}

      {loanType === 'specificNet' && (
        <div className="form-group">
          <label htmlFor="specificNetLoan">Specific Net Loan</label>
          <input
            id="specificNetLoan"
            type="text"
            value={formatCurrency(specificNetLoan)}
            onChange={(e) => onSpecificLoanChange('specificNetLoan', parseCurrency(e.target.value))}
            placeholder="£0"
          />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Custom Hook for Input State Management (150 lines)
// features/btl-calculator/hooks/useBTLInputs.js
// -----------------------------------------------------------------------------

import { useState, useCallback } from 'react';

const DEFAULT_INPUTS = {
  propertyValue: '',
  monthlyRent: '',
  topSlicing: '',
  loanType: 'maxGross',
  specificGrossLoan: '',
  specificNetLoan: '',
  targetLtv: '',
  tier: 2,
  productType: '',
  selectedRange: 'specialist',
  answers: {},
  clientDetails: {
    clientType: 'Direct',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  }
};

export function useBTLInputs(initialInputs = {}) {
  const [inputs, setInputs] = useState({
    ...DEFAULT_INPUTS,
    ...initialInputs
  });

  const updateInput = useCallback((field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateMultipleInputs = useCallback((updates) => {
    setInputs(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
  }, []);

  return {
    inputs,
    updateInput,
    updateMultipleInputs,
    resetInputs
  };
}

// -----------------------------------------------------------------------------
// 5. Custom Hook for Calculation Logic (200 lines)
// features/btl-calculator/hooks/useBTLCalculation.js
// -----------------------------------------------------------------------------

import { useState, useCallback } from 'react';
import { calculateBTLResults } from '../../../utils/btlCalculationEngine';
import { validateBTLInputs } from '../utils/btlValidation';

export function useBTLCalculation(inputs) {
  const [results, setResults] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);

  const calculate = useCallback(async () => {
    setError(null);
    
    // Validate inputs
    const validationError = validateBTLInputs(inputs);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCalculating(true);
    
    try {
      // Perform calculation
      const calculatedResults = await calculateBTLResults(inputs);
      setResults(calculatedResults);
    } catch (err) {
      setError(err.message || 'Calculation failed');
    } finally {
      setIsCalculating(false);
    }
  }, [inputs]);

  return {
    results,
    isCalculating,
    calculate,
    error
  };
}

// -----------------------------------------------------------------------------
// 6. Results Display Component (150 lines)
// features/btl-calculator/components/BTLResultsDisplay.jsx
// -----------------------------------------------------------------------------

export default function BTLResultsDisplay({ results, isLoading }) {
  if (isLoading) {
    return <div className="loading">Calculating...</div>;
  }

  if (!results || results.length === 0) {
    return <div className="no-results">No results to display</div>;
  }

  return (
    <div className="btl-results">
      <h2>Results ({results.length} products found)</h2>
      
      <table className="results-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Rate</th>
            <th>LTV</th>
            <th>ICR</th>
            <th>Gross Loan</th>
            <th>Net Loan</th>
            <th>Monthly Cost</th>
            <th>APRC</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={index}>
              <td>{result.product_name}</td>
              <td>{result.initial_rate}%</td>
              <td>{result.ltv}%</td>
              <td>{result.icr}%</td>
              <td>£{result.gross_loan.toLocaleString()}</td>
              <td>£{result.net_loan.toLocaleString()}</td>
              <td>£{result.monthly_interest_cost.toLocaleString()}</td>
              <td>{result.aprc}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// BENEFITS OF THIS REFACTORING
// =============================================================================

/*
✅ Maintainability:
   - Each file under 200 lines (was 1,906)
   - Clear single responsibility
   - Easy to find and fix bugs

✅ Testability:
   - Each component can be tested independently
   - Mock hooks for isolated component tests
   - Test calculation logic separately from UI

✅ Reusability:
   - BTLInputForm can be reused in other contexts
   - Calculation hook can be used without UI
   - Components are modular and composable

✅ Developer Experience:
   - Faster to load and edit files
   - Better IDE performance
   - Easier code navigation
   - Clear file structure

✅ Performance:
   - Smaller bundle sizes with code splitting
   - Components can be lazy loaded
   - Better tree-shaking
*/

// =============================================================================
// HOW TO TEST REFACTORED COMPONENTS
// =============================================================================

/*
// BTLInputForm.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import BTLInputForm from './BTLInputForm';

describe('BTLInputForm', () => {
  it('should call onInputChange when property value changes', () => {
    const mockOnChange = vi.fn();
    const inputs = { propertyValue: '250000' };
    
    render(<BTLInputForm inputs={inputs} onInputChange={mockOnChange} />);
    
    const input = screen.getByLabelText(/property value/i);
    fireEvent.change(input, { target: { value: '300000' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('propertyValue', '300000');
  });
});

// useBTLCalculation.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { useBTLCalculation } from './useBTLCalculation';

describe('useBTLCalculation', () => {
  it('should calculate results correctly', async () => {
    const inputs = {
      propertyValue: '250000',
      monthlyRent: '1200',
      // ...
    };
    
    const { result } = renderHook(() => useBTLCalculation(inputs));
    
    await result.current.calculate();
    
    await waitFor(() => {
      expect(result.current.results).toHaveLength(greaterThan(0));
      expect(result.current.isCalculating).toBe(false);
    });
  });
});
*/
