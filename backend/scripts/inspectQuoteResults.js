import { supabase } from '../config/supabase.js';

// Usage: node scripts/inspectQuoteResults.js <quoteId>

async function main() {
  const quoteId = process.argv[2];
  if (!quoteId) {
    console.error('Usage: node scripts/inspectQuoteResults.js <quoteId>');
    process.exit(1);
  }

  console.log('🔍 Inspecting results for quote_id =', quoteId);

  // Try BTL results first
  const { data: btlResults, error: btlErr } = await supabase
    .from('quote_results')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: true });

  if (btlErr) {
    console.error('Error fetching from quote_results:', btlErr);
  } else {
    console.log(`BTL quote_results count: ${btlResults.length}`);
    btlResults.slice(0, 5).forEach((r, idx) => {
      console.log(`BTL[${idx}] fee_column=${r.fee_column}, title_insurance_cost=${r.title_insurance_cost}, total_cost_to_borrower=${r.total_cost_to_borrower}`);
    });
  }

  // Try bridge results
  const { data: bridgeResults, error: bridgeErr } = await supabase
    .from('bridge_quote_results')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: true });

  if (bridgeErr) {
    console.error('Error fetching from bridge_quote_results:', bridgeErr);
  } else {
    console.log(`Bridge bridge_quote_results count: ${bridgeResults.length}`);
    bridgeResults.slice(0, 5).forEach((r, idx) => {
      console.log(`BRIDGE[${idx}] fee_column=${r.fee_column}, title_insurance_cost=${r.title_insurance_cost}, total_cost_to_borrower=${r.total_cost_to_borrower}`);
    });
  }

  process.exit(0);
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
