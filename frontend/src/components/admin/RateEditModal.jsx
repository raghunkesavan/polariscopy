import React, { useState } from 'react';
import ModalShell from '../modals/ModalShell';
import '../../styles/slds.css';

function RateEditModal({ rate, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    ...rate,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      rate: formData.rate === '' || formData.rate === null ? null : parseFloat(formData.rate),
      initial_term: formData.initial_term === '' || formData.initial_term === null ? null : Number(formData.initial_term),
      full_term: formData.full_term === '' || formData.full_term === null ? null : Number(formData.full_term),
      product_fee: formData.product_fee === '' || formData.product_fee === null ? null : Number(formData.product_fee),
      max_ltv: formData.max_ltv === '' || formData.max_ltv === null ? null : parseFloat(formData.max_ltv),
      revert_margin: formData.revert_margin === '' || formData.revert_margin === null ? null : parseFloat(formData.revert_margin),
      min_loan: formData.min_loan === '' || formData.min_loan === null ? null : Number(formData.min_loan),
      max_loan: formData.max_loan === '' || formData.max_loan === null ? null : Number(formData.max_loan),
      max_rolled_months: formData.max_rolled_months === '' || formData.max_rolled_months === null ? null : Number(formData.max_rolled_months),
      max_defer_int: formData.max_defer_int === '' || formData.max_defer_int === null ? null : Number(formData.max_defer_int),
      min_icr: formData.min_icr === '' || formData.min_icr === null ? null : parseFloat(formData.min_icr),
      max_top_slicing: formData.max_top_slicing === '' || formData.max_top_slicing === null ? null : parseFloat(formData.max_top_slicing),
      admin_fee: formData.admin_fee === '' || formData.admin_fee === null ? null : parseFloat(formData.admin_fee),
      erc_1: formData.erc_1 === '' || formData.erc_1 === null ? null : parseFloat(formData.erc_1),
      erc_2: formData.erc_2 === '' || formData.erc_2 === null ? null : parseFloat(formData.erc_2),
      erc_3: formData.erc_3 === '' || formData.erc_3 === null ? null : parseFloat(formData.erc_3),
      erc_4: formData.erc_4 === '' || formData.erc_4 === null ? null : parseFloat(formData.erc_4),
      erc_5: formData.erc_5 === '' || formData.erc_5 === null ? null : parseFloat(formData.erc_5),
      floor_rate: formData.floor_rate === '' || formData.floor_rate === null ? null : parseFloat(formData.floor_rate),
      proc_fee: formData.proc_fee === '' || formData.proc_fee === null ? null : parseFloat(formData.proc_fee)
    });
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onCancel}>
        Cancel
      </button>
      <button className="slds-button slds-button_brand" onClick={handleSubmit}>
        Save
      </button>
    </>
  );

  return (
    <ModalShell isOpen={true} onClose={onCancel} title={rate.id ? 'Edit Rate' : 'Add New Rate'} footer={footerButtons} maxWidth="1000px">
      <form onSubmit={handleSubmit} className="slds-form">
        {/* First field full width */}
        <div className="slds-form-element margin-bottom-1">
          <label className="slds-form-element__label">Set Key:</label>
          <div className="slds-form-element__control">
            <input
              className="slds-input"
              type="text"
              name="set_key"
              value={formData.set_key}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Two-column grid for remaining fields */}
        <div className="grid-2-col-gap-margin">
        <div className="slds-form-element">
                <label className="slds-form-element__label">Property Type:</label>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    name="property"
                    value={formData.property}
                    onChange={handleChange}
                    required
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Semi-Commercial">Semi-Commercial</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Tier:</label>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    name="tier"
                    value={formData.tier}
                    onChange={handleChange}
                    required
                  >
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Product:</label>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    required
                  >
                    <option value="2yr Fix">2yr Fix</option>
                    <option value="3yr Fix">3yr Fix</option>
                    <option value="2yr Tracker">2yr Tracker</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Rate (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Initial Term (months):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="initial_term"
                    value={formData.initial_term ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Full Term (months):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="full_term"
                    value={formData.full_term ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <div className="slds-form-element__control">
                  <div className="slds-checkbox">
                    <input
                      type="checkbox"
                      name="is_tracker"
                      id="is_tracker"
                      checked={formData.is_tracker}
                      onChange={handleChange}
                    />
                    <label className="slds-checkbox__label" htmlFor="is_tracker">
                      <span className="slds-checkbox__faux"></span>
                      <span className="slds-form-element__label">Is Tracker Rate</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Rate Type:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="rate_type"
                    value={formData.rate_type || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <div className="slds-form-element__control">
                  <div className="slds-checkbox">
                    <input
                      type="checkbox"
                      name="is_retention"
                      id="is_retention"
                      checked={formData.is_retention || false}
                      onChange={handleChange}
                    />
                    <label className="slds-checkbox__label" htmlFor="is_retention">
                      <span className="slds-checkbox__faux"></span>
                      <span className="slds-form-element__label">Is Retention</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Product Fee:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="product_fee"
                    value={formData.product_fee ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Max LTV (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="max_ltv"
                    value={formData.max_ltv ?? ''}
                    onChange={handleChange}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Revert Index:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="revert_index"
                    value={formData.revert_index || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Revert Margin (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="revert_margin"
                    value={formData.revert_margin ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Min Loan (£):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="min_loan"
                    value={formData.min_loan ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Max Loan (£):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="max_loan"
                    value={formData.max_loan ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Max Rolled Months:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="max_rolled_months"
                    value={formData.max_rolled_months ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Max Defer Interest:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="max_defer_int"
                    value={formData.max_defer_int ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Min ICR (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="min_icr"
                    value={formData.min_icr ?? ''}
                    onChange={handleChange}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Max Top Slicing:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="max_top_slicing"
                    value={formData.max_top_slicing ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Admin Fee (£):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="admin_fee"
                    value={formData.admin_fee ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">ERC Year 1 (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="erc_1"
                    value={formData.erc_1 ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">ERC Year 2 (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="erc_2"
                    value={formData.erc_2 ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">ERC Year 3 (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="erc_3"
                    value={formData.erc_3 ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">ERC Year 4 (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="erc_4"
                    value={formData.erc_4 ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">ERC Year 5 (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="erc_5"
                    value={formData.erc_5 ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Status:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Floor Rate (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="floor_rate"
                    value={formData.floor_rate ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Proc Fee:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="proc_fee"
                    value={formData.proc_fee ?? ''}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
              </div>
        </div>
            </form>
    </ModalShell>
  );
}

export default RateEditModal;