import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

async function run() {
  console.log('Testing Supabase connection and `rates_flat` retrieval...');

  // 1) total row count (using select with exact count)
  try {
    const { data: countData, error: countErr, count } = await supabase
      .from('rates_flat')
      .select('id', { count: 'exact', head: false })
      .limit(1);

    if (countErr) {
      console.error('Error getting total count:', countErr.message || countErr);
    } else {
      console.log('Total rows in rates_flat (approx):', count ?? 'unknown');
    }
  } catch (e) {
    console.error('Count query failed:', e.message || e);
  }

  // 2) sample rows
  try {
    const { data: sample, error: sampleErr } = await supabase
      .from('rates_flat')
      .select('*')
      .order('id', { ascending: true })
      .limit(10);

    if (sampleErr) {
      console.error('Error fetching sample rows:', sampleErr.message || sampleErr);
    } else {
      console.log('\nSample rows (first 10):');
    console.table(sample.map(r => ({ id: r.id, set_key: r.set_key, property: r.property || r.scope, tier: r.tier, product: r.product, term: r.term, term_months: r.term_months, rate: r.rate, is_tracker: r.is_tracker })));
    }
  } catch (e) {
    console.error('Sample query failed:', e.message || e);
  }

  // 3) sample by a specific set_key
  const testSetKey = 'RATES_RETENTION_75';
  try {
    const { data: retentionRows, error: retentionErr } = await supabase
      .from('rates_flat')
      .select('*')
      .eq('set_key', testSetKey)
      .limit(20);

    if (retentionErr) {
      console.error('Error fetching', testSetKey, retentionErr.message || retentionErr);
    } else {
      console.log(`\nRows for ${testSetKey}:`, retentionRows?.length ?? 0);
      console.table((retentionRows || []).slice(0, 10).map(r => ({ id: r.id, tier: r.tier, product: r.product, term: r.term, rate: r.rate, is_tracker: r.is_tracker })));
    }
  } catch (e) {
    console.error('Retention query failed:', e.message || e);
  }

  // 4) check margin rows
  try {
    const { data: margins, error: marginErr } = await supabase
      .from('rates_flat')
      .select('*')
      .eq('is_tracker', true)
      .limit(20);

    if (marginErr) {
      console.error('Error fetching tracker rows:', marginErr.message || marginErr);
    } else {
      console.log('\nTracker rows sample count:', (margins || []).length);
      console.table((margins || []).map(r => ({ id: r.id, set_key: r.set_key, product: r.product, term: r.term, rate: r.rate })));
    }
  } catch (e) {
    console.error('Margin query failed:', e.message || e);
  }

  // 5) counts per set_key (small aggregation client-side)
  try {
    const { data: keys, error: keysErr } = await supabase
      .from('rates_flat')
      .select('set_key')
      .limit(10000);

    if (keysErr) {
      console.error('Error fetching set_key list:', keysErr.message || keysErr);
    } else {
      const counts = {};
      (keys || []).forEach(k => { counts[k.set_key] = (counts[k.set_key] || 0) + 1; });
      console.log('\nCounts per set_key (client-side):');
      console.table(Object.entries(counts).map(([set_key, cnt]) => ({ set_key, count: cnt })));
    }
  } catch (e) {
    console.error('Counts per set_key failed:', e.message || e);
  }

  console.log('\nDone tests.');
}

run().catch(err => {
  console.error('Unexpected error:', err?.message || err);
  process.exit(1);
});
