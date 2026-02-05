#!/usr/bin/env node

/**
 * Canvas API Test Script
 * Tests the Canvas endpoint with sample data
 * 
 * Usage: node test-canvas.js [backend_url]
 * Example: node test-canvas.js http://localhost:3001
 */

const backendUrl = process.argv[2] || 'http://localhost:3001';
const canvasEndpoint = `${backendUrl}/api/canvas`;

console.log('🧪 Canvas API Test\n');
console.log(`📍 Backend URL: ${backendUrl}`);
console.log(`🔗 Canvas Endpoint: ${canvasEndpoint}\n`);

// Test 1: Health check (GET)
async function testHealthCheck() {
  console.log('Test 1: Health Check (GET /api/canvas)');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch(canvasEndpoint, { method: 'GET' });
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    console.log('');
    return false;
  }
}

// Test 2: Canvas Context (POST with development format)
async function testCanvasContext() {
  console.log('Test 2: Canvas Context (POST with development format)');
  console.log('─'.repeat(50));
  
  const payload = {
    type: 'canvas_context',
    data: {
      recordId: 'a12345678901234',
      action: 'view',
      userId: 'user123',
      environment: 'development'
    },
    timestamp: new Date().toISOString()
  };

  console.log('Request Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  
  try {
    const response = await fetch(canvasEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    console.log('');
    return false;
  }
}

// Test 3: Invalid Request (Missing data)
async function testInvalidRequest() {
  console.log('Test 3: Invalid Request (Missing signed_request)');
  console.log('─'.repeat(50));
  
  const payload = {
    data: null
  };

  console.log('Request Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  
  try {
    const response = await fetch(canvasEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status} (Expected error)`);
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    return response.status === 400;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    console.log('');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testCanvasContext());
  results.push(await testInvalidRequest());
  
  // Summary
  console.log('📊 Test Summary');
  console.log('═'.repeat(50));
  const passed = results.filter(r => r).length;
  console.log(`Passed: ${passed}/${results.length}`);
  
  if (passed === results.length) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runAllTests();
