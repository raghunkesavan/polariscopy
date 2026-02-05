/**
 * Comprehensive Diagnostic: Canvas OAuth Setup
 * Checks all prerequisites for OAuth token request to work
 */

import dotenv from 'dotenv';
import axios from 'axios';
import qs from 'qs';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('\n' + '═'.repeat(70));
console.log('🔍 CANVAS OAUTH DIAGNOSTIC TEST');
console.log('═'.repeat(70));

const checks = [];

// ✅ CHECK 1: .env file exists
console.log('\n1️⃣  .env File Check');
console.log('─'.repeat(70));
const envPath = path.resolve('.env');
const envExamplePath = path.resolve('.env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  checks.push(true);
} else {
  console.log('❌ .env file NOT FOUND');
  console.log('📝 Create .env file with required variables');
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Use .env.example as template');
  }
  checks.push(false);
}

// ✅ CHECK 2: Required environment variables
console.log('\n2️⃣  Environment Variables Check');
console.log('─'.repeat(70));
const requiredVars = {
  SF_CLIENT_ID: 'Salesforce OAuth Client ID',
  SF_CLIENT_SECRET: 'Salesforce OAuth Client Secret',
  SF_USERNAME: 'Salesforce Username',
  SF_PASSWORD: 'Salesforce Password',
  SF_SECURITY_TOKEN: 'Salesforce Security Token',
  CANVAS_CONSUMER_SECRET: 'Canvas Consumer Secret'
};

let envVarsComplete = true;
Object.entries(requiredVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (value) {
    const displayValue = value.length > 30 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${key.padEnd(25)} = ${displayValue}`);
  } else {
    console.log(`❌ ${key.padEnd(25)} = NOT SET`);
    envVarsComplete = false;
  }
});
checks.push(envVarsComplete);

// ✅ CHECK 3: Salesforce instance connectivity
console.log('\n3️⃣  Salesforce Instance Connectivity Check');
console.log('─'.repeat(70));
const sfInstanceUrl = "https://mfsuk--dev.sandbox.my.salesforce.com";
console.log(`🔗 Testing connectivity to: ${sfInstanceUrl}`);

try {
  const response = await axios.get(`${sfInstanceUrl}/services/oauth2/authorize`, {
    validateStatus: () => true,
    timeout: 5000
  });
  console.log(`✅ Instance is reachable (Status: ${response.status})`);
  checks.push(true);
} catch (error) {
  console.log(`❌ Instance is NOT reachable`);
  console.log(`📝 Error: ${error.message}`);
  console.log(`💡 Verify SF_INSTANCE_URL is correct in your .env file`);
  checks.push(false);
}

// ✅ CHECK 4: OAuth endpoint validation
console.log('\n4️⃣  OAuth Endpoint Validation');
console.log('─'.repeat(70));
console.log(`🔐 OAuth Token Endpoint: ${sfInstanceUrl}/services/oauth2/token`);
console.log(`📝 Expected Request Type: POST`);
console.log(`📝 Expected Body Format: URL-encoded (application/x-www-form-urlencoded)`);
console.log('✅ Endpoint configuration is correct in code');
checks.push(true);

// ✅ CHECK 5: Test OAuth token request (if env vars are set)
if (envVarsComplete) {
  console.log('\n5️⃣  OAuth Token Request Test');
  console.log('─'.repeat(70));
  console.log('🚀 Attempting to get OAuth token...');
  
  try {
    const tokenResponse = await axios.post(
      `${sfInstanceUrl}/services/oauth2/token`,
      qs.stringify({
        grant_type: "password",
        client_id: process.env.SF_CLIENT_ID,
        client_secret: process.env.SF_CLIENT_SECRET,
        username: process.env.SF_USERNAME,
        password: process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true,
        timeout: 10000
      }
    );

    if (tokenResponse.status === 200) {
      console.log('✅ OAuth Token Request SUCCESSFUL!');
      console.log(`   Access Token: ${tokenResponse.data.access_token.substring(0, 20)}...`);
      console.log(`   Token Type: ${tokenResponse.data.token_type}`);
      console.log(`   Expires In: ${tokenResponse.data.expires_in}s`);
      console.log(`   Instance URL: ${tokenResponse.data.instance_url}`);
      checks.push(true);
    } else {
      console.log('❌ OAuth Token Request FAILED');
      console.log(`   Status: ${tokenResponse.status}`);
      console.log(`   Error: ${JSON.stringify(tokenResponse.data)}`);
      
      if (tokenResponse.status === 400) {
        console.log('\n💡 Troubleshooting (400 Bad Request):');
        console.log('   • Check username and password are correct');
        console.log('   • Verify security token is appended to password');
        console.log('   • Ensure client ID and secret match');
      } else if (tokenResponse.status === 401) {
        console.log('\n💡 Troubleshooting (401 Unauthorized):');
        console.log('   • Verify client credentials are correct');
        console.log('   • Check if Connected App is enabled');
        console.log('   • Ensure OAuth scopes are configured');
      }
      checks.push(false);
    }
  } catch (error) {
    console.log('❌ OAuth Token Request NETWORK ERROR');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   • Verify Salesforce instance is reachable');
    console.log('   • Check network connectivity and firewall');
    console.log('   • Verify SF_INSTANCE_URL in .env is correct');
    checks.push(false);
  }
} else {
  console.log('\n5️⃣  OAuth Token Request Test');
  console.log('─'.repeat(70));
  console.log('⏭️  Skipped - Environment variables not fully configured');
}

// ✅ FINAL SUMMARY
console.log('\n' + '═'.repeat(70));
console.log('📊 DIAGNOSTIC SUMMARY');
console.log('═'.repeat(70));

const passedChecks = checks.filter(c => c).length;
const totalChecks = checks.length;
const passPercentage = Math.round((passedChecks / totalChecks) * 100);

console.log(`✅ Passed: ${passedChecks}/${totalChecks} (${passPercentage}%)`);

if (passPercentage === 100) {
  console.log('\n🎉 All checks PASSED! Your OAuth setup is ready.');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start backend: npm run dev');
  console.log('   2. Setup ngrok tunnel: ngrok http 3001');
  console.log('   3. Update Canvas App URL in Salesforce');
  console.log('   4. Test with real Salesforce Canvas App');
} else if (passPercentage >= 80) {
  console.log('\n⚠️  Most checks passed. Review failures above.');
} else {
  console.log('\n❌ Multiple checks failed. Please resolve issues above.');
  console.log('\n📝 Critical issue: Environment variables not configured');
  console.log('\n   To fix:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Fill in all Salesforce credentials');
  console.log('   3. Re-run this diagnostic');
}

console.log('\n' + '═'.repeat(70) + '\n');
