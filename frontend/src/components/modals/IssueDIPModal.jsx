import React, { useState, useEffect } from 'react';
import Spinner from '../ui/Spinner';
import { useSaveShortcut, useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { useUiPreferences } from '../../hooks/useUiPreferences';
import { useToast } from '../../contexts/ToastContext';
import ModalShell from './ModalShell';
import NotificationModal from './NotificationModal';
import HelpIcon from '../ui/HelpIcon';
import { LOCALSTORAGE_CONSTANTS_KEY } from '../../config/constants';

export default function IssueDIPModal({ 
  isOpen, 
  onClose, 
  quoteId, 
  calculatorType,
  existingDipData = {},
  availableFeeTypes = [], // For BTL: array of fee percentages, For Bridge: ['Fusion', 'Variable Bridge', 'Fixed Bridge']
  allRates = [], // All relevant rates for filtering
  showProductRangeSelection = false, // Show product range selection for BTL
  onSave,
  onCreatePDF,
  onFeeTypeSelected // Callback when fee type is selected to filter rates
}) {
  const { showToast } = useToast();
  
  // Calculate default dates
  const getDefaultDates = () => {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + 14);
    
    return {
      dipDate: today.toISOString().split('T')[0],
      dipExpiryDate: expiryDate.toISOString().split('T')[0]
    };
  };

  const defaults = getDefaultDates();

  const [formData, setFormData] = useState({
    commercial_or_main_residence: existingDipData.commercial_or_main_residence || '',
    dip_date: existingDipData.dip_date || defaults.dipDate,
    dip_expiry_date: existingDipData.dip_expiry_date || defaults.dipExpiryDate,
    applicant_type: existingDipData.applicant_type || '',
    guarantor_name: existingDipData.guarantor_name || '',
    company_number: existingDipData.company_number || '',
    title_number: existingDipData.title_number || '',
    lender_legal_fee: existingDipData.lender_legal_fee || '0',
    number_of_applicants: existingDipData.number_of_applicants || '1',
    overpayments_percent: existingDipData.overpayments_percent || '10',
    fee_type_selection: existingDipData.fee_type_selection || '',
    product_range: existingDipData.product_range || 'specialist', // Core or Specialist
    title_insurance: existingDipData.title_insurance || '' // Yes or No - controls Title Insurance section in PDF - mandatory
  });

  const [securityProperties, setSecurityProperties] = useState(() => {
    // Ensure backward compatibility - add country field if missing
    if (existingDipData.security_properties && Array.isArray(existingDipData.security_properties)) {
      return existingDipData.security_properties.map(prop => ({
        ...prop,
        country: prop.country || 'United Kingdom'
      }));
    }
    return [{ street: '', city: '', postcode: '', country: 'United Kingdom' }];
  });

  const [shareholders, setShareholders] = useState(() => {
    if (existingDipData.shareholders && Array.isArray(existingDipData.shareholders)) {
      return existingDipData.shareholders;
    }
    return [{ name: '' }];
  });

  const [saving, setSaving] = useState(false);
  const uiPrefs = useUiPreferences();
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Postcode lookup state
  const [addressLookup, setAddressLookup] = useState({});
  const [loadingAddresses, setLoadingAddresses] = useState({});

  // Update form data when existingDipData changes (when loading a saved quote)
  useEffect(() => {
    if (existingDipData && Object.keys(existingDipData).length > 0) {
      const defaultDates = getDefaultDates();
      setFormData({
        commercial_or_main_residence: existingDipData.commercial_or_main_residence || '',
        dip_date: existingDipData.dip_date || defaultDates.dipDate,
        dip_expiry_date: existingDipData.dip_expiry_date || defaultDates.dipExpiryDate,
        applicant_type: existingDipData.applicant_type || '',
        guarantor_name: existingDipData.guarantor_name || '',
        company_number: existingDipData.company_number || '',
        title_number: existingDipData.title_number || '',
        lender_legal_fee: existingDipData.lender_legal_fee || '0',
        number_of_applicants: existingDipData.number_of_applicants ? String(existingDipData.number_of_applicants) : '1',
        overpayments_percent: existingDipData.overpayments_percent ? String(existingDipData.overpayments_percent) : '10',
        fee_type_selection: existingDipData.fee_type_selection || '',
        product_range: existingDipData.product_range || 'specialist',
        title_insurance: existingDipData.title_insurance || ''
      });
      
      // Update shareholders
      if (existingDipData.shareholders && Array.isArray(existingDipData.shareholders) && existingDipData.shareholders.length > 0) {
        setShareholders(existingDipData.shareholders);
      }
      
      // Update security properties with backward compatibility
      if (existingDipData.security_properties && Array.isArray(existingDipData.security_properties) && existingDipData.security_properties.length > 0) {
        const propertiesWithCountry = existingDipData.security_properties.map(prop => ({
          ...prop,
          country: prop.country || 'United Kingdom'
        }));
        setSecurityProperties(propertiesWithCountry);
      }
    }
  }, [existingDipData]);
  
  // Ensure all properties have country field set (normalize on mount and after changes)
  useEffect(() => {
    const needsNormalization = securityProperties.some(prop => !prop.country);
    if (needsNormalization) {
      const normalized = securityProperties.map(prop => ({
        ...prop,
        country: prop.country || 'United Kingdom'
      }));
      setSecurityProperties(normalized);
    }
  }, [securityProperties]);

  // Auto-calculate expiry date when DIP date changes
  useEffect(() => {
    if (formData.dip_date) {
      const dipDate = new Date(formData.dip_date);
      const expiryDate = new Date(dipDate);
      expiryDate.setDate(expiryDate.getDate() + 14);
      setFormData(prev => ({
        ...prev,
        dip_expiry_date: expiryDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.dip_date]);
  
  // Keyboard shortcuts - only enabled if user preference allows
  useSaveShortcut(() => {
    if (isOpen && !saving) {
      handleSaveData();
    }
  }, isOpen && uiPrefs.keyboardShortcutsEnabled);
  
  useEscapeKey(() => {
    if (isOpen && !saving) {
      onClose();
    }
  }, isOpen && uiPrefs.keyboardShortcutsEnabled);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If fee type is selected, trigger callback to filter rates
    if (name === 'fee_type_selection' && onFeeTypeSelected) {
      onFeeTypeSelected(value);
    }
  };

  const handlePropertyChange = (index, field, value) => {
    const updatedProperties = [...securityProperties];
    updatedProperties[index][field] = value;
    setSecurityProperties(updatedProperties);
  };

  const addSecurityProperty = () => {
    setSecurityProperties([...securityProperties, { street: '', city: '', postcode: '', country: 'United Kingdom' }]);
  };

  const removeSecurityProperty = (index) => {
    if (securityProperties.length > 1) {
      setSecurityProperties(securityProperties.filter((_, i) => i !== index));
    }
  };

  const handleShareholderChange = (index, value) => {
    const updatedShareholders = [...shareholders];
    updatedShareholders[index].name = value;
    setShareholders(updatedShareholders);
  };

  const addShareholder = () => {
    setShareholders([...shareholders, { name: '' }]);
  };

  const removeShareholder = (index) => {
    if (shareholders.length > 1) {
      setShareholders(shareholders.filter((_, i) => i !== index));
    }
  };

  // Postcode lookup via backend proxy
  const handlePostcodeLookup = async (index) => {
    const postcode = securityProperties[index].postcode.trim();
    if (!postcode) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please enter a postcode first' });
      return;
    }

    setLoadingAddresses({ ...loadingAddresses, [index]: true });
    
    try {
      // Call our backend API instead of external API directly
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const fullUrl = `${apiUrl}/api/postcode-lookup/${encodeURIComponent(postcode)}`;
      
      
      const response = await fetch(fullUrl);
      
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Postcode not found');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.addresses || data.addresses.length === 0) {
        throw new Error('No addresses found for this postcode');
      }

      // Set the address suggestions
      setAddressLookup({ ...addressLookup, [index]: data.addresses });
      
    } catch (err) {
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: err.message || 'Could not find addresses for this postcode. Please check the postcode and try again.' 
      });
      setAddressLookup({ ...addressLookup, [index]: [] });
    } finally {
      setLoadingAddresses({ ...loadingAddresses, [index]: false });
    }
  };

  const handleAddressSelect = (index, address) => {
    const updatedProperties = [...securityProperties];
    updatedProperties[index] = {
      ...updatedProperties[index], // Preserve existing fields like country
      street: address.street,
      city: address.city,
      postcode: address.postcode
    };
    setSecurityProperties(updatedProperties);
    // Clear the lookup results after selection
    setAddressLookup({ ...addressLookup, [index]: [] });
  };

  const validateForm = () => {
    const errors = {};
    
    // Check all mandatory fields and collect errors
    if (!formData.commercial_or_main_residence) {
      errors.commercial_or_main_residence = 'Please select residence type';
    }
    if (!formData.dip_date) {
      errors.dip_date = 'Please enter DIP date';
    }
    if (!formData.dip_expiry_date) {
      errors.dip_expiry_date = 'Please enter DIP expiry date';
    }
    if (!formData.applicant_type) {
      errors.applicant_type = 'Please select applicant type';
    }
    if (formData.applicant_type === 'Corporate' && (!formData.guarantor_name || !formData.guarantor_name.trim())) {
      errors.guarantor_name = 'Please enter guarantor name';
    }
    if (!formData.lender_legal_fee || !formData.lender_legal_fee.trim()) {
      errors.lender_legal_fee = 'Please enter lender legal fee';
    }
    if (!formData.number_of_applicants) {
      errors.number_of_applicants = 'Please select number of applicants';
    }
    if (!formData.overpayments_percent || !formData.overpayments_percent.trim()) {
      errors.overpayments_percent = 'Please enter overpayments percentage';
    }
    if (!formData.fee_type_selection) {
      errors.fee_type_selection = 'Please select fee type';
    }
    if (!formData.title_insurance) {
      errors.title_insurance = 'Please select title insurance option';
    }
    if (showProductRangeSelection && !formData.product_range) {
      errors.product_range = 'Please select product range';
    }
    
    // Check if at least one security property is fully filled
    const hasValidProperty = securityProperties.some(prop => {
      return !!(prop.street && prop.street.trim() && 
                prop.city && prop.city.trim() && 
                prop.postcode && prop.postcode.trim() && 
                prop.country && prop.country.trim());
    });
    if (!hasValidProperty) {
      errors.security_properties = 'Please complete at least one security property (all fields required)';
    }

    setFieldErrors(errors);
    
    // If there are errors, show notification with count
    if (Object.keys(errors).length > 0) {
      const errorCount = Object.keys(errors).length;
      setNotification({ 
        show: true, 
        type: 'warning', 
        title: 'Validation Error', 
        message: `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} in the form` 
      });
      return false;
    }

    return true;
  };

  // Validate individual field on blur
  const validateField = (fieldName, value) => {
    let error = '';
    
    switch(fieldName) {
      case 'commercial_or_main_residence':
        if (!value) error = 'Please select residence type';
        break;
      case 'dip_date':
        if (!value) error = 'Please enter DIP date';
        break;
      case 'dip_expiry_date':
        if (!value) error = 'Please enter DIP expiry date';
        break;
      case 'applicant_type':
        if (!value) error = 'Please select applicant type';
        break;
      case 'guarantor_name':
        if (formData.applicant_type === 'Corporate' && (!value || !value.trim())) {
          error = 'Please enter guarantor name';
        }
        break;
      case 'lender_legal_fee':
        if (!value || !value.trim()) error = 'Please enter lender legal fee';
        break;
      case 'number_of_applicants':
        if (!value) error = 'Please select number of applicants';
        break;
      case 'overpayments_percent':
        if (!value || !value.trim()) error = 'Please enter overpayments percentage';
        break;
      case 'fee_type_selection':
        if (!value) error = 'Please select fee type';
        break;
      case 'title_insurance':
        if (!value) error = 'Please select title insurance option';
        break;
      case 'product_range':
        if (showProductRangeSelection && !value) error = 'Please select product range';
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSaveData = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      // Ensure all properties have country field before saving
      const normalizedProperties = securityProperties.map(prop => ({
        ...prop,
        country: prop.country || 'United Kingdom'
      }));
      
      const dipData = {
        ...formData,
        security_properties: normalizedProperties,
        shareholders: formData.applicant_type === 'Corporate' ? shareholders : undefined,
        dip_status: 'Issued'
      };

      await onSave(quoteId, dipData);
      showToast({ 
        kind: 'success', 
        title: 'DIP data saved successfully!', 
        subtitle: 'The DIP information has been saved to the quote.' 
      });
      onClose(); // Close modal on success
    } catch (err) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to save DIP data: ' + (err.message || 'Unknown error') });
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePDF = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      // Ensure all properties have country field before saving
      const normalizedProperties = securityProperties.map(prop => ({
        ...prop,
        country: prop.country || 'United Kingdom'
      }));
      
      // First save the data
      const dipData = {
        ...formData,
        security_properties: normalizedProperties,
        shareholders: formData.applicant_type === 'Corporate' ? shareholders : undefined,
        dip_status: 'Issued'
      };

      await onSave(quoteId, dipData);
      
      // Then generate PDF
      await onCreatePDF(quoteId);
      
      showToast({ 
        kind: 'success', 
        title: 'DIP PDF Created Successfully!', 
        subtitle: 'The DIP data has been saved and the PDF document has been generated.' 
      });
      onClose(); // Close modal on success
    } catch (err) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to create DIP PDF: ' + (err.message || 'Unknown error') });
    } finally {
      setSaving(false);
    }
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button
        className="slds-button slds-button_neutral display-flex align-items-center flex-gap-05"
        onClick={handleSaveData}
        disabled={saving}
      >
        {saving && <Spinner label="Saving..." />}
        {!saving && 'Save Data'}
      </button>
      <button
        className="slds-button slds-button_brand display-flex align-items-center flex-gap-05"
        onClick={handleCreatePDF}
        disabled={saving}
      >
        {saving && <Spinner label="Creating..." />}
        {!saving && 'Create PDF'}
      </button>
    </>
  );

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title="Issue DIP (Decision in Principle)" footer={footerButtons}>
      {/* Product Range (BTL only) and Fee Type moved to top per request */}
      {showProductRangeSelection && calculatorType === 'BTL' && (
        <div className="slds-form-element margin-bottom-1">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> Product Range for DIP
          </label>
          <div className="slds-form-element__control">
            <select 
              className={`slds-select ${fieldErrors.product_range ? 'error-border' : ''}`}
              name="product_range"
              value={formData.product_range}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              aria-invalid={fieldErrors.product_range ? 'true' : 'false'}
              aria-describedby={fieldErrors.product_range ? 'error-product_range' : undefined}
            >
              <option value="specialist">Specialist</option>
              <option value="core">Core</option>
            </select>
          </div>
          {fieldErrors.product_range && (
            <div id="error-product_range" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.product_range}
            </div>
          )}
          <div className="slds-form-element__help slds-text-body_small helper-text margin-top-025">
            Select which product range to use for this DIP
          </div>
        </div>
      )}

      {/* Fee Type Selection */}
      <div className="slds-form-element margin-bottom-1">
        <label className="slds-form-element__label">
          <abbr className="slds-required" title="required">*</abbr> {calculatorType === 'BTL' ? 'Choose Fee Type' : 'Choose Product Type'}
        </label>
        <div className="slds-form-element__control">
          <select 
            className={`slds-select ${fieldErrors.fee_type_selection ? 'error-border' : ''}`}
            name="fee_type_selection"
            value={formData.fee_type_selection}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            aria-invalid={fieldErrors.fee_type_selection ? 'true' : 'false'}
            aria-describedby={fieldErrors.fee_type_selection ? 'error-fee_type_selection' : undefined}
          >
            <option value="">Select...</option>
            {availableFeeTypes.map((feeType, idx) => (
              <option key={idx} value={feeType}>{feeType}</option>
            ))}
          </select>
        </div>
        {fieldErrors.fee_type_selection && (
          <div id="error-fee_type_selection" className="field-error-message" role="alert">
            ⚠️ {fieldErrors.fee_type_selection}
          </div>
        )}
      </div>

      {/* Residence Type (kept after top selections) */}
      <div className="slds-form-element margin-bottom-1">
        <label className="slds-form-element__label">
          <abbr className="slds-required" title="required">*</abbr> Commercial or Main Residence
        </label>
        <div className="slds-form-element__control">
          <select 
            className={`slds-select ${fieldErrors.commercial_or_main_residence ? 'error-border' : ''}`}
            name="commercial_or_main_residence"
            value={formData.commercial_or_main_residence}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-invalid={fieldErrors.commercial_or_main_residence ? 'true' : 'false'}
            aria-describedby={fieldErrors.commercial_or_main_residence ? 'error-commercial_or_main_residence' : undefined}
          >
            <option value="">Select...</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        {fieldErrors.commercial_or_main_residence && (
          <div id="error-commercial_or_main_residence" className="field-error-message" role="alert">
            ⚠️ {fieldErrors.commercial_or_main_residence}
          </div>
        )}
      </div>

      {/* DIP Dates */}
      <div className="grid-2-col-gap-margin">
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> DIP Date
          </label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className={`slds-input ${fieldErrors.dip_date ? 'error-border' : ''}`}
              name="dip_date"
              value={formData.dip_date}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              aria-invalid={fieldErrors.dip_date ? 'true' : 'false'}
              aria-describedby={fieldErrors.dip_date ? 'error-dip_date' : undefined}
            />
          </div>
          {fieldErrors.dip_date && (
            <div id="error-dip_date" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.dip_date}
            </div>
          )}
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> DIP Expiry Date
          </label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className={`slds-input ${fieldErrors.dip_expiry_date ? 'error-border' : ''}`}
              name="dip_expiry_date"
              value={formData.dip_expiry_date}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              aria-invalid={fieldErrors.dip_expiry_date ? 'true' : 'false'}
              aria-describedby={fieldErrors.dip_expiry_date ? 'error-dip_expiry_date' : undefined}
            />
          </div>
          {fieldErrors.dip_expiry_date && (
            <div id="error-dip_expiry_date" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.dip_expiry_date}
            </div>
          )}
        </div>
      </div>

      {/* Title Number and Applicant Type */}
      <div className="grid-2-col-gap-margin">
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            Title Number
          </label>
          <div className="slds-form-element__control">
            <input 
              type="text" 
              className="slds-input"
              name="title_number"
              value={formData.title_number}
              onChange={handleInputChange}
              placeholder="Enter title number"
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> Applicant Type
          </label>
          <div className="slds-form-element__control">
            <select
              className={`slds-select ${fieldErrors.applicant_type ? 'error-border' : ''}`}
              name="applicant_type"
              value={formData.applicant_type}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              aria-invalid={fieldErrors.applicant_type ? 'true' : 'false'}
              aria-describedby={fieldErrors.applicant_type ? 'error-applicant_type' : undefined}
            >
              <option value="">Select Applicant Type</option>
              <option value="Personal">Personal</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>
          {fieldErrors.applicant_type && (
            <div id="error-applicant_type" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.applicant_type}
            </div>
          )}
        </div>
      </div>

      {/* Company Number and Guarantor Name (if Corporate) */}
      {formData.applicant_type === 'Corporate' && (
        <div className="grid-2-col-gap-margin">
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              Company Number
            </label>
            <div className="slds-form-element__control">
              <input 
                type="text" 
                className="slds-input"
                name="company_number"
                value={formData.company_number}
                onChange={handleInputChange}
                placeholder="Enter company number"
              />
            </div>
          </div>

          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <abbr className="slds-required" title="required">*</abbr> Guarantor Name
            </label>
            <div className="slds-form-element__control">
              <input 
                type="text" 
                className={`slds-input ${fieldErrors.guarantor_name ? 'error-border' : ''}`}
                name="guarantor_name"
                value={formData.guarantor_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Enter guarantor name"
                required
                aria-invalid={fieldErrors.guarantor_name ? 'true' : 'false'}
                aria-describedby={fieldErrors.guarantor_name ? 'error-guarantor_name' : undefined}
              />
            </div>
            {fieldErrors.guarantor_name && (
              <div id="error-guarantor_name" className="field-error-message" role="alert">
                ⚠️ {fieldErrors.guarantor_name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shareholders (if Corporate) */}
      {formData.applicant_type === 'Corporate' && (
        <div className="slds-form-element margin-bottom-1">
          <label className="slds-form-element__label">
            Shareholders
          </label>
          {shareholders.map((shareholder, index) => (
            <div key={index} className="slds-form-element__control" style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="slds-input"
                value={shareholder.name}
                onChange={(e) => handleShareholderChange(index, e.target.value)}
                placeholder="Enter shareholder name"
                style={{ flex: 1 }}
              />
              {shareholders.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeShareholder(index)}
                  className="slds-button slds-button_icon slds-button_icon-container"
                  title="Remove shareholder"
                >
                  <span className="slds-icon_container">
                    <svg className="slds-icon slds-icon-text-default" style={{ width: '16px', height: '16px' }}>
                      <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#delete"></use>
                    </svg>
                  </span>
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={addShareholder}
            className="slds-button slds-button_neutral"
            style={{ marginTop: '4px' }}
          >
            + Add Shareholder
          </button>
        </div>
      )}

      {/* Lender Legal Fee and Number of Applicants */}
      <div className="grid-2-col-gap-margin">
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> Lender Legal Fee (£)
            <HelpIcon content="Legal fees charged by the lender for processing the loan. This is typically a fixed amount or percentage of the loan value. Common ranges: £500-£2000." />
          </label>
          <div className="slds-form-element__control">
            <input 
              type="number" 
              className={`slds-input ${fieldErrors.lender_legal_fee ? 'error-border' : ''}`}
              name="lender_legal_fee"
              value={formData.lender_legal_fee}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="0.00"
              step="0.01"
              required
              aria-invalid={fieldErrors.lender_legal_fee ? 'true' : 'false'}
              aria-describedby={fieldErrors.lender_legal_fee ? 'error-lender_legal_fee' : undefined}
            />
          </div>
          {fieldErrors.lender_legal_fee && (
            <div id="error-lender_legal_fee" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.lender_legal_fee}
            </div>
          )}
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> Number of Applicants
          </label>
          <div className="slds-form-element__control">
            <select 
              className={`slds-select ${fieldErrors.number_of_applicants ? 'error-border' : ''}`}
              name="number_of_applicants"
              value={formData.number_of_applicants}
              onChange={handleInputChange}
              onBlur={handleBlur}
              aria-invalid={fieldErrors.number_of_applicants ? 'true' : 'false'}
              aria-describedby={fieldErrors.number_of_applicants ? 'error-number_of_applicants' : undefined}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          {fieldErrors.number_of_applicants && (
            <div id="error-number_of_applicants" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.number_of_applicants}
            </div>
          )}
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> Title Insurance
            <HelpIcon content="Select 'Yes' to include Title Insurance in the DIP. The Title Insurance premium (£250) will be deducted from the Net Loan at drawdown. Select 'No' to exclude this section from the DIP PDF." />
          </label>
          <div className="slds-form-element__control">
            <select 
              className={`slds-select ${fieldErrors.title_insurance ? 'error-border' : ''}`}
              name="title_insurance"
              value={formData.title_insurance}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              aria-invalid={fieldErrors.title_insurance ? 'true' : 'false'}
              aria-describedby={fieldErrors.title_insurance ? 'error-title_insurance' : undefined}
            >
              <option value="">Select...</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {fieldErrors.title_insurance && (
            <div id="error-title_insurance" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.title_insurance}
            </div>
          )}
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> Overpayments %
            <HelpIcon content="The percentage of the loan amount that can be repaid early without penalty. Typical values range from 10% to 20% per year. Default is 10%." />
          </label>
          <div className="slds-form-element__control">
            <input 
              type="number" 
              className={`slds-input ${fieldErrors.overpayments_percent ? 'error-border' : ''}`}
              name="overpayments_percent"
              value={formData.overpayments_percent}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="10"
              step="0.1"
              min="0"
              max="100"
              required
              aria-invalid={fieldErrors.overpayments_percent ? 'true' : 'false'}
              aria-describedby={fieldErrors.overpayments_percent ? 'error-overpayments_percent' : undefined}
            />
          </div>
          {fieldErrors.overpayments_percent && (
            <div id="error-overpayments_percent" className="field-error-message" role="alert">
              ⚠️ {fieldErrors.overpayments_percent}
            </div>
          )}
        </div>
      </div>

          {/* Security Properties */}
          <div className="margin-bottom-1">
            <label className="slds-form-element__label">
              <abbr className="slds-required" title="required">*</abbr> Security Property Address
            </label>
            
            {securityProperties.map((property, index) => (
              <div key={index} className="property-card">
                {securityProperties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSecurityProperty(index)}
                    className="slds-button slds-button_destructive"
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: 'var(--token-font-size-xs)', padding: '0 0.5rem' }}
                  >
                    Remove
                  </button>
                )}
                
                {/* Postcode field FIRST with Find Address button */}
                <div className="margin-bottom-05">
                  <label className="slds-form-element__label slds-text-body_small">
                    <abbr className="slds-required" title="required">*</abbr> Postcode
                  </label>
                  <div className="display-flex flex-gap-05">
                    <input 
                      type="text" 
                      className="slds-input flex-1" 
                      value={property.postcode}
                      onChange={(e) => handlePropertyChange(index, 'postcode', e.target.value.toUpperCase())}
                      placeholder="e.g. W1J 7DP"
                    />
                    <button
                      type="button"
                      className="slds-button slds-button_brand"
                      onClick={() => handlePostcodeLookup(index)}
                      disabled={loadingAddresses[index] || !property.postcode}
                    >
                      {loadingAddresses[index] ? 'Loading...' : 'Find Address'}
                    </button>
                  </div>
                </div>

                {/* Address selection dropdown */}
                {addressLookup[index] && addressLookup[index].length > 0 && (
                  <div className="margin-bottom-05">
                    <label className="slds-form-element__label slds-text-body_small">Select Address</label>
                    <select
                      className="slds-select"
                      onChange={(e) => {
                        const selectedAddress = addressLookup[index][e.target.value];
                        if (selectedAddress) {
                          handleAddressSelect(index, selectedAddress);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Choose an address --</option>
                      {addressLookup[index].map((addr, addrIndex) => (
                        <option key={addrIndex} value={addrIndex}>
                          {addr.display}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="margin-bottom-05">
                  <label className="slds-form-element__label slds-text-body_small">Street</label>
                  <input 
                    type="text" 
                    className="slds-input" 
                    value={property.street}
                    onChange={(e) => handlePropertyChange(index, 'street', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>
                
                <div className="margin-bottom-05">
                  <label className="slds-form-element__label slds-text-body_small">City</label>
                  <input 
                    type="text" 
                    className="slds-input" 
                    value={property.city}
                    onChange={(e) => handlePropertyChange(index, 'city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                
                <div className="margin-bottom-05">
                  <label className="slds-form-element__label slds-text-body_small">
                    <abbr className="slds-required" title="required">*</abbr> Country
                  </label>
                  <input 
                    type="text" 
                    className="slds-input" 
                    value={property.country ?? 'United Kingdom'}
                    onChange={(e) => handlePropertyChange(index, 'country', e.target.value)}
                    onFocus={(e) => {
                      // Ensure country field is set when user focuses on it
                      if (!property.country) {
                        handlePropertyChange(index, 'country', 'United Kingdom');
                      }
                    }}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              className="slds-button slds-button_neutral margin-top-05" 
              onClick={addSecurityProperty}
            >
              + Add Another Property
            </button>
            
            {fieldErrors.security_properties && (
              <div className="slds-form-element__help error-message" id="error-security_properties">
                ⚠️ {fieldErrors.security_properties}
              </div>
            )}
          </div>
    </ModalShell>
    
    <NotificationModal
      isOpen={notification.show}
      onClose={() => setNotification({ ...notification, show: false })}
      type={notification.type}
      title={notification.title}
      message={notification.message}
    />
    </>
  );
}
