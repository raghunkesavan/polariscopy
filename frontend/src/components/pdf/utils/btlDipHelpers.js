/**
 * Helper functions for BTL DIP PDF generation
 * Implements all conditional logic and formatting from Excel DIP sheet
 * 
 * Conditional Scenarios:
 * 1. Product Type: Fixed vs Tracker - different term text
 * 2. Revert Rate: BBR-based vs MVR-based - different rate description
 * 3. Property Type: Residential BTL / Commercial / Semi-Commercial - different declarations
 * 4. Rolled Months: Show only if > 0
 * 5. Deferred Interest: Show only if deferred rate > 0
 * 6. Broker Fees: Show only if broker client type
 * 7. Number of Applicants: 1-4 signature blocks
 * 8. Title Insurance: Conditional note about valuation
 */

import { parseNumber } from '../../../utils/calculator/numberFormatting';
import { getMarketRates } from '../../../config/constants';

// For backward compatibility, export a Proxy that always fetches fresh values
// This ensures values are fetched after AppSettingsContext syncs from Supabase
// (not cached at module load time)
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
  // Check quote fields first (from database)
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
  // Primary source: product_scope field from quote (the "What type of quote is this for?" field)
  const productScope = quote.product_scope || quote.productScope;
  if (productScope) {
    const scopeLower = productScope.toLowerCase();
    if (scopeLower.includes('semi') && scopeLower.includes('commercial')) return 'Semi-Commercial';
    if (scopeLower.includes('commercial')) return 'Commercial';
    if (scopeLower.includes('residential')) return 'Residential';
  }
  
  // Fallback: Check dipData (from modal selection)
  if (dipData?.commercial_or_main_residence) {
    if (dipData.commercial_or_main_residence === 'Commercial') return 'Commercial';
    if (dipData.commercial_or_main_residence === 'Main Residence') return 'Residential BTL';
  }
  
  // Fallback: Check quote property type
  const propType = (quote.property_type || '').toLowerCase();
  if (propType.includes('commercial') && propType.includes('semi')) return 'Semi-Commercial';
  if (propType.includes('commercial')) return 'Commercial';
  
  return 'Residential BTL';
};

/**
 * Get product type description based on property type
 * Logic: =IF(V3="Residential","Buy to Let Standard Residential",
 *         IF(V3="Semi-Commercial","Buy to Let Semi Commercial",
 *         IF(V3="Commercial","Buy to Let Commercial")))
 */
export const getProductTypeText = (quote, dipData) => {
  const propertyType = getPropertyType(quote, dipData);
  
  if (propertyType === 'Residential' || propertyType === 'Residential BTL') {
    return 'Buy to Let Standard Residential';
  }
  if (propertyType === 'Semi-Commercial') {
    return 'Buy to Let Semi Commercial';
  }
  if (propertyType === 'Commercial') {
    return 'Buy to Let Commercial';
  }
  
  // Default fallback
  return 'Buy to Let Standard Residential';
};

// ============================================================================
// LOAN AMOUNT HELPERS
// ============================================================================

export const getGrossLoan = (quote) => parseNumber(quote.gross_loan) || parseNumber(quote.specific_gross_loan) || 0;
export const getNetLoan = (quote) => parseNumber(quote.net_loan) || parseNumber(quote.specific_net_loan) || 0;
export const getPropertyValue = (quote) => parseNumber(quote.property_value) || 0;

// ============================================================================
// PRODUCT FEE HELPERS
// ============================================================================

export const getProductFeePercent = (quote) => {
  const pct = parseNumber(quote.product_fee_percent) || parseNumber(quote.arrangement_fee_percent);
  return pct || 0;
};

export const getProductFeeAmount = (quote) => {
  const amt = parseNumber(quote.product_fee_amount) || parseNumber(quote.arrangement_fee);
  if (amt) return amt;
  
  // Calculate from gross loan and percentage
  const gross = getGrossLoan(quote);
  const pct = getProductFeePercent(quote);
  return gross * (pct / 100);
};

// ============================================================================
// RATE HELPERS - CONDITIONAL LOGIC FOR FIXED vs TRACKER
// ============================================================================

/**
 * Check if product is tracker-based
 */
export const isTrackerProduct = (quote) => {
  const productType = (quote.product_type || '').toLowerCase();
  const rateType = (quote.rate_type || '').toLowerCase();
  return productType.includes('tracker') || rateType.includes('tracker');
};

/**
 * Check if product is fixed-rate
 */
export const isFixedProduct = (quote) => {
  const productType = (quote.product_type || '').toLowerCase();
  const rateType = (quote.rate_type || '').toLowerCase();
  return productType.includes('fix') || rateType.includes('fix');
};

/**
 * Get initial term in years
 */
export const getInitialTerm = (quote) => {
  const months = parseNumber(quote.initial_term) || parseNumber(quote.term_months) || 24;
  return months / 12;
};

/**
 * Get full loan term in years
 * For Core products: 25 years
 * For Specialist products: 10 years (or from rate data)
 */
export const getFullTerm = (quote) => {
  // Check if we have explicit full_term_years from rate data
  if (quote.full_term_years) {
    return parseNumber(quote.full_term_years);
  }
  
  // Check product range - Core is 25 years, Specialist is typically 10 years
  const productRange = (quote.product_range || '').toLowerCase();
  if (productRange === 'core') {
    return 25;
  }
  
  // Check for full_term in months or years
  const fullTerm = parseNumber(quote.full_term);
  if (fullTerm) {
    // If stored as months (> 50), convert to years
    return fullTerm > 50 ? fullTerm / 12 : fullTerm;
  }
  
  // Default based on product range
  return productRange === 'core' ? 25 : 10;
};

/**
 * Get annual interest rate
 */
export const getAnnualRate = (quote) => {
  return parseNumber(quote.actual_rate) || 
         parseNumber(quote.annual_rate) || 
         parseNumber(quote.pay_rate) ||
         parseNumber(quote.initial_rate) ||
         0;
};

/**
 * Get revert rate
 */
export const getRevertRate = (quote) => {
  return parseNumber(quote.revert_rate) || 8.59; // Default MVR
};

/**
 * Check if revert rate is MVR-based (vs BBR-based)
 */
export const isMVRRevert = (quote) => {
  const revertText = (quote.revert_rate_text || quote.revert_index || '').toLowerCase();
  return revertText.includes('mvr') || revertText.includes('variable');
};

/**
 * Get APRC
 */
export const getAPRC = (quote) => {
  const aprc = parseNumber(quote.aprc);
  return aprc ? aprc.toFixed(2) : '0.00';
};

/**
 * Get monthly interest cost (direct debit amount)
 */
export const getMonthlyInterestCost = (quote) => {
  return parseNumber(quote.direct_debit) || parseNumber(quote.monthly_payment) || 0;
};

// ============================================================================
// ROLLED & DEFERRED INTEREST - CONDITIONAL SHOW/HIDE
// ============================================================================

/**
 * Check if rolled months > 0 (to show/hide section)
 */
export const hasRolledMonths = (quote) => {
  const selectedResult = quote._selectedResult || {};
  // Try multiple possible field locations
  const rolled = parseNumber(quote.rolled_months) || 
                 parseNumber(selectedResult.rolled_months) ||
                 parseNumber(quote.rolledMonths) ||
                 parseNumber(selectedResult.rolledMonths) || 0;
  return rolled > 0;
};

export const getRolledMonths = (quote) => {
  const selectedResult = quote._selectedResult || {};
  return parseNumber(quote.rolled_months) || 
         parseNumber(selectedResult.rolled_months) ||
         parseNumber(quote.rolledMonths) ||
         parseNumber(selectedResult.rolledMonths) || 0;
};

export const getServicedMonths = (quote) => {
  const selectedResult = quote._selectedResult || {};
  return parseNumber(quote.serviced_months) || 
         parseNumber(selectedResult.serviced_months) ||
         parseNumber(quote.servicedMonths) ||
         parseNumber(selectedResult.servicedMonths) || 0;
};

export const getRolledInterestAmount = (quote) => {
  const selectedResult = quote._selectedResult || {};
  return parseNumber(quote.rolled_months_interest) || 
         parseNumber(quote.rolled_interest_amount) || 
         parseNumber(quote.rolledInterestAmount) ||
         parseNumber(selectedResult.rolled_months_interest) ||
         parseNumber(selectedResult.rolled_interest_amount) ||
         parseNumber(selectedResult.rolledInterestAmount) ||
         parseNumber(quote.rolled_interest) || 
         0;
};

/**
 * Check if deferred interest is used (to show/hide section)
 * BTL quote_results uses deferred_interest_percent and deferred_interest_pounds
 */
export const hasDeferredInterest = (quote) => {
  const selectedResult = quote._selectedResult || {};
  const deferred = parseNumber(quote.deferred_rate) || 
                   parseNumber(quote.deferred_interest_percent) || 
                   parseNumber(quote.deferred_cap_pct) ||
                   parseNumber(quote.deferredCapPct) ||
                   parseNumber(quote.deferredRate) ||
                   parseNumber(selectedResult.deferred_rate) ||
                   parseNumber(selectedResult.deferred_interest_percent) ||
                   parseNumber(selectedResult.deferred_cap_pct) ||
                   parseNumber(selectedResult.deferredCapPct) ||
                   parseNumber(selectedResult.deferredRate) || 0;
  return deferred > 0;
};

export const getDeferredRate = (quote) => {
  const selectedResult = quote._selectedResult || {};
  return parseNumber(quote.deferred_rate) || 
         parseNumber(quote.deferred_interest_percent) || 
         parseNumber(quote.deferred_cap_pct) ||
         parseNumber(quote.deferredCapPct) ||
         parseNumber(quote.deferredRate) ||
         parseNumber(selectedResult.deferred_rate) ||
         parseNumber(selectedResult.deferred_interest_percent) ||
         parseNumber(selectedResult.deferred_cap_pct) ||
         parseNumber(selectedResult.deferredCapPct) ||
         parseNumber(selectedResult.deferredRate) || 0;
};

export const getDeferredAmount = (quote) => {
  const selectedResult = quote._selectedResult || {};
  const amount = parseNumber(quote.deferred_interest_pounds) || 
         parseNumber(quote.deferred_interest_amount) || 
         parseNumber(quote.deferredInterestAmount) ||
         parseNumber(selectedResult.deferred_interest_pounds) ||
         parseNumber(selectedResult.deferred_interest_amount) ||
         parseNumber(selectedResult.deferredInterestAmount) ||
         parseNumber(quote.deferred_interest) || 
         0;
  return amount;
};

/**
 * Get pay rate (full rate minus deferred)
 */
export const getPayRate = (quote) => {
  // For tracker products: need to calculate full rate = margin + BBR
  // For fixed products: initial_rate is the fixed rate (stored * 100)
  const isTracker = isTrackerProduct(quote);
  let fullRate = getAnnualRate(quote);
  
  if (isTracker) {
    // Use the same calculation as BTLDIPPDF.jsx lines 93-95
    // For tracker: calculate margin, then rate payable
    const currentBBR = MARKET_RATES.STANDARD_BBR * 100; // BBR as percentage (4.00)
    const trackerMargin = (fullRate / 100) - (currentBBR / 100); // Extract margin from stored rate
    fullRate = trackerMargin + currentBBR; // Full rate payable: margin + BBR
  } else {
    // For fixed products: stored as rate * 100 (e.g., 679 for 6.79%)
    // Convert to percentage
    fullRate = fullRate / 100;
  }
  
  const deferredRate = getDeferredRate(quote);
  return (fullRate - deferredRate).toFixed(2);
};

// ============================================================================
// FEES HELPERS
// ============================================================================

export const getAdminFee = (quote, dipData) => {
  // From dipData input or quote, default £250 per property
  const fee = parseNumber(dipData?.admin_fee) || parseNumber(quote.admin_fee);
  return fee || 250;
};

export const getValuationFee = (quote, dipData) => {
  const fee = dipData?.valuation_fee || quote.valuation_fee;
  return fee || 'TBC by the Underwriter';
};

export const getLegalFees = (quote, dipData) => {
  const fee = dipData?.lender_legal_fee || quote.lender_legal_fee;
  if (!fee) return 'TBC by the Underwriter';
  // If it's a number, check if it's 0
  const numericFee = parseNumber(fee);
  if (numericFee === 0) return 'TBC';
  if (numericFee) return `£${Math.round(numericFee).toLocaleString('en-GB')}`;
  // Otherwise return as-is (might be text like "TBC by the Underwriter")
  return fee;
};

// ============================================================================
// BROKER FEES - CONDITIONAL SHOW/HIDE
// ============================================================================

/**
 * Check if broker fees should be shown
 */
export const hasBrokerFees = (brokerSettings) => {
  return brokerSettings?.clientType === 'Broker';
};

export const getBrokerCommission = (quote, brokerSettings) => {
  // Check multiple possible field names for broker commission
  const procFee = parseNumber(quote.proc_fee_value) || 
                  parseNumber(quote.broker_commission) ||
                  parseNumber(quote.broker_commission_proc_fee_pounds);
  if (procFee) return procFee;
  
  // Calculate from percentage
  const gross = getGrossLoan(quote);
  const pct = parseNumber(quote.broker_commission_proc_fee_percent) ||
              parseNumber(brokerSettings?.brokerCommissionPercent) || 0;
  return gross * (pct / 100);
};

export const getBrokerClientFee = (quote, brokerSettings) => {
  // Check multiple possible field names
  const fee = parseNumber(quote.broker_client_fee) || 
              parseNumber(quote.broker_fee_value) ||
              parseNumber(quote.additional_fee_amount);
  if (fee) return fee;
  
  // From broker settings
  if (brokerSettings?.addFeesToggle && brokerSettings?.additionalFeeAmount) {
    const amt = parseNumber(brokerSettings.additionalFeeAmount);
    if (brokerSettings.feeCalculationType === 'percentage') {
      return getGrossLoan(quote) * (amt / 100);
    }
    return amt;
  }
  
  return 0;
};

// ============================================================================
// ERC & OVERPAYMENTS
// ============================================================================

/**
 * Get ERC text from rate record
 * Format: "3% of loan balance in year 1, 2.5% of loan balance in year 2. No charge thereafter."
 */
export const getERCText = (quote) => {
  // First check for pre-formatted erc_text
  const ercText = quote.erc_text || quote.ercText;
  if (ercText) {
    // If it's in the "Yr1: 3% | Yr2: 2.5%" format, convert to "3% of loan balance in year 1, 2.5% of loan balance in year 2. No charge thereafter."
    if (ercText.includes('Yr')) {
      const parts = ercText.split('|').map(p => p.trim());
      const converted = parts.map(p => {
        const match = p.match(/Yr(\d+):\s*([\d.]+)%/);
        if (match) {
          return `${match[2]}% of loan balance in year ${match[1]}`;
        }
        return p;
      });
      return converted.join(', ') + '. No charge thereafter.';
    }
    return ercText;
  }
  
  // Check for _selectedResult which contains the calculated data
  const selectedResult = quote._selectedResult || {};
  
  // Check for erc field from quote_results (stored as text like "Yr1: 3% | Yr2: 2.5%")
  const ercFromResult = selectedResult.erc || quote.erc;
  if (ercFromResult) {
    if (typeof ercFromResult === 'string' && ercFromResult.includes('Yr')) {
      const parts = ercFromResult.split('|').map(p => p.trim());
      const converted = parts.map(p => {
        const match = p.match(/Yr(\d+):\s*([\d.]+)%?/);
        if (match) {
          return `${match[2]}% of loan balance in year ${match[1]}`;
        }
        return p;
      });
      return converted.join(', ') + '. No charge thereafter.';
    }
    return ercFromResult;
  }
  
  // Build from individual ERC values
  const erc1 = parseNumber(selectedResult.erc_1) || parseNumber(quote.erc_1);
  const erc2 = parseNumber(selectedResult.erc_2) || parseNumber(quote.erc_2);
  const erc3 = parseNumber(selectedResult.erc_3) || parseNumber(quote.erc_3);
  const erc4 = parseNumber(selectedResult.erc_4) || parseNumber(quote.erc_4);
  const erc5 = parseNumber(selectedResult.erc_5) || parseNumber(quote.erc_5);
  
  const parts = [];
  if (erc1) parts.push(`${erc1}% of loan balance in year 1`);
  if (erc2) parts.push(`${erc2}% of loan balance in year 2`);
  if (erc3) parts.push(`${erc3}% of loan balance in year 3`);
  if (erc4) parts.push(`${erc4}% of loan balance in year 4`);
  if (erc5) parts.push(`${erc5}% of loan balance in year 5`);
  
  if (parts.length === 0) return 'No early repayment charge applies.';
  
  return parts.join(', ') + '. No charge thereafter.';
};

/**
 * Get overpayment terms text
 */
export const getOverpaymentText = (quote, dipData) => {
  const pct = parseNumber(dipData?.overpayments_percent) || 10;
  const isTracker = isTrackerProduct(quote);
  const periodText = isTracker ? 'Initial Tracker Rate Period' : 'Initial Fixed Rate Period';
  
  return `Permitted up to ${pct}% of the capital amount outstanding per annum during the ${periodText} without incurring an ERC. Any prepayments over ${pct}% will be subject to the Early Repayment Charge stated above. No limit after the ${periodText} has expired.`;
};

// ============================================================================
// DIRECT DEBIT
// ============================================================================

export const getDirectDebit = (quote) => {
  return parseNumber(quote.direct_debit) || parseNumber(quote.monthly_payment) || 0;
};

export const getDDStartMonth = (quote) => {
  const rolled = getRolledMonths(quote);
  return rolled > 0 ? rolled + 1 : 1;
};

// ============================================================================
// ICR
// ============================================================================

export const getICR = (quote) => {
  const icr = parseNumber(quote.icr);
  // ICR is stored as ratio (e.g., 1.45) not percentage
  return icr || null;
};

/**
 * Get LTV (Loan to Value) percentage from quote
 * Returns the actual ltv_percentage from the selected rate/result
 */
export const getLTV = (quote) => {
  // Try to get from selected result first (actual calculated LTV)
  if (quote._selectedResult?.ltv_percentage) {
    return parseNumber(quote._selectedResult.ltv_percentage);
  }
  
  // Try various field names for actual LTV
  const ltv = parseNumber(
    quote.ltv_percentage ?? 
    quote.ltv ??
    quote.target_ltv
  );
  
  return ltv || null;
};

// ============================================================================
// APPLICANTS - CONDITIONAL SIGNATURE BLOCKS
// ============================================================================

/**
 * Get number of applicants (1-4) for signature blocks
 */
export const getNumberOfApplicants = (dipData) => {
  const num = parseNumber(dipData?.number_of_applicants);
  return Math.min(Math.max(num || 1, 1), 4); // Clamp between 1-4
};

// ============================================================================
// TITLE INSURANCE
// ============================================================================

/**
 * Check if title insurance should be shown in DIP
 * Controlled by dipData.title_insurance dropdown (Yes/No)
 */
export const hasTitleInsurance = (quote, dipData) => {
  // Check dipData first (from modal dropdown selection)
  if (dipData?.title_insurance) {
    const ti = dipData.title_insurance.toLowerCase();
    return ti === 'yes';
  }
  
  // Fallback to quote data
  const ti = (quote.title_insurance || '').toLowerCase();
  return ti === 'yes' || ti === 'true' || ti === '1';
};

/**
 * Get title insurance cost amount
 */
export const getTitleInsuranceCost = (quote) => {
  return parseNumber(quote.title_insurance_cost) || 0;
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency with £ symbol and commas (0 decimal places)
 * Use this for all pound values except monthly interest cost
 */
export const formatCurrency = (value) => {
  const num = parseNumber(value);
  if (!num && num !== 0) return '£0';
  return `£${Math.round(num).toLocaleString('en-GB')}`;
};

/**
 * Format currency with £ symbol and commas (2 decimal places)
 * Use this for monthly interest cost only
 */
export const formatCurrencyWithPence = (value) => {
  const num = parseNumber(value);
  if (!num && num !== 0) return '£0.00';
  return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date in long format: "Friday, November 28, 2025"
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format date short: "28 November 2025"
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 2) => {
  const num = parseNumber(value);
  return `${(num || 0).toFixed(decimals)}%`;
};
