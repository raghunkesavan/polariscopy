/**
 * Helper functions for Bridging DIP PDF generation
 * Implements all conditional logic and formatting for Bridge & Fusion products
 * 
 * Conditional Scenarios:
 * 1. Product Type: Fusion vs Fixed Bridge vs Variable Bridge
 * 2. Property Type: Residential / Commercial / Semi-Commercial - different declarations
 * 3. Rolled Months: Show only if > 0
 * 4. Retention: Show only if retention facility exists
 * 5. Broker Fees: Show only if broker client type
 * 6. Number of Applicants: 1-4 signature blocks
 * 7. Title Insurance: Conditional cost deduction
 */

import { parseNumber } from '../../../utils/calculator/numberFormatting';
import { getMarketRates } from '../../../config/constants';

// Get market rates dynamically at render time (not cached at module load)
// This ensures values are fetched after AppSettingsContext syncs from Supabase
export const MARKET_RATES = new Proxy({}, {
  get(_, prop) {
    return getMarketRates()[prop];
  }
});
export { parseNumber, getMarketRates };

// ============================================================================
// BORROWER & PROPERTY HELPERS
// ============================================================================

/**
 * Get borrower name from quote, dipData, or broker settings
 */
export const getBorrowerName = (quote, dipData, brokerSettings) => {
  // Check quote fields first
  if (quote.borrower_name) return quote.borrower_name;
  if (quote.name) return quote.name;
  if (quote.quote_borrower_name) return quote.quote_borrower_name;
  
  // Check if it's a company
  if (quote.borrower_type === 'Company' && quote.company_name) {
    return quote.company_name;
  }
  
  // Check client details from quote
  if (quote.client_first_name && quote.client_last_name) {
    return `${quote.client_first_name} ${quote.client_last_name}`;
  }
  if (quote.client_first_name) return quote.client_first_name;
  
  // Check dipData
  if (dipData?.borrower_name) return dipData.borrower_name;
  
  // Check broker settings
  if (brokerSettings?.clientFirstName && brokerSettings?.clientLastName) {
    return `${brokerSettings.clientFirstName} ${brokerSettings.clientLastName}`;
  }
  if (brokerSettings?.clientFirstName) return brokerSettings.clientFirstName;
  if (brokerSettings?.clientLastName) return brokerSettings.clientLastName;
  
  return 'Borrower Name';
};

/**
 * Get formatted security property address from dipData
 */
export const getSecurityAddress = (dipData) => {
  if (!dipData?.security_properties || !Array.isArray(dipData.security_properties)) {
    return 'Property Address';
  }
  
  const properties = dipData.security_properties;
  if (properties.length === 0) return 'Property Address';
  
  // Format first property (or all if multiple)
  return properties.map((prop, idx) => {
    const parts = [];
    if (prop.street) parts.push(prop.street);
    if (prop.city) parts.push(prop.city);
    if (prop.postcode) parts.push(prop.postcode);
    if (prop.country) parts.push(prop.country);
    const address = parts.join(', ') || 'Address not provided';
    return properties.length > 1 ? `Property ${idx + 1}: ${address}` : address;
  }).join('\n');
};

/**
 * Get property type for conditional declarations
 * Returns: 'Residential', 'Commercial', 'Semi-Commercial'
 */
export const getPropertyType = (quote, dipData) => {
  // Primary source: product_scope field from quote
  const productScope = quote.product_scope || quote.productScope;
  if (productScope) {
    const scopeLower = productScope.toLowerCase();
    if (scopeLower.includes('semi') && scopeLower.includes('commercial')) return 'Semi-Commercial';
    if (scopeLower.includes('commercial')) return 'Commercial';
    if (scopeLower.includes('residential')) return 'Residential';
  }
  
  // Fallback: Check dipData
  if (dipData?.commercial_or_main_residence) {
    if (dipData.commercial_or_main_residence === 'Commercial') return 'Commercial';
    if (dipData.commercial_or_main_residence === 'Main Residence') return 'Residential';
  }
  
  // Fallback: Check quote property type
  const propType = (quote.property_type || '').toLowerCase();
  if (propType.includes('commercial') && propType.includes('semi')) return 'Semi-Commercial';
  if (propType.includes('commercial')) return 'Commercial';
  
  return 'Residential';
};

// ============================================================================
// LOAN AMOUNT HELPERS
// ============================================================================

export const getGrossLoan = (quote) => {
  return parseNumber(quote.gross_loan) || 
         parseNumber(quote.specific_gross_loan) || 
         0;
};

export const getNetLoan = (quote) => {
  return parseNumber(quote.net_loan) || 
         parseNumber(quote.specific_net_loan) || 
         0;
};

export const getPropertyValue = (quote) => {
  return parseNumber(quote.property_value) || 0;
};

export const getLTV = (quote) => {
  const gross = getGrossLoan(quote);
  const propValue = getPropertyValue(quote);
  if (propValue === 0) return 0;
  return ((gross / propValue) * 100).toFixed(2);
};

// ============================================================================
// PRODUCT FEE HELPERS
// ============================================================================

export const getProductFeePercent = (quote) => {
  const pct = parseNumber(quote.product_fee_percent) || 
              parseNumber(quote.arrangement_fee_percent) ||
              parseNumber(quote.fee_percent);
  return pct || 0;
};

export const getProductFeeAmount = (quote) => {
  const amt = parseNumber(quote.product_fee_amount) || 
              parseNumber(quote.arrangement_fee) ||
              parseNumber(quote.fee_amount);
  if (amt) return amt;
  
  // Calculate from gross loan and percentage
  const gross = getGrossLoan(quote);
  const pct = getProductFeePercent(quote);
  return gross * (pct / 100);
};

// ============================================================================
// PRODUCT TYPE HELPERS - FUSION vs FIXED vs VARIABLE
// ============================================================================

/**
 * Get product name (Fusion, Fixed Bridge, Variable Bridge)
 */
export const getProductName = (quote) => {
  const productType = (quote.product_type || '').toLowerCase();
  const subProduct = (quote.sub_product || '').toLowerCase();
  
  if (productType.includes('fusion') || subProduct.includes('fusion')) {
    return 'Fusion';
  }
  if (productType.includes('fixed') || subProduct.includes('fixed')) {
    return 'Fixed Bridge';
  }
  if (productType.includes('variable') || subProduct.includes('variable')) {
    return 'Variable Bridge';
  }
  
  // Fallback: check rate type
  const rateType = (quote.rate_type || '').toLowerCase();
  if (rateType.includes('fusion')) return 'Fusion';
  if (rateType.includes('fixed')) return 'Fixed Bridge';
  if (rateType.includes('variable')) return 'Variable Bridge';
  
  return 'Bridging Finance';
};

/**
 * Check if product is Fusion
 */
export const isFusion = (quote) => {
  return getProductName(quote) === 'Fusion';
};

/**
 * Check if product is Fixed Bridge
 */
export const isFixedBridge = (quote) => {
  return getProductName(quote) === 'Fixed Bridge';
};

/**
 * Check if product is Variable Bridge
 */
export const isVariableBridge = (quote) => {
  return getProductName(quote) === 'Variable Bridge';
};

// ============================================================================
// TERM HELPERS
// ============================================================================

/**
 * Get bridging loan term in months
 */
export const getBridgingTerm = (quote) => {
  return parseNumber(quote.bridging_loan_term) || 
         parseNumber(quote.term_months) || 
         parseNumber(quote.loan_term) ||
         12;
};

/**
 * Get minimum term for ERC (Fixed/Variable have minimum terms, Fusion doesn't)
 */
export const getMinimumTerm = (quote) => {
  if (isFusion(quote)) return 0; // Fusion has no minimum term
  
  // Fixed and Variable typically have minimum terms
  return parseNumber(quote.minimum_term) || 
         parseNumber(quote.min_term) ||
         3; // Default 3 months
};

/**
 * Get charge type (1st or 2nd charge)
 */
export const getChargeType = (quote) => {
  const chargeType = quote.charge_type || '';
  if (chargeType.includes('1st') || chargeType.includes('First')) return 'First';
  if (chargeType.includes('2nd') || chargeType.includes('Second')) return 'Second';
  return 'First';
};

// ============================================================================
// RATE HELPERS
// ============================================================================

/**
 * Get interest rate percentage
 */
export const getInterestRate = (quote) => {
  // Check multiple fields for rate information, prioritizing initial_rate (saved overridden rate)
  const rate = parseNumber(quote.initial_rate) ||
               parseNumber(quote.pay_rate) ||
               parseNumber(quote.actual_rate) || 
               parseNumber(quote.annual_rate) || 
               parseNumber(quote.interest_rate) ||
               parseNumber(quote.rate) ||
               0;
  return rate;
};

/**
 * Get monthly interest cost
 */
export const getMonthlyInterestCost = (quote) => {
  const monthlyInt = parseNumber(quote.monthly_interest_cost) || 
                     parseNumber(quote.monthly_interest) ||
                     parseNumber(quote.monthly_payment);
  
  if (monthlyInt) return monthlyInt;
  
  // Calculate: (gross_loan * annual_rate%) / 12
  const gross = getGrossLoan(quote);
  const annualRate = parseNumber(getInterestRate(quote));
  return (gross * (annualRate / 100)) / 12;
};

// ============================================================================
// ROLLED INTEREST HELPERS
// ============================================================================

/**
 * Check if interest is rolled up
 */
export const hasRolledMonths = (quote) => {
  const rolled = parseNumber(quote.rolled_months) || 
                 parseNumber(quote.months_rolled) ||
                 0;
  return rolled > 0;
};

/**
 * Get number of months interest rolled
 */
export const getRolledMonths = (quote) => {
  return parseNumber(quote.rolled_months) || 
         parseNumber(quote.months_rolled) ||
         0;
};

/**
 * Get rolled interest amount
 */
export const getRolledInterestAmount = (quote) => {
  const rolledAmt = parseNumber(quote.rolled_interest_amount) ||
                    parseNumber(quote.rolled_interest);
  
  if (rolledAmt) return rolledAmt;
  
  // Calculate: monthly_interest * rolled_months
  const monthlyInt = getMonthlyInterestCost(quote);
  const months = getRolledMonths(quote);
  return monthlyInt * months;
};

// ============================================================================
// RETENTION HELPERS
// ============================================================================

/**
 * Check if there's a retention facility
 */
export const hasRetention = (quote) => {
  const retention = parseNumber(quote.retention_amount) || 
                    parseNumber(quote.retention) ||
                    0;
  return retention > 0;
};

/**
 * Get retention amount
 */
export const getRetentionAmount = (quote) => {
  return parseNumber(quote.retention_amount) || 
         parseNumber(quote.retention) ||
         0;
};

// ============================================================================
// FEE HELPERS
// ============================================================================

/**
 * Get admin fee
 */
export const getAdminFee = (quote, dipData) => {
  return parseNumber(dipData?.admin_fee) ||
         parseNumber(quote.admin_fee) ||
         995;
};

/**
 * Get valuation fee
 */
export const getValuationFee = (quote, dipData) => {
  const fee = dipData?.valuation_fee || quote.valuation_fee;
  return fee || 'TBC';
};

/**
 * Get legal fees
 */
export const getLegalFees = (quote, dipData) => {
  const fees = dipData?.lender_legal_fee || 
               quote.lender_legal_fee ||
               dipData?.legal_fees ||
               quote.legal_fees;
  return fees || 'TBC by the Underwriter';
};

/**
 * Get exit fee
 */
export const getExitFee = (quote) => {
  return parseNumber(quote.exit_fee) || 
         parseNumber(quote.completion_fee) ||
         0;
};

/**
 * Check if broker fees exist
 */
export const hasBrokerFees = (brokerSettings) => {
  return brokerSettings?.client_type === 'broker' || 
         brokerSettings?.clientType === 'broker';
};

/**
 * Get broker commission
 */
export const getBrokerCommission = (quote, brokerSettings) => {
  if (!hasBrokerFees(brokerSettings)) return 0;
  
  return parseNumber(quote.broker_commission) ||
         parseNumber(brokerSettings.commission) ||
         0;
};

/**
 * Get broker client fee
 */
export const getBrokerClientFee = (quote, brokerSettings) => {
  if (!hasBrokerFees(brokerSettings)) return 0;
  
  return parseNumber(quote.broker_client_fee) ||
         parseNumber(brokerSettings.client_fee) ||
         0;
};

// ============================================================================
// TITLE INSURANCE HELPERS
// ============================================================================

/**
 * Check if title insurance is included
 */
export const hasTitleInsurance = (quote, dipData) => {
  const cost = parseNumber(dipData?.title_insurance_cost) ||
               parseNumber(quote.title_insurance_cost);
  return cost > 0;
};

/**
 * Get title insurance cost
 */
export const getTitleInsuranceCost = (quote) => {
  return parseNumber(quote.title_insurance_cost) || 0;
};

// ============================================================================
// NUMBER OF APPLICANTS HELPER
// ============================================================================

/**
 * Get number of applicants for signature blocks
 */
export const getNumberOfApplicants = (dipData) => {
  const num = parseNumber(dipData?.number_of_applicants);
  if (num && num >= 1 && num <= 4) return num;
  return 1; // Default to 1
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency with £ symbol (no pence)
 */
export const formatCurrency = (value) => {
  const num = parseNumber(value);
  return `£${Math.round(num).toLocaleString('en-GB')}`;
};

/**
 * Format currency with pence
 */
export const formatCurrencyWithPence = (value) => {
  const num = parseNumber(value);
  return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 2) => {
  const num = parseNumber(value);
  return `${num.toFixed(decimals)}%`;
};

/**
 * Format date in long format: "Friday, 28 November 2025"
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};
