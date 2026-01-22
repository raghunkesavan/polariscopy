import { supabase } from '../config/supabase.js';

async function checkAllColumns() {
  console.log('Checking all required columns for Quote and DIP functionality...\n');
  
  const requiredColumns = {
    // DIP columns
    commercial_or_main_residence: 'TEXT',
    dip_date: 'DATE',
    dip_expiry_date: 'DATE',
    guarantor_name: 'TEXT',
    lender_legal_fee: 'NUMERIC',
    number_of_applicants: 'INTEGER',
    overpayments_percent: 'NUMERIC',
    paying_network_club: 'TEXT',
    security_properties: 'JSONB',
    fee_type_selection: 'TEXT',
    dip_status: 'TEXT',
    product_range: 'TEXT',
    
    // Quote columns
    quote_selected_fee_ranges: 'JSONB',
    quote_assumptions: 'JSONB',
    quote_borrower_name: 'TEXT',
    quote_additional_notes: 'TEXT',
    quote_issued_at: 'TIMESTAMPTZ',
    quote_status: 'TEXT'
  };
  
  try {
    // Build a select statement with all columns
    const columnList = Object.keys(requiredColumns).join(', ');
    
    const { data, error } = await supabase
      .from('quotes')
      .select(columnList)
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying quotes table:');
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      
      // Try to identify which column is missing
      const missingColumnMatch = error.message.match(/Could not find the '(.+?)' column/);
      if (missingColumnMatch) {
        const missingColumn = missingColumnMatch[1];
        console.log(`\n⚠️  Missing column: ${missingColumn}`);
        console.log(`Expected type: ${requiredColumns[missingColumn]}`);
      }
      
      console.log('\n📝 Please run these migrations in order:');
      console.log('   1. migrations/005_add_dip_fields.sql');
      console.log('   2. migrations/007_add_quote_issuance_fields.sql');
      console.log('   3. migrations/008_add_product_range.sql');
      
      return false;
    }
    
    console.log('✅ All required columns exist in the quotes table!');
    console.log('\nColumns checked:');
    Object.keys(requiredColumns).forEach(col => {
      console.log(`  ✓ ${col} (${requiredColumns[col]})`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

checkAllColumns().then(() => process.exit(0));
