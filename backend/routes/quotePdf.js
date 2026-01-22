import express from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Generate Quote PDF (different from DIP PDF - shows multiple fee ranges)
// UPDATED: Now shows ALL fields per fee range in organized sections
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch the quote from either table
    let quote = null;
    let isBridge = false;
    let { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      quote = data;
      isBridge = false;
    } else {
      // Try bridge_quotes
      const { data: bdata, error: berr } = await supabase.from('bridge_quotes').select('*').eq('id', id).single();
      if (berr) {
        if (berr.code === 'PGRST116') return res.status(404).json({ error: 'Quote not found' });
        throw berr;
      }
      quote = bdata;
      isBridge = true;
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Fetch results from the corresponding results table
    const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';
    const { data: resultsData, error: resultsError } = await supabase
      .from(resultsTable)
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true});
    
    if (resultsError) {
    }
    if (resultsData && resultsData.length > 0) {
    }
    

    
    // Attach results to quote object
    quote.results = resultsData || [];

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
  // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Quote_${quote.reference_number || id}.pdf`);
  // Prevent any caching of generated PDFs
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
    
    // Pipe PDF to response
    doc.pipe(res);

  // Header
  doc.fontSize(20).text('Mortgage Quote', { align: 'center' });
  doc.moveDown();
  // Visible layout/version marker to confirm correct route & code path
  doc.fontSize(10).fillColor('gray').text('Layout: Quote Detailed v2', { align: 'center' });
  doc.fillColor('black');
    doc.fontSize(12).text(`Reference Number: ${quote.reference_number || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    // Borrower Information
    if (quote.quote_borrower_name) {
      doc.fontSize(16).text('Borrower Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Name: ${quote.quote_borrower_name}`);
      doc.moveDown(1);
    }

    // Quote Information Section
    doc.fontSize(16).text('Quote Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (quote.calculator_type) doc.text(`Calculator Type: ${quote.calculator_type}`);
    if (quote.product_scope) doc.text(`Product Scope: ${quote.product_scope}`);
    if (quote.product_type) doc.text(`Product Type: ${quote.product_type}`);
    if (quote.selected_range) doc.text(`Product Range: ${quote.selected_range === 'specialist' ? 'Specialist' : 'Core'}`);
    
    // Retention information
    if (quote.retention_choice) {
      doc.text(`Retention: ${quote.retention_choice}`);
      if (quote.retention_choice !== 'No' && quote.retention_ltv) {
        doc.text(`Retention LTV: ${quote.retention_ltv}%`);
      }
    }
    
    doc.moveDown(1);

    // Loan Details Section
    doc.fontSize(16).text('Loan Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (quote.property_value) doc.text(`Property Value: £${Number(quote.property_value).toLocaleString('en-GB')}`);
    if (quote.monthly_rent) doc.text(`Monthly Rent: £${Number(quote.monthly_rent).toLocaleString('en-GB')}`);
    
    // BTL specific fields
    if (quote.calculator_type === 'BTL') {
      if (quote.loan_calculation_requested) doc.text(`Loan Type: ${quote.loan_calculation_requested}`);
      if (quote.specific_gross_loan) doc.text(`Specific Gross Loan: £${Number(quote.specific_gross_loan).toLocaleString('en-GB')}`);
      if (quote.specific_net_loan) doc.text(`Specific Net Loan: £${Number(quote.specific_net_loan).toLocaleString('en-GB')}`);
      if (quote.target_ltv) doc.text(`Target LTV: ${quote.target_ltv}%`);
      if (quote.top_slicing) doc.text(`Top Slicing: £${Number(quote.top_slicing).toLocaleString('en-GB')}`);
    }
    
    // Bridging specific fields
    if (quote.calculator_type === 'BRIDGING') {
      if (quote.gross_loan) doc.text(`Gross Loan: £${Number(quote.gross_loan).toLocaleString('en-GB')}`);
      if (quote.use_specific_net_loan !== undefined) doc.text(`Use Specific Net Loan: ${quote.use_specific_net_loan ? 'Yes' : 'No'}`);
      if (quote.specific_net_loan) doc.text(`Specific Net Loan: £${Number(quote.specific_net_loan).toLocaleString('en-GB')}`);
      if (quote.bridging_loan_term) doc.text(`Bridging Term: ${quote.bridging_loan_term} months`);
      if (quote.charge_type) doc.text(`Charge Type: ${quote.charge_type}`);
      if (quote.sub_product) doc.text(`Sub Product: ${quote.sub_product}`);
      if (quote.top_slicing) doc.text(`Top Slicing: £${Number(quote.top_slicing).toLocaleString('en-GB')}`);
    }
    
    doc.moveDown(1);

    // Additional Fees Section
    if (quote.add_fees_toggle) {
      doc.fontSize(16).text('Additional Fees', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      
      if (quote.fee_calculation_type) {
        doc.text(`Fee Type: ${quote.fee_calculation_type === 'pound' ? 'Fixed Amount (£)' : 'Percentage (%)'}`);
      }
      if (quote.additional_fee_amount) {
        const feeDisplay = quote.fee_calculation_type === 'pound' 
          ? `£${Number(quote.additional_fee_amount).toLocaleString('en-GB')}`
          : `${quote.additional_fee_amount}%`;
        doc.text(`Additional Fee: ${feeDisplay}`);
      }
      
      doc.moveDown(1);
    }

    // Criteria Questions and Answers
    if (quote.criteria_answers) {
      try {
        const answers = typeof quote.criteria_answers === 'string' 
          ? JSON.parse(quote.criteria_answers) 
          : quote.criteria_answers;
        
        if (answers && Object.keys(answers).length > 0) {
          doc.fontSize(16).text('Criteria Answers', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(11);
          
          Object.entries(answers).forEach(([key, value]) => {
            if (value && value.label) {
              // Format the question key to be more readable
              const questionLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              doc.text(`${questionLabel}: ${value.label}`, {
                width: 500,
                align: 'left'
              });
            }
          });
          
          doc.moveDown(1);
        }
      } catch (e) {
      }
    }
    
    doc.moveDown(0.5);

    // Selected Fee Ranges
    if (quote.quote_selected_fee_ranges && Array.isArray(quote.quote_selected_fee_ranges) && quote.quote_selected_fee_ranges.length > 0) {
      doc.fontSize(16).text('Selected Fee Options', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      
      quote.quote_selected_fee_ranges.forEach((feeRange, index) => {
        doc.text(`${index + 1}. ${feeRange}`);
      });
      
      doc.moveDown(1.5);
    }

    // Rate Calculation Details for Selected Fee Ranges
    if (quote.results && Array.isArray(quote.results) && quote.results.length > 0) {
      doc.fontSize(16).text('Rate Details', { underline: true });
      doc.moveDown(0.5);
      
      // Filter results based on selected fee ranges/products
      let selectedResults = quote.results;
      
      if (quote.quote_selected_fee_ranges && Array.isArray(quote.quote_selected_fee_ranges) && quote.quote_selected_fee_ranges.length > 0) {
        if (isBridge) {
          // BRIDGING: Filter results to only show selected products (Fusion, Variable Bridge, Fixed Bridge)
          selectedResults = quote.results.filter(result => {
            if (!result.product_name) {
              return false;
            }
            const matches = quote.quote_selected_fee_ranges.some(selectedProduct => {
              // Match product names like "Fusion", "Variable Bridge", "Fixed Bridge"
              const productName = result.product_name.toString().toLowerCase().trim();
              const selected = selectedProduct.toString().toLowerCase().trim();
              const match = productName === selected || productName.includes(selected) || selected.includes(productName);
              return match;
            });
            return matches;
          });
        } else {
          // BTL: Filter results to only show selected fee ranges
          selectedResults = quote.results.filter(result => {
            if (!result.fee_column) {
              return false;
            }
            const matches = quote.quote_selected_fee_ranges.some(selectedFee => {
              // Match fee ranges like "2%", "2.00", "Fee: 2%", etc.
              const feeValue = result.fee_column.toString();
              const match = selectedFee.includes(feeValue) || selectedFee.includes(`${feeValue}%`);
              return match;
            });
            return matches;
          });
        }
      }
      if (selectedResults.length > 0) {
        selectedResults.forEach((result, idx) => {
          // For Bridging, show product name (Fusion, Variable Bridge, Fixed Bridge)
          // For BTL, show fee percentage
          const optionLabel = isBridge && result.product_name 
            ? `${result.product_name}` 
            : result.fee_column 
              ? `Fee ${result.fee_column}%` 
              : `Option ${idx + 1}`;
          
          // Add page break if this is not the first result and we're running low on space
          if (idx > 0 && doc.y > 650) {
            doc.addPage();
          }
          
          doc.fontSize(13).fillColor('#0176d3').text(`${optionLabel}`, { underline: false });
          doc.fillColor('black');
          doc.fontSize(9);
          doc.moveDown(0.3);
          
          // Helper function to format currency
          const formatCurrency = (value) => {
            if (value === null || value === undefined) return '—';
            return `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          };
          
          // Helper function to format percentage
          const formatPercent = (value, decimals = 2, isTracker = false) => {
            if (value === null || value === undefined) return '—';
            // If it's already a string with +BBR or Tracker, return as-is
            if (typeof value === 'string' && (value.includes('+BBR') || value.toLowerCase() === 'tracker' || value.toLowerCase() === 'mvr')) {
              return value;
            }
            // For tracker rates, add +BBR suffix
            if (isTracker) {
              return `${Number(value).toFixed(decimals)}%+BBR`;
            }
            return `${Number(value).toFixed(decimals)}%`;
          };
          
          // Helper function to format number
          const formatNumber = (value, decimals = 2) => {
            if (value === null || value === undefined) return '—';
            return Number(value).toFixed(decimals);
          };
          
          // Display ALL financial details in organized sections
          
          // Loan Amounts Section
          doc.fontSize(10).fillColor('#555555').text('Loan Details:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.gross_loan !== undefined) doc.text(`  Gross Loan: ${formatCurrency(result.gross_loan)}`);
          if (result.net_loan !== undefined) doc.text(`  Net Loan: ${formatCurrency(result.net_loan)}`);
          if (result.property_value !== undefined) doc.text(`  Property Value: ${formatCurrency(result.property_value)}`);
          if (result.ltv_percentage !== undefined) doc.text(`  LTV: ${formatPercent(result.ltv_percentage)}`);
          if (result.net_ltv !== undefined) doc.text(`  Net LTV: ${formatPercent(result.net_ltv)}`);
          if (result.icr !== undefined) doc.text(`  ICR: ${formatPercent(result.icr)}`);
          doc.moveDown(0.3);
          
          // Rates Section
          doc.fontSize(10).fillColor('#555555').text('Interest Rates:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.initial_rate !== undefined) doc.text(`  Full Annual Rate: ${formatPercent(result.initial_rate)}`);
          
          // Determine if this is a tracker product
          const isTrackerProduct = result.product_name && result.product_name.toLowerCase().includes('tracker');
          
          // Pay Rate - add +BBR suffix for tracker products
          if (result.pay_rate !== undefined) {
            doc.text(`  Pay Rate (pm): ${formatPercent(result.pay_rate, 2, isTrackerProduct)}`);
          }
          
          // Full Rate - add +BBR suffix for tracker products
          if (result.full_rate !== undefined) {
            doc.text(`  Full Rate (pm): ${formatPercent(result.full_rate, 2, isTrackerProduct)}`);
          }
          
          if (result.full_rate_monthly !== undefined) doc.text(`  Full Rate Monthly: ${formatPercent(result.full_rate_monthly)}`);
          if (result.full_coupon_rate_monthly !== undefined) doc.text(`  Full Coupon Rate (pm): ${formatPercent(result.full_coupon_rate_monthly)}`);
          if (result.margin_monthly !== undefined) doc.text(`  Margin Monthly: ${formatPercent(result.margin_monthly)}`);
          if (result.bbr_monthly !== undefined) doc.text(`  BBR Monthly: ${formatPercent(result.bbr_monthly)}`);
          
          // Revert Rate - show MVR or MVR + margin% if revert_index is MVR
          if (result.revert_rate !== undefined) {
            let revertDisplay;
            if (result.revert_index && result.revert_index.toUpperCase() === 'MVR') {
              // Show MVR or MVR + margin if margin > 0
              if (result.revert_margin && Number(result.revert_margin) > 0) {
                revertDisplay = `MVR + ${Number(result.revert_margin).toFixed(2)}%`;
              } else {
                revertDisplay = 'MVR';
              }
            } else {
              // Show numeric revert rate as percentage
              revertDisplay = formatPercent(result.revert_rate, 2, false);
            }
            doc.text(`  Revert Rate (pm): ${revertDisplay}`);
          }
          
          if (result.revert_rate_dd !== undefined) doc.text(`  Revert Rate DD: ${formatPercent(result.revert_rate_dd)}`);
          if (result.aprc !== undefined) doc.text(`  APRC: ${formatPercent(result.aprc)}`);
          if (result.aprc_monthly !== undefined) doc.text(`  APRC (pm): ${formatPercent(result.aprc_monthly)}`);
          if (result.deferred_rate !== undefined) doc.text(`  Deferred Rate: ${formatPercent(result.deferred_rate)}`);
          doc.moveDown(0.3);
          
          // Fees Section
          doc.fontSize(10).fillColor('#555555').text('Fees:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.product_fee_percent !== undefined && result.product_fee_percent !== null) doc.text(`  Product Fee %: ${formatPercent(result.product_fee_percent)}`);
          if (result.product_fee_pounds !== undefined && result.product_fee_pounds !== null) doc.text(`  Product Fee £: ${formatCurrency(result.product_fee_pounds)}`);
          if (result.admin_fee !== undefined && result.admin_fee !== null) doc.text(`  Admin Fee: ${formatCurrency(result.admin_fee)}`);
          if (result.broker_client_fee !== undefined && result.broker_client_fee !== null && result.broker_client_fee > 0) doc.text(`  Broker Client Fee: ${formatCurrency(result.broker_client_fee)}`);
          if (result.broker_commission_proc_fee_percent !== undefined && result.broker_commission_proc_fee_percent !== null && result.broker_commission_proc_fee_percent > 0) doc.text(`  Broker Commission %: ${formatPercent(result.broker_commission_proc_fee_percent)}`);
          if (result.broker_commission_proc_fee_pounds !== undefined && result.broker_commission_proc_fee_pounds !== null && result.broker_commission_proc_fee_pounds > 0) doc.text(`  Broker Commission £: ${formatCurrency(result.broker_commission_proc_fee_pounds)}`);
          if (result.commitment_fee_pounds !== undefined && result.commitment_fee_pounds !== null) doc.text(`  Commitment Fee: ${formatCurrency(result.commitment_fee_pounds)}`);
          if (result.exit_fee !== undefined && result.exit_fee !== null) doc.text(`  Exit Fee: ${formatCurrency(result.exit_fee)}`);
          if (result.title_insurance_cost !== undefined && result.title_insurance_cost !== null) doc.text(`  Title Insurance Cost: ${formatCurrency(result.title_insurance_cost)}`);
          doc.moveDown(0.3);
          
          // Interest Calculations Section
          doc.fontSize(10).fillColor('#555555').text('Interest Calculations:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.monthly_interest_cost !== undefined) doc.text(`  Monthly Interest Cost: ${formatCurrency(result.monthly_interest_cost)}`);
          if (result.rolled_months !== undefined) doc.text(`  Rolled Months: ${formatNumber(result.rolled_months, 0)} months`);
          if (result.rolled_months_interest !== undefined) doc.text(`  Rolled Months Interest: ${formatCurrency(result.rolled_months_interest)}`);
          if (result.rolled_interest_coupon !== undefined) doc.text(`  Roll Int Coupon: ${formatCurrency(result.rolled_interest_coupon)}`);
          if (result.rolled_interest_bbr !== undefined) doc.text(`  Roll Int BBR: ${formatCurrency(result.rolled_interest_bbr)}`);
          if (result.full_interest_coupon !== undefined) doc.text(`  Full Int Coupon: ${formatCurrency(result.full_interest_coupon)}`);
          if (result.full_interest_bbr !== undefined) doc.text(`  Full Int BBR: ${formatCurrency(result.full_interest_bbr)}`);
          if (result.deferred_interest_percent !== undefined) doc.text(`  Deferred Interest %: ${formatPercent(result.deferred_interest_percent)}`);
          if (result.deferred_interest_pounds !== undefined) doc.text(`  Deferred Interest £: ${formatCurrency(result.deferred_interest_pounds)}`);
          if (result.serviced_interest !== undefined) doc.text(`  Serviced Interest: ${formatCurrency(result.serviced_interest)}`);
          if (result.serviced_months !== undefined) doc.text(`  Serviced Months: ${formatNumber(result.serviced_months, 0)} months`);
          if (result.total_interest !== undefined) doc.text(`  Total Interest (Defer + Rolled + Serviced): ${formatCurrency(result.total_interest)}`);
          doc.moveDown(0.3);
          
          // ERC Section (Early Repayment Charges - Fusion only, Bridge calculator only)
          if (isBridge && result.erc_1_pounds !== undefined && result.erc_1_pounds !== null && result.erc_1_pounds > 0) {
            doc.fontSize(10).fillColor('#555555').text('Early Repayment Charges (Fusion Only):', { underline: true });
            doc.fillColor('black').fontSize(9);
            if (result.erc_1_pounds !== undefined && result.erc_1_pounds !== null) doc.text(`  ERC Year 1: ${formatCurrency(result.erc_1_pounds)}`);
            if (result.erc_2_pounds !== undefined && result.erc_2_pounds !== null) doc.text(`  ERC Year 2: ${formatCurrency(result.erc_2_pounds)}`);
            doc.moveDown(0.3);
          }
          
          // Other Details Section
          doc.fontSize(10).fillColor('#555555').text('Other Details:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.direct_debit !== undefined && result.direct_debit !== null) doc.text(`  Direct Debit (Monthly Payment): ${formatCurrency(result.direct_debit)}`);
          if (result.rent !== undefined && result.rent !== null) doc.text(`  Rent: ${formatCurrency(result.rent)}`);
          if (result.top_slicing !== undefined && result.top_slicing !== null) doc.text(`  Top Slicing: ${formatCurrency(result.top_slicing)}`);
          if (result.nbp !== undefined && result.nbp !== null) doc.text(`  NBP (Net Proceeds to Borrower): ${formatCurrency(result.nbp)}`);
          if (result.total_amount_repayable !== undefined && result.total_amount_repayable !== null) doc.text(`  Total Amount Repayable: ${formatCurrency(result.total_amount_repayable)}`);
          if (result.total_interest !== undefined && result.total_interest !== null) doc.text(`  Total Interest: ${formatCurrency(result.total_interest)}`);
          if (result.total_cost_to_borrower !== undefined && result.total_cost_to_borrower !== null) doc.text(`  Total Cost to Borrower: ${formatCurrency(result.total_cost_to_borrower)}`);
          if (result.full_term !== undefined && result.full_term !== null) doc.text(`  Full Term: ${formatNumber(result.full_term, 0)} months`);
          if (result.product_name) doc.text(`  Product: ${result.product_name}`);
          
          doc.moveDown(1);
        });
        doc.moveDown(0.5);
      }
    }

    // Assumptions
    if (quote.quote_assumptions && Array.isArray(quote.quote_assumptions) && quote.quote_assumptions.length > 0) {
      doc.fontSize(16).text('Assumptions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      
      quote.quote_assumptions.forEach((assumption, index) => {
        // Wrap long text
        doc.text(`${index + 1}. ${assumption}`, {
          width: 500,
          align: 'left'
        });
        doc.moveDown(0.3);
      });
      
      doc.moveDown(1);
    }

    // Additional Notes
    if (quote.quote_additional_notes) {
      doc.fontSize(16).text('Additional Notes', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(quote.quote_additional_notes, {
        width: 500,
        align: 'left'
      });
      doc.moveDown(1.5);
    }

    // Footer
    doc.fontSize(9);
    doc.text(`Quote generated on: ${new Date().toLocaleDateString()}`, {
      align: 'center'
    });
    
    if (quote.quote_issued_at) {
      doc.text(`Quote issued on: ${new Date(quote.quote_issued_at).toLocaleDateString()}`, {
        align: 'center'
      });
    }

    // Finalize PDF
    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message ?? String(err) });
    }
  }
});

export default router;
