import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './shared/pdfColorConstants';

// Logo path from public folder
const MFS_LOGO_PATH = '/assets/mfs-logo.png';

// PDF Styles for UW Requirements Checklist - Modern Professional Design
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 50,
    paddingLeft: 35,
    paddingRight: 35,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: PDF_COLORS.bgWhite,
  },
  
  // Header - Modern gradient effect simulation with layered design
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 12,
    paddingTop: 8,
    paddingLeft: 15,
    paddingRight: 15,
    backgroundColor: PDF_COLORS.bgLightGray,
    borderLeft: `3pt solid ${PDF_COLORS.brandNavy}`,
    borderRadius: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  logo: {
    width: 75,
    height: 30,
    objectFit: 'contain',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PDF_COLORS.brandNavy,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 9,
    color: PDF_COLORS.textGrayDark,
    marginBottom: 2,
  },
  referenceNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: PDF_COLORS.brandNavy,
    marginTop: 4,
    backgroundColor: PDF_COLORS.bgInfoLight,
    padding: '3 6',
    borderRadius: 2,
  },
  
  // Summary box - Modern card design
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.bgWhite,
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
    border: '1pt solid #e1e4e8',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: PDF_COLORS.textGray,
    marginBottom: 3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: PDF_COLORS.brandNavy,
  },
  summaryValueComplete: {
    fontSize: 13,
    fontWeight: 'bold',
    color: PDF_COLORS.success,
  },
  summaryValueIncomplete: {
    fontSize: 13,
    fontWeight: 'bold',
    color: PDF_COLORS.errorDark,
  },
  
  // Progress bar - Modern sleek design
  progressContainer: {
    marginBottom: 18,
    padding: 10,
    backgroundColor: PDF_COLORS.bgLightGray,
    borderRadius: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: PDF_COLORS.bgSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    border: '1pt solid #dee2e6',
  },
  progressBarFill: {
    height: 8,
    backgroundcolor: PDF_COLORS.brandNavy,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 8.5,
    color: PDF_COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  // Category section - Modern elevated card style
  category: {
    marginBottom: 12,
    borderRadius: 4,
    overflow: 'hidden',
    border: '1pt solid #e1e4e8',
  },
  categoryHeader: {
    backgroundcolor: PDF_COLORS.brandNavy,
    padding: 8,
    marginBottom: 0,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  categoryCount: {
    fontSize: 8.5,
    color: '#b8d4ff',
    marginLeft: 6,
    fontWeight: 'normal',
  },
  
  // Requirements table - Clean modern layout
  table: {
    backgroundColor: PDF_COLORS.bgWhite,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderBottom: '1.5pt solid #00205B',
  },
  tableHeaderCell: {
    padding: 7,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#212529',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e9ecef',
    backgroundColor: PDF_COLORS.bgWhite,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e9ecef',
    backgroundColor: PDF_COLORS.bgLightGray,
  },
  tableCell: {
    padding: 7,
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  
  // Column widths
  colStatus: {
    width: '12%',
    textAlign: 'center',
  },
  colDescription: {
    width: '58%',
  },
  colStage: {
    width: '15%',
    textAlign: 'center',
  },
  colRequired: {
    width: '15%',
    textAlign: 'center',
  },
  
  // Status indicators - Enhanced colors
  statusReceived: {
    color: '#155724',
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#721c24',
  },
  statusOptional: {
    color: '#6c757d',
    fontStyle: 'italic',
  },
  
  // Checkbox icons - Modern badge style
  checkboxChecked: {
    fontSize: 8,
    color: '#ffffff',
    backgroundcolor: PDF_COLORS.success,
    padding: '2 5',
    borderRadius: 2,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  checkboxUnchecked: {
    fontSize: 8,
    color: '#6c757d',
    backgroundColor: PDF_COLORS.bgWhite,
    padding: '2 5',
    borderRadius: 2,
    border: '1pt solid #ced4da',
    letterSpacing: 0.2,
  },
  
  // Stage badges - Modern pill design
  stageDIP: {
    backgroundColor: '#fd7e14',
    color: '#ffffff',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  stageIndicative: {
    backgroundcolor: PDF_COLORS.success,
    color: '#ffffff',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  stageBoth: {
    backgroundColor: '#6c757d',
    color: '#ffffff',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  
  // Footer - Modern clean design
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    borderTop: '1.5pt solid #e1e4e8',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: '#6c757d',
  },
  pageNumber: {
    fontSize: 7.5,
    color: PDF_COLORS.textSecondary,
    fontWeight: 'bold',
  },
  
  // Notes section - Modern info card
  notesSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fff3cd',
    border: '1pt solid #ffc107',
    borderLeft: '3pt solid #ffc107',
    borderRadius: 3,
  },
  notesTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  notesText: {
    fontSize: 8.5,
    color: '#856404',
    lineHeight: 1.5,
  },
});

/**
 * UW Requirements Checklist PDF
 * 
 * Props:
 * - requirements: Array of requirement objects
 * - checkedItems: Array of checked requirement IDs
 * - quoteData: Quote data for header info
 * - stage: 'DIP' or 'Indicative' (optional filter)
 * - generatedDate: Date string when PDF was generated
 * - showGuidance: Whether to include internal guidance notes
 */
const UWRequirementsPDF = ({ 
  requirements = [], 
  checkedItems = [], 
  quoteData = {},
  stage = null,
  generatedDate = new Date().toLocaleDateString('en-GB'),
  showGuidance = false
}) => {
  // Group requirements by category
  const groupedRequirements = {};
  requirements.forEach(req => {
    if (!groupedRequirements[req.category]) {
      groupedRequirements[req.category] = [];
    }
    groupedRequirements[req.category].push(req);
  });

  // Sort each group by order
  Object.keys(groupedRequirements).forEach(cat => {
    groupedRequirements[cat].sort((a, b) => a.order - b.order);
  });

  // Filter out Assumptions from stats calculation
  const requirementsForStats = requirements.filter(r => r.category !== 'Assumptions');
  
  // Calculate stats (excluding Assumptions)
  const totalCount = requirementsForStats.length;
  const checkedCount = requirementsForStats.filter(r => checkedItems.includes(r.id)).length;
  const requiredCount = requirementsForStats.filter(r => r.required).length;
  const requiredCheckedCount = requirementsForStats.filter(r => r.required && checkedItems.includes(r.id)).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const isComplete = checkedCount === totalCount;
  const isRequiredComplete = requiredCheckedCount === requiredCount;

  // Category order
  const categoryOrder = [
    'Assumptions',
    'Broker',
    'Borrower',
    'Company',
    'Property',
    'Property - HMO',
    'Property - Holiday Let',
    'Property - Commercial/Semi-Commercial',
    'Additional Requirements'
  ];

  // Get borrower name from quote data
  const borrowerName = quoteData.quote_borrower_name || quoteData.borrower_name || 'Not specified';

  // Get property address
  const propertyAddress = quoteData.property_address || quoteData.security_address || 'Not specified';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>UW Requirements Checklist</Text>
            <Text style={styles.subtitle}>
              {stage ? `${stage} Stage` : 'All Stages'} • Generated: {generatedDate}
            </Text>
            {quoteData.reference_number && (
              <Text style={styles.referenceNumber}>
                Reference: {quoteData.reference_number}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Image style={styles.logo} src={MFS_LOGO_PATH} />
          </View>
        </View>

        {/* Quote Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>BORROWER</Text>
            <Text style={styles.summaryValue}>{borrowerName}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL ITEMS</Text>
            <Text style={styles.summaryValue}>{totalCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>RECEIVED</Text>
            <Text style={isComplete ? styles.summaryValueComplete : styles.summaryValue}>
              {checkedCount}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>OUTSTANDING</Text>
            <Text style={(totalCount - checkedCount) > 0 ? styles.summaryValueIncomplete : styles.summaryValueComplete}>
              {totalCount - checkedCount}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progressPercent}% Complete • {requiredCheckedCount}/{requiredCount} Required Items Received
          </Text>
        </View>

        {/* Requirements by Category */}
        {categoryOrder.map(category => {
          const catReqs = groupedRequirements[category];
          // Skip if no requirements in this category OR if Assumptions category and stage is DIP
          if (!catReqs || catReqs.length === 0) return null;
          if (category === 'Assumptions' && stage === 'DIP') return null;

          const catChecked = catReqs.filter(r => checkedItems.includes(r.id)).length;
          const isAssumptions = category === 'Assumptions';

          return (
            <View key={category} style={styles.category} wrap={false}>
              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>
                  {category}
                  {!isAssumptions && (
                    <Text style={styles.categoryCount}> ({catChecked}/{catReqs.length})</Text>
                  )}
                </Text>
              </View>

              {/* Assumptions: Plain text list without table */}
              {isAssumptions ? (
                <View style={{ paddingLeft: 15, paddingRight: 15, paddingBottom: 10 }}>
                  {catReqs.map((req, idx) => (
                    <View key={req.id} style={{ marginBottom: 6 }}>
                      <Text style={{ fontSize: 9, color: '#3e3e3c', lineHeight: 1.4, fontStyle: 'italic' }}>
                        • {req.description}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                /* Regular requirements table */
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDescription]}>Requirement</Text>
                    <Text style={[styles.tableHeaderCell, styles.colStage]}>Stage</Text>
                    <Text style={[styles.tableHeaderCell, styles.colRequired]}>Required</Text>
                  </View>

                  {/* Table Rows */}
                  {catReqs.map((req, idx) => {
                    const isChecked = checkedItems.includes(req.id);
                    const rowStyle = idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt;
                    
                    // Determine display stage: if stage is 'Both', show the currently selected stage filter
                    const displayStage = req.stage === 'Both' ? (stage || 'Both') : req.stage;

                    return (
                      <View key={req.id} style={rowStyle}>
                        <View style={[styles.tableCell, styles.colStatus]}>
                          <Text style={isChecked ? styles.checkboxChecked : styles.checkboxUnchecked}>
                            {isChecked ? 'YES' : 'NO'}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.colDescription]}>
                          <Text style={isChecked ? styles.statusReceived : (req.required ? styles.statusPending : styles.statusOptional)}>
                            {req.description}
                          </Text>
                          {showGuidance && req.guidance && (
                            <Text style={{ fontSize: 7, color: '#706e6b', marginTop: 2, fontStyle: 'italic' }}>
                              Note: {req.guidance}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.tableCell, styles.colStage]}>
                          <Text style={
                            displayStage === 'DIP' ? styles.stageDIP :
                            displayStage === 'Indicative' ? styles.stageIndicative :
                            styles.stageBoth
                          }>
                            {displayStage}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.colRequired]}>
                          <Text style={{ color: req.required ? '#c23934' : '#706e6b' }}>
                            {req.required ? 'Yes' : 'Optional'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Status Summary Note */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Status Summary</Text>
          <Text style={styles.notesText}>
            {isComplete 
              ? '✓ All requirements have been received. This case is ready for underwriting review.'
              : isRequiredComplete
                ? `✓ All required items received (${requiredCheckedCount}/${requiredCount}). ${totalCount - checkedCount} optional item(s) outstanding.`
                : `⚠ ${requiredCount - requiredCheckedCount}  required item(s) and ${totalCount - checkedCount - (requiredCount - requiredCheckedCount)} optional item(s) outstanding.`
            }
          </Text>
          {propertyAddress !== 'Not specified' && (
            <Text style={[styles.notesText, { marginTop: 4 }]}>
              Property: {propertyAddress}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Market Financial Solutions Underwriting Requirements Checklist • {generatedDate}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
};

export default UWRequirementsPDF;

