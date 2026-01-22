import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import PDFHeader from './shared/PDFHeader';
import PDFFooter from './shared/PDFFooter';
import PDFSection from './shared/PDFSection';
import PDFRow from './shared/PDFRow';
import TitleInsuranceSection from './sections/TitleInsuranceSection';
import BrokerFeeSection from './sections/BrokerFeeSection';
import * as DIPHelpers from './utils/dipHelpers';
import BTLDIPPDF from './BTLDIPPDF';
import BridgingDIPPDF from './BridgingDIPPDF';

const DIPPDF = ({ quote, dipData, brokerSettings = {} }) => {
  // Normalize calculator_type to handle both 'BTL' and 'btl' cases
  const calcType = (quote.calculator_type || '').toUpperCase();
  const isBTL = calcType === 'BTL';
  const isBridging = calcType === 'BRIDGING' || calcType === 'BRIDGE';
  
  // Use specialized BTL DIP PDF for BTL quotes (matches Excel DIP sheet)
  if (isBTL) {
    return <BTLDIPPDF quote={quote} dipData={dipData} brokerSettings={brokerSettings} />;
  }
  
  // Use specialized Bridging DIP PDF for Bridging quotes (matches Excel DIP/Fusion DIP sheets)
  if (isBridging) {
    return <BridgingDIPPDF quote={quote} dipData={dipData} brokerSettings={brokerSettings} />;
  }
  
  // Use helper functions for complex logic
  const borrowerName = DIPHelpers.getBorrowerName(quote, brokerSettings);
  const productType = DIPHelpers.getProductTypeDescription(quote);
  const loanTerm = DIPHelpers.getLoanTermDescription(quote, dipData);
  const securityProperties = DIPHelpers.formatSecurityProperties(dipData);
  const totalAdvance = DIPHelpers.calculateTotalAdvance(quote);
  const netLoan = DIPHelpers.calculateNetLoan(quote);
  const ltv = DIPHelpers.calculateLTV(quote);
  const interestRateDesc = DIPHelpers.getInterestRateDescription(quote, dipData);
  const paymentTypeDesc = DIPHelpers.getPaymentTypeDescription(quote);
  const fundingLine = DIPHelpers.getFundingLineDescription(dipData);
  const propertyUsage = DIPHelpers.getPropertyUsageDescription(dipData);
  const applicantsText = DIPHelpers.getApplicantsText(dipData);
  const overpaymentTerms = DIPHelpers.getOverpaymentTerms(dipData);
  const arrangementFee = DIPHelpers.getArrangementFee(quote, dipData);
  const exitFeeDesc = DIPHelpers.getExitFeeDescription(quote);
  const specialConditions = DIPHelpers.getSpecialConditions(quote, dipData, brokerSettings);
  
  const formatCurrency = DIPHelpers.formatCurrency;
  const formatDate = DIPHelpers.formatDate;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader
          title="Decision in Principle"
          subtitle={`${quote.calculator_type || ''} Mortgage Application`}
          referenceNumber={quote.reference_number}
        />

        {/* Proposed Loan To */}
        <PDFSection title="Proposed Loan To">
          <Text style={styles.value}>{borrowerName}</Text>
          {dipData.number_of_applicants && (
            <Text style={styles.text}>{applicantsText}</Text>
          )}
        </PDFSection>

        {/* Security Property */}
        {securityProperties && securityProperties.length > 0 && (
          <PDFSection title="Security Property">
            {securityProperties.map((property) => (
              <View key={property.number} style={styles.mb10}>
                <Text style={styles.label}>Property {property.number}:</Text>
                <Text style={styles.value}>{property.address}</Text>
              </View>
            ))}
          </PDFSection>
        )}

        {/* DIP Status and Validity */}
        <PDFSection title="DIP Status">
          <PDFRow label="Status" value={dipData.dip_status || 'Issued'} />
          <PDFRow label="Issue Date" value={formatDate(dipData.dip_date)} />
          <PDFRow label="Expiry Date" value={formatDate(dipData.dip_expiry_date)} />
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              This Decision in Principle is valid until {formatDate(dipData.dip_expiry_date)} and is subject to full underwriting, satisfactory valuation, and receipt of all required documentation.
            </Text>
          </View>
        </PDFSection>

        {/* Summary Section */}
        <PDFSection title="Summary">
          <PDFRow label="Borrower" value={borrowerName} />
          <PDFRow label="Product Type" value={productType} />
          <PDFRow label="Loan Term" value={loanTerm} />
          <PDFRow label="Funding Line" value={fundingLine} />
          <PDFRow label="Property Usage" value={propertyUsage} />
        </PDFSection>

        {/* Loan Details */}
        <PDFSection title="Loan Details">
          <PDFRow label="Total Advance (Gross Loan)" value={formatCurrency(totalAdvance)} />
          <PDFRow label="Net Loan (After Fees)" value={formatCurrency(netLoan)} />
          <PDFRow label="Property Value" value={formatCurrency(quote.property_value)} />
          <PDFRow label="Loan to Value (LTV)" value={`${ltv}%`} />
          
          {isBTL && quote.monthly_rent && (
            <PDFRow label="Monthly Rental Income" value={formatCurrency(quote.monthly_rent)} />
          )}
          
          {quote.top_slicing && Number(quote.top_slicing) > 0 && (
            <PDFRow label="Top Slicing Applied" value={formatCurrency(quote.top_slicing)} />
          )}
        </PDFSection>

        {/* Interest Rate and Payment Details */}
        <PDFSection title="Interest Rate & Payment">
          <PDFRow label="Rate Type" value={interestRateDesc} />
          {quote.actual_rate && (
            <PDFRow label="Interest Rate" value={`${quote.actual_rate}%`} />
          )}
          <PDFRow label="Payment Type" value={paymentTypeDesc} />
          {dipData.overpayments_percent && (
            <View style={styles.mt10}>
              <Text style={styles.text}>{overpaymentTerms}</Text>
            </View>
          )}
        </PDFSection>

        {/* Fee Structure */}
        <PDFSection title="Fees">
          <PDFRow label="Arrangement Fee" value={formatCurrency(arrangementFee)} />
          {dipData.lender_legal_fee && (
            <PDFRow label="Lender Legal Fee" value={dipData.lender_legal_fee} />
          )}
          {isBridging && (
            <>
              <PDFRow label="Exit Fee" value={exitFeeDesc} />
              <PDFRow label="Valuation Fee" value="To be confirmed" />
            </>
          )}
        </PDFSection>

        {/* Title Insurance Section - Conditional */}
        <TitleInsuranceSection 
          titleInsurance={quote.title_insurance}
          titleInsuranceData={quote.title_insurance_data}
        />

        {/* Broker Information - Only if broker */}
        {brokerSettings.clientType === 'Broker' && (
          <PDFSection title="Broker Information">
            {brokerSettings.brokerCompanyName && (
              <PDFRow label="Company" value={brokerSettings.brokerCompanyName} />
            )}
            {brokerSettings.brokerRoute && (
              <PDFRow label="Route" value={brokerSettings.brokerRoute} />
            )}
            {brokerSettings.brokerCommissionPercent && (
              <PDFRow label="Commission" value={`${brokerSettings.brokerCommissionPercent}%`} />
            )}
          </PDFSection>
        )}

        {/* Broker Fee Section - Conditional */}
        <BrokerFeeSection 
          brokerSettings={brokerSettings}
          quote={quote}
        />

        {/* Guarantor Information - Conditional */}
        {DIPHelpers.hasGuarantor(dipData) && (
          <PDFSection title="Guarantor Information">
            <PDFRow label="Guarantor Name" value={dipData.guarantor_name} />
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Guarantor must provide full financial disclosure and undergo credit assessment. 
                Guarantor agreement documentation will be required prior to completion.
              </Text>
            </View>
          </PDFSection>
        )}

        {/* Special Conditions */}
        {specialConditions.length > 0 && (
          <PDFSection title="Special Conditions">
            {specialConditions.map((condition, index) => (
              <Text key={index} style={styles.text}>
                • {condition}
              </Text>
            ))}
          </PDFSection>
        )}

        {/* Standard Terms & Conditions */}
        <PDFSection title="Terms & Conditions">
          <Text style={styles.text}>
            • This DIP is valid until {formatDate(dipData.dip_expiry_date)}
          </Text>
          <Text style={styles.text}>
            • Full application and supporting documentation required within 14 days
          </Text>
          <Text style={styles.text}>
            • Subject to satisfactory credit checks and underwriting review
          </Text>
          <Text style={styles.text}>
            • Subject to acceptable property valuation
          </Text>
          <Text style={styles.text}>
            • Subject to proof of income and deposit source
          </Text>
          {isBTL && (
            <Text style={styles.text}>
              • Rental income must be verified via tenancy agreement or estate agent letter
            </Text>
          )}
          {isBridging && (
            <>
              <Text style={styles.text}>
                • Exit strategy must be confirmed and documented
              </Text>
              <Text style={styles.text}>
                • Monthly monitoring fee applies throughout the loan term
              </Text>
            </>
          )}
        </PDFSection>

        {/* Important Notice */}
        <View style={styles.warningBox}>
          <Text style={[styles.warningText, { fontWeight: 'bold', marginBottom: 5 }]}>
            IMPORTANT NOTICE
          </Text>
          <Text style={styles.warningText}>
            This Decision in Principle does not constitute a formal mortgage offer. It is an indication 
            that a loan may be available subject to full underwriting assessment. All information provided 
            must be verified, and a satisfactory valuation of the security property must be obtained. 
            Terms and conditions are subject to change based on the full application review.
          </Text>
          <Text style={[styles.warningText, { marginTop: 5 }]}>
            You should not commit to any purchases or make financial arrangements based solely on this DIP 
            until a formal mortgage offer has been issued.
          </Text>
        </View>

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
};

export default DIPPDF;
