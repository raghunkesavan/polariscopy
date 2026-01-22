import React, { useState } from 'react';
import ModalShell from '../modals/ModalShell';
import '../../styles/slds.css';

function CriteriaEditModal({ criteria, onSave, onCancel, isNew }) {
  const [formData, setFormData] = useState({
    criteria_set: criteria.criteria_set || '',
    product_scope: criteria.product_scope || '',
    question_group: criteria.question_group || '',
    question_key: criteria.question_key || '',
    question_label: criteria.question_label || '',
    option_label: criteria.option_label || '',
    tier: criteria.tier || '',
    property_type: criteria.property_type || '',
    helper: criteria.helper || '',
    info_tip: criteria.info_tip || '',
    display_order: criteria.display_order !== undefined && criteria.display_order !== null ? String(criteria.display_order) : ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // pass isNew flag and original criteria so parent can choose insert vs update
    // and still match original composite keys when they are edited
    const payload = { ...formData };
    // normalize display_order to number or null
    if (payload.display_order === '') payload.display_order = null;
    else payload.display_order = Number(payload.display_order);
    onSave(payload, isNew, criteria);
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onCancel}>
        Cancel
      </button>
      <button className="slds-button slds-button_brand" onClick={handleSubmit}>
        {isNew ? 'Add' : 'Save'}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={true} onClose={onCancel} title={isNew ? 'Add New Criteria' : 'Edit Criteria'} footer={footerButtons}>
      <form onSubmit={handleSubmit} className="slds-form slds-form_stacked">
        <div className="slds-form-element">
          <label className="slds-form-element__label">Criteria Set:</label>
          <div className="slds-form-element__control">
            <input
              className="slds-input"
                    type="text"
                    name="criteria_set"
                    value={formData.criteria_set}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Product Scope:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="product_scope"
                    value={formData.product_scope}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Question Group:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="question_group"
                    value={formData.question_group}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Question Key:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="question_key"
                    value={formData.question_key}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Question Label:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="question_label"
                    value={formData.question_label}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Option Label:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="option_label"
                    value={formData.option_label}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Tier:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="tier"
                    value={formData.tier}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Property Type:</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="text"
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Display Order (optional)</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Helper:</label>
                <div className="slds-form-element__control">
                  <textarea
                    className="slds-textarea"
                    name="helper"
                    value={formData.helper}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Info Tip (shown to users)</label>
                <div className="slds-form-element__control">
                  <textarea
                    className="slds-textarea"
                    name="info_tip"
                    value={formData.info_tip}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Short help text or guidance for this question"
                  />
                </div>
              </div>
            </form>
    </ModalShell>
  );
}

export default CriteriaEditModal;