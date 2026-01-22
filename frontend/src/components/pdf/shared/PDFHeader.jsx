import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles } from './PDFStyles';
import { PDF_COLORS } from './pdfColorConstants';

// Logo path from public folder - will be resolved at runtime
const MFS_LOGO_PATH = '/assets/mfs-logo.png';

const headerStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: `2pt solid ${PDF_COLORS.brandNavyDark}`,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 100,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  logo: {
    width: 90,
    height: 36,
    objectFit: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PDF_COLORS.brandNavyDark,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: PDF_COLORS.textMuted,
    marginBottom: 2,
  },
  referenceNumber: {
    fontSize: 10,
    color: PDF_COLORS.textSecondary,
    marginTop: 3,
  },
});

const PDFHeader = ({ title, subtitle, referenceNumber, showLogo = true }) => (
  <View style={headerStyles.headerContainer}>
    <View style={headerStyles.headerLeft}>
      <Text style={headerStyles.title}>{title}</Text>
      {subtitle && <Text style={headerStyles.subtitle}>{subtitle}</Text>}
      {referenceNumber && (
        <Text style={headerStyles.referenceNumber}>
          Reference: {referenceNumber}
        </Text>
      )}
    </View>
    {showLogo && (
      <View style={headerStyles.headerRight}>
        <Image style={headerStyles.logo} src={MFS_LOGO_PATH} />
      </View>
    )}
  </View>
);

export default PDFHeader;
