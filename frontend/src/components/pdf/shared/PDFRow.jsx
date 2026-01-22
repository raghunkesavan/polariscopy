import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './PDFStyles';

const PDFRow = ({ label, value, currency }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}:</Text>
    <Text style={styles.rowValue}>
      {currency && '£'}
      {value}
    </Text>
  </View>
);

export default PDFRow;
