// Quick test script for postcode lookup
const testPostcodeLookup = async () => {
  try {
    const postcode = 'KT34NX';
    const apiUrl = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`;
    
    console.log('📍 Testing URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    console.log('📡 Response status:', response.status);
    
    const text = await response.text();
    console.log('📄 Response body (first 500 chars):', text.substring(0, 500));
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ Parsed data:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Error response');
    }
  } catch (error) {
    console.error('💥 Exception:', error.message);
    console.error('Stack:', error.stack);
  }
};

testPostcodeLookup();
