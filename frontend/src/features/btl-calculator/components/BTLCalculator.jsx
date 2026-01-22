/**
 * BTL Calculator - Main Orchestrator Component
 * 
 * This component wires together all BTL calculator sub-components and hooks.
 * It replaces the monolithic 2,046-line BTL_Calculator.jsx with a modular structure.
 * 
 * Architecture:
 * - Hooks manage state and business logic
 * - Components handle UI rendering
 * - This orchestrator coordinates everything
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

// Custom hooks
import { useBTLInputs } from '../hooks/useBTLInputs';
import { useBTLCalculation } from '../hooks/useBTLCalculation';
import { useBTLRates } from '../hooks/useBTLRates';
import { useBTLResultsState } from '../hooks/useBTLResultsState';
import useBrokerSettings from '../../../hooks/calculator/useBrokerSettings';
import { useResultsVisibility } from '../../../hooks/useResultsVisibility';
import { useResultsRowOrder } from '../../../hooks/useResultsRowOrder';

// Components
import BTLInputForm from '../components/BTLInputForm';
import BTLProductSelector from '../components/BTLProductSelector';
import BTLRangeToggle from '../components/BTLRangeToggle';
import BTLAdditionalFees from '../components/BTLAdditionalFees';
import BTLLoanDetailsSection from '../../../components/calculator/btl/BTLLoanDetailsSection';
import BTLCriteriaSection from '../../../components/calculator/btl/BTLCriteriaSection';
import BTLSliderControls from '../components/BTLSliderControls';
import BTLResultsSummary from '../components/BTLResultsSummary';
import ClientDetailsSection from '../../../components/calculator/shared/ClientDetailsSection';
import SaveQuoteButton from '../../../components/SaveQuoteButton';
import CollapsibleSection from '../../../components/calculator/CollapsibleSection';
import WelcomeHeader from '../../../components/shared/WelcomeHeader';

// Utilities
import { getQuote, upsertQuoteData } from '../../../utils/quotes';

// Styles
import '../../../styles/slds.css';
import '../../../styles/Calculator.scss';

export default function BTLCalculator({ initialQuote = null }) {
  const { supabase } = useSupabase();
  const { canEditCalculators, token } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  
  // Get initial quote from props or navigation state
  const navQuote = location?.state?.loadQuote || null;
  const effectiveInitialQuote = initialQuote || navQuote;
  
  // Check permissions
  const isReadOnly = !canEditCalculators();
  
  // Initialize hooks
  const inputs = useBTLInputs();
  const calculation = useBTLCalculation(inputs);
  const rates = useBTLRates();
  const resultsState = useBTLResultsState();
  const brokerSettings = useBrokerSettings(effectiveInitialQuote);
  const { isRowVisible } = useResultsVisibility('btl');
  const { getOrderedRows } = useResultsRowOrder('btl');
  
  // Collapsible section states
  const [criteriaExpanded, setCriteriaExpanded] = React.useState(false);
  const [loanDetailsExpanded, setLoanDetailsExpanded] = React.useState(false);
  const [clientDetailsExpanded, setClientDetailsExpanded] = React.useState(true);
  const [resultsExpanded, setResultsExpanded] = React.useState(true);

  // Quote tracking
  const [currentQuoteId, setCurrentQuoteId] = React.useState(effectiveInitialQuote?.id || null);
  const [currentQuoteRef, setCurrentQuoteRef] = React.useState(effectiveInitialQuote?.reference_number || null);

  // Load initial data
  useEffect(() => {
    rates.fetchCriteria();
  }, []);

  // Load quote if provided
  useEffect(() => {
    if (effectiveInitialQuote) {
      loadQuote(effectiveInitialQuote.id);
    }
  }, [effectiveInitialQuote?.id]);

  /**
   * Load a quote from database
   */
  const loadQuote = async (quoteId) => {
    try {
      const quote = await getQuote(supabase, quoteId);
      if (!quote) {
        showToast('error', 'Quote not found');
        return;
      }

      // Load inputs
      inputs.loadFromQuote(quote);
      
      // Load results state with selected range for backward compatibility
      // This ensures old quote overrides (without range prefix) are migrated correctly
      resultsState.loadResultsFromQuote(quote, inputs.selectedRange);
      
      // Update quote tracking
      setCurrentQuoteId(quote.id);
      setCurrentQuoteRef(quote.reference_number);
      
      showToast('success', 'Quote loaded successfully');
    } catch (error) {
      console.error('Error loading quote:', error);
      showToast('error', 'Failed to load quote');
    }
  };

  /**
   * Calculate results
   */
  const handleCalculate = async () => {
    try {
      // Validate inputs
      const validationError = calculation.validateInputs(inputs);
      if (validationError) {
        showToast('error', validationError);
        return;
      }

      // Fetch rates
      await rates.fetchRates(inputs);
      
      // Run calculation
      const results = calculation.calculate(inputs, rates.relevantRates, brokerSettings);
      
      if (results && results.length > 0) {
        showToast('success', `Found ${results.length} matching products`);
      } else {
        showToast('warning', 'No products match your criteria');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      showToast('error', 'Calculation failed');
    }
  };

  /**
   * Clear results
   */
  const handleClearResults = () => {
    calculation.clearResults();
    resultsState.clearAllResults();
    showToast('info', 'Results cleared');
  };

  /**
   * Save quote
   */
  const handleSaveQuote = async (additionalData = {}) => {
    try {
      const quoteData = {
        loan_type: 'BTL',
        ...inputs.getInputsForSave(),
        ...resultsState.getResultsForSave(),
        ...additionalData
      };

      const savedQuote = await upsertQuoteData(
        supabase,
        token,
        currentQuoteId,
        quoteData
      );

      setCurrentQuoteId(savedQuote.id);
      setCurrentQuoteRef(savedQuote.reference_number);
      
      showToast('success', 'Quote saved successfully');
      return savedQuote;
    } catch (error) {
      console.error('Error saving quote:', error);
      showToast('error', 'Failed to save quote');
      throw error;
    }
  };

  /**
   * Reset calculator
   */
  const handleReset = () => {
    inputs.resetInputs();
    calculation.clearResults();
    resultsState.clearAllResults();
    setCurrentQuoteId(null);
    setCurrentQuoteRef(null);
    showToast('info', 'Calculator reset');
  };

  return (
    <div className="btl-calculator">
      {/* Header */}
      <div className="slds-page-header">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-media">
              <div className="slds-media__body">
                <div className="slds-page-header__name">
                  <div className="slds-page-header__name-title">
                    <WelcomeHeader quoteReference={currentQuoteRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls">
              <div className="slds-page-header__control">
                <SaveQuoteButton
                  onSave={handleSaveQuote}
                  quoteId={currentQuoteId}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="slds-grid slds-gutters slds-wrap">
        {/* Left Column - Inputs */}
        <div className="slds-col slds-size_1-of-1 slds-large-size_1-of-2">
          {/* Basic Inputs */}
          <div className="slds-card input-card">
            <div className="slds-card__header slds-grid">
              <header className="slds-media slds-media_center slds-has-flexi-truncate">
                <div className="slds-media__body">
                  <h2 className="slds-card__header-title">
                    <span className="slds-text-heading_small">Property & Product Details</span>
                  </h2>
                </div>
              </header>
            </div>
            <div className="slds-card__body slds-card__body_inner">
              <BTLInputForm
                inputs={inputs}
                onInputChange={inputs.updateInput}
                isReadOnly={isReadOnly}
              />
              
              <BTLProductSelector
                inputs={inputs}
                onInputChange={inputs.updateInput}
                onTierChange={inputs.updateTier}
                isReadOnly={isReadOnly}
              />
              
              <BTLRangeToggle
                selectedRange={inputs.selectedRange}
                onChange={(value) => inputs.updateInput('selectedRange', value)}
                isReadOnly={isReadOnly}
              />
              
              <BTLAdditionalFees
                inputs={inputs}
                onInputChange={inputs.updateInput}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Criteria Section */}
          <CollapsibleSection
            title="Criteria"
            expanded={criteriaExpanded}
            onToggle={() => setCriteriaExpanded(!criteriaExpanded)}
          >
            <BTLCriteriaSection
              questions={rates.questions}
              answers={inputs.answers}
              onAnswerChange={(qId, answer) => inputs.updateAnswer(qId, answer)}
              disabled={isReadOnly}
            />
          </CollapsibleSection>

          {/* Loan Details Section */}
          <CollapsibleSection
            title="Loan Details"
            expanded={loanDetailsExpanded}
            onToggle={() => setLoanDetailsExpanded(!loanDetailsExpanded)}
          >
            <BTLLoanDetailsSection
              inputs={inputs}
              onInputChange={inputs.updateInput}
              disabled={isReadOnly}
            />
          </CollapsibleSection>

          {/* Client Details Section */}
          <CollapsibleSection
            title="Client Details"
            expanded={clientDetailsExpanded}
            onToggle={() => setClientDetailsExpanded(!clientDetailsExpanded)}
          >
            <ClientDetailsSection
              clientDetails={inputs.clientDetails}
              onClientDetailsChange={inputs.updateClientDetails}
              disabled={isReadOnly}
            />
          </CollapsibleSection>
        </div>

        {/* Right Column - Results */}
        <div className="slds-col slds-size_1-of-1 slds-large-size_1-of-2">
          {/* Action Buttons */}
          <div className="slds-card action-card">
            <div className="slds-card__body slds-card__body_inner">
              <div className="slds-button-group" role="group">
                <button
                  type="button"
                  className="slds-button slds-button_brand"
                  onClick={handleCalculate}
                  disabled={isReadOnly || rates.loading}
                >
                  {rates.loading ? 'Loading...' : 'Calculate'}
                </button>
                <button
                  type="button"
                  className="slds-button slds-button_neutral"
                  onClick={handleClearResults}
                  disabled={isReadOnly}
                >
                  Clear Results
                </button>
                <button
                  type="button"
                  className="slds-button slds-button_neutral"
                  onClick={handleReset}
                  disabled={isReadOnly}
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <CollapsibleSection
            title="Results"
            expanded={resultsExpanded}
            onToggle={() => setResultsExpanded(!resultsExpanded)}
          >
            {calculation.results && calculation.results.length > 0 ? (
              <BTLResultsSummary
                results={calculation.results}
                columnsHeaders={calculation.columnsHeaders || []}
                onAddAsDIP={() => {}}
                onDeleteColumn={() => {}}
                isReadOnly={isReadOnly}
              />
            ) : (
              <div className="empty-results">
                <p className="slds-text-body_regular slds-text-color_weak">
                  Enter property details and click Calculate to see results
                </p>
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
