/**
 * Underwriting Requirements Configuration
 * 
 * This file defines the configurable UW requirements checklist for DIP and Quotes.
 * Requirements can be:
 * - Global (apply to all loans)
 * - Conditional (based on loan criteria like property type, borrower type, purpose)
 * 
 * Stage values:
 * - 'DIP' - Required at DIP stage
 * - 'Indicative' - Required at indicative/quote stage  
 * - 'Both' - Required at both stages
 * 
 * Conditions can reference quote/DIP data fields to show/hide requirements dynamically
 */

// Default UW requirements categories
export const UW_CATEGORIES = {
  ASSUMPTIONS: 'Assumptions',
  BROKER: 'Broker',
  BORROWER: 'Borrower',
  COMPANY: 'Company',
  PROPERTY: 'Property',
  PROPERTY_HMO: 'Property - HMO',
  PROPERTY_MUFB: 'Property - MUFB',
  PROPERTY_HOLIDAY_LET: 'Property - Holiday Let',
  ADDITIONAL: 'Additional Requirements'
};

// Stage types
export const UW_STAGES = {
  DIP: 'DIP',
  INDICATIVE: 'Indicative',
  BOTH: 'Both'
};

// Condition operators for dynamic visibility
export const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  IN: 'in',
  NOT_IN: 'notIn',
  GREATER_THAN: 'greaterThan',
  LESS_THAN: 'lessThan',
  EXISTS: 'exists',
  NOT_EXISTS: 'notExists',
  CONTAINS: 'contains'
};

/**
 * Default UW Requirements List
 * Each requirement has:
 * - id: Unique identifier
 * - category: Category grouping
 * - description: Requirement text
 * - stage: DIP, Indicative, or Both
 * - required: true/false
 * - order: Display order within category
 * - conditions: Optional array of conditions for visibility
 * - guidance: Optional internal guidance note for UW team
 * - enabled: Whether this requirement is active
 */
export const DEFAULT_UW_REQUIREMENTS = [
  // ==================== ASSUMPTIONS (Indicative Stage) ====================
  {
    id: 'assumption_intro',
    category: UW_CATEGORIES.ASSUMPTIONS,
    description: 'The indicative terms provided are based on the information provided, the following assumptions and subject to Credit committee approval',
    stage: UW_STAGES.INDICATIVE,
    required: false,
    order: 1,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'assumption_clean_credit',
    category: UW_CATEGORIES.ASSUMPTIONS,
    description: 'The Borrower has a clean credit history, is an experienced landlord and is a UK national or limited company',
    stage: UW_STAGES.INDICATIVE,
    required: false,
    order: 2,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'assumption_residential_unit',
    category: UW_CATEGORIES.ASSUMPTIONS,
    description: 'The property is a residential unit intended for occupancy by a single household',
    stage: UW_STAGES.INDICATIVE,
    required: false,
    order: 3,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'assumption_valuation',
    category: UW_CATEGORIES.ASSUMPTIONS,
    description: 'The valuation figure provided reflects the 180-day market value of the property in its current condition',
    stage: UW_STAGES.INDICATIVE,
    required: false,
    order: 4,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'assumption_revised_terms',
    category: UW_CATEGORIES.ASSUMPTIONS,
    description: 'If any of these assumptions do not apply, the indicative terms provided may need to be revised to comply with our lending policy.',
    stage: UW_STAGES.INDICATIVE,
    required: false,
    order: 5,
    conditions: [],
    guidance: '',
    enabled: true,
    pdfOnly: true
  },
  {
    id: 'assumption_dip_intro',
    category: UW_CATEGORIES.ASSUMPTIONS,
    description: 'The following list comprises the standard information required for underwriting purposes. Note that further information may be requested during the underwriting process depending on the nature of the transaction, specific circumstances of the borrower and the type of property.',
    stage: UW_STAGES.DIP,
    required: false,
    order: 6,
    conditions: [],
    guidance: '',
    enabled: true,
    pdfOnly: true
  },

  // ==================== BROKER REQUIREMENTS ====================
  {
    id: 'broker_proc_fee_route',
    category: UW_CATEGORIES.BROKER,
    description: 'Confirmation of your proc fee payment route (Mortgage Club, Network, Packager or other).',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 1,
    conditions: [],
    guidance: '',
    enabled: true
  },

  // ==================== BORROWER REQUIREMENTS ====================
  {
    id: 'borrower_als',
    category: UW_CATEGORIES.BORROWER,
    description: 'Asset and Liability Statement for any individual Borrowers, Shareholders or Guarantors (Blank form attached for your ease)',
    stage: UW_STAGES.BOTH,
    required: true,
    order: 1,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_signed_dip',
    category: UW_CATEGORIES.BORROWER,
    description: 'Signed Decision in Principle ("DIP")',
    stage: UW_STAGES.DIP,
    required: true,
    order: 2,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_entity_name',
    category: UW_CATEGORIES.BORROWER,
    description: 'Name of the borrowing entity',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 3,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_address_history',
    category: UW_CATEGORIES.BORROWER,
    description: 'Main residential address for the borrower (individual) or key principal / shareholder (companies) - covers 3 years history',
    stage: UW_STAGES.DIP,
    required: true,
    order: 4,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_contact_details',
    category: UW_CATEGORIES.BORROWER,
    description: 'Contact details for the borrower (name, email, phone no.) and person providing access to the property for valuation',
    stage: UW_STAGES.DIP,
    required: true,
    order: 5,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_proof_of_id',
    category: UW_CATEGORIES.BORROWER,
    description: 'Proof of identity for individual borrowers, guarantors or shareholders >25%: passport or internationally accepted document',
    stage: UW_STAGES.DIP,
    required: true,
    order: 6,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_proof_of_address',
    category: UW_CATEGORIES.BORROWER,
    description: 'Proof of address for individual borrowers, guarantors or shareholders >25%: bank statement or utility bill dated within the last 3 months',
    stage: UW_STAGES.DIP,
    required: true,
    order: 7,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_solicitor_details',
    category: UW_CATEGORIES.BORROWER,
    description: 'Details of the borrower\'s solicitor (Law Society registered firm with at least 2 SRA regulated partners, sole conveyancing practices not accepted)',
    stage: UW_STAGES.DIP,
    required: true,
    order: 8,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_dd_mandate',
    category: UW_CATEGORIES.BORROWER,
    description: 'Completed and signed direct debit mandate',
    stage: UW_STAGES.DIP,
    required: true,
    order: 9,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_loan_purpose',
    category: UW_CATEGORIES.BORROWER,
    description: 'Purpose of loan (purchase / refinance / capital raise)',
    stage: UW_STAGES.DIP,
    required: true,
    order: 10,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_exit_strategy',
    category: UW_CATEGORIES.BORROWER,
    description: 'Proposed exit strategy / source of repayment',
    stage: UW_STAGES.DIP,
    required: true,
    order: 11,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_use_of_funds',
    category: UW_CATEGORIES.BORROWER,
    description: 'Breakdown of use of funds (including cost estimate for any proposed works)',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 12,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_source_of_wealth',
    category: UW_CATEGORIES.BORROWER,
    description: 'Explanation of the borrower\'s source of wealth (i.e. income from employment, investment, inheritance, capital appreciation of assets)',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 13,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_source_of_funds',
    category: UW_CATEGORIES.BORROWER,
    description: 'Confirmation of the source of funds for the transaction',
    stage: UW_STAGES.DIP,
    required: true,
    order: 14,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_source_of_funds_evidence',
    category: UW_CATEGORIES.BORROWER,
    description: 'Supporting evidence for the source of funds for the transaction',
    stage: UW_STAGES.DIP,
    required: true,
    order: 15,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_redemption_statement',
    category: UW_CATEGORIES.BORROWER,
    description: 'Redemption statement from the existing lender/s (if refinance)',
    stage: UW_STAGES.DIP,
    required: true,
    order: 16,
    conditions: [
      { field: 'loan_purpose', operator: CONDITION_OPERATORS.IN, value: ['refinance', 'Refinance', 'REFINANCE', 'capital_raise'] }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_purchase_contract',
    category: UW_CATEGORIES.BORROWER,
    description: 'Copy of the purchase contract (if purchase)',
    stage: UW_STAGES.DIP,
    required: true,
    order: 17,
    conditions: [
      { field: 'loan_purpose', operator: CONDITION_OPERATORS.IN, value: ['purchase', 'Purchase', 'PURCHASE'] }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_product_selection',
    category: UW_CATEGORIES.BORROWER,
    description: 'Confirmation of which product and fee range your client would like to proceed with',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 18,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_occupation',
    category: UW_CATEGORIES.BORROWER,
    description: 'Confirmation of borrower\'s occupation (employed) or business activities (self-employed) and estimated income',
    stage: UW_STAGES.DIP,
    required: true,
    order: 19,
    conditions: [
      { field: 'borrower_type', operator: CONDITION_OPERATORS.CONTAINS, value: 'personal' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'borrower_proof_of_income',
    category: UW_CATEGORIES.BORROWER,
    description: 'Proof of income: three months payslips or bank statements (employed) or latest two years SA302 / tax calculations (self-employed)',
    stage: UW_STAGES.DIP,
    required: true,
    order: 20,
    conditions: [
      { field: 'borrower_type', operator: CONDITION_OPERATORS.CONTAINS, value: 'personal' }
    ],
    guidance: '',
    enabled: true
  },

  // ==================== COMPANY REQUIREMENTS ====================
  {
    id: 'company_incorporation',
    category: UW_CATEGORIES.COMPANY,
    description: 'Certificate of incorporation (UK corporate), trust deed (UK trust) or equivalent incorporation documents (overseas entities)',
    stage: UW_STAGES.DIP,
    required: true,
    order: 1,
    conditions: [
      { field: 'borrower_type', operator: CONDITION_OPERATORS.CONTAINS, value: 'company' }
    ],
    guidance: 'Refer to: https://www.consilium.europa.eu/prado/en/search-by-document-country.html',
    enabled: true
  },
  {
    id: 'company_accounts',
    category: UW_CATEGORIES.COMPANY,
    description: 'Last two years financial accounts and most recent management accounts',
    stage: UW_STAGES.DIP,
    required: true,
    order: 2,
    conditions: [
      { field: 'borrower_type', operator: CONDITION_OPERATORS.CONTAINS, value: 'company' }
    ],
    guidance: '',
    enabled: true
  },

  // ==================== PROPERTY REQUIREMENTS ====================
  {
    id: 'property_particulars',
    category: UW_CATEGORIES.PROPERTY,
    description: 'Property particulars: address, type (HMO, MUFB, Holiday Let etc), planning use, tenure, leasehold term (if applicable)',
    stage: UW_STAGES.BOTH,
    required: true,
    order: 1,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'property_unit_size',
    category: UW_CATEGORIES.PROPERTY,
    description: 'Confirmation the size of each individual unit is 30 sqm or more',
    stage: UW_STAGES.DIP,
    required: true,
    order: 2,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'property_tenancy_status',
    category: UW_CATEGORIES.PROPERTY,
    description: 'Confirmation if the property is currently tenanted or vacant',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 3,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'property_specifications',
    category: UW_CATEGORIES.PROPERTY,
    description: 'Property specifications: internal area and no bedrooms by unit, condition, communal areas, outside space, parking',
    stage: UW_STAGES.DIP,
    required: true,
    order: 4,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'property_tenancy_schedule',
    category: UW_CATEGORIES.PROPERTY,
    description: 'Tenancy schedule detailing tenancy status, monthly rental and lease termination dates by unit',
    stage: UW_STAGES.DIP,
    required: true,
    order: 5,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'property_leases',
    category: UW_CATEGORIES.PROPERTY,
    description: 'Copies of all leases (including commercial and ASTs) relating to the property',
    stage: UW_STAGES.DIP,
    required: true,
    order: 6,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'property_works_schedule',
    category: UW_CATEGORIES.PROPERTY,
    description: 'Schedule of works and costing where any refurbishment or remediation works are proposed',
    stage: UW_STAGES.DIP,
    required: false,
    order: 7,
    conditions: [],
    guidance: '',
    enabled: true
  },

  // ==================== HMO SPECIFIC REQUIREMENTS ====================
  {
    id: 'hmo_bedroom_count',
    category: UW_CATEGORIES.PROPERTY_HMO,
    description: 'Number of bedrooms and communal areas',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 1,
    conditions: [
      { field: 'hmo', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'hmo_room_sizes',
    category: UW_CATEGORIES.PROPERTY_HMO,
    description: 'Room size of each bedroom, kitchen and any other communal areas',
    stage: UW_STAGES.DIP,
    required: true,
    order: 2,
    conditions: [
      { field: 'hmo', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'hmo_planning',
    category: UW_CATEGORIES.PROPERTY_HMO,
    description: 'Evidence the property has the correct planning use to be operated as an HMO and meets Local Authority requirements',
    stage: UW_STAGES.DIP,
    required: true,
    order: 3,
    conditions: [
      { field: 'hmo', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'hmo_licence',
    category: UW_CATEGORIES.PROPERTY_HMO,
    description: 'Where applicable an HMO licence is to be in place prior to completion',
    stage: UW_STAGES.DIP,
    required: true,
    order: 4,
    conditions: [
      { field: 'hmo', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },

  // ==================== HOLIDAY LET SPECIFIC REQUIREMENTS ====================
  {
    id: 'holiday_let_experience',
    category: UW_CATEGORIES.PROPERTY_HOLIDAY_LET,
    description: 'Details of Borrower\'s previous experience of managing holiday lets and track record',
    stage: UW_STAGES.DIP,
    required: true,
    order: 1,
    conditions: [
      { field: 'holiday', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'holiday_let_planning',
    category: UW_CATEGORIES.PROPERTY_HOLIDAY_LET,
    description: 'Evidence the property has the correct planning use to be operated as a holiday let',
    stage: UW_STAGES.DIP,
    required: true,
    order: 2,
    conditions: [
      { field: 'holiday', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'holiday_let_bank_statements',
    category: UW_CATEGORIES.PROPERTY_HOLIDAY_LET,
    description: 'Copies of last 12 months\' bank statements (if available) evidencing rental received',
    stage: UW_STAGES.DIP,
    required: false,
    order: 3,
    conditions: [
      { field: 'holiday', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'holiday_let_forecast',
    category: UW_CATEGORIES.PROPERTY_HOLIDAY_LET,
    description: '12 month rental forecast (to be verified via valuer / estate agents at a later stage)',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 4,
    conditions: [
      { field: 'holiday', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'holiday_let_seasonal_income',
    category: UW_CATEGORIES.PROPERTY_HOLIDAY_LET,
    description: 'High, medium and low season rental income figures (lending based on average confirmed by valuer at 30 weeks occupancy)',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 5,
    conditions: [
      { field: 'holiday', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'holiday_let_ast_rental',
    category: UW_CATEGORIES.PROPERTY_HOLIDAY_LET,
    description: 'Forecast achievable rental amount based on a single AST letting',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 6,
    conditions: [
      { field: 'holiday', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },

  // ==================== MUFB SPECIFIC REQUIREMENTS ====================
  {
    id: 'mufb_unit_breakdown',
    category: UW_CATEGORIES.PROPERTY_MUFB,
    description: 'Breakdown of unit types (residential, office, retail etc.)',
    stage: UW_STAGES.INDICATIVE,
    required: true,
    order: 1,
    conditions: [
      { field: 'mufb', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'mufb_planning_use',
    category: UW_CATEGORIES.PROPERTY_MUFB,
    description: 'Confirmation of planning use for each unit',
    stage: UW_STAGES.DIP,
    required: true,
    order: 2,
    conditions: [
      { field: 'mufb', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },
  {
    id: 'mufb_value_rental_breakdown',
    category: UW_CATEGORIES.PROPERTY_MUFB,
    description: 'Breakdown of value and rental income (forecast or actual if tenanted) by individual unit',
    stage: UW_STAGES.DIP,
    required: true,
    order: 3,
    conditions: [
      { field: 'mufb', operator: CONDITION_OPERATORS.NOT_EQUALS, value: 'No' }
    ],
    guidance: '',
    enabled: true
  },

  // ==================== ADDITIONAL REQUIREMENTS ====================
  {
    id: 'additional_aml_high_risk',
    category: UW_CATEGORIES.ADDITIONAL,
    description: 'Use this section for any additional AML items for Med / High risk (e.g. second Proof of address)',
    stage: UW_STAGES.DIP,
    required: false,
    order: 1,
    conditions: [],
    guidance: '',
    enabled: true
  },
  {
    id: 'additional_rental_bank_statements',
    category: UW_CATEGORIES.ADDITIONAL,
    description: 'Use this section if bank statements are required specifically to verify receipt of rental income',
    stage: UW_STAGES.DIP,
    required: false,
    order: 2,
    conditions: [],
    guidance: '',
    enabled: true
  }
];

/**
 * localStorage key for UW requirements overrides
 */
export const LOCALSTORAGE_UW_REQUIREMENTS_KEY = 'app.uw.requirements.v1';

/**
 * Evaluate conditions against quote/DIP data
 * @param {Array} conditions - Array of condition objects
 * @param {Object} data - Quote or DIP data object
 * @returns {boolean} - Whether all conditions are met (show the requirement)
 */
export function evaluateConditions(conditions, data) {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always show
  }

  return conditions.every(condition => {
    const { field, operator, value } = condition;
    
    // Try to get the field value directly first (using exact question_key from DB)
    let fieldValue = data?.[field];
    
    // Debug logging (can be removed in production)
    // console.log(`[UW] Checking field: "${field}", found value:`, fieldValue, 'in data keys:', Object.keys(data || {}));
    
    // Normalize field value for comparison (handle object with option_label from criteria table)
    // The answers from BTL Calculator come as objects like { option_label: 'Up to 6 beds', tier: 2 }
    const normalizedValue = typeof fieldValue === 'object' && fieldValue?.option_label 
      ? fieldValue.option_label 
      : fieldValue;
    
    // Convert to lowercase string for case-insensitive comparison
    const fieldStr = (normalizedValue || '').toString().toLowerCase();
    const valueStr = (value || '').toString().toLowerCase();

    switch (operator) {
      case CONDITION_OPERATORS.EQUALS:
        return fieldStr === valueStr;
      
      case CONDITION_OPERATORS.NOT_EQUALS:
        return fieldStr !== valueStr;
      
      case CONDITION_OPERATORS.IN:
        if (Array.isArray(value)) {
          return value.some(v => fieldStr === v.toString().toLowerCase());
        }
        return false;
      
      case CONDITION_OPERATORS.NOT_IN:
        if (Array.isArray(value)) {
          return !value.some(v => fieldStr === v.toString().toLowerCase());
        }
        return true;
      
      case CONDITION_OPERATORS.GREATER_THAN:
        return Number(normalizedValue) > Number(value);
      
      case CONDITION_OPERATORS.LESS_THAN:
        return Number(normalizedValue) < Number(value);
      
      case CONDITION_OPERATORS.EXISTS:
        return normalizedValue !== null && normalizedValue !== undefined && normalizedValue !== '';
      
      case CONDITION_OPERATORS.NOT_EXISTS:
        return normalizedValue === null || normalizedValue === undefined || normalizedValue === '';
      
      case CONDITION_OPERATORS.CONTAINS:
        return fieldStr.includes(valueStr);
      
      default:
        return true;
    }
  });
}

/**
 * Filter requirements by stage
 * @param {Array} requirements - Full requirements list
 * @param {string} stage - 'DIP', 'Indicative', or 'Both'
 * @returns {Array} - Filtered requirements
 */
export function filterByStage(requirements, stage) {
  if (!stage || stage === 'Both' || stage === 'all') {
    // If stage is 'Both' or 'all', return all requirements
    return requirements;
  }
  
  return requirements.filter(req => {
    // Show if requirement stage is 'Both' or matches the requested stage
    if (req.stage === UW_STAGES.BOTH) return true;
    return req.stage === stage;
  });
}

/**
 * Filter requirements by conditions (based on quote/DIP data)
 * @param {Array} requirements - Requirements list
 * @param {Object} data - Quote or DIP data
 * @returns {Array} - Filtered requirements with conditions met
 */
export function filterByConditions(requirements, data) {
  return requirements.filter(req => {
    if (!req.enabled) return false;
    return evaluateConditions(req.conditions, data);
  });
}

/**
 * Get applicable requirements for a given stage and quote data
 * @param {Array} requirements - Full requirements list
 * @param {string} stage - 'DIP' or 'Indicative'
 * @param {Object} data - Quote or DIP data for condition evaluation
 * @returns {Array} - Applicable requirements grouped by category
 */
export function getApplicableRequirements(requirements, stage, data) {
  const filtered = filterByConditions(filterByStage(requirements, stage), data);
  
  // Group by category
  const grouped = {};
  filtered.forEach(req => {
    if (!grouped[req.category]) {
      grouped[req.category] = [];
    }
    grouped[req.category].push(req);
  });

  // Sort each group by order
  Object.keys(grouped).forEach(cat => {
    grouped[cat].sort((a, b) => a.order - b.order);
  });

  return grouped;
}

/**
 * Get category display order
 */
export const CATEGORY_ORDER = [
  UW_CATEGORIES.ASSUMPTIONS,
  UW_CATEGORIES.BROKER,
  UW_CATEGORIES.BORROWER,
  UW_CATEGORIES.COMPANY,
  UW_CATEGORIES.PROPERTY,
  UW_CATEGORIES.PROPERTY_HMO,
  UW_CATEGORIES.PROPERTY_MUFB,
  UW_CATEGORIES.PROPERTY_HOLIDAY_LET,
  UW_CATEGORIES.ADDITIONAL
];
