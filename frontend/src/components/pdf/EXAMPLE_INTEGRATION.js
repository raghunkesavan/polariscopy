/**
 * Example: Replace Backend PDF Generation with Frontend React-PDF
 * 
 * This file shows how to update your existing BTL_Calculator.jsx
 * to use the new frontend PDF generation instead of backend API calls
 */

// ========================================
// BEFORE (Current Implementation)
// ========================================

// In BTL_Calculator.jsx (Lines 865-883)
const handleCreatePDF_OLD = async (quoteId) => {
  try {
    const response = await requestDipPdf(quoteId, token);
    
    // Download the PDF
    const url = window.URL.createObjectURL(response);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIP_${quoteId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    showToast({ kind: 'success', title: 'DIP PDF created successfully' });
  } catch (err) {
    showToast({ kind: 'error', title: 'Failed to create DIP PDF', subtitle: err.message });
  }
};

// ========================================
// AFTER (New Frontend Implementation)
// ========================================

// 1. Add imports at top of BTL_Calculator.jsx
import { pdf } from '@react-pdf/renderer';
import DIPPDF from '../pdf/DIPPDF';
import QuotePDF from '../pdf/QuotePDF';

// 2. Replace handleCreatePDF function
const handleCreatePDF_NEW = async (quoteId) => {
  try {
    // Get the quote data (you probably already have this in state)
    const quote = currentQuote; // or fetch if needed
    const brokerData = brokerSettings.getAllSettings();
    
    // Generate PDF blob
    const blob = await pdf(
      <DIPPDF 
        quote={quote} 
        dipData={quote} // DIP data is in quote object
        brokerSettings={brokerData}
      />
    ).toBlob();
    
    // Download the PDF
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIP_${quote.reference_number || quoteId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    showToast({ kind: 'success', title: 'DIP PDF created successfully' });
  } catch (err) {
    showToast({ kind: 'error', title: 'Failed to create DIP PDF', subtitle: err.message });
  }
};

// 3. Replace handleCreateQuotePDF function
const handleCreateQuotePDF_NEW = async (quoteId) => {
  try {
    const quote = currentQuote;
    const brokerData = brokerSettings.getAllSettings();
    
    // Generate PDF blob
    const blob = await pdf(
      <QuotePDF 
        quote={quote} 
        brokerSettings={brokerData}
      />
    ).toBlob();
    
    // Download the PDF
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote_${quote.reference_number || quoteId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    showToast({ kind: 'success', title: 'Quote PDF created successfully' });
  } catch (error) {
    showToast({ kind: 'error', title: 'Failed to create Quote PDF', subtitle: error.message });
  }
};

// ========================================
// ALTERNATIVE: Using PDFGenerator Component
// ========================================

// Even simpler - just add this in your JSX where you want PDF buttons:

import PDFGenerator from '../pdf/PDFGenerator';

// In your component JSX:
<PDFGenerator 
  type="quote"
  quote={currentQuote}
  brokerSettings={brokerSettings.getAllSettings()}
/>

<PDFGenerator 
  type="dip"
  quote={currentQuote}
  dipData={currentQuote}
  brokerSettings={brokerSettings.getAllSettings()}
/>

// ========================================
// ADVANCED: Preview Before Download
// ========================================

// Add state for preview
const [pdfPreview, setPdfPreview] = useState({ open: false, type: null });

// Handler to show preview
const handlePreviewPDF = (type) => {
  setPdfPreview({ open: true, type });
};

// In your JSX, add preview modal
{pdfPreview.open && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
    padding: 20
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <h2 style={{ color: 'white' }}>PDF Preview</h2>
      <button onClick={() => setPdfPreview({ open: false, type: null })}>
        Close
      </button>
    </div>
    <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 4 }}>
      <PDFViewer width="100%" height="100%">
        {pdfPreview.type === 'dip' ? (
          <DIPPDF 
            quote={currentQuote} 
            dipData={currentQuote}
            brokerSettings={brokerSettings.getAllSettings()}
          />
        ) : (
          <QuotePDF 
            quote={currentQuote} 
            brokerSettings={brokerSettings.getAllSettings()}
          />
        )}
      </PDFViewer>
    </div>
  </div>
)}

// ========================================
// BENEFITS OF NEW APPROACH
// ========================================

/**
 * ✅ Instant preview - no server round-trip
 * ✅ Conditional sections work automatically
 * ✅ No backend load
 * ✅ Easy to customize
 * ✅ React components - familiar syntax
 * ✅ Client-side generation
 * ✅ Better error handling
 * ✅ Works offline
 */

// ========================================
// MIGRATION CHECKLIST
// ========================================

/**
 * 1. ✅ Install @react-pdf/renderer (Done)
 * 2. ✅ Create PDF components (Done)
 * 3. ⏳ Update BTL_Calculator.jsx:
 *    - Import pdf, DIPPDF, QuotePDF
 *    - Replace handleCreatePDF
 *    - Replace handleCreateQuotePDF
 * 4. ⏳ Update Bridging_Calculator.jsx (similar changes)
 * 5. ⏳ Test all PDF scenarios
 * 6. ⏳ Optional: Keep backend as backup or for email generation
 */

export default {
  handleCreatePDF_NEW,
  handleCreateQuotePDF_NEW,
  handlePreviewPDF
};
