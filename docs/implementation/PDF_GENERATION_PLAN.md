# PDF Generation Implementation Plan

## Recommended Solution: @react-pdf/renderer

### Why This Approach?
- **Conditional rendering** using React logic (if/else, ternary, &&)
- **Component-based** structure for reusability
- **Professional output** with proper fonts, tables, and layouts
- **Easy maintenance** compared to canvas drawing
- **Automatic pagination** and page breaks

## Installation

```powershell
cd frontend
npm install @react-pdf/renderer
```

## Architecture

### 1. PDF Document Structure

```
frontend/src/components/pdf/
├── QuotePDF.jsx           # Main Quote PDF document
├── DIPPDF.jsx             # Main DIP PDF document
├── shared/
│   ├── PDFHeader.jsx      # Reusable header component
│   ├── PDFFooter.jsx      # Reusable footer component
│   ├── PDFTable.jsx       # Reusable table component
│   └── PDFSection.jsx     # Reusable section wrapper
└── sections/
    ├── TitleInsuranceSection.jsx    # Conditional section
    ├── BrokerFeeSection.jsx         # Conditional section
    ├── PropertyDetailsSection.jsx   # Standard section
    └── ConditionsSection.jsx        # Conditional section
```

### 2. Example Implementation

#### QuotePDF.jsx
```jsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFHeader from './shared/PDFHeader';
import TitleInsuranceSection from './sections/TitleInsuranceSection';
import BrokerFeeSection from './sections/BrokerFeeSection';

const QuotePDF = ({ quoteData, calculatorData, brokerSettings }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PDFHeader 
        title="Mortgage Quote"
        referenceNumber={quoteData.reference_number}
      />
      
      {/* Property Details - Always show */}
      <View style={styles.section}>
        <Text style={styles.heading}>Property Details</Text>
        <Text>Purchase Price: £{calculatorData.purchasePrice}</Text>
        <Text>Loan Amount: £{calculatorData.loanAmount}</Text>
      </View>

      {/* Title Insurance - Conditional */}
      {quoteData.title_insurance === 'Yes' && (
        <TitleInsuranceSection data={quoteData.title_insurance_data} />
      )}

      {/* Broker Fee - Conditional */}
      {brokerSettings.addFeesToggle && brokerSettings.additionalFeeAmount && (
        <BrokerFeeSection 
          feeType={brokerSettings.feeCalculationType}
          amount={brokerSettings.additionalFeeAmount}
        />
      )}

      {/* Conditions - Dynamic based on selections */}
      <View style={styles.section}>
        <Text style={styles.heading}>Terms & Conditions</Text>
        {quoteData.property_type === 'HMO' && (
          <Text>• HMO-specific conditions apply</Text>
        )}
        {calculatorData.loanType === 'BTL' && (
          <Text>• Buy-to-Let specific terms</Text>
        )}
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  section: { marginBottom: 15 },
  heading: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 }
});
```

#### TitleInsuranceSection.jsx (Conditional Component)
```jsx
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const TitleInsuranceSection = ({ data }) => (
  <View style={styles.section}>
    <Text style={styles.heading}>Title Insurance</Text>
    <Text>Provider: {data.provider}</Text>
    <Text>Premium: £{data.premium}</Text>
    <Text>Coverage: £{data.coverage}</Text>
    {data.excessAmount && (
      <Text>Excess: £{data.excessAmount}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: 15, padding: 10, backgroundColor: '#f5f5f5' },
  heading: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 }
});

export default TitleInsuranceSection;
```

### 3. Usage in Your Application

```jsx
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import QuotePDF from './components/pdf/QuotePDF';

// Option 1: Download Link
<PDFDownloadLink 
  document={<QuotePDF quoteData={quote} calculatorData={inputs} brokerSettings={broker} />}
  fileName={`quote-${quote.reference_number}.pdf`}
>
  {({ loading }) => loading ? 'Generating PDF...' : 'Download Quote PDF'}
</PDFDownloadLink>

// Option 2: Preview in Browser
<PDFViewer width="100%" height="600px">
  <QuotePDF quoteData={quote} calculatorData={inputs} brokerSettings={broker} />
</PDFViewer>

// Option 3: Generate Blob (for API upload)
const generatePDFBlob = async () => {
  const blob = await pdf(
    <QuotePDF quoteData={quote} calculatorData={inputs} brokerSettings={broker} />
  ).toBlob();
  return blob;
};
```

### 4. DIP PDF Conditional Logic Examples

```jsx
const DIPPDF = ({ dipData, quoteData, brokerSettings }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Section 1: Always visible */}
      <PropertySection data={dipData.property} />

      {/* Section 2: Show only if title insurance selected */}
      {dipData.titleInsurance === 'Yes' && (
        <TitleInsuranceSection {...dipData.titleInsuranceDetails} />
      )}

      {/* Section 3: Show only if broker has additional fees */}
      {brokerSettings.addFeesToggle && (
        <View style={styles.section}>
          <Text style={styles.heading}>Additional Broker Fees</Text>
          <Text>
            Fee Type: {brokerSettings.feeCalculationType === 'pound' ? 'Fixed Amount' : 'Percentage'}
          </Text>
          <Text>
            Amount: {brokerSettings.feeCalculationType === 'pound' 
              ? `£${brokerSettings.additionalFeeAmount}`
              : `${brokerSettings.additionalFeeAmount}%`}
          </Text>
        </View>
      )}

      {/* Section 4: Conditional text based on property type */}
      <View style={styles.section}>
        <Text style={styles.heading}>Special Conditions</Text>
        {dipData.propertyType === 'HMO' && (
          <>
            <Text>• HMO License required</Text>
            <Text>• Minimum 5 tenants</Text>
          </>
        )}
        {dipData.bridgingType === 'Regulated' && (
          <Text>• FCA regulated bridging loan</Text>
        )}
      </View>

      {/* Section 5: Dynamic fee breakdown */}
      <View style={styles.section}>
        <Text style={styles.heading}>Fee Breakdown</Text>
        {dipData.fees.map((fee, idx) => (
          <View key={idx} style={styles.row}>
            <Text>{fee.name}</Text>
            <Text>£{fee.amount}</Text>
          </View>
        ))}
        {brokerSettings.addFeesToggle && (
          <View style={styles.row}>
            <Text>Broker Fee</Text>
            <Text>
              {brokerSettings.feeCalculationType === 'pound'
                ? `£${brokerSettings.additionalFeeAmount}`
                : `${brokerSettings.additionalFeeAmount}% of loan`}
            </Text>
          </View>
        )}
      </View>

    </Page>
  </Document>
);
```

## Key Benefits for Your Use Case

### 1. **Easy Conditional Rendering**
```jsx
{condition && <Component />}
{value ? <OptionA /> : <OptionB />}
{array.map(item => <Row key={item.id} data={item} />)}
```

### 2. **Complex Logic Support**
```jsx
{(() => {
  if (titleInsurance === 'Yes' && provider === 'Company A') {
    return <FullCoverageSection />;
  } else if (titleInsurance === 'Yes') {
    return <BasicCoverageSection />;
  }
  return null;
})()}
```

### 3. **Reusable Components**
Create once, use in both Quote and DIP PDFs

### 4. **Dynamic Tables**
```jsx
<View style={styles.table}>
  <View style={styles.tableRow}>
    <Text style={styles.tableCol}>Description</Text>
    <Text style={styles.tableCol}>Amount</Text>
  </View>
  {fees.map((fee, i) => (
    <View key={i} style={styles.tableRow}>
      <Text style={styles.tableCol}>{fee.description}</Text>
      <Text style={styles.tableCol}>£{fee.amount}</Text>
    </View>
  ))}
</View>
```

## Alternative: HTML Canvas Approach (Not Recommended)

If you insist on canvas:
1. Use **jsPDF** library with **html2canvas**
2. Render HTML template with React conditionals
3. Convert to canvas, then to PDF
4. **Downsides**: Lower quality, harder to maintain, pixel-based

## Migration from Current Backend PDF Generation

Your current setup uses backend PDF generation (quotePdf.js). With react-pdf:

**Option A: Frontend Only**
- Generate PDFs entirely in browser
- Better for user experience (instant preview)
- No server load

**Option B: Hybrid**
- Keep backend for email/storage
- Use react-pdf on frontend for preview
- Send PDF blob to backend when saving

**Option C: Backend with react-pdf**
- Use react-pdf on Node.js backend
- Requires additional setup but possible
- Keep centralized PDF generation

## Next Steps

1. Install @react-pdf/renderer
2. Create basic QuotePDF component with your current data
3. Add conditional sections one by one
4. Test with various input combinations
5. Add styling and branding
6. Integrate download/preview functionality

## Resources

- Docs: https://react-pdf.org/
- Examples: https://react-pdf.org/repl
- Styling: https://react-pdf.org/styling
- Advanced: https://react-pdf.org/advanced
