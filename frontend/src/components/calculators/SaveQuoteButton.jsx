import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { saveQuote, updateQuote } from '../../utils/quotes';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useSaveShortcut, useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { useUiPreferences } from '../../hooks/useUiPreferences';
import ModalShell from '../modals/ModalShell';

// SaveQuoteButton shows a small modal to collect { name, borrowerName, applicantNames, notes }
// If `existingQuote` prop provided (object with id), the button will perform an update instead of create.
export default function SaveQuoteButton({
  calculatorType,
  calculationData,
  allColumnData,
  bestSummary = null,
  existingQuote = null,
  showProductRangeSelection = false,
  onSaved = null,
  onCancel = null,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const uiPrefs = useUiPreferences();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [borrowerType, setBorrowerType] = useState('Personal');
  const [borrowerName, setBorrowerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [productRange, setProductRange] = useState('specialist'); // Core or Specialist
  const getUserName = () => user?.name || 'Unknown User';

  useEffect(() => {
    if (existingQuote) {
      setName(existingQuote.name || '');
      // Read borrower info from the new flat structure
      // Map 'Company' to 'Corporate' for backward compatibility
      const applicantType = existingQuote.applicant_type || 'Personal';
      setBorrowerType(applicantType === 'Company' ? 'Corporate' : applicantType);
      setBorrowerName(existingQuote.borrower_name || '');
      setCompanyName(existingQuote.company_name || '');
      setNotes(existingQuote.notes || '');
      setProductRange(existingQuote.selected_range || calculationData.selectedRange || 'specialist');
    } else {
      // For new quotes, default to current selectedRange from calculationData
      setProductRange(calculationData.selectedRange || 'specialist');
      
      // For new quotes, ensure name is empty initially, rather than auto-populating
      if (!existingQuote) {
        setName('');
      }
    }
  }, [existingQuote, calculationData.selectedRange]);

  const openForm = () => setOpen(true);
  const closeForm = () => setOpen(false);
  
  // Keyboard shortcuts - only enabled if user preference allows
  useSaveShortcut(() => {
    if (open && !saving) {
      handleSubmit();
    }
  }, open && uiPrefs.keyboardShortcutsEnabled);
  
  useEscapeKey(() => {
    if (open && !saving) {
      closeForm();
    }
  }, open && uiPrefs.keyboardShortcutsEnabled);

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setError(null);
    if (!name || name.trim().length === 0) {
      setError('Please provide a name for the quote');
      return;
    }
    setSaving(true);
    try {
      // Helper to parse numeric values from formatted strings
      const parseNumeric = (val) => {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[^0-9.-]/g, '');
        const num = Number(cleaned);
        return Number.isFinite(num) ? num : null;
      };

      const normalizedCalculatorType = (calculatorType || '').toString().toLowerCase();

      const sanitizeValue = (value) => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'number') {
          return Number.isFinite(value) ? value : undefined;
        }
        if (typeof value === 'string') {
          const trimmed = value.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        }
        if (typeof value === 'boolean') {
          return value;
        }
        return value;
      };

      const sanitizeObject = (input) => {
        if (Array.isArray(input)) {
          const sanitizedArray = input
            .map(item => (typeof item === 'object' && item !== null ? sanitizeObject(item) : sanitizeValue(item)))
            .filter(item => {
              if (item === undefined) return false;
              if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0) return false;
              return true;
            });
          return sanitizedArray.length > 0 ? sanitizedArray : undefined;
        }

        if (input && typeof input === 'object') {
          return Object.entries(input).reduce((acc, [key, value]) => {
            const sanitized = Array.isArray(value) || (value && typeof value === 'object' && !(value instanceof Date))
              ? sanitizeObject(value)
              : sanitizeValue(value);

            if (sanitized !== undefined) {
              acc[key] = sanitized;
            }
            return acc;
          }, {});
        }

        return sanitizeValue(input);
      };

      // Map calculator fields to database columns
      const quoteData = {
        name,
        calculator_type: normalizedCalculatorType,
        status: 'draft',
        // Client details (from calculators)
        client_type: calculationData.clientType || null, // 'Direct' or 'Broker'
        client_first_name: calculationData.clientFirstName || null,
        client_last_name: calculationData.clientLastName || null,
        client_email: calculationData.clientEmail || null,
        client_contact_number: calculationData.clientContact || null,
        broker_company_name: calculationData.brokerCompanyName || null,
        broker_route: calculationData.brokerRoute || null, // Direct Broker | Mortgage club | Network | Packager
        broker_commission_percent: calculationData.brokerCommissionPercent != null ? Number(calculationData.brokerCommissionPercent) : null,
        applicant_type: borrowerType,
        borrower_name: borrowerType === 'Personal' ? borrowerName : null,
        company_name: borrowerType === 'Corporate' ? companyName : null,
        notes: notes || null,
        created_by: user?.name || 'Unknown User', // Get name from authenticated user
        created_by_id: user?.id || null, // Store user ID for tracking
      };

      // Debug: Log user info being saved

      // Add BTL-specific fields
      if (normalizedCalculatorType === 'btl') {
        quoteData.product_scope = calculationData.productScope || null;
        quoteData.retention_choice = calculationData.retentionChoice || null;
        quoteData.retention_ltv = calculationData.retentionLtv ? Number(calculationData.retentionLtv) : null;
        quoteData.tier = calculationData.tier ? Number(calculationData.tier) : null;
        quoteData.property_value = parseNumeric(calculationData.propertyValue);
        quoteData.monthly_rent = parseNumeric(calculationData.monthlyRent);
        quoteData.top_slicing = parseNumeric(calculationData.topSlicing);
        quoteData.loan_calculation_requested = calculationData.loanType || null;
        quoteData.specific_gross_loan = parseNumeric(calculationData.specificGrossLoan);
        quoteData.specific_net_loan = parseNumeric(calculationData.specificNetLoan);
        quoteData.target_ltv = calculationData.targetLtv ? Number(calculationData.targetLtv) : null;
        quoteData.product_type = calculationData.productType || null;
        quoteData.add_fees_toggle = calculationData.addFeesToggle || false;
        quoteData.fee_calculation_type = calculationData.feeCalculationType || null;
        quoteData.additional_fee_amount = parseNumeric(calculationData.additionalFeeAmount);
        quoteData.selected_range = productRange; // Use the selected product range from UI
        // Serialize criteria answers as JSON string
        quoteData.criteria_answers = calculationData.answers ? JSON.stringify(calculationData.answers) : null;
        
        // Save overrides as JSON strings
        quoteData.rates_overrides = calculationData.ratesOverrides && Object.keys(calculationData.ratesOverrides).length > 0 
          ? JSON.stringify(calculationData.ratesOverrides) 
          : null;
        quoteData.product_fee_overrides = calculationData.productFeeOverrides && Object.keys(calculationData.productFeeOverrides).length > 0 
          ? JSON.stringify(calculationData.productFeeOverrides) 
          : null;
        quoteData.rolled_months_per_column = calculationData.rolledMonthsPerColumn && Object.keys(calculationData.rolledMonthsPerColumn).length > 0 
          ? JSON.stringify(calculationData.rolledMonthsPerColumn) 
          : null;
        quoteData.deferred_interest_per_column = calculationData.deferredInterestPerColumn && Object.keys(calculationData.deferredInterestPerColumn).length > 0 
          ? JSON.stringify(calculationData.deferredInterestPerColumn) 
          : null;
        
        // Filter rates by selected product range before saving
        let ratesToSave = calculationData.relevantRates || [];
        
        if (showProductRangeSelection && ratesToSave.length > 0) {
          ratesToSave = ratesToSave.filter(rate => {
            const rateType = (rate.rate_type || rate.type || '').toString().toLowerCase();
            if (productRange === 'core') {
              return rateType === 'core' || rateType.includes('core');
            } else {
              return rateType === 'specialist' || rateType.includes('specialist') || !rateType || rateType === '';
            }
          });
        }
        
        quoteData.rates_and_products = ratesToSave ? JSON.stringify(ratesToSave) : null;
        
        // Prepare all rate results for saving to quote_results table (filtered by product range)
        if (ratesToSave && Array.isArray(ratesToSave)) {
          
          quoteData.results = ratesToSave.map(rate => ({
            fee_column: rate.product_fee !== undefined && rate.product_fee !== null && rate.product_fee !== '' 
              ? String(rate.product_fee) 
              : null,
            gross_loan: parseNumeric(rate.gross_loan),
            net_loan: parseNumeric(rate.net_loan),
            ltv_percentage: parseNumeric(rate.ltv),
            net_ltv: parseNumeric(rate.net_ltv),
            property_value: parseNumeric(rate.property_value),
            icr: parseNumeric(rate.icr),
            initial_rate: parseNumeric(rate.initial_rate || rate.rate),
            pay_rate: parseNumeric(rate.pay_rate),
            revert_rate: parseNumeric(rate.revert_rate),
            revert_rate_dd: parseNumeric(rate.revert_rate_dd),
            full_rate: parseNumeric(rate.full_rate),
            aprc: parseNumeric(rate.aprc),
            product_fee_percent: parseNumeric(rate.product_fee_percent || rate.product_fee),
            product_fee_pounds: parseNumeric(rate.product_fee_pounds),
            admin_fee: parseNumeric(rate.admin_fee),
            broker_client_fee: parseNumeric(rate.broker_client_fee),
            broker_commission_proc_fee_percent: parseNumeric(rate.broker_commission_proc_fee_percent),
            broker_commission_proc_fee_pounds: parseNumeric(rate.broker_commission_proc_fee_pounds),
            commitment_fee_pounds: parseNumeric(rate.commitment_fee_pounds),
            exit_fee: parseNumeric(rate.exit_fee),
            erc_1_pounds: parseNumeric(rate.erc_1_pounds),
            erc_2_pounds: parseNumeric(rate.erc_2_pounds),
            monthly_interest_cost: parseNumeric(rate.monthly_interest_cost),
            rolled_months: parseNumeric(rate.rolled_months),
            rolled_months_interest: parseNumeric(rate.rolled_months_interest),
            deferred_interest_percent: parseNumeric(rate.deferred_interest_percent),
            deferred_interest_pounds: parseNumeric(rate.deferred_interest_pounds),
            serviced_interest: parseNumeric(rate.serviced_interest),
            direct_debit: rate.direct_debit || null,
            erc: rate.erc || null,
            rent: parseNumeric(rate.rent),
            top_slicing: parseNumeric(rate.top_slicing),
            nbp: parseNumeric(rate.nbp),
            nbp_ltv: parseNumeric(rate.nbpLTV || rate.nbp_ltv),
            total_cost_to_borrower: parseNumeric(rate.total_cost_to_borrower),
            total_loan_term: parseNumeric(rate.total_loan_term),
            title_insurance_cost: parseNumeric(rate.titleInsuranceCost || rate.title_insurance_cost),
            product_name: rate.product_name || rate.product || null,
            // Complete rate metadata fields for historical accuracy
            initial_term: rate.initial_term ? Number(rate.initial_term) : null,
            full_term: rate.full_term ? Number(rate.full_term) : null,
            revert_rate_type: rate.revert_rate_type || null,
            product_range: rate.product_range || null,
            rate_id: rate.id || rate.rate_id || null,
            revert_index: rate.revert_index || null,
            revert_margin: parseNumeric(rate.revert_margin),
            min_loan: parseNumeric(rate.min_loan),
            max_loan: parseNumeric(rate.max_loan),
            min_ltv: parseNumeric(rate.min_ltv),
            max_ltv: parseNumeric(rate.max_ltv),
            max_rolled_months: rate.max_rolled_months ? Number(rate.max_rolled_months) : null,
            max_defer_int: parseNumeric(rate.max_defer_int),
            min_icr: parseNumeric(rate.min_icr),
            tracker_flag: rate.tracker === true || rate.tracker === 'Yes' || rate.tracker_flag === true,
            max_top_slicing: parseNumeric(rate.max_top_slicing),
            admin_fee_amount: parseNumeric(rate.admin_fee_amount || rate.admin_fee),
            erc_1: parseNumeric(rate.erc_1),
            erc_2: parseNumeric(rate.erc_2),
            erc_3: parseNumeric(rate.erc_3),
            erc_4: parseNumeric(rate.erc_4),
            erc_5: parseNumeric(rate.erc_5),
            rate_status: rate.status || rate.rate_status || null,
            floor_rate: parseNumeric(rate.floor_rate),
            proc_fee: parseNumeric(rate.proc_fee),
            tier: rate.tier || null,
            property_type: rate.property_type || rate.property || null,
            retention_type: rate.retention || rate.retention_type || null,
            rate_percent: parseNumeric(rate.rate || rate.rate_percent),
            product_fee_saved: parseNumeric(rate.product_fee),
          }));
          
        }
      }

      // Add Bridging-specific fields
      if (normalizedCalculatorType === 'bridging' || normalizedCalculatorType === 'bridge') {
        quoteData.product_scope = calculationData.productScope || null;
        quoteData.property_value = parseNumeric(calculationData.propertyValue);
        quoteData.gross_loan = parseNumeric(calculationData.grossLoan);
        quoteData.first_charge_value = parseNumeric(calculationData.firstChargeValue);
        quoteData.monthly_rent = parseNumeric(calculationData.monthlyRent);
        quoteData.top_slicing = parseNumeric(calculationData.topSlicing);
        quoteData.use_specific_net_loan = calculationData.useSpecificNet === 'Yes' || calculationData.useSpecificNet === true;
        quoteData.specific_net_loan = parseNumeric(calculationData.specificNetLoan);
        quoteData.bridging_loan_term = calculationData.bridgingTerm ? Number(calculationData.bridgingTerm) : null;
        quoteData.commitment_fee = parseNumeric(calculationData.commitmentFee);
        quoteData.exit_fee_percent = calculationData.exitFeePercent ? Number(calculationData.exitFeePercent) : null;
        quoteData.charge_type = calculationData.chargeType || null;
        quoteData.sub_product = calculationData.subProduct || null;
        quoteData.loan_calculation_requested = calculationData.loanCalculationRequested || null;
        quoteData.add_fees_toggle = calculationData.addFeesToggle || false;
        quoteData.fee_calculation_type = calculationData.feeCalculationType || null;
        quoteData.additional_fee_amount = parseNumeric(calculationData.additionalFeeAmount);
        // Serialize criteria answers as JSON string
        quoteData.criteria_answers = calculationData.answers ? JSON.stringify(calculationData.answers) : null;
        
        // Save overrides as JSON strings
        quoteData.rates_overrides = calculationData.ratesOverrides && Object.keys(calculationData.ratesOverrides).length > 0 
          ? JSON.stringify(calculationData.ratesOverrides) 
          : null;
        quoteData.product_fee_overrides = calculationData.productFeeOverrides && Object.keys(calculationData.productFeeOverrides).length > 0 
          ? JSON.stringify(calculationData.productFeeOverrides) 
          : null;
        quoteData.rolled_months_per_column = calculationData.rolledMonthsPerColumn && Object.keys(calculationData.rolledMonthsPerColumn).length > 0 
          ? JSON.stringify(calculationData.rolledMonthsPerColumn) 
          : null;
        quoteData.deferred_interest_per_column = calculationData.deferredInterestPerColumn && Object.keys(calculationData.deferredInterestPerColumn).length > 0 
          ? JSON.stringify(calculationData.deferredInterestPerColumn) 
          : null;
        
        // Prepare all rate results for saving to bridge_quote_results table
        if (calculationData.results && Array.isArray(calculationData.results)) {
          
          quoteData.results = calculationData.results.map(rate => ({
            fee_column: rate.product_fee !== undefined && rate.product_fee !== null && rate.product_fee !== '' 
              ? String(rate.product_fee) 
              : null,
            gross_loan: parseNumeric(rate.gross_loan),
            net_loan: parseNumeric(rate.net_loan),
            ltv_percentage: parseNumeric(rate.ltv || rate.ltv_percentage),
            net_ltv: parseNumeric(rate.net_ltv),
            property_value: parseNumeric(rate.property_value),
            icr: parseNumeric(rate.icr),
            initial_rate: parseNumeric(rate.initial_rate || rate.rate),
            pay_rate: parseNumeric(rate.pay_rate),
            revert_rate: parseNumeric(rate.revert_rate),
            revert_rate_dd: parseNumeric(rate.revert_rate_dd),
            full_rate: parseNumeric(rate.full_rate),
            aprc: parseNumeric(rate.aprc),
            product_fee_percent: parseNumeric(rate.product_fee_percent || rate.product_fee),
            product_fee_pounds: parseNumeric(rate.product_fee_pounds),
            admin_fee: parseNumeric(rate.admin_fee),
            broker_client_fee: parseNumeric(rate.broker_client_fee),
            broker_commission_proc_fee_percent: parseNumeric(rate.broker_commission_proc_fee_percent),
            broker_commission_proc_fee_pounds: parseNumeric(rate.broker_commission_proc_fee_pounds),
            commitment_fee_pounds: parseNumeric(rate.commitment_fee_pounds),
            exit_fee: parseNumeric(rate.exit_fee),
            erc_1_pounds: parseNumeric(rate.erc_1_pounds),
            erc_2_pounds: parseNumeric(rate.erc_2_pounds),
            monthly_interest_cost: parseNumeric(rate.monthly_interest_cost),
            rolled_months: parseNumeric(rate.rolled_months),
            rolled_months_interest: parseNumeric(rate.rolled_months_interest || rate.rolled_interest),
            deferred_interest_percent: parseNumeric(rate.deferred_interest_percent),
            deferred_interest_pounds: parseNumeric(rate.deferred_interest_pounds || rate.deferred_interest),
            deferred_rate: parseNumeric(rate.deferred_rate),
            serviced_interest: parseNumeric(rate.serviced_interest),
            direct_debit: rate.direct_debit || null,
            erc: rate.erc || null,
            erc_fusion_only: rate.erc_fusion_only || null,
            rent: parseNumeric(rate.rent),
            top_slicing: parseNumeric(rate.top_slicing),
            nbp: parseNumeric(rate.nbp),
            nbp_ltv: parseNumeric(rate.nbpLTV || rate.nbp_ltv),
            total_cost_to_borrower: parseNumeric(rate.total_cost_to_borrower),
            total_loan_term: parseNumeric(rate.total_loan_term),
            title_insurance_cost: parseNumeric(rate.titleInsuranceCost || rate.title_insurance_cost),
            product_name: rate.product_name || rate.product || null,
            
            // New comprehensive calculation fields from bridgeFusionCalculationEngine
            rolled_interest_coupon: parseNumeric(rate.rolled_interest_coupon),
            rolled_interest_bbr: parseNumeric(rate.rolled_interest_bbr),
            full_interest_coupon: parseNumeric(rate.full_interest_coupon),
            full_interest_bbr: parseNumeric(rate.full_interest_bbr),
            deferred_interest: parseNumeric(rate.deferred_interest_pounds || rate.deferred_interest),
            total_interest: parseNumeric(rate.total_interest),
            aprc_annual: parseNumeric(rate.aprc_annual || rate.aprc),
            aprc_monthly: parseNumeric(rate.aprc_monthly),
            total_amount_repayable: parseNumeric(rate.total_amount_repayable),
            monthly_payment: parseNumeric(rate.monthly_interest_cost || rate.monthly_payment),
            full_annual_rate: parseNumeric(rate.full_annual_rate),
            full_rate_monthly: parseNumeric(rate.full_rate_monthly),
            full_coupon_rate_monthly: parseNumeric(rate.full_coupon_rate_monthly),
            margin_monthly: parseNumeric(rate.margin_monthly),
            bbr_monthly: parseNumeric(rate.bbr_monthly),
            deferred_interest_rate: parseNumeric(rate.deferred_interest_rate || rate.deferred_interest_percent),
            term_months: parseNumeric(rate.total_loan_term || rate.term_months),
            serviced_months: parseNumeric(rate.serviced_months),
            tier_name: rate.tier_name || rate.tierName || null,
            product_kind: rate.product_kind || null,
            ltv_bucket: parseNumeric(rate.ltv_bucket),
            gross_ltv: parseNumeric(rate.ltv || rate.gross_ltv),
            arrangement_fee_gbp: parseNumeric(rate.product_fee_pounds || rate.arrangement_fee_gbp),
            arrangement_fee_pct: parseNumeric(rate.product_fee_percent || rate.arrangement_fee_pct),
            
            // Complete rate metadata fields for historical accuracy (Bridging-specific)
            initial_term: rate.initial_term ? Number(rate.initial_term) : null,
            full_term: rate.full_term ? Number(rate.full_term) : null,
            revert_rate_type: rate.revert_rate_type || null,
            product_range: rate.product_range || null,
            rate_id: rate.id || rate.rate_id || null,
            min_term: rate.min_term ? Number(rate.min_term) : null,
            max_term: rate.max_term ? Number(rate.max_term) : null,
            min_rolled: rate.min_rolled ? Number(rate.min_rolled) : null,
            max_rolled: rate.max_rolled ? Number(rate.max_rolled) : null,
            min_loan: parseNumeric(rate.min_loan),
            max_loan: parseNumeric(rate.max_loan),
            min_ltv: parseNumeric(rate.min_ltv),
            max_ltv: parseNumeric(rate.max_ltv),
            min_icr: parseNumeric(rate.min_icr),
            max_defer: parseNumeric(rate.max_defer),
            erc_1_percent: parseNumeric(rate.erc_1_percent || rate.erc_1),
            erc_2_percent: parseNumeric(rate.erc_2_percent || rate.erc_2),
            rate_percent: parseNumeric(rate.rate || rate.rate_percent),
            product_fee_saved: parseNumeric(rate.product_fee),
            charge_type: rate.charge_type || null,
            type: rate.type || null,
            product: rate.product || null,
            property_type: rate.property_type || rate.property || null,
            rate_status: rate.status || rate.rate_status || null,
            tier: rate.tier || null,
          }));
          
          // Log sample result for debugging
          if (quoteData.results.length > 0) {
          }
        }
      }

      const sanitizedQuoteData = sanitizeObject(quoteData);

      // The backend will handle which table to save to based on calculator_type
      let res;
      if (existingQuote) {
        // Update existing quote - add updated_by fields
        res = await updateQuote(existingQuote.id, { 
          ...sanitizedQuoteData, 
          updated_by: getUserName(),
          updated_by_id: user?.id || null
        });
      } else {
        // Create new quote
        res = await saveQuote(sanitizedQuoteData);
      }

      setSaving(false);
      setOpen(false);
      if (onSaved) onSaved(res.quote || res);
      
      // Display reference number and timestamp in toast notification
      const quote = res.quote || res;
      const refNumber = quote.reference_number || 'N/A';
      const timestamp = existingQuote ? 'updated' : 'created';
      const date = new Date(quote.updated_at || quote.created_at).toLocaleString();
      
      showToast({
        kind: 'success',
        title: `Quote ${timestamp} successfully!`,
        subtitle: `Reference: ${refNumber} • ${date}`,
        timeout: 5000
      });
      
      closeForm();
    } catch (e) {
      setError(e.message || String(e));
      setSaving(false);
    }
  };

  return (
    <div className="display-inline-block">
      <button className="slds-button slds-button_brand" onClick={openForm} disabled={saving}>{saving ? 'Saving…' : (existingQuote ? ' Update Quote' : 'Save Quote')}</button>
      
      {!existingQuote && onCancel && (
        <button 
          className="slds-button slds-button_neutral" 
          onClick={onCancel} 
          disabled={saving}
          style={{ marginLeft: '0.5rem' }}
        >
          Cancel Quote
        </button>
      )}
      
      <ModalShell
        isOpen={open}
        onClose={closeForm}
        title={existingQuote ? 'Update Quote' : 'Save Quote'}
        maxWidth="640px"
        footer={(
          <>
            <button className="slds-button slds-button_neutral" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button className="slds-button slds-button_brand" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : (existingQuote ? 'Update' : 'Save')}

            </button>
          </>
        )}
      >
        {error && <div className="slds-text-color_error margin-bottom-05">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="quote-name-input">Quote Name</label>
            <div className="slds-form-element__control"><input id="quote-name-input" className="slds-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          </div>

          <div className="slds-form-element margin-top-1 padding-y-05 padding-x-05 border-radius-4 background-gray-light">
            <label className="slds-form-element__label">Created By</label>
            <div className="slds-form-element__control padding-top-025 font-weight-bold">
              {existingQuote?.created_by || user?.name || 'N/A'}
            </div>
          </div>

          <div className="slds-form-element margin-top-1">
            <label className="slds-form-element__label">Applicant Type</label>
            <div className="slds-form-element__control">
              <select className="slds-select" value={borrowerType} onChange={(e) => setBorrowerType(e.target.value)}>
                <option value="Personal">Personal</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>
          </div>

          {borrowerType === 'Personal' && (
            <div className="slds-form-element">
              <label className="slds-form-element__label">Borrower Name</label>
              <div className="slds-form-element__control"><input className="slds-input" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} /></div>
            </div>
          )}

          {borrowerType === 'Corporate' && (
            <div className="slds-form-element">
              <label className="slds-form-element__label">Company Name</label>
              <div className="slds-form-element__control"><input className="slds-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            </div>
          )}

          {showProductRangeSelection && calculatorType === 'BTL' && (
            <div className="slds-form-element">
              <label className="slds-form-element__label">Product Range to Quote/Save</label>
              <div className="slds-form-element__control">
                <select className="slds-select" value={productRange} onChange={(e) => setProductRange(e.target.value)}>
                  <option value="specialist">Specialist</option>
                  <option value="core">Core</option>
                </select>
              </div>
              <div className="slds-form-element__help slds-text-body_small helper-text margin-top-025">
                Only rates from the selected product range will be saved with this quote
              </div>
            </div>
          )}

          <div className="slds-form-element">
            <label className="slds-form-element__label">Notes</label>
            <div className="slds-form-element__control"><textarea className="slds-textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>

        </form>
      </ModalShell>
    </div>
  );
}

SaveQuoteButton.propTypes = {
  calculatorType: PropTypes.oneOf(['bridging', 'btl', 'BTL', 'BRIDGING', 'BRIDGE']).isRequired,
  calculationData: PropTypes.shape({
    // Common fields
    propertyValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    monthlyRent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    topSlicing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    productScope: PropTypes.string,
    selectedRange: PropTypes.string,
    answers: PropTypes.object,
    // Client details
    clientType: PropTypes.string,
    clientFirstName: PropTypes.string,
    clientLastName: PropTypes.string,
    clientEmail: PropTypes.string,
    clientContact: PropTypes.string,
    brokerCompanyName: PropTypes.string,
    brokerRoute: PropTypes.string,
    brokerCommissionPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    // BTL-specific
    retentionChoice: PropTypes.string,
    retentionLtv: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tier: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    loanType: PropTypes.string,
    specificGrossLoan: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    specificNetLoan: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    targetLtv: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    productType: PropTypes.string,
    addFeesToggle: PropTypes.bool,
    feeCalculationType: PropTypes.string,
    additionalFeeAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    relevantRates: PropTypes.arrayOf(PropTypes.object),
    // Bridging-specific
    grossLoan: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    firstChargeValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    useSpecificNet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    bridgingTerm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    commitmentFee: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    exitFeePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    chargeType: PropTypes.string,
    subProduct: PropTypes.string,
    results: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  allColumnData: PropTypes.arrayOf(PropTypes.object).isRequired,
  bestSummary: PropTypes.shape({
    lender: PropTypes.string,
    monthlyRate: PropTypes.number,
    annualRate: PropTypes.number,
    product: PropTypes.string,
    criteria: PropTypes.string,
  }),
  existingQuote: PropTypes.shape({
    id: PropTypes.string,
    reference_number: PropTypes.string,
    calculator_type: PropTypes.string,
    calculation_data: PropTypes.object,
    name: PropTypes.string,
    applicant_type: PropTypes.string,
    borrower_name: PropTypes.string,
    company_name: PropTypes.string,
    notes: PropTypes.string,
    selected_range: PropTypes.string,
    status: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }),
  showProductRangeSelection: PropTypes.bool,
  onSaved: PropTypes.func,
  onCancel: PropTypes.func,
};
