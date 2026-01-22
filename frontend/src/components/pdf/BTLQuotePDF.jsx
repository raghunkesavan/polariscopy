import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import { btlQuoteStyles } from './shared/BTLQuoteStyles';
import PDFFooter from './shared/PDFFooter';
import { PDF_COLORS } from './shared/pdfColorConstants';
import * as h from './utils/btlQuoteHelpers';

// Logo path from public folder
const MFS_LOGO_PATH = '/assets/mfs-logo.png';

// Fixed header styles for every page
const fixedHeaderStyles = StyleSheet.create({
  fixedHeader: {
    position: 'absolute',
    top: 15,
    right: 40,
    width: 80,
    height: 32,
    zIndex: 10,
  },
  logo: {
    width: 80,
    height: 32,
    objectFit: 'contain',
  },
});

/**
 * BTL Quote PDF - Matches template formatting
 * Shows indicative quote with multiple fee range options in table format
 */
const BTLQuotePDF = ({ quote, brokerSettings = {}, clientDetails = {} }) => {
  // Get all results
  const allResults = quote.results || [];
  // Filter by selected product range if specified on quote (from Issue Quote modal)
  const selectedProductRange = (quote.quote_product_range || quote.selected_range || '').toString().toLowerCase();
  const rangeFilteredResults = selectedProductRange
    ? allResults.filter(r => {
        // Check product_range, rate_type, or type fields (same as calculator filter)
        const resultRange = (r.product_range || r.rate_type || r.type || '').toString().toLowerCase();
        return resultRange === selectedProductRange || resultRange.includes(selectedProductRange);
      })
    : allResults;
  
  // Filter by retention status if specified
  const retentionChoice = quote.retention_choice || 'No';
  const isRetentionQuote = retentionChoice.toLowerCase() !== 'no';
  
  const retentionFilteredResults = rangeFilteredResults.filter(r => {
    // Check multiple possible retention fields
    const isRetentionRate = r.is_retention === true || 
                           r.is_retention === 'true' || 
                           r.is_retention === 1 || 
                           String(r.is_retention || '').toLowerCase() === 'true' ||
                           r.retention === true ||
                           r.retention === 'true' ||
                           String(r.retention || '').toLowerCase() === 'true';
    
    // If the is_retention field exists (not undefined/null), use it for filtering
    if (r.is_retention !== undefined && r.is_retention !== null) {
      if (isRetentionQuote) {
        return isRetentionRate === true;
      } else {
        return isRetentionRate === false;
      }
    }
    
    // Fallback: if is_retention field doesn't exist (old saved quotes),
    // assume all results match the quote's retention choice
    // (they were already filtered when the quote was created)
    return true;
  });
  
  // Filter results based on selected fee ranges from quote
  const selectedFeeRanges = quote.quote_selected_fee_ranges || [];
  
  // Filter results to only include selected fee ranges
  // Normalize comparison: selected ranges may include '%' strings while DB has numeric/strings
  const normalizeFeeToNumberString = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).trim();
    // Extract the first numeric token (supports decimals) e.g. "Fee: 6%" => "6"
    const m = s.match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? m[1] : '';
  };

  const normalizedSelected = selectedFeeRanges.map(normalizeFeeToNumberString)
    .sort((a, b) => parseFloat(b) - parseFloat(a)); // Sort descending: 6, 4, 3, 2

  // Get available fee ranges from current filtered results
  const availableFeeRanges = h.getFeeRanges(retentionFilteredResults);
  
  // Filter selected fee ranges to only include those that exist in current results
  // This handles switching from retention to non-retention or changing property types
  const validSelectedRanges = normalizedSelected.filter(feeRange => 
    availableFeeRanges.includes(feeRange)
  );
  
  const results = validSelectedRanges.length > 0 
    ? retentionFilteredResults.filter(r => {
        const feeCol = normalizeFeeToNumberString(r.fee_column ?? r.product_fee ?? '');
        return validSelectedRanges.includes(feeCol);
      })
    : retentionFilteredResults;
  
  // Get fee ranges from filtered results (maintaining selected order, only valid ones)
  const feeRanges = validSelectedRanges.length > 0 
    ? validSelectedRanges 
    : availableFeeRanges;
  
  // Calculate dynamic column widths based on number of fee ranges
  const numColumns = feeRanges.length;
  const labelWidth = '22%';
  const valueWidth = numColumns > 0 ? `${(78 / numColumns).toFixed(1)}%` : '19.5%';
  
  // Get first result for full term description
  const firstResult = results.length > 0 ? results[0] : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Header */}
        <View style={btlQuoteStyles.headerRow}>
          <Text style={btlQuoteStyles.headerTitle}>Summary of terms - Indicative Quote</Text>
          <Text style={{ fontSize: 10, color: 'var(--token-text-muted)' }}>Reference: {quote.reference_number || quote.id || 'N/A'}</Text>
        </View>

        {/* Summary Grid */}
        <View style={btlQuoteStyles.summaryGrid}>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Type</Text>
            <Text style={btlQuoteStyles.summaryValue}>{h.getQuoteType(quote)}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Requested</Text>
            <Text style={btlQuoteStyles.summaryValue}>{h.getRequestedAmount(quote)}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Property</Text>
            <Text style={btlQuoteStyles.summaryValue}>{h.getPropertyValue(quote)}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Monthly rent</Text>
            <Text style={btlQuoteStyles.summaryValue}>{h.getMonthlyRent(quote)}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Product</Text>
            <Text style={btlQuoteStyles.summaryValue}>{h.getProductType(quote)}</Text>
          </View>
        </View>

        {/* Tier Range and Version Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingRight: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 9, color: 'var(--token-text-muted)', marginRight: 10 }}>Tier range</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--token-color-black)', marginRight: 10 }}>
              {h.getTierRange(quote)}
            </Text>
            <Text style={{ fontSize: 10, color: 'var(--token-color-black)', marginRight: 10 }}>Tier {h.getTierNumber(quote)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 9, color: 'var(--token-text-muted)', marginRight: 10 }}>Retention</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--token-color-black)' }}>
              {h.getRetention(quote)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 9, color: 'var(--token-text-muted)', marginRight: 10 }}>Version</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--token-color-black)' }}>
              {h.getVersion(quote)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: 'var(--token-text-muted)', marginRight: 10 }}>Submitted by</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--token-color-black)' }}>
              {h.getSubmittedBy(quote)}
            </Text>
          </View>
        </View>

        {/* Results Table */}
        <View style={btlQuoteStyles.resultsTable}>
          {/* Table Header */}
          <View style={btlQuoteStyles.tableHeaderRow}>
            <Text style={[btlQuoteStyles.tableHeaderCell, { width: labelWidth, backgroundColor: PDF_COLORS.bgGrayLight }]}>
              {/* Empty cell for row labels */}
            </Text>
            {feeRanges.map((feeRange, index) => {
              const colors = ['#d8edff', '#ffd4e5', '#ffe4b3', '#d4f4dd'];
              const bgColor = colors[index % colors.length];
              return (
                <Text key={index} style={[btlQuoteStyles.tableHeaderCell, { width: valueWidth, backgroundColor: bgColor }]}>
                  {feeRange ? `${feeRange}% Fee` : '—'}
                </Text>
              );
            })}
          </View>

          {/* Full rate */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Full rate</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getFullRate(result)}
                </Text>
              );
            })}
          </View>

          {/* Pay rate */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Pay rate</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getPayRate(result)}
                </Text>
              );
            })}
          </View>

          {/* Revert rate */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Revert rate</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getRevertRate(result)}
                </Text>
              );
            })}
          </View>

          {/* Service period */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Service period</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getServicePeriod(result)}
                </Text>
              );
            })}
          </View>

          {/* Deferred */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Deferred</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getDeferredPercent(result)}
                </Text>
              );
            })}
          </View>

          {/* Rolled */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Rolled</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getRolledMonths(result)}
                </Text>
              );
            })}
          </View>

          {/* Section: Loan */}
          <View style={btlQuoteStyles.tableRowSectionHeader}>
            <Text style={[btlQuoteStyles.tableCellLabel, { fontWeight: 'bold', width: labelWidth }]}>Loan</Text>
            {feeRanges.map((_, index) => (
              <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}></Text>
            ))}
          </View>

          {/* Gross loan */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Gross loan</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getGrossLoan(result)}
                </Text>
              );
            })}
          </View>

          {/* Net loan */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Net loan</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValueHighlight, { width: valueWidth }]}>
                  {h.getNetLoan(result)}
                </Text>
              );
            })}
          </View>

          {/* LTV */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>LTV</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getLTV(result)}
                </Text>
              );
            })}
          </View>

          {/* ICR */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>ICR</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getICR(result)}
                </Text>
              );
            })}
          </View>

          {/* APRC */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>APRC</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getAPRC(result)}
                </Text>
              );
            })}
          </View>

          {/* Section: Costs */}
          <View style={btlQuoteStyles.tableRowSectionHeader}>
            <Text style={[btlQuoteStyles.tableCellLabel, { fontWeight: 'bold', width: labelWidth }]}>Costs</Text>
            {feeRanges.map((_, index) => (
              <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}></Text>
            ))}
          </View>

          {/* Deferred cost */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Deferred cost</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getDeferredCost(result)}
                </Text>
              );
            })}
          </View>

          {/* Rolled cost */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Rolled cost</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getRolledCost(result)}
                </Text>
              );
            })}
          </View>

          {/* Product fee */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Product fee</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getProductFee(result)}
                </Text>
              );
            })}
          </View>

          {/* Total costs */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Total costs</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getTotalCosts(result)}
                </Text>
              );
            })}
          </View>

          {/* Monthly DD */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Monthly DD</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValueHighlight, { width: valueWidth }]}>
                  {h.getMonthlyDD(result)}
                </Text>
              );
            })}
          </View>

          {/* Total cost to borrower */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Total cost to borrower</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getTotalCostToBorrower(result)}
                </Text>
              );
            })}
          </View>

          {/* Section: Fees */}
          <View style={btlQuoteStyles.tableRowSectionHeader}>
            <Text style={[btlQuoteStyles.tableCellLabel, { fontWeight: 'bold', width: labelWidth }]}>Fees</Text>
            {feeRanges.map((_, index) => (
              <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}></Text>
            ))}
          </View>

          {/* Broker Commission */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Broker Commission</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getBrokerCommission(result, brokerSettings)}
                </Text>
              );
            })}
          </View>

          {/* Broker Client fee */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Broker Client fee</Text>
            {feeRanges.map((feeRange, index) => {
              const result = h.getResultForFeeRange(results, feeRange);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {h.getBrokerClientFee(result, brokerSettings)}
                </Text>
              );
            })}
          </View>
        </View>

        {/* Two Column Layout: Terms and Broker Details */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 15 }}>
          {/* Left Column: Terms Section */}
          <View style={{ flex: 1 }}>
            <Text style={btlQuoteStyles.termsTitle}>Terms</Text>
            <View style={btlQuoteStyles.termsGrid}>
              {/* Left Column */}
              <View style={btlQuoteStyles.termsColumn}>
                <View style={btlQuoteStyles.termsRow}>
                  <Text style={btlQuoteStyles.termsLabel}>Top slicing used</Text>
                  <Text style={btlQuoteStyles.termsValue}>{h.getTopSlicing(quote, firstResult)}</Text>
                </View>
                <View style={btlQuoteStyles.termsRow}>
                  <Text style={btlQuoteStyles.termsLabel}>Admin fee</Text>
                  <Text style={btlQuoteStyles.termsValue}>{h.getAdminFee(quote, firstResult)}</Text>
                </View>
                <View style={btlQuoteStyles.termsRow}>
                  <Text style={btlQuoteStyles.termsLabel}>Valuation fee</Text>
                  <Text style={btlQuoteStyles.termsValue}>{h.getValuationFee(quote)}</Text>
                </View>
              </View>
              
              {/* Right Column */}
              <View style={btlQuoteStyles.termsColumn}>
                <View style={btlQuoteStyles.termsRow}>
                  <Text style={btlQuoteStyles.termsLabel}>Lender legal fee</Text>
                  <Text style={btlQuoteStyles.termsValue}>{h.getLenderLegalFee(quote)}</Text>
                </View>
                <View style={btlQuoteStyles.termsRow}>
                  <Text style={btlQuoteStyles.termsLabel}>Fee payments</Text>
                  <Text style={btlQuoteStyles.termsValue}>{h.getFeePayments()}</Text>
                </View>
                <View style={btlQuoteStyles.termsRow}>
                  <Text style={btlQuoteStyles.termsLabel}>Total loan details</Text>
                  <Text style={btlQuoteStyles.termsValue}>{h.getFullTerm(quote, firstResult)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column: Broker Details */}
          <View style={{ flex: 1 }}>
            <View style={btlQuoteStyles.brokerDetailsBox}>
              <Text style={btlQuoteStyles.brokerDetailsTitle}>
                {((clientDetails?.clientType || quote?.client_type) === 'Direct') ? 'Client details' : 'Broker details'}
              </Text>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Name</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientName(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Company</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientCompany(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Email</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientEmail(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Telephone</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientTelephone(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Route</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientRoute(clientDetails, quote)}</Text>
              </View>
            </View>
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* Page 2: DIP Packaging List */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo in top right (same as page 1) */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image src={MFS_LOGO_PATH} style={fixedHeaderStyles.logo} />
        </View>
        
        {/* Header with Packaging List */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingHorizontal: 40,
          paddingVertical: 15,
          borderBottom: '1px solid #c9c9c9'
        }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: 'var(--token-color-brand-navy)' }}>
            Packaging List
          </Text>
          <View style={{ width: 80, height: 32 }} />
        </View>
        
        <View style={{ padding: '20px 40px' }}>
          {/* Product Type and Date Section */}
          <View style={{ 
            backgroundColor: PDF_COLORS.columnOrangeDark, 
            padding: '8px 16px', 
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: PDF_COLORS.textWhite }}>
              Buy to Let – {quote.property_type || 'Residential'}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: PDF_COLORS.textWhite }}>
              {new Date(quote.created_at || Date.now()).toLocaleDateString()}
            </Text>
          </View>

          {/* Introduction Text */}
          <Text style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 10, lineHeight: 1.4 }}>
            The following list comprises the standard information required for initial credit screening and approval to issue a DIP. Note that further information will be requested during the underwriting process, depending on the nature of the transaction, specific circumstances of the borrower and the type of property.
          </Text>

          {/* DIP List Header */}
          <View style={{ 
            backgroundColor: PDF_COLORS.columnNavyDark, 
            padding: '8px 12px', 
            marginBottom: 10
          }}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: PDF_COLORS.textWhite, textAlign: 'center' }}>
              DIP List
            </Text>
          </View>

          {/* DIP List Items */}
          <View style={{ border: '1px solid var(--token-border-medium)', padding: 12 }}>
            {[
              {
                label: 'Property address and description:',
                value: 'details of the property or properties offered as security'
              },
              {
                label: 'Borrower name and nationality / jurisdiction:',
                value: 'list all individual borrowers or shareholders of corporate borrowers'
              },
              {
                label: 'Occupation and experience of key individual/s:',
                value: 'list occupation that provides the main source of income and detail experience relevant to managing the security property/ies'
              },
              {
                label: 'Annual income:',
                value: 'total annual income from employment including any salary, dividends, benefits, rental, pensions, investments etc'
              },
              {
                label: 'Asset and Liability Statement for any individual Borrowers, Shareholders or Guarantors:',
                value: 'include value of all assets owned in company or personal names along with any outstanding debts'
              },
              {
                label: 'Residential address of key individual/s:',
                value: 'address of main residence for any individual borrowers or shareholders > 25%'
              },
              {
                label: 'Details of any adverse credit:',
                value: 'list all overdue payments and credit provider (to be cleared on or before completion)'
              },
              {
                label: 'Loan Purpose:',
                value: 'what will the loan proceeds be used for? e.g. purchase, refinance, debt consolidation, equity release, refurbishment works'
              },
              {
                label: 'Agreed purchase price (if purchase):',
                value: 'price to be paid and declared on HM Land Registry'
              },
              {
                label: 'Details of outstanding charges and loan balances (if refinance or 2nd charge):',
                value: 'amount of outstanding loan/s and lender name/s'
              },
              {
                label: 'Breakdown of use of funds:',
                value: 'detail how the net loan balance will be used (including cost estimate for any proposed works)'
              },
              {
                label: 'Proposed exit strategy / source of repayment:',
                value: 'how will the loan be repaid? E.g. sale, refinance or liquidity event'
              },
              {
                label: 'Additional information:',
                value: 'any further information relevant to the transaction, property, or borrower'
              }
            ].map((item, index) => (
              <View key={index} style={{ 
                flexDirection: 'row', 
                marginBottom: 8,
                paddingLeft: 8
              }}>
                <Text style={{ fontSize: 10, width: 15, marginRight: 6 }}>•</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: 700 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 9, color: 'var(--token-text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default BTLQuotePDF;


