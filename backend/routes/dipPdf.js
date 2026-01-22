import express from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// ============================================================================
// HELPER FUNCTIONS - Match Excel DIP Sheet Conditional Logic
// ============================================================================

/**
 * Format currency with £ symbol and commas
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '£0.00';
  return `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format percentage
 */
const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0.00%';
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format date in long format: "Friday, 28 November 2025"
 */
const formatDateLong = (dateString) => {
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

/**
 * Check if product is tracker-based
 */
const isTrackerProduct = (quote) => {
  const productType = (quote.product_type || '').toLowerCase();
  const rateType = (quote.rate_type || '').toLowerCase();
  return productType.includes('tracker') || rateType.includes('tracker');
};

/**
 * Check if revert rate is MVR-based (vs BBR-based)
 */
const isMVRRevert = (quote) => {
  const revertText = (quote.revert_rate_text || quote.revert_index || '').toLowerCase();
  return revertText.includes('mvr') || revertText.includes('variable');
};

/**
 * Get initial term in years (from months)
 */
const getInitialTermYears = (quote) => {
  const months = Number(quote.initial_term) || Number(quote.term_months) || 24;
  return months / 12;
};

/**
 * Get full term in years
 */
const getFullTermYears = (quote) => {
  const term = Number(quote.full_term) || 120;
  // If stored as months, convert to years
  return term > 50 ? term / 12 : term;
};

/**
 * Get property type for conditional declarations
 */
const getPropertyType = (quote) => {
  if (quote.commercial_or_main_residence) {
    if (quote.commercial_or_main_residence === 'Commercial') return 'Commercial';
    if (quote.commercial_or_main_residence === 'Main Residence') return 'Residential BTL';
  }
  const propType = (quote.property_type || '').toLowerCase();
  if (propType.includes('commercial') && propType.includes('semi')) return 'Semi-Commercial';
  if (propType.includes('commercial')) return 'Commercial';
  return 'Residential BTL';
};

/**
 * Get ERC text from rate data
 */
const getERCText = (result) => {
  const erc1 = result?.erc_1_percent || result?.erc_1;
  const erc2 = result?.erc_2_percent || result?.erc_2;
  const parts = [];
  if (erc1) parts.push(`${erc1}% of loan balance in yr1`);
  if (erc2) parts.push(`${erc2}% of loan balance in yr2`);
  if (parts.length === 0) return 'No early repayment charge applies.';
  return parts.join(', ') + '. No charge thereafter.';
};

// ============================================================================
// MAIN PDF GENERATION ROUTE
// ============================================================================

// Generate PDF for a quote with DIP data
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch the quote from either table
    let quote = null;
    let { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      quote = data;
    } else {
      // Try bridge_quotes
      const { data: bdata, error: berr } = await supabase.from('bridge_quotes').select('*').eq('id', id).single();
      if (berr) {
        if (berr.code === 'PGRST116') return res.status(404).json({ error: 'Quote not found' });
        throw berr;
      }
      quote = bdata;
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Determine which results table to use
    const isBridge = quote.calculator_type === 'BRIDGING';
    const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';

    // Fetch results for this quote
    const { data: resultsData, error: resultsError } = await supabase
      .from(resultsTable)
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true });
    
    if (resultsError) {
      console.error('Error fetching results:', resultsError);
    }
    
    const results = resultsData || [];
    
    // Get the selected/displayed result
    let displayResult = results[0] || {};
    if (quote.fee_type_selection && results.length > 0) {
      if (isBridge) {
        displayResult = results.find(r => 
          (r.product_name || '').toLowerCase().includes(quote.fee_type_selection.toLowerCase())
        ) || results[0];
      } else {
        displayResult = results.find(r => 
          quote.fee_type_selection.includes(r.fee_column)
        ) || results[0];
      }
    }

    // Create PDF document - smaller margins for more content
    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 40, bottom: 40, left: 50, right: 50 }
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=DIP_${quote.reference_number || id}.pdf`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // ========================================================================
    // BTL DIP PDF GENERATION - Matches Excel DIP Sheet Format
    // ========================================================================
    
    if (quote.calculator_type === 'BTL' || quote.calculator_type?.toLowerCase() === 'btl') {
      generateBTLDIPPDF(doc, quote, displayResult);
    } else {
      // Original format for Bridging (can be updated later)
      generateBridgingDIPPDF(doc, quote, displayResult, results, isBridge);
    }

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('DIP PDF generation error:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// ============================================================================
// BTL DIP PDF GENERATOR - Matches Excel Format with Conditional Logic
// ============================================================================

function generateBTLDIPPDF(doc, quote, result) {
  const propertyType = getPropertyType(quote);
  const isTracker = isTrackerProduct(quote);
  const isMVR = isMVRRevert(quote);
  const initialTermYears = getInitialTermYears(quote);
  const fullTermYears = getFullTermYears(quote);
  const numApplicants = Number(quote.number_of_applicants) || 1;
  const rolledMonths = Number(result?.rolled_months) || 0;
  const deferredInterest = Number(result?.deferred_interest_pounds) || 0;
  
  // Get property address
  const property = quote.security_properties?.[0] || {};
  const propertyAddress = [property.street, property.city, property.postcode].filter(Boolean).join(', ') || 'Property address to be confirmed';
  
  // ========== PAGE 1: HEADER & KEY LOAN DETAILS ==========
  
  // Company Header
  doc.fontSize(18).font('Helvetica-Bold').text('MFS', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Market Financial Solutions', { align: 'center' });
  doc.moveDown(0.5);
  
  // Title
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a5276').text('DECISION IN PRINCIPLE', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#666666').text('This is not a binding offer of finance', { align: 'center' });
  doc.fillColor('black');
  doc.moveDown(1);
  
  // Reference Box
  doc.rect(50, doc.y, 495, 25).fill('#f0f0f0');
  doc.fillColor('black').fontSize(10).font('Helvetica-Bold');
  doc.text(`Reference: ${quote.reference_number || 'TBC'}`, 60, doc.y - 18);
  doc.text(`Date: ${formatDateLong(quote.dip_date || new Date())}`, 300, doc.y - 12, { align: 'right' });
  doc.moveDown(1.5);
  
  // Borrower Details Section
  drawSectionHeader(doc, 'BORROWER DETAILS');
  
  const borrowerName = quote.applicant_type === 'Company' 
    ? quote.company_name || 'N/A'
    : quote.borrower_name || quote.name || 'N/A';
  
  drawLabelValue(doc, 'Borrower:', borrowerName);
  drawLabelValue(doc, 'Borrower Type:', quote.applicant_type || 'Individual');
  if (quote.guarantor_name) {
    drawLabelValue(doc, 'Guarantor:', quote.guarantor_name);
  }
  doc.moveDown(0.5);
  
  // Property Details Section
  drawSectionHeader(doc, 'SECURITY PROPERTY');
  drawLabelValue(doc, 'Property Address:', propertyAddress);
  drawLabelValue(doc, 'Property Type:', propertyType);
  drawLabelValue(doc, 'Property Value:', formatCurrency(quote.property_value));
  if (quote.monthly_rent) {
    drawLabelValue(doc, 'Monthly Rental Income:', formatCurrency(quote.monthly_rent));
  }
  doc.moveDown(0.5);
  
  // Loan Details Section - KEY FINANCIAL SUMMARY
  drawSectionHeader(doc, 'LOAN DETAILS');
  
  // Create two-column layout for loan details
  const col1X = 55;
  const col2X = 300;
  const startY = doc.y;
  
  doc.fontSize(9);
  
  // Column 1
  doc.font('Helvetica-Bold').text('Gross Loan Amount:', col1X, startY);
  doc.font('Helvetica').text(formatCurrency(result?.gross_loan || quote.gross_loan), col1X + 120, startY);
  
  doc.font('Helvetica-Bold').text('Net Loan Amount:', col1X, startY + 15);
  doc.font('Helvetica').text(formatCurrency(result?.net_loan), col1X + 120, startY + 15);
  
  doc.font('Helvetica-Bold').text('Loan to Value (LTV):', col1X, startY + 30);
  doc.font('Helvetica').text(formatPercent(result?.ltv_percentage || quote.target_ltv), col1X + 120, startY + 30);
  
  // Column 2
  doc.font('Helvetica-Bold').text('Initial Interest Rate:', col2X, startY);
  doc.font('Helvetica').text(formatPercent(result?.initial_rate || result?.pay_rate), col2X + 120, startY);
  
  doc.font('Helvetica-Bold').text('Product Fee:', col2X, startY + 15);
  const productFee = result?.product_fee_pounds 
    ? formatCurrency(result.product_fee_pounds)
    : result?.product_fee_percent 
      ? `${formatPercent(result.product_fee_percent)} of loan`
      : 'N/A';
  doc.font('Helvetica').text(productFee, col2X + 120, startY + 15);
  
  doc.font('Helvetica-Bold').text('Monthly Payment:', col2X, startY + 30);
  doc.font('Helvetica').text(formatCurrency(result?.monthly_interest_cost), col2X + 120, startY + 30);
  
  doc.y = startY + 55;
  doc.moveDown(0.5);
  
  // ========== CONDITIONAL: Full Term Text ==========
  drawSectionHeader(doc, 'TERM OF LOAN');
  
  // Initial period text - CONDITIONAL on Fixed vs Tracker
  const initialPeriodLabel = isTracker ? 'Initial Tracker Rate Period:' : 'Initial Fixed Rate Period:';
  drawLabelValue(doc, initialPeriodLabel, `${initialTermYears} year${initialTermYears !== 1 ? 's' : ''}`);
  
  // Full term
  drawLabelValue(doc, 'Full Term:', `${fullTermYears} years`);
  
  // Revert rate text - CONDITIONAL on MVR vs BBR
  let revertText = '';
  if (isMVR) {
    revertText = `After the initial period, the rate will revert to our MFS Variable Rate (MVR), currently ${formatPercent(result?.revert_rate || 7.99)}`;
  } else {
    const margin = Number(result?.revert_rate) - 5.25 || 2.74; // Approximate margin over BBR
    revertText = `After the initial period, the rate will be BBR plus a margin of ${formatPercent(margin)}`;
  }
  doc.fontSize(8).font('Helvetica').text(revertText, { width: 490 });
  doc.moveDown(1);
  
  // ========== CONDITIONAL: Rolled Months Section ==========
  if (rolledMonths > 0) {
    drawSectionHeader(doc, 'ROLLED UP INTEREST');
    drawLabelValue(doc, 'Rolled Months:', `${rolledMonths} month${rolledMonths !== 1 ? 's' : ''}`);
    drawLabelValue(doc, 'Rolled Interest Amount:', formatCurrency(result?.rolled_months_interest));
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Interest for the above period will be added to the loan at completion.', { width: 490 });
    doc.fillColor('black');
    doc.moveDown(0.5);
  }
  
  // ========== CONDITIONAL: Deferred Interest Section ==========
  if (deferredInterest > 0) {
    drawSectionHeader(doc, 'DEFERRED INTEREST');
    drawLabelValue(doc, 'Deferred Interest:', formatCurrency(deferredInterest));
    if (result?.deferred_rate) {
      drawLabelValue(doc, 'Deferred Rate:', formatPercent(result.deferred_rate));
    }
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('The deferred interest amount will be added to your loan balance and charged at the deferred rate.', { width: 490 });
    doc.fillColor('black');
    doc.moveDown(0.5);
  }
  
  // ========== EARLY REPAYMENT CHARGES ==========
  drawSectionHeader(doc, 'EARLY REPAYMENT CHARGES');
  doc.fontSize(9).font('Helvetica');
  doc.text(getERCText(result), { width: 490 });
  doc.moveDown(0.5);
  
  // Overpayments
  const overpaymentPercent = quote.overpayments_percent || 10;
  doc.fontSize(9).font('Helvetica');
  doc.text(`You may make overpayments of up to ${overpaymentPercent}% of the outstanding loan balance per annum without penalty during the initial rate period.`, { width: 490 });
  doc.moveDown(1);
  
  // ========== PAGE 2: TARIFF OF CHARGES ==========
  doc.addPage();
  
  drawSectionHeader(doc, 'TARIFF OF CHARGES');
  
  // Create fees table
  const fees = [
    { label: 'Product/Arrangement Fee', value: result?.product_fee_pounds || result?.product_fee_percent ? `${formatPercent(result?.product_fee_percent)} (${formatCurrency(result?.product_fee_pounds)})` : 'N/A' },
    { label: 'Admin Fee', value: formatCurrency(result?.admin_fee || 0) },
    { label: 'Valuation Fee', value: 'Payable directly to valuer' },
    { label: 'Legal Fees (Lender)', value: formatCurrency(quote.lender_legal_fee) },
    { label: 'Exit Fee', value: formatCurrency(result?.exit_fee || 0) },
  ];
  
  if (result?.title_insurance_cost) {
    fees.push({ label: 'Title Insurance', value: formatCurrency(result.title_insurance_cost) });
  }
  
  if (result?.broker_client_fee) {
    fees.push({ label: 'Broker Fee', value: formatCurrency(result.broker_client_fee) });
  }
  
  drawFeesTable(doc, fees);
  doc.moveDown(1);
  
  // ========== IMPORTANT INFORMATION ==========
  drawSectionHeader(doc, 'IMPORTANT INFORMATION');
  
  const importantPoints = [
    'This Decision in Principle is subject to satisfactory valuation, legal checks, and full underwriting.',
    'The actual rate offered may differ from this indication based on final assessment.',
    'This DIP is valid for 90 days from the date shown above.',
    'A full mortgage offer will be issued subject to satisfactory completion of all checks.',
    `Interest will be charged ${quote.retention_choice === 'Yes' ? 'with retention facility' : 'on a serviced basis, payable monthly'}.`,
  ];
  
  doc.fontSize(9).font('Helvetica');
  importantPoints.forEach((point, idx) => {
    doc.text(`${idx + 1}. ${point}`, { width: 490 });
    doc.moveDown(0.3);
  });
  doc.moveDown(0.5);
  
  // ========== CONDITIONAL: PROPERTY TYPE DECLARATION ==========
  drawSectionHeader(doc, 'BORROWER DECLARATION');
  
  // Property use declaration - CONDITIONAL based on property type
  let propertyDeclaration = '';
  if (propertyType === 'Commercial') {
    propertyDeclaration = 'I/We confirm that less than 40% of the property will be used as a dwelling by myself or my family members.';
  } else if (propertyType === 'Semi-Commercial') {
    propertyDeclaration = 'I/We confirm that the property is semi-commercial in nature, with a residential element that will not be occupied by myself or my family members.';
  } else {
    // Residential BTL
    propertyDeclaration = 'I/We confirm that the property has never been, and will not be, used as a dwelling by myself or my family members. The property is held for investment purposes and will be let to third party tenants.';
  }
  
  doc.fontSize(9).font('Helvetica');
  doc.text(propertyDeclaration, { width: 490 });
  doc.moveDown(0.5);
  
  // Additional declarations
  const declarations = [
    'I/We confirm that all information provided in support of this application is true and accurate.',
    'I/We understand that providing false or misleading information may result in the withdrawal of any offer.',
    'I/We consent to the lender carrying out credit and identity checks as required.',
    'I/We have been advised to seek independent legal advice regarding this transaction.',
  ];
  
  declarations.forEach((decl, idx) => {
    doc.text(`${idx + 1}. ${decl}`, { width: 490 });
    doc.moveDown(0.3);
  });
  doc.moveDown(1);
  
  // ========== CONDITIONAL: SIGNATURE BLOCKS (1-4 Applicants) ==========
  drawSectionHeader(doc, 'SIGNATURES');
  
  for (let i = 1; i <= numApplicants; i++) {
    if (doc.y > 700) doc.addPage();
    drawSignatureBlock(doc, `Applicant ${i}`, i === 1 ? borrowerName : `Applicant ${i}`);
    doc.moveDown(0.5);
  }
  
  // ========== FOOTER ==========
  doc.moveDown(1);
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text('Market Financial Solutions is authorised and regulated by the Financial Conduct Authority.', { align: 'center' });
  doc.text('This document is for information purposes only and does not constitute a binding offer of finance.', { align: 'center' });
  doc.fillColor('black');
}

// ============================================================================
// BRIDGING DIP PDF GENERATOR - Matches BTL Format
// ============================================================================

function generateBridgingDIPPDF(doc, quote, displayResult, results, isBridge) {
  const propertyType = quote.product_scope || quote.property_type || 'Residential';
  const numApplicants = Number(quote.number_of_applicants) || 1;
  const bridgingTerm = Number(quote.bridging_loan_term) || 12;
  const rolledMonths = Number(displayResult?.rolled_months) || 0;

  // Get product type from displayResult
  const productName = displayResult?.product_name || quote.fee_type_selection || 'N/A';
  const isFusion = productName.toLowerCase().includes('fusion');

  // Get property address
  const property = quote.security_properties?.[0] || {};
  const propertyAddress = [property.street, property.city, property.postcode].filter(Boolean).join(', ') || 'Property address to be confirmed';

  // ========== PAGE 1: HEADER & KEY LOAN DETAILS ==========

  // Company Header
  doc.fontSize(18).font('Helvetica-Bold').text('MFS', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Market Financial Solutions', { align: 'center' });
  doc.moveDown(0.5);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a5276').text('DECISION IN PRINCIPLE', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#666666').text('This is not a binding offer of finance', { align: 'center' });
  doc.fillColor('black');
  doc.moveDown(1);

  // Reference Box
  doc.rect(50, doc.y, 495, 25).fill('#f0f0f0');
  doc.fillColor('black').fontSize(10).font('Helvetica-Bold');
  doc.text(`Reference: ${quote.reference_number || 'TBC'}`, 60, doc.y - 18);
  doc.text(`Date: ${formatDateLong(quote.dip_date || new Date())}`, 300, doc.y - 12, { align: 'right' });
  doc.moveDown(1.5);

  // Borrower Details Section
  drawSectionHeader(doc, 'BORROWER DETAILS');

  const borrowerName = quote.applicant_type === 'Company'
    ? quote.company_name || 'N/A'
    : quote.borrower_name || quote.name || 'N/A';

  drawLabelValue(doc, 'Borrower:', borrowerName);
  drawLabelValue(doc, 'Borrower Type:', quote.applicant_type || 'Individual');
  if (quote.guarantor_name) {
    drawLabelValue(doc, 'Guarantor:', quote.guarantor_name);
  }
  doc.moveDown(0.5);

  // Property Details Section
  drawSectionHeader(doc, 'SECURITY PROPERTY');
  drawLabelValue(doc, 'Property Address:', propertyAddress);
  drawLabelValue(doc, 'Property Type:', propertyType);
  drawLabelValue(doc, 'Property Value:', formatCurrency(quote.property_value));
  doc.moveDown(0.5);

  // Loan Details Section - KEY FINANCIAL SUMMARY
  drawSectionHeader(doc, 'LOAN DETAILS');

  // Create two-column layout for loan details
  const col1X = 55;
  const col2X = 300;
  const startY = doc.y;

  doc.fontSize(9);

  // Column 1
  doc.font('Helvetica-Bold').text('Gross Loan Amount:', col1X, startY);
  doc.font('Helvetica').text(formatCurrency(displayResult?.gross_loan || quote.gross_loan), col1X + 120, startY);

  doc.font('Helvetica-Bold').text('Net Loan Amount:', col1X, startY + 15);
  doc.font('Helvetica').text(formatCurrency(displayResult?.net_loan), col1X + 120, startY + 15);

  doc.font('Helvetica-Bold').text('Loan to Value (LTV):', col1X, startY + 30);
  doc.font('Helvetica').text(formatPercent(displayResult?.ltv_percentage || quote.ltv), col1X + 120, startY + 30);

  // Column 2
  doc.font('Helvetica-Bold').text('Interest Rate:', col2X, startY);
  doc.font('Helvetica').text(formatPercent(displayResult?.initial_rate || displayResult?.pay_rate), col2X + 120, startY);

  doc.font('Helvetica-Bold').text('Product Fee:', col2X, startY + 15);
  const productFee = displayResult?.product_fee_pounds
    ? formatCurrency(displayResult.product_fee_pounds)
    : displayResult?.product_fee_percent
      ? `${formatPercent(displayResult.product_fee_percent)} of loan`
      : 'N/A';
  doc.font('Helvetica').text(productFee, col2X + 120, startY + 15);

  doc.font('Helvetica-Bold').text('Monthly Interest:', col2X, startY + 30);
  doc.font('Helvetica').text(formatCurrency(displayResult?.monthly_interest_cost), col2X + 120, startY + 30);

  doc.y = startY + 55;
  doc.moveDown(0.5);

  // ========== PRODUCT & TERM DETAILS ==========
  drawSectionHeader(doc, 'PRODUCT & TERM');

  drawLabelValue(doc, 'Product Type:', productName);
  drawLabelValue(doc, 'Bridging Term:', `${bridgingTerm} month${bridgingTerm !== 1 ? 's' : ''}`);
  drawLabelValue(doc, 'Charge Type:', quote.charge_type || 'First Charge');

  if (isFusion) {
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Fusion product: Interest calculated at initial rate with flexible exit strategy.', { width: 490 });
    doc.fillColor('black');
  }

  doc.moveDown(0.5);

  // ========== CONDITIONAL: Rolled Months Section ==========
  if (rolledMonths > 0) {
    drawSectionHeader(doc, 'ROLLED UP INTEREST');
    drawLabelValue(doc, 'Rolled Months:', `${rolledMonths} month${rolledMonths !== 1 ? 's' : ''}`);
    drawLabelValue(doc, 'Rolled Interest Amount:', formatCurrency(displayResult?.rolled_months_interest));
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Interest for the above period will be added to the loan at completion.', { width: 490 });
    doc.fillColor('black');
    doc.moveDown(0.5);
  }

  // ========== INTEREST SERVICING ==========
  drawSectionHeader(doc, 'INTEREST SERVICING');

  const retentionText = quote.retention_choice === 'Yes'
    ? 'Interest will be serviced from a retention facility held by the lender.'
    : 'Interest is payable monthly by the borrower.';

  doc.fontSize(9).font('Helvetica');
  doc.text(retentionText, { width: 490 });

  if (quote.retention_choice === 'Yes' && displayResult?.retention_amount) {
    drawLabelValue(doc, 'Retention Amount:', formatCurrency(displayResult.retention_amount));
  }

  doc.moveDown(0.5);

  // ========== EARLY REPAYMENT & EXIT ==========
  drawSectionHeader(doc, 'EARLY REPAYMENT');

  doc.fontSize(9).font('Helvetica');

  if (isFusion) {
    doc.text('No early repayment charges apply. You may exit the loan at any time during the term without penalty.', { width: 490 });
  } else {
    // Fixed/Variable Bridge may have minimum term
    const minTerm = quote.minimum_term || 3;
    doc.text(`Minimum term: ${minTerm} months. Early exit within minimum term may incur interest charges for the minimum period.`, { width: 490 });
  }

  doc.moveDown(1);

  // ========== PAGE 2: TARIFF OF CHARGES ==========
  doc.addPage();

  drawSectionHeader(doc, 'TARIFF OF CHARGES');

  // Create fees table
  const fees = [
    {
      label: 'Product/Arrangement Fee',
      value: displayResult?.product_fee_pounds
        ? (displayResult?.product_fee_percent
          ? `${formatPercent(displayResult?.product_fee_percent)} (${formatCurrency(displayResult?.product_fee_pounds)})`
          : formatCurrency(displayResult?.product_fee_pounds))
        : 'N/A'
    },
    { label: 'Admin Fee', value: formatCurrency(displayResult?.admin_fee || 0) },
    { label: 'Valuation Fee', value: 'Payable directly to valuer' },
    { label: 'Legal Fees (Lender)', value: formatCurrency(quote.lender_legal_fee) },
    { label: 'Exit Fee', value: formatCurrency(displayResult?.exit_fee || 0) },
  ];

  if (displayResult?.title_insurance_cost || quote.title_insurance === 'Yes') {
    fees.push({ label: 'Title Insurance', value: formatCurrency(displayResult?.title_insurance_cost || 0) });
  }

  if (displayResult?.broker_client_fee) {
    fees.push({ label: 'Broker Fee', value: formatCurrency(displayResult.broker_client_fee) });
  }

  drawFeesTable(doc, fees);
  doc.moveDown(1);

  // ========== IMPORTANT INFORMATION ==========
  drawSectionHeader(doc, 'IMPORTANT INFORMATION');

  const importantPoints = [
    'This Decision in Principle is subject to satisfactory valuation, legal checks, and full underwriting.',
    'The actual rate offered may differ from this indication based on final assessment.',
    'This DIP is valid for 90 days from the date shown above.',
    'A full loan offer will be issued subject to satisfactory completion of all checks.',
    'Bridging finance is a short-term facility and must be repaid within the agreed term.',
    'You must have a clear exit strategy in place before drawdown.',
  ];

  doc.fontSize(9).font('Helvetica');
  importantPoints.forEach((point, idx) => {
    doc.text(`${idx + 1}. ${point}`, { width: 490 });
    doc.moveDown(0.3);
  });
  doc.moveDown(0.5);

  // ========== EXIT STRATEGY ==========
  drawSectionHeader(doc, 'EXIT STRATEGY');

  doc.fontSize(9).font('Helvetica');
  doc.text('Borrower must confirm their intended exit strategy:', { width: 490 });
  doc.moveDown(0.3);

  const exitStrategies = [
    '☐ Sale of security property',
    '☐ Refinance to term mortgage',
    '☐ Sale of other assets',
    '☐ Other (please specify): _______________________',
  ];

  exitStrategies.forEach(strategy => {
    doc.text(strategy, { width: 490 });
    doc.moveDown(0.2);
  });

  doc.moveDown(0.5);

  // ========== CONDITIONAL: PROPERTY TYPE DECLARATION ==========
  drawSectionHeader(doc, 'BORROWER DECLARATION');

  // Property use declaration - CONDITIONAL based on property type
  let propertyDeclaration = '';
  if (propertyType.toLowerCase().includes('commercial')) {
    propertyDeclaration = 'I/We confirm that the property is commercial in nature and will not be used as a dwelling.';
  } else if (propertyType.toLowerCase().includes('semi')) {
    propertyDeclaration = 'I/We confirm that the property is semi-commercial in nature.';
  } else {
    // Residential
    propertyDeclaration = 'I/We confirm that the security property will not be used as my/our main residence during the term of this loan.';
  }

  doc.fontSize(9).font('Helvetica');
  doc.text(propertyDeclaration, { width: 490 });
  doc.moveDown(0.5);

  // Additional declarations
  const declarations = [
    'I/We confirm that all information provided in support of this application is true and accurate.',
    'I/We understand that providing false or misleading information may result in the withdrawal of any offer.',
    'I/We consent to the lender carrying out credit and identity checks as required.',
    'I/We have been advised to seek independent legal and financial advice regarding this transaction.',
    'I/We understand this is a short-term bridging facility and have a clear exit strategy in place.',
  ];

  declarations.forEach((decl, idx) => {
    doc.text(`${idx + 1}. ${decl}`, { width: 490 });
    doc.moveDown(0.3);
  });
  doc.moveDown(1);

  // ========== CONDITIONAL: SIGNATURE BLOCKS (1-4 Applicants) ==========
  drawSectionHeader(doc, 'SIGNATURES');

  for (let i = 1; i <= numApplicants; i++) {
    if (doc.y > 700) doc.addPage();
    drawSignatureBlock(doc, `Applicant ${i}`, i === 1 ? borrowerName : `Applicant ${i}`);
    doc.moveDown(0.5);
  }

  // ========== FOOTER ==========
  doc.moveDown(1);
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text('Market Financial Solutions is authorised and regulated by the Financial Conduct Authority.', { align: 'center' });
  doc.text('This document is for information purposes only and does not constitute a binding offer of finance.', { align: 'center' });
  doc.fillColor('black');
}

// ============================================================================
// PDF DRAWING HELPER FUNCTIONS
// ============================================================================

/**
 * Draw a section header with blue background
 */
function drawSectionHeader(doc, title) {
  doc.rect(50, doc.y, 495, 18).fill('#1a5276');
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  doc.text(title, 55, doc.y - 14);
  doc.fillColor('black').font('Helvetica');
  doc.moveDown(0.8);
}

/**
 * Draw a label-value pair
 */
function drawLabelValue(doc, label, value, options = {}) {
  const labelWidth = options.labelWidth || 150;
  doc.fontSize(9);
  doc.font('Helvetica-Bold').text(label, { continued: true, width: labelWidth });
  doc.font('Helvetica').text(`  ${value || 'N/A'}`);
  doc.moveDown(0.2);
}

/**
 * Draw a fees table
 */
function drawFeesTable(doc, fees) {
  const startX = 55;
  const colWidth = 240;
  let y = doc.y;
  
  // Table header
  doc.rect(startX, y, 485, 18).fill('#e8e8e8');
  doc.fillColor('black').fontSize(9).font('Helvetica-Bold');
  doc.text('Fee Description', startX + 5, y + 4);
  doc.text('Amount', startX + colWidth + 10, y + 4);
  y += 20;
  
  // Table rows
  doc.font('Helvetica').fontSize(9);
  fees.forEach((fee, idx) => {
    if (idx % 2 === 0) {
      doc.rect(startX, y, 485, 16).fill('#f9f9f9');
    }
    doc.fillColor('black');
    doc.text(fee.label, startX + 5, y + 3, { width: colWidth - 10 });
    doc.text(fee.value, startX + colWidth + 10, y + 3, { width: colWidth - 10 });
    y += 16;
  });
  
  doc.y = y + 5;
}

/**
 * Draw a signature block
 */
function drawSignatureBlock(doc, title, name) {
  doc.fontSize(9).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9).text(`Name: ${name}`);
  doc.moveDown(0.3);
  
  // Signature line
  doc.text('Signature: ', { continued: true });
  doc.moveTo(doc.x, doc.y + 10).lineTo(doc.x + 200, doc.y + 10).stroke();
  doc.moveDown(0.8);
  
  // Date line
  doc.text('Date: ', { continued: true });
  doc.moveTo(doc.x, doc.y + 10).lineTo(doc.x + 150, doc.y + 10).stroke();
  doc.moveDown(0.5);
}

export default router;
