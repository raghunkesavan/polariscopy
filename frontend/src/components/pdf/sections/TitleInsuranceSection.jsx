import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../shared/PDFStyles';
import PDFSection from '../shared/PDFSection';
import PDFRow from '../shared/PDFRow';

const TitleInsuranceSection = ({ titleInsurance, titleInsuranceData }) => {
  // Only render if title insurance is selected
  if (titleInsurance !== 'Yes') return null;

  const data = typeof titleInsuranceData === 'string' 
    ? JSON.parse(titleInsuranceData) 
    : titleInsuranceData || {};

  return (
    <PDFSection title="Title Insurance">
      <PDFRow label="Title Insurance" value="Yes" />
      
      {data.provider && (
        <PDFRow label="Provider" value={data.provider} />
      )}
      
      {data.premium && (
        <PDFRow label="Premium" value={Number(data.premium).toLocaleString('en-GB')} currency />
      )}
      
      {data.coverage && (
        <PDFRow label="Coverage Amount" value={Number(data.coverage).toLocaleString('en-GB')} currency />
      )}
      
      {data.excessAmount && (
        <PDFRow label="Excess" value={Number(data.excessAmount).toLocaleString('en-GB')} currency />
      )}
      
      {data.notes && (
        <View style={styles.mt10}>
          <Text style={styles.label}>Notes:</Text>
          <Text style={styles.text}>{data.notes}</Text>
        </View>
      )}
    </PDFSection>
  );
};

export default TitleInsuranceSection;
