/**
 * Generate DIP PDF using React PDF (client-side)
 * 
 * This utility fetches quote data from the database and generates
 * a DIP PDF using @react-pdf/renderer on the client side.
 */
import { pdf } from '@react-pdf/renderer';
import { getQuote } from './quotes';
import BTLDIPPDF from '../components/pdf/BTLDIPPDF';
import DIPPDF from '../components/pdf/DIPPDF';
import React from 'react';

/**
 * Fetch quote data with results from the database
 */
async function fetchQuoteData(quoteId) {
  const response = await getQuote(quoteId, true);
  
  if (!response || !response.quote) {
    throw new Error('Quote not found');
  }
  
  // Results are nested inside quote.results (backend puts them there)
  const results = response.quote.results || [];
  
  return {
    quote: response.quote,
    results: results
  };
}

/**
 * Get the selected result based on fee_type_selection
 * Prefers results with rolled_months/deferred values if duplicates exist
 */
function getSelectedResult(quote, results) {
  if (!results || results.length === 0) {
    return {};
  }
  
  const feeSelection = quote.fee_type_selection;
  
  if (!feeSelection) {
    // No selection - return the latest result (last in array, as they're ordered by created_at ascending)
    return results[results.length - 1];
  }
  
  // For BTL: match by fee_column
  if (quote.calculator_type === 'BTL') {
    // Find all matching results
    const matchingResults = results.filter(r => {
      const feeCol = String(r.fee_column || '');
      return feeSelection.includes(feeCol) || feeSelection.includes(`${feeCol}%`);
    });
    
    if (matchingResults.length === 0) {
      // No match - return last result
      return results[results.length - 1];
    }
    
    if (matchingResults.length === 1) {
      return matchingResults[0];
    }
    
    // Multiple matches - prefer the one with rolled_months > 0 or deferred_interest_percent > 0
    // This handles the case where old results (with 0 values) exist alongside new results
    const withValues = matchingResults.find(r => 
      (r.rolled_months && r.rolled_months > 0) || 
      (r.deferred_interest_percent && r.deferred_interest_percent > 0)
    );
    
    // Return the one with values, or the last matching result (most recent)
    const selected = withValues || matchingResults[matchingResults.length - 1];
    return selected;
  }
  
  // For Bridging: match by product_name
  const matchingResults = results.filter(r => {
    const productName = (r.product_name || '').toLowerCase();
    const selected = feeSelection.toLowerCase();
    return productName.includes(selected) || selected.includes(productName);
  });
  
  if (matchingResults.length === 0) {
    return results[results.length - 1];
  }
  
  // Return last matching (most recent)
  return matchingResults[matchingResults.length - 1];
}

/**
 * Prepare quote data for PDF component
 * Combines quote fields with selected result fields
 */
function prepareQuoteForPDF(quote, selectedResult) {
  // Merge selected result data into quote for the PDF component
  return {
    ...quote,
    // Override with selected result values if they exist
    gross_loan: selectedResult.gross_loan ?? quote.gross_loan,
    net_loan: selectedResult.net_loan ?? quote.net_loan,
    ltv_percentage: selectedResult.ltv_percentage ?? quote.target_ltv,
    initial_rate: selectedResult.initial_rate ?? selectedResult.pay_rate,
    pay_rate: selectedResult.pay_rate,
    actual_rate: selectedResult.pay_rate ?? selectedResult.initial_rate, // Use pay_rate as the annual rate
    revert_rate: selectedResult.revert_rate,
    aprc: selectedResult.aprc,
    monthly_interest_cost: selectedResult.monthly_interest_cost,
    product_fee_percent: selectedResult.product_fee_percent,
    product_fee_pounds: selectedResult.product_fee_pounds,
    admin_fee: selectedResult.admin_fee,
    exit_fee: selectedResult.exit_fee,
    broker_client_fee: selectedResult.broker_client_fee,
    broker_commission_proc_fee_percent: selectedResult.broker_commission_proc_fee_percent,
    broker_commission_proc_fee_pounds: selectedResult.broker_commission_proc_fee_pounds,
    proc_fee_value: selectedResult.proc_fee_value ?? selectedResult.broker_commission_proc_fee_pounds,
    rolled_months: selectedResult.rolled_months ?? quote.rolled_months,
    rolled_months_interest: selectedResult.rolled_months_interest ?? quote.rolled_months_interest,
    rolled_interest_amount: selectedResult.rolled_months_interest ?? selectedResult.rolled_interest_amount ?? quote.rolled_interest_amount,
    deferred_rate: selectedResult.deferred_rate ?? selectedResult.deferred_interest_percent ?? selectedResult.deferred_cap_pct ?? quote.deferred_rate,
    deferred_interest_percent: selectedResult.deferred_interest_percent ?? quote.deferred_interest_percent,
    deferred_interest_pounds: selectedResult.deferred_interest_pounds ?? quote.deferred_interest_pounds,
    deferred_interest_amount: selectedResult.deferred_interest_pounds ?? selectedResult.deferred_interest_amount ?? quote.deferred_interest_amount,
    direct_debit: selectedResult.direct_debit ?? quote.direct_debit,
    icr: selectedResult.icr ?? quote.icr,
    title_insurance_cost: selectedResult.title_insurance_cost ?? quote.title_insurance_cost,
    // ERC fields
    erc: selectedResult.erc ?? quote.erc,
    erc_1: selectedResult.erc_1 ?? quote.erc_1,
    erc_2: selectedResult.erc_2 ?? quote.erc_2,
    erc_3: selectedResult.erc_3 ?? quote.erc_3,
    erc_4: selectedResult.erc_4 ?? quote.erc_4,
    erc_5: selectedResult.erc_5 ?? quote.erc_5,
    erc_text: selectedResult.erc_text ?? selectedResult.ercText ?? quote.erc_text,
    ercText: selectedResult.ercText ?? selectedResult.erc_text ?? quote.ercText,
    // Keep result reference for any additional data
    _selectedResult: selectedResult
  };
}

/**
 * Get broker settings from quote data and localStorage
 * Priority: quote data > localStorage
 */
function getBrokerSettings(quote) {
  // First try to get from quote data (saved when quote was created)
  const fromQuote = {
    clientType: quote.client_type,
    brokerRoute: quote.broker_route,
    brokerCompanyName: quote.broker_company_name,
    brokerCommissionPercent: quote.broker_commission_percent,
    addFeesToggle: quote.add_fees_toggle,
    additionalFeeAmount: quote.additional_fee_amount,
    feeCalculationType: quote.fee_calculation_type
  };
  
  // Also try localStorage for any additional settings
  let fromStorage = {};
  try {
    const stored = localStorage.getItem('app.constants.override.v1');
    if (stored) {
      const data = JSON.parse(stored);
      fromStorage = data.broker_settings || {};
    }
  } catch (e) {
    console.warn('Could not load broker settings:', e);
  }
  
  // Merge with quote data taking priority
  return {
    ...fromStorage,
    ...fromQuote
  };
}

/**
 * Generate DIP PDF for BTL quotes using React PDF
 * 
 * @param {string} quoteId - The quote ID
 * @returns {Promise<Blob>} - The PDF blob
 */
export async function generateBTLDIPPDF(quoteId) {
  // Fetch quote data from database
  const { quote, results } = await fetchQuoteData(quoteId);
  
  // Get the selected result based on fee type selection
  const selectedResult = getSelectedResult(quote, results);
  
  // Prepare quote data for the PDF component
  const preparedQuote = prepareQuoteForPDF(quote, selectedResult);
  
  // Get broker settings from quote and localStorage
  const brokerSettings = getBrokerSettings(quote);
  
  // Prepare DIP-specific data from the quote
  const dipData = {
    dip_date: quote.dip_date,
    dip_expiry_date: quote.dip_expiry_date,
    commercial_or_main_residence: quote.commercial_or_main_residence,
    applicant_type: quote.applicant_type,
    guarantor_name: quote.guarantor_name,
    company_number: quote.company_number,
    title_number: quote.title_number,
    lender_legal_fee: quote.lender_legal_fee,
    number_of_applicants: quote.number_of_applicants || 1,
    overpayments_percent: quote.overpayments_percent || 10,
    fee_type_selection: quote.fee_type_selection,
    funding_line: quote.funding_line,
    security_properties: quote.security_properties || [],
    shareholders: quote.shareholders || [],
    title_insurance: quote.title_insurance || 'No', // Title Insurance dropdown selection
    product_range: quote.product_range || 'specialist' // Core or Specialist for full term
  };
  
  // Create the PDF document
  const pdfDocument = React.createElement(BTLDIPPDF, {
    quote: preparedQuote,
    dipData: dipData,
    brokerSettings: brokerSettings
  });
  
  // Generate PDF blob
  const blob = await pdf(pdfDocument).toBlob();
  
  return blob;
}

/**
 * Generate DIP PDF for Bridging quotes using React PDF
 * 
 * @param {string} quoteId - The quote ID
 * @returns {Promise<Blob>} - The PDF blob
 */
export async function generateBridgingDIPPDF(quoteId) {
  // Fetch quote data from database
  const { quote, results } = await fetchQuoteData(quoteId);
  
  // Get the selected result
  const selectedResult = getSelectedResult(quote, results);
  
  // Prepare quote data
  const preparedQuote = prepareQuoteForPDF(quote, selectedResult);
  
  // Get broker settings from quote and localStorage
  const brokerSettings = getBrokerSettings(quote);
  
  // Create dipData object with DIP-specific fields (same as BTL)
  const dipData = {
    dip_date: quote.dip_date || new Date().toISOString(),
    dip_expiry_date: quote.dip_expiry_date,
    dip_version: quote.dip_version || 1,
    borrower_name: quote.borrower_name || quote.applicant_name,
    borrower_surname: quote.borrower_surname,
    applicant_name_2: quote.applicant_name_2,
    applicant_surname_2: quote.applicant_surname_2,
    applicant_name_3: quote.applicant_name_3,
    applicant_surname_3: quote.applicant_surname_3,
    applicant_name_4: quote.applicant_name_4,
    applicant_surname_4: quote.applicant_surname_4,
    security_address: quote.security_address || quote.property_address,
    property_type: quote.property_type || 'Residential',
    commercial_or_main_residence: quote.commercial_or_main_residence,
    applicant_type: quote.applicant_type,
    guarantor_name: quote.guarantor_name,
    company_number: quote.company_number,
    title_number: quote.title_number,
    lender_legal_fee: quote.lender_legal_fee,
    number_of_applicants: quote.number_of_applicants || 1,
    overpayments_percent: quote.overpayments_percent || 10,
    fee_type_selection: quote.fee_type_selection,
    funding_line: quote.funding_line,
    security_properties: quote.security_properties || [],
    shareholders: quote.shareholders || [],
    title_insurance: quote.title_insurance || 'No', // Title Insurance dropdown selection
    product_range: quote.product_range || 'specialist', // Core or Specialist for full term
    admin_fee: quote.admin_fee,
    valuation_fee: quote.valuation_fee,
    exit_fee: quote.exit_fee
  };
  
  // Use the generic DIPPDF for bridging (routes to BridgingDIPPDF)
  const pdfDocument = React.createElement(DIPPDF, {
    quote: preparedQuote,
    dipData: dipData,
    brokerSettings: brokerSettings
  });
  
  // Generate PDF blob
  const blob = await pdf(pdfDocument).toBlob();
  
  return blob;
}

/**
 * Generate DIP PDF based on calculator type
 * 
 * @param {string} quoteId - The quote ID
 * @param {string} calculatorType - 'BTL' or 'BRIDGING'
 * @returns {Promise<Blob>} - The PDF blob
 */
export async function generateDIPPDF(quoteId, calculatorType) {
  if (calculatorType === 'BTL' || calculatorType?.toLowerCase() === 'btl') {
    return generateBTLDIPPDF(quoteId);
  }
  return generateBridgingDIPPDF(quoteId);
}

/**
 * Download DIP PDF
 * 
 * @param {string} quoteId - The quote ID
 * @param {string} calculatorType - 'BTL' or 'BRIDGING'
 * @param {string} referenceNumber - Optional reference number for filename
 */
export async function downloadDIPPDF(quoteId, calculatorType, referenceNumber) {
  const blob = await generateDIPPDF(quoteId, calculatorType);
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DIP_${referenceNumber || quoteId}.pdf`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  
  return blob;
}

export default {
  generateDIPPDF,
  generateBTLDIPPDF,
  generateBridgingDIPPDF,
  downloadDIPPDF
};
