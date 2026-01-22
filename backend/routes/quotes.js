import express from 'express';
import { supabase } from '../config/supabase.js';
import { validate, createQuoteSchema, updateQuoteSchema } from '../middleware/validation.js';
import { asyncHandler, ErrorTypes } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import log from '../utils/logger.js';

const router = express.Router();

router.use(authenticateToken);

// Helper: parse numeric or return null (avoid inserting empty strings into numeric columns)
function toNullableNumber(v) {
  if (v === undefined || v === null) return null;
  // Accept numbers
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  // Accept numeric strings (strip commas/currency etc.)
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.-]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Create a new quote
router.post('/', validate(createQuoteSchema), asyncHandler(async (req, res) => {
  log.info('📝 POST /api/quotes - Creating new quote', { calculator_type: req.body.calculator_type });
  
  const { calculator_type, results, ...quoteData } = req.body;

  const isBridge = calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge';
  const table = isBridge ? 'bridge_quotes' : 'quotes';
  const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';

  // Normalize calculator_type for consistency
  const normalizedType = isBridge ? 'BRIDGING' : 'BTL';
  
  // Generate reference number using database function
  const { data: refData, error: refError } = await supabase.rpc('generate_reference_number');
  if (refError) {
    log.error('Error generating reference number', refError);
  }
  const referenceNumber = refData || `MFS${Date.now()}`;
  
  // Add the normalized calculator_type, reference_number, and user_id from auth token
  const dataToInsert = { 
    ...quoteData,
    calculator_type: normalizedType,
    reference_number: referenceNumber,
    user_id: req.user?.id || quoteData.user_id // Use authenticated user's ID
  };

  const { data, error } = await supabase.from(table).insert([dataToInsert]).select('*');
  if (error) {
    log.error('❌ Supabase insert error', error);
    throw ErrorTypes.database('Failed to create quote', error);
  }
  
  const savedQuote = data && data[0] ? data[0] : null;
  
  // Save results to the corresponding results table if provided
  if (savedQuote && results && Array.isArray(results) && results.length > 0) {
    log.info(`💾 Saving ${results.length} results to ${resultsTable}`);
    
    const resultsToInsert = results.map(result => {
      // Compute serviced_months = initial_term - rolled_months when possible
      const initialTerm = toNullableNumber(result.initial_term);
      const rolledMonths = toNullableNumber(result.rolled_months);
      const servicedMonths = (initialTerm !== null && rolledMonths !== null)
        ? Math.max(0, initialTerm - rolledMonths)
        : null;

      return {
        quote_id: savedQuote.id,
        ...result,
        // Add computed serviced_months for downstream consumers (PDFs, exports)
        serviced_months: servicedMonths,
      };
    });
    
    // Log sample of first result to verify title_insurance_cost is present
    if (resultsToInsert.length > 0) {
      log.info('Sample result data:', {
        fee_column: resultsToInsert[0].fee_column,
        has_title_insurance: 'title_insurance_cost' in resultsToInsert[0],
        title_insurance_value: resultsToInsert[0].title_insurance_cost
      });
    }
    
    const { error: resultsError } = await supabase.from(resultsTable).insert(resultsToInsert);
    if (resultsError) {
      log.error('❌ Error saving quote results to ' + resultsTable, resultsError);
      log.error('Failed result data sample:', JSON.stringify(resultsToInsert[0], null, 2));
      // Don't fail the entire request if results saving fails
    } else {
      log.info(`✅ Successfully saved ${resultsToInsert.length} results to ${resultsTable}`);
    }
  }
  
  return res.status(201).json({ quote: savedQuote });
}));

// List quotes (optional filters: user_id, calculator_type, limit, offset)
router.get('/', asyncHandler(async (req, res) => {
  log.info('GET /api/quotes - Request received', req.query);
  const { user_id, calculator_type, limit = 100, offset = 0 } = req.query;
  // If calculator_type indicates bridging, query bridge_quotes instead
  const isBridge = calculator_type && (calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge');
  const isBTL = calculator_type && calculator_type.toLowerCase() === 'btl';
  
  let allQuotes = [];
  
  if (isBridge) {
    // Only bridge quotes
    log.info('Fetching bridge quotes only');
    let query = supabase.from('bridge_quotes').select('*').order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
    if (user_id) query = query.eq('user_id', user_id);
    const { data, error } = await query;
    if (error) {
      log.error('Error fetching bridge quotes', error);
      throw ErrorTypes.database('Failed to fetch bridge quotes', error);
    }
    allQuotes = data || [];
  } else if (isBTL) {
    // Only BTL quotes
    log.info('Fetching BTL quotes only');
    let query = supabase.from('quotes').select('*').order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
    if (user_id) query = query.eq('user_id', user_id);
    const { data, error } = await query;
    if (error) {
      log.error('Error fetching BTL quotes', error);
      throw ErrorTypes.database('Failed to fetch BTL quotes', error);
    }
    allQuotes = data || [];
  } else {
    // No calculator_type specified: fetch from both tables
    log.info('Fetching from both quotes tables');
    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    const [btlResult, bridgeResult] = await Promise.allSettled([
      supabase.from('quotes').select('*').order('created_at', { ascending: false }).range(offsetNum, offsetNum + limitNum - 1),
      supabase.from('bridge_quotes').select('*').order('created_at', { ascending: false }).range(offsetNum, offsetNum + limitNum - 1)
    ]);
    
    let btlData = [];
    let bridgeData = [];
    
    if (btlResult.status === 'fulfilled' && !btlResult.value.error) {
      btlData = btlResult.value.data || [];
      log.info(`Fetched ${btlData.length} BTL quotes`);
    } else {
      log.error('Error fetching BTL quotes', btlResult.status === 'rejected' ? btlResult.reason : btlResult.value.error);
    }
    
    if (bridgeResult.status === 'fulfilled' && !bridgeResult.value.error) {
      bridgeData = bridgeResult.value.data || [];
      log.info(`Fetched ${bridgeData.length} bridge quotes`);
    } else {
      log.error('Error fetching bridge quotes', bridgeResult.status === 'rejected' ? bridgeResult.reason : bridgeResult.value.error);
    }
    
    allQuotes = [...btlData, ...bridgeData];
    // Sort combined results by created_at descending
    allQuotes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    // Apply limit again in case more than limit from each
    allQuotes = allQuotes.slice(0, limitNum);
  }
  
  log.info(`Returning ${allQuotes.length} quotes`);
  return res.json({ quotes: allQuotes });
}));

// Get a single quote by id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { include_results } = req.query; // Optional query param to include results
  
  // Try primary quotes table first, then bridge_quotes as fallback
  let { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
  let isBridge = false;
  
  if (error && error.code !== 'PGRST116') throw ErrorTypes.database('Failed to fetch quote', error);
  
  if (!data) {
    // fallback to bridge_quotes
    const { data: bdata, error: berr } = await supabase.from('bridge_quotes').select('*').eq('id', id).single();
    if (berr) {
      if (berr.code === 'PGRST116') throw ErrorTypes.notFound('Quote not found');
      throw ErrorTypes.database('Failed to fetch quote', berr);
    }
    data = bdata;
    isBridge = true;
  }
  
  // Optionally fetch results from the corresponding results table
  if (include_results === 'true' && data) {
    const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';
    const { data: resultsData, error: resultsError } = await supabase
      .from(resultsTable)
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true });
    
    if (!resultsError) {
      data.results = resultsData || [];
    } else {
      log.error('Error fetching quote results', resultsError);
      data.results = [];
    }
  }
  
  return res.json({ quote: data });
}));

// Update a quote
router.put('/:id', validate(updateQuoteSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { calculator_type, results, ...updates } = req.body;
  updates.updated_at = new Date().toISOString();

  // DEBUG: Log status updates
  if (updates.dip_status || updates.quote_status) {
    log.info('📝 Status update for quote', {
      quote_id: id,
      dip_status: updates.dip_status,
      quote_status: updates.quote_status,
      existing_dip_issued_at: updates.dip_issued_at,
      existing_quote_issued_at: updates.quote_issued_at
    });
  }

  // Fetch current quote to preserve issued timestamps if they exist
  const isBridge = calculator_type && (calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge');
  const table = isBridge ? 'bridge_quotes' : 'quotes';
  
  const { data: currentQuote, error: fetchErr } = await supabase
    .from(table)
    .select('quote_issued_at, dip_issued_at, dip_status, quote_status')
    .eq('id', id)
    .single();
  
  // Handle fallback to other table if not found
  let existingQuoteIssuedAt = currentQuote?.quote_issued_at;
  let existingDipIssuedAt = currentQuote?.dip_issued_at;
  
  if (fetchErr && (fetchErr.code === 'PGRST116' || fetchErr.details?.includes('0 rows'))) {
    const fallbackTable = isBridge ? 'quotes' : 'bridge_quotes';
    const { data: fallbackQuote } = await supabase
      .from(fallbackTable)
      .select('quote_issued_at, dip_issued_at, dip_status, quote_status')
      .eq('id', id)
      .single();
    existingQuoteIssuedAt = fallbackQuote?.quote_issued_at;
    existingDipIssuedAt = fallbackQuote?.dip_issued_at;
  }

  // If issuance status is being set to an issued state, stamp timestamps when absent
  const nowIso = updates.updated_at;
  
  // Handle quote_status and quote_issued_at
  if (typeof updates.quote_status === 'string' && /issued/i.test(updates.quote_status)) {
    // Preserve existing timestamp or set new one
    updates.quote_issued_at = existingQuoteIssuedAt || updates.quote_issued_at || nowIso;
    log.info('✅ Set quote_issued_at', { quote_id: id, timestamp: updates.quote_issued_at, was_existing: !!existingQuoteIssuedAt });
  } else if (existingQuoteIssuedAt && !updates.quote_issued_at) {
    // Preserve existing timestamp even if status isn't being updated
    updates.quote_issued_at = existingQuoteIssuedAt;
  }
  
  // Handle dip_status and dip_issued_at
  if (typeof updates.dip_status === 'string' && /issued/i.test(updates.dip_status)) {
    // Preserve existing timestamp or set new one
    updates.dip_issued_at = existingDipIssuedAt || updates.dip_issued_at || nowIso;
    log.info('✅ Set dip_issued_at', { quote_id: id, timestamp: updates.dip_issued_at, was_existing: !!existingDipIssuedAt });
  } else if (existingDipIssuedAt && !updates.dip_issued_at) {
    // Preserve existing timestamp even if status isn't being updated
    updates.dip_issued_at = existingDipIssuedAt;
  }

  const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';

  const { data: updated, error: upErr } = await supabase.from(table).update(updates).eq('id', id).select('*');
  if (upErr) {
    // If the row is not in the guessed table, try the other one.
    if (upErr.code === 'PGRST116' || (upErr.details && upErr.details.includes('0 rows'))) {
      const fallbackTable = isBridge ? 'quotes' : 'bridge_quotes';
      const fallbackResultsTable = isBridge ? 'quote_results' : 'bridge_quote_results';
      const { data: fallbackUpdated, error: fallbackErr } = await supabase.from(fallbackTable).update(updates).eq('id', id).select('*');
      if (fallbackErr) throw ErrorTypes.database('Failed to update quote', fallbackErr);
      if (!fallbackUpdated || fallbackUpdated.length === 0) throw ErrorTypes.notFound('Quote not found in either table');
      
      // Handle results for fallback table
      if (results && Array.isArray(results) && results.length > 0) {
        await supabase.from(fallbackResultsTable).delete().eq('quote_id', id);
        const resultsToInsert = results.map(result => ({ quote_id: id, ...result }));
        const { error: resultsError } = await supabase.from(fallbackResultsTable).insert(resultsToInsert);
        if (resultsError) log.error('Error saving quote results', resultsError);
      }
      
      return res.json({ quote: fallbackUpdated[0] });
    }
    throw ErrorTypes.database('Failed to update quote', upErr);
  }
  if (!updated || updated.length === 0) throw ErrorTypes.notFound('Quote not found');
  
  // Update results: delete existing and insert new ones
  if (results && Array.isArray(results) && results.length > 0) {
    log.info(`🔄 Updating ${results.length} results in ${resultsTable} for quote ${id}`);
    
    // Delete existing results
    await supabase.from(resultsTable).delete().eq('quote_id', id);
    
    // Insert new results
    const resultsToInsert = results.map(result => {
      const initialTerm = toNullableNumber(result.initial_term);
      const rolledMonths = toNullableNumber(result.rolled_months);
      const servicedMonths = (initialTerm !== null && rolledMonths !== null)
        ? Math.max(0, initialTerm - rolledMonths)
        : null;

      return {
        quote_id: id,
        ...result,
        serviced_months: servicedMonths,
      };
    });
    
    // Log sample of first result to verify title_insurance_cost is present
    if (resultsToInsert.length > 0) {
      log.info('Sample updated result data:', {
        fee_column: resultsToInsert[0].fee_column,
        has_title_insurance: 'title_insurance_cost' in resultsToInsert[0],
        title_insurance_value: resultsToInsert[0].title_insurance_cost
      });
    }
    
    const { error: resultsError } = await supabase.from(resultsTable).insert(resultsToInsert);
    if (resultsError) {
      log.error('❌ Error updating quote results in ' + resultsTable, resultsError);
      log.error('Failed result data sample:', JSON.stringify(resultsToInsert[0], null, 2));
    } else {
      log.info(`✅ Successfully updated ${resultsToInsert.length} results in ${resultsTable}`);
    }
  }

  // If DIP has been issued, ensure a single DIP result row exists
  try {
    const dipIssued = typeof updates.dip_status === 'string' && /issued/i.test(updates.dip_status);
    const resultsTableForStage = (table === 'bridge_quotes') ? 'bridge_quote_results' : 'quote_results';
    if (dipIssued) {
      // Remove any existing DIP stage row (enforced by unique index)
      await supabase
        .from(resultsTableForStage)
        .delete()
        .eq('quote_id', id)
        .eq('stage', 'DIP');

      // Load current QUOTE results to choose the best candidate
      const { data: currentResults, error: loadErr } = await supabase
        .from(resultsTableForStage)
        .select('*')
        .eq('quote_id', id)
        .neq('stage', 'DIP');
      if (!loadErr && currentResults && currentResults.length > 0) {
        // Heuristic: pick result with highest net_loan; fallback to first row
        const best = currentResults.reduce((acc, r) => {
          if (!acc) return r;
          const a = Number(acc.net_loan ?? acc.gross_loan ?? 0);
          const b = Number(r.net_loan ?? r.gross_loan ?? 0);
          return b > a ? r : acc;
        }, null);

        if (best) {
          const { id: _omit, created_at: _c1, updated_at: _u1, stage: _s1, ...payload } = best;
          const dipRow = { ...payload, stage: 'DIP' };
          // Ensure quote_id is set
          dipRow.quote_id = id;
          // Insert DIP row
          await supabase.from(resultsTableForStage).insert(dipRow);
        }
      }
    }
  } catch (e) {
    log.warn('Non-fatal: failed to ensure DIP stage result', { quote_id: id, error: e?.message || String(e) });
  }
  
  return res.json({ quote: updated[0] });
}));

// Delete a quote
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  // try deleting from primary table first
  let { data, error } = await supabase.from('quotes').delete().eq('id', id).select('*');
  if (error) {
    // if not found, try bridge table
    if (error.code === 'PGRST116') {
      const { data: bdel, error: berr } = await supabase.from('bridge_quotes').delete().eq('id', id).select('*');
      if (berr) throw ErrorTypes.database('Failed to delete quote', berr);
      return res.json({ deleted: bdel && bdel[0] ? bdel[0] : null });
    }
    throw ErrorTypes.database('Failed to delete quote', error);
  }
  return res.json({ deleted: data && data[0] ? data[0] : null });
}));

// ==================== UW CHECKLIST STATE ROUTES ====================

// Get UW checklist state for a quote
router.get('/:id/uw-checklist', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stage } = req.query;
  
  log.info('📋 GET /api/quotes/:id/uw-checklist', { quote_id: id, stage });
  
  let query = supabase
    .from('uw_checklist_state')
    .select('*')
    .eq('quote_id', id);
  
  if (stage && stage !== 'Both') {
    query = query.eq('stage', stage);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error) {
    log.error('❌ Error fetching UW checklist state', error);
    throw ErrorTypes.database('Failed to fetch UW checklist state', error);
  }
  
  if (!data) {
    // Return empty state for new quotes
    return res.json({ checked_items: {}, custom_requirements: null, stage: stage || 'Both' });
  }
  
  // Convert checked_items from array to object if needed
  let checkedItems = data.checked_items || {};
  if (Array.isArray(checkedItems)) {
    // Convert array format ['id1', 'id2'] to object format { id1: true, id2: true }
    checkedItems = checkedItems.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
  }
  
  return res.json({
    id: data.id,
    quote_id: data.quote_id,
    checked_items: checkedItems,
    custom_requirements: data.custom_requirements || null,
    stage: data.stage,
    last_updated_by: data.last_updated_by,
    updated_at: data.updated_at
  });
}));

// Save/Update UW checklist state for a quote
router.put('/:id/uw-checklist', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { checked_items, stage = 'Both', custom_requirements } = req.body;
  
  log.info('💾 PUT /api/quotes/:id/uw-checklist', { 
    quote_id: id, 
    stage, 
    checked_count: Object.keys(checked_items || {}).filter(k => checked_items[k]).length,
    has_custom_requirements: !!custom_requirements
  });
  
  // Convert object format to array format for storage
  let itemsToStore = checked_items;
  if (checked_items && typeof checked_items === 'object' && !Array.isArray(checked_items)) {
    // Convert { id1: true, id2: false } to ['id1'] (only true values)
    itemsToStore = Object.entries(checked_items)
      .filter(([, checked]) => checked === true)
      .map(([id]) => id);
  }
  
  // Calculate progress for quick access on quotes table
  const checkedCount = Array.isArray(itemsToStore) ? itemsToStore.length : 0;
  
  // Upsert the checklist state
  const { data, error } = await supabase
    .from('uw_checklist_state')
    .upsert({
      quote_id: id,
      stage,
      checked_items: itemsToStore,
      custom_requirements: custom_requirements || null,
      last_updated_by: req.user?.email || 'system'
    }, {
      onConflict: 'quote_id,stage'
    })
    .select('*')
    .single();
  
  if (error) {
    log.error('❌ Error saving UW checklist state', error);
    throw ErrorTypes.database('Failed to save UW checklist state', error);
  }
  
  // Also update the quotes table with progress info
  // Try BTL quotes first, then bridge quotes
  const progressUpdate = {
    uw_checklist_progress: checkedCount
  };
  
  let { error: quoteError } = await supabase
    .from('quotes')
    .update(progressUpdate)
    .eq('id', id);
  
  if (quoteError) {
    // Try bridge_quotes table
    await supabase
      .from('bridge_quotes')
      .update(progressUpdate)
      .eq('id', id);
  }
  
  log.info('✅ UW checklist state saved', { quote_id: id, checked_count: checkedCount });
  
  // Convert back to object format for response
  const responseItems = Array.isArray(itemsToStore) 
    ? itemsToStore.reduce((acc, id) => { acc[id] = true; return acc; }, {})
    : itemsToStore;
  
  return res.json({
    id: data.id,
    quote_id: data.quote_id,
    checked_items: responseItems,
    stage: data.stage,
    last_updated_by: data.last_updated_by,
    updated_at: data.updated_at
  });
}));

export default router;
