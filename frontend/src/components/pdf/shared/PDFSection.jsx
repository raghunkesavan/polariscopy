import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './PDFStyles';

const PDFSection = ({ title, children, info, warning }) => (
  <View style={styles.section}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    {info && (
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{info}</Text>
      </View>
    )}
    {warning && (
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>⚠️ {warning}</Text>
      </View>
    )}
    {children}
  </View>
);

export default PDFSection;
