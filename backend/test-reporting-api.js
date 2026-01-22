/**
 * Test Script: API Key Creation and Reporting Endpoint
 * 
 * This script tests the API key authentication and reporting endpoints
 * Run with: node backend/test-reporting-api.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testReportingAPI() {
  log('\n🧪 Testing Reporting API\n', 'blue');

  try {
    // Step 1: Login as admin to get JWT token
    log('Step 1: Logging in as admin...', 'yellow');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const jwtToken = loginData.token;
    log('✓ Login successful', 'green');
    log(`  JWT Token: ${jwtToken.substring(0, 20)}...`, 'reset');

    // Step 2: Create API key
    log('\nStep 2: Creating API key...', 'yellow');
    const createKeyResponse = await fetch(`${BASE_URL}/api/admin/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        name: 'Test API Key - Power BI',
        permissions: ['read:reports'],
        expiresInDays: 30,
        notes: 'Test key created by test script',
      }),
    });

    if (!createKeyResponse.ok) {
      const errorText = await createKeyResponse.text();
      throw new Error(`API key creation failed: ${createKeyResponse.status} - ${errorText}`);
    }

    const keyData = await createKeyResponse.json();
    const apiKey = keyData.apiKey;
    log('✓ API key created successfully', 'green');
    log(`  API Key: ${apiKey}`, 'reset');
    log(`  Name: ${keyData.keyInfo.name}`, 'reset');
    log(`  Expires: ${keyData.keyInfo.expiresAt}`, 'reset');

    // Step 3: Test health endpoint
    log('\nStep 3: Testing health endpoint...', 'yellow');
    const healthResponse = await fetch(`${BASE_URL}/api/reporting/health`, {
      headers: { 'X-API-Key': apiKey },
    });

    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    log('✓ Health check successful', 'green');
    log(`  Status: ${healthData.status}`, 'reset');
    log(`  API Key Name: ${healthData.apiKey}`, 'reset');

    // Step 4: Test quotes endpoint (with filters)
    log('\nStep 4: Testing quotes endpoint...', 'yellow');
    const quotesResponse = await fetch(
      `${BASE_URL}/api/reporting/quotes?pageSize=5&calculator_type=btl`,
      {
        headers: { 'X-API-Key': apiKey },
      }
    );

    if (!quotesResponse.ok) {
      throw new Error(`Quotes endpoint failed: ${quotesResponse.status}`);
    }

    const quotesData = await quotesResponse.json();
    log('✓ Quotes endpoint successful', 'green');
    log(`  Total Records: ${quotesData.metadata.totalRecords}`, 'reset');
    log(`  Page: ${quotesData.metadata.page}`, 'reset');
    log(`  Page Size: ${quotesData.metadata.pageSize}`, 'reset');
    log(`  Records Returned: ${quotesData.data.length}`, 'reset');

    if (quotesData.data.length > 0) {
      log(`\n  Sample Quote:`, 'reset');
      const sample = quotesData.data[0];
      log(`    Reference: ${sample.reference_number}`, 'reset');
      log(`    Name: ${sample.quote_name}`, 'reset');
      log(`    Type: ${sample.calculator_type}`, 'reset');
      log(`    Status: ${sample.status}`, 'reset');
      log(`    Gross Loan: £${sample.gross_loan}`, 'reset');
    }

    // Step 5: Test summary endpoint
    log('\nStep 5: Testing summary endpoint...', 'yellow');
    const summaryResponse = await fetch(`${BASE_URL}/api/reporting/quotes/summary`, {
      headers: { 'X-API-Key': apiKey },
    });

    if (!summaryResponse.ok) {
      throw new Error(`Summary endpoint failed: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    log('✓ Summary endpoint successful', 'green');
    log(`  Total Quotes: ${summaryData.total_quotes}`, 'reset');
    log(`  By Type:`, 'reset');
    Object.entries(summaryData.by_calculator_type).forEach(([type, count]) => {
      log(`    ${type}: ${count}`, 'reset');
    });
    log(`  By Status:`, 'reset');
    Object.entries(summaryData.by_status).forEach(([status, count]) => {
      log(`    ${status}: ${count}`, 'reset');
    });

    // Step 6: Test rate limiting (optional - commented out to avoid hitting limit)
    // log('\nStep 6: Testing rate limiting...', 'yellow');
    // let rateLimitHit = false;
    // for (let i = 0; i < 105; i++) {
    //   const testResponse = await fetch(`${BASE_URL}/api/reporting/health`, {
    //     headers: { 'X-API-Key': apiKey },
    //   });
    //   if (testResponse.status === 429) {
    //     rateLimitHit = true;
    //     log(`✓ Rate limit enforced after ${i + 1} requests`, 'green');
    //     break;
    //   }
    // }
    // if (!rateLimitHit) {
    //   log('⚠ Rate limit not hit (expected after 100 requests)', 'yellow');
    // }

    // Step 7: List API keys
    log('\nStep 6: Listing API keys...', 'yellow');
    const listKeysResponse = await fetch(`${BASE_URL}/api/admin/api-keys`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` },
    });

    if (!listKeysResponse.ok) {
      throw new Error(`List API keys failed: ${listKeysResponse.status}`);
    }

    const listKeysData = await listKeysResponse.json();
    log('✓ API keys listed successfully', 'green');
    log(`  Total Keys: ${listKeysData.apiKeys.length}`, 'reset');
    
    const testKey = listKeysData.apiKeys.find(k => k.name === 'Test API Key - Power BI');
    if (testKey) {
      log(`  Test Key Found:`, 'reset');
      log(`    ID: ${testKey.id}`, 'reset');
      log(`    Active: ${testKey.is_active}`, 'reset');
      log(`    Last Used: ${testKey.last_used_at}`, 'reset');
    }

    // Step 8: Revoke test key (cleanup)
    log('\nStep 7: Cleaning up (revoking test key)...', 'yellow');
    if (testKey) {
      const revokeResponse = await fetch(
        `${BASE_URL}/api/admin/api-keys/${testKey.id}/revoke`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${jwtToken}` },
        }
      );

      if (!revokeResponse.ok) {
        throw new Error(`Revoke failed: ${revokeResponse.status}`);
      }

      log('✓ Test API key revoked', 'green');
    }

    log('\n✅ All tests passed!\n', 'green');
    log('Next steps:', 'blue');
    log('  1. Create a production API key for your data team', 'reset');
    log('  2. Share docs/POWER_BI_DATA_TEAM_GUIDE.md with them', 'reset');
    log('  3. Provide the API key and base URL', 'reset');
    log('  4. Monitor usage via /api/admin/api-keys', 'reset');

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testReportingAPI();
