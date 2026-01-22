import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import BTLcalculator from './BTL_Calculator';
import BridgingCalculator from './BridgingCalculator';
import '../../styles/Calculator.scss';

export default function Calculator() {
  const location = useLocation();
  // If navigation state contains a quote to load, choose the appropriate tab
  const incoming = location && location.state ? location.state.loadQuote : null;
  const initialTab = incoming && incoming.calculator_type ? (incoming.calculator_type.toUpperCase().startsWith('BTL') ? 'BTL' : 'BRIDGING') : 'BTL';
  const [active, setActive] = useState(initialTab);
  const [loadedQuote, setLoadedQuote] = useState(incoming);

  const handleTabChange = (tab) => {
    setActive(tab);
    // Clear the loaded quote when manually switching tabs
    setLoadedQuote(null);
  };

  return (
    <div className="calculator-shell slds-p-around_medium">
      <div className="slds-button-group" role="tablist" aria-label="Calculator tabs">
        <button
          type="button"
          className={`slds-button ${active === 'BTL' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => handleTabChange('BTL')}
        >
          BTL Calculator
        </button>
        <button
          type="button"
          className={`slds-button ${active === 'BRIDGING' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => handleTabChange('BRIDGING')}
        >
          Bridging Calculator
        </button>
      </div>

      <div className="margin-top-1">
        {active === 'BTL' && <BTLcalculator initialQuote={loadedQuote && loadedQuote.calculator_type === 'BTL' ? loadedQuote : null} />}
        {active === 'BRIDGING' && <BridgingCalculator initialQuote={loadedQuote && (loadedQuote.calculator_type === 'BRIDGING' || loadedQuote.calculator_type === 'BRIDGE') ? loadedQuote : null} />}
      </div>
    </div>
  );
}
 
