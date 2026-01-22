import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

const CSV_PATH = path.resolve(new URL(import.meta.url).pathname, '../../data/rates.csv');

function parseCsv(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  let header = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue; // comment

    // detect header (first non-comment non-empty line)
    if (!header) {
      header = line.split(',').map(h => h.trim());
      // normalize header to lower-case for lookups
      header = header.map(h => h.toLowerCase());
      continue;
    }

    const parts = line.split(',');

    // If parts don't match header length, try to be defensive by padding or merging middle fields
    if (parts.length < header.length) {
      console.warn('Skipping malformed line (too few columns):', line);
      continue;
    }

    // map values by header name
    const values = {};
    for (let i = 0; i < header.length; i++) {
      values[header[i]] = (parts[i] || '').trim();
    }

    // Map CSV columns to DB columns (robust names)
    const get = (names) => {
      for (const n of names) {
        if (values[n] !== undefined) return values[n];
      }
      return '';
    };

    const set_key = get(['set_key', 'setkey']);
    const property = get(['property', 'scope']);
    const rate_type = get(['rate_type', 'rate-type', 'ratetype']);
    const is_retention = (get(['is_retention', 'is_retained']) || '').toUpperCase() === 'TRUE';
    const tier = get(['tier']);
    const product = get(['product']);
    const product_fee_raw = get(['product_fee', 'product-fee', 'productfee']);
    const product_fee = product_fee_raw === '' ? null : Number(product_fee_raw);

    const termRaw = get(['term', 'term_months', 'term-months']);
    const term = termRaw === '' ? null : Number(termRaw);

  const initialTermRaw = get(['initial_term', 'initial-term', 'initial_term_months', 'initial-term-months']);
  const initial_term = initialTermRaw === '' ? null : Number(initialTermRaw);

  const fullTermRaw = get(['full_term', 'full-term', 'full_term_months', 'full-term-months']);
  const full_term = fullTermRaw === '' ? null : Number(fullTermRaw);

    // term_months: try explicit column or infer from product name
    let term_months = get(['term_months', 'term-months']);
    if (!term_months) {
      const productName = String(product || '').toLowerCase();
      if (productName.includes('2yr')) term_months = 24;
      else if (productName.includes('3yr')) term_months = 36;
      else if (productName.includes('5yr')) term_months = 60;
      else if (productName.includes('10yr')) term_months = 120;
    }

    // If initial_term wasn't supplied, infer from product name or term/term_months
    let inferredInitial = initial_term;
    if (inferredInitial === null || inferredInitial === undefined) {
      const productName = String(product || '').toLowerCase();
      if (productName.includes('2yr')) inferredInitial = 24;
      else if (productName.includes('3yr')) inferredInitial = 36;
      else if (term_months) inferredInitial = Number(term_months);
      else if (term) inferredInitial = Number(term);
    }

    // If full_term wasn't supplied, default to 120 months
    let finalFullTerm = full_term;
    if (finalFullTerm === null || finalFullTerm === undefined) {
      finalFullTerm = 120;
    }

    // rate: accept percent like 5.89 or decimal 0.0589
    const rateRaw = get(['rate', 'product_rate', 'product-rate']);
    let rate = rateRaw === '' ? null : Number(rateRaw);
    if (rate !== null && !Number.isNaN(rate)) {
      if (rate > 1) rate = rate / 100; // convert percent to decimal
    }

    const max_ltv_raw = get(['max_ltv', 'max-ltv']);
    const max_ltv = max_ltv_raw === '' ? null : Number(max_ltv_raw);

    const revert_index = get(['revert_index', 'revert-index']);
    const revert_margin_raw = get(['revert_margin', 'revert-margin']);
    const revert_margin = revert_margin_raw === '' ? null : Number(revert_margin_raw);

    const min_loan_raw = get(['min_loan', 'min-loan']);
    const min_loan = min_loan_raw === '' ? null : Number(min_loan_raw);
    const max_loan_raw = get(['max_loan', 'max-loan']);
    const max_loan = max_loan_raw === '' ? null : Number(max_loan_raw);

    const max_rolled_months_raw = get(['max_rolled_months', 'max-rolled-months']);
    const max_rolled_months = max_rolled_months_raw === '' ? null : Number(max_rolled_months_raw);

    const min_rolled_months_raw = get(['min_rolled_months', 'min-rolled-months']);
    const min_rolled_months = min_rolled_months_raw === '' ? null : Number(min_rolled_months_raw);

    const max_defer_int_raw = get(['max_defer_int', 'max-defer-int']);
    const max_defer_int = max_defer_int_raw === '' ? null : Number(max_defer_int_raw);

    const min_defer_int_raw = get(['min_defer_int', 'min-defer-int']);
    const min_defer_int = min_defer_int_raw === '' ? null : Number(min_defer_int_raw);

    const min_icr_raw = get(['min_icr', 'min-icr']);
    const min_icr = min_icr_raw === '' ? null : Number(min_icr_raw);

    const is_tracker_raw = get(['is_tracker', 'is-tracker']);
    const is_tracker = String(is_tracker_raw).toLowerCase() === 'true' || String(is_tracker_raw).toLowerCase() === 'yes';

  // New fields: max_top_slicing, admin_fee, erc_1..erc_5, status, floor_rate, proc_fee
  const max_top_slicing_raw = get(['max_top_slicing', 'max-top-slicing']);
  const max_top_slicing = max_top_slicing_raw === '' ? null : Number(max_top_slicing_raw);

  const admin_fee_raw = get(['admin_fee', 'admin-fee', 'adminfee']);
  const admin_fee = admin_fee_raw === '' ? null : Number(admin_fee_raw);

  const erc1_raw = get(['erc_1', 'erc1', 'erc-1']);
  const erc_1 = erc1_raw === '' ? null : Number(erc1_raw);
  const erc2_raw = get(['erc_2', 'erc2', 'erc-2']);
  const erc_2 = erc2_raw === '' ? null : Number(erc2_raw);
  const erc3_raw = get(['erc_3', 'erc3', 'erc-3']);
  const erc_3 = erc3_raw === '' ? null : Number(erc3_raw);
  const erc4_raw = get(['erc_4', 'erc4', 'erc-4']);
  const erc_4 = erc4_raw === '' ? null : Number(erc4_raw);
  const erc5_raw = get(['erc_5', 'erc5', 'erc-5']);
  const erc_5 = erc5_raw === '' ? null : Number(erc5_raw);

  // status: accept 'status' or misspelled 'staus'
  const status = get(['status', 'staus']);

  const floor_rate_raw = get(['floor_rate', 'floor-rate', 'floorrate']);
  const floor_rate = floor_rate_raw === '' ? null : Number(floor_rate_raw);

  const proc_fee_raw = get(['proc_fee', 'proc-fee', 'procfee']);
  const proc_fee = proc_fee_raw === '' ? null : Number(proc_fee_raw);

    if (rate === null || Number.isNaN(rate)) {
      console.warn('Skipping line with invalid rate:', line);
      continue;
    }

    rows.push({
      set_key,
      property,
      rate_type,
      is_retention,
      tier,
      product,
      product_fee,
      term,
      initial_term: inferredInitial,
      full_term: finalFullTerm,
      term_months,
      rate,
      max_ltv,
      revert_index,
      revert_margin,
      min_loan,
      max_loan,
      max_rolled_months,
      min_rolled_months,
      max_defer_int,
      min_defer_int,
      min_icr,
      is_tracker,
      max_top_slicing,
      admin_fee,
      erc_1,
      erc_2,
      erc_3,
      erc_4,
      erc_5,
      status,
      floor_rate,
      proc_fee
    });
  }

  return rows;
}

async function upsertRows(rows) {
  const chunkSize = 200; // safe batch size
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase.from('rates_flat').upsert(chunk, { onConflict: 'set_key,property,tier,product,term' });
    if (error) {
      console.error('Upsert error for chunk starting at', i, error);
      return { ok: false, error };
    }
    console.log(`Upserted rows ${i + 1}-${i + chunk.length}`);
  }
  return { ok: true };
}

async function main() {
  console.log('Reading CSV from', CSV_PATH);
  let content;
  try {
    content = fs.readFileSync(CSV_PATH, 'utf8');
  } catch (err) {
    console.error('Failed to read CSV file:', err.message);
    process.exit(1);
  }

  const rows = parseCsv(content);
  console.log('Parsed', rows.length, 'rows');

  if (!rows.length) {
    console.log('No rows to upsert. Exiting.');
    return;
  }

  const result = await upsertRows(rows);
  if (!result.ok) process.exit(1);
  console.log('Import complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
