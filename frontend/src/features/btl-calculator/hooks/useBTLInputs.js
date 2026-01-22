/**
 * useBTLInputs Hook
 * 
 * Manages all input state for the BTL Calculator including:
 * - Property and loan details (property value, rent, loan type)
 * - Product selection (scope, range, tier)
 * - Additional fees
 * - Criteria answers
 * - Client details
 * - Quote loading/saving
 */

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing BTL calculator inputs
 * @returns {Object} Input state and update functions
 */
export function useBTLInputs() {
  // Basic property inputs
  const [propertyValue, setPropertyValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [loanType, setLoanType] = useState('');
  const [specificLoanAmount, setSpecificLoanAmount] = useState('');
  
  // Product selection
  const [productScope, setProductScope] = useState('');
  const [selectedRange, setSelectedRange] = useState('specialist');
  const [tier, setTier] = useState(null);
  const [maxLtvInput, setMaxLtvInput] = useState(75);
  
  // Additional fees
  const [addFeesToggle, setAddFeesToggle] = useState(false);
  const [feeCalculationType, setFeeCalculationType] = useState('');
  const [additionalFeeAmount, setAdditionalFeeAmount] = useState('');
  
  // Loan details
  const [loanTerm, setLoanTerm] = useState('');
  const [interestPaymentType, setInterestPaymentType] = useState('');
  const [retentionChoice, setRetentionChoice] = useState('no');
  
  // Criteria answers
  const [answers, setAnswers] = useState({});
  
  // Client details
  const [clientDetails, setClientDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  /**
   * Update a single input value
   * @param {string} field - Field name to update
   * @param {*} value - New value
   */
  const updateInput = useCallback((field, value) => {
    switch (field) {
      case 'propertyValue':
        setPropertyValue(value);
        break;
      case 'monthlyRent':
        setMonthlyRent(value);
        break;
      case 'loanType':
        setLoanType(value);
        break;
      case 'specificLoanAmount':
        setSpecificLoanAmount(value);
        break;
      case 'productScope':
        setProductScope(value);
        break;
      case 'selectedRange':
        setSelectedRange(value);
        break;
      case 'tier':
        setTier(value);
        break;
      case 'maxLtvInput':
        setMaxLtvInput(value);
        break;
      case 'addFeesToggle':
        setAddFeesToggle(value);
        break;
      case 'feeCalculationType':
        setFeeCalculationType(value);
        break;
      case 'additionalFeeAmount':
        setAdditionalFeeAmount(value);
        break;
      case 'loanTerm':
        setLoanTerm(value);
        break;
      case 'interestPaymentType':
        setInterestPaymentType(value);
        break;
      case 'retentionChoice':
        setRetentionChoice(value);
        break;
      default:
        console.warn(`Unknown field: ${field}`);
    }
  }, []);

  /**
   * Update multiple inputs at once
   * @param {Object} updates - Object with field-value pairs
   */
  const updateMultipleInputs = useCallback((updates) => {
    Object.entries(updates).forEach(([field, value]) => {
      updateInput(field, value);
    });
  }, [updateInput]);

  /**
   * Update a criteria answer
   * @param {string} questionId - Question ID
   * @param {string} answer - Answer value
   */
  const updateAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  /**
   * Update tier value
   * @param {number} newTier - New tier value
   */
  const updateTier = useCallback((newTier) => {
    setTier(newTier);
  }, []);

  /**
   * Update a client detail field
   * @param {string} field - Field name
   * @param {string} value - Field value
   */
  const updateClientDetails = useCallback((field, value) => {
    setClientDetails(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Load inputs from a saved quote
   * @param {Object} quote - Quote data from database
   */
  const loadFromQuote = useCallback((quote) => {
    if (!quote) return;

    // Load basic inputs
    if (quote.property_value) setPropertyValue(quote.property_value);
    if (quote.monthly_rent) setMonthlyRent(quote.monthly_rent);
    if (quote.loan_type) setLoanType(quote.loan_type);
    if (quote.specific_loan_amount) setSpecificLoanAmount(quote.specific_loan_amount);
    
    // Load product selection
    if (quote.product_scope) setProductScope(quote.product_scope);
    if (quote.selected_range) setSelectedRange(quote.selected_range);
    if (quote.tier !== undefined) setTier(quote.tier);
    if (quote.max_ltv_input !== undefined) setMaxLtvInput(quote.max_ltv_input);
    
    // Load additional fees
    if (quote.add_fees_toggle !== undefined) setAddFeesToggle(quote.add_fees_toggle);
    if (quote.fee_calculation_type) setFeeCalculationType(quote.fee_calculation_type);
    if (quote.additional_fee_amount) setAdditionalFeeAmount(quote.additional_fee_amount);
    
    // Load loan details
    if (quote.loan_term) setLoanTerm(quote.loan_term);
    if (quote.interest_payment_type) setInterestPaymentType(quote.interest_payment_type);
    if (quote.retention_choice) setRetentionChoice(quote.retention_choice);
    
    // Load criteria answers
    if (quote.criteria_answers) setAnswers(quote.criteria_answers);
    
    // Load client details - support both nested object and flat format
    if (quote.client_details) {
      setClientDetails(prev => ({
        ...prev,
        ...quote.client_details
      }));
    } else {
      // Load from flat format (database columns)
      const clientUpdates = {};
      if (quote.client_first_name) clientUpdates.firstName = quote.client_first_name;
      if (quote.client_last_name) clientUpdates.lastName = quote.client_last_name;
      if (quote.client_email) clientUpdates.email = quote.client_email;
      if (quote.client_phone) clientUpdates.phone = quote.client_phone;
      if (quote.client_address) clientUpdates.address = quote.client_address;
      
      if (Object.keys(clientUpdates).length > 0) {
        setClientDetails(prev => ({
          ...prev,
          ...clientUpdates
        }));
      }
    }
  }, []);

  /**
   * Reset all inputs to default values
   */
  const resetInputs = useCallback(() => {
    setPropertyValue('');
    setMonthlyRent('');
    setLoanType('');
    setSpecificLoanAmount('');
    setProductScope('');
    setSelectedRange('specialist');
    setTier(null);
    setMaxLtvInput(75);
    setAddFeesToggle(false);
    setFeeCalculationType('pound');
    setAdditionalFeeAmount('');
    setLoanTerm('');
    setInterestPaymentType('');
    setRetentionChoice('no');
    setAnswers({});
    setClientDetails({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    });
  }, []);

  /**
   * Get inputs in format for saving to database
   * @returns {Object} Inputs in database-compatible format
   */
  const getInputsForSave = useCallback(() => {
    return {
      property_value: propertyValue,
      monthly_rent: monthlyRent,
      loan_type: loanType,
      specific_loan_amount: specificLoanAmount,
      product_scope: productScope,
      selected_range: selectedRange,
      tier: tier,
      max_ltv_input: maxLtvInput,
      add_fees_toggle: addFeesToggle,
      fee_calculation_type: feeCalculationType,
      additional_fee_amount: additionalFeeAmount,
      loan_term: loanTerm,
      interest_payment_type: interestPaymentType,
      retention_choice: retentionChoice,
      criteria_answers: answers,
      // Map client details to flat database format
      client_first_name: clientDetails.firstName,
      client_last_name: clientDetails.lastName,
      client_email: clientDetails.email,
      client_phone: clientDetails.phone,
      client_address: clientDetails.address
    };
  }, [
    propertyValue,
    monthlyRent,
    loanType,
    specificLoanAmount,
    productScope,
    selectedRange,
    tier,
    maxLtvInput,
    addFeesToggle,
    feeCalculationType,
    additionalFeeAmount,
    loanTerm,
    interestPaymentType,
    retentionChoice,
    answers,
    clientDetails
  ]);

  return {
    // State
    propertyValue,
    monthlyRent,
    loanType,
    specificLoanAmount,
    productScope,
    selectedRange,
    tier,
    maxLtvInput,
    addFeesToggle,
    feeCalculationType,
    additionalFeeAmount,
    loanTerm,
    interestPaymentType,
    retentionChoice,
    answers,
    clientDetails,
    
    // Update functions
    updateInput,
    updateMultipleInputs,
    updateAnswer,
    updateTier,
    updateClientDetails,
    loadFromQuote,
    resetInputs,
    getInputsForSave
  };
}
