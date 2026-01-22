import React, { useState } from 'react';
import ModalShell from '../modals/ModalShell';
import '../../styles/slds.css';

function BridgeRateEditModal({ rate, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...rate });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // cast numeric fields
    const out = {
      ...formData,
      rate: formData.rate === '' || formData.rate === null ? null : parseFloat(formData.rate),
      product_fee: formData.product_fee === '' || formData.product_fee === null ? null : Number(formData.product_fee),
      min_term: formData.min_term === '' || formData.min_term === null ? null : Number(formData.min_term),
      max_term: formData.max_term === '' || formData.max_term === null ? null : Number(formData.max_term),
      min_rolled_months: formData.min_rolled_months === '' || formData.min_rolled_months === null ? null : Number(formData.min_rolled_months),
      max_rolled_months: formData.max_rolled_months === '' || formData.max_rolled_months === null ? null : Number(formData.max_rolled_months),
      min_loan: formData.min_loan === '' || formData.min_loan === null ? null : Number(formData.min_loan),
      max_loan: formData.max_loan === '' || formData.max_loan === null ? null : Number(formData.max_loan),
      min_ltv: formData.min_ltv === '' || formData.min_ltv === null ? null : Number(formData.min_ltv),
      max_ltv: formData.max_ltv === '' || formData.max_ltv === null ? null : Number(formData.max_ltv),
      min_icr: formData.min_icr === '' || formData.min_icr === null ? null : Number(formData.min_icr),
      max_defer_int: formData.max_defer_int === '' || formData.max_defer_int === null ? null : Number(formData.max_defer_int),
      erc_1: formData.erc_1 === '' || formData.erc_1 === null ? null : Number(formData.erc_1),
      erc_2: formData.erc_2 === '' || formData.erc_2 === null ? null : Number(formData.erc_2),
    };
    onSave(out);
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onCancel}>Cancel</button>
      <button className="slds-button slds-button_brand" onClick={handleSubmit}>Save</button>
    </>
  );

  return (
    <ModalShell isOpen={true} onClose={onCancel} title={rate && rate.id ? 'Edit Bridge/Fusion Rate' : 'Add Bridge/Fusion Rate'} footer={footerButtons}>
      <form onSubmit={handleSubmit} className="slds-form slds-form_stacked">
        <div className="slds-form-element">
          <label className="slds-form-element__label">Set Key</label>
          <div className="slds-form-element__control">
            <input name="set_key" value={formData.set_key || ''} onChange={handleChange} className="slds-input" required />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Property</label>
          <div className="slds-form-element__control">
            <select name="property" value={formData.property || ''} onChange={handleChange} className="slds-select">
              <option value="Bridge">Bridge</option>
              <option value="Fusion">Fusion</option>
              <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Type</label>
                <div className="slds-form-element__control">
                  <select name="type" value={formData.type || 'Fixed'} onChange={handleChange} className="slds-select">
                    <option value="Fixed">Fixed</option>
                    <option value="Variable">Variable</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Charge Type</label>
                <div className="slds-form-element__control">
                  <select name="charge_type" value={formData.charge_type || ''} onChange={handleChange} className="slds-select">
                    <option value="">(none)</option>
                    <option value="First Charge">First Charge</option>
                    <option value="Second Charge">Second Charge</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Product Fee</label>
                <div className="slds-form-element__control">
                  <input name="product_fee" value={formData.product_fee ?? ''} onChange={handleChange} className="slds-input" type="number" step="0.01" />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Tier</label>
                <div className="slds-form-element__control">
                  <input name="tier" value={formData.tier || ''} onChange={handleChange} className="slds-input" />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Product</label>
                <div className="slds-form-element__control">
                  <input name="product" value={formData.product || ''} onChange={handleChange} className="slds-input" />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Rate (%)</label>
                <div className="slds-form-element__control">
                  <input name="rate" value={formData.rate ?? ''} onChange={handleChange} className="slds-input" type="number" step="0.01" />
                </div>
              </div>

              <div className="slds-form-element slds-grid slds-gutters">
                <div className="slds-col">
                  <label className="slds-form-element__label">Min Term (months)</label>
                  <input name="min_term" value={formData.min_term ?? ''} onChange={handleChange} className="slds-input" type="number" />
                </div>
                <div className="slds-col">
                  <label className="slds-form-element__label">Max Term (months)</label>
                  <input name="max_term" value={formData.max_term ?? ''} onChange={handleChange} className="slds-input" type="number" />
                </div>
              </div>

              <div className="slds-form-element slds-grid slds-gutters">
                <div className="slds-col">
                  <label className="slds-form-element__label">Min Rolled Months</label>
                  <input name="min_rolled_months" value={formData.min_rolled_months ?? ''} onChange={handleChange} className="slds-input" type="number" />
                </div>
                <div className="slds-col">
                  <label className="slds-form-element__label">Max Rolled Months</label>
                  <input name="max_rolled_months" value={formData.max_rolled_months ?? ''} onChange={handleChange} className="slds-input" type="number" />
                </div>
              </div>

              <div className="slds-form-element slds-grid slds-gutters">
                <div className="slds-col">
                  <label className="slds-form-element__label">Min Loan (£)</label>
                  <input name="min_loan" value={formData.min_loan ?? ''} onChange={handleChange} className="slds-input" type="number" />
                </div>
                <div className="slds-col">
                  <label className="slds-form-element__label">Max Loan (£)</label>
                  <input name="max_loan" value={formData.max_loan ?? ''} onChange={handleChange} className="slds-input" type="number" />
                </div>
              </div>

              <div className="slds-form-element slds-grid slds-gutters">
                <div className="slds-col">
                  <label className="slds-form-element__label">Min LTV (%)</label>
                  <input name="min_ltv" value={formData.min_ltv ?? ''} onChange={handleChange} className="slds-input" type="number" step="0.1" />
                </div>
                <div className="slds-col">
                  <label className="slds-form-element__label">Max LTV (%)</label>
                  <input name="max_ltv" value={formData.max_ltv ?? ''} onChange={handleChange} className="slds-input" type="number" step="0.1" />
                </div>
              </div>

              <div className="slds-form-element slds-grid slds-gutters">
                <div className="slds-col">
                  <label className="slds-form-element__label">Min ICR (%)</label>
                  <input name="min_icr" value={formData.min_icr ?? ''} onChange={handleChange} className="slds-input" type="number" step="0.1" />
                </div>
                <div className="slds-col">
                  <label className="slds-form-element__label">Max Defer Int</label>
                  <input name="max_defer_int" value={formData.max_defer_int ?? ''} onChange={handleChange} className="slds-input" type="number" />
                </div>
              </div>

              <div className="slds-form-element slds-grid slds-gutters">
                <div className="slds-col">
                  <label className="slds-form-element__label">ERC 1 (%) - Fusion Only</label>
                  <input name="erc_1" value={formData.erc_1 ?? ''} onChange={handleChange} className="slds-input" type="number" step="0.01" placeholder="e.g., 3" />
                </div>
                <div className="slds-col">
                  <label className="slds-form-element__label">ERC 2 (%) - Fusion Only</label>
                  <input name="erc_2" value={formData.erc_2 ?? ''} onChange={handleChange} className="slds-input" type="number" step="0.01" placeholder="e.g., 1.5" />
                </div>
              </div>

            </form>
    </ModalShell>
  );
}

export default BridgeRateEditModal;
