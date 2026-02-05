/**
 * Test Script: Simulate Salesforce Canvas Signed Request
 * This mimics what Salesforce sends to your backend
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

const CANVAS_CONSUMER_SECRET = process.env.CANVAS_CONSUMER_SECRET || '834B749C07C792E815A8DABD22D52F4381C0E25187AA55345CA5FB010DAAB74B';
const BACKEND_URL = 'http://localhost:3001/api/canvas';

// Mock Canvas envelope (what Salesforce sends)
const mockEnvelope = {
  algorithm: 'HMACSHA256',
  issuedAt: Date.now(),
  client: {
    oauthToken: 'mock_oauth_token_12345',
    instanceUrl: 'https://mfsuk--dev.sandbox.my.salesforce.com',
    targetOrigin: 'https://mfsuk--dev.sandbox.lightning.force.com',
    instanceId: 'instance123'
  },
  context: {
    user: {
      userId: '0051t000000TestUser',
      userName: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      fullName: 'Test User',
      locale: 'en_US',
      language: 'en_US',
      timeZone: 'America/Los_Angeles'
    },
    organization: {
      organizationId: '00D1t000000TestOrg',
      name: 'Test Organization',
      currency: 'USD'
    },
    environment: {
      locationUrl: 'https://mfsuk--dev.sandbox.lightning.force.com',
      displayLocation: 'Visualforce',
      parameters: {
        // ✅ YOUR CANVAS PARAMETERS GO HERE
        productType: 'BTL',
        propertyType: 'Residential',
        recordId: 'a001t00000TestRecord',
        userId: 'test-user-123',
        customParam1: 'value1',
        customParam2: 'value2'
      }
    }
  }
};

// Create signed request (like Salesforce does)
function createSignedRequest(envelope, secret) {
  const encodedEnvelope = Buffer.from(JSON.stringify(envelope)).toString('base64');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedEnvelope)
    .digest('base64');
  
  return `${signature}.${encodedEnvelope}`;
}

// Test the backend endpoint
async function testCanvasEndpoint() {
  try {
    console.log('🧪 Testing Canvas Signed Request...\n');
    console.log('📋 Mock Canvas Parameters:');
    console.log(JSON.stringify(mockEnvelope.context.environment.parameters, null, 2));
    console.log('\n' + '─'.repeat(60) + '\n');

    const signedRequest = createSignedRequest(mockEnvelope, CANVAS_CONSUMER_SECRET);
    
    console.log('🔐 Signed Request Created (first 50 chars):');
    console.log(signedRequest.substring(0, 50) + '...\n');

    console.log('📤 Sending POST to:', BACKEND_URL);
    console.log('─'.repeat(60));

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signed_request: signedRequest
      })
    });

    const data = await response.json();

    console.log('\n✅ Backend Response Status:', response.status);
    console.log('─'.repeat(60));
    console.log('📦 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n🎉 SUCCESS! Parameters received:');
      console.log(JSON.stringify(data.canvasParameters, null, 2));
    } else {
      console.log('\n❌ FAILED:', data.error);
    }

  } catch (error) {
    console.error('\n❌ Error testing endpoint:', error.message);
  }
}

// Run the test
testCanvasEndpoint();
