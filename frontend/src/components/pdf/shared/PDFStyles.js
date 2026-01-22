import { StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './pdfColorConstants';

export const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 35,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: PDF_COLORS.bgWhite,
  },
  
  // Header styles
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #0176d3',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PDF_COLORS.brandInfo,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: PDF_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 3,
  },
  referenceNumber: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 5,
  },
  
  // Section styles
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: PDF_COLORS.bgLight,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PDF_COLORS.brandInfo,
    marginBottom: 8,
    borderBottom: '1pt solid #dddbda',
    paddingBottom: 3,
  },
  
  // Text styles
  label: {
    fontSize: 9,
    color: PDF_COLORS.textMuted,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  
  // Row styles
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 10,
    width: '45%',
    color: PDF_COLORS.textMuted,
  },
  rowValue: {
    fontSize: 10,
    width: '55%',
    fontWeight: 'bold',
  },
  
  // Table styles
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundcolor: PDF_COLORS.brandInfo,
    padding: 6,
    color: PDF_COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #dddbda',
    padding: 6,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1pt solid #dddbda',
    backgroundColor: PDF_COLORS.bgSubtle,
    padding: 6,
    fontSize: 9,
  },
  tableCol: {
    flex: 1,
  },
  tableColHeader: {
    flex: 1,
    fontWeight: 'bold',
  },
  
  // Info box styles
  infoBox: {
    backgroundColor: PDF_COLORS.bgInfo,
    border: '1pt solid #0176d3',
    padding: 10,
    marginVertical: 8,
    borderRadius: 3,
  },
  infoIcon: {
    color: PDF_COLORS.brandInfo,
    fontSize: 12,
    marginRight: 5,
  },
  infoText: {
    fontSize: 9,
    color: PDF_COLORS.brandBlueDark,
    lineHeight: 1.4,
  },
  
  // Warning box styles
  warningBox: {
    backgroundColor: PDF_COLORS.bgWarning,
    border: '1pt solid #dd7a01',
    padding: 10,
    marginVertical: 8,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 9,
    color: PDF_COLORS.textWarning,
    lineHeight: 1.4,
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #dddbda',
    paddingTop: 8,
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    textAlign: 'center',
  },
  
  // Grid layout
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
    paddingRight: 10,
  },
  gridItemFull: {
    width: '100%',
    marginBottom: 8,
  },
  
  // Spacing utilities
  mb5: { marginBottom: 5 },
  mb10: { marginBottom: 10 },
  mb15: { marginBottom: 15 },
  mb20: { marginBottom: 20 },
  mt5: { marginTop: 5 },
  mt10: { marginTop: 10 },
  mt15: { marginTop: 15 },
  
  // Currency
  currency: {
    fontWeight: 'bold',
    color: PDF_COLORS.textDark,
  },
  
  // Highlighted value
  highlight: {
    backgroundColor: PDF_COLORS.bgWarning,
    padding: 4,
    borderRadius: 2,
    fontWeight: 'bold',
  },
});


