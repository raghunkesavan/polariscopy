import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../shared/PDFStyles';
import PDFSection from '../shared/PDFSection';
import PDFRow from '../shared/PDFRow';

const BrokerFeeSection = ({ brokerSettings, quote }) => {
  // Only render if broker has additional fees enabled
  if (!brokerSettings?.addFeesToggle || !brokerSettings?.additionalFeeAmount) {
    return null;
  }

  const feeType = brokerSettings.feeCalculationType || quote?.fee_calculation_type;
  const feeAmount = brokerSettings.additionalFeeAmount || quote?.additional_fee_amount;
  
  const isPound = feeType === 'pound';
  const displayAmount = isPound 
    ? `£${Number(feeAmount).toLocaleString('en-GB')}`
    : `${feeAmount}%`;

  return (
    <PDFSection 
      title="Additional Broker Fees"
      info="These fees are in addition to standard lender fees and will be added to your total cost."
    >
      <PDFRow 
        label="Fee Type" 
        value={isPound ? 'Fixed Amount' : 'Percentage of Loan'} 
      />
      
      <PDFRow 
        label="Fee Amount" 
        value={displayAmount} 
      />
      
      {brokerSettings.brokerRoute && (
        <PDFRow label="Broker Route" value={brokerSettings.brokerRoute} />
      )}
      
      {brokerSettings.brokerCompanyName && (
        <PDFRow label="Broker Company" value={brokerSettings.brokerCompanyName} />
      )}
      
      {!isPound && (
        <View style={styles.mt10}>
          <Text style={styles.text}>
            * Percentage fee will be calculated based on the final loan amount.
          </Text>
        </View>
      )}
    </PDFSection>
  );
};

export default BrokerFeeSection;
