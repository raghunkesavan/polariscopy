import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/Calculator.scss';
import SaveQuoteButton from './SaveQuoteButton';
import IssueDIPModal from '../modals/IssueDIPModal';
import IssueQuoteModal from '../modals/IssueQuoteModal';
import CalculatorResultsPlaceholders from './CalculatorResultsPlaceholders';
import SliderResultRow from '../calculator/SliderResultRow';
import EditableResultRow from '../calculator/EditableResultRow';
import CollapsibleSection from '../calculator/CollapsibleSection';
import ClientDetailsSection from '../calculator/shared/ClientDetailsSection';
import BridgingProductSection from '../calculator/bridging/BridgingProductSection';
import LoanDetailsSection from '../calculator/bridging/LoanDetailsSection';
import MultiPropertyDetailsSection from '../calculator/bridging/MultiPropertyDetailsSection';
import useBrokerSettings from '../../hooks/calculator/useBrokerSettings';
import { useResultsVisibility } from '../../hooks/useResultsVisibility';
import { useResultsRowOrder } from '../../hooks/useResultsRowOrder';
import { useResultsLabelAlias } from '../../hooks/useResultsLabelAlias';
import { getQuote, upsertQuoteData, requestDipPdf, requestQuotePdf, saveUWChecklistState, loadUWChecklistState } from '../../utils/quotes';
import { parseNumber, formatCurrencyInput } from '../../utils/calculator/numberFormatting';
import { computeLoanLtv, computeLoanSize } from '../../utils/calculator/loanCalculations';
import { pickBestRate, computeModeFromAnswers } from '../../utils/calculator/rateFiltering';
import { LOCALSTORAGE_CONSTANTS_KEY, getMarketRates } from '../../config/constants';
import { BridgeFusionCalculator } from '../../utils/bridgeFusionCalculationEngine';
import UWRequirementsChecklist from '../shared/UWRequirementsChecklist';

const getNumericValue = (value) => {
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function BridgingCalculator({ initialQuote = null }) {
  const { supabase } = useSupabase();
  const { canEditCalculators, token } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const navQuote = location && location.state ? location.state.loadQuote : null;
  const effectiveInitialQuote = initialQuote || navQuote;

  const isReadOnly = !canEditCalculators();

  // Use custom hook for broker settings - pass 'bridge' as calculator type
  const brokerSettings = useBrokerSettings(effectiveInitialQuote, 'bridge');
  
  // Use custom hook for results table visibility
  const { isRowVisible } = useResultsVisibility('bridge');
  
  // Use custom hook for results table row ordering
  const { getOrderedRows } = useResultsRowOrder('bridge');

  // Use custom hook for results table label aliases
  const { getLabel } = useResultsLabelAlias('bridge');

  const [allCriteria, setAllCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultScope = 'Bridge & Fusion';
  const [productScope, setProductScope] = useState('');

  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  // Collapsible sections - start collapsed, only one open at a time (accordion)
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);
  const [loanDetailsExpanded, setLoanDetailsExpanded] = useState(false);
  const [clientDetailsExpanded, setClientDetailsExpanded] = useState(true); // First section open by default

  const [propertyValue, setPropertyValue] = useState('');
  const [grossLoan, setGrossLoan] = useState('');
  const [firstChargeValue, setFirstChargeValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [topSlicing, setTopSlicing] = useState('');
  const [useSpecificNet, setUseSpecificNet] = useState('No');
  const [specificNetLoan, setSpecificNetLoan] = useState('');
  const [bridgingTerm, setBridgingTerm] = useState('12');
  const [commitmentFee, setCommitmentFee] = useState('');
  const [exitFeePercent, setExitFeePercent] = useState('');
  const [loanCalculationRequested, setLoanCalculationRequested] = useState('Gross loan');
  const [rates, setRates] = useState([]);
  const [relevantRates, setRelevantRates] = useState([]);
  const [bridgeMatched, setBridgeMatched] = useState([]);
  const [fusionMatched, setFusionMatched] = useState([]);
  const [subProduct, setSubProduct] = useState('');
  const [subProductOptions, setSubProductOptions] = useState([]);
  const [subProductLimits, setSubProductLimits] = useState({});
  const [chargeType, setChargeType] = useState('All');

  // Slider controls for results - per-column state
  const [rolledMonthsPerColumn, setRolledMonthsPerColumn] = useState({});
  const [deferredInterestPerColumn, setDeferredInterestPerColumn] = useState({});
  
  // Track whether we loaded results from a saved quote (skip rates fetch if so)
  const loadedFromSavedQuoteRef = useRef(false);

  // Editable rate and product fee overrides - per-column state
  const [ratesOverrides, setRatesOverrides] = useState({});
  const [productFeeOverrides, setProductFeeOverrides] = useState({});

  const [dipModalOpen, setDipModalOpen] = useState(false);
  const [currentQuoteId, setCurrentQuoteId] = useState(effectiveInitialQuote?.id || null);
  // Store full quote data for Update Quote modal (name, borrower info, notes, etc.)
  const [currentQuoteData, setCurrentQuoteData] = useState(effectiveInitialQuote || null);
  const [dipData, setDipData] = useState({});
  const [selectedFeeTypeForDip, setSelectedFeeTypeForDip] = useState('');
  const [filteredRatesForDip, setFilteredRatesForDip] = useState([]);

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({});
  const [currentQuoteRef, setCurrentQuoteRef] = useState(effectiveInitialQuote?.reference_number || null);

  const [addFeesToggle, setAddFeesToggle] = useState(false);
  const [feeCalculationType, setFeeCalculationType] = useState('pound');
  const [additionalFeeAmount, setAdditionalFeeAmount] = useState('');

  const [multiPropertyDetailsExpanded, setMultiPropertyDetailsExpanded] = useState(false);
  const [multiPropertyRows, setMultiPropertyRows] = useState([
    { id: Date.now(), property_address: '', property_type: 'Residential', property_value: '', charge_type: 'First charge', first_charge_amount: '', gross_loan: 0 }
  ]);

  // UW Requirements checklist state
  const [uwChecklistExpanded, setUwChecklistExpanded] = useState(false);
  const [uwCheckedItems, setUwCheckedItems] = useState({});
  const [uwCustomRequirements, setUwCustomRequirements] = useState(null);

  // Multi-property helper functions
  const calculateMultiPropertyGrossLoan = (propertyType, propertyValue, firstChargeAmount) => {
    const pv = Number(propertyValue) || 0;
    const fca = Number(firstChargeAmount) || 0;
    const maxLtv = propertyType === 'Residential' ? 0.75 : 0.70; // 75% for Residential, 70% for Commercial/Semi-Commercial
    const grossLoan = (pv * maxLtv) - fca;
    return grossLoan > 0 ? grossLoan : 0;
  };

  const handleMultiPropertyRowChange = (id, field, value) => {
    setMultiPropertyRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      
      // Parse numeric fields to remove formatting before storing
      let processedValue = value;
      if (field === 'property_value' || field === 'first_charge_amount') {
        processedValue = parseNumber(value);
        // Keep empty string if user cleared the field
        if (!Number.isFinite(processedValue)) {
          processedValue = '';
        }
      }
      
      const updated = { ...row, [field]: processedValue };
      // Recalculate gross loan when property_type, property_value, or first_charge_amount changes
      if (['property_type', 'property_value', 'first_charge_amount'].includes(field)) {
        updated.gross_loan = calculateMultiPropertyGrossLoan(
          updated.property_type,
          updated.property_value,
          updated.first_charge_amount
        );
      }
      return updated;
    }));
  };

  const addMultiPropertyRow = () => {
    setMultiPropertyRows(prev => [
      ...prev,
      { id: Date.now(), property_address: '', property_type: 'Residential', property_value: '', charge_type: 'First charge', first_charge_amount: '', gross_loan: 0 }
    ]);
  };

  const deleteMultiPropertyRow = (id) => {
    if (multiPropertyRows.length <= 1) return; // Keep at least one row
    setMultiPropertyRows(prev => prev.filter(row => row.id !== id));
  };

  // Calculate totals for multi-property
  const multiPropertyTotals = useMemo(() => {
    return multiPropertyRows.reduce((acc, row) => {
      acc.property_value += Number(row.property_value) || 0;
      acc.first_charge_amount += Number(row.first_charge_amount) || 0;
      acc.gross_loan += Number(row.gross_loan) || 0;
      return acc;
    }, { property_value: 0, first_charge_amount: 0, gross_loan: 0 });
  }, [multiPropertyRows]);

  // Check if Multi-property is set to "Yes"
  const isMultiProperty = useMemo(() => {
    const multiPropAnswer = Object.entries(answers).find(([key]) => 
      key.toLowerCase().includes('multi') && key.toLowerCase().includes('property')
    );
    if (!multiPropAnswer) return false;
    const answer = multiPropAnswer[1];
    return answer?.option_label?.toString().toLowerCase() === 'yes';
  }, [answers]);

  // Calculate available term range from bridge rates (exclude Fusion products)
  const termRange = useMemo(() => {
    if (!rates || rates.length === 0) {
      return { min: 3, max: 18 }; // Default fallback
    }
    
    // Filter for Bridge products only (exclude Fusion)
    // Check both set_key and property fields for "bridge" or "bridging"
    const bridgeRates = rates.filter(r => {
      const setKey = (r.set_key || '').toLowerCase();
      const property = (r.property || '').toLowerCase();
      const isBridge = setKey.includes('bridge') || setKey.includes('bridging') || property.includes('bridge') || property.includes('bridging');
      const isFusion = setKey.includes('fusion') || property.includes('fusion');
      return isBridge && !isFusion;
    });
    
    if (bridgeRates.length === 0) {
      return { min: 3, max: 18 }; // Fallback if no bridge rates found
    }
    
    // Find the minimum min_term and maximum max_term across bridge rates
    const minTerms = bridgeRates.map(r => r.min_term).filter(t => t != null && !isNaN(t));
    const maxTerms = bridgeRates.map(r => r.max_term).filter(t => t != null && !isNaN(t));
    
    const minTerm = minTerms.length > 0 ? Math.min(...minTerms) : 3;
    const maxTerm = maxTerms.length > 0 ? Math.max(...maxTerms) : 18;
    
    return { min: minTerm, max: maxTerm };
  }, [rates]);

  
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('criteria_config_flat')
          .select('*');
        if (error) throw error;
        if (!mounted) return;
        setAllCriteria(data || []);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    // Build question map for bridging.
    // Strategy: look for any rows that explicitly mention 'bridge' or 'fusion' in common fields
    // (product_scope, criteria_set, question_group, question_label, question_key, option_label).
    // If none found, fall back to the currently-selected productScope (if any) or show a helpful message.
    const needle = /bridge|fusion/i;
    const raw = (allCriteria || []);
    const normalizeStr = (s) => (s || '').toString().trim().toLowerCase();
    // Find explicit matches that mention bridge/fusion. If a productScope is already
    // selected, restrict explicit matches to that scope to avoid leaking rows from other scopes.
    const explicitMatches = raw.filter((r) => {
      if (!r) return false;
      const fields = [r.product_scope, r.criteria_set, r.question_group, r.question_label, r.question_key, r.option_label];
      const mentions = fields.some(f => typeof f === 'string' && needle.test(f));
      if (!mentions) return false;
      if (productScope) {
        // only keep explicit matches within the selected product scope
        return normalizeStr(r.product_scope) === normalizeStr(productScope);
      }
      return true;
    });

    // If we have explicit matches, prefer those. Otherwise, if a productScope is selected, use rows matching that scope.
    let filtered = explicitMatches;
    if (filtered.length === 0 && productScope) {
      filtered = raw.filter(r => normalizeStr(r.product_scope) === normalizeStr(productScope));
    }

    const map = {};
    filtered.forEach((row) => {
      const key = row.question_key || row.question_label || 'unknown';
      if (!map[key]) map[key] = { label: row.question_label || key, options: [], infoTip: '', displayOrder: undefined };
      if (!map[key].infoTip && (row.info_tip || row.helper)) map[key].infoTip = row.info_tip || row.helper || '';
      if (map[key].displayOrder === undefined && (row.display_order !== undefined && row.display_order !== null)) {
        const parsed = Number(row.display_order);
        map[key].displayOrder = Number.isFinite(parsed) ? parsed : undefined;
      }
      // dedupe options by option_label (case-insensitive) or id
      const optLabel = (row.option_label || '').toString().trim().toLowerCase();
      const exists = map[key].options.some(o => (o.id && o.id === row.id) || ((o.option_label || '').toString().trim().toLowerCase() === optLabel));
      if (!exists) map[key].options.push({ id: row.id, option_label: row.option_label, raw: row });
    });
    
    // Always include Charge Type question from any product scope if it exists
    const chargeTypeRows = raw.filter(r => {
      const key = r.question_key || r.question_label || '';
      return /charge[-_ ]?type|chargetype/i.test(key);
    });
    if (chargeTypeRows.length > 0 && !map['chargeType'] && !map['Charge Type']) {
      chargeTypeRows.forEach((row) => {
        const key = row.question_key || row.question_label || 'chargeType';
        if (!map[key]) map[key] = { label: row.question_label || key, options: [], infoTip: '', displayOrder: undefined };
        if (!map[key].infoTip && (row.info_tip || row.helper)) map[key].infoTip = row.info_tip || row.helper || '';
        if (map[key].displayOrder === undefined && (row.display_order !== undefined && row.display_order !== null)) {
          const parsed = Number(row.display_order);
          map[key].displayOrder = Number.isFinite(parsed) ? parsed : undefined;
        }
        const optLabel = (row.option_label || '').toString().trim().toLowerCase();
        const exists = map[key].options.some(o => (o.id && o.id === row.id) || ((o.option_label || '').toString().trim().toLowerCase() === optLabel));
        if (!exists) map[key].options.push({ id: row.id, option_label: row.option_label, raw: row });
      });
    }

    Object.keys(map).forEach(k => {
      map[k].options.sort((a, b) => {
        const labelA = (a.option_label || '').toString().trim().toLowerCase();
        const labelB = (b.option_label || '').toString().trim().toLowerCase();
        
        // Keep "please select" or "select..." at the top
        const isPlaceholderA = labelA === 'please select' || labelA === 'select...' || labelA === 'select';
        const isPlaceholderB = labelB === 'please select' || labelB === 'select...' || labelB === 'select';
        
        if (isPlaceholderA && !isPlaceholderB) return -1;
        if (!isPlaceholderA && isPlaceholderB) return 1;
        
        // Sort by tier (controls dropdown option order)
        const tierA = a.raw?.tier ?? Number.MAX_SAFE_INTEGER;
        const tierB = b.raw?.tier ?? Number.MAX_SAFE_INTEGER;
        if (tierA !== tierB) return tierA - tierB;
        
        // Fallback sort: alphabetical by option_label
        return (a.option_label || '').localeCompare(b.option_label || '');
      });
    });

    setQuestions(map);
    // reset answers ONLY if there's no initialQuote (i.e., new quote, not loading existing)
    if (!effectiveInitialQuote) {
      const starting = {};
      Object.keys(map).forEach(k => { starting[k] = map[k].options[0] || null; });
      setAnswers(starting);
    }
  }, [allCriteria, productScope, effectiveInitialQuote]);

  // Auto-select productScope intelligently after criteria load: prefer an explicit scope that mentions bridge/fusion
  useEffect(() => {
    if (!allCriteria || allCriteria.length === 0) return;
    const needle = /bridge|fusion/i;
    const scopes = Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean)));
    const explicit = scopes.find(s => needle.test(s));
    if (explicit) {
      setProductScope(explicit);
      return;
    }
    // fallback: choose first available scope if none explicitly references bridge/fusion
    if (!productScope && scopes.length > 0) setProductScope(scopes[0]);
  }, [allCriteria]);

  // If an initialQuote is provided, populate fields from the database structure
  useEffect(() => {
    try {
      if (!effectiveInitialQuote) return;
      
      // New structure: data is directly on the quote object (no nested payload)
      const quote = effectiveInitialQuote;
      
      // Store quote ID and DIP data for Issue DIP modal
      if (quote.id) setCurrentQuoteId(quote.id);
      if (quote.commercial_or_main_residence || quote.dip_date || quote.dip_expiry_date) {
        // Map 'Company' to 'Corporate' for backward compatibility
        const applicantType = quote.applicant_type === 'Company' ? 'Corporate' : quote.applicant_type;
        setDipData({
          commercial_or_main_residence: quote.commercial_or_main_residence,
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
          funding_line: quote.funding_line,
          title_insurance: quote.title_insurance
        });
      }
      
      if (quote.property_value != null) setPropertyValue(formatCurrencyInput(quote.property_value));
      if (quote.gross_loan != null) setGrossLoan(formatCurrencyInput(quote.gross_loan));
      if (quote.first_charge_value != null) setFirstChargeValue(formatCurrencyInput(quote.first_charge_value));
      if (quote.monthly_rent != null) setMonthlyRent(formatCurrencyInput(quote.monthly_rent));
      // Load top_slicing - handle both 0 and non-zero values
      if (quote.top_slicing !== undefined && quote.top_slicing !== null) {
        setTopSlicing(formatCurrencyInput(quote.top_slicing));
      }
      if (quote.use_specific_net_loan != null) setUseSpecificNet(quote.use_specific_net_loan ? 'Yes' : 'No');
      if (quote.specific_net_loan != null) setSpecificNetLoan(formatCurrencyInput(quote.specific_net_loan));
      if (quote.bridging_loan_term != null) setBridgingTerm(String(quote.bridging_loan_term));
      // Handle commitment_fee - allow 0 values
      if (quote.commitment_fee !== undefined && quote.commitment_fee !== null) {
        const commitmentFeeValue = typeof quote.commitment_fee === 'number' 
          ? quote.commitment_fee 
          : parseFloat(String(quote.commitment_fee).replace(/[^0-9.-]/g, '')) || 0;
        setCommitmentFee(formatCurrencyInput(commitmentFeeValue));
      }
      // Handle exit_fee_percent - allow 0 values
      if (quote.exit_fee_percent !== undefined && quote.exit_fee_percent !== null) {
        setExitFeePercent(String(quote.exit_fee_percent));
      }
      if (quote.loan_calculation_requested) setLoanCalculationRequested(quote.loan_calculation_requested);
      if (quote.product_scope) setProductScope(quote.product_scope);
      if (quote.charge_type) setChargeType(quote.charge_type);
      if (quote.sub_product) setSubProduct(quote.sub_product);
      
      // Note: Client details are loaded by useBrokerSettings hook
      
      // Load multi-property details if available
      if (quote.id) {
        supabase
          .from('bridge_multi_property_details')
          .select('*')
          .eq('bridge_quote_id', quote.id)
          .order('row_order', { ascending: true })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              const loadedRows = data.map(row => ({
                id: row.id,
                property_address: row.property_address || '',
                property_type: row.property_type || 'Residential',
                property_value: row.property_value || '',
                charge_type: row.charge_type || 'First charge',
                first_charge_amount: row.first_charge_amount || '',
                gross_loan: row.gross_loan || 0
              }));
              setMultiPropertyRows(loadedRows);
            }
          });
      }
      
      // Load calculated results if available (from bridge_quote_results table)
      if (quote.results && Array.isArray(quote.results) && quote.results.length > 0) {
        // Map database results back to the format expected by the calculator
        const bbrPercent = (getMarketRates()?.STANDARD_BBR || 0) * 100; // e.g., 4% => 4
        const loadedRates = quote.results.map(result => {
          const productName = result.product_name;
          const initialRatePct = Number(result.initial_rate);
          const isFusion = productName === 'Fusion';
          const isVarBridge = productName === 'Variable Bridge';
          const isFixedBridge = productName === 'Fixed Bridge';
          // Reconstruct the underlying rate used by engine
          // - Fusion: annual margin (percent)
          // - Variable Bridge: monthly margin (percent) = (initial annual - BBR annual)/12
          // - Fixed Bridge: monthly coupon (percent) = initial annual / 12
          const reconstructedRate = Number.isFinite(initialRatePct)
            ? (
                isFusion
                  ? (initialRatePct - bbrPercent) // keep annual margin for Fusion
                  : isVarBridge
                    ? ((initialRatePct - bbrPercent) / 12)
                    : isFixedBridge
                      ? (initialRatePct / 12)
                      : initialRatePct
              )
            : null;

          return ({
          product_fee: result.fee_column,
          gross_loan: result.gross_loan,
          net_loan: result.net_loan,
          ltv: result.ltv_percentage,
          ltv_percentage: result.ltv_percentage,
          net_ltv: result.net_ltv,
          property_value: result.property_value,
          icr: result.icr,
          initial_rate: result.initial_rate,
          rate: reconstructedRate,
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
          rolled_months_interest: result.rolled_months_interest || result.rolled_interest,
          rolled_interest: result.rolled_months_interest || result.rolled_interest,
          rolled_interest_coupon: result.rolled_interest_coupon,
          rolled_interest_bbr: result.rolled_interest_bbr,
          full_interest_coupon: result.full_interest_coupon,
          full_interest_bbr: result.full_interest_bbr,
          deferred_interest_percent: result.deferred_interest_percent,
          deferred_interest_pounds: result.deferred_interest_pounds || result.deferred_interest,
          deferred_interest: result.deferred_interest_pounds || result.deferred_interest,
          deferred_rate: result.deferred_rate,
          serviced_interest: result.serviced_interest,
          serviced_months: result.serviced_months,
          total_interest: result.total_interest,
          aprc_annual: result.aprc_annual || result.aprc,
          aprc_monthly: result.aprc_monthly,
          total_amount_repayable: result.total_amount_repayable,
          full_rate_monthly: result.full_rate_monthly,
          full_coupon_rate_monthly: result.full_coupon_rate_monthly,
          margin_monthly: result.margin_monthly,
          bbr_monthly: result.bbr_monthly,
          erc_1_pounds: result.erc_1_pounds,
          erc_2_pounds: result.erc_2_pounds,
          direct_debit: result.direct_debit,
          erc: result.erc,
          erc_fusion_only: result.erc_fusion_only,
          rent: result.rent,
          top_slicing: result.top_slicing,
          nbp: result.nbp,
          nbpLTV: result.nbpLTV,
          total_cost_to_borrower: result.total_cost_to_borrower,
          total_loan_term: result.total_loan_term,
          product_name: result.product_name,
          product: result.product_name,
        });
        });
        setRelevantRates(loadedRates);
        // Mark that we loaded from a saved quote to prevent rates fetch from overwriting
        loadedFromSavedQuoteRef.current = true;
        
        // Restore overrides from quote data if available (preferred method)
        if (quote.rates_overrides) {
          try {
            const overridesData = typeof quote.rates_overrides === 'string' 
              ? JSON.parse(quote.rates_overrides) 
              : quote.rates_overrides;
            if (overridesData && Object.keys(overridesData).length > 0) {
              setRatesOverrides(overridesData);
            }
          } catch (e) {
            // Failed to parse rates_overrides, fall back to reconstruction
            console.warn('Failed to parse rates_overrides:', e);
          }
        }
        
        if (quote.product_fee_overrides) {
          try {
            const overridesData = typeof quote.product_fee_overrides === 'string' 
              ? JSON.parse(quote.product_fee_overrides) 
              : quote.product_fee_overrides;
            if (overridesData && Object.keys(overridesData).length > 0) {
              setProductFeeOverrides(overridesData);
            }
          } catch (e) {
            // Failed to parse product_fee_overrides, fall back to reconstruction
            console.warn('Failed to parse product_fee_overrides:', e);
          }
        }
        
        if (quote.rolled_months_per_column) {
          try {
            const overridesData = typeof quote.rolled_months_per_column === 'string' 
              ? JSON.parse(quote.rolled_months_per_column) 
              : quote.rolled_months_per_column;
            if (overridesData && Object.keys(overridesData).length > 0) {
              setRolledMonthsPerColumn(overridesData);
            }
          } catch (e) {
            console.warn('Failed to parse rolled_months_per_column:', e);
          }
        }
        
        if (quote.deferred_interest_per_column) {
          try {
            const overridesData = typeof quote.deferred_interest_per_column === 'string' 
              ? JSON.parse(quote.deferred_interest_per_column) 
              : quote.deferred_interest_per_column;
            if (overridesData && Object.keys(overridesData).length > 0) {
              setDeferredInterestPerColumn(overridesData);
            }
          } catch (e) {
            console.warn('Failed to parse deferred_interest_per_column:', e);
          }
        }
      }
      
      // Load criteria answers if available
      if (quote.criteria_answers) {
        try {
          const answersData = typeof quote.criteria_answers === 'string' 
            ? JSON.parse(quote.criteria_answers) 
            : quote.criteria_answers;
          if (answersData) setAnswers(answersData);
        } catch (e) {
          // Failed to parse criteria_answers
        }
      }
    } catch (e) {
      // Failed to apply initial quote
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
        
        // Load custom requirements if present
        if (data && data.custom_requirements) {
          setUwCustomRequirements(data.custom_requirements);
        } else {
          setUwCustomRequirements(null);
        }
      } catch (e) {
        // Silently fail - checklist will start empty
      }
    }
    loadChecklistState();
  }, [currentQuoteId, token]);

  // Auto-save UW checklist state when items change (debounced)
  useEffect(() => {
    if (!currentQuoteId || !token) return;
    if (!uwCheckedItems || typeof uwCheckedItems !== 'object') return;
    if (Object.keys(uwCheckedItems).length === 0) return;

    const payload = { ...uwCheckedItems };

    // eslint-disable-next-line no-console
    console.log('[Bridge] autosave effect scheduled', { currentQuoteId, payload });

    const timeoutId = setTimeout(() => {
      try {
        Promise.resolve()
          .then(() => {
            // eslint-disable-next-line no-console
            console.log('[Bridge] autosave firing', { currentQuoteId, payload, customRequirements: uwCustomRequirements });
            return saveUWChecklistState(currentQuoteId, payload, 'both', token, uwCustomRequirements);
          })
          .then((response) => {
            // eslint-disable-next-line no-console
            console.log('[Bridge] autosave success', { response });
          })
          .catch((error) => {
             
            console.error('[Bridge] autosave error', error);
            // Ignore save errors; do not crash UI
          });
      } catch {
        // Absolute safety: never let this effect crash React
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [currentQuoteId, uwCheckedItems, uwCustomRequirements, token]);

  const handleAnswerChange = (key, idx) => {
    setAnswers(prev => ({ ...prev, [key]: questions[key].options[idx] }));
  };

  // Accordion behavior - close all other sections when one is opened
  const handleClientDetailsToggle = () => {
    const newState = !clientDetailsExpanded;
    setClientDetailsExpanded(newState);
    if (newState) {
      setCriteriaExpanded(false);
      setMultiPropertyDetailsExpanded(false);
      setLoanDetailsExpanded(false);
    }
  };

  const handleCriteriaToggle = () => {
    const newState = !criteriaExpanded;
    setCriteriaExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setMultiPropertyDetailsExpanded(false);
      setLoanDetailsExpanded(false);
    }
  };

  const handleMultiPropertyToggle = () => {
    const newState = !multiPropertyDetailsExpanded;
    setMultiPropertyDetailsExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setCriteriaExpanded(false);
      setLoanDetailsExpanded(false);
    }
  };

  const handleLoanDetailsToggle = () => {
    const newState = !loanDetailsExpanded;
    setLoanDetailsExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setCriteriaExpanded(false);
      setMultiPropertyDetailsExpanded(false);
    }
  };

  // Fetch rates for Bridging: filter depending on mode
  useEffect(() => {
    if (!supabase) return;
    
    // Always fetch rates from database - they're needed for filtering
    // The loadedFromSavedQuoteRef flag is used in the filtering effect, not here
    
    let mounted = true;
    async function loadRates() {
      try {
        // load bridge & fusion rates (not BTL rates)
        const { data, error } = await supabase.from('bridge_fusion_rates_full').select('*');
        if (error) throw error;
        if (!mounted) return;
        setRates(data || []);
        // derive sub-product options (prefer `product` field in rates as the sub-product identifier)
        const discovered = new Set();
        (data || []).forEach(r => {
          const canonical = (r.product || r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.property || '').toString().trim();
          if (canonical) discovered.add(canonical);
        });
        const options = Array.from(discovered).sort((a,b) => String(a).localeCompare(String(b)));
        setSubProductOptions(options);
        // derive loan/LTV limits per sub-product from the rates dataset
        const limits = {};
        const normalizeKey = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        (data || []).forEach(r => {
          const name = (r.product || r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.property || '').toString().trim();
          if (!name) return;
          const key = normalizeKey(name);
          if (!limits[key]) limits[key] = { name: name, minLoan: Infinity, maxLoan: -Infinity, minLtv: Infinity, maxLtv: -Infinity };
          const minLoan = parseNumber(r.min_loan ?? r.minloan ?? r.min_loan_amt ?? r.min_loan_amount);
          const maxLoan = parseNumber(r.max_loan ?? r.maxloan ?? r.max_loan_amt ?? r.max_loan_amount);
          const minLtv = parseNumber(r.min_ltv ?? r.minltv ?? r.min_LTV ?? r.minLTV ?? r.min_loan_ltv);
          const maxLtv = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
          if (Number.isFinite(minLoan)) limits[key].minLoan = Math.min(limits[key].minLoan, minLoan);
          if (Number.isFinite(maxLoan)) limits[key].maxLoan = Math.max(limits[key].maxLoan, maxLoan);
          if (Number.isFinite(minLtv)) limits[key].minLtv = Math.min(limits[key].minLtv, minLtv);
          if (Number.isFinite(maxLtv)) limits[key].maxLtv = Math.max(limits[key].maxLtv, maxLtv);
        });
        // normalize infinities to null and attach to state
        Object.keys(limits).forEach(k => {
          if (limits[k].minLoan === Infinity) limits[k].minLoan = null;
          if (limits[k].maxLoan === -Infinity) limits[k].maxLoan = null;
          if (limits[k].minLtv === Infinity) limits[k].minLtv = null;
          if (limits[k].maxLtv === -Infinity) limits[k].maxLtv = null;
        });
        setSubProductLimits(limits);
      } catch (err) {
        // Failed to load rates
      }
    }
    loadRates();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    // when second-charge is selected, clear subProduct and disable sub-product selection in UI
    if ((chargeType || '').toString().toLowerCase() === 'second') {
      // Align sub product with charge type per requirement
      setSubProduct('Second Charge');
    }
  }, [chargeType]);

  // Derive chargeType and subProduct from criteria answers when present.
  // Criteria questions may include a 'Charge type' question or a 'Sub-product' question.
  // Prefer explicit question keys/labels that mention 'charge' or 'sub-product'.
  useEffect(() => {
    try {
      const entries = Object.entries(answers || {});
      let derivedCharge = null;
      let derivedSub = null;
      for (const [qk, sel] of entries) {
        if (!sel) continue;
        const raw = sel.raw || {};
        const qlabel = (raw.question_label || raw.question_key || qk || '').toString().toLowerCase();
        const opt = (sel.option_label || '').toString().toLowerCase();

        // Charge detection: check question label/key or option label for 'charge' or 'first/second'
        if (!derivedCharge && /charge|first|second|2nd/i.test(qlabel + ' ' + opt)) {
          if (/second/i.test(opt) || /second/i.test(qlabel)) derivedCharge = 'Second';
          else if (/first/i.test(opt) || /first/i.test(qlabel)) derivedCharge = 'First';
          else derivedCharge = 'All';
        }

        // Sub-product detection: question mentions sub-product, subproduct, property type, or similar
        if (derivedSub === null && /sub[-_ ]?product|subproduct|property type|property_type|product type/i.test(qlabel)) {
          derivedSub = sel.option_label || '';
        }
      }

      if (derivedCharge) {
        setChargeType(prev => (prev === derivedCharge ? prev : derivedCharge));
        // If charge is derived as Second and no explicit sub-product provided, set sub-product accordingly
        if (derivedCharge.toLowerCase() === 'second' && (derivedSub === null || derivedSub === '')) {
          derivedSub = 'Second Charge';
        }
      }
      if (derivedSub !== null) {
        setSubProduct(prev => (prev === derivedSub ? prev : derivedSub || ''));
      }
    } catch (e) {
      // Swallow errors silently to avoid breaking UI
    }
  }, [answers]);

  useEffect(() => {
    // Skip filtering if we just loaded results from a saved quote
    // The saved quote's computed results should be preserved until user changes inputs
    if (loadedFromSavedQuoteRef.current) {
      loadedFromSavedQuoteRef.current = false;
      return;
    }
    
    // filter rates whenever inputs or answers change
    const raw = rates || [];
    const mode = computeModeFromAnswers();
    const loanLtv = computeLoanLtv(propertyValue, specificNetLoan, grossLoan, firstChargeValue);
    const loanSize = computeLoanSize(specificNetLoan, grossLoan);
    const parsedSub = (subProduct || '').toString().toLowerCase();
    const parsedCharge = (chargeType || 'All').toString().toLowerCase();

    // Calculate combined LTV for second charge (matching engine logic)
    const pv = parseNumber(propertyValue);
    const fcv = parseNumber(firstChargeValue) || 0;
    const grossInput = parseNumber(grossLoan);
    const netInput = parseNumber(specificNetLoan);
    let combinedLtv = loanLtv;

    if (parsedCharge === 'second' && Number.isFinite(pv) && pv > 0) {
      // For second charge, exposure uses (gross + first charge). When in net mode (gross=0),
      // approximate gross from net so LTV bucket selection reflects reality and picks correct tier.
      let exposureGross = Number.isFinite(grossInput) && grossInput > 0
        ? grossInput
        : (useSpecificNet === 'Yes' && Number.isFinite(netInput) && netInput > 0
            ? netInput * 1.12 // same uplift heuristic used for rate selection when only net provided
            : 0);
      combinedLtv = ((exposureGross + fcv) / pv) * 100;
    }

    // Bridge: productScope + (Charge type filtered to Bridge-style rows) + sub-product + LTV
    const bridgeFilter = (r, requireSecondCharge = false) => {
      if (productScope) {
        const ps = (r.product_scope || r.property || r.set_key || '').toString().toLowerCase();
        if (!ps.includes(productScope.toString().toLowerCase())) return false;
      }
      // Exclude Fusion sets from Bridge. Check for set_key === 'Fusion', 'fusion', etc.
      const setKeyStr = (r.set_key || '').toString().toLowerCase();
      if (setKeyStr === 'fusion') return false;
      
      // Only include rates with set_key of 'Bridging_Fix', 'Bridging_Var', or similar bridge-related keys
      // (not 'Fusion')
      const isBridgeRate = setKeyStr.includes('bridging') || setKeyStr.includes('bridge');
      if (!isBridgeRate) return false;
      
      // charge type handling: allow All/First/Second. Detect second-charge deterministically by checking
      // the product/type fields (CSV uses product="Second Charge"). Fall back to legacy boolean flags.
      const isSecondFlag = (r.second_charge === true) || (r.is_second === true);
      // Prefer explicit `charge_type` column when present; fall back to product/type/other heuristics
      const looksLikeSecond = /second/i.test(String(r.charge_type || r.product || r.type || r.charge || r.tier || ''));
      const isSecond = isSecondFlag || looksLikeSecond;
      
      // Charge type selection logic:
      // When 'Second' is selected, prioritize second-charge specific rates
      if (parsedCharge === 'second') {
        // If requireSecondCharge is true, only include second-charge rates
        if (requireSecondCharge && !isSecond) return false;
        // If requireSecondCharge is false (fallback pass), exclude second-charge rates
        if (!requireSecondCharge && isSecond) return false;
      } else if (parsedCharge === 'first' && isSecond) {
        // When 'First' is selected, exclude second-charge rates
        return false;
      }
      
      // sub-product: skip sub-product filtering when Second charge is selected (second-charge rates should not be restricted by sub-product)
      if (parsedCharge !== 'second' && parsedSub) {
        const s = (r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.product || '').toString().toLowerCase();
        if (!s.includes(parsedSub)) return false;
      }
      
      // LTV filtering: Use appropriate LTV value
      const rowMin = parseNumber(r.min_ltv ?? r.minltv ?? r.min_LTV ?? r.minLTV ?? r.min_loan_ltv);
      const rowMax = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
      
      if (Number.isFinite(combinedLtv)) {
        // For second charge, use actual combined LTV to match rate buckets
        // For standard bridge, use the original loanLtv
        const ltvForSelection = parsedCharge === 'second' ? combinedLtv : loanLtv;
        
        // Cap the LTV for rate selection at the row's max LTV
        // This allows the engine to cap the gross loan while still showing results
        const cappedLtvForSelection = Number.isFinite(rowMax) 
          ? Math.min(ltvForSelection, rowMax)
          : ltvForSelection;
        
        // Enforce minimum LTV using the capped value
        if (Number.isFinite(rowMin) && cappedLtvForSelection < rowMin) return false;
        
        // Check if the capped LTV falls within this rate's bracket
        // This allows showing rates even when user's requested loan exceeds max LTV
        if (Number.isFinite(rowMax) && cappedLtvForSelection > rowMax + 0.01) return false;
      }
      return true;
    };

    // First pass: Try to get second-charge specific rates when second charge is selected
    let bridgeOut = raw.filter(r => bridgeFilter(r, parsedCharge === 'second'));
    
    // Second pass: If no second-charge specific rates found, fall back to standard rates
    if (parsedCharge === 'second' && bridgeOut.length === 0) {
      bridgeOut = raw.filter(r => bridgeFilter(r, false));
    }

    // Fusion: productScope + loan size range (LTV will be capped by engine, not filtered out)
    const fusionOut = raw.filter((r) => {
      // if user requested second-charge only, do not show any Fusion products
      if (parsedCharge === 'second') return false;
      if (productScope) {
        const ps = (r.product_scope || r.property || r.set_key || '').toString().toLowerCase();
        if (!ps.includes(productScope.toString().toLowerCase())) return false;
      }
      // Only include rows that belong to Fusion sets: require set_key === 'Fusion' for determinism.
      const setKeyStr2 = (r.set_key || '').toString().toLowerCase();
      if (setKeyStr2 !== 'fusion') return false;
      
      // Loan size filtering based on the capped loan amount, not the raw input
      // Calculate what the loan would be after LTV cap is applied
      const rowMinLoan = parseNumber(r.min_loan ?? r.minloan ?? r.min_loan_amt ?? r.min_loan_amount);
      const rowMaxLoan = parseNumber(r.max_loan ?? r.maxloan ?? r.max_loan_amt ?? r.max_loan_amount);
      const rowMaxLtv = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
      
      // Determine the capped loan size for filtering purposes
      // If property value is available and there's an LTV limit, calculate max possible loan
      const pv = parseNumber(propertyValue);
      let effectiveLoanSize = loanSize;
      if (Number.isFinite(pv) && Number.isFinite(rowMaxLtv) && Number.isFinite(loanLtv) && loanLtv > rowMaxLtv) {
        // User requested loan exceeds LTV limit, so calculate capped loan
        effectiveLoanSize = pv * (rowMaxLtv / 100);
      }
      
      if (Number.isFinite(effectiveLoanSize)) {
        if (Number.isFinite(rowMinLoan) && effectiveLoanSize < rowMinLoan) return false;
        if (Number.isFinite(rowMaxLoan) && effectiveLoanSize > rowMaxLoan) return false;
      }
      
      // Do NOT filter by LTV here - let the engine cap the loan and still show Fusion
      // The engine will apply the LTV cap and adjust gross loan accordingly
      
      return true;
    });

    setBridgeMatched(bridgeOut);
    setFusionMatched(fusionOut);
    setRelevantRates([...bridgeOut, ...fusionOut]);
  }, [rates, productScope, subProduct, propertyValue, grossLoan, specificNetLoan, useSpecificNet, answers, chargeType, firstChargeValue]);

  // Compute calculated rates using Bridge & Fusion calculation engine
  const calculatedRates = useMemo(() => {
    if (!relevantRates || relevantRates.length === 0) return [];

    const pv = parseNumber(propertyValue);
    const grossInput = parseNumber(grossLoan);
    const specificNet = parseNumber(specificNetLoan);
    const monthlyRentNum = parseNumber(monthlyRent);
    const topSlicingNum = parseNumber(topSlicing);
    const term = parseNumber(bridgingTerm) || 12;

    // Check if we have required inputs
    const hasGrossLoan = !isNaN(grossInput) && grossInput > 0;
    const hasSpecificNet = useSpecificNet === 'Yes' && !isNaN(specificNet) && specificNet > 0;
    
    // If neither gross nor specific net is provided, return empty results
    if (!hasGrossLoan && !hasSpecificNet) {
      return [];
    }

    // Get BBR from constants
    const bbrAnnual = getMarketRates()?.STANDARD_BBR || 0.04;

    return relevantRates.map(rate => {
      try {
        // Determine column key for this rate to match slider state
        // Map rate type to column header
        const rateSetKey = (rate.set_key || '').toString().toLowerCase();
        let columnKey = 'Fixed Bridge'; // default
        if (rateSetKey === 'fusion') {
          columnKey = 'Fusion';
        } else if (rateSetKey.includes('var')) {
          columnKey = 'Variable Bridge';
        } else if (rateSetKey.includes('fix')) {
          columnKey = 'Fixed Bridge';
        }

        const overrideRateValue = getNumericValue(ratesOverrides?.[columnKey]);
        const overrideProductFeeValue = getNumericValue(productFeeOverrides?.[columnKey]);

        // Determine if this is a Fusion product - Fusion uses fixed term from rate record, not the slider
        const isFusionProduct = rateSetKey === 'fusion';

        // Use the comprehensive Bridge & Fusion calculation engine
        // Pass broker settings to let the engine calculate fees internally
        const calculated = BridgeFusionCalculator.calculateForRate(rate, {
          grossLoan: grossInput,
          propertyValue: pv,
          monthlyRent: monthlyRentNum,
          topSlicing: topSlicingNum,
          useSpecificNet: useSpecificNet === 'Yes',
          specificNetLoan: specificNet,
          // For Fusion, don't pass termMonths - let engine use rate's max_term (typically 24 months)
          // For Bridge products, use the slider value
          termMonths: isFusionProduct ? undefined : term,
          bbrAnnual: bbrAnnual,
          procFeePct: 0, // Will be calculated from brokerSettings
          brokerFeeFlat: 0,
          brokerClientFee: 0, // Will be calculated from brokerSettings
          rolledMonthsOverride: rolledMonthsPerColumn?.[columnKey],
          deferredRateOverride: deferredInterestPerColumn?.[columnKey],
          commitmentFeePounds: parseNumber(commitmentFee) || 0,
          exitFeePercent: parseNumber(exitFeePercent) || 0,
          overriddenRate: overrideRateValue,
          productFeeOverridePercent: overrideProductFeeValue,
          // Pass broker settings for automatic fee calculation
          brokerSettings: {
            addFeesToggle: brokerSettings.addFeesToggle,
            feeCalculationType: brokerSettings.feeCalculationType,
            additionalFeeAmount: brokerSettings.additionalFeeAmount,
            clientType: brokerSettings.clientType,
            brokerCommissionPercent: brokerSettings.brokerCommissionPercent,
          },
          // Second charge context
          chargeType,
          firstChargeValue: getNumericValue(firstChargeValue),
        });

        // Determine product name for display
        let productName = 'Bridge';
        const setKey = (rate.set_key || '').toString().toLowerCase();
        
        if (setKey === 'fusion') {
          productName = 'Fusion';
        } else if (setKey.includes('var')) {
          productName = 'Variable Bridge';
        } else if (setKey.includes('fix')) {
          productName = 'Fixed Bridge';
        }

        const rateForReturn = { ...rate };

        const originalRateValue = getNumericValue(calculated.original_rate ?? rate.rate);
        const appliedRateValue = getNumericValue(calculated.applied_rate ?? overrideRateValue ?? originalRateValue);
        if (originalRateValue != null) {
          rateForReturn.original_rate = originalRateValue;
        }
        if (appliedRateValue != null) {
          rateForReturn.rate = appliedRateValue;
          rateForReturn.applied_rate = appliedRateValue;
        }

        const originalProductFeeValue = getNumericValue(calculated.original_product_fee ?? rate.product_fee);
        const appliedProductFeeValue = getNumericValue(calculated.applied_product_fee ?? overrideProductFeeValue ?? originalProductFeeValue);
        if (originalProductFeeValue != null) {
          rateForReturn.original_product_fee = originalProductFeeValue;
        }
        if (appliedProductFeeValue != null) {
          rateForReturn.product_fee = appliedProductFeeValue;
          rateForReturn.applied_product_fee = appliedProductFeeValue;
        }

        const productFeePercentApplied = Number.isFinite(calculated.productFeePercent)
          ? calculated.productFeePercent
          : appliedProductFeeValue;

        // Map engine results to UI fields
        return {
          ...rateForReturn,
          // Core loan metrics (0 decimal places)
          gross_loan: calculated.gross?.toFixed(0) || null,
          net_loan: calculated.netLoanGBP?.toFixed(0) || null,
          nbp: calculated.npb?.toFixed(0) || null,
          property_value: calculated.propertyValue?.toFixed(0) || null,
          
          // LTV metrics
          // For second charge, display combined exposure LTV (gross + first charge)
          ltv: (calculated.isSecondCharge ? calculated.combinedGrossLTV : calculated.grossLTV)?.toFixed(2) || null,
          ltv_percentage: (calculated.isSecondCharge ? calculated.combinedGrossLTV : calculated.grossLTV)?.toFixed(2) || null,
          net_ltv: calculated.netLTV?.toFixed(2) || null,
          ltv_bucket: calculated.ltv,
          second_charge_cap_gross: calculated.isSecondCharge && calculated.maxSecondChargeGross != null ? calculated.maxSecondChargeGross.toFixed(0) : null,
          second_charge_cap_applied: calculated.capped ? 'Yes' : 'No',
          requested_net_loan: calculated.requestedNetLoan != null ? calculated.requestedNetLoan.toFixed(0) : null,
          net_target_met: calculated.netTargetMet ? 'Yes' : 'No',
          net_clipped_by_cap: calculated.requestedNetLoan != null && !calculated.netTargetMet ? 'Yes' : 'No',
          bridge_primary_cap_gross: calculated.bridgePrimaryCapGross != null ? calculated.bridgePrimaryCapGross.toFixed(0) : null,
          bridge_primary_cap_applied: calculated.bridgePrimaryCapApplied ? 'Yes' : 'No',
          fusion_cap_gross: calculated.fusionCapGross != null ? calculated.fusionCapGross.toFixed(0) : null,
          fusion_cap_applied: calculated.fusionCapApplied ? 'Yes' : 'No',
          
          // Rate metrics
          initial_rate: calculated.fullAnnualRate?.toFixed(2) || null,
          pay_rate: calculated.payRateMonthly?.toFixed(2) || null,
          full_rate: calculated.fullRateText || null,
          margin_monthly: calculated.marginMonthly?.toFixed(2) || null,
          bbr_monthly: calculated.bbrMonthly?.toFixed(2) || null,
          
          // Fee metrics (0 decimal places)
          product_fee_percent: productFeePercentApplied != null ? Number(productFeePercentApplied).toFixed(2) : null,
          product_fee_pounds: calculated.productFeePounds?.toFixed(0) || null,
          admin_fee: calculated.adminFee || 0,
          broker_commission_proc_fee_percent: calculated.procFeePct?.toFixed(2) || null,
          broker_commission_proc_fee_pounds: calculated.procFeeGBP?.toFixed(0) || null,
          
          // Interest breakdown (0 decimal places)
          rolled_months: calculated.rolledMonths,
          rolled_months_interest: calculated.rolledInterestGBP?.toFixed(0) || null,
          rolled_interest_coupon: calculated.rolledIntCoupon?.toFixed(0) || null,
          rolled_interest_bbr: calculated.rolledIntBBR?.toFixed(0) || null,
          full_interest_coupon: calculated.fullIntCoupon?.toFixed(0) || null,
          full_interest_bbr: calculated.fullIntBBR?.toFixed(0) || null,
          deferred_interest_percent: calculated.deferredInterestRate?.toFixed(2) || null,
          deferred_interest_pounds: calculated.deferredGBP?.toFixed(0) || null,
          serviced_interest: calculated.servicedInterestGBP?.toFixed(0) || null,
          total_interest: calculated.totalInterest?.toFixed(0) || null,
          
          // Payment metrics - Direct Debit keeps 2 decimal places
          monthly_interest_cost: calculated.monthlyPaymentGBP?.toFixed(0) || null,
          direct_debit: calculated.directDebit?.toFixed(2) || null,
          
          // APR metrics
          aprc: calculated.aprcAnnual?.toFixed(2) || null,
          aprc_annual: calculated.aprcAnnual?.toFixed(2) || null,
          aprc_monthly: calculated.aprcMonthly?.toFixed(2) || null,
          total_amount_repayable: calculated.totalAmountRepayable?.toFixed(0) || null,
          
          // Term metrics
          total_loan_term: calculated.termMonths,
          serviced_months: calculated.servicedMonths,
          
          // Product details
          product_name: productName,
          product_kind: calculated.productKind,
          tier_name: calculated.tierName,
          
          // Income metrics
          icr: calculated.icr?.toFixed(2) || null,
          rent: calculated.rent?.toFixed(0) || null,
          top_slicing: calculated.topSlicing?.toFixed(0) || null,
          
          // Additional fees - Broker Client Fee 0 decimals, Title Insurance keeps 2 decimals
          broker_client_fee: calculated.brokerClientFee?.toFixed(0) || null,
          title_insurance_cost: calculated.titleInsuranceCost?.toFixed(2) || null,
          
          // Commitment Fee and Exit Fee (from calculation engine, 0 decimal places)
          commitment_fee_pounds: calculated.commitmentFeePounds?.toFixed(0) || null,
          exit_fee: calculated.exitFee?.toFixed(0) || null,
          
          // ERC (Early Repayment Charges) - Fusion only, 0 decimal places
          erc_1_pounds: calculated.erc1Pounds?.toFixed(0) || null,
          erc_2_pounds: calculated.erc2Pounds?.toFixed(0) || null,
          
          // Legacy/unused fields (keep for compatibility)
          revert_rate: null,
          revert_rate_dd: null,
          erc: null,
          erc_fusion_only: null,
          total_cost_to_borrower: null,
          
          // Complete rate metadata from original rate for historical accuracy (Bridging-specific)
          initial_term: calculated.initialTerm || rate.initial_term || rate.max_term || null,
          full_term: calculated.fullTerm || rate.full_term || rate.max_term || null,
          revert_rate_type: rate.revert_rate_type || null,
          product_range: rate.product_range || productScope || null,
          min_term: rate.min_term || null,
          max_term: rate.max_term || null,
          min_rolled: rate.min_rolled || null,
          max_rolled: rate.max_rolled || null,
          min_loan: rate.min_loan || null,
          max_loan: rate.max_loan || null,
          min_ltv: rate.min_ltv || null,
          max_ltv: rate.max_ltv || null,
          min_icr: rate.min_icr || null,
          max_defer: rate.max_defer || null,
          erc_1_percent: rate.erc_1_percent || rate.erc_1 || null,
          erc_2_percent: rate.erc_2_percent || rate.erc_2 || null,
          rate_percent: rate.rate || null,
          product_fee_saved: rate.product_fee || null,
          charge_type: rate.charge_type || null,
          type: rate.type || null,
          product: rate.product || null,
          property_type: rate.property_type || rate.property || null,
          status: rate.status || null,
          rate_status: rate.status || null,
          tier: rate.tier || null,
          id: rate.id || null,
        };
      } catch (error) {
        // Return rate with null values if calculation fails
        return {
          ...rate,
          gross_loan: null,
          net_loan: null,
          error: error.message,
        };
      }
    });
  }, [relevantRates, propertyValue, grossLoan, specificNetLoan, monthlyRent, topSlicing, useSpecificNet, bridgingTerm, commitmentFee, exitFeePercent, rolledMonthsPerColumn, deferredInterestPerColumn, ratesOverrides, productFeeOverrides, brokerSettings.clientType, brokerSettings.brokerCommissionPercent, brokerSettings.addFeesToggle, brokerSettings.feeCalculationType, brokerSettings.additionalFeeAmount, firstChargeValue, chargeType]);

  const loanLtv = computeLoanLtv(propertyValue, specificNetLoan, grossLoan, firstChargeValue);
  const loanSize = computeLoanSize(specificNetLoan, grossLoan);

  const bestBridgeRates = useMemo(() => {
    if (!calculatedRates || calculatedRates.length === 0) {
      return { fusion: null, variable: null, fixed: null };
    }

    const lower = (val) => (val || '').toString().toLowerCase();

    const fusionRows = calculatedRates.filter(r => lower(r.set_key) === 'fusion');
    const variableRows = calculatedRates.filter(r => {
      // Exclude Fusion rows explicitly
      if (lower(r.set_key) === 'fusion') return false;
      const type = lower(r.type);
      const product = lower(r.product_name || r.product);
      return type.includes('variable') || product.includes('variable');
    });
    const fixedRows = calculatedRates.filter(r => {
      // Exclude Fusion rows explicitly
      if (lower(r.set_key) === 'fusion') return false;
      const type = lower(r.type);
      const product = lower(r.product_name || r.product);
      return type.includes('fixed') || product.includes('fixed');
    });

    // Determine selection cap from rate data
    const isSecondCharge = (chargeType || '').toString().toLowerCase() === 'second';
    
    // Find max LTV from available variable/fixed rows (they should all have the same max for a given product type)
    const getMaxLtvFromRows = (rows) => {
      if (!rows || rows.length === 0) return 75; // Default fallback
      const maxLtvValues = rows.map(r => {
        const val = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
        return Number.isFinite(val) ? val : 75;
      });
      return Math.max(...maxLtvValues); // Use the highest max_ltv found
    };
    
    const bridgeMaxLtv = getMaxLtvFromRows([...variableRows, ...fixedRows]);
    const selectionCap = isSecondCharge ? 70 : bridgeMaxLtv;
    const cappedLtvForSelection = Number.isFinite(loanLtv) ? Math.min(loanLtv, selectionCap) : loanLtv;
    
    return {
      fusion: pickBestRate(fusionRows, loanSize, 'min_loan', 'max_loan'),
      variable: pickBestRate(variableRows, cappedLtvForSelection, 'min_ltv', 'max_ltv'),
      fixed: pickBestRate(fixedRows, cappedLtvForSelection, 'min_ltv', 'max_ltv'),
    };
  }, [calculatedRates, loanLtv, loanSize, chargeType]);

  const bestBridgeRatesArray = useMemo(() => (
    ['fusion', 'variable', 'fixed']
      .map((key) => bestBridgeRates[key])
      .filter(Boolean)
  ), [bestBridgeRates]);

  // DIP Modal Handlers
  const handleOpenDipModal = async () => {
    try {
      // Always reload quote from database to get latest version
      if (currentQuoteId) {
        const response = await getQuote(currentQuoteId, false);
        if (response && response.quote) {
          const quote = response.quote;
          // Update dipData with latest values from database
          if (quote.commercial_or_main_residence || quote.dip_date || quote.dip_expiry_date) {
            // Map 'Company' to 'Corporate' for backward compatibility
            const applicantType = quote.applicant_type === 'Company' ? 'Corporate' : quote.applicant_type;
            setDipData({
              commercial_or_main_residence: quote.commercial_or_main_residence,
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
              funding_line: quote.funding_line,
              title_insurance: quote.title_insurance
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
      await upsertQuoteData({
        quoteId,
        calculatorType: 'BRIDGING',
        payload: dipData,
        token,
      });
      setDipData(dipData);
    } catch (err) {
      throw err;
    }
  };

  const handleCreatePDF = async (quoteId) => {
    try {
      // Use frontend React PDF generation (like BTL)
      const { downloadDIPPDF } = await import('../../utils/generateDIPPDF');
      const quoteData = currentQuoteData || { id: quoteId };
      await downloadDIPPDF(quoteId, 'BRIDGING', quoteData?.reference_number || quoteId);
      
      // Note: Success toast is shown by IssueDIPModal
    } catch (err) {
      showToast({ kind: 'error', title: 'Failed to create DIP PDF', subtitle: err.message });
      throw err;
    }
  };

  // Available fee types for Bridge: Fusion, Variable Bridge, Fixed Bridge
  const bridgeFeeTypes = ['Fusion', 'Variable Bridge', 'Fixed Bridge'];

  // Handle fee type selection in DIP modal to filter rates
  const handleFeeTypeSelection = (feeTypeLabel) => {
    setSelectedFeeTypeForDip(feeTypeLabel);
    
    if (!feeTypeLabel || !relevantRates || relevantRates.length === 0) {
      setFilteredRatesForDip([]);
      return;
    }

    // Filter based on product type for Bridge
    let filtered = [];
    if (feeTypeLabel === 'Fusion') {
      filtered = fusionMatched;
    } else if (feeTypeLabel === 'Variable Bridge') {
      filtered = bridgeMatched.filter(r => r.product && r.product.toLowerCase().includes('variable'));
    } else if (feeTypeLabel === 'Fixed Bridge') {
      filtered = bridgeMatched.filter(r => r.product && r.product.toLowerCase().includes('fixed'));
    }

    setFilteredRatesForDip(filtered);
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
      // Continue anyway - use existing data if quote fetch fails
      console.error('Error fetching quote:', error);
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
    setGrossLoan('');
    setFirstChargeValue('');
    setMonthlyRent('');
    setTopSlicing('');
    setProductScope('');
    setUseSpecificNet(false);
    setSpecificNetLoan('');
    setBridgingTerm(12);
    setCommitmentFee(0);
    setExitFeePercent(0);
    setChargeType('');
    setSubProduct('');
    
    // Reset criteria answers
    setAnswers({});
    
    // Reset results
    setBestBridgeRatesArray([]);
    
    // Reset multi-property
    setIsMultiProperty(false);
    setMultiPropertyRows([{ propertyValue: '', grossLoan: '' }]);
    
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
    brokerSettings.setBrokerCommissionPercent(typeof defaultCommission === 'object' ? defaultCommission.bridge : defaultCommission);
    brokerSettings.setAddFeesToggle(false);
    brokerSettings.setFeeCalculationType('pound');
    brokerSettings.setAdditionalFeeAmount('');
    
    showToast({ 
      kind: 'info', 
      title: 'Quote Cancelled', 
      subtitle: 'Calculator has been reset to start a new quote.' 
    });

    // Navigate to the calculator route to mirror behavior when opening from navigation
    navigate('/calculator/bridging', { replace: true });
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
    setGrossLoan('');
    setFirstChargeValue('');
    setMonthlyRent('');
    setTopSlicing('');
    setProductScope('');
    setUseSpecificNet(false);
    setSpecificNetLoan('');
    setBridgingTerm(12);
    setCommitmentFee(0);
    setExitFeePercent(0);
    setChargeType('');
    setSubProduct('');

    // Reset criteria answers
    setAnswers({});

    // Reset results
    setBestBridgeRatesArray([]);

    // Reset multi-property
    setIsMultiProperty(false);
    setMultiPropertyRows([{ propertyValue: '', grossLoan: '' }]);

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
    brokerSettings.setBrokerCommissionPercent(typeof defaultCommission === 'object' ? defaultCommission.bridge : defaultCommission);
    brokerSettings.setAddFeesToggle(false);
    brokerSettings.setFeeCalculationType('pound');
    brokerSettings.setAdditionalFeeAmount('');

    // Navigate to the calculator route (no toast for New Quote)
    navigate('/calculator/bridging', { replace: true });
  };

  const handleSaveQuoteData = async (quoteId, updatedQuoteData) => {
    try {
      // Increment version when issuing quote
      const currentVersion = currentQuoteData?.quote_version || 0;
      const newVersion = currentVersion + 1;

      await upsertQuoteData({
        quoteId,
        calculatorType: 'BRIDGING',
        payload: {
          ...updatedQuoteData,
          quote_version: newVersion,
        },
        token,
      });

      // Update local quote data with new version
      if (currentQuoteData) {
        setCurrentQuoteData({ ...currentQuoteData, quote_version: newVersion });
      }

      // Note: Success toast is shown by IssueQuoteModal
    } catch (err) {
      showToast({ kind: 'error', title: 'Failed to save quote data', subtitle: err.message });
      throw err;
    }
  };

  const handleCreateQuotePDF = async (quoteId) => {
    try {
      // Use frontend React PDF generation (like BTL)
      const { downloadQuotePDF } = await import('../../utils/generateQuotePDF');
      const quoteData = currentQuoteData || { id: quoteId };
      await downloadQuotePDF(quoteId, 'BRIDGING', quoteData?.reference_number || quoteId);
      
      // Note: Success toast is shown by IssueQuoteModal
    } catch (err) {
      showToast({ kind: 'error', title: 'Failed to create Quote PDF', subtitle: err.message });
      throw err;
    }
  };

  const getAvailableFeeTypes = () => {
    return bridgeFeeTypes;
  };

  if (!supabase) return <div className="slds-p-around_medium">Database client missing</div>;
  if (loading) return (
    <div className="slds-spinner_container">
      <div className="slds-spinner slds-spinner_medium">
        <div className="slds-spinner__dot-a"></div>
        <div className="slds-spinner__dot-b"></div>
      </div>
      <div className="slds-text-heading_small slds-m-top_medium">Loading bridging criteria...</div>
    </div>
  );

  return (
    <div className="page-container page-container--full-width">
      {/* Product Configuration section */}
      <BridgingProductSection
        productScope={productScope}
        onProductScopeChange={setProductScope}
        availableScopes={Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean)))}
        questions={questions}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        allCriteria={allCriteria}
        chargeType={chargeType}
        subProductLimits={subProductLimits}
        quoteId={currentQuoteId}
        quoteReference={currentQuoteRef}
        onIssueDip={handleOpenDipModal}
        onIssueQuote={handleIssueQuote}
        onCancelQuote={handleCancelQuote}
        onNewQuote={handleNewQuote}
        saveQuoteButton={
          <SaveQuoteButton
            calculatorType="bridging"
            calculationData={{
              productScope,
              chargeType,
              subProduct,
              answers,
              propertyValue,
              grossLoan,
              firstChargeValue,
              monthlyRent,
              topSlicing,
              useSpecificNet,
              specificNetLoan,
              bridgingTerm,
              commitmentFee,
              exitFeePercent,
              loanCalculationRequested,
              ...brokerSettings.getAllSettings(),
              relevantRates,
              results: calculatedRates, // Add calculated results for saving
              selectedRate: (filteredRatesForDip && filteredRatesForDip.length > 0) 
                ? filteredRatesForDip[0] 
                : (relevantRates && relevantRates.length > 0 ? relevantRates[0] : null),
              ratesOverrides,
              productFeeOverrides,
              rolledMonthsPerColumn,
              deferredInterestPerColumn,
              multiPropertyRows: isMultiProperty ? multiPropertyRows : null
            }}
            allColumnData={relevantRates || []}
            existingQuote={currentQuoteData}
            onSaved={async (savedQuote) => {
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
              if (isMultiProperty && multiPropertyRows.length > 0 && savedQuote && savedQuote.id) {
                try {
                  await supabase
                    .from('bridge_multi_property_details')
                    .delete()
                    .eq('quote_id', savedQuote.id);
                  
                  const rowsToInsert = multiPropertyRows.map(row => ({
                    quote_id: savedQuote.id,
                    property_value: row.propertyValue || null,
                    first_charge_value: row.firstChargeValue || null,
                    gross_loan: row.grossLoan || null,
                    monthly_rent: row.monthlyRent || null,
                    top_slicing: row.topSlicing || null
                  }));
                  
                  await supabase
                    .from('bridge_multi_property_details')
                    .insert(rowsToInsert);
                } catch (error) {
                  // Error saving multi-property details
                }
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
                    dip_status: savedQuote.dip_status,
                    title_insurance: savedQuote.title_insurance
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
        calculatorType="bridge"
        expanded={clientDetailsExpanded}
        onToggle={handleClientDetailsToggle}
        isReadOnly={isReadOnly}
      />

      {/* Multi Property Details Section - Only shown when Multi-property = Yes */}
      {isMultiProperty && (
        <MultiPropertyDetailsSection
          expanded={multiPropertyDetailsExpanded}
          onToggle={handleMultiPropertyToggle}
          rows={multiPropertyRows}
          onRowChange={handleMultiPropertyRowChange}
          onAddRow={addMultiPropertyRow}
          onDeleteRow={deleteMultiPropertyRow}
          totals={multiPropertyTotals}
          onUseTotalGrossLoan={(total) => setGrossLoan(formatCurrencyInput(total))}
          isReadOnly={isReadOnly}
        />
      )}

      <LoanDetailsSection
        expanded={loanDetailsExpanded}
        onToggle={handleLoanDetailsToggle}
        propertyValue={propertyValue}
        onPropertyValueChange={setPropertyValue}
        grossLoan={grossLoan}
        onGrossLoanChange={setGrossLoan}
        chargeType={chargeType}
        firstChargeValue={firstChargeValue}
        onFirstChargeValueChange={setFirstChargeValue}
        monthlyRent={monthlyRent}
        onMonthlyRentChange={setMonthlyRent}
        topSlicing={topSlicing}
        onTopSlicingChange={setTopSlicing}
        useSpecificNet={useSpecificNet}
        onUseSpecificNetChange={setUseSpecificNet}
        specificNetLoan={specificNetLoan}
        onSpecificNetLoanChange={setSpecificNetLoan}
        term={bridgingTerm}
        onTermChange={setBridgingTerm}
        commitmentFee={commitmentFee}
        onCommitmentFeeChange={setCommitmentFee}
        exitFeePercent={exitFeePercent}
        onExitFeePercentChange={setExitFeePercent}
        termRange={termRange}
        isReadOnly={isReadOnly}
        loanCalculationRequested={loanCalculationRequested}
        onLoanCalculationRequestedChange={setLoanCalculationRequested}
        subProductLimits={subProductLimits}
        subProduct={subProduct}
      />

      {/* Results section */}
      <section className="results-section">
        <header className="collapsible-header">
          <h2 className="header-title">Results</h2>
        </header>
        <div className="collapsible-body">
          {/* Check if required fields are filled before showing the table */}
          {(() => {
            const hasPropertyValue = parseNumber(propertyValue) > 0;
            const hasGrossLoan = parseNumber(grossLoan) > 0;
            const hasSpecificNet = useSpecificNet === 'Yes' && parseNumber(specificNetLoan) > 0;
            const hasRequiredFields = hasPropertyValue && (hasGrossLoan || hasSpecificNet);
            
            if (!hasRequiredFields) {
              return (
                <div className="no-rates">
                  <p className="no-rates__title">Please enter Property Value and Gross Loan (or Net Loan if using specific net) to see results.</p>
                  <p className="no-rates__subtitle">Both fields are required to calculate loan options.</p>
                </div>
              );
            }
            
            return (
              <div className="results-table-wrapper" data-calculator-type="bridge">
                <table className="slds-table slds-table_cell-buffer slds-table_bordered max-width-900">
                  <thead>
                    <tr>
                      {/* increase label width a bit and adjust other columns */}
                      <th className="width-24 th-label">Label</th>
                      <th 
                        className="width-25 text-align-center th-data-col brand-header"
                        style={{ 
                          backgroundColor: 'var(--results-header-bridge-col1-bg, var(--results-header-col1-bg))',
                          color: 'var(--results-header-bridge-col1-text, var(--results-header-col1-text))'
                        }}
                      >{bestBridgeRates.fusion?.label || 'Fusion'}</th>
                      <th 
                        className="width-25 text-align-center th-data-col brand-header"
                        style={{ 
                          backgroundColor: 'var(--results-header-bridge-col2-bg, var(--results-header-col2-bg))',
                          color: 'var(--results-header-bridge-col2-text, var(--results-header-col2-text))'
                        }}
                      >{bestBridgeRates.variable?.label || 'Variable Bridge'}</th>
                      <th 
                        className="width-26 text-align-center th-data-col brand-header"
                        style={{ 
                          backgroundColor: 'var(--results-header-bridge-col3-bg, var(--results-header-col3-bg))',
                          color: 'var(--results-header-bridge-col3-text, var(--results-header-col3-text))'
                        }}
                      >{bestBridgeRates.fixed?.label || 'Fixed Bridge'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      (() => {
                        const bestFusion = bestBridgeRates.fusion;
                        const bestVariable = bestBridgeRates.variable;
                        const bestFixed = bestBridgeRates.fixed;

                        if (!bestFusion && !bestVariable && !bestFixed) {
                          return (
                            <tr>
                              <td colSpan={4} className="slds-text-body_small no-rates__cell">
                                No results match the selected criteria. Please adjust your loan details or criteria answers.
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                        {
                          (() => {
                            // Calculate rates for all columns first
                            const columnsHeaders = [ 'Fusion', 'Variable Bridge', 'Fixed Bridge' ];
                            const colBest = [bestFusion, bestVariable, bestFixed];
                            const originalRates = {};
                            const ratesDisplayValues = {};
                            const columnSuffixes = {}; // Track suffix per column

                            columnsHeaders.forEach((col, idx) => {
                              const best = colBest[idx];
                              if (best && best.rate != null) {
                                // Add " + BBR" for Fusion and Variable Bridge
                                const needsBBR = col === 'Fusion' || col === 'Variable Bridge';
                                // Show percent and BBR together for these columns
                                const suffix = needsBBR ? '% + BBR' : '%';
                                columnSuffixes[col] = suffix;
                                const originalRateValue = getNumericValue(best.original_rate ?? best.rate);
                                const appliedRateValue = getNumericValue(best.rate);
                                const baselineRateValue = originalRateValue ?? appliedRateValue;

                                if (baselineRateValue != null) {
                                  const originalRate = `${baselineRateValue.toFixed(2)}${suffix}`;
                                  originalRates[col] = originalRate;

                                  if (ratesOverrides[col]) {
                                    ratesDisplayValues[col] = ratesOverrides[col];
                                  } else {
                                    const displayRateValue = appliedRateValue ?? baselineRateValue;
                                    ratesDisplayValues[col] = `${displayRateValue.toFixed(2)}${suffix}`;
                                  }
                                }
                              }
                            });

                            return (
                              <EditableResultRow
                                label={getLabel('Full Rate')}
                                columns={columnsHeaders}
                                columnValues={ratesDisplayValues}
                                originalValues={originalRates}
                                columnSuffixes={columnSuffixes}
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
                              />
                            );
                          })()
                        }

                        {
                          (() => {
                            const columnsHeaders = [ 'Fusion', 'Variable Bridge', 'Fixed Bridge' ];
                            const allPlaceholders = [
                              'APRC', 'Admin Fee', 'Broker Client Fee', 'Broker Comission (Proc Fee %)',
                              'Broker Comission (Proc Fee £)', 'Commitment Fee £', 'Deferred Interest %', 'Deferred Interest £',
                              'Direct Debit', 'ERC 1 £', 'ERC 2 £', 'Exit Fee', 'Full Int BBR £', 'Full Int Coupon £', 'Full Term',
                              'Gross Loan', 'ICR', 'Initial Term', 'LTV', 'Monthly Interest Cost',
                              'NBP', 'NBP LTV', 'Net Loan', 'Net LTV', 'Pay Rate', 'Product Fee %', 'Product Fee £', 'Revert Rate', 'Revert Rate DD',
                              'Rolled Months', 'Rolled Months Interest', 'Serviced Interest', 'Serviced Months', 'Title Insurance Cost', 'Total Interest'
                            ];
                            
                            // Filter placeholders based on visibility settings, then apply ordering
                            const visiblePlaceholders = allPlaceholders.filter(p => isRowVisible(p));
                            const orderedRows = getOrderedRows(visiblePlaceholders);

                            const values = {};
                            const originalProductFees = {};
                            orderedRows.forEach(p => { values[p] = {}; });

                            const colBest = [bestFusion, bestVariable, bestFixed];
                            const pv = parseNumber(propertyValue);
                            const grossInput = parseNumber(grossLoan);
                            const specificNet = parseNumber(specificNetLoan);

                              columnsHeaders.forEach((col, idx) => {
                              const best = colBest[idx];
                              if (!best) return;
                              
                              // Check if this column needs " + BBR" suffix (Fusion or Variable Bridge)
                              const needsBBR = col === 'Fusion' || col === 'Variable Bridge';
                              
                              // Use the already-calculated values from bridgeFusionCalculationEngine
                              // Product Fee %
                              if (values['Product Fee %']) {
                                const originalFeeValue = getNumericValue(best.original_product_fee ?? best.product_fee_percent);
                                const appliedFeeValue = getNumericValue(best.product_fee_percent);

                                if (originalFeeValue != null) {
                                  originalProductFees[col] = `${originalFeeValue}%`;
                                } else if (appliedFeeValue != null) {
                                  originalProductFees[col] = `${appliedFeeValue}%`;
                                }

                                if (appliedFeeValue != null) {
                                  const appliedFeeText = `${appliedFeeValue}%`;
                                  values['Product Fee %'][col] = productFeeOverrides[col] || appliedFeeText;
                                }
                              }

                              // Gross Loan
                              if (best.gross_loan && values['Gross Loan']) {
                                values['Gross Loan'][col] = `£${Number(best.gross_loan).toLocaleString('en-GB')}`;
                              }

                              // Product Fee £
                              if (best.product_fee_pounds && values['Product Fee £']) {
                                values['Product Fee £'][col] = `£${Number(best.product_fee_pounds).toLocaleString('en-GB')}`;
                              }

                              // Net Loan
                              if (best.net_loan && values['Net Loan']) {
                                values['Net Loan'][col] = `£${Number(best.net_loan).toLocaleString('en-GB')}`;
                              }

                              // NBP (Net Proceeds to Borrower)
                              if (best.nbp && values['NBP']) {
                                values['NBP'][col] = `£${Number(best.nbp).toLocaleString('en-GB')}`;
                              }

                              // NBP LTV
                              if (best.nbpLTV != null && values['NBP LTV']) {
                                values['NBP LTV'][col] = `${Number(best.nbpLTV).toFixed(2)}%`;
                              }

                              // LTV
                              if (best.ltv && values['LTV']) {
                                values['LTV'][col] = `${best.ltv}%`;
                              }

                              // Net LTV
                              if (best.net_ltv && values['Net LTV']) {
                                values['Net LTV'][col] = `${best.net_ltv}%`;
                              }

                              // Pay Rate - Recalculate dynamically based on current deferred interest
                              if (best.pay_rate && values['Pay Rate']) {
                                // For Fusion: Pay Rate = margin - deferred (annual %)
                                // For Bridge: Pay Rate = coupon monthly %
                                let payRateValue = parseFloat(best.pay_rate);
                                
                                if (col === 'Fusion') {
                                  // Fusion: margin is in best.rate, need to subtract current deferred
                                  const marginRate = parseFloat(best.rate) || 0;
                                  const currentDeferred = deferredInterestPerColumn['Fusion'] || 0;
                                  payRateValue = marginRate - currentDeferred;
                                }
                                
                                values['Pay Rate'][col] = `${payRateValue.toFixed(2)}%${needsBBR ? ' + BBR' : ''}`;
                              }

                              // Monthly Interest Cost
                              if (best.monthly_interest_cost && values['Monthly Interest Cost']) {
                                values['Monthly Interest Cost'][col] = `£${Number(best.monthly_interest_cost).toLocaleString('en-GB')}`;
                              }

                              // Direct Debit
                              if (best.direct_debit && values['Direct Debit']) {
                                const directDebitAmount = Number(best.direct_debit);
                                // Use actual rolled months from the calculation result
                                const rolledMonths = Number(best.rolled_months) || 0;
                                const directFromMonth = rolledMonths + 1;
                                
                                let displayValue = `£${directDebitAmount.toLocaleString('en-GB')}`;
                                
                                // Add "Direct from month X" text if direct debit > 0 and there are rolled months
                                if (directDebitAmount > 0 && rolledMonths > 0) {
                                  displayValue += ` (from month ${directFromMonth})`;
                                }
                                
                                values['Direct Debit'][col] = displayValue;
                              }

                              // APRC
                              if (best.aprc && values['APRC']) {
                                values['APRC'][col] = `${best.aprc}%`;
                              }

                              // ICR
                              if (best.icr && values['ICR']) {
                                values['ICR'][col] = `${best.icr}%`;
                              }

                              // Admin Fee
                              if (best.admin_fee !== undefined && values['Admin Fee']) {
                                values['Admin Fee'][col] = `£${Number(best.admin_fee).toLocaleString('en-GB')}`;
                              }

                              // Broker Commission (Proc Fee %)
                              if (best.broker_commission_proc_fee_percent && values['Broker Comission (Proc Fee %)']) {
                                values['Broker Comission (Proc Fee %)'][col] = `${best.broker_commission_proc_fee_percent}%`;
                              }

                              // Broker Commission (Proc Fee £)
                              if (best.broker_commission_proc_fee_pounds && values['Broker Comission (Proc Fee £)']) {
                                values['Broker Comission (Proc Fee £)'][col] = `£${Number(best.broker_commission_proc_fee_pounds).toLocaleString('en-GB')}`;
                              }

                              // Rolled Months
                              if (best.rolled_months !== undefined && values['Rolled Months']) {
                                values['Rolled Months'][col] = `${best.rolled_months} months`;
                              }

                              // Rolled Months Interest
                              if (best.rolled_months_interest && values['Rolled Months Interest']) {
                                values['Rolled Months Interest'][col] = `£${Number(best.rolled_months_interest).toLocaleString('en-GB')}`;
                              }

                              // Deferred Interest %
                              if (best.deferred_interest_percent !== undefined && values['Deferred Interest %']) {
                                values['Deferred Interest %'][col] = `${best.deferred_interest_percent}%`;
                              }

                              // Deferred Interest £
                              if (best.deferred_interest_pounds && values['Deferred Interest £']) {
                                values['Deferred Interest £'][col] = `£${Number(best.deferred_interest_pounds).toLocaleString('en-GB')}`;
                              }

                              // Serviced Interest
                              if (best.serviced_interest && values['Serviced Interest']) {
                                values['Serviced Interest'][col] = `£${Number(best.serviced_interest).toLocaleString('en-GB')}`;
                              }

                              // Full Int Coupon £
                              if (best.full_interest_coupon && values['Full Int Coupon £']) {
                                values['Full Int Coupon £'][col] = `£${Number(best.full_interest_coupon).toLocaleString('en-GB')}`;
                              }

                              // Full Int BBR £
                              if (best.full_interest_bbr && values['Full Int BBR £']) {
                                values['Full Int BBR £'][col] = `£${Number(best.full_interest_bbr).toLocaleString('en-GB')}`;
                              }

                              // Revert Rate (if available)
                              if (best.revert_rate && values['Revert Rate']) {
                                values['Revert Rate'][col] = `${best.revert_rate}%`;
                              }

                              // Revert Rate DD (if available)
                              if (best.revert_rate_dd && values['Revert Rate DD']) {
                                values['Revert Rate DD'][col] = `£${Number(best.revert_rate_dd).toLocaleString('en-GB')}`;
                              }

                              // Commitment Fee £ (if available)
                              if (best.commitment_fee_pounds && values['Commitment Fee £']) {
                                values['Commitment Fee £'][col] = `£${Number(best.commitment_fee_pounds).toLocaleString('en-GB')}`;
                              }

                              // Exit Fee (if available)
                              if (best.exit_fee && values['Exit Fee']) {
                                values['Exit Fee'][col] = `£${Number(best.exit_fee).toLocaleString('en-GB')}`;
                              }

                              // Initial Term
                              if (best.initial_term != null && values['Initial Term']) {
                                values['Initial Term'][col] = `${best.initial_term} months`;
                              }

                              // Full Term
                              if (best.full_term != null && values['Full Term']) {
                                values['Full Term'][col] = `${best.full_term} months`;
                              }

                              // Serviced Months
                              if (best.serviced_months != null && values['Serviced Months']) {
                                values['Serviced Months'][col] = `${best.serviced_months} months`;
                              }

                              // ERC 1 £ (Fusion only)
                              if (col === 'Fusion' && best.erc_1_pounds !== undefined && values['ERC 1 £']) {
                                values['ERC 1 £'][col] = `£${Number(best.erc_1_pounds).toLocaleString('en-GB')}`;
                              }

                              // ERC 2 £ (Fusion only)
                              if (col === 'Fusion' && best.erc_2_pounds !== undefined && values['ERC 2 £']) {
                                values['ERC 2 £'][col] = `£${Number(best.erc_2_pounds).toLocaleString('en-GB')}`;
                              }

                              // Broker Client Fee (if available)
                              if (best.broker_client_fee && values['Broker Client Fee']) {
                                values['Broker Client Fee'][col] = `£${Number(best.broker_client_fee).toLocaleString('en-GB')}`;
                              }

                              // Total Interest (Deferred + Rolled + Serviced)
                              if (best.total_interest && values['Total Interest']) {
                                values['Total Interest'][col] = `£${Number(best.total_interest).toLocaleString('en-GB')}`;
                              }

                              // Title Insurance Cost (if available)
                              if (best.title_insurance_cost && values['Title Insurance Cost']) {
                                values['Title Insurance Cost'][col] = `£${Number(best.title_insurance_cost).toLocaleString('en-GB')}`;
                              }
                            });

                            // Extract min/max values from rates for sliders
                            const rolledMonthsMinPerCol = {};
                            const rolledMonthsMaxPerCol = {};
                            const deferredInterestMinPerCol = {};
                            const deferredInterestMaxPerCol = {};
                            const isDeferredDisabledPerCol = {}; // Track if deferred is disabled for Bridge
                            
                            const bridgingTermMonths = parseNumber(bridgingTerm) || 12;
                            
                            columnsHeaders.forEach((col, idx) => {
                              const best = colBest[idx];
                              if (best) {
                                rolledMonthsMinPerCol[col] = best.min_rolled_months ?? 0;
                                
                                // For Bridge products, cap rolled months at loan term
                                // Fusion has its own 24-month term
                                const maxRolledFromRate = best.max_rolled_months ?? 24;
                                if (col === 'Fusion') {
                                  rolledMonthsMaxPerCol[col] = maxRolledFromRate; // Fusion independent
                                } else {
                                  // Bridge products: cap at loan term
                                  rolledMonthsMaxPerCol[col] = Math.min(maxRolledFromRate, bridgingTermMonths);
                                }
                                
                                // Deferred interest: only enabled for Fusion
                                if (col === 'Fusion') {
                                  deferredInterestMinPerCol[col] = 0; // Start at 0
                                  deferredInterestMaxPerCol[col] = best.max_defer_int ?? 2;
                                  isDeferredDisabledPerCol[col] = false;
                                } else {
                                  // Bridge products: deferred interest disabled
                                  deferredInterestMinPerCol[col] = 0;
                                  deferredInterestMaxPerCol[col] = 0;
                                  isDeferredDisabledPerCol[col] = true;
                                }
                              } else {
                                rolledMonthsMinPerCol[col] = 0;
                                rolledMonthsMaxPerCol[col] = 24;
                                deferredInterestMinPerCol[col] = 0;
                                deferredInterestMaxPerCol[col] = 0;
                                isDeferredDisabledPerCol[col] = true;
                              }
                            });

                            // Initialize per-column values if not set
                            const currentRolledMonthsPerCol = { ...rolledMonthsPerColumn };
                            const currentDeferredInterestPerCol = { ...deferredInterestPerColumn };
                            columnsHeaders.forEach(col => {
                              if (currentRolledMonthsPerCol[col] === undefined) {
                                currentRolledMonthsPerCol[col] = rolledMonthsMinPerCol[col] || 0;
                              }
                              if (currentDeferredInterestPerCol[col] === undefined) {
                                currentDeferredInterestPerCol[col] = deferredInterestMinPerCol[col] || 0;
                              }
                            });

                            // Render rows in order, using slider for specific fields
                            return orderedRows.map((rowLabel) => {
                              if (rowLabel === 'Rolled Months') {
                                return (
                                  <SliderResultRow
                                    key="Rolled Months"
                                    label={getLabel('Rolled Months')}
                                    value={0}
                                    onChange={(newValue, columnKey) => {
                                      setRolledMonthsPerColumn(prev => ({ ...prev, [columnKey]: newValue }));
                                    }}
                                    min={0}
                                    max={24}
                                    step={1}
                                    suffix=" months"
                                    disabled={isReadOnly}
                                    columns={columnsHeaders}
                                    columnValues={currentRolledMonthsPerCol}
                                    columnMinValues={rolledMonthsMinPerCol}
                                    columnMaxValues={rolledMonthsMaxPerCol}
                                  />
                                );
                              } else if (rowLabel === 'Deferred Interest %') {
                                return (
                                  <SliderResultRow
                                    key="Deferred Interest %"
                                    label={getLabel('Deferred Interest %')}
                                    value={0}
                                    onChange={(newValue, columnKey) => {
                                      // Only allow changes for Fusion
                                      if (!isDeferredDisabledPerCol[columnKey]) {
                                        setDeferredInterestPerColumn(prev => ({ ...prev, [columnKey]: newValue }));
                                      }
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    suffix="%"
                                    disabled={isReadOnly}
                                    columns={columnsHeaders}
                                    columnValues={currentDeferredInterestPerCol}
                                    columnMinValues={deferredInterestMinPerCol}
                                    columnMaxValues={deferredInterestMaxPerCol}
                                    columnDisabled={isDeferredDisabledPerCol}
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
                                      setProductFeeOverrides(prev => ({ ...prev, [columnKey]: newValue }));
                                    }}
                                    onReset={(columnKey) => {
                                      setProductFeeOverrides(prev => {
                                        const updated = { ...prev };
                                        delete updated[columnKey];
                                        return updated;
                                      });
                                    }}
                                    disabled={isReadOnly}
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
                      </>
                    );
                  })()
                }
              </tbody>
            </table>
          </div>
            );
          })()}
        </div>
      </section>

      {/* Placeholders are injected into the results table as rows (see above) */}

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
            property_type: answers['Property type'] || '',
            loan_purpose: answers['Loan purpose'] || '',
            applicant_type: answers['Borrower type'] || '',
            borrower_name: currentQuoteData?.borrower_name || '',
            quote_borrower_name: currentQuoteData?.quote_borrower_name || ''
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
          onRequirementsChange={setUwCustomRequirements}
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
        calculatorType="BRIDGING"
        existingDipData={dipData}
        availableFeeTypes={bridgeFeeTypes}
        allRates={relevantRates}
        onSave={handleSaveDipData}
        onCreatePDF={handleCreatePDF}
        onFeeTypeSelected={handleFeeTypeSelection}
      />

      {/* Issue Quote Modal */}
      <IssueQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        quoteId={currentQuoteId}
        calculatorType="Bridging"
        availableFeeRanges={getAvailableFeeTypes()}
        existingQuoteData={quoteData}
        onSave={handleSaveQuoteData}
        onCreatePDF={handleCreateQuotePDF}
      />

    </div>
  );
}
