/**
 * Helper functions for BTL Quote PDF generation
 * Extracts and formats data from quote and results
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : Number(val);
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (value) => {
  const num = parseNumber(value);
  return `£${Math.round(num).toLocaleString('en-GB')}`;
};

export const formatCurrencyWithPence = (value) => {
  const num = parseNumber(value);
  return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercentage = (value, decimals = 2) => {
  const num = parseNumber(value);
  return `${num.toFixed(decimals)}%`;
};

// ============================================================================
// QUOTE SUMMARY HELPERS
// ============================================================================

export const getQuoteType = (quote) => {
  return quote.product_scope || 'BTL - Residential';
};

export const getRequestedAmount = (quote) => {
  // Check loan_calculation_requested to determine which value to show
  const loanType = quote.loan_calculation_requested;
  
  if (loanType === 'Maximum gross loan') {
    return 'Maximum gross loan';
  } else if (loanType === 'Specific gross loan' && quote.specific_gross_loan) {
    return formatCurrency(quote.specific_gross_loan);
  } else if (loanType === 'Specific net loan' && quote.specific_net_loan) {
    return formatCurrency(quote.specific_net_loan);
  }
  
  return 'Maximum gross loan';
};

export const getPropertyValue = (quote) => {
  return formatCurrency(quote.property_value);
};

export const getMonthlyRent = (quote) => {
  return formatCurrency(quote.monthly_rent);
};

export const getProductType = (quote) => {
  return quote.product_type || 'N/A';
};

export const getTierRange = (quote) => {
  const range = (quote.quote_product_range || quote.selected_range || '').toString().toLowerCase();
  return range === 'core' ? 'Core' : 'Specialist';
};

export const getTierNumber = (quote) => {
  // Extract tier from criteria_answers or product configuration
  const answers = typeof quote.criteria_answers === 'string' 
    ? JSON.parse(quote.criteria_answers) 
    : quote.criteria_answers;
  
  if (answers && answers.tier && answers.tier.label) {
    return answers.tier.label;
  }
  
  // Try to get from tier field directly
  if (quote.tier) {
    return quote.tier;
  }
  
  return 'N/A';
};

export const getRetention = (quote) => {
  if (!quote.retention_choice || quote.retention_choice === 'No') {
    return 'No';
  }
  return quote.retention_choice;
};

export const getVersion = (quote) => {
  // Check for version_number field first
  if (quote.version_number) {
    return `Version ${quote.version_number}`;
  }
  // Default to version 1 or check quote_version field
  if (quote.quote_version) {
    return `Version ${quote.quote_version}`;
  }
  return 'Vers 1';
};

export const getSubmittedBy = (quote) => {
  return quote.submitted_by || quote.created_by || 'N/A';
};

// ============================================================================
// RESULTS TABLE HELPERS
// ============================================================================

/**
 * Get all unique fee ranges from results, sorted descending
 */
export const getFeeRanges = (results) => {
  if (!results || results.length === 0) return [];
  
  const feeSet = new Set();
  results.forEach(r => {
    const feeCol = r.fee_column || r.product_fee;
    if (feeCol !== null && feeCol !== undefined && feeCol !== '') {
      feeSet.add(String(feeCol));
    }
  });
  
  // Sort descending (6%, 4%, 3%, 2%)
  return Array.from(feeSet).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return numB - numA;
  });
};

/**
 * Get result for specific fee range
 */
export const getResultForFeeRange = (results, feeRange) => {
  if (!results || results.length === 0) return null;
  
  const normalize = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).trim();
    return s.replace(/%/g, '');
  };

  const target = normalize(feeRange);

  return results.find(r => {
    const feeCol = normalize(r.fee_column ?? r.product_fee ?? '');
    return feeCol === target;
  }) || null;
};

/**
 * Extract rate values from result
 */
export const getFullRate = (result) => {
  if (!result) return 'N/A';
  const rate = parseNumber(result.initial_rate || result.rate);
  const isTracker = result.product_name && result.product_name.toLowerCase().includes('tracker');
  return isTracker ? `${(rate / 100).toFixed(2)}% + BBR` : `${(rate / 100).toFixed(2)}%`;
};

export const getPayRate = (result) => {
  if (!result) return 'N/A';
  
  const isTracker = result.product_name && result.product_name.toLowerCase().includes('tracker');
  
  // Check if pay_rate is directly available
  if (result.pay_rate !== undefined && result.pay_rate !== null) {
    const payRate = parseNumber(result.pay_rate);
    return isTracker ? `${(payRate / 100).toFixed(2)}% + BBR` : `${(payRate / 100).toFixed(2)}%`;
  }
  
  // For BTL, pay rate equals full rate (no deferred interest concept like Bridging)
  return getFullRate(result);
};

export const getRevertRate = (result) => {
  if (!result) return 'MVR';
  
  // Check if revert_index is MVR
  if (result.revert_index && result.revert_index.toUpperCase() === 'MVR') {
    // Show MVR or MVR + margin if margin > 0
    if (result.revert_margin && parseNumber(result.revert_margin) > 0) {
      return `MVR + ${parseNumber(result.revert_margin).toFixed(2)}%`;
    }
    return 'MVR';
  }
  
  // Show numeric revert rate as percentage
  const revertRate = parseNumber(result.revert_rate);
  return revertRate ? `${revertRate.toFixed(2)}%` : 'MVR';
};

export const getServicePeriod = (result) => {
  if (!result) return 'N/A';
  // Prefer serviced_months when present, else fall back to initial_term
  const serviced = parseNumber(result.serviced_months);
  const term = serviced > 0 ? serviced : parseNumber(result.initial_term);
  if (!term || term === 0) {
    return 'N/A';
  }
  
  // Term is stored in months in the database
  return `${term} months`;
};

export const getDeferredPercent = (result) => {
  if (!result) return 'N/A';
  const percent = parseNumber(
    result.deferred_interest_percent ||
    result.deferred_percent ||
    result.deferred_interest_percentage
  );
  if (percent === null || percent === undefined || isNaN(percent)) return 'N/A';
  return `${percent.toFixed(2)}%`;
};

export const getRolledMonths = (result) => {
  if (!result) return 'N/A';
  const rolled = parseNumber(result.rolled_months);
  if (rolled === null || rolled === undefined || isNaN(rolled)) return 'N/A';
  return `${rolled} months`;
};

export const getServicedMonths = (result) => {
  if (!result) return 'N/A';
  const serviced = parseNumber(result.serviced_months);
  if (serviced === null || serviced === undefined || isNaN(serviced)) return 'N/A';
  return `${serviced} months`;
};

// Loan details
export const getGrossLoan = (result) => {
  if (!result) return 'N/A';
  return formatCurrency(result.gross_loan);
};

export const getNetLoan = (result) => {
  if (!result) return 'N/A';
  return formatCurrency(result.net_loan);
};

export const getLTV = (result) => {
  if (!result) return 'N/A';
  const ltv = parseNumber(result.ltv_percentage || result.ltv);
  return `${Math.round(ltv)} %`;
};

export const getICR = (result) => {
  if (!result) return 'N/A';
  const icr = parseNumber(result.icr);
  return icr > 0 ? `${(icr * 100).toFixed(0)} %` : 'N/A';
};

export const getAPRC = (result) => {
  if (!result) return 'N/A';
  const aprc = parseNumber(result.aprc);
  return aprc ? `${aprc.toFixed(2)} %` : 'N/A';
};

// Costs
export const getDeferredCost = (result) => {
  if (!result) return 'N/A';
  const cost = parseNumber(
    result.deferred_interest_pounds ||
    result.deferred_interest_amount ||
    result.deferred_amount ||
    result.deferred_cost ||
    result.deferred_interest
  );
  if (cost === null || cost === undefined || isNaN(cost)) return 'N/A';
  return formatCurrency(cost);
};

export const getRolledCost = (result) => {
  if (!result) return 'N/A';
  const cost = parseNumber(
    result.rolled_months_interest ||
    result.rolled_interest_amount ||
    result.rolled_cost ||
    result.rolled_interest
  );
  if (cost === null || cost === undefined || isNaN(cost)) return 'N/A';
  return formatCurrency(cost);
};

export const getProductFee = (result) => {
  if (!result) return 'N/A';
  const fee = parseNumber(result.product_fee_pounds || result.product_fee_amount);
  return fee ? formatCurrency(fee) : 'N/A';
};

export const getTotalCosts = (result) => {
  if (!result) return 'N/A';
  let total = parseNumber(result.total_costs);
  if (!total) {
    const deferred = parseNumber(result.deferred_interest_pounds || result.deferred_interest_amount || result.deferred_amount);
    const rolled = parseNumber(result.rolled_months_interest || result.rolled_interest_amount);
    const productFee = parseNumber(result.product_fee_pounds || result.product_fee_amount);
    const admin = parseNumber(result.admin_fee);
    const clientFee = parseNumber(result.broker_client_fee);
    const titleIns = parseNumber(result.title_insurance_cost);
    total = [deferred, rolled, productFee, admin, clientFee, titleIns].filter(v => v && v > 0).reduce((a,b)=>a+b,0);
  }
  return total ? formatCurrency(total) : 'N/A';
};

// Monthly DD and Total cost to borrower
export const getMonthlyDD = (result) => {
  if (!result) return 'N/A';
  const monthly = parseNumber(result.monthly_dd || result.monthly_payment || result.monthly_interest_cost);
  return monthly ? formatCurrencyWithPence(monthly) : 'N/A';
};

export const getTotalCostToBorrower = (result) => {
  if (!result) return 'N/A';
  const totalCost = parseNumber(result.total_cost_to_borrower);
  return formatCurrency(totalCost);
};

// Fees
export const getBrokerCommission = (result, brokerSettings) => {
  if (!result) return 'N/A';
  // Only use broker_commission_proc_fee_pounds field
  const commission = parseNumber(result.broker_commission_proc_fee_pounds);
  // Only show if commission > 0
  return commission > 0 ? formatCurrency(commission) : '£0';
};

export const getBrokerClientFee = (result, brokerSettings) => {
  if (!result) return 'N/A';
  // Use saved broker_client_fee from results
  const clientFee = parseNumber(result.broker_client_fee);
  return formatCurrency(clientFee);
};

// ============================================================================
// CLIENT/BROKER DETAILS
// ============================================================================

export const getClientName = (clientDetails, quote) => {
  // Check clientDetails object first, then quote fields directly
  const firstName = clientDetails?.clientFirstName || clientDetails?.client_first_name || quote?.client_first_name || '';
  const lastName = clientDetails?.clientLastName || clientDetails?.client_last_name || quote?.client_last_name || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
};

export const getClientCompany = (clientDetails, quote) => {
  return clientDetails?.brokerCompanyName || clientDetails?.broker_company_name || quote?.broker_company_name || 'N/A';
};

export const getClientEmail = (clientDetails, quote) => {
  return clientDetails?.clientEmail || clientDetails?.client_email || quote?.client_email || 'N/A';
};

export const getClientTelephone = (clientDetails, quote) => {
  return clientDetails?.clientContact || clientDetails?.client_contact_number || quote?.client_contact_number || 'N/A';
};

export const getClientRoute = (clientDetails, quote) => {
  // Check client type first
  const clientType = clientDetails?.clientType || quote?.client_type;
  if (clientType && clientType.toLowerCase() === 'direct') {
    return 'Direct Client';
  }
  // For brokers, return the broker route
  return clientDetails?.broker_route || quote?.broker_route || clientDetails?.brokerRoute || 'N/A';
};

// ============================================================================
// TERMS SECTION HELPERS
// ============================================================================

export const getTopSlicing = (quote, result) => {
  const topSlicing = parseNumber((result && result.top_slicing) || quote.top_slicing);
  return topSlicing > 0 ? formatCurrency(topSlicing) : '£0';
};

export const getAdminFee = (quote, result) => {
  // Check if there's a specific admin fee in result or quote
  const adminFee = parseNumber((result && result.admin_fee) || quote.admin_fee);
  
  if (adminFee > 0) {
    return `${formatCurrency(adminFee)} per property`;
  }
  
  // Determine fee based on property type
  const propertyType = (quote.product_scope || '').toLowerCase();
  if (propertyType.includes('residential')) {
    return '£199 per property';
  } else if (propertyType.includes('commercial') || propertyType.includes('semi-commercial')) {
    return '£250 per property';
  }
  
  // Default fallback
  return 'Residential: £199, Commercial: £250 per property';
};

export const getValuationFee = (quote) => {
  return quote.valuation_fee || 'TBC by the underwriter.';
};

export const getLenderLegalFee = (quote) => {
  const legalFee = parseNumber(quote.lender_legal_fee);
  if (legalFee === 0) return 'TBC';
  return legalFee > 0 ? formatCurrency(legalFee) : 'TBC by the underwriter.';
};

export const getFeePayments = () => {
  return 'Fees payable when DIP signed.';
};

export const getFullTerm = (quote, result) => {
  if (!result) return 'N/A';
  
  // PRIORITY: Use saved term data from database (added in migration 032)
  // This ensures quote reproducibility even after rate changes
  const initialTerm = parseNumber(result.initial_term);
  const fullTerm = parseNumber(result.full_term) || 300; // 25 years default (300 months)
  
  if (initialTerm) {
    const initialYears = Math.floor(initialTerm / 12);
    const fullTermYears = Math.floor(fullTerm / 12);
    const remainingYears = fullTermYears - initialYears;
    
    return `${fullTermYears}-year total term, made up of an initial fixed rate of ${initialYears} ${initialYears === 1 ? 'year' : 'years'}, then followed by a Revert Rate for remaining ${remainingYears} ${remainingYears === 1 ? 'year' : 'years'}.`;
  }
  
  // FALLBACK: Legacy quotes before migration 032 - parse from product name
  // This fallback will only execute for old quotes that don't have initial_term/full_term fields
  let initialTermYears = 2; // default
  if (result.product_name) {
    const match = result.product_name.match(/(\d+)\s*Year/i);
    if (match) {
      initialTermYears = parseInt(match[1]);
    }
  }
  
  const fullTermYears = 25; // Default full term for BTL
  const remainingYears = fullTermYears - initialTermYears;
  
  return `${fullTermYears}-year total term, made up of an initial fixed rate of ${initialTermYears} ${initialTermYears === 1 ? 'year' : 'years'}, then followed by a Revert Rate for remaining ${remainingYears} ${remainingYears === 1 ? 'year' : 'years'}.`;
};
