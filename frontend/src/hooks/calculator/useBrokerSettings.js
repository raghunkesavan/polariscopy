import { useState, useEffect } from 'react';
import {
  LOCALSTORAGE_CONSTANTS_KEY,
  BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE
} from '../../config/constants';

/**
 * useBrokerSettings - Manages broker-related state and validation
 * Handles broker routes, commission percentages, and additional fees
 * 
 * @param {Object} initialQuote - Optional initial quote data to populate fields
 * @param {String} calculatorType - 'btl' or 'bridge' to determine which proc fee to use
 * @returns {Object} Broker settings state and handlers
 */
export default function useBrokerSettings(initialQuote = null, calculatorType = 'btl') {
  const [clientType, setClientType] = useState('Direct');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [brokerRoute, setBrokerRoute] = useState(BROKER_ROUTES.DIRECT_BROKER);
  const [brokerCommissionPercent, setBrokerCommissionPercent] = useState(() => {
    const defaults = BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER];
    return typeof defaults === 'object' ? defaults[calculatorType] : defaults;
  });
  const [brokerCompanyName, setBrokerCompanyName] = useState('');
  
  // Additional fees state
  const [addFeesToggle, setAddFeesToggle] = useState(false);
  const [feeCalculationType, setFeeCalculationType] = useState('');
  const [additionalFeeAmount, setAdditionalFeeAmount] = useState('');

  // Get broker routes and defaults from localStorage (supports runtime updates)
  const getBrokerRoutesAndDefaults = () => {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        routes: parsed?.brokerRoutes || BROKER_ROUTES,
        defaults: parsed?.brokerCommissionDefaults || BROKER_COMMISSION_DEFAULTS,
        tolerance: parsed?.brokerCommissionTolerance ?? BROKER_COMMISSION_TOLERANCE
      };
    } catch (e) {
      return {
        routes: BROKER_ROUTES,
        defaults: BROKER_COMMISSION_DEFAULTS,
        tolerance: BROKER_COMMISSION_TOLERANCE
      };
    }
  };

  // Update commission default when broker route or client type changes
  useEffect(() => {
    if (clientType === 'Broker') {
      const { defaults } = getBrokerRoutesAndDefaults();
      const routeDefaults = defaults[brokerRoute];
      const procFee = typeof routeDefaults === 'object' ? routeDefaults[calculatorType] : (routeDefaults ?? 0.9);
      setBrokerCommissionPercent(procFee);
    }
  }, [clientType, brokerRoute, calculatorType]);

  // Load initial data from quote
  useEffect(() => {
    if (!initialQuote) return;
    
    if (initialQuote.client_type) setClientType(initialQuote.client_type);
    if (initialQuote.client_first_name) setClientFirstName(initialQuote.client_first_name);
    if (initialQuote.client_last_name) setClientLastName(initialQuote.client_last_name);
    if (initialQuote.client_email) setClientEmail(initialQuote.client_email);
    if (initialQuote.client_contact_number) setClientContact(initialQuote.client_contact_number);
    if (initialQuote.broker_company_name) setBrokerCompanyName(initialQuote.broker_company_name);
    if (initialQuote.broker_route) setBrokerRoute(initialQuote.broker_route);
    if (initialQuote.broker_commission_percent != null) {
      setBrokerCommissionPercent(initialQuote.broker_commission_percent);
    }
    if (initialQuote.add_fees_toggle != null) setAddFeesToggle(initialQuote.add_fees_toggle);
    if (initialQuote.fee_calculation_type) setFeeCalculationType(initialQuote.fee_calculation_type);
    if (initialQuote.additional_fee_amount != null) {
      setAdditionalFeeAmount(String(initialQuote.additional_fee_amount));
    }
  }, [initialQuote]);

  // Validate broker commission within tolerance range
  const validateBrokerCommission = (value) => {
    const { defaults, tolerance } = getBrokerRoutesAndDefaults();
    const routeDefaults = defaults[brokerRoute];
    const defaultValue = typeof routeDefaults === 'object' ? routeDefaults[calculatorType] : (routeDefaults ?? 0.9);
    const minValue = defaultValue - tolerance;
    const maxValue = defaultValue + tolerance;
    const numValue = Number(value);

    if (numValue < minValue) return Number(minValue.toFixed(1));
    if (numValue > maxValue) return Number(maxValue.toFixed(1));
    return Number(numValue.toFixed(1));
  };

  // Handle broker commission change with validation
  const handleBrokerCommissionChange = (e) => {
    const value = e.target.value;
    if (value === '' || value === '-') {
      setBrokerCommissionPercent(value);
      return;
    }
    const validated = validateBrokerCommission(value);
    setBrokerCommissionPercent(validated);
  };

  // Get all broker settings as a single object for saving
  const getAllSettings = () => ({
    clientType,
    clientFirstName,
    clientLastName,
    clientEmail,
    clientContact,
    brokerCompanyName: clientType === 'Broker' ? brokerCompanyName : null,
    brokerRoute: clientType === 'Broker' ? brokerRoute : null,
    brokerCommissionPercent: clientType === 'Broker' ? brokerCommissionPercent : null,
    addFeesToggle,
    feeCalculationType,
    additionalFeeAmount
  });

  return {
    // State
    clientType,
    clientFirstName,
    clientLastName,
    clientEmail,
    clientContact,
    brokerRoute,
    brokerCommissionPercent,
    brokerCompanyName,
    addFeesToggle,
    feeCalculationType,
    additionalFeeAmount,
    
    // Setters
    setClientType,
    setClientFirstName,
    setClientLastName,
    setClientEmail,
    setClientContact,
    setBrokerRoute,
    setBrokerCommissionPercent,
    setBrokerCompanyName,
    setAddFeesToggle,
    setFeeCalculationType,
    setAdditionalFeeAmount,
    
    // Handlers
    handleBrokerCommissionChange,
    
    // Utils
    getBrokerRoutesAndDefaults,
    getAllSettings
  };
}
