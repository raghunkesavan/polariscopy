import { supabase } from '../config/supabase.js';

async function testQuoteColumns() {
  try {
    console.log('Testing quote columns...');
    
    // Try to select the quote columns
    const { data, error } = await supabase
      .from('quotes')
      .select('id, quote_selected_fee_ranges, quote_assumptions, quote_borrower_name, quote_additional_notes, quote_issued_at, quote_status')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying quotes table:', error.message);
      console.error('Details:', error);
      console.log('\n⚠️  The quote issuance columns probably don\'t exist in the database.');
      console.log('Please run the migration: migrations/007_add_quote_issuance_fields.sql');
      return false;
    }
    
    console.log('✅ Quote columns exist in the database!');
    console.log('Sample data:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

testQuoteColumns().then(() => process.exit(0));
