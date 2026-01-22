/**
 * BTLCalculator Integration Tests
 * 
 * Tests the main BTL Calculator orchestrator component integrating:
 * - All 4 custom hooks (useBTLInputs, useBTLCalculation, useBTLRates, useBTLResultsState)
 * - All 7 sub-components
 * - Quote loading and saving
 * - Full calculation workflow
 * - Collapsible sections
 * - Permissions and read-only mode
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BTLCalculator from '../../components/BTLCalculator';

// Mock contexts
vi.mock('../../../../contexts/SupabaseContext', () => ({
  useSupabase: vi.fn(() => ({
    supabase: {
      from: vi.fn()
    }
  }))
}));

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    canEditCalculators: vi.fn(() => true),
    token: 'mock-token'
  }))
}));

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn()
  }))
}));

// Mock hooks
vi.mock('../../hooks/useBTLInputs');
vi.mock('../../hooks/useBTLCalculation');
vi.mock('../../hooks/useBTLRates');
vi.mock('../../hooks/useBTLResultsState');
vi.mock('../../../../hooks/calculator/useBrokerSettings');
vi.mock('../../../../hooks/useResultsVisibility');
vi.mock('../../../../hooks/useResultsRowOrder');

// Mock utilities
vi.mock('../../../../utils/quotes', () => ({
  getQuote: vi.fn(),
  upsertQuoteData: vi.fn()
}));

// Mock components
vi.mock('../../components/BTLInputForm', () => ({
  default: ({ inputs, onInputChange }) => (
    <div data-testid="btl-input-form">
      <input
        data-testid="property-value-input"
        type="number"
        value={inputs.propertyValue}
        onChange={(e) => onInputChange('propertyValue', e.target.value)}
      />
    </div>
  )
}));

vi.mock('../../components/BTLProductSelector', () => ({
  default: ({ inputs, onInputChange }) => (
    <div data-testid="btl-product-selector">
      <select
        data-testid="product-scope-select"
        value={inputs.productScope}
        onChange={(e) => onInputChange('productScope', e.target.value)}
      >
        <option value="Whole Market">Whole Market</option>
        <option value="Select Panel">Select Panel</option>
      </select>
    </div>
  )
}));

vi.mock('../../components/BTLRangeToggle', () => ({
  default: ({ selectedRange, onChange }) => (
    <div data-testid="btl-range-toggle">
      <button onClick={() => onChange('Core')}>Core</button>
      <button onClick={() => onChange('Specialist')}>Specialist</button>
    </div>
  )
}));

vi.mock('../../components/BTLAdditionalFees', () => ({
  default: ({ inputs }) => (
    <div data-testid="btl-additional-fees">
      Fees: {inputs.additionalFeeToggle ? 'Enabled' : 'Disabled'}
    </div>
  )
}));

vi.mock('../../components/BTLSliderControls', () => ({
  default: () => <div data-testid="btl-slider-controls">Slider Controls</div>
}));

vi.mock('../../components/BTLResultsSummary', () => ({
  default: ({ results }) => (
    <div data-testid="btl-results-summary">
      {results.length} Results
    </div>
  )
}));

vi.mock('../../../../components/calculator/btl/BTLLoanDetailsSection', () => ({
  default: () => <div data-testid="btl-loan-details">Loan Details</div>
}));

vi.mock('../../../../components/calculator/btl/BTLCriteriaSection', () => ({
  default: () => <div data-testid="btl-criteria">Criteria</div>
}));

vi.mock('../../../../components/calculator/shared/QuoteReferenceHeader', () => ({
  default: ({ referenceNumber }) => (
    <div data-testid="quote-reference-header">Ref: {referenceNumber}</div>
  )
}));

vi.mock('../../../../components/calculator/shared/ClientDetailsSection', () => ({
  default: () => <div data-testid="client-details">Client Details</div>
}));

vi.mock('../../../../components/Breadcrumbs', () => ({
  default: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}));

vi.mock('../../../../components/SaveQuoteButton', () => ({
  default: ({ onSave, disabled }) => (
    <button data-testid="save-quote-btn" onClick={() => onSave()} disabled={disabled}>
      Save Quote
    </button>
  )
}));

vi.mock('../../../../components/calculator/CollapsibleSection', () => ({
  default: ({ title, expanded, onToggle, children }) => (
    <div data-testid={`collapsible-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <button onClick={onToggle}>{expanded ? 'Collapse' : 'Expand'} {title}</button>
      {expanded && <div>{children}</div>}
    </div>
  )
}));

import { useBTLInputs } from '../../hooks/useBTLInputs';
import { useBTLCalculation } from '../../hooks/useBTLCalculation';
import { useBTLRates } from '../../hooks/useBTLRates';
import { useBTLResultsState } from '../../hooks/useBTLResultsState';
import useBrokerSettings from '../../../../hooks/calculator/useBrokerSettings';
import { useResultsVisibility } from '../../../../hooks/useResultsVisibility';
import { useResultsRowOrder } from '../../../../hooks/useResultsRowOrder';
import { getQuote, upsertQuoteData } from '../../../../utils/quotes';
import { useSupabase } from '../../../../contexts/SupabaseContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';

describe('BTLCalculator Integration Tests', () => {
  let mockInputs;
  let mockCalculation;
  let mockRates;
  let mockResultsState;
  let mockBrokerSettings;
  let mockToast;

  beforeEach(() => {
    // Mock inputs hook
    mockInputs = {
      propertyValue: 250000,
      monthlyRent: 1200,
      productScope: 'Whole Market',
      selectedRange: 'Core',
      additionalFeeToggle: false,
      answers: {},
      clientDetails: {},
      updateInput: vi.fn(),
      updateAnswer: vi.fn(),
      updateClientDetails: vi.fn(),
      updateTier: vi.fn(),
      resetInputs: vi.fn(),
      loadFromQuote: vi.fn(),
      getInputsForSave: vi.fn(() => ({}))
    };
    useBTLInputs.mockReturnValue(mockInputs);

    // Mock calculation hook
    mockCalculation = {
      results: [],
      relevantRates: [],
      columnsHeaders: [],
      error: null,
      isCalculating: false,
      lastCalculationInputs: null,
      validateInputs: vi.fn(() => ({ valid: true })),
      calculate: vi.fn(() => []),
      clearResults: vi.fn(),
      recalculateWithSliders: vi.fn()
    };
    useBTLCalculation.mockReturnValue(mockCalculation);

    // Mock rates hook
    mockRates = {
      allCriteria: [],
      questions: {},
      ratesData: [],
      loading: false,
      error: null,
      fetchCriteria: vi.fn(),
      fetchRates: vi.fn(),
      refreshRates: vi.fn(),
      refreshCriteria: vi.fn()
    };
    useBTLRates.mockReturnValue(mockRates);

    // Mock results state hook
    mockResultsState = {
      selectedResults: [],
      resultsMode: 'calculate',
      clearAllResults: vi.fn(),
      loadResultsFromQuote: vi.fn(),
      getResultsForSave: vi.fn(() => ({}))
    };
    useBTLResultsState.mockReturnValue(mockResultsState);

    // Mock broker settings
    mockBrokerSettings = {
      brokerSettings: {}
    };
    useBrokerSettings.mockReturnValue(mockBrokerSettings);

    // Mock visibility and order hooks
    useResultsVisibility.mockReturnValue({
      isRowVisible: vi.fn(() => true)
    });
    useResultsRowOrder.mockReturnValue({
      getOrderedRows: vi.fn(() => [])
    });

    // Mock toast
    mockToast = { showToast: vi.fn() };
    useToast.mockReturnValue(mockToast);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================

  describe('Initial Rendering', () => {
    it('should render BTL Calculator title', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText('BTL Calculator')).toBeInTheDocument();
    });

    it('should render all main components', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByTestId('btl-input-form')).toBeInTheDocument();
      expect(screen.getByTestId('btl-product-selector')).toBeInTheDocument();
      expect(screen.getByTestId('btl-range-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('btl-additional-fees')).toBeInTheDocument();
    });

    it('should render breadcrumbs', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText('Calculate')).toBeInTheDocument();
      expect(screen.getByText('Clear Results')).toBeInTheDocument();
      expect(screen.getByText('Reset All')).toBeInTheDocument();
    });

    it('should render save quote button', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByTestId('save-quote-btn')).toBeInTheDocument();
    });

    it('should render empty results message initially', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText(/Enter property details and click Calculate/i)).toBeInTheDocument();
    });
  });

  // ==================== COLLAPSIBLE SECTIONS TESTS ====================

  describe('Collapsible Sections', () => {
    it('should render all collapsible sections', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByTestId('collapsible-criteria')).toBeInTheDocument();
      expect(screen.getByTestId('collapsible-loan-details')).toBeInTheDocument();
      expect(screen.getByTestId('collapsible-client-details')).toBeInTheDocument();
      expect(screen.getByTestId('collapsible-results')).toBeInTheDocument();
    });

    it('should toggle criteria section', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const criteriaButton = screen.getByText(/Expand Criteria/i);
      expect(criteriaButton).toBeInTheDocument();

      fireEvent.click(criteriaButton);
      expect(screen.getByTestId('btl-criteria')).toBeInTheDocument();
    });

    it('should toggle loan details section', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const loanDetailsButton = screen.getByText(/Expand Loan Details/i);
      fireEvent.click(loanDetailsButton);
      expect(screen.getByTestId('btl-loan-details')).toBeInTheDocument();
    });

    it('should show client details by default', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByTestId('client-details')).toBeInTheDocument();
    });

    it('should show results section by default', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText(/Enter property details and click Calculate/i)).toBeInTheDocument();
    });
  });

  // ==================== CALCULATION WORKFLOW TESTS ====================

  describe('Calculation Workflow', () => {
    it('should validate inputs before calculating', async () => {
      mockCalculation.validateInputs.mockReturnValue({
        valid: false,
        error: 'Property value is required'
      });

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const calculateBtn = screen.getByText('Calculate');
      fireEvent.click(calculateBtn);

      await waitFor(() => {
        expect(mockCalculation.validateInputs).toHaveBeenCalled();
        expect(mockToast.showToast).toHaveBeenCalledWith('error', 'Property value is required');
      });
    });

    it('should fetch rates and calculate when valid', async () => {
      mockCalculation.validateInputs.mockReturnValue({ valid: true });
      mockCalculation.calculate.mockReturnValue([
        { id: 1, rate: 4.5 },
        { id: 2, rate: 4.8 }
      ]);

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const calculateBtn = screen.getByText('Calculate');
      fireEvent.click(calculateBtn);

      await waitFor(() => {
        expect(mockRates.fetchRates).toHaveBeenCalled();
        expect(mockCalculation.calculate).toHaveBeenCalled();
        expect(mockToast.showToast).toHaveBeenCalledWith('success', 'Found 2 matching products');
      });
    });

    it('should show warning when no results', async () => {
      mockCalculation.validateInputs.mockReturnValue({ valid: true });
      mockCalculation.calculate.mockReturnValue([]);

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const calculateBtn = screen.getByText('Calculate');
      fireEvent.click(calculateBtn);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith('warning', 'No products match your criteria');
      });
    });

    it('should handle calculation errors', async () => {
      mockCalculation.validateInputs.mockReturnValue({ valid: true });
      mockCalculation.calculate.mockImplementation(() => {
        throw new Error('Calculation failed');
      });

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const calculateBtn = screen.getByText('Calculate');
      fireEvent.click(calculateBtn);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith('error', 'Calculation failed');
      });
    });

    it('should display results after successful calculation', () => {
      mockCalculation.results = [
        { id: 1, rate: 4.5 },
        { id: 2, rate: 4.8 }
      ];

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByTestId('btl-results-summary')).toBeInTheDocument();
      expect(screen.getByText('2 Results')).toBeInTheDocument();
    });
  });

  // ==================== CLEAR AND RESET TESTS ====================

  describe('Clear and Reset Operations', () => {
    it('should clear results when Clear Results button clicked', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const clearBtn = screen.getByText('Clear Results');
      fireEvent.click(clearBtn);

      expect(mockCalculation.clearResults).toHaveBeenCalled();
      expect(mockResultsState.clearAllResults).toHaveBeenCalled();
      expect(mockToast.showToast).toHaveBeenCalledWith('info', 'Results cleared');
    });

    it('should reset everything when Reset All button clicked', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const resetBtn = screen.getByText('Reset All');
      fireEvent.click(resetBtn);

      expect(mockInputs.resetInputs).toHaveBeenCalled();
      expect(mockCalculation.clearResults).toHaveBeenCalled();
      expect(mockResultsState.clearAllResults).toHaveBeenCalled();
      expect(mockToast.showToast).toHaveBeenCalledWith('info', 'Calculator reset');
    });
  });

  // ==================== QUOTE LOADING TESTS ====================

  describe('Quote Loading', () => {
    it('should load quote on mount when initialQuote provided', async () => {
      const mockQuote = {
        id: 123,
        reference_number: 'BTL-2024-001',
        property_value: 300000
      };

      getQuote.mockResolvedValue(mockQuote);

      render(
        <MemoryRouter>
          <BTLCalculator initialQuote={mockQuote} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getQuote).toHaveBeenCalledWith(expect.anything(), 123);
        expect(mockInputs.loadFromQuote).toHaveBeenCalledWith(mockQuote);
        expect(mockResultsState.loadResultsFromQuote).toHaveBeenCalledWith(mockQuote);
      });
    });

    it('should display quote reference after loading', async () => {
      const mockQuote = {
        id: 123,
        reference_number: 'BTL-2024-001'
      };

      getQuote.mockResolvedValue(mockQuote);

      render(
        <MemoryRouter>
          <BTLCalculator initialQuote={mockQuote} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Ref: BTL-2024-001')).toBeInTheDocument();
      });
    });

    it('should handle quote loading errors', async () => {
      const mockQuote = { id: 123 };
      getQuote.mockResolvedValue(null);

      render(
        <MemoryRouter>
          <BTLCalculator initialQuote={mockQuote} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith('error', 'Quote not found');
      });
    });
  });

  // ==================== QUOTE SAVING TESTS ====================

  describe('Quote Saving', () => {
    it('should save quote when save button clicked', async () => {
      const savedQuote = {
        id: 456,
        reference_number: 'BTL-2024-002'
      };

      upsertQuoteData.mockResolvedValue(savedQuote);

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const saveBtn = screen.getByTestId('save-quote-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(upsertQuoteData).toHaveBeenCalled();
        expect(mockToast.showToast).toHaveBeenCalledWith('success', 'Quote saved successfully');
      });
    });

    it('should handle quote saving errors', async () => {
      // Mock the rejection
      upsertQuoteData.mockRejectedValueOnce(new Error('Save failed'));

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const saveBtn = screen.getByTestId('save-quote-btn');
      
      // Click and suppress unhandled rejection
      fireEvent.click(saveBtn);

      // Wait for error toast to appear
      await waitFor(
        () => {
          expect(mockToast.showToast).toHaveBeenCalledWith('error', 'Failed to save quote');
        },
        { timeout: 3000 }
      );
    });
  });

  // ==================== READ-ONLY MODE TESTS ====================

  describe('Read-Only Mode', () => {
    it('should disable action buttons when read-only', () => {
      useAuth.mockReturnValue({
        canEditCalculators: vi.fn(() => false),
        token: null
      });

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText('Calculate')).toBeDisabled();
      expect(screen.getByText('Clear Results')).toBeDisabled();
      expect(screen.getByText('Reset All')).toBeDisabled();
      expect(screen.getByTestId('save-quote-btn')).toBeDisabled();
    });

    it('should allow actions when not read-only', () => {
      // Ensure mock has loading=false for this test
      useBTLRates.mockReturnValue({
        ...mockRates,
        loading: false
      });
      
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText('Calculate')).not.toBeDisabled();
      expect(screen.getByText('Clear Results')).not.toBeDisabled();
      expect(screen.getByText('Reset All')).not.toBeDisabled();
    });
  });

  // ==================== INPUT INTERACTION TESTS ====================

  describe('Input Interactions', () => {
    it('should update property value input', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const input = screen.getByTestId('property-value-input');
      fireEvent.change(input, { target: { value: '300000' } });

      expect(mockInputs.updateInput).toHaveBeenCalledWith('propertyValue', '300000');
    });

    it('should update product scope', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const select = screen.getByTestId('product-scope-select');
      fireEvent.change(select, { target: { value: 'Select Panel' } });

      expect(mockInputs.updateInput).toHaveBeenCalledWith('productScope', 'Select Panel');
    });

    it('should update selected range', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      const coreBtn = screen.getByText('Core');
      fireEvent.click(coreBtn);

      expect(mockInputs.updateInput).toHaveBeenCalledWith('selectedRange', 'Core');
    });
  });

  // ==================== LOADING STATE TESTS ====================

  describe('Loading States', () => {
    it('should show loading state when rates are loading', () => {
      // Create a fresh mock with loading=true for this test
      useBTLRates.mockReturnValue({
        ...mockRates,
        loading: true
      });

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should enable calculate button when not loading', () => {
      // Ensure mock has loading=false for this test
      useBTLRates.mockReturnValue({
        ...mockRates,
        loading: false
      });

      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(screen.getByText('Calculate')).not.toBeDisabled();
    });
  });

  // ==================== INITIALIZATION TESTS ====================

  describe('Initialization', () => {
    it('should fetch criteria on mount', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(mockRates.fetchCriteria).toHaveBeenCalled();
    });

    it('should initialize all hooks', () => {
      render(
        <MemoryRouter>
          <BTLCalculator />
        </MemoryRouter>
      );

      expect(useBTLInputs).toHaveBeenCalled();
      expect(useBTLCalculation).toHaveBeenCalled();
      expect(useBTLRates).toHaveBeenCalled();
      expect(useBTLResultsState).toHaveBeenCalled();
      expect(useBrokerSettings).toHaveBeenCalled();
    });
  });
});
