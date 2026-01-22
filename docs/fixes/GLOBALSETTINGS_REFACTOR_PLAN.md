# GlobalSettings Component Refactoring Plan

## Current Status
- ✅ Backup created: `GlobalSettings.jsx.backup`
- ✅ CSS file created: `styles/GlobalSettings.css`
- ✅ Accordion state added to component
- ✅ Visibility section refactored with accordion
- ⚠️ File size: 1,497 lines (too large for single refactor)

## Issues Found
1. **500+ inline style declarations** - Violates CSS_STYLE_GUIDE.md
2. **No accordion/collapsible sections** - Poor UX for large forms
3. **Inconsistent spacing/sizing** - Not using design tokens
4. **Poor mobile responsiveness** - Hard to use on smaller screens

## Refactoring Strategy

### Phase 1: Structure (COMPLETED)
- [x] Import GlobalSettings.css
- [x] Add accordion state management
- [x] Add toggleSection function

### Phase 2: Visibility Section (COMPLETED)
- [x] Convert to SLDS accordion pattern
- [x] Remove all inline styles
- [x] Use CSS classes from GlobalSettings.css
- [x] Maintain all functionality

### Phase 3: Row Order Section (TODO)
**File Location**: Lines 886-985

**Current Issues**:
```jsx
// ❌ BAD - Inline styles everywhere
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<div style={{ maxHeight: '500px', overflowY: 'auto' }}>
```

**Target Pattern**:
```jsx
// ✅ GOOD - SLDS accordion + CSS classes
<section className="slds-accordion__section">
  <div className="slds-accordion__summary">
    <h3 className="slds-accordion__summary-heading">
      <button className="slds-button slds-button_reset slds-accordion__summary-action">
        Row Display Order
      </button>
    </h3>
  </div>
  <div className="slds-accordion__content">
    <div className="row-order-container">
      {/* Content with CSS classes */}
    </div>
  </div>
</section>
```

### Phase 4: Label Aliases Section (TODO)
**File Location**: Lines 991-1129

**Current Issues**:
- 50+ inline style declarations
- Complex grid layout with inline styles
- Color picker inline styles

**Target Pattern**:
- SLDS accordion
- `.label-alias-grid` class
- `.label-alias-item` class
- `.label-alias-item--modified` for changed values

### Phase 5: Header Colors Section (TODO)
**File Location**: Lines 1151-1360

**Current Issues**:
- Most complex section
- Color pickers everywhere
- Heavy inline styling

**Target Pattern**:
- SLDS accordion (collapsed by default)
- `.color-section` classes
- `.color-picker-row` for layout
- Design tokens for all spacing/colors

### Phase 6: Main Render & Actions (TODO)
**File Location**: Lines 1373-1497

**Current Issues**:
```jsx
// ❌ OLD
<div className="admin-table-container">
  <h1 className="font-size-2rem...">
```

**Target Pattern**:
```jsx
// ✅ NEW
<div className="global-settings-container">
  <div className="global-settings-header">
    <h1 className="global-settings-title">Global Settings</h1>
    <p className="global-settings-subtitle">Configure calculator results display</p>
  </div>
  
  {/* SLDS tabs remain same */}
  
  <div className="slds-accordion">
    {/* All accordion sections */}
  </div>
  
  <div className="settings-actions-footer">
    {/* Action buttons */}
  </div>
</div>
```

## Implementation Steps

### Step 1: Update Row Order Section
```jsx
const renderRowOrderSection = (rowOrder, visibleRows, type) => (
  <div className="settings-accordion-section">
    <section className="slds-accordion__section">
      <div className={`slds-accordion__summary ${expandedSections.rowOrder ? 'slds-is-open' : ''}`}>
        <h3 className="slds-accordion__summary-heading">
          <button
            className="slds-button slds-button_reset slds-accordion__summary-action"
            onClick={() => toggleSection('rowOrder')}
            aria-expanded={expandedSections.rowOrder}
            type="button"
          >
            <svg className="slds-accordion__summary-action-icon slds-button__icon slds-button__icon_left">
              <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#move"></use>
            </svg>
            <span className="slds-accordion__summary-content">Row Display Order</span>
          </button>
        </h3>
      </div>
      <div className="slds-accordion__content" hidden={!expandedSections.rowOrder}>
        <div className="row-order-container">
          {rowOrder.map((row, index) => (
            <div key={row} className={`row-order-item ${visibleRows[row] === false ? 'row-order-item--hidden' : ''}`}>
              <span className="row-order-label">
                {index + 1}. {row}
                {visibleRows[row] === false && <span className="slds-m-left_small slds-text-color_weak">(Hidden)</span>}
              </span>
              <div className="row-order-actions">
                <button
                  className="slds-button slds-button_icon slds-button_icon-border"
                  onClick={() => handleMoveRowUp(index, type)}
                  disabled={saving || index === 0}
                  title="Move up"
                  type="button"
                >
                  <svg className="slds-button__icon" aria-hidden="true">
                    <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#arrowup"></use>
                  </svg>
                </button>
                <button
                  className="slds-button slds-button_icon slds-button_icon-border"
                  onClick={() => handleMoveRowDown(index, type)}
                  disabled={saving || index === rowOrder.length - 1}
                  title="Move down"
                  type="button"
                >
                  <svg className="slds-button__icon" aria-hidden="true">
                    <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#arrowdown"></use>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);
```

### Step 2: Update Label Aliases Section
Similar pattern - convert to accordion, use CSS classes

### Step 3: Update Header Colors Section
Similar pattern - convert to accordion, use CSS classes

### Step 4: Update Main Render
Wrap everything in `.global-settings-container`, update classes

## Testing Checklist
After refactoring:
- [ ] All sections expand/collapse correctly
- [ ] Visibility checkboxes work
- [ ] Row ordering (up/down arrows) works
- [ ] Label editing works
- [ ] Color pickers work
- [ ] Save/Reset buttons work
- [ ] Mobile responsive (test at 480px, 768px)
- [ ] No ESLint errors (inline styles)
- [ ] Data persists to Supabase correctly

## Estimated LOC Changes
- Lines to modify: ~600
- Inline styles to remove: ~500
- New CSS classes to apply: ~100
- Complexity: High (due to state management preservation)

## Next Action
Would you like me to:
1. **Continue with systematic refactoring** (Step 1-4 above, ~2-3 more iterations)
2. **Do it section by section** as you review each part
3. **Focus on just removing inline styles first** (quick win, then tackle accordion later)

The file is too large for a single refactor operation, so we need an iterative approach.
