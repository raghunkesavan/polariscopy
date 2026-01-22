import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import PDFHeader from './shared/PDFHeader';
import PDFFooter from './shared/PDFFooter';
import PDFSection from './shared/PDFSection';
import PDFRow from './shared/PDFRow';
import TitleInsuranceSection from './sections/TitleInsuranceSection';
import BrokerFeeSection from './sections/BrokerFeeSection';

const QuotePDF = ({ quote, brokerSettings = {} }) => {
  const isBTL = quote.calculator_type === 'BTL';
  const isBridging = quote.calculator_type === 'BRIDGING';
  
  const formatCurrency = (value) => {
    return value ? `£${Number(value).toLocaleString('en-GB')}` : 'N/A';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader
          title="Mortgage Quote"
          subtitle={`${quote.calculator_type || ''} Quote Document`}
          referenceNumber={quote.reference_number}
        />

        {/* Borrower Information */}
        {quote.quote_borrower_name && (
          <PDFSection title="Borrower Information">
            <PDFRow label="Name" value={quote.quote_borrower_name} />
          </PDFSection>
        )}

        {/* Client Details */}
        {(brokerSettings.clientFirstName || brokerSettings.clientLastName) && (
          <PDFSection title="Client Details">
            {brokerSettings.clientType === 'Broker' && brokerSettings.brokerCompanyName && (
              <PDFRow label="Broker Company" value={brokerSettings.brokerCompanyName} />
            )}
            {brokerSettings.clientFirstName && (
              <PDFRow label="First Name" value={brokerSettings.clientFirstName} />
            )}
            {brokerSettings.clientLastName && (
              <PDFRow label="Last Name" value={brokerSettings.clientLastName} />
            )}
            {brokerSettings.clientEmail && (
              <PDFRow label="Email" value={brokerSettings.clientEmail} />
            )}
            {brokerSettings.clientContact && (
              <PDFRow label="Telephone" value={brokerSettings.clientContact} />
            )}
          </PDFSection>
        )}

        {/* Quote Information */}
        <PDFSection title="Quote Information">
          {quote.product_scope && (
            <PDFRow label="Product Scope" value={quote.product_scope} />
          )}
          {quote.product_type && (
            <PDFRow label="Product Type" value={quote.product_type} />
          )}
          {quote.selected_range && (
            <PDFRow 
              label="Product Range" 
              value={quote.selected_range === 'specialist' ? 'Specialist' : 'Core'} 
            />
          )}
          {quote.retention_choice && (
            <>
              <PDFRow label="Retention" value={quote.retention_choice} />
              {quote.retention_choice !== 'No' && quote.retention_ltv && (
                <PDFRow label="Retention LTV" value={`${quote.retention_ltv}%`} />
              )}
            </>
          )}
        </PDFSection>

        {/* Loan Details */}
        <PDFSection title="Loan Details">
          {quote.property_value && (
            <PDFRow 
              label="Property Value" 
              value={Number(quote.property_value).toLocaleString('en-GB')} 
              currency 
            />
          )}
          {quote.monthly_rent && (
            <PDFRow 
              label="Monthly Rent" 
              value={Number(quote.monthly_rent).toLocaleString('en-GB')} 
              currency 
            />
          )}

          {/* BTL Specific Fields */}
          {isBTL && (
            <>
              {quote.loan_calculation_requested && (
                <PDFRow label="Loan Type" value={quote.loan_calculation_requested} />
              )}
              {quote.specific_gross_loan && (
                <PDFRow 
                  label="Specific Gross Loan" 
                  value={Number(quote.specific_gross_loan).toLocaleString('en-GB')} 
                  currency 
                />
              )}
              {quote.specific_net_loan && (
                <PDFRow 
                  label="Specific Net Loan" 
                  value={Number(quote.specific_net_loan).toLocaleString('en-GB')} 
                  currency 
                />
              )}
              {quote.target_ltv && (
                <PDFRow label="Target LTV" value={`${quote.target_ltv}%`} />
              )}
              {quote.top_slicing && Number(quote.top_slicing) > 0 && (
                <PDFRow 
                  label="Top Slicing" 
                  value={Number(quote.top_slicing).toLocaleString('en-GB')} 
                  currency 
                />
              )}
            </>
          )}

          {/* Bridging Specific Fields */}
          {isBridging && (
            <>
              {quote.gross_loan && (
                <PDFRow 
                  label="Gross Loan" 
                  value={Number(quote.gross_loan).toLocaleString('en-GB')} 
                  currency 
                />
              )}
              {quote.use_specific_net_loan !== undefined && (
                <PDFRow 
                  label="Use Specific Net Loan" 
                  value={quote.use_specific_net_loan ? 'Yes' : 'No'} 
                />
              )}
              {quote.specific_net_loan && (
                <PDFRow 
                  label="Specific Net Loan" 
                  value={Number(quote.specific_net_loan).toLocaleString('en-GB')} 
                  currency 
                />
              )}
              {quote.bridging_loan_term && (
                <PDFRow label="Bridging Term" value={`${quote.bridging_loan_term} months`} />
              )}
              {quote.charge_type && (
                <PDFRow label="Charge Type" value={quote.charge_type} />
              )}
              {quote.sub_product && (
                <PDFRow label="Sub Product" value={quote.sub_product} />
              )}
              {quote.top_slicing && Number(quote.top_slicing) > 0 && (
                <PDFRow 
                  label="Top Slicing" 
                  value={Number(quote.top_slicing).toLocaleString('en-GB')} 
                  currency 
                />
              )}
            </>
          )}
        </PDFSection>

        {/* Title Insurance Section - Conditional */}
        <TitleInsuranceSection 
          titleInsurance={quote.title_insurance}
          titleInsuranceData={quote.title_insurance_data}
        />

        {/* Broker Fee Section - Conditional */}
        <BrokerFeeSection 
          brokerSettings={brokerSettings}
          quote={quote}
        />

        {/* Criteria Answers */}
        {quote.criteria_answers && (() => {
          try {
            const answers = typeof quote.criteria_answers === 'string' 
              ? JSON.parse(quote.criteria_answers) 
              : quote.criteria_answers;
            
            if (answers && Object.keys(answers).length > 0) {
              return (
                <PDFSection title="Criteria Answers">
                  {Object.entries(answers).map(([key, value]) => {
                    if (value && value.label) {
                      const questionLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <PDFRow key={key} label={questionLabel} value={value.label} />
                      );
                    }
                    return null;
                  })}
                </PDFSection>
              );
            }
          } catch (e) {
            console.error('Error parsing criteria answers:', e);
          }
          return null;
        })()}

        {/* Selected Fee Ranges */}
        {quote.quote_selected_fee_ranges && Array.isArray(quote.quote_selected_fee_ranges) && quote.quote_selected_fee_ranges.length > 0 && (
          <PDFSection title="Selected Fee Options">
            {quote.quote_selected_fee_ranges.map((feeRange, index) => (
              <Text key={index} style={styles.text}>
                {index + 1}. {feeRange}
              </Text>
            ))}
          </PDFSection>
        )}

        {/* Results Table */}
        {quote.results && Array.isArray(quote.results) && quote.results.length > 0 && (
          <PDFSection title="Rate Calculation Details">
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, { width: '25%' }]}>Fee Range</Text>
                <Text style={[styles.tableColHeader, { width: '20%' }]}>Rate</Text>
                <Text style={[styles.tableColHeader, { width: '20%' }]}>Monthly</Text>
                <Text style={[styles.tableColHeader, { width: '20%' }]}>Total Cost</Text>
                <Text style={[styles.tableColHeader, { width: '15%' }]}>LTV</Text>
              </View>
              {quote.results.map((result, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCol, { width: '25%' }]}>{result.fee_range || 'N/A'}</Text>
                  <Text style={[styles.tableCol, { width: '20%' }]}>{result.rate || 'N/A'}</Text>
                  <Text style={[styles.tableCol, { width: '20%' }]}>{result.monthly_payment ? formatCurrency(result.monthly_payment) : 'N/A'}</Text>
                  <Text style={[styles.tableCol, { width: '20%' }]}>{result.total_cost ? formatCurrency(result.total_cost) : 'N/A'}</Text>
                  <Text style={[styles.tableCol, { width: '15%' }]}>{result.ltv ? `${result.ltv}%` : 'N/A'}</Text>
                </View>
              ))}
            </View>
          </PDFSection>
        )}

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
};

export default QuotePDF;
