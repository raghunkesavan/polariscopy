import React, { useState, useEffect } from 'react';
import Spinner from '../ui/Spinner';
import { useSaveShortcut, useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { useUiPreferences } from '../../hooks/useUiPreferences';
import { useToast } from '../../contexts/ToastContext';
import ModalShell from './ModalShell';
import NotificationModal from './NotificationModal';
import HelpIcon from '../ui/HelpIcon';

// Assumptions removed per UX request

export default function IssueQuoteModal({
  isOpen,
  onClose,
  quoteId,
  calculatorType, // 'BTL' or 'Bridging'
  availableFeeRanges = [],
  existingQuoteData = {},
  onSave,
  onCreatePDF,
}) {
  const { showToast } = useToast();
  const [selectedFeeRanges, setSelectedFeeRanges] = useState([]);
  // Assumptions UI removed; keep no assumptions state
  const [borrowerName, setBorrowerName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [productRange, setProductRange] = useState('specialist'); // Core/Specialist selector for which quote to issue
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  const uiPrefs = useUiPreferences();
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingQuoteData && Object.keys(existingQuoteData).length > 0) {
        // Load existing data
        if (existingQuoteData.quote_selected_fee_ranges) {
          setSelectedFeeRanges(existingQuoteData.quote_selected_fee_ranges);
        } else {
          setSelectedFeeRanges([]);
        }
        
        // quote_assumptions intentionally ignored after removing Assumptions UI
        
        if (existingQuoteData.quote_borrower_name) {
          setBorrowerName(existingQuoteData.quote_borrower_name);
        } else if (existingQuoteData.borrower_name) {
          setBorrowerName(existingQuoteData.borrower_name);
        } else {
          setBorrowerName('');
        }
        
        if (existingQuoteData.quote_additional_notes) {
          setAdditionalNotes(existingQuoteData.quote_additional_notes);
        } else {
          setAdditionalNotes('');
        }

        // Prefer explicitly saved quote product range, fallback to selected_range on quote
        if (existingQuoteData.quote_product_range) {
          setProductRange(existingQuoteData.quote_product_range);
        } else if (existingQuoteData.selected_range) {
          setProductRange(existingQuoteData.selected_range);
        } else {
          setProductRange('specialist');
        }
      } else {
        // Reset to defaults for new quote
          setSelectedFeeRanges([]);
          setBorrowerName('');
          setAdditionalNotes('');
          setProductRange('specialist');
      }
    }
  }, [isOpen, existingQuoteData]);
  
  // Keyboard shortcuts - only enabled if user preference allows
  useSaveShortcut(() => {
    if (isOpen && !isSaving) {
      handleSave();
    }
  }, isOpen && uiPrefs.keyboardShortcutsEnabled);
  
  useEscapeKey(() => {
    if (isOpen && !isSaving) {
      onClose();
    }
  }, isOpen && uiPrefs.keyboardShortcutsEnabled);

  const handleFeeRangeToggle = (feeRange) => {
    setSelectedFeeRanges(prev => {
      if (prev.includes(feeRange)) {
        return prev.filter(f => f !== feeRange);
      } else {
        return [...prev, feeRange];
      }
    });
  };

  // Assumption handlers removed

  // Validate all fields
  const validateForm = () => {
    const errors = {};
    
    if (!borrowerName.trim()) {
      errors.borrowerName = 'Borrower name is required';
    }
    
    if (selectedFeeRanges.length === 0) {
      errors.selectedFeeRanges = 'Please select at least one fee range';
    }

    // Only validate product range for BTL calculator
    if (calculatorType === 'BTL' && !productRange) {
      errors.productRange = 'Please select a product range';
    }
    
    setFieldErrors(errors);
    
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
      case 'borrowerName':
        if (!value.trim()) error = 'Borrower name is required';
        break;
      case 'selectedFeeRanges':
        if (!value || value.length === 0) error = 'Please select at least one fee range';
        break;
      case 'productRange':
        // Only validate product range for BTL calculator
        if (calculatorType === 'BTL' && !value) error = 'Please select a product range';
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const handleSave = async () => {
    if (!quoteId) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please save the quote first before issuing a quote.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const quoteData = {
        quote_selected_fee_ranges: selectedFeeRanges,
        // Assumptions removed from UI; send empty array to keep payload stable
        quote_assumptions: [],
        quote_borrower_name: borrowerName.trim(),
        quote_additional_notes: additionalNotes.trim(),
        quote_product_range: productRange,
        quote_issued_at: new Date().toISOString(),
        quote_status: 'Issued',
      };

      await onSave(quoteId, quoteData);
      showToast({ 
        kind: 'success', 
        title: 'Quote data saved successfully!', 
        subtitle: 'The quote information has been saved.' 
      });
      
      // Reset selected fee ranges after issuing quote
      setSelectedFeeRanges([]);
      
      onClose(); // Close modal on success
    } catch (err) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to save quote data: ' + (err.message || String(err)) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePDF = async () => {
    if (!quoteId) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please save the quote first.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Save first
      await handleSave();
      
      // Then generate PDF
      await onCreatePDF(quoteId);
      showToast({ 
        kind: 'success', 
        title: 'Quote PDF Created Successfully!', 
        subtitle: 'The quote data has been saved and the PDF document has been generated.' 
      });
      onClose(); // Close modal on success
    } catch (err) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to create quote PDF: ' + (err.message || String(err)) });
    } finally {
      setIsSaving(false);
    }
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onClose}>
        Cancel
      </button>
      <button
        className="slds-button slds-button_neutral display-flex align-items-center flex-gap-05"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving && <Spinner size="small" label="Saving..." />}
        {!isSaving && 'Save Quote Data'}
      </button>
      <button
        className="slds-button slds-button_brand display-flex align-items-center flex-gap-05"
        onClick={handleCreatePDF}
        disabled={isSaving}
      >
        {isSaving && <Spinner size="small" label="Creating..." />}
        {!isSaving && 'Create Quote PDF'}
      </button>
    </>
  );

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title={`Issue ${calculatorType} Quote`} footer={footerButtons}>
      {/* Product Range for Quote - BTL Only */}
      {calculatorType === 'BTL' && (
        <div className="slds-form-element margin-bottom-15">
          <label className="slds-form-element__label">
            <span className="text-color-error">*</span> Product Range to use
          </label>
          <div className="slds-form-element__control">
            <select
              className={`slds-select ${fieldErrors.productRange ? 'error-border' : ''}`}
              value={productRange}
              onChange={(e) => setProductRange(e.target.value)}
              onBlur={() => validateField('productRange', productRange)}
            >
              <option value="specialist">Specialist</option>
              <option value="core">Core</option>
            </select>
          </div>
          {fieldErrors.productRange && (
            <div className="field-error-message" role="alert">⚠️ {fieldErrors.productRange}</div>
          )}
        </div>
      )}
      {/* Borrower Name */}
      <div className="slds-form-element margin-bottom-15">
        <label className="slds-form-element__label">
          <span className="text-color-error">*</span> Borrower Name
        </label>
        <div className="slds-form-element__control">
          <input
            className={`slds-input ${fieldErrors.borrowerName ? 'error-border' : ''}`}
            type="text"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            onBlur={(e) => validateField('borrowerName', e.target.value)}
            placeholder="Enter borrower name"
            aria-invalid={fieldErrors.borrowerName ? 'true' : 'false'}
            aria-describedby={fieldErrors.borrowerName ? 'error-borrowerName' : undefined}
          />
        </div>
        {fieldErrors.borrowerName && (
          <div id="error-borrowerName" className="field-error-message" role="alert">
            ⚠️ {fieldErrors.borrowerName}
          </div>
        )}
      </div>

      {/* Fee Range Selection */}
      <div className="slds-form-element margin-bottom-15">
        <label className="slds-form-element__label">
          <span className="text-color-error">*</span> Select Fee Ranges to Include in Quote
          <HelpIcon content="Fee ranges determine the lender fees included in the quote. Select all applicable ranges. Multiple selections allow clients to compare options. Common ranges: 0-2%, 2-3%, 3%+." />
        </label>
        <div className="slds-form-element__control">
          {availableFeeRanges.length === 0 ? (
            <p className="text-color-muted text-italic">No fee ranges available</p>
          ) : (
            <div className={`grid-auto-fill-150 ${fieldErrors.selectedFeeRanges ? 'error-border' : ''}`} style={{padding: '0.5rem', borderRadius: '4px'}}>
              {availableFeeRanges.map((feeRange) => (
                <label key={feeRange} className="display-flex align-items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFeeRanges.includes(feeRange)}
                    onChange={() => {
                      handleFeeRangeToggle(feeRange);
                      // Clear error when user selects at least one
                      if (selectedFeeRanges.length === 0) {
                        validateField('selectedFeeRanges', [feeRange]);
                      }
                    }}
                    className="margin-right-05"
                  />
                  <span>{feeRange}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {fieldErrors.selectedFeeRanges && (
          <div id="error-selectedFeeRanges" className="field-error-message" role="alert">
            ⚠️ {fieldErrors.selectedFeeRanges}
          </div>
        )}
      </div>

            {/* Assumptions section removed */}

            {/* Additional Notes */}
            <div className="slds-form-element">
              <label className="slds-form-element__label">Additional Notes</label>
              <div className="slds-form-element__control">
                <textarea
                  className="slds-textarea"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Add any additional notes here..."
                  rows="4"
                />
              </div>
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
