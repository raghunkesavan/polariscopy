/**
 * Test Script: Verify OAuth Token Request
 * Purpose: Test if axios.post to Salesforce OAuth endpoint is working
 */

import axios from 'axios';
import qs from 'qs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SF_OAUTH_URL = "https://mfsuk--dev.sandbox.my.salesforce.com/services/oauth2/token";

async function testOAuthTokenRequest() {
  console.log('🧪 Testing OAuth Token Request');
  console.log('═'.repeat(60));
  console.log('📋 Configuration:');
  console.log('  SF_OAUTH_URL:', SF_OAUTH_URL);
  console.log('  SF_CLIENT_ID:', process.env.SF_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('  SF_CLIENT_SECRET:', process.env.SF_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  SF_USERNAME:', process.env.SF_USERNAME ? '✅ Set' : '❌ Missing');
  console.log('  SF_PASSWORD:', process.env.SF_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('  SF_SECURITY_TOKEN:', process.env.SF_SECURITY_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('─'.repeat(60));

  // Check if all required env vars are set
  const requiredEnvVars = ['SF_CLIENT_ID', 'SF_CLIENT_SECRET', 'SF_USERNAME', 'SF_PASSWORD', 'SF_SECURITY_TOKEN'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.error('\n📝 Please add these to your .env file:');
    missingVars.forEach(v => console.error(`  ${v}=your_value`));
    process.exit(1);
  }

  try {
    console.log('\n🚀 Sending OAuth Token Request...');
    console.log('📤 Request Body (will be URL-encoded):');
    const requestData = {
      grant_type: "password",
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN
    };
    console.log(JSON.stringify(requestData, null, 2));
    
    const tokenResponse = await axios.post(
      SF_OAUTH_URL,
      qs.stringify(requestData),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true // Don't throw on any status
      }
    );

    console.log('\n📥 Response Status:', tokenResponse.status);
    console.log('─'.repeat(60));

    if (tokenResponse.status === 200) {
      console.log('✅ OAuth Token Request SUCCESSFUL!');
      console.log('\n🎉 Token Details:');
      console.log('  Access Token:', tokenResponse.data.access_token?.substring(0, 20) + '...');
      console.log('  Token Type:', tokenResponse.data.token_type);
      console.log('  Expires In:', tokenResponse.data.expires_in, 'seconds');
      console.log('  Instance URL:', tokenResponse.data.instance_url);
      console.log('  Issued At:', new Date(parseInt(tokenResponse.data.issued_at)).toISOString());
      
      return true;
    } else {
      console.error('❌ OAuth Token Request FAILED');
      console.error('Status:', tokenResponse.status);
      console.error('Error Response:', JSON.stringify(tokenResponse.data, null, 2));
      
      if (tokenResponse.status === 400) {
        console.error('\n💡 Common causes:');
        console.error('  • Invalid username/password combination');
        console.error('  • Security token not appended to password');
        console.error('  • Client ID/Secret mismatch');
      } else if (tokenResponse.status === 401) {
        console.error('\n💡 Possible causes:');
        console.error('  • Invalid client credentials');
        console.error('  • Expired or revoked client');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('\n💡 Possible causes:');
    console.error('  • Salesforce instance URL is incorrect');
    console.error('  • Network connectivity issue');
    console.error('  • Salesforce is down or unreachable');
    
    if (error.response) {
      console.error('\nResponse data:', error.response.data);
    }
    
    return false;
  }
}

// Run the test
testOAuthTokenRequest().then(success => {
  console.log('═'.repeat(60));
  if (success) {
    console.log('✅ TEST PASSED: OAuth token request is working!');
    process.exit(0);
  } else {
    console.log('❌ TEST FAILED: OAuth token request has issues');
    process.exit(1);
  }
});
