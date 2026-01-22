import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

/**
 * SupportPanel - Support request form panel
 * Can be used anywhere in the app
 */
export default function SupportPanel({ onClose }) {
  const { user } = useUser();
  const { showToast } = useToast();
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    bugType: '',
    suggestion: ''
  });
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Initialize support form with user data
  useEffect(() => {
    if (user) {
      setSupportForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Handle support form submission
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingSupport(true);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: supportForm.name,
          email: supportForm.email,
          bugType: supportForm.bugType,
          suggestion: supportForm.suggestion,
          page: window.location.pathname
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit support request');
      }
      
      showToast({
        kind: 'success',
        title: 'Request Sent',
        subtitle: 'Your support request has been submitted successfully.'
      });
      
      onClose();
      setSupportForm(prev => ({
        ...prev,
        bugType: '',
        suggestion: ''
      }));
    } catch (err) {
      showToast({
        kind: 'error',
        title: 'Error',
        subtitle: 'Failed to submit support request. Please try again.'
      });
    } finally {
      setSubmittingSupport(false);
    }
  };

  return (
    <>
      <div className="slds-backdrop slds-backdrop_open" onClick={onClose}></div>
      <section 
        className="slds-panel slds-panel_docked slds-panel_docked-right slds-is-open" 
        style={{ 
          width: '30rem', 
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          zIndex: 9001,
          backgroundColor: 'var(--token-color-white)'
        }}
      >
        <div className="slds-panel__header" style={{ height: '4rem', minHeight: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: 'var(--token-layer-background)', borderBottom: '1px solid var(--token-border-medium)' }}>
          <h2 className="slds-panel__header-title slds-text-heading_small slds-truncate" style={{ margin: 0, fontWeight: 700 }}>Support</h2>
          <button 
            className="slds-button slds-button_icon slds-button_icon-small" 
            onClick={onClose}
            title="Close"
            style={{ marginLeft: 'auto' }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
            <span className="slds-assistive-text">Close</span>
          </button>
        </div>
        <div className="slds-panel__body" style={{ padding: '1.5rem', overflowY: 'auto', height: 'calc(100vh - 8rem)' }}>
          <form onSubmit={handleSupportSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--token-form-field-gap, 2rem)', marginBottom: '1.5rem' }}>
              <div className="slds-form-element">
                <label className="slds-form-element__label" htmlFor="support-name">
                  <abbr className="slds-required" title="required">* </abbr>Name
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="text"
                    id="support-name"
                    className="slds-input"
                    value={supportForm.name}
                    onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="slds-form-element">
                <label className="slds-form-element__label" htmlFor="support-email">
                  <abbr className="slds-required" title="required">* </abbr>Email
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="email"
                    id="support-email"
                    className="slds-input"
                    value={supportForm.email}
                    onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="slds-form-element slds-m-bottom_medium">
              <label className="slds-form-element__label" htmlFor="support-bug-type">
                Is there a bug?
              </label>
              <div className="slds-form-element__control">
                <select
                  id="support-bug-type"
                  className="slds-select"
                  value={supportForm.bugType}
                  onChange={(e) => setSupportForm({ ...supportForm, bugType: e.target.value })}
                >
                  <option value="">Please select...</option>
                  <option value="calculation">Calculation Issue</option>
                  <option value="display">Display/UI Issue</option>
                  <option value="performance">Performance Issue</option>
                  <option value="data">Data/Rate Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="slds-form-element slds-m-bottom_medium">
              <label className="slds-form-element__label" htmlFor="support-suggestion">
                How would you suggest to improve it?
              </label>
              <div className="slds-form-element__control">
                <textarea
                  id="support-suggestion"
                  className="slds-textarea"
                  rows="5"
                  value={supportForm.suggestion}
                  onChange={(e) => setSupportForm({ ...supportForm, suggestion: e.target.value })}
                  placeholder="Describe the issue or your suggestion..."
                />
              </div>
            </div>
            
            <div className="slds-form-element">
              <button
                type="submit"
                className="slds-button slds-button_brand"
                disabled={submittingSupport}
              >
                {submittingSupport ? 'Sending...' : 'Send request'}
              </button>
            </div>
          </form>
        </div>
        <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid var(--token-border-medium)', padding: '0.75rem 1.5rem', backgroundColor: 'var(--token-layer-background)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--token-text-muted)', fontSize: 'var(--token-font-size-sm)' }}>
            <span style={{ fontSize: 'var(--token-font-size-md)' }}>ℹ️</span>
            <span>V. 2.4 - Updated Auto logout and Caching</span>
          </div>
        </footer>
      </section>
    </>
  );
}

