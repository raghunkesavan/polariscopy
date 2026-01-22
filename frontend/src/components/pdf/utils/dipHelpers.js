/**
 * Helper functions for DIP PDF generation
 * Handles all the conditional text, calculations, and formatting
 */

/**
 * Get product type description based on calculator type and property type
 */
export const getProductTypeDescription = (quote) => {
  const calculatorType = quote.calculator_type;
  const propertyType = quote.property_type;
  const loanType = quote.loan_calculation_requested || quote.charge_type;
  
  if (calculatorType === 'BTL') {
    // BTL Product Types
    if (propertyType === 'Residential') {
      return 'Buy to Let Standard Residential';
    } else if (propertyType === 'HMO') {
      return 'Buy to Let House in Multiple Occupation (HMO)';
    } else if (propertyType === 'Multi Unit Freehold Block') {
      return 'Buy to Let Multi Unit Freehold Block';
    } else if (propertyType === 'MUFB') {
      return 'Buy to Let Multi Unit Freehold Block';
    } else {
      return `Buy to Let ${propertyType}`;
    }
  } else if (calculatorType === 'BRIDGING') {
    // Bridging Product Types
    const chargeType = quote.charge_type || '';
    const subProduct = quote.sub_product || '';
    
    if (chargeType === '1st Charge' && subProduct === 'Regulated') {
      return 'Bridging Loan - First Charge (Regulated)';
    } else if (chargeType === '1st Charge') {
      return 'Bridging Loan - First Charge';
    } else if (chargeType === '2nd Charge') {
      return 'Bridging Loan - Second Charge';
    } else {
      return 'Bridging Loan';
    }
  }
  
  return calculatorType || 'Mortgage';
};

/**
 * Get loan term description with initial and full term
 */
export const getLoanTermDescription = (quote, dipData) => {
  const calculatorType = quote.calculator_type;
  
  if (calculatorType === 'BTL') {
    // BTL typically has initial and full term
    const initialTerm = quote.initial_term || dipData.initial_term;
    const fullTerm = quote.full_term || dipData.full_term;
    
    if (initialTerm && fullTerm) {
      if (initialTerm === fullTerm) {
        return `${initialTerm} months`;
      } else {
        return `${initialTerm} months initial period, ${fullTerm} months total term`;
      }
    } else if (fullTerm) {
      return `${fullTerm} months`;
    } else if (initialTerm) {
      return `${initialTerm} months`;
    }
  } else if (calculatorType === 'BRIDGING') {
    // Bridging has single term
    const term = quote.bridging_loan_term || dipData.bridging_loan_term;
    return term ? `${term} months` : 'N/A';
  }
  
  return 'N/A';
};

/**
 * Get borrower name from quote or broker settings
 */
export const getBorrowerName = (quote, brokerSettings) => {
  // Priority: quote_borrower_name -> client name from broker settings
  if (quote.quote_borrower_name) {
    return quote.quote_borrower_name;
  }
  
  if (brokerSettings.clientFirstName && brokerSettings.clientLastName) {
    return `${brokerSettings.clientFirstName} ${brokerSettings.clientLastName}`;
  } else if (brokerSettings.clientFirstName) {
    return brokerSettings.clientFirstName;
  } else if (brokerSettings.clientLastName) {
    return brokerSettings.clientLastName;
  }
  
  return 'N/A';
};

/**
 * Format security properties as address list
 */
export const formatSecurityProperties = (dipData) => {
  const properties = dipData.security_properties;
  
  if (!properties || !Array.isArray(properties) || properties.length === 0) {
    return null;
  }
  
  return properties.map((property, index) => {
    const parts = [];
    if (property.street) parts.push(property.street);
    if (property.city) parts.push(property.city);
    if (property.postcode) parts.push(property.postcode);
    if (property.country) parts.push(property.country);
    
    const address = parts.join(', ');
    return {
      number: index + 1,
      address: address || 'Address not provided'
    };
  });
};

/**
 * Calculate total advance amount
 */
export const calculateTotalAdvance = (quote) => {
  if (quote.calculator_type === 'BTL') {
    return quote.specific_gross_loan || quote.gross_loan || 0;
  } else if (quote.calculator_type === 'BRIDGING') {
    return quote.gross_loan || 0;
  }
  return 0;
};

/**
 * Calculate net loan amount
 */
export const calculateNetLoan = (quote) => {
  if (quote.calculator_type === 'BTL') {
    return quote.specific_net_loan || quote.net_loan || 0;
  } else if (quote.calculator_type === 'BRIDGING') {
    return quote.specific_net_loan || quote.net_loan || 
           (quote.gross_loan ? quote.gross_loan - (quote.total_fees || 0) : 0);
  }
  return 0;
};

/**
 * Get interest rate description
 */
export const getInterestRateDescription = (quote, dipData) => {
  const feeType = dipData.fee_type_selection || quote.fee_type_selection;
  const productType = quote.product_type;
  
  if (productType === 'Variable' || productType === 'Tracker') {
    return `${productType} Rate`;
  } else if (productType === 'Fixed') {
    return 'Fixed Rate';
  }
  
  return 'Interest Rate';
};

/**
 * Get payment type description
 */
export const getPaymentTypeDescription = (quote) => {
  const paymentType = quote.payment_type || 'Interest Only';
  
  if (paymentType === 'Interest Only') {
    return 'Interest Only - Monthly payments cover interest only';
  } else if (paymentType === 'Repayment') {
    return 'Capital & Interest - Monthly payments cover both capital and interest';
  } else if (paymentType === 'Rolled') {
    return 'Rolled Interest - Interest is added to the loan balance';
  }
  
  return paymentType;
};

/**
 * Calculate LTV
 */
export const calculateLTV = (quote) => {
  const propertyValue = Number(quote.property_value || 0);
  const grossLoan = calculateTotalAdvance(quote);
  
  if (propertyValue > 0) {
    return ((grossLoan / propertyValue) * 100).toFixed(2);
  }
  
  return quote.target_ltv || 0;
};

/**
 * Get funding line description
 */
export const getFundingLineDescription = (dipData) => {
  return dipData.funding_line || 'Standard';
};

/**
 * Get commercial or residential description
 */
export const getPropertyUsageDescription = (dipData) => {
  const usage = dipData.commercial_or_main_residence;
  
  if (usage === 'Commercial') {
    return 'Commercial Property';
  } else if (usage === 'Main Residence') {
    return 'Main Residence';
  } else if (usage === 'Investment') {
    return 'Investment Property';
  }
  
  return usage || 'N/A';
};

/**
 * Format currency with commas
 */
export const formatCurrency = (value) => {
  if (!value) return '£0';
  return `£${Number(value).toLocaleString('en-GB', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format date in UK format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Get number of applicants text
 */
export const getApplicantsText = (dipData) => {
  const num = Number(dipData.number_of_applicants || 1);
  return num === 1 ? '1 Applicant' : `${num} Applicants`;
};

/**
 * Check if guarantor is required
 */
export const hasGuarantor = (dipData) => {
  return dipData.guarantor_name && dipData.guarantor_name.trim() !== '';
};

/**
 * Get overpayment terms
 */
export const getOverpaymentTerms = (dipData) => {
  const percent = dipData.overpayments_percent || 10;
  return `Up to ${percent}% of the outstanding balance may be overpaid annually without penalty`;
};

/**
 * Get valuation fee amount
 */
export const getValuationFee = (quote) => {
  // This should come from your rates/fee structure
  // For now, returning a placeholder
  return quote.valuation_fee || 'To be confirmed';
};

/**
 * Get arrangement fee
 */
export const getArrangementFee = (quote, dipData) => {
  const feeType = dipData.fee_type_selection || quote.fee_type_selection;
  
  if (feeType) {
    // If fee type is like "2%" or "1.5%"
    if (feeType.includes('%')) {
      const percent = parseFloat(feeType);
      const grossLoan = calculateTotalAdvance(quote);
      return (grossLoan * percent / 100).toFixed(2);
    } else if (feeType.includes('£')) {
      return parseFloat(feeType.replace('£', '').replace(',', ''));
    }
  }
  
  return quote.arrangement_fee || 0;
};

/**
 * Get exit fee description
 */
export const getExitFeeDescription = (quote) => {
  if (quote.calculator_type === 'BRIDGING') {
    return '1% of the gross loan amount (payable on redemption)';
  }
  return 'Subject to terms and conditions';
};

/**
 * Generate special conditions based on quote data
 */
export const getSpecialConditions = (quote, dipData, brokerSettings) => {
  const conditions = [];
  
  // Add conditions based on property type
  if (quote.property_type === 'HMO') {
    conditions.push('HMO License must be in place or applied for');
    conditions.push('Minimum of 5 letting rooms required');
  }
  
  // Add conditions based on product range
  if (dipData.product_range === 'specialist' || quote.selected_range === 'specialist') {
    conditions.push('Specialist underwriting criteria apply');
  }
  
  // Add conditions based on LTV
  const ltv = calculateLTV(quote);
  if (ltv > 75) {
    conditions.push('Additional documentation required for high LTV loans');
  }
  
  // Add guarantor condition
  if (hasGuarantor(dipData)) {
    conditions.push('Guarantor agreement and credit checks required');
  }
  
  // Add title insurance condition
  if (quote.title_insurance === 'Yes') {
    conditions.push('Title insurance must be arranged prior to completion');
  }
  
  // Add broker fee condition
  if (brokerSettings.addFeesToggle) {
    conditions.push('Broker fees as detailed are payable');
  }
  
  // Add bridging-specific conditions
  if (quote.calculator_type === 'BRIDGING') {
    conditions.push('Acceptable exit strategy must be confirmed');
    conditions.push('Monthly monitoring fee applies during loan term');
  }
  
  // Add regulated condition
  if (quote.sub_product === 'Regulated' || dipData.commercial_or_main_residence === 'Main Residence') {
    conditions.push('This is a regulated mortgage contract');
  }
  
  return conditions;
};
