/**
 * Generate Quote PDF using React PDF (client-side)
 * 
 * This utility fetches quote data from the database and generates
 * a Quote PDF using @react-pdf/renderer on the client side.
 */
import { pdf } from '@react-pdf/renderer';
import { getQuote } from './quotes';
import BTLQuotePDF from '../components/pdf/BTLQuotePDF';
import BridgingQuotePDF from '../components/pdf/BridgingQuotePDF';
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
  
  // Defensive normalization: map DB fields to names expected by PDF helpers
  const normalizeNum = (v) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[,£%\s]/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const normalizeResults = results.map(r => {
    const fee_column = (r.fee_column ?? r.product_fee ?? '').toString().replace(/%/g, '').trim();
    const product_fee_amount = normalizeNum(r.product_fee_amount);
    const rolled_interest_amount = normalizeNum(r.rolled_interest_amount ?? r.rolled_months_interest);
    const deferred_interest_amount = normalizeNum(r.deferred_interest_amount ?? r.deferred_interest_pounds);
    const admin_fee = normalizeNum(r.admin_fee);
    const broker_client_fee = normalizeNum(r.broker_client_fee);
    const broker_commission_fee = normalizeNum(r.broker_commission_fee ?? r.broker_commission ?? r.proc_fee);
    const title_insurance_cost = normalizeNum(r.title_insurance_cost);
    const monthly_interest_cost = normalizeNum(r.monthly_interest_cost ?? r.monthly_payment ?? r.monthly_dd);
    const serviced_months = normalizeNum(r.serviced_months);

    // Compute total_costs if absent
    const computed_total_costs = [product_fee_amount, rolled_interest_amount, deferred_interest_amount, admin_fee, broker_client_fee, title_insurance_cost]
      .filter(v => v !== null)
      .reduce((a, b) => a + b, 0);

    return {
      ...r,
      // Align core fields used by helpers
      initial_rate: r.initial_rate ?? r.rate ?? null,
      pay_rate: r.pay_rate ?? r.initial_rate ?? r.rate ?? null,
      revert_rate_type: r.revert_rate_type ?? r.revert_rate ?? 'MVR',
      initial_term: r.initial_term ?? null, // expected in months
      full_term: r.full_term ?? null, // months (if present)
      rolled_months: r.rolled_months ?? null,
      rolled_months_interest: r.rolled_months_interest ?? r.rolled_interest_amount ?? null,
      deferred_interest_percent: r.deferred_interest_percent ?? r.deferred_rate ?? null,
      deferred_interest_pounds: r.deferred_interest_pounds ?? r.deferred_interest_amount ?? null,
      deferred_cost: r.deferred_cost ?? null,
      gross_loan: r.gross_loan ?? null,
      net_loan: r.net_loan ?? null,
      ltv_percentage: r.ltv_percentage ?? r.ltv ?? null,
      icr: r.icr ?? null,
      aprc: r.aprc ?? null,
      product_fee_percent: r.product_fee_percent ?? null,
      product_fee_pounds: r.product_fee_pounds ?? r.product_fee_amount ?? product_fee_amount ?? null,
      monthly_dd: monthly_interest_cost ?? null,
      total_costs: r.total_costs ?? computed_total_costs ?? null,
      broker_client_fee: broker_client_fee ?? null,
      broker_commission_fee: broker_commission_fee ?? null,
      serviced_months: serviced_months ?? null,
      fee_column,
    };
  });

  return {
    quote: response.quote,
    results: normalizeResults
  };
}

/**
 * Generate BTL Quote PDF and return blob
 */
export async function generateBTLQuotePDF(quoteId) {
  try {
    // Fetch quote with results
    const { quote, results } = await fetchQuoteData(quoteId);
    
    // Attach normalized results to quote
    quote.results = results;
    
    // Get broker settings from localStorage
    let brokerSettings = {};
    try {
      const stored = localStorage.getItem('brokerSettings');
      if (stored) {
        brokerSettings = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading broker settings:', e);
    }
    
    // Get client details from localStorage (same as broker settings)
    const clientDetails = {
      clientFirstName: brokerSettings.clientFirstName,
      clientLastName: brokerSettings.clientLastName,
      brokerCompanyName: brokerSettings.brokerCompanyName,
      clientEmail: brokerSettings.clientEmail,
      clientContact: brokerSettings.clientContact,
      clientType: brokerSettings.clientType,
    };
    
    // Create React element
    const element = React.createElement(BTLQuotePDF, {
      quote,
      brokerSettings,
      clientDetails,
    });
    
    // Generate PDF blob
    const blob = await pdf(element).toBlob();
    
    return blob;
  } catch (error) {
    console.error('Error generating BTL Quote PDF:', error);
    throw error;
  }
}

/**
 * Generate Bridging Quote PDF and return blob
 */
export async function generateBridgingQuotePDF(quoteId) {
  try {
    // Fetch quote with results
    const { quote, results } = await fetchQuoteData(quoteId);
    
    // Attach normalized results to quote
    quote.results = results;
    
    // Get broker settings from localStorage
    let brokerSettings = {};
    try {
      const stored = localStorage.getItem('brokerSettings');
      if (stored) {
        brokerSettings = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading broker settings:', e);
    }
    
    // Get client details from localStorage
    const clientDetails = {
      clientFirstName: brokerSettings.clientFirstName,
      clientLastName: brokerSettings.clientLastName,
      brokerCompanyName: brokerSettings.brokerCompanyName,
      clientEmail: brokerSettings.clientEmail,
      clientContact: brokerSettings.clientContact,
      clientType: brokerSettings.clientType,
    };
    
    // Create React element
    const element = React.createElement(BridgingQuotePDF, {
      quote,
      brokerSettings,
      clientDetails,
    });
    
    // Generate PDF blob
    const blob = await pdf(element).toBlob();
    
    return blob;
  } catch (error) {
    console.error('Error generating Bridging Quote PDF:', error);
    throw error;
  }
}

/**
 * Generate Quote PDF based on calculator type
 */
export async function generateQuotePDF(quoteId, calculatorType) {
  const calcType = (calculatorType || '').toUpperCase();
  
  if (calcType === 'BTL') {
    return generateBTLQuotePDF(quoteId);
  }
  
  if (calcType === 'BRIDGING' || calcType === 'BRIDGE') {
    return generateBridgingQuotePDF(quoteId);
  }
  
  throw new Error(`Quote PDF generation not supported for ${calculatorType}`);
}

/**
 * Download Quote PDF - generates and triggers download
 */
export async function downloadQuotePDF(quoteId, calculatorType, referenceNumber) {
  try {
    const blob = await generateQuotePDF(quoteId, calculatorType);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote_${referenceNumber || quoteId}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading Quote PDF:', error);
    throw error;
  }
}

export default {
  generateBTLQuotePDF,
  generateBridgingQuotePDF,
  generateQuotePDF,
  downloadQuotePDF,
};
