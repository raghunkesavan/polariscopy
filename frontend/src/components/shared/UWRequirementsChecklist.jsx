import { useEffect, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import SalesforceIcon from './SalesforceIcon';
import {
  DEFAULT_UW_REQUIREMENTS,
  UW_STAGES,
  CATEGORY_ORDER,
  LOCALSTORAGE_UW_REQUIREMENTS_KEY,
  filterByStage,
  filterByConditions
} from '../../config/uwRequirements';
import { downloadUWRequirementsPDF } from '../../utils/generateUWRequirementsPDF';
import '../../styles/slds.css';
import '../../styles/UWRequirementsChecklist.css';

/**
 * Read UW requirements from localStorage (merged with defaults to include new items)
 */
function getRequirements() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_UW_REQUIREMENTS_KEY);
    if (raw) {
      const overrides = JSON.parse(raw);
      if (Array.isArray(overrides)) {
        // Merge overrides with defaults
        const overrideMap = new Map(overrides.map(r => [r.id, r]));
        const defaultIds = new Set(DEFAULT_UW_REQUIREMENTS.map(r => r.id));
        
        // Update defaults with any overrides
        const merged = DEFAULT_UW_REQUIREMENTS.map(defaultReq => {
          const override = overrideMap.get(defaultReq.id);
          return override ? { ...defaultReq, ...override } : defaultReq;
        });
        
        // Add any custom requirements from overrides that aren't in defaults
        overrides.forEach(override => {
          if (!defaultIds.has(override.id)) {
            merged.push(override);
          }
        });
        
        return merged;
      }
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_UW_REQUIREMENTS;
}

/**
 * UW Requirements Checklist Component
 * Displays the applicable UW requirements for a DIP or Quote
 * 
 * Props:
 * - stage: 'DIP' or 'Indicative' (which stage to show requirements for)
 * - quoteData: Quote/DIP data object for evaluating conditional requirements
 * - checkedItems: Array of requirement IDs that have been checked/received
 * - onCheckChange: Callback when a checkbox is toggled (id, checked)
 * - readOnly: If true, checkboxes are disabled
 * - compact: If true, shows a condensed view
 * - showGuidance: If true, shows internal guidance notes (UW view)
 */
export default function UWRequirementsChecklist({
  stage = UW_STAGES.DIP,
  quoteData = {},
  checkedItems = [],
  onCheckChange,
  readOnly = false,
  compact = false,
  showGuidance = false,
  showExportButton = true,
  title = 'Document Checklist',
  allowEdit = false,
  customRequirements = null,
  onRequirementsChange = null
}) {
  const [requirements, setRequirements] = useState(customRequirements || DEFAULT_UW_REQUIREMENTS);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [exporting, setExporting] = useState(false);
  const [selectedStage, setSelectedStage] = useState(stage === 'Both' ? UW_STAGES.INDICATIVE : stage);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Update requirements when customRequirements prop changes
  useEffect(() => {
    setRequirements(customRequirements || DEFAULT_UW_REQUIREMENTS);
  }, [customRequirements]);

  // Update selectedStage when prop changes
  useEffect(() => {
    setSelectedStage(stage === 'Both' ? UW_STAGES.INDICATIVE : stage);
  }, [stage]);

  // Normalize checkedItems to always work as a lookup
  // Supports both array format ['id1', 'id2'] and object format { id1: true, id2: true }
  const isChecked = (id) => {
    if (!id) return false; // Defensive check
    if (Array.isArray(checkedItems)) {
      const result = checkedItems.includes(id);
      return result;
    }
    const result = !!(checkedItems && checkedItems[id] === true);
    return result;
  };

  // Get checked items as array for PDF export and counting
  const checkedItemsArray = useMemo(() => {
    if (Array.isArray(checkedItems)) {
      return checkedItems;
    }
    // Convert object to array of checked IDs
    return Object.entries(checkedItems || {})
      .filter(([, checked]) => checked === true)
      .map(([id]) => id);
  }, [checkedItems]);

  // Load requirements on mount and listen for changes
  useEffect(() => {
    setRequirements(getRequirements());
    
    // Initialize all categories as expanded (use both UW_CATEGORIES and CATEGORY_ORDER)
    const expanded = {};
    CATEGORY_ORDER.forEach(cat => {
      expanded[cat] = true;
    });
    setExpandedCategories(expanded);

    // Listen for localStorage changes (e.g., admin updates)
    const handleStorage = (e) => {
      if (e.key === LOCALSTORAGE_UW_REQUIREMENTS_KEY) {
        setRequirements(getRequirements());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filter requirements by stage and conditions
  const applicableRequirements = useMemo(() => {
    const filtered = filterByConditions(filterByStage(requirements, selectedStage), quoteData)
      .filter(req => !req.pdfOnly); // Exclude PDF-only items from UI
    
    // Group by category
    const grouped = {};
    filtered.forEach(req => {
      if (!grouped[req.category]) {
        grouped[req.category] = [];
      }
      grouped[req.category].push(req);
    });

    // Sort each group by order
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [requirements, selectedStage, quoteData]);

  // Calculate progress
  const totalCount = useMemo(() => {
    try {
      return Object.values(applicableRequirements || {}).flat().filter(Boolean).length;
    } catch {
      return 0;
    }
  }, [applicableRequirements]);

  const checkedCount = useMemo(() => {
    try {
      return Object.values(applicableRequirements || {})
        .flat()
        .filter(req => req && req.id && isChecked(req.id))
        .length;
    } catch {
      return 0;
    }
  }, [applicableRequirements, checkedItemsArray]);

  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Toggle category
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Handle checkbox change
  const handleCheck = (id, checked) => {
    if (!id) return; // Defensive check
    if (onCheckChange && !readOnly) {
      onCheckChange(id, checked);
    }
  };

  // Handle PDF export
  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      await downloadUWRequirementsPDF({
        checkedItems: checkedItemsArray,
        quoteData,
        stage: selectedStage,
        showGuidance
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  }, [checkedItemsArray, quoteData, selectedStage, showGuidance]);

  // Handle starting edit mode
  const handleStartEdit = useCallback((req) => {
    if (!allowEdit || readOnly) return;
    setEditingItemId(req.id);
    setEditingText(req.description);
  }, [allowEdit, readOnly]);

  // Handle saving edited text
  const handleSaveEdit = useCallback(() => {
    if (!editingItemId || !editingText.trim()) return;

    const updatedRequirements = requirements.map(req => 
      req.id === editingItemId ? { ...req, description: editingText.trim() } : req
    );
    
    setRequirements(updatedRequirements);
    
    // Call parent callback to save per-quote custom requirements
    if (onRequirementsChange) {
      onRequirementsChange(updatedRequirements);
    }
    
    setEditingItemId(null);
    setEditingText('');
  }, [editingItemId, editingText, requirements, onRequirementsChange]);

  // Handle canceling edit
  const handleCancelEdit = useCallback(() => {
    setEditingItemId(null);
    setEditingText('');
  }, []);

  // Handle keyboard shortcuts during editing
  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Get display categories in order
  const displayCategories = CATEGORY_ORDER.filter(cat => applicableRequirements[cat]?.length > 0);

  if (totalCount === 0) {
    return (
      <div className="uw-checklist uw-checklist--empty">
        <p className="slds-text-body_regular slds-text-color_weak">
          No requirements applicable for this {stage}.
        </p>
      </div>
    );
  }

  return (
    <div className={`uw-checklist ${compact ? 'uw-checklist--compact' : ''}`}>
      {/* Header with progress */}
      <div className="uw-checklist__header">
        <div className="uw-checklist__header-left">
          <h3 className="slds-text-heading_small">
            <SalesforceIcon name="checklist" size="small" className="slds-m-right_x-small" />
            {title}
          </h3>
          {/* Stage Filter */}
          <div className="uw-checklist__stage-filter slds-m-left_medium">
            <select
              className="slds-select slds-select_x-small"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value={UW_STAGES.INDICATIVE}>Indicative</option>
              <option value={UW_STAGES.DIP}>DIP</option>
            </select>
          </div>
        </div>
        <div className="uw-checklist__header-actions">
          {!readOnly && (
            <button
              className="slds-button uw-checklist__export-btn"
              onClick={handleExportPDF}
              disabled={exporting}
              title="Export to PDF"
              style={{ backgroundColor: 'var(--token-brand-primary)', color: 'var(--token-color-white)', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              {exporting ? (
                <span className="slds-spinner slds-spinner_x-small slds-spinner_inline" role="status">
                  <span className="slds-assistive-text">Exporting</span>
                </span>
              ) : (
                'Download PDF'
              )}
            </button>
          )}
          <div className="uw-checklist__progress">
            <div className="slds-progress-bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}>
              <span className="slds-progress-bar__value" style={{ width: `${progressPercent}%` }}>
                <span className="slds-assistive-text">Progress: {progressPercent}%</span>
              </span>
            </div>
            <span className="uw-checklist__progress-text">
              {checkedCount} / {totalCount} ({progressPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Requirements by category */}
      <div className="uw-checklist__categories">
        {displayCategories.map(category => {
          const catReqs = applicableRequirements[category] || [];
          if (catReqs.length === 0) return null;
          
          const catCheckedCount = catReqs.filter(r => r && isChecked(r.id)).length;
          const isExpanded = expandedCategories[category];

          return (
            <div key={category} className="uw-checklist__category">
              <div 
                className="uw-checklist__category-header"
                onClick={() => toggleCategory(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleCategory(category)}
              >
                <SalesforceIcon 
                  name={isExpanded ? 'chevrondown' : 'chevronright'} 
                  size="x-small" 
                  className="slds-m-right_x-small"
                />
                <span className="uw-checklist__category-title">{category}</span>
                <span className={`slds-badge ${catCheckedCount === catReqs.length ? 'slds-badge--complete' : ''}`}>
                  {catCheckedCount}/{catReqs.length}
                </span>
              </div>

              {isExpanded && (
                <ul className="uw-checklist__items">
                  {catReqs.map(req => {
                    if (!req || !req.id) return null;
                    const itemChecked = isChecked(req.id);
                    const isEditing = editingItemId === req.id;
                    return (
                      <li 
                        key={req.id} 
                        className={`uw-checklist__item ${itemChecked ? 'uw-checklist__item--checked' : ''} ${!req.required ? 'uw-checklist__item--optional' : ''} ${isEditing ? 'uw-checklist__item--editing' : ''}`}
                      >
                        <div className="uw-checklist__item-content">
                          <label className="uw-checklist__item-label">
                            <input
                              type="checkbox"
                              checked={itemChecked}
                              onChange={(e) => handleCheck(req.id, e.target.checked)}
                              disabled={readOnly || isEditing}
                              className="slds-checkbox"
                            />
                            <span className="uw-checklist__item-checkbox">
                              {itemChecked ? (
                                <SalesforceIcon name="check" size="x-small" />
                              ) : (
                                <span className="uw-checklist__item-checkbox-empty" />
                              )}
                            </span>
                            {isEditing ? (
                              <div className="uw-checklist__item-edit-container">
                                <input
                                  type="text"
                                  className="slds-input uw-checklist__item-edit-input"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  autoFocus
                                  placeholder="Enter requirement text"
                                />
                                <div className="uw-checklist__item-edit-actions">
                                  <button
                                    type="button"
                                    className="slds-button slds-button_icon slds-button_icon-small slds-button_icon-border-filled"
                                    onClick={handleSaveEdit}
                                    title="Save"
                                    disabled={!editingText.trim()}
                                  >
                                    <SalesforceIcon name="check" size="xx-small" />
                                    <span className="slds-assistive-text">Save</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="slds-button slds-button_icon slds-button_icon-small slds-button_icon-border-filled"
                                    onClick={handleCancelEdit}
                                    title="Cancel"
                                  >
                                    <SalesforceIcon name="close" size="xx-small" />
                                    <span className="slds-assistive-text">Cancel</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="uw-checklist__item-text">
                                {req.description}
                                {!req.required && req.category === 'Additional Requirements' && (
                                  <span className="uw-checklist__item-optional-tag">(Optional)</span>
                                )}
                              </span>
                            )}
                          </label>
                          {allowEdit && !readOnly && !isEditing && (
                            <button
                              type="button"
                              className="slds-button slds-button_icon slds-button_icon-small uw-checklist__item-edit-btn"
                              onClick={() => handleStartEdit(req)}
                              title="Edit requirement"
                            >
                              <SalesforceIcon name="edit" size="xx-small" />
                              <span className="slds-assistive-text">Edit</span>
                            </button>
                          )}
                        </div>
                        {showGuidance && req.guidance && (
                          <div className="uw-checklist__item-guidance">
                            <SalesforceIcon name="info" size="xx-small" />
                            {req.guidance}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {!compact && (
        <div className="uw-checklist__footer">
          <div className={`uw-checklist__status ${progressPercent === 100 ? 'uw-checklist__status--complete' : ''}`}>
            {progressPercent === 100 ? (
              <>
                <SalesforceIcon name="success" size="small" className="slds-m-right_x-small" />
                All requirements received
              </>
            ) : (
              <>
                <SalesforceIcon name="warning" size="small" className="slds-m-right_x-small" />
                {totalCount - checkedCount} item{totalCount - checkedCount !== 1 ? 's' : ''} outstanding
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

UWRequirementsChecklist.propTypes = {
  stage: PropTypes.oneOf([UW_STAGES.DIP, UW_STAGES.INDICATIVE, 'Both']),
  quoteData: PropTypes.object,
  checkedItems: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.object
  ]),
  onCheckChange: PropTypes.func,
  readOnly: PropTypes.bool,
  compact: PropTypes.bool,
  showGuidance: PropTypes.bool,
  showExportButton: PropTypes.bool,
  title: PropTypes.string,
  allowEdit: PropTypes.bool,
  customRequirements: PropTypes.array,
  onRequirementsChange: PropTypes.func
};

