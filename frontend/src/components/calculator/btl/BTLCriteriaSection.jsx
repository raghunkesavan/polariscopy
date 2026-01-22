import React from 'react';
import CollapsibleSection from '../CollapsibleSection';
import HelpIcon from '../../ui/HelpIcon';

/**
 * BTLCriteriaSection - Handles criteria questions/answers for BTL Calculator
 * Displays dynamic questions with info tooltips using Carbon Tooltip
 */
const BTLCriteriaSection = ({ 
  expanded, 
  onToggle,
  loading,
  error,
  questions,
  answers,
  orderedQuestionKeys,
  onAnswerChange,
  isReadOnly = false
}) => {
  return (
    <CollapsibleSection 
      title="Criteria" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      {loading && <div>Loading criteria…</div>}
      {error && <div className="slds-text-color_error">{error}</div>}
      {!loading && !error && (
        <div className="criteria-grid">
          {Object.keys(questions).length === 0 && <div>No criteria found for this set/scope.</div>}
          {orderedQuestionKeys.map((qk) => {
            const q = questions[qk];
            return (
              <div key={qk} className="slds-form-element">
                <label className="slds-form-element__label">
                  <span className="required-asterisk">*</span>{q.label}
                  {q.infoTip && <HelpIcon content={q.infoTip} align="top" label={`Info: ${q.label}`} />}
                </label>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    value={(() => {
                      const selectedIndex = q.options.findIndex(opt => {
                        const a = answers[qk];
                        if (!a) return false;
                        if (opt.id && a.id) return opt.id === a.id;
                        return (opt.option_label || '').toString().trim() === (a.option_label || '').toString().trim();
                      });
                      return selectedIndex >= 0 ? selectedIndex : 0;
                    })()}
                    onChange={(e) => onAnswerChange(qk, Number(e.target.value))}
                    disabled={isReadOnly}
                  >
                    {q.options.map((opt, idx) => (
                      <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
};

export default BTLCriteriaSection;
