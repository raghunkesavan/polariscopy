/**
 * Test CSP Headers
 * Verifies that Content-Security-Policy headers are correctly set
 */

import axios from 'axios';

console.log('🧪 Testing CSP Headers');
console.log('═'.repeat(70));

async function testCSPHeaders() {
  const endpoints = [
    { name: 'Backend /api/canvas', url: 'http://localhost:3001/api/canvas' },
    { name: 'Frontend', url: 'http://localhost:3000/' },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log('─'.repeat(70));

    try {
      const response = await axios.get(endpoint.url, {
        validateStatus: () => true
      });

      // Check Content-Security-Policy header
      const csp = response.headers['content-security-policy'];
      const xFrameOptions = response.headers['x-frame-options'];

      console.log(`   Status: ${response.status}`);
      
      if (csp) {
        console.log(`   ✅ Content-Security-Policy: ${csp}`);
        
        // Check if frame-ancestors is set correctly
        if (csp.includes('frame-ancestors')) {
          if (csp.includes('salesforce.com') || csp.includes('force.com')) {
            console.log(`   ✅ frame-ancestors allows Salesforce domains`);
          } else if (csp.includes("'none'")) {
            console.log(`   ❌ frame-ancestors is set to 'none' - BLOCKS FRAMING`);
          } else {
            console.log(`   ⚠️  frame-ancestors present but verify it includes Salesforce`);
          }
        } else {
          console.log(`   ⚠️  No frame-ancestors directive in CSP`);
        }
      } else {
        console.log(`   ❌ No Content-Security-Policy header found`);
      }

      if (xFrameOptions) {
        console.log(`   ⚠️  X-Frame-Options: ${xFrameOptions} (should be removed)`);
      } else {
        console.log(`   ✅ No X-Frame-Options header (good - using CSP instead)`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📋 SUMMARY');
  console.log('═'.repeat(70));
  console.log('Both endpoints should have:');
  console.log('  ✅ Content-Security-Policy header with frame-ancestors');
  console.log('  ✅ frame-ancestors includes *.salesforce.com *.force.com');
  console.log('  ✅ No X-Frame-Options header (or set to allow framing)');
  console.log('\n');
}

testCSPHeaders();
