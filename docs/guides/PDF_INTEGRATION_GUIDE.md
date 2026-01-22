# PDF Generation Integration Guide

## Overview
The new PDF generation system uses @react-pdf/renderer to create dynamic, conditional PDFs directly in the browser.

## Files Created

### Shared Components
- `frontend/src/components/pdf/shared/PDFStyles.js` - Reusable styles
- `frontend/src/components/pdf/shared/PDFHeader.jsx` - Header component
- `frontend/src/components/pdf/shared/PDFFooter.jsx` - Footer component
- `frontend/src/components/pdf/shared/PDFSection.jsx` - Section wrapper
- `frontend/src/components/pdf/shared/PDFRow.jsx` - Key-value row

### Conditional Sections
- `frontend/src/components/pdf/sections/TitleInsuranceSection.jsx` - Shows only if `title_insurance === 'Yes'`
- `frontend/src/components/pdf/sections/BrokerFeeSection.jsx` - Shows only if `addFeesToggle === true`

### Main PDF Documents
- `frontend/src/components/pdf/QuotePDF.jsx` - Complete Quote PDF
- `frontend/src/components/pdf/DIPPDF.jsx` - Complete DIP PDF with conditional sections

### Utility Component
- `frontend/src/components/pdf/PDFGenerator.jsx` - Wrapper with download, preview, and upload

## Integration Examples

### 1. Add to BTL Calculator

```jsx
// In BTLCalculator.jsx
import PDFGenerator from '../components/pdf/PDFGenerator';

// Inside your component, add PDF generation buttons
<div className="pdf-actions">
  <PDFGenerator 
    type="quote"
    quote={currentQuote}
    brokerSettings={brokerSettings}
  />
  
  {currentQuote.dip_status === 'Issued' && (
    <PDFGenerator 
      type="dip"
      quote={currentQuote}
      dipData={currentQuote} // DIP data is stored in the quote record
      brokerSettings={brokerSettings}
    />
  )}
</div>
```

### 2. Add to Bridging Calculator

```jsx
// In BridgingCalculator.jsx
import PDFGenerator from '../components/pdf/PDFGenerator';

// Similar implementation
<PDFGenerator 
  type="quote"
  quote={bridgeQuote}
  brokerSettings={brokerSettings}
/>
```

### 3. Add to Quote List/History

```jsx
// In QuotesList.jsx or similar
import PDFGenerator from '../components/pdf/PDFGenerator';

// In your table row actions
<PDFGenerator 
  type="quote"
  quote={quote}
  brokerSettings={quote} // If broker settings are stored in quote
  showPreview={false} // Just show download button
/>
```

### 4. Upload PDF to Supabase Storage

```jsx
import { pdf } from '@react-pdf/renderer';
import QuotePDF from './components/pdf/QuotePDF';
import { supabase } from './config/supabase';

const uploadQuotePDF = async (quote, brokerSettings) => {
  // Generate PDF blob
  const blob = await pdf(
    <QuotePDF quote={quote} brokerSettings={brokerSettings} />
  ).toBlob();
  
  // Upload to Supabase Storage
  const fileName = `quotes/${quote.id}/quote-${quote.reference_number}.pdf`;
  const { data, error } = await supabase.storage
    .from('pdfs')
    .upload(fileName, blob, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('pdfs')
    .getPublicUrl(fileName);
    
  return urlData.publicUrl;
};
```

### 5. Send PDF via Email (Backend Integration)

```javascript
// Backend route: /api/email-quote-pdf
import { renderToStream } from '@react-pdf/renderer';
import nodemailer from 'nodemailer';

router.post('/email-quote-pdf', async (req, res) => {
  const { quoteId, recipientEmail } = req.body;
  
  // Fetch quote data
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();
  
  // Note: You'd need to set up react-pdf on backend or send blob from frontend
  // Easier approach: Generate on frontend, send blob to backend
  
  const transporter = nodemailer.createTransporter({...});
  
  await transporter.sendMail({
    from: 'quotes@yourcompany.com',
    to: recipientEmail,
    subject: `Quote ${quote.reference_number}`,
    text: 'Please find attached your mortgage quote.',
    attachments: [{
      filename: `Quote-${quote.reference_number}.pdf`,
      content: pdfBlob // Sent from frontend
    }]
  });
  
  res.json({ success: true });
});
```

### 6. Preview in Modal

```jsx
import { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import QuotePDF from './components/pdf/QuotePDF';

const QuotePreviewModal = ({ quote, brokerSettings, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '90vw', height: '90vh' }}>
        <div className="modal-header">
          <h2>Quote Preview</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <PDFViewer width="100%" height="100%">
          <QuotePDF quote={quote} brokerSettings={brokerSettings} />
        </PDFViewer>
      </div>
    </div>
  );
};
```

## Conditional Rendering Examples

### Example 1: Hide Title Insurance Section

```jsx
// In QuotePDF.jsx - Already implemented
<TitleInsuranceSection 
  titleInsurance={quote.title_insurance}
  titleInsuranceData={quote.title_insurance_data}
/>

// Only renders if quote.title_insurance === 'Yes'
```

### Example 2: Show Different Content for BTL vs Bridging

```jsx
// Already implemented in QuotePDF.jsx
const isBTL = quote.calculator_type === 'BTL';
const isBridging = quote.calculator_type === 'BRIDGING';

{isBTL && (
  <>
    <PDFRow label="Monthly Rent" value={formatCurrency(quote.monthly_rent)} currency />
    <PDFRow label="Target LTV" value={`${quote.target_ltv}%`} />
  </>
)}

{isBridging && (
  <>
    <PDFRow label="Bridging Term" value={`${quote.bridging_loan_term} months`} />
    <PDFRow label="Charge Type" value={quote.charge_type} />
  </>
)}
```

### Example 3: Conditional Warning Messages

```jsx
// In DIPPDF.jsx
<PDFSection title="Important Notices">
  {dipData.product_range === 'specialist' && (
    <View style={styles.warningBox}>
      <Text style={styles.warningText}>
        Specialist product - Additional underwriting criteria apply
      </Text>
    </View>
  )}
  
  {quote.ltv > 75 && (
    <View style={styles.warningBox}>
      <Text style={styles.warningText}>
        High LTV - Additional documentation required
      </Text>
    </View>
  )}
</PDFSection>
```

### Example 4: Dynamic Fee Table

```jsx
// Add to QuotePDF.jsx or DIPPDF.jsx
const calculateTotalFees = () => {
  let total = Number(quote.arrangement_fee || 0);
  
  if (brokerSettings.addFeesToggle && brokerSettings.additionalFeeAmount) {
    if (brokerSettings.feeCalculationType === 'pound') {
      total += Number(brokerSettings.additionalFeeAmount);
    } else {
      // Calculate percentage of loan
      total += (Number(quote.gross_loan) * Number(brokerSettings.additionalFeeAmount)) / 100;
    }
  }
  
  if (quote.title_insurance === 'Yes' && quote.title_insurance_data?.premium) {
    total += Number(quote.title_insurance_data.premium);
  }
  
  return total;
};

<PDFSection title="Total Fees Summary">
  <PDFRow label="Lender Fees" value={formatCurrency(quote.arrangement_fee)} />
  
  {brokerSettings.addFeesToggle && (
    <PDFRow label="Broker Fee" value={formatCurrency(brokerFeeAmount)} />
  )}
  
  {quote.title_insurance === 'Yes' && (
    <PDFRow label="Title Insurance" value={formatCurrency(titleInsurancePremium)} />
  )}
  
  <View style={styles.mt10}>
    <PDFRow label="TOTAL" value={formatCurrency(calculateTotalFees())} />
  </View>
</PDFSection>
```

## Testing the PDFs

### 1. Test in Development
```bash
# Start your frontend dev server
cd frontend
npm run dev

# Navigate to calculator
# Use the PDF buttons to test download and preview
```

### 2. Test Different Scenarios

Create test quotes with:
- ✅ Title insurance = Yes
- ✅ Title insurance = No
- ✅ Broker fees enabled
- ✅ Broker fees disabled
- ✅ BTL vs Bridging
- ✅ Core vs Specialist
- ✅ Different property types
- ✅ With/without guarantor

### 3. Check Conditional Rendering

Verify sections appear/disappear based on:
- Title insurance selection
- Broker fee toggle
- Calculator type
- Product range
- DIP status

## Customization

### Add New Conditional Section

1. Create new section component:
```jsx
// frontend/src/components/pdf/sections/GuarantorSection.jsx
const GuarantorSection = ({ guarantorName, guarantorDetails }) => {
  if (!guarantorName) return null;
  
  return (
    <PDFSection title="Guarantor Information">
      <PDFRow label="Name" value={guarantorName} />
      {/* Add more fields */}
    </PDFSection>
  );
};
```

2. Import and use in QuotePDF or DIPPDF:
```jsx
import GuarantorSection from './sections/GuarantorSection';

<GuarantorSection 
  guarantorName={quote.guarantor_name}
  guarantorDetails={quote.guarantor_details}
/>
```

### Modify Styles

Edit `PDFStyles.js` to change colors, fonts, spacing:
```javascript
export const styles = StyleSheet.create({
  // Change primary color
  title: {
    color: '#your-brand-color',
  },
  
  // Add company logo
  logo: {
    width: 100,
    height: 50,
    marginBottom: 10,
  },
});
```

### Add Company Logo

```jsx
// In PDFHeader.jsx
import { Image } from '@react-pdf/renderer';

<View style={styles.header}>
  <Image 
    src="/path/to/logo.png" 
    style={styles.logo}
  />
  <Text style={styles.title}>{title}</Text>
</View>
```

## Migration from Backend PDF

### Current Backend Approach
- Uses PDFKit on backend
- Server-side generation
- Sends PDF as response

### New Frontend Approach
- Uses @react-pdf/renderer
- Client-side generation
- Better performance
- Instant preview

### Keeping Both (Hybrid)
You can keep the backend for:
- Email generation
- Automated reports
- Server-side archiving

And use frontend for:
- User downloads
- Interactive previews
- Conditional generation

## Next Steps

1. ✅ Install @react-pdf/renderer (Done)
2. ✅ Create PDF components (Done)
3. ⏳ Integrate into BTL Calculator
4. ⏳ Integrate into Bridging Calculator
5. ⏳ Add to Quote List actions
6. ⏳ Test all conditional scenarios
7. ⏳ Add company branding/logo
8. ⏳ Set up Supabase Storage for PDF archiving
9. ⏳ Implement email functionality
10. ⏳ Update DIP modal to use new PDF

## Support

For issues or questions:
- Check @react-pdf/renderer docs: https://react-pdf.org/
- Review conditional rendering patterns in QuotePDF.jsx
- Test with different quote data structures
