import { useState, useEffect } from 'react';
import {
  BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE,
  LOCALSTORAGE_CONSTANTS_KEY
} from '../../config/constants';

/**
 * Custom hook for managing broker commission state and validation
 * Handles broker route selection, commission percentage, and tolerance validation
 * 
 * @param {string} clientType - 'Direct' or 'Broker'
 * @param {string} calculatorType - 'btl' or 'bridge'
 * @returns {Object} Broker commission state and helper functions
 */
export function useBrokerCommission(clientType, calculatorType = 'btl') {
  const [brokerRoute, setBrokerRoute] = useState(BROKER_ROUTES.DIRECT_BROKER);
  const defaultCommission = BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER];
  const initialCommission = typeof defaultCommission === 'object' ? defaultCommission[calculatorType] : defaultCommission;
  const [brokerCommissionPercent, setBrokerCommissionPercent] = useState(initialCommission);

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

  // Update commission when client type or broker route changes
  useEffect(() => {
    if (clientType === 'Broker') {
      const { defaults } = getBrokerRoutesAndDefaults();
      const routeDefaults = defaults[brokerRoute];
      const procFee = typeof routeDefaults === 'object' ? routeDefaults[calculatorType] : (routeDefaults ?? 0.9);
      setBrokerCommissionPercent(procFee);
    }
  }, [clientType, brokerRoute, calculatorType]);

  const handleBrokerCommissionChange = (e) => {
    const val = parseFloat(e.target.value);
    if (Number.isNaN(val)) {
      setBrokerCommissionPercent('');
      return;
    }

    const { defaults, tolerance } = getBrokerRoutesAndDefaults();
    const routeDefaults = defaults[brokerRoute];
    const defaultVal = typeof routeDefaults === 'object' ? routeDefaults[calculatorType] : (routeDefaults ?? 0.9);
    const min = defaultVal - tolerance;
    const max = defaultVal + tolerance;

    // Clamp value within allowed range
    const clamped = Math.max(min, Math.min(max, val));
    setBrokerCommissionPercent(clamped);
  };

  const isCommissionValid = () => {
    if (clientType !== 'Broker') return true;
    
    const val = parseFloat(brokerCommissionPercent);
    if (Number.isNaN(val)) return false;

    const { defaults, tolerance } = getBrokerRoutesAndDefaults();
    const routeDefaults = defaults[brokerRoute];
    const defaultVal = typeof routeDefaults === 'object' ? routeDefaults[calculatorType] : (routeDefaults ?? 0.9);
    const min = defaultVal - tolerance;
    const max = defaultVal + tolerance;

    return val >= min && val <= max;
  };

  return {
    brokerRoute,
    setBrokerRoute,
    brokerCommissionPercent,
    setBrokerCommissionPercent,
    handleBrokerCommissionChange,
    getBrokerRoutesAndDefaults,
    isCommissionValid
  };
}
