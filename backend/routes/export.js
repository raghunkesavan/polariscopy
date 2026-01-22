import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// --- Helpers ---------------------------------------------------------------
async function getFlattenedQuotes({ calculator_type, from, to, status, user_id }) {
  const rows = [];

  const shouldQueryBTL = !calculator_type || calculator_type.toLowerCase() === 'btl';
  const shouldQueryBridge = !calculator_type || calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge';

  // Helper to apply common filters to a Supabase query
  const applyFilters = (query) => {
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (status) query = query.eq('status', status);
    if (user_id) query = query.eq('user_id', user_id);
    return query;
  };

  if (shouldQueryBTL) {
    const { data: btlQuotes, error: btlError } = await applyFilters(
      supabase.from('quotes').select('*').order('created_at', { ascending: false })
    );
    if (btlError) throw btlError;

    for (const quote of btlQuotes || []) {
      const { data: results, error: resultsError } = await supabase
        .from('quote_results')
        .select('*')
        .eq('quote_id', quote.id);
      if (resultsError) throw resultsError;

      const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : null);
      const qIssued = !!quote.quote_issued_at || ['issued','quote_issued','quote issued'].includes(norm(quote.quote_status));
      const dIssued = !!quote.dip_issued_at || ['issued','dip_issued','dip issued'].includes(norm(quote.dip_status));
      const status_label = qIssued ? 'QUOTE ISSUED' : dIssued ? 'DIP ISSUED' : 'DRAFT';

      if (results && results.length > 0) {
        results.forEach((result, index) => {
          rows.push({
            reference_number: quote.reference_number,
            quote_name: quote.name,
            calculator_type: quote.calculator_type,
            stage: result.stage ?? null,
            // Status should reflect the row's stage: QUOTE rows -> QUOTE ISSUED, DIP rows -> DIP ISSUED
            status: (result.stage === 'DIP') ? (dIssued ? 'DIP ISSUED' : 'DRAFT') : (qIssued ? 'QUOTE ISSUED' : 'DRAFT'),
            dip_issued_at: (result.stage === 'DIP') ? (quote.dip_issued_at ?? null) : null,
            quote_issued_at: quote.quote_issued_at ?? null,
            loan_amount: quote.loan_amount,
            ltv: quote.ltv,
            applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
            borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
            company_name: extractFromPayload(quote.payload, 'company_name'),
            created_at: quote.created_at,
            updated_at: quote.updated_at,
            result_number: index + 1,
            total_results: results.length,
            fee_column: result.fee_column,
            product_name: result.product_name,
            gross_loan: result.gross_loan,
            net_loan: result.net_loan,
            ltv_percentage: result.ltv_percentage,
            net_ltv: result.net_ltv,
            property_value: result.property_value,
            icr: result.icr,
            initial_rate: result.initial_rate,
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
            full_term: result.full_term,
          });
        });
      } else {
        rows.push({
          reference_number: quote.reference_number,
          quote_name: quote.name,
          calculator_type: quote.calculator_type,
          stage: null,
          status: status_label,
          dip_issued_at: null,
          quote_issued_at: quote.quote_issued_at ?? null,
          loan_amount: quote.loan_amount,
          ltv: quote.ltv,
          applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
          borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
          company_name: extractFromPayload(quote.payload, 'company_name'),
          created_at: quote.created_at,
          updated_at: quote.updated_at,
          result_number: 0,
          total_results: 0,
        });
      }
    }
  }

  if (shouldQueryBridge) {
    const { data: bridgeQuotes, error: bridgeError } = await applyFilters(
      supabase.from('bridge_quotes').select('*').order('created_at', { ascending: false })
    );
    if (bridgeError) throw bridgeError;

    for (const quote of bridgeQuotes || []) {
      const { data: results, error: resultsError } = await supabase
        .from('bridge_quote_results')
        .select('*')
        .eq('quote_id', quote.id);
      if (resultsError) throw resultsError;

      const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : null);
      const qIssued = !!quote.quote_issued_at || ['issued','quote_issued','quote issued'].includes(norm(quote.quote_status));
      const dIssued = !!quote.dip_issued_at || ['issued','dip_issued','dip issued'].includes(norm(quote.dip_status));
      const status_label = qIssued ? 'QUOTE ISSUED' : dIssued ? 'DIP ISSUED' : 'DRAFT';

      if (results && results.length > 0) {
        results.forEach((result, index) => {
          rows.push({
            reference_number: quote.reference_number,
            quote_name: quote.name,
            calculator_type: quote.calculator_type,
            stage: result.stage ?? null,
            // Status should reflect the row's stage: QUOTE rows -> QUOTE ISSUED, DIP rows -> DIP ISSUED
            status: (result.stage === 'DIP') ? (dIssued ? 'DIP ISSUED' : 'DRAFT') : (qIssued ? 'QUOTE ISSUED' : 'DRAFT'),
            dip_issued_at: (result.stage === 'DIP') ? (quote.dip_issued_at ?? null) : null,
            quote_issued_at: quote.quote_issued_at ?? null,
            loan_amount: quote.loan_amount,
            ltv: quote.ltv,
            applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
            borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
            company_name: extractFromPayload(quote.payload, 'company_name'),
            created_at: quote.created_at,
            updated_at: quote.updated_at,
            result_number: index + 1,
            total_results: results.length,
            fee_column: result.fee_column,
            product_name: result.product_name,
            gross_loan: result.gross_loan,
            net_loan: result.net_loan,
            ltv_percentage: result.ltv_percentage,
            net_ltv: result.net_ltv,
            property_value: result.property_value,
            icr: result.icr,
            initial_rate: result.initial_rate,
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
            deferred_rate: result.deferred_rate,
            serviced_interest: result.serviced_interest,
            direct_debit: result.direct_debit,
            erc: result.erc,
            erc_fusion_only: result.erc_fusion_only,
            rent: result.rent,
            top_slicing: result.top_slicing,
            nbp: result.nbp,
            total_cost_to_borrower: result.total_cost_to_borrower,
            full_term: result.full_term,
          });
        });
      } else {
        rows.push({
          reference_number: quote.reference_number,
          quote_name: quote.name,
          calculator_type: quote.calculator_type,
          stage: null,
          status: status_label,
          dip_issued_at: null,
          quote_issued_at: quote.quote_issued_at ?? null,
          loan_amount: quote.loan_amount,
          ltv: quote.ltv,
          applicant_type: extractFromPayload(quote.payload, 'applicant_type'),
          borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
          company_name: extractFromPayload(quote.payload, 'company_name'),
          created_at: quote.created_at,
          updated_at: quote.updated_at,
          result_number: 0,
          total_results: 0,
        });
      }
    }
  }

  return rows;
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(rows, columns) {
  const cols = columns && columns.length ? columns : (rows.length ? Object.keys(rows[0]) : []);
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => escapeCsv(r[c])).join(',')).join('\r\n');
  return header + (rows.length ? '\r\n' + body : '');
}

// Export all quotes with their results
router.get('/quotes', async (req, res) => {
  try {
    const allData = await getFlattenedQuotes(req.query || {});
    return res.status(200).json({ data: allData });
  } catch (err) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// CSV export for quotes (stable column order for BI tools)
router.get('/quotes.csv', async (req, res) => {
  try {
    const rows = await getFlattenedQuotes(req.query || {});
    const columns = [
      'reference_number','quote_name','calculator_type','stage','status','dip_issued_at','quote_issued_at','loan_amount','ltv',
      'applicant_type','borrower_name','company_name','created_at','updated_at',
      'result_number','total_results','fee_column','product_name','gross_loan','net_loan',
      'ltv_percentage','net_ltv','property_value','icr','initial_rate','pay_rate','revert_rate',
      'revert_rate_dd','full_rate','aprc','product_fee_percent','product_fee_pounds','admin_fee',
      'broker_client_fee','broker_commission_proc_fee_percent','broker_commission_proc_fee_pounds',
      'commitment_fee_pounds','exit_fee','monthly_interest_cost','rolled_months','rolled_months_interest',
      'deferred_interest_percent','deferred_interest_pounds','deferred_rate','serviced_interest','direct_debit',
      'erc','erc_fusion_only','rent','top_slicing','nbp','total_cost_to_borrower','full_term'
    ];

    const csv = toCsv(rows, columns);
    const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="quotes_${stamp}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Helper function to extract values from JSONB payload
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

export default router;
