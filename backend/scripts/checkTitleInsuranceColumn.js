import { supabase } from '../config/supabase.js';

/**
 * Script to check if title_insurance_cost column exists in quote_results tables
 * and verify data in the tables
 */

async function checkTitleInsuranceColumn() {
  console.log('🔍 Checking title_insurance_cost column in database...\n');

  try {
    // Check quote_results table structure by fetching one record with all columns
    console.log('--- Checking quote_results (BTL) ---');
    const { data: btlData, error: btlError } = await supabase
      .from('quote_results')
      .select('*')
      .limit(1);

    if (btlError) {
      console.error('❌ Error fetching from quote_results:', btlError.message);
      console.error('Details:', btlError);
    } else if (btlData && btlData.length > 0) {
      const columns = Object.keys(btlData[0]);
      console.log('✅ quote_results table exists');
      console.log(`📋 Total columns: ${columns.length}`);
      console.log(`📊 Has title_insurance_cost: ${columns.includes('title_insurance_cost') ? 'YES ✅' : 'NO ❌'}`);
      
      if (columns.includes('title_insurance_cost')) {
        console.log(`   Value in sample record: ${btlData[0].title_insurance_cost}`);
      }
      
      // Count total records
      const { count, error: countError } = await supabase
        .from('quote_results')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`📈 Total records: ${count}`);
      }

      // Check for records with non-null title_insurance_cost
      const { data: withTitle, error: titleError } = await supabase
        .from('quote_results')
        .select('id, quote_id, fee_column, title_insurance_cost')
        .not('title_insurance_cost', 'is', null);
      
      if (!titleError) {
        console.log(`📊 Records with title_insurance_cost: ${withTitle?.length || 0}`);
        if (withTitle && withTitle.length > 0) {
          console.log('   Sample values:');
          withTitle.slice(0, 3).forEach(r => {
            console.log(`   - ID: ${r.id}, Fee: ${r.fee_column}, Title Insurance: ${r.title_insurance_cost}`);
          });
        }
      }
    } else {
      console.log('⚠️ quote_results table is empty');
    }

    console.log('\n--- Checking bridge_quote_results (Bridging) ---');
    const { data: bridgeData, error: bridgeError } = await supabase
      .from('bridge_quote_results')
      .select('*')
      .limit(1);

    if (bridgeError) {
      console.error('❌ Error fetching from bridge_quote_results:', bridgeError.message);
      console.error('Details:', bridgeError);
    } else if (bridgeData && bridgeData.length > 0) {
      const columns = Object.keys(bridgeData[0]);
      console.log('✅ bridge_quote_results table exists');
      console.log(`📋 Total columns: ${columns.length}`);
      console.log(`📊 Has title_insurance_cost: ${columns.includes('title_insurance_cost') ? 'YES ✅' : 'NO ❌'}`);
      
      if (columns.includes('title_insurance_cost')) {
        console.log(`   Value in sample record: ${bridgeData[0].title_insurance_cost}`);
      }

      // Count total records
      const { count, error: countError } = await supabase
        .from('bridge_quote_results')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`📈 Total records: ${count}`);
      }

      // Check for records with non-null title_insurance_cost
      const { data: withTitle, error: titleError } = await supabase
        .from('bridge_quote_results')
        .select('id, quote_id, fee_column, title_insurance_cost')
        .not('title_insurance_cost', 'is', null);
      
      if (!titleError) {
        console.log(`📊 Records with title_insurance_cost: ${withTitle?.length || 0}`);
        if (withTitle && withTitle.length > 0) {
          console.log('   Sample values:');
          withTitle.slice(0, 3).forEach(r => {
            console.log(`   - ID: ${r.id}, Fee: ${r.fee_column}, Title Insurance: ${r.title_insurance_cost}`);
          });
        }
      }
    } else {
      console.log('⚠️ bridge_quote_results table is empty');
    }

    console.log('\n✅ Check complete!');
    console.log('\n💡 If title_insurance_cost column is missing, you need to run migration 020:');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('   File: migrations/020_add_title_insurance_and_row_ordering.sql');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTitleInsuranceColumn();
