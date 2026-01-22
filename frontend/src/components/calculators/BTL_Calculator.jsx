import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import SalesforceIcon from '../shared/SalesforceIcon';
import '../../styles/slds.css';
import '../../styles/Calculator.scss';
import SaveQuoteButton from './SaveQuoteButton';
import IssueDIPModal from '../modals/IssueDIPModal';
import IssueQuoteModal from '../modals/IssueQuoteModal';
import CalculatorResultsPlaceholders from './CalculatorResultsPlaceholders';
import SliderResultRow from '../calculator/SliderResultRow';
import EditableResultRow from '../calculator/EditableResultRow';
import ClientDetailsSection from '../calculator/shared/ClientDetailsSection';
import ActionButtons from '../calculator/ActionButtons';
import RangeToggle from '../calculator/RangeToggle';
import TopFiltersSection from '../calculator/btl/TopFiltersSection';
import useBrokerSettings from '../../hooks/calculator/useBrokerSettings';
import { useResultsVisibility } from '../../hooks/useResultsVisibility';
import { useResultsRowOrder } from '../../hooks/useResultsRowOrder';
import { useResultsLabelAlias } from '../../hooks/useResultsLabelAlias';
import { getQuote, upsertQuoteData, saveUWChecklistState, loadUWChecklistState } from '../../utils/quotes';
import { downloadDIPPDF } from '../../utils/generateDIPPDF';
import { downloadQuotePDF } from '../../utils/generateQuotePDF';
import { parseNumber, formatCurrency, formatPercent } from '../../utils/calculator/numberFormatting';
import { computeTierFromAnswers } from '../../utils/calculator/rateFiltering';
import { computeBTLLoan } from '../../utils/btlCalculationEngine';
import CollapsibleSection from '../calculator/CollapsibleSection';
import UWRequirementsChecklist from '../shared/UWRequirementsChecklist';
import BTLCriteriaSection from '../calculator/btl/BTLCriteriaSection';
import BTLLoanDetailsSection from '../calculator/btl/BTLLoanDetailsSection';
import BTLProductSection from '../calculator/btl/BTLProductSection';
import { 
  PRODUCT_TYPES_LIST as DEFAULT_PRODUCT_TYPES_LIST, 
  FEE_COLUMNS as DEFAULT_FEE_COLUMNS, 
  LOCALSTORAGE_CONSTANTS_KEY, 
  FLAT_ABOVE_COMMERCIAL_RULE as DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
  BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS
} from '../../config/constants';

/**
 * Parse rate metadata from product name for historical quote accuracy
 * Example: "2yr Fix" → { initial_term: 24, revert_rate_type: "MVR" }
 */
function parseRateMetadata(rate) {
  const productName = rate.product || rate.product_name || '';
  
  // Extract term from product name (e.g., "2yr", "3yr", "5yr")
  const termMatch = productName.match(/(\d+)\s*yr/i);
  const initialTerm = termMatch ? parseInt(termMatch[1]) * 12 : null;
  
  // Default full term is 25 years (300 months) for BTL
  const fullTerm = 300;
  
  // Determine revert rate type from product name
  let revertRateType = 'MVR'; // Default to MVR
  if (productName.toLowerCase().includes('tracker')) {
    revertRateType = rate.revert || 'Tracker';
  } else if (productName.toLowerCase().includes('variable')) {
    revertRateType = 'SVR';
  } else if (rate.revert) {
    revertRateType = rate.revert;
  }
  
  return {
    initial_term: initialTerm,
    full_term: fullTerm,
    revert_rate_type: revertRateType,
  };
}

export default function BTLcalculator({ 
  initialQuote = null,
  publicMode = false,
  fixedProductScope = null,
  fixedRange = null,
  allowedScopes = null // Optional: filter which product scopes are available in dropdown
}) {
  const { supabase } = useSupabase();
  const { canEditCalculators, token } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
    const navigate = useNavigate();
  const navQuote = location && location.state ? location.state.loadQuote : null;
  const effectiveInitialQuote = initialQuote || navQuote;
  
  // Check if user has permission to edit calculator fields
  // Access levels 1-3 can edit, level 4 (Underwriter) is read-only
  // In public mode, users can edit but product scope is locked
  const isReadOnly = !publicMode && !canEditCalculators();
  
  // Use custom hook for broker settings - pass 'btl' as calculator type
  const brokerSettings = useBrokerSettings(effectiveInitialQuote, 'btl');
  
  // Range toggle state (Core or Specialist) - moved before hooks that depend on it
  // In public mode, use fixedRange if provided
  const [selectedRange, setSelectedRange] = useState(fixedRange || 'specialist');
  
  // Use custom hook for results table visibility - dynamically switch based on selected range
  const calculatorTypeForSettings = selectedRange === 'core' ? 'core' : 'btl';
  const { isRowVisible } = useResultsVisibility(calculatorTypeForSettings);
  
  // Use custom hook for results table row ordering - dynamically switch based on selected range
  const { getOrderedRows } = useResultsRowOrder(calculatorTypeForSettings);
  
  // Use custom hook for results table label aliases
  const { getLabel } = useResultsLabelAlias('btl');
  
  const [allCriteria, setAllCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  // This Calculator is restricted to BTL criteria only per user's request
  const criteriaSet = 'BTL';
  // In public mode, use fixedProductScope if provided
  const [productScope, setProductScope] = useState(fixedProductScope || '');
  const [retentionChoice, setRetentionChoice] = useState('No'); // default to 'No' to avoid 'Any' behaviour on load
  const [retentionLtv, setRetentionLtv] = useState('75'); // '65' or '75'
  const [topSlicing, setTopSlicing] = useState('');
  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipContent, setTipContent] = useState('');

  // Collapsible section states
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);
  const [loanDetailsExpanded, setLoanDetailsExpanded] = useState(false);
  const [productConfigExpanded, setProductConfigExpanded] = useState(true);
  const [clientDetailsExpanded, setClientDetailsExpanded] = useState(true);
  
  // Quote id/ref for UI
  const [currentQuoteId, setCurrentQuoteId] = useState(effectiveInitialQuote?.id || null);
  const [currentQuoteRef, setCurrentQuoteRef] = useState(effectiveInitialQuote?.reference_number || null);
  // Store full quote data for Update Quote modal (name, borrower info, notes, etc.)
  const [currentQuoteData, setCurrentQuoteData] = useState(effectiveInitialQuote || null);

  // Property & Product inputs
  const [propertyValue, setPropertyValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  // (Removed additional propertyType state - productScope drives product lists)
  // normalize loanType values to match select option values used in the JSX
  const [loanType, setLoanType] = useState(''); // Start with empty - user must select
  const [specificGrossLoan, setSpecificGrossLoan] = useState('');
  const [specificNetLoan, setSpecificNetLoan] = useState('');
  const [maxLtvInput, setMaxLtvInput] = useState(75);
  const [productType, setProductType] = useState('');
  // Fees: removed inline fee UI; Top slicing input added instead
  const [relevantRates, setRelevantRates] = useState([]);

  // Slider controls for results - per-column state
  const [rolledMonthsPerColumn, setRolledMonthsPerColumn] = useState({});
  const [deferredInterestPerColumn, setDeferredInterestPerColumn] = useState({});
  
  // Track whether manual mode has been activated (stays true until reset)
  const [manualModeActivePerColumn, setManualModeActivePerColumn] = useState({});
  
  // Optimized values from calculation engine - per-column state
  const [optimizedRolledPerColumn, setOptimizedRolledPerColumn] = useState({});
  const [optimizedDeferredPerColumn, setOptimizedDeferredPerColumn] = useState({});
  
  // Ref to collect optimized values during render without causing re-renders
  const optimizedValuesRef = useRef({ rolled: {}, deferred: {} });
  
  // Track whether we loaded results from a saved quote (skip rates_flat fetch if so)
  const loadedFromSavedQuoteRef = useRef(false);

  // Editable rate and product fee overrides - per-column state
  const [ratesOverrides, setRatesOverrides] = useState({});
  const [productFeeOverrides, setProductFeeOverrides] = useState({});

  // DIP Modal state
  const [dipModalOpen, setDipModalOpen] = useState(false);
  const [dipData, setDipData] = useState({});
  const [selectedFeeTypeForDip, setSelectedFeeTypeForDip] = useState('');
  const [filteredRatesForDip, setFilteredRatesForDip] = useState([]);

  // Quote Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({});

  // UW Requirements checklist state
  const [uwChecklistExpanded, setUwChecklistExpanded] = useState(false);
  const [uwCheckedItems, setUwCheckedItems] = useState({});
  const [uwCustomRequirements, setUwCustomRequirements] = useState(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: e } = await supabase
          .from('criteria_config_flat')
          .select('*');
        if (e) throw e;
        // Debug log rows count
         
        setAllCriteria(data || []);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [supabase]);

  // helper to format currency inputs with thousand separators (display-only)
  const formatCurrencyInput = (v) => {
    if (v === undefined || v === null || v === '') return '';
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n.toLocaleString('en-GB') : '';
  };

  useEffect(() => {
    // build question map based on BTL criteriaSet and selected productScope
    const normalizeStr = (s) => (s || '').toString().trim().toLowerCase();
    const filtered = allCriteria.filter((r) => {
      if (!r) return false;
      // Only include rows belonging to the BTL criteria set and matching the product_scope
      const csMatch = normalizeStr(r.criteria_set) === 'btl';
      const psMatch = productScope ? normalizeStr(r.product_scope) === normalizeStr(productScope) : true;
      return csMatch && psMatch;
    });

    const map = {};
    filtered.forEach((row) => {
      const key = row.question_key || row.question || 'unknown';
      if (!map[key]) map[key] = { label: row.question_label || key, options: [], infoTip: '', displayOrder: undefined };
      // prefer explicit info_tip field; fall back to helper field if present
      if (!map[key].infoTip && (row.info_tip || row.helper)) {
        map[key].infoTip = row.info_tip || row.helper || '';
      }
      // capture a numeric display_order (admin-controlled ordering). Use the first defined value for the question.
      if (map[key].displayOrder === undefined && (row.display_order !== undefined && row.display_order !== null)) {
        const parsed = Number(row.display_order);
        map[key].displayOrder = Number.isFinite(parsed) ? parsed : undefined;
      }
      map[key].options.push({
        id: row.id,
        option_label: row.option_label,
        tier: row.tier,
        raw: row,
      });
    });

    // Sort options by tier ascending, then by id as tiebreaker for same tier
    Object.keys(map).forEach((k) => {
      map[k].options.sort((a, b) => {
        const tierDiff = (Number(a.tier) || 0) - (Number(b.tier) || 0);
        if (tierDiff !== 0) return tierDiff;
        // Same tier: sort by id (database row order) to maintain consistent order
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      });
    });

  setQuestions(map);
  // reset answers ONLY if there's no initialQuote (i.e., new quote, not loading existing)
  if (!effectiveInitialQuote) {
      const starting = {};
      Object.keys(map).forEach((k) => {
        // default to first option
        starting[k] = map[k].options[0] || null;
      });
      setAnswers(starting);
    }
  }, [allCriteria, productScope, effectiveInitialQuote]);

  // Auto-select a product scope when data loads if none selected
  useEffect(() => {
    // Skip auto-setting defaults if we're loading from a saved quote
    if (effectiveInitialQuote) return;
    
    if (!productScope) {
      const available = Array.from(new Set(allCriteria.map((r) => r.product_scope).filter(Boolean)));
      if (available.length > 0) {
        setProductScope(available[0]);
      }
    }
    // apply any constants overrides from localStorage for product lists (use productScope as the key)
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.productLists && productScope) {
          if (parsed.productLists[productScope] && parsed.productLists[productScope].length > 0) {
            setProductType(parsed.productLists[productScope][0]);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, [allCriteria, productScope, effectiveInitialQuote]);

  // If an initialQuote is provided, populate fields from the database structure
  useEffect(() => {
    try {
      if (!effectiveInitialQuote) return;
      
      // New structure: data is directly on the quote object (no nested payload)
      const quote = effectiveInitialQuote;
      
      // Store quote ID and DIP data for Issue DIP modal
      if (quote.id) setCurrentQuoteId(quote.id);
      
      // Check if any DIP-related field exists to load DIP data
      const hasDipData = quote.commercial_or_main_residence || quote.dip_date || quote.dip_expiry_date ||
                         quote.guarantor_name || quote.lender_legal_fee || quote.number_of_applicants ||
                         quote.security_properties || quote.fee_type_selection || quote.title_insurance ||
                         quote.funding_line || quote.product_range || quote.dip_status;
      
      if (hasDipData) {
        // Map 'Company' to 'Corporate' for backward compatibility
        const applicantType = quote.applicant_type === 'Company' ? 'Corporate' : quote.applicant_type;
        setDipData({
          commercial_or_main_residence: quote.commercial_or_main_residence,
          funding_line: quote.funding_line,
          dip_date: quote.dip_date,
          dip_expiry_date: quote.dip_expiry_date,
          applicant_type: applicantType,
          guarantor_name: quote.guarantor_name,
          company_number: quote.company_number,
          title_number: quote.title_number,
          lender_legal_fee: quote.lender_legal_fee,
          number_of_applicants: quote.number_of_applicants,
          overpayments_percent: quote.overpayments_percent,
          security_properties: quote.security_properties,
          shareholders: quote.shareholders,
          fee_type_selection: quote.fee_type_selection,
          dip_status: quote.dip_status,
          title_insurance: quote.title_insurance,
          product_range: quote.product_range
        });
      }
      
      // Set flag early to prevent productType from being overridden by useEffect
      loadedFromSavedQuoteRef.current = true;
      
      if (quote.property_value != null) setPropertyValue(formatCurrencyInput(quote.property_value));
      if (quote.monthly_rent != null) setMonthlyRent(formatCurrencyInput(quote.monthly_rent));
      if (quote.product_type) setProductType(quote.product_type);
      if (quote.product_scope) setProductScope(quote.product_scope);
      if (quote.specific_net_loan != null) setSpecificNetLoan(formatCurrencyInput(quote.specific_net_loan));
      if (quote.specific_gross_loan != null) setSpecificGrossLoan(formatCurrencyInput(quote.specific_gross_loan));
      if (quote.loan_calculation_requested) setLoanType(quote.loan_calculation_requested);
      if (quote.retention_ltv != null) setRetentionLtv(String(quote.retention_ltv));
      if (quote.retention_choice) setRetentionChoice(quote.retention_choice);
      if (quote.top_slicing != null) setTopSlicing(String(quote.top_slicing));
      if (quote.target_ltv != null) setMaxLtvInput(Number(quote.target_ltv));
      if (quote.selected_range) setSelectedRange(quote.selected_range);
      
      // Note: Client details and fee settings are loaded by useBrokerSettings hook
      
      // Load calculated results if available (from quote_results table)
      if (quote.results && Array.isArray(quote.results) && quote.results.length > 0) {
        // Map database results back to the format expected by the calculator
        const loadedRates = quote.results.map(result => ({
          product_fee: result.fee_column,
          gross_loan: result.gross_loan,
          net_loan: result.net_loan,
          ltv: result.ltv_percentage,
          net_ltv: result.net_ltv,
          property_value: result.property_value,
          icr: result.icr,
          initial_rate: result.initial_rate,
          rate: result.initial_rate,
          pay_rate: result.pay_rate,
          revert_rate: result.revert_rate,
          revert_rate_dd: result.revert_rate_dd,
          full_rate: result.full_rate,
          aprc: result.aprc,
          product_fee_percent: result.product_fee_percent,
          product_fee_pounds: result.product_fee_pounds,
          admin_fee: result.admin_fee,
          broker_client_fee: result.broker_client_fee,
          broker_commission_proc_fee_percent: result.broker_commission_proc_fee_percent,
          broker_commission_proc_fee_pounds: result.broker_commission_proc_fee_pounds,
          commitment_fee_pounds: result.commitment_fee_pounds,
          exit_fee: result.exit_fee,
          monthly_interest_cost: result.monthly_interest_cost,
          rolled_months: result.rolled_months,
          rolled_months_interest: result.rolled_months_interest,
          deferred_interest_percent: result.deferred_interest_percent,
          deferred_interest_pounds: result.deferred_interest_pounds,
          serviced_interest: result.serviced_interest,
          direct_debit: result.direct_debit,
          erc: result.erc,
          rent: result.rent,
          top_slicing: result.top_slicing,
          nbp: result.nbp,
          total_cost_to_borrower: result.total_cost_to_borrower,
          total_loan_term: result.total_loan_term,
          product_name: result.product_name,
          product: result.product_name,
        }));
        setRelevantRates(loadedRates);
        // Flag already set earlier to prevent productType override
      }
      
      // Load criteria answers if available
      if (quote.criteria_answers) {
        try {
          const answersData = typeof quote.criteria_answers === 'string' 
            ? JSON.parse(quote.criteria_answers) 
            : quote.criteria_answers;
          if (answersData) setAnswers(answersData);
        } catch (e) {
        }
      }
      
      // Load overrides if available
      if (quote.rates_overrides) {
        try {
          const overridesData = typeof quote.rates_overrides === 'string' 
            ? JSON.parse(quote.rates_overrides) 
            : quote.rates_overrides;
          if (overridesData) setRatesOverrides(overridesData);
        } catch (e) {
        }
      }
      
      if (quote.product_fee_overrides) {
        try {
          const overridesData = typeof quote.product_fee_overrides === 'string' 
            ? JSON.parse(quote.product_fee_overrides) 
            : quote.product_fee_overrides;
          if (overridesData) setProductFeeOverrides(overridesData);
        } catch (e) {
        }
      }
      
      if (quote.rolled_months_per_column) {
        try {
          const columnData = typeof quote.rolled_months_per_column === 'string' 
            ? JSON.parse(quote.rolled_months_per_column) 
            : quote.rolled_months_per_column;
          if (columnData) setRolledMonthsPerColumn(columnData);
        } catch (e) {
        }
      }
      
      if (quote.deferred_interest_per_column) {
        try {
          const columnData = typeof quote.deferred_interest_per_column === 'string' 
            ? JSON.parse(quote.deferred_interest_per_column) 
            : quote.deferred_interest_per_column;
          if (columnData) setDeferredInterestPerColumn(columnData);
        } catch (e) {
        }
      }
    } catch (e) {
      // ignore load errors
       
    }
  }, [effectiveInitialQuote]);

  // Load UW checklist state when quote changes
  useEffect(() => {
    async function loadChecklistState() {
      if (!currentQuoteId || !token) return;
      try {
        const data = await loadUWChecklistState(currentQuoteId, 'both', token);
        const raw = data && data.checked_items ? data.checked_items : {};

        let normalized = {};
        if (Array.isArray(raw)) {
          raw.forEach((id) => {
            if (id) normalized[id] = true;
          });
        } else if (raw && typeof raw === 'object') {
          Object.entries(raw).forEach(([id, v]) => {
            if (id && v === true) normalized[id] = true;
          });
        }

        setUwCheckedItems(normalized);
        
        // Load custom requirements if they exist
        if (data && data.custom_requirements) {
          setUwCustomRequirements(data.custom_requirements);
        } else {
          setUwCustomRequirements(null);
        }
      } catch (e) {
        // Silently fail - checklist will start empty
        setUwCustomRequirements(null);
      }
    }
    loadChecklistState();
  }, [currentQuoteId, token]);

  // Auto-save UW checklist state when items change (debounced)
  useEffect(() => {
    if (!currentQuoteId || !token) return;
    if (!uwCheckedItems || typeof uwCheckedItems !== 'object') return;
    if (Object.keys(uwCheckedItems).length === 0) return;

    const payload = { 
      checked_items: { ...uwCheckedItems },
      custom_requirements: uwCustomRequirements
    };

    const timeoutId = setTimeout(() => {
      try {
        Promise.resolve()
          .then(() => {
            return saveUWChecklistState(currentQuoteId, payload.checked_items, 'both', token, payload.custom_requirements);
          })
          .catch((error) => {
            console.error('[BTL] autosave error', error);
            // Ignore save errors; do not crash UI
          });
      } catch {
        // Absolute safety: never let this effect crash React
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [currentQuoteId, uwCheckedItems, uwCustomRequirements, token]);

  // Ensure productType defaults to the first product for the selected productScope
  useEffect(() => {
    if (!productScope) return;
    
    // Skip auto-setting productType if we just loaded from a saved quote
    // The saved quote already has the correct productType value
    // Check currentQuoteData instead of effectiveInitialQuote to allow auto-selection after New Quote
    if (loadedFromSavedQuoteRef.current || (effectiveInitialQuote && currentQuoteData)) {
      return;
    }
    
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const list = (parsed && parsed.productLists && parsed.productLists[productScope])
        || DEFAULT_PRODUCT_TYPES_LIST[productScope]
        || DEFAULT_PRODUCT_TYPES_LIST['Residential']
        || [];
      if (list.length > 0) {
        // only set if not set or current value not in list
        if (!productType || !list.includes(productType)) setProductType(list[0]);
      }
    } catch (e) {
      const list = DEFAULT_PRODUCT_TYPES_LIST[productScope] || DEFAULT_PRODUCT_TYPES_LIST['Residential'] || [];
      if (list.length > 0 && (!productType || !list.includes(productType))) setProductType(list[0]);
    }
  }, [productScope, currentQuoteData]);

  // compute tier when answers change
  const currentTier = computeTierFromAnswers(answers);

  // Fetch relevant rates whenever productScope, currentTier or productType changes
  useEffect(() => {
    if (!supabase) return;
    
    // Skip fetching from rates_flat if we loaded results from a saved quote
    // The saved quote already has computed results; fetching raw rates would overwrite them
    if (loadedFromSavedQuoteRef.current) {
      // Reset the flag so future changes (e.g., changing criteria) will fetch fresh rates
      loadedFromSavedQuoteRef.current = false;
      return;
    }
    
    async function fetchRelevant() {
      // Do not attempt to fetch/filter rates until a productType is selected.
      // On initial page load productType can be empty which previously allowed all products through.
      if (!productType) {
        setRelevantRates([]);
        return;
      }
      try {
        const { data, error } = await supabase.from('rates_flat').select('*');
        if (error) throw error;
  // Filter client-side to avoid DB column mismatch errors.
  // We'll build matched using an explicit loop so we can collect debug samples when nothing matches.
  const debugSamples = [];
  const matched = [];
  const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const swapYrYear = (s) => (s || '').toString().replace(/yr/g, 'year').replace(/year/g, 'yr');
  const swapFixFixed = (s) => (s || '').toString().replace(/fix/g, 'fixed').replace(/fixed/g, 'fix');

  for (let i = 0; i < (data || []).length; i++) {
    const r = data[i];
    // tolerant tier matching
    const rtRaw = r.tier;
    const rtNumRaw = Number(rtRaw);
    let rtNum = Number.isFinite(rtNumRaw) ? rtNumRaw : NaN;
    if (Number.isNaN(rtNum)) {
      const m = (rtRaw || '').toString().match(/(\d+)/);
      rtNum = m ? Number(m[1]) : NaN;
    }
    const ct = Number(currentTier);
    const tierMatch = (!Number.isNaN(rtNum) && !Number.isNaN(ct)) ? (rtNum === ct) : (String(rtRaw).toLowerCase() === String(currentTier).toString().toLowerCase());

    // product matching: stricter token-based matching (year + type), fallback to normalized substring
    const productValRaw = (r.product || '').toString();
    const normRow = normalize(productValRaw);
    const normSelected = normalize(productType || '');

    const parseProduct = (s) => {
      const t = (s || '').toString().toLowerCase();
      const yearsMatch = t.match(/(\d+)\s*(yr|year)?/); // capture leading digits
      const years = yearsMatch ? yearsMatch[1] : null;
      let type = null;
      if (/track/.test(t)) type = 'tracker';
      else if (/fix/.test(t)) type = 'fix';
      else if (/variable/.test(t)) type = 'variable';
      return { years, type };
    };

    const selTokens = parseProduct(productType || '');
    const rowTokens = parseProduct(productValRaw || '');
    let productMatch = true;
    if (productType) {
      // If both have a year token, require years to match
      if (selTokens.years && rowTokens.years) {
        productMatch = selTokens.years === rowTokens.years;
      }
      // If both have a type token (fix/tracker), require type to match
      if (productMatch && selTokens.type && rowTokens.type) {
        productMatch = selTokens.type === rowTokens.type;
      }
      // If we couldn't confidently parse tokens, fallback to normalized substring equality
      if (!selTokens.years && !selTokens.type) {
        productMatch = normRow === normSelected || normRow.includes(normSelected) || normSelected.includes(normRow);
      }
    }

    // scope matching
    const scopeVal = ((r.property || r.product_scope || r.property_scope || r.set_key || '')).toString().toLowerCase();
    let scopeMatch = true;
    if (productScope) {
      const psLower = productScope.toString().toLowerCase();
      // If user selected Commercial, do NOT include Semi-Commercial variants (treat them separately).
      // i.e. match rows that contain 'commercial' but exclude rows that specifically indicate 'semi-commercial'.
      if (psLower === 'commercial') {
        scopeMatch = (scopeVal.includes('commercial') && !/semi[-_ ]?commercial/.test(scopeVal));
      } else {
        scopeMatch = scopeVal === psLower || scopeVal.includes(psLower);
      }
    }

    // retention matching: more robust detection
    const detectRetention = (row) => {
      // probe for different possible column names
      const retentionKeys = ['is_retention', 'isRetention', 'retention', 'retained', 'is_retained'];
      let v = null;
      for (const k of retentionKeys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
          v = row[k];
          break;
        }
      }

      if (v === null) {
        // if no explicit retention column, fall back to scanning product text
        const productText = (row.product || '').toString().toLowerCase();
        return productText.includes('retention');
      }

      // handle boolean, numeric or string encodings
      const s = String(v).toLowerCase().trim();
      return v === true || ['true', 'yes', '1', 'y', 't'].includes(s);
    };

    const isRetentionRow = detectRetention(r);
    // By default assume row passes retention/LTV checks
    let passesRetentionAndLtv = true;

    // Read row max ltv once
    const rowMaxLtv = Number(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? 0);

    // Special-case override: configurable Flat-above-commercial rule from Constants UI/localStorage.
    // Read overrides from localStorage, fall back to default constant.
    let flatAboveCommercialOverrideObj = DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE;
    try {
      const rawOverrides = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      if (rawOverrides) {
        const parsed = JSON.parse(rawOverrides);
        if (parsed && parsed.flatAboveCommercialRule) flatAboveCommercialOverrideObj = parsed.flatAboveCommercialRule;
      }
    } catch (e) {
      // ignore parse issues and use default
    }

    const psLower = (productScope || '').toString().toLowerCase();
    const enabled = !!flatAboveCommercialOverrideObj && flatAboveCommercialOverrideObj.enabled;
    let flatOverrideMatches = false;
    if (enabled) {
      const matcher = (flatAboveCommercialOverrideObj.scopeMatcher || '').toString().toLowerCase();
      const tokens = matcher.split(',').map((s) => s.trim()).filter(Boolean);
      if (tokens.length === 0) {
        flatOverrideMatches = matcher.length > 0 && psLower.includes(matcher);
      } else {
        flatOverrideMatches = tokens.every((t) => psLower.includes(t));
      }
    }

    if (flatOverrideMatches) {
      const ctNum = Number(currentTier);
      const tier2Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['2']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2']);
      const tier3Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['3']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3']);
      if (!Number.isFinite(rowMaxLtv) || rowMaxLtv <= 0) {
        passesRetentionAndLtv = false;
      } else if (ctNum === 2) {
        passesRetentionAndLtv = rowMaxLtv <= tier2Val;
      } else if (ctNum === 3) {
        // interpret tier3 as values greater than tier2 up to tier3
        passesRetentionAndLtv = rowMaxLtv > (tier2Val || 0) && rowMaxLtv <= tier3Val;
      } else {
        passesRetentionAndLtv = true;
      }
    } else {
      // Normal retention filtering behavior.
      if (retentionChoice === 'Yes') {
        // Per user spec: if retention is 'Yes', the row MUST be a retention row.
        if (!isRetentionRow) {
          passesRetentionAndLtv = false;
        } else {
          // If it IS a retention row, THEN we apply LTV gating.
          const selectedLtv = Number(retentionLtv);
          if (Number.isFinite(rowMaxLtv) && rowMaxLtv > 0) {
            if (selectedLtv === 65) {
              passesRetentionAndLtv = rowMaxLtv <= 65;
            } else if (selectedLtv === 75) {
              // For 75% LTV, the range is typically >65% and <=75%
              passesRetentionAndLtv = rowMaxLtv > 65 && rowMaxLtv <= 75;
            } else {
              // Fallback for any other LTV, though UI is fixed to 65/75
              passesRetentionAndLtv = rowMaxLtv <= selectedLtv;
            }
          } else {
            // If a retention row has no max_ltv, it cannot pass the LTV check.
            passesRetentionAndLtv = false;
          }
        }
      } else if (retentionChoice === 'No') {
        // If retention is 'No', the row must NOT be a retention row.
        passesRetentionAndLtv = !isRetentionRow;
      }
    }

    if (i < 8) {
      debugSamples.push({
        product: productValRaw,
        normRow,
        productType,
        normSelected,
        tierRaw: rtRaw,
        tierMatch,
        scopeVal,
        scopeMatch,
        isRetentionRow,
        passesRetentionAndLtv,
        max_ltv: r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? null,
      });
    }

    if (tierMatch && productMatch && scopeMatch && passesRetentionAndLtv) matched.push(r);
  }
        // Deduplicate exact-duplicate rows (some CSV imports may create repeated rows).
        const unique = {};
        (matched || []).forEach((r) => {
          const key = `${r.product || ''}||${r.rate || ''}||${r.property || ''}||${r.tier || ''}||${r.product_fee || ''}`;
          if (!unique[key]) unique[key] = r;
        });
        const deduped = Object.values(unique);
        // Try to sort by numeric rate if possible (ascending)
        deduped.sort((a, b) => {
          const na = Number((a.rate || '').toString().replace('%', ''));
          const nb = Number((b.rate || '').toString().replace('%', ''));
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
          return String(a.rate).localeCompare(String(b.rate));
        });
        // Client-side fee-column filtering: hide rates whose product_fee is present but not
        // included in the active fee columns for the selected productScope.
        // Build dynamic fee column key based on retention state and range
        let feeColumnKey = productScope;
        if (retentionChoice === 'Yes') {
          // For retention products, use specialized fee columns
          if (selectedRange === 'core') {
            feeColumnKey = `Core_Retention_${retentionLtv}`;
          } else {
            feeColumnKey = `Retention${productScope}`;
          }
        }
        
        let activeFeeCols = [];
        try {
          const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.feeColumns && parsed.feeColumns[feeColumnKey]) {
              activeFeeCols = parsed.feeColumns[feeColumnKey].map((n) => Number(n));
            }
          }
        } catch (e) {
          // ignore
        }
        if (!activeFeeCols || activeFeeCols.length === 0) {
          activeFeeCols = (DEFAULT_FEE_COLUMNS[feeColumnKey] || DEFAULT_FEE_COLUMNS[productScope] || DEFAULT_FEE_COLUMNS['Residential'] || []).map((n) => Number(n));
        }

        const feeFiltered = deduped.filter((r) => {
          const pf = r.product_fee;
          if (pf === undefined || pf === null || pf === '') return true; // keep rows without explicit product_fee
          const pfNum = Number(pf);
          if (Number.isNaN(pfNum)) return true; // non-numeric fees - keep
          // include only when the fee value is present in the active columns
          return activeFeeCols.includes(pfNum);
        });

        setRelevantRates(feeFiltered);
      } catch (err) {
         
      }
    }
    fetchRelevant();
  }, [supabase, productScope, currentTier, productType, retentionChoice, retentionLtv, selectedRange]);

  // Update optimized values state after calculations complete
  // This runs after render to avoid infinite loop
  useEffect(() => {
    const newRolled = optimizedValuesRef.current.rolled;
    const newDeferred = optimizedValuesRef.current.deferred;
    
    // Only update if there are new optimized values
    if (Object.keys(newRolled).length > 0 || Object.keys(newDeferred).length > 0) {
      setOptimizedRolledPerColumn(prev => {
        // Check if values actually changed to avoid unnecessary updates
        const hasChanges = Object.keys(newRolled).some(key => prev[key] !== newRolled[key]);
        return hasChanges ? { ...prev, ...newRolled } : prev;
      });
      setOptimizedDeferredPerColumn(prev => {
        const hasChanges = Object.keys(newDeferred).some(key => prev[key] !== newDeferred[key]);
        return hasChanges ? { ...prev, ...newDeferred } : prev;
      });
    }
  }, [relevantRates, propertyValue, monthlyRent, specificNetLoan, specificGrossLoan, maxLtvInput, topSlicing, loanType, productType, currentTier, rolledMonthsPerColumn, deferredInterestPerColumn, ratesOverrides, productFeeOverrides]);

  // Compute full results using BTLCalculationEngine for saving to database
  const fullComputedResults = useMemo(() => {
    // Don't compute if no loan type selected
    if (!loanType || loanType === '') return [];
    
    if (!relevantRates || relevantRates.length === 0) return [];

    const pv = parseNumber(propertyValue);
    const specificGross = parseNumber(specificGrossLoan);
    const specificNet = parseNumber(specificNetLoan);
    const monthlyRentNum = parseNumber(monthlyRent);
    const topSlicingNum = parseNumber(topSlicing);

    const results = [];

    relevantRates.forEach(rate => {
      const derivedProcFeePct = brokerSettings.clientType === 'Broker' ? Number(brokerSettings.brokerCommissionPercent) || 0 : 0;
      
      const additionalFeeRaw = Number(brokerSettings.additionalFeeAmount);
      const derivedBrokerFeePct = (brokerSettings.addFeesToggle && brokerSettings.feeCalculationType === 'percentage' && Number.isFinite(additionalFeeRaw))
        ? additionalFeeRaw
        : 0;
      const derivedBrokerFeeFlat = (brokerSettings.addFeesToggle && brokerSettings.feeCalculationType === 'fixed' && Number.isFinite(additionalFeeRaw))
        ? additionalFeeRaw
        : 0;

      // Use the same column key format as the UI table (Fee: 5%, Fee: 6%, etc.)
      const productFee = rate.product_fee;
      const colKey = (productFee === undefined || productFee === null || productFee === '') 
        ? 'Fee: —' 
        : `Fee: ${productFee}%`;

      const calculationParams = {
        colKey,
        selectedRate: rate,
        overriddenRate: ratesOverrides[colKey] ? parseNumber(ratesOverrides[colKey]) : null,
        propertyValue,
        monthlyRent,
        specificNetLoan,
        specificGrossLoan,
        maxLtvInput,
        topSlicing,
        loanType,
        productType,
        productScope,
        tier: currentTier,
        selectedRange,
        criteria: answers,
        retentionChoice,
        retentionLtv,
        productFeePercent: rate.product_fee || 0,
        feeOverrides: productFeeOverrides,
        // In public mode, force max values for rolled months and deferred interest (fully utilized)
        manualRolled: publicMode ? (rate.max_rolled_months ?? 24) : rolledMonthsPerColumn[colKey],
        manualDeferred: publicMode ? (rate.max_defer_int ?? 1.5) : deferredInterestPerColumn[colKey],
        brokerRoute: brokerSettings.brokerRoute,
        procFeePct: derivedProcFeePct,
        brokerFeePct: derivedBrokerFeePct,
        brokerFeeFlat: derivedBrokerFeeFlat,
      };

      const result = computeBTLLoan(calculationParams);

      if (result) {
        // Parse metadata from product name if not present in rate
        const metadata = parseRateMetadata(rate);
        
        if (results.length === 0) {
        }
        
        results.push({
          ...rate,
          fee_column: rate.product_fee !== undefined && rate.product_fee !== null && rate.product_fee !== '' 
            ? String(rate.product_fee) 
            : null,
          gross_loan: result.grossLoan,
          net_loan: result.netLoan,
          ltv: result.ltv ? result.ltv * 100 : null,
          net_ltv: result.netLtv ? result.netLtv * 100 : null,
          property_value: pv,
          icr: result.icr,
          initial_rate: result.actualRateUsed * 100,
          pay_rate: result.payRate * 100,
          full_rate: result.fullRateText,
          revert_rate: result.revertRate,
          revert_rate_dd: result.revertRateDD,
          aprc: result.aprc,
          product_fee_percent: result.productFeePercent,
          product_fee_pounds: result.productFeeAmount,
          admin_fee: result.adminFee,
          broker_client_fee: result.brokerClientFee,
          broker_commission_proc_fee_percent: result.procFeePct,
          broker_commission_proc_fee_pounds: result.procFeeValue,
          exit_fee: result.exitFee,
          monthly_interest_cost: result.monthlyInterestCost,
          rolled_months: result.rolledMonths,
          serviced_months: result.servicedMonths,
          rolled_months_interest: result.rolledInterestAmount,
          deferred_interest_percent: result.deferredCapPct,
          deferred_interest_pounds: result.deferredInterestAmount,
          serviced_interest: result.servicedInterest,
          direct_debit: result.directDebit,
          erc: result.ercText,
          rent: monthlyRentNum,
          top_slicing: topSlicingNum,
          nbp: result.nbp,
          nbpLTV: result.nbpLTV,
          total_cost_to_borrower: result.totalCostToBorrower,
          total_loan_term: result.totalLoanTerm,
          titleInsuranceCost: result.titleInsuranceCost,
          product_name: result.productName,
          // Complete rate metadata - use parsed values if not in rate
          initial_term: rate.initial_term || metadata.initial_term,
          full_term: rate.full_term || metadata.full_term,
          revert_rate_type: rate.revert_rate_type || metadata.revert_rate_type,
          // Preserve the actual rate's product_range/rate_type, don't override with selectedRange
          product_range: rate.product_range || rate.rate_type || null,
          rate_type: rate.rate_type || rate.product_range || null,
          revert_index: rate.revert_index || null,
          revert_margin: rate.revert_margin || null,
          min_loan: rate.min_loan || null,
          max_loan: rate.max_loan || null,
          min_ltv: rate.min_ltv || null,
          max_ltv: rate.max_ltv || null,
          max_rolled_months: rate.max_rolled_months || null,
          max_defer_int: rate.max_defer_int || null,
          min_icr: rate.min_icr || null,
          tracker: rate.tracker || null,
          tracker_flag: rate.tracker === true || rate.tracker === 'Yes',
          max_top_slicing: rate.max_top_slicing || null,
          admin_fee_amount: rate.admin_fee_amount || rate.admin_fee || null,
          erc_1: rate.erc_1 || null,
          erc_2: rate.erc_2 || null,
          erc_3: rate.erc_3 || null,
          erc_4: rate.erc_4 || null,
          erc_5: rate.erc_5 || null,
          status: rate.status || null,
          rate_status: rate.status || null,
          floor_rate: rate.floor_rate || null,
          proc_fee: rate.proc_fee || null,
          tier: rate.tier || null,
          property_type: rate.property_type || rate.property || null,
          retention: rate.retention || null,
          retention_type: rate.retention || null,
          is_retention: rate.is_retention !== undefined ? rate.is_retention : null,
          rate_percent: rate.rate || null,
          id: rate.id || null,
        });
      }
    });

    return results;
  }, [relevantRates, propertyValue, monthlyRent, specificNetLoan, specificGrossLoan, maxLtvInput, topSlicing, loanType, productType, productScope, currentTier, selectedRange, answers, retentionChoice, retentionLtv, rolledMonthsPerColumn, deferredInterestPerColumn, ratesOverrides, productFeeOverrides, brokerSettings]);

  const handleAnswerChange = (questionKey, optionIndex) => {
    setAnswers((prev) => {
      const opt = questions[questionKey].options[optionIndex];
      return { ...prev, [questionKey]: opt };
    });
  };

  // Accordion toggle functions - close all other sections when opening one
  const handleClientDetailsToggle = () => {
    const newState = !clientDetailsExpanded;
    setClientDetailsExpanded(newState);
    if (newState) {
      setCriteriaExpanded(false);
      setLoanDetailsExpanded(false);
      setProductConfigExpanded(false);
    }
  };

  const handleCriteriaToggle = () => {
    const newState = !criteriaExpanded;
    setCriteriaExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setLoanDetailsExpanded(false);
      setProductConfigExpanded(false);
    }
  };

  const handleLoanDetailsToggle = () => {
    const newState = !loanDetailsExpanded;
    setLoanDetailsExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setCriteriaExpanded(false);
      setProductConfigExpanded(false);
    }
  };

  const handleProductConfigToggle = () => {
    const newState = !productConfigExpanded;
    setProductConfigExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setCriteriaExpanded(false);
      setLoanDetailsExpanded(false);
    }
  };

  // small helper: product select control so we can render it in two places conditionally
  const productSelectControl = (
    <select className="slds-select" value={productType} onChange={(e) => setProductType(e.target.value)}>
      {(() => {
        // read product lists from localStorage overrides first, fall back to default
        try {
          const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.productLists && productScope && parsed.productLists[productScope]) {
              return parsed.productLists[productScope].map((p) => <option key={p}>{p}</option>);
            }
          }
        } catch (e) {
          // ignore parse errors
        }
        // fall back: try productScope then 'Residential'
        const key = productScope || 'Residential';
        return (DEFAULT_PRODUCT_TYPES_LIST[key] || DEFAULT_PRODUCT_TYPES_LIST['Residential'] || []).map((p) => <option key={p}>{p}</option>);
      })()}
    </select>
  );

  // Build unique product_scope values for top control; criteria_set is fixed to BTL
  const productScopes = Array.from(new Set(allCriteria.map((r) => r.product_scope).filter(Boolean)));

  // DIP Modal Handlers
  const handleOpenDipModal = async () => {
    try {
      // Always reload quote from database to get latest version
      if (currentQuoteId) {
        const response = await getQuote(currentQuoteId, false);
        if (response && response.quote) {
          const quote = response.quote;
          // Update dipData with latest values from database
          const hasDipData = quote.commercial_or_main_residence || quote.dip_date || quote.dip_expiry_date ||
                             quote.guarantor_name || quote.lender_legal_fee || quote.number_of_applicants ||
                             quote.security_properties || quote.fee_type_selection || quote.title_insurance ||
                             quote.funding_line || quote.product_range || quote.dip_status;
          
          if (hasDipData) {
            // Map 'Company' to 'Corporate' for backward compatibility
            const applicantType = quote.applicant_type === 'Company' ? 'Corporate' : quote.applicant_type;
            setDipData({
              commercial_or_main_residence: quote.commercial_or_main_residence,
              funding_line: quote.funding_line,
              dip_date: quote.dip_date,
              dip_expiry_date: quote.dip_expiry_date,
              applicant_type: applicantType,
              guarantor_name: quote.guarantor_name,
              company_number: quote.company_number,
              title_number: quote.title_number,
              lender_legal_fee: quote.lender_legal_fee,
              number_of_applicants: quote.number_of_applicants,
              overpayments_percent: quote.overpayments_percent,
              security_properties: quote.security_properties,
              shareholders: quote.shareholders,
              fee_type_selection: quote.fee_type_selection,
              dip_status: quote.dip_status,
              title_insurance: quote.title_insurance,
              product_range: quote.product_range
            });
          }
        }
      }
      // Open modal with refreshed data
      setDipModalOpen(true);
    } catch (err) {
      showToast({ kind: 'error', title: 'Failed to load quote data', subtitle: err.message });
    }
  };

  const handleSaveDipData = async (quoteId, dipData) => {
    try {
      const dataToSave = { ...dipData };
      await upsertQuoteData({
        quoteId,
        calculatorType: 'BTL',
        payload: dataToSave,
        token,
      });
      setDipData(dipData);
    } catch (err) {
      throw err;
    }
  };

  const handleCreatePDF = async (quoteId) => {
    try {
      // Use React PDF generation (client-side) instead of backend PDFKit
      await downloadDIPPDF(quoteId, 'BTL', quoteData?.reference_number || quoteId);
      
      // Note: Success toast is shown by IssueDIPModal
    } catch (err) {
      showToast({ kind: 'error', title: 'Failed to create DIP PDF', subtitle: err.message });
      throw err;
    }
  };

  // Get available fee types for BTL (extract from relevantRates)
  const getAvailableFeeTypes = () => {
    if (!relevantRates || relevantRates.length === 0) return [];
    
    // Build fee buckets similar to how they're displayed in the results table
    const feeBucketsSet = new Set(relevantRates.map((r) => {
      if (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') return 'none';
      return String(r.product_fee);
    }));
    
    // Sort: numeric values first, then 'none' last
    const feeBuckets = Array.from(feeBucketsSet).sort((a, b) => {
      if (a === 'none') return 1; // keep 'none' last
      if (b === 'none') return -1;
      const na = Number(a);
      const nb = Number(b);
      // Descending numeric order (e.g., 6,4,3,2) for fee columns
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
      // Fallback to reverse alpha to approximate descending
      return b.localeCompare(a);
    });
    
    // Format as displayed in results: "Fee: 2%" or "Fee: —" for none
    return feeBuckets.map(fb => fb === 'none' ? 'Fee: —' : `Fee: ${fb}%`);
  };

  // === Issue Quote handlers ===
  const handleIssueQuote = async () => {
    if (!currentQuoteId) {
      showToast({ kind: 'warning', title: 'Please save your quote first', subtitle: 'Click "Save Quote" before issuing a quote.' });
      return;
    }
    
    // Check if there are calculation results to issue
    if (!relevantRates || relevantRates.length === 0) {
      showToast({ 
        kind: 'warning', 
        title: 'No calculation results', 
        subtitle: 'Please calculate rates first. Make sure the results table shows data, then click "Save Quote".' 
      });
      return;
    }
    
    // Check if we have a saved quote with results
    // We need to verify the quote exists in the database, but we'll use the current results data
    // since SaveQuoteButton saves them and there might be a timing issue with fetching immediately
    try {
      const response = await getQuote(currentQuoteId);
      if (response && response.quote) {
        setQuoteData(response.quote);
      }
      
      // If we have relevantRates (calculation results in memory) and they were just saved,
      // we can proceed. Only block if there's truly no data.
      if (!relevantRates || relevantRates.length === 0) {
        showToast({
          kind: 'warning',
          title: 'No calculation results',
          subtitle: 'Please ensure calculations have been performed before issuing the quote.'
        });
        return;
      }
    } catch (error) {
      console.error('Error fetching quote for Issue Quote:', error);
      // Continue anyway - use existing data if quote fetch fails
    }
    
    setQuoteModalOpen(true);
  };

  const handleCancelQuote = () => {
    // Reset to initial state - clear currentQuoteId and reference
    setCurrentQuoteId(null);
    setCurrentQuoteRef(null);
    setCurrentQuoteData(null);
    
    // Reset the loaded-from-saved-quote flag
    loadedFromSavedQuoteRef.current = false;
    
    // Reset all input fields
    setPropertyValue('');
    setMonthlyRent('');
    setTopSlicing('');
    setProductScope('');
    setProductType('');
    setLoanType('');
    setSpecificGrossLoan('');
    setSpecificNetLoan('');
    setMaxLtvInput(75);
    setRetentionChoice('No');
    setRetentionLtv('75');
    
    // Reset criteria answers
    setAnswers({});
    
    // Reset results and overrides
    setRelevantRates([]);
    setRatesOverrides({});
    setProductFeeOverrides({});
    setRolledMonthsPerColumn({});
    setDeferredInterestPerColumn({});
    setManualModeActivePerColumn({});
    setOptimizedRolledPerColumn({});
    setOptimizedDeferredPerColumn({});
    
    // Reset DIP data
    setDipData({});
    setFilteredRatesForDip([]);
    
    // Reset UW checklist
    setUwCheckedItems({});
    
    // Reset broker settings using setters from hook
    brokerSettings.setClientType('Direct');
    brokerSettings.setClientFirstName('');
    brokerSettings.setClientLastName('');
    brokerSettings.setClientEmail('');
    brokerSettings.setClientContact('');
    brokerSettings.setBrokerCompanyName('');
    brokerSettings.setBrokerRoute(BROKER_ROUTES.DIRECT_BROKER);
    const defaultCommission = BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER];
    brokerSettings.setBrokerCommissionPercent(typeof defaultCommission === 'object' ? defaultCommission.btl : defaultCommission);
    brokerSettings.setAddFeesToggle(false);
    brokerSettings.setFeeCalculationType('pound');
    brokerSettings.setAdditionalFeeAmount('');
    
    showToast({ 
      kind: 'info', 
      title: 'Quote Cancelled', 
      subtitle: 'Calculator has been reset to start a new quote.' 
    });

    // Navigate to the calculator route to mirror behavior when opening from navigation
    navigate('/calculator/btl', { replace: true });
  };

  // Handler for Submit Quote button in public mode
  const handleSubmitQuote = () => {
    // TODO: Implement submit quote logic for public mode
    // This could open a modal to collect contact details, send to an API, etc.
    showToast('Quote submitted successfully!', 'success');
  };

  const handleNewQuote = () => {
    // Reset to initial state - clear currentQuoteId and reference
    setCurrentQuoteId(null);
    setCurrentQuoteRef(null);
    setCurrentQuoteData(null);

    // Reset the loaded-from-saved-quote flag
    loadedFromSavedQuoteRef.current = false;

    // Reset all input fields
    setPropertyValue('');
    setMonthlyRent('');
    setTopSlicing('');
    setProductScope('');
    setProductType('');
    setLoanType('');
    setSpecificGrossLoan('');
    setSpecificNetLoan('');
    setMaxLtvInput(75);
    setRetentionChoice('No');
    setRetentionLtv('75');

    // Reset criteria answers
    setAnswers({});

    // Reset results and overrides
    setRelevantRates([]);
    setRatesOverrides({});
    setProductFeeOverrides({});
    setRolledMonthsPerColumn({});
    setDeferredInterestPerColumn({});
    setManualModeActivePerColumn({});
    setOptimizedRolledPerColumn({});
    setOptimizedDeferredPerColumn({});

    // Reset DIP data
    setDipData({});
    setFilteredRatesForDip([]);

    // Reset UW checklist
    setUwCheckedItems({});

    // Reset broker settings
    brokerSettings.setClientType('Direct');
    brokerSettings.setClientFirstName('');
    brokerSettings.setClientLastName('');
    brokerSettings.setClientEmail('');
    brokerSettings.setClientContact('');
    brokerSettings.setBrokerCompanyName('');
    brokerSettings.setBrokerRoute(BROKER_ROUTES.DIRECT_BROKER);
    const defaultCommission = BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER];
    brokerSettings.setBrokerCommissionPercent(typeof defaultCommission === 'object' ? defaultCommission.btl : defaultCommission);
    brokerSettings.setAddFeesToggle(false);
    brokerSettings.setFeeCalculationType('pound');
    brokerSettings.setAdditionalFeeAmount('');

    // Navigate to the calculator route (no toast for New Quote)
    navigate('/calculator/btl', { replace: true });
  };

  const handleSaveQuoteData = async (quoteId, updatedQuoteData) => {
    try {
      // Increment version when issuing quote
      const currentVersion = quoteData?.quote_version || 0;
      const newVersion = currentVersion + 1;
      
      await upsertQuoteData({
        quoteId,
        calculatorType: 'BTL',
        payload: {
          ...updatedQuoteData,
          quote_version: newVersion,
        },
        token,
      });

      // Update local quote data with new version
      if (quoteData) {
        setQuoteData({ ...quoteData, quote_version: newVersion });
      }

      // Don't close modal or show alert here - let the modal handle it
    } catch (error) {
      throw error; // Re-throw so modal can handle the error
    }
  };

  const handleCreateQuotePDF = async (quoteId) => {
    try {
      // Use React PDF generation (client-side) instead of backend PDF
      await downloadQuotePDF(quoteId, 'BTL', quoteData?.reference_number || quoteId);
      
      // Note: Success toast is shown by IssueQuoteModal
      setQuoteModalOpen(false);
    } catch (error) {
      showToast({ kind: 'error', title: 'Failed to create Quote PDF', subtitle: error.message });
      throw error; // Re-throw so modal can handle the error
    }
  };

  // Check if both Core and Specialist ranges have rates available
  const hasBothRanges = () => {
    if (!relevantRates || relevantRates.length === 0) return false;
    
    const hasCoreRates = relevantRates.some(r => {
      const rateType = (r.rate_type || r.type || '').toString().toLowerCase();
      return rateType === 'core' || rateType.includes('core');
    });
    
    const hasSpecialistRates = relevantRates.some(r => {
      const rateType = (r.rate_type || r.type || '').toString().toLowerCase();
      return rateType === 'specialist' || rateType.includes('specialist') || !rateType || rateType === '';
    });
    
    return hasCoreRates && hasSpecialistRates;
  };

  // Handle fee type selection in DIP modal to filter rates
  const handleFeeTypeSelection = (feeTypeLabel) => {
    setSelectedFeeTypeForDip(feeTypeLabel);
    
    if (!feeTypeLabel || !relevantRates || relevantRates.length === 0) {
      setFilteredRatesForDip([]);
      return;
    }

    // Extract the fee value from label (e.g., "Fee: 2%" -> "2", "Fee: —" -> "none")
    let feeValue = 'none';
    if (feeTypeLabel.includes('%')) {
      const match = feeTypeLabel.match(/Fee:\s*(\d+(?:\.\d+)?)%/);
      if (match) {
        feeValue = match[1];
      }
    } else if (feeTypeLabel === 'Fee: —') {
      feeValue = 'none';
    }

    // Filter rates by the selected fee
    const filtered = relevantRates.filter(r => {
      const rateFee = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
      return rateFee === feeValue;
    });

    setFilteredRatesForDip(filtered);
  };

  // Defensive: show helpful message if Supabase client missing
  if (!supabase) {
    return (
      <div className="slds-p-around_medium">
        <div className="slds-text-color_error">Database client not available. Calculator cannot load data.</div>
      </div>
    );
  }

  // Visible debug header so the page is never blank
  const totalRows = allCriteria.length;
  const btlRows = allCriteria.filter((r) => (r.criteria_set || '').toString() === 'BTL').length;
  const questionCount = Object.keys(questions).length;
  // Decide how many columns to render for questions: up to 4, but don't create empty columns when fewer questions exist
  const questionColumns = Math.min(4, Math.max(1, questionCount));

  // Calculate dynamic maximum LTV based on current selections
  const calculateMaxAvailableLtv = () => {
    // Check if flat-above-commercial rule applies based on CRITERIA ANSWER
    let flatAboveCommercialOverrideObj = DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE;
    try {
      const rawOverrides = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      if (rawOverrides) {
        const parsed = JSON.parse(rawOverrides);
        if (parsed && parsed.flatAboveCommercialRule) flatAboveCommercialOverrideObj = parsed.flatAboveCommercialRule;
      }
    } catch (e) {
      // ignore
    }

    const enabled = !!flatAboveCommercialOverrideObj && flatAboveCommercialOverrideObj.enabled;
    
    // Check if user answered "Yes" to "Flat Above Commercial?" criteria question
    let flatAboveCommercialAnswer = null;
    Object.keys(answers).forEach((questionKey) => {
      const questionLabel = (questions[questionKey]?.label || '').toLowerCase();
      if (questionLabel.includes('flat') && questionLabel.includes('commercial')) {
        const answer = answers[questionKey];
        const answerLabel = (answer?.option_label || '').toLowerCase();
        if (answerLabel === 'yes' || answerLabel === 'y') {
          flatAboveCommercialAnswer = true;
        }
      }
    });

    // If flat-above-commercial rule applies (enabled AND user answered Yes), use tier-based LTV limits
    if (enabled && flatAboveCommercialAnswer) {
      const ctNum = Number(currentTier);
      const tier2Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['2']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2'] || 65);
      const tier3Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['3']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3'] || 75);
      
      if (ctNum === 2) return tier2Val; // 65%
      if (ctNum === 3) return tier3Val; // 75%
      return 75; // default for tier 1 or other tiers
    }

    // For retention products, use retention LTV value
    if (retentionChoice === 'Yes') {
      const retLtv = Number(retentionLtv);
      return retLtv;
    }

    // Otherwise, find max LTV from available rates
    if (relevantRates && relevantRates.length > 0) {
      const maxFromRates = Math.max(...relevantRates.map(r => {
        const ltv = Number(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? 0);
        return Number.isFinite(ltv) ? ltv : 0;
      }));
      if (maxFromRates > 0) {
        return maxFromRates;
      }
    }

    // Default fallback
    return 75;
  };

  const dynamicMaxLtv = calculateMaxAvailableLtv();
  
  // LTV slider range bounds (used for percentage calculation and to keep UI consistent)
  const ltvMin = 1; // BTL minimum is 1%
  const ltvMax = dynamicMaxLtv;
  const ltvPercent = Math.round(((maxLtvInput - ltvMin) / (ltvMax - ltvMin)) * 100);

  // Track previous max LTV to detect when it changes
  const prevMaxLtvRef = useRef(dynamicMaxLtv);
  
  // Clamp or adjust maxLtvInput when dynamicMaxLtv changes
  useEffect(() => {
    const prevMax = prevMaxLtvRef.current;
    
    // Always clamp down if current input exceeds new max
    if (maxLtvInput > dynamicMaxLtv) {
      setMaxLtvInput(dynamicMaxLtv);
    } 
    // If max increased and user was at the old max, update to new max
    else if (dynamicMaxLtv > prevMax && Math.abs(maxLtvInput - prevMax) < 0.1) {
      setMaxLtvInput(dynamicMaxLtv);
    }
    // Ensure minimum
    else if (maxLtvInput < 1) {
      setMaxLtvInput(1);
    }
    
    prevMaxLtvRef.current = dynamicMaxLtv;
  }, [dynamicMaxLtv, maxLtvInput, retentionChoice, retentionLtv, answers, currentTier]);

  // Determine display order for questions: prefer numeric `displayOrder` (from DB) then fall back to label
  const orderedQuestionKeys = Object.keys(questions).sort((a, b) => {
    const da = questions[a]?.displayOrder;
    const db = questions[b]?.displayOrder;
    if (da !== undefined && db !== undefined) return (Number(da) || 0) - (Number(db) || 0);
    if (da !== undefined) return -1;
    if (db !== undefined) return 1;
    const la = (questions[a]?.label || a).toString();
    const lb = (questions[b]?.label || b).toString();
    return la.localeCompare(lb, undefined, { sensitivity: 'base', numeric: true });
  });

  return (
    <div className="page-container page-container--full-width">
      {/* Product Configuration section */}
      <BTLProductSection
        productScope={productScope}
        onProductScopeChange={setProductScope}
        retentionChoice={retentionChoice}
        onRetentionChoiceChange={setRetentionChoice}
        retentionLtv={retentionLtv}
        onRetentionLtvChange={setRetentionLtv}
        currentTier={currentTier}
        availableScopes={productScopes}
        allowedScopes={allowedScopes}
        quoteId={currentQuoteId}
        quoteReference={currentQuoteRef}
        onIssueDip={handleOpenDipModal}
        onIssueQuote={handleIssueQuote}
        onSubmitQuote={handleSubmitQuote}
        onCancelQuote={handleCancelQuote}
        onNewQuote={handleNewQuote}
        isReadOnly={isReadOnly}
        isProductScopeLocked={publicMode && !!fixedProductScope && !allowedScopes}
        publicMode={publicMode}
        saveQuoteButton={
          <SaveQuoteButton
            calculatorType="BTL"
            calculationData={{
              productScope,
              retentionChoice,
              retentionLtv,
              tier: currentTier,
              propertyValue,
              monthlyRent,
              topSlicing,
              loanType,
              specificGrossLoan,
              specificNetLoan,
              targetLtv: maxLtvInput,
              productType,
              selectedRange,
              answers,
              ...brokerSettings.getAllSettings(),
              relevantRates: fullComputedResults,
              selectedRate: (filteredRatesForDip && filteredRatesForDip.length > 0) 
                ? filteredRatesForDip[0] 
                : (fullComputedResults && fullComputedResults.length > 0 ? fullComputedResults[0] : null),
              ratesOverrides,
              productFeeOverrides,
              rolledMonthsPerColumn,
              deferredInterestPerColumn,
            }}
            allColumnData={fullComputedResults || []}
            existingQuote={currentQuoteData}
            onSaved={(savedQuote) => {
              if (savedQuote && savedQuote.id) {
                if (!currentQuoteId) {
                  setCurrentQuoteId(savedQuote.id);
                }
                // Store the full quote data for future Update Quote operations
                setCurrentQuoteData(savedQuote);
              }
              if (savedQuote && savedQuote.reference_number) {
                setCurrentQuoteRef(savedQuote.reference_number);
              }
              if (savedQuote && savedQuote.id) {
                if (savedQuote.commercial_or_main_residence || savedQuote.dip_date || savedQuote.dip_expiry_date) {
                  setDipData({
                    commercial_or_main_residence: savedQuote.commercial_or_main_residence,
                    dip_date: savedQuote.dip_date,
                    dip_expiry_date: savedQuote.dip_expiry_date,
                    guarantor_name: savedQuote.guarantor_name,
                    lender_legal_fee: savedQuote.lender_legal_fee,
                    number_of_applicants: savedQuote.number_of_applicants,
                    overpayments_percent: savedQuote.overpayments_percent,
                    security_properties: savedQuote.security_properties,
                    fee_type_selection: savedQuote.fee_type_selection,
                    title_insurance: savedQuote.title_insurance,
                    product_range: savedQuote.product_range
                  });
                }
              }
            }}
            onCancel={handleCancelQuote}
          />
        }
        isReadOnly={isReadOnly}
      />

      {/* Client details section */}
      <ClientDetailsSection
        {...brokerSettings}
        calculatorType="btl"
        expanded={clientDetailsExpanded}
        onToggle={handleClientDetailsToggle}
        isReadOnly={isReadOnly}
      />

      {tipOpen && (
        <>
          <div className="slds-backdrop slds-backdrop_open" />
          <div className="slds-modal slds-fade-in-open">
            <div className="slds-modal__container">
              <div className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setTipOpen(false)}
                  title="Close"
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Info</h2>
              </div>
              <div className="slds-modal__content slds-p-around_medium">
                <div dangerouslySetInnerHTML={{ __html: String(tipContent).replace(/\n/g, '<br/>') }} />
              </div>
              <div className="slds-modal__footer">
                <button className="slds-button slds-button_brand" onClick={() => setTipOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}

      

      

      <BTLCriteriaSection
        expanded={criteriaExpanded}
        onToggle={handleCriteriaToggle}
        loading={loading}
        error={error}
        questions={questions}
        answers={answers}
        orderedQuestionKeys={orderedQuestionKeys}
        onAnswerChange={handleAnswerChange}
        isReadOnly={isReadOnly}
      />
      
      <BTLLoanDetailsSection
        expanded={loanDetailsExpanded}
        onToggle={handleLoanDetailsToggle}
        propertyValue={propertyValue}
        onPropertyValueChange={setPropertyValue}
        monthlyRent={monthlyRent}
        onMonthlyRentChange={setMonthlyRent}
        topSlicing={topSlicing}
        onTopSlicingChange={setTopSlicing}
        maxTopSlicingPct={relevantRates?.[0]?.max_top_slicing || 20}
        maxTopSlicingValue={parseNumber(monthlyRent) * ((relevantRates?.[0]?.max_top_slicing || 20) / 100)}
        loanType={loanType}
        onLoanTypeChange={setLoanType}
        productSelectControl={productSelectControl}
        specificNetLoan={specificNetLoan}
        onSpecificNetLoanChange={setSpecificNetLoan}
        maxLtvInput={maxLtvInput}
        onMaxLtvInputChange={setMaxLtvInput}
        ltvMin={ltvMin}
        ltvMax={ltvMax}
        ltvPercent={ltvPercent}
        specificGrossLoan={specificGrossLoan}
        onSpecificGrossLoanChange={setSpecificGrossLoan}
        isReadOnly={isReadOnly}
        publicMode={publicMode}
      />

      

      {/* Range toggle tabs with results as unified card */}
      <RangeToggle
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        showCore={!publicMode || fixedRange === 'core'}
        showSpecialist={!publicMode || fixedRange === 'specialist'}
      >
        <div className="results-section">
        {/* Rates display */}
        <div className="rates-display">
          {(() => {
            // Check if loan type is selected
            if (!loanType || loanType === '') {
              return (
                <div className="no-rates">
                  <p className="no-rates__title">Please select a loan calculation type above to view rates and results.</p>
                  <p className="no-rates__subtitle">Choose from Max Gross Loan, Net loan required, Specific LTV Required, or Specific Gross Loan.</p>
                </div>
              );
            }

            // Check if property value and monthly rent are entered
            if (!propertyValue || propertyValue <= 0 || !monthlyRent || monthlyRent <= 0) {
              return (
                <div className="no-rates">
                  <p className="no-rates__title">Please enter property value and monthly rent to view rates and results.</p>
                  <p className="no-rates__subtitle">Both fields are required to calculate loan options.</p>
                </div>
              );
            }

            if (loanType === 'Net loan required' && !specificNetLoan) {
                return (
                  <div className="no-rates">
                    <p className="no-rates__title">Please enter a required net loan amount to view rates and results.</p>
                  </div>
                );
              }
  
              if (loanType === 'Specific gross loan' && !specificGrossLoan) {
                return (
                  <div className="no-rates">
                    <p className="no-rates__title">Please enter a specific gross loan amount to view rates and results.</p>
                  </div>
                );
              }

            // Filter rates based on selected range
            const filteredRates = relevantRates.filter(r => {
              // Check product_range field (primary), fallback to rate_type or type
              const rangeField = (r.product_range || r.rate_type || r.type || '').toString().toLowerCase();
              if (selectedRange === 'core') {
                return rangeField === 'core' || rangeField.includes('core');
              } else {
                // Specialist: match 'specialist' or empty/null (defaults to specialist)
                return rangeField === 'specialist' || rangeField.includes('specialist') || !rangeField || rangeField === '';
              }
            });

            // Build fee buckets (unique product_fee values). Use 'none' for rows without an explicit fee.
            const feeBucketsSet = new Set((filteredRates || []).map((r) => {
              if (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') return 'none';
              return String(r.product_fee);
            }));
            // prefer numeric sort for numeric buckets, keep 'none' last
            const feeBuckets = Array.from(feeBucketsSet).sort((a, b) => {
              if (a === 'none') return 1; // keep 'none' last
              if (b === 'none') return -1;
              const na = Number(a);
              const nb = Number(b);
              // Descending numeric order (e.g., 6,4,3,2) for fee columns
              if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
              // Fallback to reverse alpha to approximate descending
              return b.localeCompare(a);
            });

                    return (
                      <>
                        {feeBuckets.length === 0 ? (
                          <div className="no-rates">No {selectedRange} range rates available for the selected criteria.</div>
                        ) : (
                          <div className="results-table-wrapper" data-calculator-type={calculatorTypeForSettings}>
                            <table className="slds-table slds-table_cell-buffer slds-table_bordered" style={{ minWidth: Math.max(600, feeBuckets.length * 220) }}>
                              <thead>
                                <tr>
                                  {/* increased label column width */}
                                  <th className="th-label" style={{ width: '200px' }}>Label</th>
                                  {feeBuckets.map((fb, idx) => {
                                    const rows = filteredRates.filter(r => {
                                      const key = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
                                      return key === fb;
                                    });
                                    const firstRow = rows[0];
                                    const productLabel = firstRow ? firstRow.product : '';
                                    const feeLabel = fb === 'none' ? '' : ` ${fb}% Fee`;
                                    // Use column index for dynamic colors (1-based for CSS vars)
                                    const colNum = idx + 1;
                                    return (
                                      <th 
                                        key={fb} 
                                        className="th-data-col"
                                        data-col-index={colNum}
                                        style={{ 
                                          width: `${(100 - 15) / feeBuckets.length}%`,
                                          backgroundColor: `var(--results-header-${calculatorTypeForSettings}-col${colNum}-bg, var(--results-header-col${((idx % 3) + 1)}-bg))`,
                                          color: `var(--results-header-${calculatorTypeForSettings}-col${colNum}-text, var(--results-header-col${((idx % 3) + 1)}-text))`
                                        }}
                                      >
                                        {productLabel}{feeLabel}
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {
                                  (() => {
                                    // First, calculate the column headers and original rates for all columns
                                    const columnsHeaders = feeBuckets.map((fb) => (fb === 'none' ? 'Fee: —' : `Fee: ${fb}%`));
                                    const originalRates = {};
                                    const ratesDisplayValues = {};
                                    
                                    // Check if this is a tracker product
                                    const isTracker = /tracker/i.test(productType || '');

                                    feeBuckets.forEach((fb, idx) => {
                                      const colKey = columnsHeaders[idx];
                                      const rows = filteredRates.filter(r => {
                                        const key = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
                                        return key === fb;
                                      });
                                      const best = (rows || []).filter(r => r.rate != null).sort((a,b) => Number(a.rate) - Number(b.rate))[0] || (rows || [])[0] || null;

                                      if (best && best.rate != null) {
                                        const originalRate = formatPercent(best.rate, 2) + (isTracker ? ' + BBR' : '');
                                        originalRates[colKey] = originalRate;
                                        ratesDisplayValues[colKey] = ratesOverrides[colKey] || originalRate;
                                      }
                                    });

                                    return (
                                      <>
                                        {/* Rates row - now editable */}
                                        <EditableResultRow
                                          label={getLabel('Full Rate')}
                                          columns={columnsHeaders}
                                          columnValues={ratesDisplayValues}
                                          originalValues={originalRates}
                                          onValueChange={(newValue, columnKey) => {
                                            setRatesOverrides(prev => ({ ...prev, [columnKey]: newValue }));
                                          }}
                                          onReset={(columnKey) => {
                                            setRatesOverrides(prev => {
                                              const updated = { ...prev };
                                              delete updated[columnKey];
                                              return updated;
                                            });
                                          }}
                                          disabled={isReadOnly}
                                          displayOnly={publicMode}
                                          suffix={isTracker ? "% + BBR" : "%"}
                                        />
                                      </>
                                    );
                                  })()
                                }
                                {/* Render placeholders and sliders in proper order */}
                                {
                                  (() => {
                                    const columnsHeaders = feeBuckets.map((fb) => (fb === 'none' ? 'Fee: —' : `Fee: ${fb}%`));
                                    const allPlaceholders = [
                                      'APRC','Admin Fee','Broker Client Fee','Broker Commission (Proc Fee %)',
                                      'Broker Commission (Proc Fee £)','Deferred Interest %','Deferred Interest £',
                                      'Direct Debit','ERC','Exit Fee','Full Term','Gross Loan','ICR','Initial Term',
                                      'LTV','Monthly Interest Cost','NBP','NBP LTV','Net Loan','Net LTV','Pay Rate','Product Fee %',
                                      'Product Fee £','Revert Rate','Revert Rate DD','Rolled Months','Rolled Months Interest',
                                      'Serviced Interest','Serviced Months','Title Insurance Cost','Total Cost to Borrower'
                                    ];
                                    
                                    // Filter placeholders based on visibility settings, then apply ordering
                                    const visiblePlaceholders = allPlaceholders.filter(p => isRowVisible(p));
                                    const orderedRows = getOrderedRows(visiblePlaceholders);

                                    const values = {};
                                    const originalProductFees = {};
                                    orderedRows.forEach(p => { values[p] = {}; });

                                    // Reset optimized values ref at start of calculation
                                    optimizedValuesRef.current = { rolled: {}, deferred: {} };

                                    // compute per-column values
                                    feeBuckets.forEach((fb, idx) => {
                                      const colKey = columnsHeaders[idx];
                                      const rows = filteredRates.filter(r => {
                                        const key = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
                                        return key === fb;
                                      });
                                      const best = (rows || []).filter(r => r.rate != null).sort((a,b) => Number(a.rate) - Number(b.rate))[0] || (rows || [])[0] || null;
                                      
                                      // Check if this is a tracker product
                                      const isTracker = /tracker/i.test(productType || '');

                                      // Get manual slider values for this column
                                      // In public mode, force max values for rolled months and deferred interest (fully utilized)
                                      const manualRolled = publicMode ? (best?.max_rolled_months ?? 24) : rolledMonthsPerColumn[colKey];
                                      const manualDeferred = publicMode ? (best?.max_defer_int ?? 1.5) : deferredInterestPerColumn[colKey];

                                      // Run calculation engine for this column
                                      // Derive broker-related fees from client details
                                      const isBrokerClient = brokerSettings.clientType === 'Broker';
                                      const derivedProcFeePct = isBrokerClient
                                        ? Number(brokerSettings.brokerCommissionPercent) || 0
                                        : 0;
                                      const additionalFeeRaw = parseNumber(brokerSettings.additionalFeeAmount);
                                      const useAdditional = !!brokerSettings.addFeesToggle && Number.isFinite(additionalFeeRaw) && additionalFeeRaw > 0;
                                      const derivedBrokerFeePct = useAdditional && brokerSettings.feeCalculationType === 'percentage'
                                        ? additionalFeeRaw
                                        : 0;
                                      const derivedBrokerFeeFlat = useAdditional && brokerSettings.feeCalculationType === 'pound'
                                        ? additionalFeeRaw
                                        : 0;

                                      const calculationParams = {
                                        colKey,
                                        selectedRate: best,
                                        overriddenRate: ratesOverrides[colKey] ? parseNumber(ratesOverrides[colKey]) : null,
                                        propertyValue,
                                        monthlyRent,
                                        specificNetLoan,
                                        specificGrossLoan,
                                        maxLtvInput,
                                        topSlicing,
                                        loanType,
                                        productType,
                                        productScope,
                                        tier: currentTier,
                                        selectedRange,
                                        criteria: answers,
                                        retentionChoice,
                                        retentionLtv,
                                        productFeePercent: fb === 'none' ? 0 : Number(fb),
                                        feeOverrides: productFeeOverrides,
                                        manualRolled,
                                        manualDeferred,
                                        brokerRoute: brokerSettings.brokerRoute,
                                        // Use Broker commission (%) as Proc Fee when client type is Broker
                                        procFeePct: derivedProcFeePct,
                                        // Map Additional fees toggle+amount into Broker Client Fee (either % of gross or £ flat)
                                        brokerFeePct: derivedBrokerFeePct,
                                        brokerFeeFlat: derivedBrokerFeeFlat,
                                      };

                                      const result = computeBTLLoan(calculationParams);

                                      // If calculation succeeded, populate values
                                      if (result) {
                                        // Collect optimized values in ref (don't update state during render)
                                        if (!result.isManual) {
                                          optimizedValuesRef.current.rolled[colKey] = result.rolledMonths;
                                          optimizedValuesRef.current.deferred[colKey] = result.deferredCapPct;
                                        }
                                        
                                        // Initial Rate (display only)
                                        if (values['Initial Rate']) {
                                          values['Initial Rate'][colKey] = result.fullRateText;
                                        }

                                        // Pay Rate (display only, not editable)
                                        if (values['Pay Rate']) {
                                          values['Pay Rate'][colKey] = result.payRateText;
                                        }

                                        // Product Fee %
                                        const pfPercent = fb === 'none' ? NaN : Number(fb);
                                        if (!Number.isNaN(pfPercent) && values['Product Fee %']) {
                                          const originalFee = `${pfPercent}%`;
                                          originalProductFees[colKey] = originalFee;
                                          values['Product Fee %'][colKey] = productFeeOverrides[colKey] || originalFee;
                                        }

                                        // Gross Loan
                                        if (values['Gross Loan']) {
                                          values['Gross Loan'][colKey] = formatCurrency(result.grossLoan, 0);
                                        }

                                        // Net Loan
                                        if (values['Net Loan']) {
                                          values['Net Loan'][colKey] = formatCurrency(result.netLoan, 0);
                                        }

                                        // Product Fee £
                                        if (values['Product Fee £']) {
                                          values['Product Fee £'][colKey] = formatCurrency(result.productFeeAmount, 0);
                                        }

                                        // LTV
                                        if (values['LTV'] && result.ltv) {
                                          values['LTV'][colKey] = `${(result.ltv * 100).toFixed(2)}%`;
                                        }

                                        // Net LTV
                                        if (values['Net LTV'] && result.netLtv) {
                                          values['Net LTV'][colKey] = `${(result.netLtv * 100).toFixed(2)}%`;
                                        }

                                        // ICR
                                        if (values['ICR'] && result.icr != null) {
                                          // Convert coverage ratio to percentage; do NOT round up to avoid masking below-min cases
                                          const icrPct = result.icr * 100;
                                          const minIcr = result.minimumIcr != null ? Number(result.minimumIcr) : null;
                                          // Floor to whole percent (e.g. 124.9 -> 124) so we never show 125 when actual <125
                                          const wholeActual = Math.floor(icrPct + 1e-9);
                                          let display = `${wholeActual}%`;
                                          if (minIcr != null && icrPct + 1e-9 < minIcr) {
                                            display = `${wholeActual}% (min ${Math.round(minIcr)}%)`;
                                          }
                                          values['ICR'][colKey] = display;
                                        }

                                        // Monthly Interest Cost
                                        if (values['Monthly Interest Cost']) {
                                          values['Monthly Interest Cost'][colKey] = formatCurrency(result.monthlyInterestCost, 0);
                                        }

                                        // Direct Debit (with 2 decimal places)
                                        if (values['Direct Debit']) {
                                          values['Direct Debit'][colKey] = formatCurrency(result.directDebit, 2);
                                        }

                                        // Rolled Months Interest (0 decimal places)
                                        if (values['Rolled Months Interest']) {
                                          values['Rolled Months Interest'][colKey] = formatCurrency(result.rolledInterestAmount, 0);
                                        }

                                        // Deferred Interest £ (2 decimal places)
                                        if (values['Deferred Interest £']) {
                                          values['Deferred Interest £'][colKey] = formatCurrency(result.deferredInterestAmount, 2);
                                        }

                                        // Broker Commission (Proc Fee %)
                                        if (values['Broker Commission (Proc Fee %)']) {
                                          values['Broker Commission (Proc Fee %)'][colKey] = `${result.procFeePct}%`;
                                        }

                                        // Broker Commission (Proc Fee £)
                                        if (values['Broker Commission (Proc Fee £)']) {
                                          values['Broker Commission (Proc Fee £)'][colKey] = formatCurrency(result.procFeeValue, 0);
                                        }

                                        // Broker Client Fee
                                        if (values['Broker Client Fee']) {
                                          values['Broker Client Fee'][colKey] = formatCurrency(result.brokerClientFee, 0);
                                        }

                                        // APRC
                                        if (values['APRC'] && result.aprc) {
                                          values['APRC'][colKey] = `${result.aprc.toFixed(2)}%`;
                                        }

                                        // Admin Fee
                                        if (values['Admin Fee']) {
                                          values['Admin Fee'][colKey] = formatCurrency(result.adminFee, 0);
                                        }

                                        // ERC (show schedule text like "Yr1 5%, Yr2 4%")
                                        if (values['ERC']) {
                                          values['ERC'][colKey] = result.ercText || '—';
                                        }

                                        // Exit Fee
                                        if (values['Exit Fee']) {
                                          values['Exit Fee'][colKey] = formatCurrency(result.exitFee, 0);
                                        }

                                        // Initial Term
                                        if (values['Initial Term'] && result.initialTerm != null) {
                                          values['Initial Term'][colKey] = `${result.initialTerm} months`;
                                        }

                                        // Full Term
                                        if (values['Full Term'] && result.fullTerm != null) {
                                          values['Full Term'][colKey] = `${result.fullTerm} months`;
                                        }

                                        // NBP
                                        if (values['NBP']) {
                                          values['NBP'][colKey] = formatCurrency(result.nbp, 0);
                                        }

                                        // NBP LTV
                                        if (values['NBP LTV'] && result.nbpLTV != null) {
                                          values['NBP LTV'][colKey] = `${result.nbpLTV.toFixed(2)}%`;
                                        }

                                        // Revert Rate
                                        if (values['Revert Rate']) {
                                          if (result.revertRateText) {
                                            values['Revert Rate'][colKey] = result.revertRateText;
                                          } else if (result.revertRate) {
                                            values['Revert Rate'][colKey] = `${result.revertRate.toFixed(2)}%`;
                                          }
                                        }

                                        // Revert Rate DD
                                        if (values['Revert Rate DD'] && result.revertRateDD) {
                                          values['Revert Rate DD'][colKey] = formatCurrency(result.revertRateDD, 0);
                                        }

                                        // Serviced Interest
                                        if (values['Serviced Interest']) {
                                          values['Serviced Interest'][colKey] = formatCurrency(result.servicedInterest, 0);
                                        }

                                        // Serviced Months
                                        if (values['Serviced Months'] && result.servicedMonths != null) {
                                          values['Serviced Months'][colKey] = `${result.servicedMonths} months`;
                                        }

                                        // Title Insurance Cost
                                        if (values['Title Insurance Cost']) {
                                          values['Title Insurance Cost'][colKey] = formatCurrency(result.titleInsuranceCost, 0);
                                        }

                                        // Total Cost to Borrower
                                        if (values['Total Cost to Borrower']) {
                                          values['Total Cost to Borrower'][colKey] = formatCurrency(result.totalCostToBorrower, 0);
                                        }
                                      }
                                    });

                                    // Extract min/max values from rates for sliders
                                    const sliderLimits = {};
                                    const rolledMonthsMinPerCol = {};
                                    const rolledMonthsMaxPerCol = {};
                                    const deferredInterestMinPerCol = {};
                                    const deferredInterestMaxPerCol = {};
                                    
                                    feeBuckets.forEach((fb, idx) => {
                                      const colKey = columnsHeaders[idx];
                                      const rows = filteredRates.filter(r => {
                                        const key = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
                                        return key === fb;
                                      });
                                      const best = (rows || []).filter(r => r.rate != null).sort((a,b) => Number(a.rate) - Number(b.rate))[0] || (rows || [])[0] || null;
                                      
                                      if (best) {
                                        rolledMonthsMinPerCol[colKey] = best.min_rolled_months ?? 0;
                                        rolledMonthsMaxPerCol[colKey] = best.max_rolled_months ?? 24;
                                        deferredInterestMinPerCol[colKey] = best.min_defer_int ?? 0;
                                        deferredInterestMaxPerCol[colKey] = best.max_defer_int ?? 100;
                                      } else {
                                        rolledMonthsMinPerCol[colKey] = 0;
                                        rolledMonthsMaxPerCol[colKey] = 24;
                                        deferredInterestMinPerCol[colKey] = 0;
                                        deferredInterestMaxPerCol[colKey] = 100;
                                      }
                                    });

                                    // Use per-column values or optimized values for display
                                    // Important: Use optimizedValuesRef.current to get the LATEST optimized values
                                    // calculated during this render, not the stale state values
                                    const currentRolledMonthsPerCol = {};
                                    const currentDeferredInterestPerCol = {};
                                    columnsHeaders.forEach(col => {
                                      // Priority: manual value > latest ref value > old state value > min value
                                      // Use manual value if explicitly set, otherwise always prefer the latest optimized from ref
                                      const hasManualRolled = rolledMonthsPerColumn[col] !== undefined;
                                      const hasManualDeferred = deferredInterestPerColumn[col] !== undefined;
                                      
                                      currentRolledMonthsPerCol[col] = hasManualRolled
                                        ? rolledMonthsPerColumn[col]
                                        : (optimizedValuesRef.current.rolled[col] !== undefined 
                                          ? optimizedValuesRef.current.rolled[col]
                                          : (optimizedRolledPerColumn[col] !== undefined 
                                            ? optimizedRolledPerColumn[col] 
                                            : (rolledMonthsMinPerCol[col] || 0)));
                                          
                                      currentDeferredInterestPerCol[col] = hasManualDeferred
                                        ? deferredInterestPerColumn[col]
                                        : (optimizedValuesRef.current.deferred[col] !== undefined
                                          ? optimizedValuesRef.current.deferred[col]
                                          : (optimizedDeferredPerColumn[col] !== undefined
                                            ? optimizedDeferredPerColumn[col]
                                            : (deferredInterestMinPerCol[col] || 0)));
                                    });

                                    // Merge state optimized values with latest ref values for SliderResultRow
                                    const latestOptimizedRolled = { ...optimizedRolledPerColumn, ...optimizedValuesRef.current.rolled };
                                    const latestOptimizedDeferred = { ...optimizedDeferredPerColumn, ...optimizedValuesRef.current.deferred };

                                    // Render rows in order, using slider for specific fields
                                    return orderedRows.map((rowLabel) => {
                                      if (rowLabel === 'Rolled Months') {
                                        return (
                                          <SliderResultRow
                                            key="Rolled Months"
                                            label={getLabel('Rolled Months')}
                                            value={0}
                                            onChange={(newValue, columnKey) => {
                                              // Always set as manual value - don't auto-clear even if matches optimized
                                              // User must explicitly click reset button to re-optimize
                                              setRolledMonthsPerColumn(prev => ({ ...prev, [columnKey]: newValue }));
                                              
                                              // Mark manual mode as active (stays true until reset)
                                              setManualModeActivePerColumn(prev => ({ ...prev, [columnKey]: true }));
                                              
                                              // When user manually changes rolled months, also lock the current deferred value
                                              // to prevent re-optimization
                                              setDeferredInterestPerColumn(prev => {
                                                // If deferred is already manual, don't change it
                                                if (prev[columnKey] !== undefined) return prev;
                                                // Lock the current displayed deferred value
                                                const currentDeferred = currentDeferredInterestPerCol[columnKey];
                                                if (currentDeferred !== undefined) {
                                                  return { ...prev, [columnKey]: currentDeferred };
                                                }
                                                return prev;
                                              });
                                            }}
                                            onReset={(columnKey) => {
                                              setRolledMonthsPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              // Also clear deferred to allow full re-optimization
                                              setDeferredInterestPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              // Clear manual mode flag
                                              setManualModeActivePerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                            }}
                                            min={0}
                                            max={24}
                                            step={1}
                                            suffix=" months"
                                            disabled={isReadOnly}
                                            displayOnly={publicMode}
                                            columns={columnsHeaders}
                                            columnValues={currentRolledMonthsPerCol}
                                            columnMinValues={rolledMonthsMinPerCol}
                                            columnMaxValues={rolledMonthsMaxPerCol}
                                            columnOptimizedValues={latestOptimizedRolled}
                                            columnManualModeActive={manualModeActivePerColumn}
                                          />
                                        );
                                      } else if (rowLabel === 'Deferred Interest %') {
                                        return (
                                          <SliderResultRow
                                            key="Deferred Interest %"
                                            label={getLabel('Deferred Interest %')}
                                            value={0}
                                            onChange={(newValue, columnKey) => {
                                              // Always set as manual value - don't auto-clear even if matches optimized
                                              // User must explicitly click reset button to re-optimize
                                              setDeferredInterestPerColumn(prev => ({ ...prev, [columnKey]: newValue }));
                                              
                                              // Mark manual mode as active (stays true until reset)
                                              setManualModeActivePerColumn(prev => ({ ...prev, [columnKey]: true }));
                                              
                                              // When user manually changes deferred interest, also lock the current rolled value
                                              // to prevent re-optimization
                                              setRolledMonthsPerColumn(prev => {
                                                // If rolled is already manual, don't change it
                                                if (prev[columnKey] !== undefined) return prev;
                                                // Lock the current displayed rolled value
                                                const currentRolled = currentRolledMonthsPerCol[columnKey];
                                                if (currentRolled !== undefined) {
                                                  return { ...prev, [columnKey]: currentRolled };
                                                }
                                                return prev;
                                              });
                                            }}
                                            onReset={(columnKey) => {
                                              setDeferredInterestPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              // Also clear rolled to allow full re-optimization
                                              setRolledMonthsPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              // Clear manual mode flag
                                              setManualModeActivePerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                            }}
                                            min={0}
                                            max={100}
                                            step={0.01}
                                            suffix="%"
                                            disabled={isReadOnly}
                                            displayOnly={publicMode}
                                            columns={columnsHeaders}
                                            columnValues={currentDeferredInterestPerCol}
                                            columnMinValues={deferredInterestMinPerCol}
                                            columnMaxValues={deferredInterestMaxPerCol}
                                            columnOptimizedValues={latestOptimizedDeferred}
                                            columnManualModeActive={manualModeActivePerColumn}
                                            formatValue={(v) => (Number.isFinite(v) ? Number(v).toFixed(2) : v)}
                                          />
                                        );
                                      } else if (rowLabel === 'Product Fee %') {
                                        return (
                                          <EditableResultRow
                                            key="Product Fee %"
                                            label={getLabel('Product Fee %')}
                                            columns={columnsHeaders}
                                            columnValues={values['Product Fee %'] || {}}
                                            originalValues={originalProductFees}
                                            onValueChange={(newValue, columnKey) => {
                                              setProductFeeOverrides(prev => ({
                                                ...prev,
                                                [columnKey]: newValue
                                              }));
                                              // Reset manual mode for this column so it recalculates optimum rolled/deferred
                                              setRolledMonthsPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              setDeferredInterestPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              setManualModeActivePerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                            }}
                                            onReset={(columnKey) => {
                                              setProductFeeOverrides(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              // Reset manual mode for this column when product fee is reset
                                              setRolledMonthsPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              setDeferredInterestPerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                              setManualModeActivePerColumn(prev => {
                                                const updated = { ...prev };
                                                delete updated[columnKey];
                                                return updated;
                                              });
                                            }}
                                            disabled={isReadOnly}
                                            displayOnly={publicMode}
                                            suffix="%"
                                          />
                                        );
                                      } else {
                                        // Regular placeholder row - use getLabel for display
                                        return (
                                          <tr key={rowLabel}>
                                            <td className="vertical-align-top font-weight-600">{getLabel(rowLabel)}</td>
                                            {columnsHeaders.map((c) => (
                                              <td key={c} className="vertical-align-top text-align-center">
                                                {(values && values[rowLabel] && Object.prototype.hasOwnProperty.call(values[rowLabel], c)) ? values[rowLabel][c] : '—'}
                                              </td>
                                            ))}
                                          </tr>
                                        );
                                      }
                                    });
                                  })()
                                }
                              </tbody>
                            </table>
                           
                          </div>
                        )}
                      </>
                    );
          })()}
        </div>
      </div>
      </RangeToggle>

      {/* UW Requirements Checklist - HIDDEN */}
      {/* <div style={{ marginTop: '1rem' }}>
        <CollapsibleSection
          title="UW Requirements Checklist"
          expanded={uwChecklistExpanded}
          onToggle={() => setUwChecklistExpanded(prev => !prev)}
        >
        <UWRequirementsChecklist
          stage="Both"
          quoteData={{
            // Pass all answers for condition evaluation
            ...answers,
            // Include borrower name from saved quote
            borrower_name: currentQuoteData?.borrower_name || '',
            quote_borrower_name: currentQuoteData?.quote_borrower_name || '',
            // Map to standard field names used in UW conditions
            // Database question keys: hmo, mufb, holiday, flatAboveComm, expat, etc.
            property_type: answers['hmo'] || answers['Property type'] || '',
            hmo: answers['hmo'] || '',
            mufb: answers['mufb'] || '',
            holiday: answers['holiday'] || '',
            // applicant_type comes from saved quote, not criteria answers
            // Values are 'Personal' or 'Corporate'
            applicant_type: currentQuoteData?.applicant_type || '',
            loan_purpose: answers['Loan purpose'] || ''
          }}
          checkedItems={uwCheckedItems || {}}
          onCheckChange={(itemId, checked) => {
            try {
              if (itemId) {
                setUwCheckedItems(prev => ({ ...(prev || {}), [itemId]: checked }));
              }
            } catch (e) {
              // Prevent crash on checkbox change
            }
          }}
          customRequirements={uwCustomRequirements}
          onRequirementsChange={(updatedRequirements) => {
            setUwCustomRequirements(updatedRequirements);
          }}
          showExportButton={true}
          showGuidance={true}
          allowEdit={true}
        />
      </CollapsibleSection>
      </div> */}

      {/* Issue DIP Modal */}
      <IssueDIPModal
        isOpen={dipModalOpen}
        onClose={() => {
          setDipModalOpen(false);
          setSelectedFeeTypeForDip('');
          setFilteredRatesForDip([]);
        }}
        quoteId={currentQuoteId}
        calculatorType="BTL"
        existingDipData={dipData}
        availableFeeTypes={getAvailableFeeTypes()}
        allRates={relevantRates}
        showProductRangeSelection={hasBothRanges()}
        onSave={handleSaveDipData}
        onCreatePDF={handleCreatePDF}
        onFeeTypeSelected={handleFeeTypeSelection}
      />

      {/* Issue Quote Modal */}
      <IssueQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        quoteId={currentQuoteId}
        calculatorType="BTL"
        availableFeeRanges={getAvailableFeeTypes()}
        existingQuoteData={quoteData}
        onSave={handleSaveQuoteData}
        onCreatePDF={handleCreateQuotePDF}
      />

    </div>
  );
}
