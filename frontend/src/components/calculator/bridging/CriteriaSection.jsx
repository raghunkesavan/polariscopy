import React from 'react';
import CollapsibleSection from '../CollapsibleSection';
import ModernSwitch from '../../common/ModernSwitch';

/**
 * CriteriaSection - Handles the criteria questions/answers for Bridging calculator
 * Displays dynamic questions based on product scope and handles user answers
 */
const CriteriaSection = ({ 
  expanded, 
  onToggle, 
  questions, 
  answers, 
  onAnswerChange,
  allCriteria,
  chargeType,
  productScope,
  subProductLimits = {},
  isReadOnly = false
}) => {
  const handleAnswerChange = (key, index) => {
    onAnswerChange(key, index);
  };

  return (
    <CollapsibleSection 
      title="Criteria" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="criteria-grid">
        {Object.keys(questions).length === 0 && (
          <div>
            <div>No criteria found for Bridge & Fusion.</div>
            <div className="margin-top-05 text-color-gray">
              Try checking Manage Criteria — available product scopes: {Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean))).join(', ') || 'none'}.
            </div>
          </div>
        )}
        {Object.keys(questions).sort((a,b) => (questions[a].displayOrder || 0) - (questions[b].displayOrder || 0)).map((qk) => {
          const q = questions[qk];
          // compute selected index by matching id or label (safer across re-creates)
          const selectedIndex = q.options.findIndex(opt => {
            const a = answers[qk];
            if (!a) return false;
            if (opt.id && a.id) return opt.id === a.id;
            return (opt.option_label || '').toString().trim() === (a.option_label || '').toString().trim();
          });
          const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
          
          // Detect if this question is a Sub-product selector
          const isSubQuestion = /sub[-_ ]?product|subproduct|property type|property_type|product type/i.test(q.label || qk || '');
          const hideForSecond = isSubQuestion && ((chargeType || '').toString().toLowerCase() === 'second');
          
          // Detect if this question is a Charge type selector
          const isChargeTypeQuestion = /charge[-_ ]?type|chargetype/i.test(q.label || qk || '');
          const isNonResidential = productScope && productScope.toLowerCase() !== 'residential';
          
          // Hide sub-product field if Second charge is selected
          if (hideForSecond) return null;
          
          // For Charge type question: when product scope is not Residential (Commercial/Semi-Commercial)
          // Default to "First Charge" and disable the field
          let effectiveIndex = safeIndex;
          let isDisabled = isReadOnly;
          if (isChargeTypeQuestion && isNonResidential) {
            // Find the "First Charge" or "First charge" option index
            const firstChargeIndex = q.options.findIndex(opt => 
              (opt.option_label || '').toString().toLowerCase().includes('first')
            );
            if (firstChargeIndex >= 0) {
              effectiveIndex = firstChargeIndex;
              // Auto-select First Charge if not already selected
              if (safeIndex !== firstChargeIndex) {
                handleAnswerChange(qk, firstChargeIndex);
              }
            }
            isDisabled = true;
          }
          
          return (
            <div key={qk} className="slds-form-element">
              <label className="slds-form-element__label">{q.label}</label>
              <div className="slds-form-element__control">
                {q.type === 'toggle' ? (
                  <ModernSwitch
                    checked={safeIndex === 1}
                    onToggle={(val) => {
                      const idx = val ? 1 : 0;
                      handleAnswerChange(qk, idx);
                    }}
                    disabled={isDisabled}
                  />
                ) : (
                  <select
                    className="slds-select"
                    value={effectiveIndex}
                    onChange={(e) => handleAnswerChange(qk, Number(e.target.value))}
                    disabled={isDisabled}
                  >
                    {q.options.map((opt, idx) => (
                      <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                    ))}
                  </select>
                )}
                {isDisabled && isChargeTypeQuestion && isNonResidential && (
                  <div className="helper-text text-color-gray margin-top-025">
                    Only First Charge is available for {productScope} properties
                  </div>
                )}
                {/* Show loan/LTV limits for the selected sub-product (if available) */}
                {isSubQuestion && (() => {
                  const opt = q.options[safeIndex];
                  const labelRaw = (opt && opt.option_label) ? opt.option_label.toString().trim() : '';
                  const label = labelRaw.toLowerCase();
                  const normalizeKey = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                  const labelKey = normalizeKey(label);
                  let lim = subProductLimits[labelKey];
                  // fuzzy fallback: try to find a limits entry whose key includes labelKey or vice-versa
                  if (!lim) {
                    const foundKey = Object.keys(subProductLimits).find(k => k.includes(labelKey) || labelKey.includes(k));
                    if (foundKey) lim = subProductLimits[foundKey];
                  }
                  if (!lim) return null;
                  const parts = [];
                  if (lim.minLoan !== null || lim.maxLoan !== null) {
                    const min = lim.minLoan ? `£${Number(lim.minLoan).toLocaleString()}` : '—';
                    const max = lim.maxLoan ? `£${Number(lim.maxLoan).toLocaleString()}` : '—';
                    parts.push(`Loan size: ${min} – ${max}`);
                  }
                  if (lim.minLtv !== null || lim.maxLtv !== null) {
                    const min = lim.minLtv != null ? `${lim.minLtv}%` : '—';
                    const max = lim.maxLtv != null ? `${lim.maxLtv}%` : '—';
                    parts.push(`LTV: ${min} – ${max}`);
                  }
                  if (parts.length === 0) return null;
                  return (
                    <div className="helper-text text-color-gray margin-top-025">{parts.join(' • ')}</div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};

export default CriteriaSection;
