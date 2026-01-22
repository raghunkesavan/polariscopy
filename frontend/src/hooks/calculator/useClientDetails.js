import { useState } from 'react';

/**
 * Custom hook for managing client details form state
 * Handles both Direct and Broker client types
 * 
 * @param {string} initialType - Initial client type ('Direct' or 'Broker')
 * @returns {Object} Client details state and setters
 */
export function useClientDetails(initialType = 'Direct') {
  const [clientType, setClientType] = useState(initialType);
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [brokerCompanyName, setBrokerCompanyName] = useState('');

  const resetClientDetails = () => {
    setClientFirstName('');
    setClientLastName('');
    setClientEmail('');
    setClientContact('');
    setBrokerCompanyName('');
  };

  const setClientDetails = (details) => {
    if (details.clientType) setClientType(details.clientType);
    if (details.clientFirstName !== undefined) setClientFirstName(details.clientFirstName);
    if (details.clientLastName !== undefined) setClientLastName(details.clientLastName);
    if (details.clientEmail !== undefined) setClientEmail(details.clientEmail);
    if (details.clientContact !== undefined) setClientContact(details.clientContact);
    if (details.brokerCompanyName !== undefined) setBrokerCompanyName(details.brokerCompanyName);
  };

  return {
    clientType,
    setClientType,
    clientFirstName,
    setClientFirstName,
    clientLastName,
    setClientLastName,
    clientEmail,
    setClientEmail,
    clientContact,
    setClientContact,
    brokerCompanyName,
    setBrokerCompanyName,
    resetClientDetails,
    setClientDetails
  };
}
