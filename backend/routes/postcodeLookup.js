import express from 'express';
const router = express.Router();

/**
 * @route   GET /api/postcode-lookup/:postcode
 * @desc    Lookup addresses for a UK postcode using Postcoder API
 * @access  Public
 * @note    Requires POSTCODER_API_KEY environment variable
 *          Get API key from: https://postcoder.com/
 */
router.get('/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    
    if (!postcode || !postcode.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Postcode is required' 
      });
    }

    // Use Postcoder API (https://postcoder.com/)
    const apiKey = process.env.POSTCODER_API_KEY;
    
    if (!apiKey) {
      throw new Error('POSTCODER_API_KEY not configured. Add it to your environment variables.');
    }
    
    const apiUrl = `https://ws.postcoder.com/pcw/${apiKey}/address/uk/${encodeURIComponent(postcode.trim())}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 404) {
        return res.status(404).json({ 
          success: false, 
          message: 'Postcode not found' 
        });
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid Postcoder API key');
      }
      throw new Error(`API returned status ${response.status}: ${errorBody}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No addresses found for this postcode' 
      });
    }

    // Map Postcoder format to our format
    // Postcoder returns array of address objects with properties:
    // summaryline, organisation, buildingname, premise, street, posttown, county, postcode
    const addresses = data.map((addr) => {
      // Build display address from available components
      const displayParts = [
        addr.buildingname,
        addr.premise,
        addr.street,
        addr.posttown
      ].filter(part => part);
      
      // Street address (building + premise + street)
      const streetParts = [
        addr.buildingname,
        addr.premise,
        addr.street
      ].filter(part => part);
      
      return {
        display: addr.summaryline || displayParts.join(', '),
        street: streetParts.join(', '),
        city: addr.posttown || '',
        postcode: addr.postcode || postcode.trim().toUpperCase()
      };
    });

    res.json({ 
      success: true, 
      addresses
    });
    
  } catch (error) {
    // Log full error for diagnostics
    // In non-production or when debug=1 is provided, return the error details
    if (process.env.NODE_ENV !== 'production' || req.query.debug === '1') {
      return res.status(500).json({
        success: false,
        message: 'Failed to lookup postcode. See error details.',
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }

    // Generic response for production
    res.status(500).json({ 
      success: false, 
      message: 'Failed to lookup postcode. Please try again.' 
    });
  }
});

export default router;
