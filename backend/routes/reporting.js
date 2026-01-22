import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateApiKey, requireApiPermission } from '../middleware/apiKeyAuth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply API key authentication to all reporting routes
router.use(authenticateApiKey);
router.use(requireApiPermission('read:reports'));

/**
 * Power BI Optimized Endpoints
 * 
 * These endpoints are specifically designed for Power BI consumption:
 * - Paginated results for large datasets
 * - Consistent JSON structure
 * - Flattened data (no nested objects)
 * - Date filtering support
 * - Metadata included
 */

// --- Helper Functions -------------------------------------------------------

/**
 * Apply common filters to a Supabase query
 */
function applyFilters(query, filters) {
  const { from, to, status, calculator_type, user_id, reference_number } = filters;

  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  if (status) query = query.eq('status', status);
  if (calculator_type) query = query.eq('calculator_type', calculator_type);
  if (user_id) query = query.eq('user_id', user_id);
  if (reference_number) query = query.ilike('reference_number', `%${reference_number}%`);

  return query;
}

/**
 * Extract value from JSONB payload
 */
function extractFromPayload(payload, key) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return parsed[key] || null;
    } catch {
      return null;
    }
  }
  return payload[key] || null;
}

/**
 * Get flattened quotes with results for reporting
 */
async function getReportingData(filters = {}, pagination = {}) {
  const { page = 1, pageSize = 1000 } = pagination;
  const offset = (page - 1) * pageSize;
  
  const rows = [];
  let totalCount = 0;

  // Query BTL quotes
  let btlQuery = supabase
    .from('quotes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  btlQuery = applyFilters(btlQuery, { ...filters, calculator_type: filters.calculator_type === 'bridging' ? null : filters.calculator_type });

  const { data: btlQuotes, error: btlError, count: btlCount } = await btlQuery;
  
  if (btlError) throw btlError;

  totalCount += btlCount || 0;

  // Query Bridging quotes
  let bridgeQuery = supabase
    .from('bridge_quotes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  bridgeQuery = applyFilters(bridgeQuery, { ...filters, calculator_type: filters.calculator_type === 'btl' ? null : filters.calculator_type });

  const { data: bridgeQuotes, error: bridgeError, count: bridgeCount } = await bridgeQuery;
  
  if (bridgeError) throw bridgeError;

  totalCount += bridgeCount || 0;

  // Process BTL quotes
  for (const quote of btlQuotes || []) {
    const { data: results, error: resultsError } = await supabase
      .from('quote_results')
      .select('*')
      .eq('quote_id', quote.id);

    if (resultsError) throw resultsError;

    const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : null);
    const qIssued = !!quote.quote_issued_at || ['issued', 'quote_issued', 'quote issued'].includes(norm(quote.quote_status));
    const dIssued = !!quote.dip_issued_at || ['issued', 'dip_issued', 'dip issued'].includes(norm(quote.dip_status));

    if (results && results.length > 0) {
      results.forEach((result, index) => {
        const status = (result.stage === 'DIP') 
          ? (dIssued ? 'DIP ISSUED' : 'DRAFT') 
          : (qIssued ? 'QUOTE ISSUED' : 'DRAFT');

        rows.push({
          // Quote identifiers
          reference_number: quote.reference_number,
          quote_id: quote.id,
          quote_name: quote.name,
          calculator_type: quote.calculator_type,
          source_quote_table: 'quotes',
          source_results_table: 'quote_results',
          
          // Status tracking
          stage: result.stage ?? null,
          status: status,
          quote_issued_at: quote.quote_issued_at ?? null,
          dip_issued_at: quote.dip_issued_at ?? null,
          
          // Borrower information
          applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
          borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
          company_name: extractFromPayload(quote.payload, 'company_name'),
          
          // Result details
          result_number: index + 1,
          total_results: results.length,
          fee_column: result.fee_column ?? null,
          product_name: result.product_name ?? null,
          
          // Loan details
          gross_loan: result.gross_loan ?? null,
          net_loan: result.net_loan ?? null,
          loan_amount: quote.loan_amount,
          
          // LTV calculations
          ltv: quote.ltv,
          ltv_percentage: result.ltv_percentage ?? null,
          net_ltv: result.net_ltv ?? null,
          property_value: result.property_value ?? null,
          
          // Rates
          icr: result.icr ?? null,
          initial_rate: result.initial_rate ?? null,
          pay_rate: result.pay_rate ?? null,
          revert_rate: result.revert_rate ?? null,
          revert_rate_dd: result.revert_rate_dd ?? null,
          full_rate: result.full_rate ?? null,
          aprc: result.aprc ?? null,
          deferred_rate: result.deferred_rate ?? null,
          
          // Fees
          product_fee_percent: result.product_fee_percent ?? null,
          product_fee_pounds: result.product_fee_pounds ?? null,
          admin_fee: result.admin_fee ?? null,
          broker_client_fee: result.broker_client_fee ?? null,
          broker_commission_proc_fee_percent: result.broker_commission_proc_fee_percent ?? null,
          broker_commission_proc_fee_pounds: result.broker_commission_proc_fee_pounds ?? null,
          commitment_fee_pounds: result.commitment_fee_pounds ?? null,
          exit_fee: result.exit_fee ?? null,
          
          // Interest calculations
          monthly_interest_cost: result.monthly_interest_cost ?? null,
          rolled_months: result.rolled_months ?? null,
          rolled_months_interest: result.rolled_months_interest ?? null,
          deferred_interest_percent: result.deferred_interest_percent ?? null,
          deferred_interest_pounds: result.deferred_interest_pounds ?? null,
          serviced_interest: result.serviced_interest ?? null,
          direct_debit: result.direct_debit ?? null,
          
          // Additional fields
          erc: result.erc ?? null,
          erc_fusion_only: result.erc_fusion_only ?? null,
          rent: result.rent ?? null,
          top_slicing: result.top_slicing ?? null,
          nbp: result.nbp ?? null,
          total_cost_to_borrower: result.total_cost_to_borrower ?? null,
          full_term: result.full_term ?? null,
          
          // Timestamps
          created_at: quote.created_at,
          updated_at: quote.updated_at,
          
          // User tracking
          user_id: quote.user_id,
        });
      });
    } else {
      // Quote with no results
      const status = qIssued ? 'QUOTE ISSUED' : dIssued ? 'DIP ISSUED' : 'DRAFT';
      
      rows.push({
        reference_number: quote.reference_number,
        quote_id: quote.id,
        quote_name: quote.name,
        calculator_type: quote.calculator_type,
        source_quote_table: 'quotes',
        source_results_table: null,
        stage: null,
        status: status,
        quote_issued_at: quote.quote_issued_at ?? null,
        dip_issued_at: quote.dip_issued_at ?? null,
        loan_amount: quote.loan_amount,
        ltv: quote.ltv,
        applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
        borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
        company_name: extractFromPayload(quote.payload, 'company_name'),
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        result_number: 0,
        total_results: 0,
        user_id: quote.user_id,
      });
    }
  }

  // Process Bridging quotes
  for (const quote of bridgeQuotes || []) {
    const { data: results, error: resultsError } = await supabase
      .from('bridge_quote_results')
      .select('*')
      .eq('quote_id', quote.id);

    if (resultsError) throw resultsError;

    const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : null);
    const qIssued = !!quote.quote_issued_at || ['issued', 'quote_issued', 'quote issued'].includes(norm(quote.quote_status));
    const dIssued = !!quote.dip_issued_at || ['issued', 'dip_issued', 'dip issued'].includes(norm(quote.dip_status));

    if (results && results.length > 0) {
      results.forEach((result, index) => {
        const status = (result.stage === 'DIP') 
          ? (dIssued ? 'DIP ISSUED' : 'DRAFT') 
          : (qIssued ? 'QUOTE ISSUED' : 'DRAFT');

        rows.push({
          // Quote identifiers
          reference_number: quote.reference_number,
          quote_id: quote.id,
          quote_name: quote.name,
          calculator_type: 'bridging',
          source_quote_table: 'bridge_quotes',
          source_results_table: 'bridge_quote_results',
          
          // Status tracking
          stage: result.stage ?? null,
          status: status,
          quote_issued_at: quote.quote_issued_at ?? null,
          dip_issued_at: quote.dip_issued_at ?? null,
          
          // Borrower information
          applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
          borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
          company_name: extractFromPayload(quote.payload, 'company_name'),
          
          // Result details
          result_number: index + 1,
          total_results: results.length,
          fee_column: result.fee_column ?? null,
          product_name: result.product_name ?? null,
          
          // Loan details
          gross_loan: result.gross_loan ?? null,
          net_loan: result.net_loan ?? null,
          loan_amount: quote.gross_loan,
          
          // LTV calculations
          ltv: quote.ltv ?? null,
          ltv_percentage: result.ltv_percentage ?? null,
          net_ltv: result.net_ltv ?? null,
          property_value: result.property_value ?? null,
          
          // Rates
          icr: result.icr ?? null,
          initial_rate: result.initial_rate ?? null,
          pay_rate: result.pay_rate ?? null,
          revert_rate: result.revert_rate ?? null,
          revert_rate_dd: result.revert_rate_dd ?? null,
          full_rate: result.full_rate ?? null,
          aprc: result.aprc ?? null,
          deferred_rate: result.deferred_rate ?? null,
          
          // Fees
          product_fee_percent: result.product_fee_percent ?? null,
          product_fee_pounds: result.product_fee_pounds ?? null,
          admin_fee: result.admin_fee ?? null,
          broker_client_fee: result.broker_client_fee ?? null,
          broker_commission_proc_fee_percent: result.broker_commission_proc_fee_percent ?? null,
          broker_commission_proc_fee_pounds: result.broker_commission_proc_fee_pounds ?? null,
          commitment_fee_pounds: result.commitment_fee_pounds ?? null,
          exit_fee: result.exit_fee ?? null,
          
          // Interest calculations
          monthly_interest_cost: result.monthly_interest_cost ?? null,
          rolled_months: result.rolled_months ?? null,
          rolled_months_interest: result.rolled_months_interest ?? null,
          deferred_interest_percent: result.deferred_interest_percent ?? null,
          deferred_interest_pounds: result.deferred_interest_pounds ?? null,
          serviced_interest: result.serviced_interest ?? null,
          direct_debit: result.direct_debit ?? null,
          
          // Additional fields
          erc: result.erc ?? null,
          erc_fusion_only: result.erc_fusion_only ?? null,
          rent: result.rent ?? null,
          top_slicing: result.top_slicing ?? null,
          nbp: result.nbp ?? null,
          total_cost_to_borrower: result.total_cost_to_borrower ?? null,
          full_term: result.full_term ?? null,
          
          // Timestamps
          created_at: quote.created_at,
          updated_at: quote.updated_at,
          
          // User tracking
          user_id: quote.user_id,
        });
      });
    } else {
      // Bridging quote with no results
      const status = qIssued ? 'QUOTE ISSUED' : dIssued ? 'DIP ISSUED' : 'DRAFT';
      
      rows.push({
        reference_number: quote.reference_number,
        quote_id: quote.id,
        quote_name: quote.name,
        calculator_type: 'bridging',
        source_quote_table: 'bridge_quotes',
        source_results_table: null,
        stage: null,
        status: status,
        quote_issued_at: quote.quote_issued_at ?? null,
        dip_issued_at: quote.dip_issued_at ?? null,
        loan_amount: quote.gross_loan,
        ltv: quote.ltv ?? null,
        applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
        borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
        company_name: extractFromPayload(quote.payload, 'company_name'),
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        result_number: 0,
        total_results: 0,
        user_id: quote.user_id,
      });
    }
  }

  return { rows, totalCount };
}

// --- API Endpoints ----------------------------------------------------------

/**
 * GET /api/reporting/quotes
 * 
 * Returns paginated quotes data for Power BI
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - pageSize: Results per page (default: 1000, max: 5000)
 * - from: Start date (ISO 8601 format)
 * - to: End date (ISO 8601 format)
 * - status: Filter by status
 * - calculator_type: btl or bridging
 * - reference_number: Search by reference number (partial match)
 */
router.get('/quotes', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 1000, 5000);

    const filters = {
      from: req.query.from,
      to: req.query.to,
      status: req.query.status,
      calculator_type: req.query.calculator_type,
      user_id: req.query.user_id,
      reference_number: req.query.reference_number,
    };

    const { rows, totalCount } = await getReportingData(filters, { page, pageSize });

    const response = {
      metadata: {
        page,
        pageSize,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        filters: filters,
        timestamp: new Date().toISOString(),
        apiKeyName: req.apiKey.name,
      },
      data: rows,
    };

    logger.info('Reporting API - quotes retrieved', {
      apiKey: req.apiKey.name,
      records: rows.length,
      page,
    });

    res.json(response);
  } catch (error) {
    logger.error('Reporting API - quotes error', error);
    next(error);
  }
});

/**
 * GET /api/reporting/quotes/summary
 * 
 * Returns summary statistics for Power BI dashboards
 */
router.get('/quotes/summary', async (req, res, next) => {
  try {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      calculator_type: req.query.calculator_type,
    };

    // Get BTL quotes counts
    let btlQuery = supabase
      .from('quotes')
      .select('status, calculator_type', { count: 'exact' });
    
    btlQuery = applyFilters(btlQuery, { ...filters, calculator_type: filters.calculator_type === 'bridging' ? null : filters.calculator_type });
    const { data: btlQuotes, error: btlError } = await btlQuery;

    if (btlError) throw btlError;

    // Get Bridging quotes counts
    let bridgeQuery = supabase
      .from('bridge_quotes')
      .select('status', { count: 'exact' });
    
    bridgeQuery = applyFilters(bridgeQuery, { ...filters, calculator_type: filters.calculator_type === 'btl' ? null : filters.calculator_type });
    const { data: bridgeQuotes, error: bridgeError } = await bridgeQuery;

    if (bridgeError) throw bridgeError;

    // Combine and aggregate statistics
    const allQuotes = [
      ...(btlQuotes || []).map(q => ({ ...q, calculator_type: q.calculator_type || 'btl' })),
      ...(bridgeQuotes || []).map(q => ({ ...q, calculator_type: 'bridging' }))
    ];

    const summary = {
      total_quotes: allQuotes.length,
      by_calculator_type: {},
      by_status: {},
      date_range: {
        from: filters.from || null,
        to: filters.to || null,
      },
      generated_at: new Date().toISOString(),
    };

    allQuotes.forEach(quote => {
      // Count by calculator type
      const calcType = quote.calculator_type || 'unknown';
      summary.by_calculator_type[calcType] = (summary.by_calculator_type[calcType] || 0) + 1;

      // Count by status
      const status = quote.status || 'draft';
      summary.by_status[status] = (summary.by_status[status] || 0) + 1;
    });

    logger.info('Reporting API - summary retrieved', {
      apiKey: req.apiKey.name,
    });

    res.json(summary);
  } catch (error) {
    logger.error('Reporting API - summary error', error);
    next(error);
  }
});

/**
 * GET /api/reporting/health
 * 
 * Health check endpoint for monitoring
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiKey: req.apiKey.name,
  });
});

export default router;
