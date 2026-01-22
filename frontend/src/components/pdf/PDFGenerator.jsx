import React, { useState } from 'react';
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import QuotePDF from './QuotePDF';
import DIPPDF from './DIPPDF';

/**
 * PDF Generator Component
 * Provides download link, preview, and blob generation for Quote and DIP PDFs
 */
const PDFGenerator = ({ 
  type = 'quote', // 'quote' or 'dip'
  quote, 
  dipData = {}, 
  brokerSettings = {},
  showPreview = false,
  onGenerated 
}) => {
  const [previewOpen, setPreviewOpen] = useState(showPreview);

  const PDFComponent = type === 'dip' 
    ? <DIPPDF quote={quote} dipData={dipData} brokerSettings={brokerSettings} />
    : <QuotePDF quote={quote} brokerSettings={brokerSettings} />;

  const fileName = type === 'dip'
    ? `DIP-${quote.reference_number || quote.id}.pdf`
    : `Quote-${quote.reference_number || quote.id}.pdf`;

  // Generate PDF as blob (useful for uploading to backend/Supabase)
  const generateBlob = async () => {
    try {
      const blob = await pdf(PDFComponent).toBlob();
      if (onGenerated) {
        onGenerated(blob);
      }
      return blob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      throw error;
    }
  };

  return (
    <div className="pdf-generator">
      {/* Download Link */}
      <PDFDownloadLink 
        document={PDFComponent}
        fileName={fileName}
        className="slds-button slds-button_brand"
      >
        {({ loading, error }) => {
          if (error) return 'Error generating PDF';
          return loading ? 'Generating PDF...' : `Download ${type === 'dip' ? 'DIP' : 'Quote'} PDF`;
        }}
      </PDFDownloadLink>

      {/* Preview Button */}
      <button
        className="slds-button slds-button_neutral"
        onClick={() => setPreviewOpen(!previewOpen)}
        style={{ marginLeft: '8px' }}
      >
        {previewOpen ? 'Close Preview' : 'Preview PDF'}
      </button>

      {/* Generate Blob Button (for server upload) */}
      <button
        className="slds-button slds-button_neutral"
        onClick={generateBlob}
        style={{ marginLeft: '8px' }}
      >
        Generate & Upload
      </button>

      {/* Preview Modal/Panel */}
      {previewOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            color: 'white'
          }}>
            <h2>PDF Preview</h2>
            <button 
              className="slds-button slds-button_destructive"
              onClick={() => setPreviewOpen(false)}
            >
              Close Preview
            </button>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden' }}>
            <PDFViewer width="100%" height="100%">
              {PDFComponent}
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFGenerator;

/**
 * Usage Examples:
 * 
 * 1. Simple Download Link:
 * <PDFGenerator 
 *   type="quote" 
 *   quote={quoteData} 
 *   brokerSettings={brokerSettings} 
 * />
 * 
 * 2. DIP with Preview:
 * <PDFGenerator 
 *   type="dip" 
 *   quote={quoteData} 
 *   dipData={dipData}
 *   brokerSettings={brokerSettings}
 *   showPreview={true}
 * />
 * 
 * 3. Generate and Upload to Server:
 * <PDFGenerator 
 *   type="quote" 
 *   quote={quoteData} 
 *   brokerSettings={brokerSettings}
 *   onGenerated={async (blob) => {
 *     const formData = new FormData();
 *     formData.append('pdf', blob, 'quote.pdf');
 *     await fetch('/api/upload-pdf', { method: 'POST', body: formData });
 *   }}
 * />
 */
