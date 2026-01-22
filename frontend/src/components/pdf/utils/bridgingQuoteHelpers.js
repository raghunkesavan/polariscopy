/**
 * Helper functions for Bridging Quote PDF generation
 * Extracts and formats data from quote and results
 * Handles three product columns: Fusion, Fixed Bridge, Variable Bridge
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
  return quote.product_scope || 'Bridging Finance';
};

export const getRequestedAmount = (quote) => {
  // Bridging typically uses gross loan or specific loan amount
  const loanType = quote.loan_calculation_requested || quote.loan_type;
  
  if (loanType === 'Maximum gross loan' || loanType === 'Max gross loan') {
    return 'Maximum gross loan';
  } else if (quote.specific_gross_loan) {
    return formatCurrency(quote.specific_gross_loan);
  } else if (quote.specific_net_loan) {
    return formatCurrency(quote.specific_net_loan);
  }
  
  return 'Maximum gross loan';
};

export const getPropertyValue = (quote) => {
  return formatCurrency(quote.property_value);
};

export const getMonthlyRent = (quote) => {
  const rent = parseNumber(quote.monthly_rent) ||
               parseNumber(quote.rent) ||
               0;
  if (rent === 0) return 'N/A';
  return formatCurrency(rent);
};

export const getBridgingTerm = (quote) => {
  const term = parseNumber(quote.bridging_loan_term) || 
               parseNumber(quote.term_months) ||
               12;
  return `${term} ${term === 1 ? 'month' : 'months'}`;
};

export const getChargeType = (quote) => {
  const chargeType = quote.charge_type || '';
  if (chargeType.includes('1st') || chargeType.includes('First')) return '1st Charge';
  if (chargeType.includes('2nd') || chargeType.includes('Second')) return '2nd Charge';
  return '1st Charge';
};

export const getVersion = (quote) => {
  const version = quote.quote_version || quote.version_number || quote.version || 1;
  return `Version ${version}`;
};

// ============================================================================
// PRODUCT COLUMN HELPERS
// ============================================================================

/**
 * Get available product types from results
 * Returns array of unique product types: ['Fusion', 'Fixed Bridge', 'Variable Bridge']
 */
export const getProductTypes = (results) => {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return [];
  }
  
  const productTypes = new Set();
  
  results.forEach(result => {
    // Check multiple fields for product type information
    const productType = (
      result.product_name || 
      result.product_type || 
      result.rate_type || 
      result.type || 
      result.product || 
      ''
    ).toLowerCase();
    
    if (productType.includes('fusion')) {
      productTypes.add('Fusion');
    } else if (productType.includes('fixed')) {
      productTypes.add('Fixed Bridge');
    } else if (productType.includes('variable')) {
      productTypes.add('Variable Bridge');
    }
  });
  
  // Return in specific order: Fusion, Fixed Bridge, Variable Bridge
  const orderedTypes = [];
  if (productTypes.has('Fusion')) orderedTypes.push('Fusion');
  if (productTypes.has('Fixed Bridge')) orderedTypes.push('Fixed Bridge');
  if (productTypes.has('Variable Bridge')) orderedTypes.push('Variable Bridge');
  
  return orderedTypes;
};

/**
 * Filter results by product type
 */
export const getResultsByProductType = (results, productType) => {
  if (!results || !Array.isArray(results)) return [];
  
  return results.filter(result => {
    // Check multiple fields for product type information
    const resultType = (
      result.product_name || 
      result.product_type || 
      result.rate_type || 
      result.type || 
      result.product || 
      ''
    ).toLowerCase();
    const targetType = productType.toLowerCase();
    
    if (targetType.includes('fusion')) {
      return resultType.includes('fusion');
    } else if (targetType.includes('fixed')) {
      return resultType.includes('fixed');
    } else if (targetType.includes('variable')) {
      return resultType.includes('variable');
    }
    
    return false;
  });
};

/**
 * Get the best (first) result for a product type
 */
export const getBestResultForProductType = (results, productType) => {
  const filtered = getResultsByProductType(results, productType);
  return filtered.length > 0 ? filtered[0] : null;
};

// ============================================================================
// RESULT FIELD EXTRACTORS
// ============================================================================

export const getGrossLoan = (result) => {
  return parseNumber(result?.gross_loan) || 0;
};

export const getNetLoan = (result) => {
  return parseNumber(result?.net_loan) || 0;
};

export const getLTV = (result) => {
  // Database fields: gross_ltv, net_ltv, ltv_percentage, ltv
  const ltv = parseNumber(result?.gross_ltv) ||
              parseNumber(result?.ltv_percentage) ||
              parseNumber(result?.net_ltv) ||
              parseNumber(result?.ltv) ||
              0;
  return ltv.toFixed(2);
};

export const getInterestRate = (result) => {
  // Check multiple fields for rate information, prioritizing initial_rate (saved overridden rate)
  const rate = parseNumber(result?.initial_rate) ||
               parseNumber(result?.pay_rate) ||
               parseNumber(result?.actual_rate) || 
               parseNumber(result?.annual_rate) ||
               parseNumber(result?.rate) ||
               0;
  return rate.toFixed(2);
};

export const getMonthlyInterest = (result) => {
  return parseNumber(result?.monthly_interest_cost) || 
         parseNumber(result?.monthly_interest) ||
         0;
};

export const getProductFeePercent = (result) => {
  const pct = parseNumber(result?.product_fee_percent) ||
              parseNumber(result?.arrangement_fee_percent) ||
              parseNumber(result?.fee_percent) ||
              0;
  return pct.toFixed(2);
};

export const getProductFeeAmount = (result) => {
  // Database fields: product_fee_pounds, arrangement_fee_gbp
  return parseNumber(result?.product_fee_pounds) ||
         parseNumber(result?.arrangement_fee_gbp) ||
         parseNumber(result?.arrangement_fee) ||
         0;
};

export const getRolledMonths = (result) => {
  return parseNumber(result?.rolled_months) || 
         parseNumber(result?.months_rolled) ||
         0;
};

export const getRolledInterest = (result) => {
  // Database field: rolled_months_interest
  return parseNumber(result?.rolled_months_interest) ||
         parseNumber(result?.rolled_interest) ||
         0;
};

export const getRetention = (result) => {
  return parseNumber(result?.retention_amount) ||
         parseNumber(result?.retention) ||
         0;
};

export const getAdminFee = (result) => {
  return parseNumber(result?.admin_fee) || 995;
};

export const getValuationFee = (result) => {
  const fee = result?.valuation_fee;
  return fee || 'TBC';
};

export const getLegalFees = (result) => {
  const fees = result?.lender_legal_fee || 
               result?.legal_fees;
  return fees || 'TBC';
};

export const getExitFee = (result) => {
  return parseNumber(result?.exit_fee) || 
         parseNumber(result?.completion_fee) ||
         0;
};

export const getTitleInsuranceCost = (result) => {
  return parseNumber(result?.title_insurance_cost) || 0;
};

export const getTerm = (result) => {
  const term = parseNumber(result?.bridging_loan_term) ||
               parseNumber(result?.term_months) ||
               12;
  return term;
};

export const getMinimumTerm = (result) => {
  const productType = (result?.product_type || '').toLowerCase();
  
  // Fusion has no minimum term
  if (productType.includes('fusion')) return 0;
  
  // Fixed and Variable have minimum terms
  return parseNumber(result?.minimum_term) || 
         parseNumber(result?.min_term) ||
         3;
};

// ============================================================================
// CONDITIONAL CHECKS
// ============================================================================

export const hasRolledInterest = (result) => {
  return getRolledMonths(result) > 0;
};

export const hasRetention = (result) => {
  return getRetention(result) > 0;
};

export const hasTitleInsurance = (result) => {
  return getTitleInsuranceCost(result) > 0;
};

export const isFusion = (result) => {
  const productType = (result?.product_type || result?.rate_type || result?.type || '').toLowerCase();
  return productType.includes('fusion');
};

export const isFixedBridge = (result) => {
  const productType = (result?.product_type || result?.rate_type || result?.type || '').toLowerCase();
  return productType.includes('fixed') && !productType.includes('fusion');
};

export const isVariableBridge = (result) => {
  const productType = (result?.product_type || result?.rate_type || result?.type || '').toLowerCase();
  return productType.includes('variable');
};

// ============================================================================
// BROKER INFORMATION HELPERS
// ============================================================================

export const getBrokerCompany = (brokerSettings) => {
  return brokerSettings?.companyName || 
         brokerSettings?.company_name ||
         brokerSettings?.brokerCompanyName ||
         'Broker Company';
};

export const getBrokerName = (brokerSettings) => {
  if (brokerSettings?.brokerFirstName && brokerSettings?.brokerLastName) {
    return `${brokerSettings.brokerFirstName} ${brokerSettings.brokerLastName}`;
  }
  if (brokerSettings?.broker_first_name && brokerSettings?.broker_last_name) {
    return `${brokerSettings.broker_first_name} ${brokerSettings.broker_last_name}`;
  }
  return brokerSettings?.brokerFirstName || 
         brokerSettings?.broker_first_name ||
         'Broker Name';
};

export const getBrokerPhone = (brokerSettings) => {
  return brokerSettings?.brokerPhone || 
         brokerSettings?.broker_phone ||
         brokerSettings?.phone ||
         '';
};

export const getBrokerEmail = (brokerSettings) => {
  return brokerSettings?.brokerEmail || 
         brokerSettings?.broker_email ||
         brokerSettings?.email ||
         '';
};

// ============================================================================
// CLIENT INFORMATION HELPERS
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
