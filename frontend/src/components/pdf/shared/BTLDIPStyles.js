import { StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './pdfColorConstants';

/**
 * Styles specific to BTL DIP PDF - matches Excel DIP sheet formatting
 */
export const btlDipStyles = StyleSheet.create({
  // Date row
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: "1pt solid ${PDF_COLORS.borderLight}",
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PDF_COLORS.brandNavy,
  },
  dateValue: {
    fontSize: 10,
    color: PDF_COLORS.textMuted,
  },

  // Summary rows (label: value format)
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottom: "0.5pt solid ${PDF_COLORS.borderSubtle}",
  },
  summaryLabel: {
    width: '30%',
    fontSize: 9,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  summaryValue: {
    width: '70%',
    fontSize: 9,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.4,
  },

  // Section headers
  sectionHeader: {
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "2pt solid ${PDF_COLORS.brandNavy}",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PDF_COLORS.brandNavy,
    textTransform: 'uppercase',
  },

  // Introduction section
  introSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: PDF_COLORS.bgLight,
    borderRadius: 3,
  },
  introText: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
    lineHeight: 1.5,
    marginBottom: 5,
  },

  // Terms sections
  termsSection: {
    marginBottom: 10,
  },
  termsSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.textDark,
    marginBottom: 5,
  },
  termsText: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
    lineHeight: 1.5,
    marginBottom: 5,
  },
  termsTextBullet: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
    lineHeight: 1.5,
    marginBottom: 4,
    marginLeft: 10,
  },
  termsTextBold: {
    fontSize: 8,
    color: PDF_COLORS.textDark,
    lineHeight: 1.5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  termsTextSmall: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
    lineHeight: 1.4,
  },

  // Warning/Info boxes
  warningBox: {
    backgroundColor: PDF_COLORS.bgWarning,
    border: '1pt solid #dd7a01',
    padding: 8,
    marginVertical: 8,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 8,
    color: PDF_COLORS.error,
    lineHeight: 1.4,
  },
  warningImportant: {
    fontSize: 8,
    color: PDF_COLORS.error,
    fontWeight: 'bold',
  },
  
  // Link styling
  link: {
    color: PDF_COLORS.brandBlue,
    textDecoration: 'underline',
  },
  infoBox: {
    backgroundColor: PDF_COLORS.bgInfo,
    border: '1pt solid #003087',
    padding: 8,
    marginVertical: 8,
    borderRadius: 3,
  },
  infoText: {
    fontSize: 8,
    color: PDF_COLORS.brandBlueDark,
    lineHeight: 1.4,
  },

  // Tariff table - matches Excel styling
  tariffTable: {
    marginVertical: 0,
    border: '1pt solid #000000',
  },
  tariffHeader: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.bgWhite,
    padding: 3,
    borderBottom: '1pt solid #000000',
  },
  tariffHeaderCell: {
    flex: 2,
    fontSize: 8,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  tariffHeaderCellRight: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
    textAlign: 'left',
    paddingLeft: 10,
  },
  tariffSubHeader: {
    backgroundColor: PDF_COLORS.bgWhite,
    padding: 3,
    borderBottom: '1pt solid #000000',
  },
  tariffSubHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
    textAlign: 'center',
  },
  tariffRow: {
    flexDirection: 'row',
    padding: 2,
    borderBottom: '1pt solid #000000',
    backgroundColor: PDF_COLORS.bgWhite,
  },
  tariffRowAlt: {
    flexDirection: 'row',
    padding: 2,
    borderBottom: '1pt solid #000000',
    backgroundColor: PDF_COLORS.bgWhite,
  },
  tariffCell: {
    flex: 2,
    fontSize: 7,
    color: PDF_COLORS.textPrimary,
  },
  tariffCellRight: {
    flex: 1,
    fontSize: 7,
    color: PDF_COLORS.textPrimary,
    textAlign: 'left',
    paddingLeft: 10,
  },

  // Signature section
  signatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  signatureBlock: {
    width: '45%',
    marginBottom: 15,
  },
  signatureLine: {
    fontSize: 9,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    marginBottom: 5,
  },

  // Highlights
  highlightValue: {
    fontWeight: 'bold',
    color: PDF_COLORS.brandNavy,
  },
  currencyValue: {
    fontWeight: 'bold',
    color: PDF_COLORS.textDark,
  },

  // Conditional row (for hidden/shown content)
  conditionalRow: {
    backgroundColor: PDF_COLORS.bgWarningAlt,
    borderLeft: `3pt solid ${PDF_COLORS.borderWarning}`,
    paddingLeft: 5,
  },
});

