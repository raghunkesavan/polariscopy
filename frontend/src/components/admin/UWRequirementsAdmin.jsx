import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import NotificationModal from '../modals/NotificationModal';
import SalesforceIcon from '../shared/SalesforceIcon';
import {
  DEFAULT_UW_REQUIREMENTS,
  UW_CATEGORIES,
  UW_STAGES,
  CATEGORY_ORDER,
  LOCALSTORAGE_UW_REQUIREMENTS_KEY
} from '../../config/uwRequirements';
import { downloadUWRequirementsPDF } from '../../utils/generateUWRequirementsPDF';
import '../../styles/slds.css';
import '../../styles/UWRequirements.css';

/**
 * Read UW requirements overrides from localStorage
 */
function readOverrides() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_UW_REQUIREMENTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write UW requirements overrides to localStorage
 */
function writeOverrides(obj) {
  localStorage.setItem(LOCALSTORAGE_UW_REQUIREMENTS_KEY, JSON.stringify(obj));
  // Dispatch storage event for cross-tab sync
  window.dispatchEvent(new StorageEvent('storage', {
    key: LOCALSTORAGE_UW_REQUIREMENTS_KEY,
    newValue: JSON.stringify(obj)
  }));
}

/**
 * UW Requirements Admin Component
 * Allows admins to configure UW requirements checklist for DIP and Quotes
 */
export default function UWRequirementsAdmin() {
  const { supabase } = useSupabase();
  const [requirements, setRequirements] = useState(DEFAULT_UW_REQUIREMENTS);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [filterStage, setFilterStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToCategory, setAddToCategory] = useState(null); // For inline add
  const [newRequirement, setNewRequirement] = useState({
    id: '',
    category: UW_CATEGORIES.BORROWER,
    description: '',
    stage: UW_STAGES.DIP,
    required: true,
    order: 999,
    conditions: [],
    guidance: '',
    enabled: true
  });

  // Load requirements from localStorage on mount, merging with defaults
  useEffect(() => {
    const overrides = readOverrides();
    let merged = [...DEFAULT_UW_REQUIREMENTS];
    
    if (overrides && Array.isArray(overrides)) {
      // Create a map of overrides by ID
      const overrideMap = new Map(overrides.map(r => [r.id, r]));
      const defaultIds = new Set(DEFAULT_UW_REQUIREMENTS.map(r => r.id));
      
      // Update defaults with any overrides, keep new defaults that aren't in overrides
      merged = DEFAULT_UW_REQUIREMENTS.map(defaultReq => {
        const override = overrideMap.get(defaultReq.id);
        return override ? { ...defaultReq, ...override } : defaultReq;
      });
      
      // Add any custom requirements from overrides that aren't in defaults
      overrides.forEach(override => {
        if (!defaultIds.has(override.id)) {
          merged.push(override);
        }
      });
    }
    
    setRequirements(merged);
    
    // Initialize all categories as expanded (use Object.values to include all categories)
    const expanded = {};
    Object.values(UW_CATEGORIES).forEach(cat => {
      expanded[cat] = true;
    });
    // Also include any categories from CATEGORY_ORDER
    CATEGORY_ORDER.forEach(cat => {
      expanded[cat] = true;
    });
    setExpandedCategories(expanded);
  }, []);

  // Toggle category accordion
  const toggleCategory = useCallback((category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  // Update a requirement field
  const updateRequirement = useCallback((id, field, value) => {
    setRequirements(prev => prev.map(req => 
      req.id === id ? { ...req, [field]: value } : req
    ));
  }, []);

  // Toggle requirement enabled status
  const toggleEnabled = useCallback((id) => {
    setRequirements(prev => prev.map(req => 
      req.id === id ? { ...req, enabled: !req.enabled } : req
    ));
  }, []);

  // Move requirement up/down within category
  const moveRequirement = useCallback((id, direction) => {
    setRequirements(prev => {
      const req = prev.find(r => r.id === id);
      if (!req) return prev;
      
      const categoryReqs = prev.filter(r => r.category === req.category).sort((a, b) => a.order - b.order);
      const currentIdx = categoryReqs.findIndex(r => r.id === id);
      const newIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
      
      if (newIdx < 0 || newIdx >= categoryReqs.length) return prev;
      
      // Swap orders
      const swapReq = categoryReqs[newIdx];
      const tempOrder = req.order;
      
      return prev.map(r => {
        if (r.id === id) return { ...r, order: swapReq.order };
        if (r.id === swapReq.id) return { ...r, order: tempOrder };
        return r;
      });
    });
  }, []);

  // Delete requirement
  const deleteRequirement = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this requirement?')) {
      setRequirements(prev => prev.filter(req => req.id !== id));
    }
  }, []);

  // Add new requirement
  const addRequirement = useCallback(() => {
    if (!newRequirement.id || !newRequirement.description) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Validation Error',
        message: 'ID and Description are required'
      });
      return;
    }

    // Check for duplicate ID
    if (requirements.some(r => r.id === newRequirement.id)) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Duplicate ID',
        message: 'A requirement with this ID already exists'
      });
      return;
    }

    // Find max order in category
    const maxOrder = Math.max(0, ...requirements.filter(r => r.category === newRequirement.category).map(r => r.order));
    
    setRequirements(prev => [...prev, { ...newRequirement, order: maxOrder + 1 }]);
    setShowAddModal(false);
    setAddToCategory(null);
    setNewRequirement({
      id: '',
      category: UW_CATEGORIES.BORROWER,
      description: '',
      stage: UW_STAGES.BOTH,
      required: true,
      order: 999,
      conditions: [],
      guidance: '',
      enabled: true
    });
  }, [newRequirement, requirements]);

  // Save to localStorage and optionally to Supabase
  const saveRequirements = useCallback(async () => {
    setSaving(true);
    try {
      // Save to localStorage
      writeOverrides(requirements);

      // Optionally save to Supabase app_constants table
      if (supabase) {
        try {
          await supabase
            .from('app_constants')
            .upsert({
              key: 'uw_requirements',
              value: JSON.stringify(requirements),
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        } catch (dbError) {
          console.warn('Failed to save to database, using localStorage only:', dbError);
        }
      }

      setNotification({
        show: true,
        type: 'success',
        title: 'Saved',
        message: 'UW Requirements saved successfully'
      });
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  }, [requirements, supabase]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all requirements to defaults? This will remove any custom items.')) {
      setRequirements(DEFAULT_UW_REQUIREMENTS);
      writeOverrides(DEFAULT_UW_REQUIREMENTS);
      setNotification({
        show: true,
        type: 'success',
        title: 'Reset Complete',
        message: `Requirements have been reset to defaults (${DEFAULT_UW_REQUIREMENTS.length} items)`
      });
    }
  }, []);

  // Sync with defaults (merge - keeps custom items and updates)
  const syncWithDefaults = useCallback(() => {
    const overrideMap = new Map(requirements.map(r => [r.id, r]));
    const defaultIds = new Set(DEFAULT_UW_REQUIREMENTS.map(r => r.id));
    
    // Update defaults with any overrides (preserving enabled status and custom changes)
    const merged = DEFAULT_UW_REQUIREMENTS.map(defaultReq => {
      const override = overrideMap.get(defaultReq.id);
      if (override) {
        // Keep user's enabled status and description customizations
        return { ...defaultReq, enabled: override.enabled, description: override.description, guidance: override.guidance };
      }
      return defaultReq;
    });
    
    // Add any custom requirements that aren't in defaults
    requirements.forEach(req => {
      if (!defaultIds.has(req.id)) {
        merged.push(req);
      }
    });
    
    setRequirements(merged);
    setNotification({
      show: true,
      type: 'success',
      title: 'Synced',
      message: `Synced with defaults. Now showing ${merged.length} items (${DEFAULT_UW_REQUIREMENTS.length} default + ${merged.length - DEFAULT_UW_REQUIREMENTS.length} custom)`
    });
  }, [requirements]);

  // Filter requirements
  const filteredRequirements = requirements.filter(req => {
    if (filterStage !== 'all' && req.stage !== filterStage && req.stage !== UW_STAGES.BOTH) {
      return false;
    }
    if (searchTerm && !req.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group by category
  const groupedRequirements = {};
  CATEGORY_ORDER.forEach(cat => {
    const catReqs = filteredRequirements.filter(r => r.category === cat).sort((a, b) => a.order - b.order);
    if (catReqs.length > 0) {
      groupedRequirements[cat] = catReqs;
    }
  });

  return (
    <div className="uw-requirements-admin">
      {/* Header */}
      <div className="uw-requirements-admin__header">
        <h2 className="slds-text-heading_medium">
          <SalesforceIcon name="checklist" size="small" className="slds-m-right_x-small" />
          UW Requirements Configuration
          <span className="slds-badge slds-m-left_small">{requirements.length} items</span>
        </h2>
        <p className="slds-text-body_regular slds-text-color_weak">
          Configure the underwriting requirements checklist for DIP and Quote issuance. 
          Requirements can be conditional based on loan criteria.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="uw-requirements-admin__actions slds-m-bottom_medium">
        <div className="slds-grid slds-gutters">
          <div className="slds-col slds-size_1-of-3">
              <div className="slds-form-element">
              <label className="slds-form-element__label">Filter by Stage</label>
              <div className="slds-form-element__control">
                <select 
                  className="slds-select"
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                >
                  <option value="all">All Stages</option>
                  <option value={UW_STAGES.DIP}>DIP Only</option>
                  <option value={UW_STAGES.INDICATIVE}>Indicative Only</option>
                  <option value={UW_STAGES.BOTH}>Both (DIP &amp; Indicative)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="slds-col slds-size_1-of-3">
            <div className="slds-form-element">
              <label className="slds-form-element__label">Search</label>
              <div className="slds-form-element__control slds-input-has-icon slds-input-has-icon_left">
                <SalesforceIcon name="search" size="x-small" className="slds-input__icon slds-input__icon_left" />
                <input 
                  type="text"
                  className="slds-input"
                  placeholder="Search requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="slds-col slds-size_1-of-3 slds-text-align_right slds-align-bottom">
            <button 
              className="slds-button slds-button_neutral slds-m-right_x-small"
              onClick={() => setShowAddModal(true)}
            >
              <SalesforceIcon name="add" size="x-small" className="slds-button__icon slds-button__icon_left" />
              Add
            </button>
            <button 
              className="slds-button slds-button_neutral slds-m-right_x-small"
              onClick={syncWithDefaults}
              title="Sync with default requirements (keeps your customizations)"
            >
              <SalesforceIcon name="sync" size="x-small" className="slds-button__icon slds-button__icon_left" />
              Sync
            </button>
            <button 
              className="slds-button slds-button_neutral slds-m-right_x-small"
              onClick={resetToDefaults}
              title="Reset all to defaults (removes customizations)"
              style={{ display: 'none' }}
            >
              <SalesforceIcon name="refresh" size="x-small" className="slds-button__icon slds-button__icon_left" />
              Reset
            </button>
            <button 
              className="slds-button slds-button_neutral slds-m-right_x-small"
              onClick={() => downloadUWRequirementsPDF({ checkedItems: [], quoteData: {}, stage: null, showGuidance: true })}
              title="Export a blank checklist template PDF with all items"
            >
              <SalesforceIcon name="download" size="x-small" className="slds-button__icon slds-button__icon_left" />
              PDF
            </button>
            <button 
              className="slds-button slds-button_brand"
              onClick={saveRequirements}
              disabled={saving}
            >
              {saving ? (
                <span className="slds-spinner slds-spinner_x-small slds-spinner_inline" role="status">
                  <span className="slds-assistive-text">Saving</span>
                </span>
              ) : (
                <SalesforceIcon name="save" size="x-small" className="slds-button__icon slds-button__icon_left" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Requirements List by Category */}
      <div className="uw-requirements-admin__list">
        {CATEGORY_ORDER.map(category => {
          const catReqs = groupedRequirements[category];
          if (!catReqs || catReqs.length === 0) return null;

          return (
            <div key={category} className="slds-card slds-m-bottom_small">
              <div 
                className="slds-card__header slds-grid slds-grid_align-spread uw-requirements-admin__category-header"
                onClick={() => toggleCategory(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleCategory(category)}
              >
                <h3 className="slds-card__header-title">
                  <SalesforceIcon 
                    name={expandedCategories[category] ? 'chevrondown' : 'chevronright'} 
                    size="x-small" 
                    className="slds-m-right_x-small"
                  />
                  {category}
                  <span className="slds-badge slds-m-left_x-small">{catReqs.length}</span>
                </h3>
              </div>
              
              {expandedCategories[category] && (
                <div className="slds-card__body">
                  <table className="slds-table slds-table_cell-buffer slds-table_bordered">
                    <thead>
                      <tr className="slds-line-height_reset">
                        <th scope="col" className="uw-requirements-admin__col--checkbox">
                          <span className="slds-assistive-text">Enabled</span>
                        </th>
                        <th scope="col">Description</th>
                        <th scope="col" className="uw-requirements-admin__col--stage">Stage</th>
                        <th scope="col" className="uw-requirements-admin__col--required">Required</th>
                        <th scope="col" className="uw-requirements-admin__col--conditions">Conditions</th>
                        <th scope="col" className="uw-requirements-admin__col--actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catReqs.map((req, idx) => {
                        if (!req || !req.id) return null;
                        return (
                        <tr key={req.id} className={!req.enabled ? 'uw-requirements-admin__row--disabled' : ''}>
                          <td>
                            <div className="slds-checkbox">
                              <input 
                                type="checkbox"
                                id={`enabled-${req.id}`}
                                checked={req.enabled !== false}
                                onChange={() => toggleEnabled(req.id)}
                              />
                              <label className="slds-checkbox__label" htmlFor={`enabled-${req.id}`}>
                                <span className="slds-checkbox_faux"></span>
                              </label>
                            </div>
                          </td>
                          <td>
                            {editingItem === req.id ? (
                              <div>
                                <textarea
                                  className="slds-textarea slds-m-bottom_xx-small"
                                  value={req.description || ''}
                                  onChange={(e) => updateRequirement(req.id, 'description', e.target.value)}
                                  rows={2}
                                  placeholder="Requirement description..."
                                />
                                <input
                                  type="text"
                                  className="slds-input"
                                  value={req.guidance || ''}
                                  onChange={(e) => updateRequirement(req.id, 'guidance', e.target.value)}
                                  placeholder="Guidance note (optional)..."
                                />
                              </div>
                            ) : (
                              <div>
                                <span className={!req.enabled ? 'slds-text-color_weak' : ''}>
                                  {req.description}
                                </span>
                                {req.guidance && (
                                  <div className="slds-text-body_small slds-text-color_weak slds-m-top_xx-small">
                                    <SalesforceIcon name="info" size="xx-small" className="slds-m-right_xx-small" />
                                    {req.guidance}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {editingItem === req.id ? (
                              <select
                                className="slds-select"
                                value={req.stage}
                                onChange={(e) => updateRequirement(req.id, 'stage', e.target.value)}
                              >
                                <option value={UW_STAGES.DIP}>DIP</option>
                                <option value={UW_STAGES.INDICATIVE}>Indicative</option>
                                <option value={UW_STAGES.BOTH}>Both</option>
                              </select>
                            ) : (
                              <span className={`slds-badge slds-badge_${req.stage === UW_STAGES.DIP ? 'warning' : req.stage === UW_STAGES.INDICATIVE ? 'success' : 'inverse'}`}>
                                {req.stage}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="slds-checkbox">
                              <input 
                                type="checkbox"
                                id={`required-${req.id}`}
                                checked={req.required !== false}
                                onChange={() => updateRequirement(req.id, 'required', !req.required)}
                                disabled={editingItem !== req.id}
                              />
                              <label className="slds-checkbox__label" htmlFor={`required-${req.id}`}>
                                <span className="slds-checkbox_faux"></span>
                              </label>
                            </div>
                          </td>
                          <td>
                            {editingItem === req.id ? (
                              <div>
                                <select
                                  className="slds-select slds-m-bottom_xx-small"
                                  value={req.conditions?.length > 0 ? JSON.stringify(req.conditions[0]) : ''}
                                  onChange={(e) => {
                                    if (e.target.value === '') {
                                      updateRequirement(req.id, 'conditions', []);
                                    } else {
                                      updateRequirement(req.id, 'conditions', [JSON.parse(e.target.value)]);
                                    }
                                  }}
                                >
                                  <option value="">No condition</option>
                                  <option value='{"field":"applicant_type","operator":"contains","value":"personal"}'>Personal borrower</option>
                                  <option value='{"field":"borrower_type","operator":"contains","value":"company"}'>Company borrower</option>
                                  <option value='{"field":"hmo","operator":"notEquals","value":"No"}'>HMO property</option>
                                  <option value='{"field":"mufb","operator":"notEquals","value":"No"}'>MUFB property</option>
                                  <option value='{"field":"holiday","operator":"notEquals","value":"No"}'>Holiday Let</option>
                                </select>
                                {req.conditions?.length > 0 && (
                                  <span className="slds-text-body_small slds-text-color_weak">
                                    {req.conditions[0].field}: {req.conditions[0].value}
                                  </span>
                                )}
                              </div>
                            ) : (
                              req.conditions && req.conditions.length > 0 ? (
                                <span className="slds-badge slds-badge_lightest" title={JSON.stringify(req.conditions)}>
                                  {req.conditions.length} rule{req.conditions.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="slds-text-color_weak">None</span>
                              )
                            )}
                          </td>
                          <td>
                            <div className="slds-button-group">
                              <button 
                                className="slds-button slds-button_icon slds-button_icon-border-filled"
                                title="Move up"
                                onClick={() => moveRequirement(req.id, 'up')}
                                disabled={idx === 0}
                              >
                                <SalesforceIcon name="arrowup" size="x-small" />
                              </button>
                              <button 
                                className="slds-button slds-button_icon slds-button_icon-border-filled"
                                title="Move down"
                                onClick={() => moveRequirement(req.id, 'down')}
                                disabled={idx === catReqs.length - 1}
                              >
                                <SalesforceIcon name="arrowdown" size="x-small" />
                              </button>
                              <button 
                                className="slds-button slds-button_icon slds-button_icon-border-filled"
                                title={editingItem === req.id ? "Done editing" : "Edit"}
                                onClick={() => setEditingItem(editingItem === req.id ? null : req.id)}
                              >
                                <SalesforceIcon name={editingItem === req.id ? 'check' : 'edit'} size="x-small" />
                              </button>
                              <button 
                                className="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-error"
                                title="Delete"
                                onClick={() => deleteRequirement(req.id)}
                              >
                                <SalesforceIcon name="delete" size="x-small" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                  {/* Add to this category button */}
                  <div className="slds-p-around_small slds-border_top">
                    <button
                      className="slds-button slds-button_neutral slds-button_stretch"
                      onClick={() => {
                        setAddToCategory(category);
                        setNewRequirement(prev => ({
                          ...prev,
                          id: '',
                          description: '',
                          category: category,
                          stage: UW_STAGES.BOTH,
                          guidance: ''
                        }));
                        setShowAddModal(true);
                      }}
                    >
                      <SalesforceIcon name="add" size="x-small" className="slds-button__icon slds-button__icon_left" />
                      Add to {category}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Requirement Modal */}
      {showAddModal && (
        <div className="slds-modal slds-fade-in-open">
          <div className="slds-modal__container">
            <header className="slds-modal__header">
              <button 
                className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                onClick={() => { setShowAddModal(false); setAddToCategory(null); }}
              >
                <SalesforceIcon name="close" size="small" />
              </button>
              <h2 className="slds-modal__title">
                {addToCategory ? `Add Requirement to ${addToCategory}` : 'Add New Requirement'}
              </h2>
            </header>
            <div className="slds-modal__content slds-p-around_medium">
              <div className="slds-form slds-form_stacked">
                <div className="slds-form-element slds-m-bottom_small">
                  <label className="slds-form-element__label">
                    <abbr className="slds-required" title="required">*</abbr>
                    ID (unique identifier)
                  </label>
                  <input 
                    type="text"
                    className="slds-input"
                    value={newRequirement.id}
                    onChange={(e) => setNewRequirement(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    placeholder="e.g., borrower_new_item"
                  />
                </div>
                <div className="slds-form-element slds-m-bottom_small">
                  <label className="slds-form-element__label">
                    <abbr className="slds-required" title="required">*</abbr>
                    Description
                  </label>
                  <textarea 
                    className="slds-textarea"
                    value={newRequirement.description}
                    onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Enter requirement description..."
                  />
                </div>
                <div className="slds-grid slds-gutters">
                  <div className="slds-col slds-size_1-of-2">
                    <div className="slds-form-element slds-m-bottom_small">
                      <label className="slds-form-element__label">Category</label>
                      <select 
                        className="slds-select"
                        value={newRequirement.category}
                        onChange={(e) => setNewRequirement(prev => ({ ...prev, category: e.target.value }))}
                      >
                        {Object.values(UW_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="slds-col slds-size_1-of-2">
                    <div className="slds-form-element slds-m-bottom_small">
                      <label className="slds-form-element__label">Stage</label>
                      <select 
                        className="slds-select"
                        value={newRequirement.stage}
                        onChange={(e) => setNewRequirement(prev => ({ ...prev, stage: e.target.value }))}
                      >
                        <option value={UW_STAGES.DIP}>DIP</option>
                        <option value={UW_STAGES.INDICATIVE}>Indicative</option>
                        <option value={UW_STAGES.BOTH}>Both</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="slds-form-element slds-m-bottom_small">
                  <label className="slds-form-element__label">Guidance (internal note)</label>
                  <input 
                    type="text"
                    className="slds-input"
                    value={newRequirement.guidance}
                    onChange={(e) => setNewRequirement(prev => ({ ...prev, guidance: e.target.value }))}
                    placeholder="Optional guidance for UW team..."
                  />
                </div>
                <div className="slds-form-element slds-m-bottom_small">
                  <label className="slds-form-element__label">Condition (when to show)</label>
                  <select 
                    className="slds-select"
                    value={newRequirement.conditions?.length > 0 ? JSON.stringify(newRequirement.conditions[0]) : ''}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setNewRequirement(prev => ({ ...prev, conditions: [] }));
                      } else {
                        setNewRequirement(prev => ({ ...prev, conditions: [JSON.parse(e.target.value)] }));
                      }
                    }}
                  >
                    <option value="">Always show (no condition)</option>
                    <option value='{"field":"borrower_type","operator":"CONTAINS","value":"personal"}'>Personal borrower only</option>
                    <option value='{"field":"borrower_type","operator":"CONTAINS","value":"company"}'>Company borrower only</option>
                    <option value='{"field":"hmo","operator":"NOT_EQUALS","value":"No"}'>HMO property only</option>
                    <option value='{"field":"mufb","operator":"NOT_EQUALS","value":"No"}'>MUFB property only</option>
                    <option value='{"field":"holiday","operator":"NOT_EQUALS","value":"No"}'>Holiday Let only</option>
                  </select>
                </div>
                <div className="slds-form-element">
                  <div className="slds-form-element__control">
                    <div className="slds-checkbox">
                      <input 
                        type="checkbox"
                        id="new-req-required"
                        checked={newRequirement.required}
                        onChange={(e) => setNewRequirement(prev => ({ ...prev, required: e.target.checked }))}
                      />
                      <label className="slds-checkbox__label" htmlFor="new-req-required">
                        <span className="slds-checkbox_faux"></span>
                        <span className="slds-form-element__label">Required document</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <footer className="slds-modal__footer">
              <button className="slds-button slds-button_neutral" onClick={() => { setShowAddModal(false); setAddToCategory(null); }}>
                Cancel
              </button>
              <button className="slds-button slds-button_brand" onClick={addRequirement}>
                Add Requirement
              </button>
            </footer>
          </div>
        </div>
      )}
      {showAddModal && <div className="slds-backdrop slds-backdrop_open"></div>}

      {/* Notification Modal */}
      {notification.show && (
        <NotificationModal
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ show: false, type: '', title: '', message: '' })}
        />
      )}
    </div>
  );
}

UWRequirementsAdmin.propTypes = {};
