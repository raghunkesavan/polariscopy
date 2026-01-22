# UI Domain - Pattern Deep Dive

## Overview
The UI domain in this project uses a dual design system approach: **Carbon Design System** as the primary component library with **Salesforce Lightning Design System (SLDS)** as a secondary system for utility classes and specific patterns. Dark mode support is critical throughout.

---

## Required Patterns

### 1. Design System Component Usage

**Pattern**: Always prefer Carbon components first, fall back to SLDS utilities for layout/styling

**Example - CollapsibleSection.jsx**:
```jsx
import React from 'react';
import SalesforceIcon from '../shared/SalesforceIcon';
import '../../styles/Calculator.scss';

export default function CollapsibleSection({ title, expanded, onToggle, children }) {
  return (
    <section className="collapsible-section">
      <header 
        className={`collapsible-header ${expanded ? 'expanded' : ''}`}
        onClick={onToggle}
      >
        <h2 className="header-title">{title}</h2>
        <SalesforceIcon
          category="utility"
          name={expanded ? "chevronup" : "chevrondown"}
          size="x-small"
          className="chevron-icon"
        />
      </header>
      <div className={`collapsible-body ${!expanded ? 'collapsed' : ''}`}>
        {children}
      </div>
    </section>
  );
}
```

**Key points**:
- Use custom classes (`collapsible-section`, `collapsible-header`) for component-specific styling
- Icons come from `SalesforceIcon` wrapper (wraps Carbon icons with SLDS naming)
- Colocate SCSS files with components
- Simple click handlers, no complex event logic in UI components

---

### 2. Dark Mode Implementation

**Pattern**: Support both `.dark-mode` class and `[data-carbon-theme='g100']` attribute

**Example - darkmode.css**:
```css
/* CSS Variables approach - define both selectors */
:root[data-carbon-theme="g100"],
.dark-mode {
  /* Background Colors */
  --token-layer-background: #161616;
  --token-layer-surface: #262626;
  --token-layer-surface-hover: #333333;
  --token-layer-active: #4b4b4b;
  --token-layer-elevated: #4c4c4c;
  
  /* Border Colors */
  --token-border-subtle: #393939;
  --token-border-strong: #525252;
  
  /* Text Colors */
  --token-text-primary: #f4f4f4;
  --token-text-secondary: #c6c6c6;
  --token-text-placeholder: #6f6f6f;
}

/* Apply to base elements */
.dark-mode body,
.dark-mode #root,
body.dark-mode,
body.dark-mode #root {
  background-color: var(--token-layer-background) !important;
  color: var(--token-text-primary) !important;
}
```

**Key points**:
- All color values use CSS variables with `--token-` prefix
- Supports both Carbon's `data-carbon-theme` attribute and custom `.dark-mode` class
- Use `!important` to override inline styles (common in third-party components)
- Always define light AND dark values for every token

---

### 3. Design Token Usage

**Pattern**: NEVER use hardcoded colors/spacing. ALL values must reference design tokens.

**Example - Correct token usage**:
```css
/* ✅ CORRECT - Use tokens */
.my-component {
  background-color: var(--token-layer-surface);
  color: var(--token-text-primary);
  border: 1px solid var(--token-border-subtle);
  padding: var(--slds-g-spacing-small); /* SLDS spacing tokens */
  margin: var(--token-spacing-medium); /* Custom spacing tokens */
}

/* ❌ INCORRECT - No hardcoded values */
.my-bad-component {
  background-color: #262626; /* NO */
  color: #f4f4f4; /* NO */
  border: 1px solid #393939; /* NO */
  padding: 12px; /* NO */
}
```

**Key points**:
- Spacing: `var(--slds-g-spacing-*)` or `var(--token-spacing-*)`
- Colors: `var(--token-color-*)` or `var(--slds-g-color-*)`
- Typography: `var(--token-font-size-*)` or `var(--slds-g-font-size-*)`
- Token values sourced from `figma.config.json` and pulled via `scripts/pull-figma-tokens.mjs`

---

### 4. PropTypes Definition

**Pattern**: Every component must have PropTypes for all props

**Example - CollapsibleSection with PropTypes**:
```jsx
import React from 'react';
import PropTypes from 'prop-types';
import SalesforceIcon from '../shared/SalesforceIcon';

export default function CollapsibleSection({ title, expanded, onToggle, children }) {
  return (
    <section className="collapsible-section">
      <header className={`collapsible-header ${expanded ? 'expanded' : ''}`} onClick={onToggle}>
        <h2>{title}</h2>
        <SalesforceIcon name={expanded ? "chevronup" : "chevrondown"} />
      </header>
      <div className={`collapsible-body ${!expanded ? 'collapsed' : ''}`}>
        {children}
      </div>
    </section>
  );
}

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
```

---

### 5. Loading and Error States

**Pattern**: All data-fetching components must render loading/error states before showing data

**Example - ProtectedRoute.jsx**:
```jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ requiredAccessLevel = 5 }) => {
  const { user, loading, hasPermission } = useAuth();

  // ✅ ALWAYS handle loading state first
  if (loading) {
    return (
      <div className="slds-p-around_large text-align-center">
        <div className="slds-spinner_container">
          <div role="status" className="slds-spinner slds-spinner_medium">
            <span className="slds-assistive-text">Loading...</span>
            <div className="slds-spinner__dot-a"></div>
            <div className="slds-spinner__dot-b"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Handle not authenticated error state
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Handle insufficient permissions error state
  if (!hasPermission(requiredAccessLevel)) {
    return (
      <div className="slds-p-around_large">
        <div className="slds-notify slds-notify_alert slds-theme_error" role="alert">
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // ✅ Only render actual content after all checks pass
  return <Outlet />;
};
```

**Key points**:
- Check `loading` state FIRST (prevents flashing errors)
- Check error/auth states SECOND (show meaningful error messages)
- Render actual content LAST (only when data is ready)
- Use SLDS spinner components for consistent loading UI
- Use SLDS alert/notify components for consistent error UI

---

### 6. Responsive Design

**Pattern**: Mobile-first approach with breakpoints at 480px, 768px, 1024px, 1440px

**Example**:
```scss
// Mobile-first: styles outside media query apply to all sizes
.calculator-section {
  padding: var(--token-spacing-small);
  display: flex;
  flex-direction: column; // Mobile: stack vertically
  
  // Tablet (768px+)
  @media (min-width: 768px) {
    padding: var(--token-spacing-medium);
    flex-direction: row; // Tablet: side-by-side
  }
  
  // Desktop (1024px+)
  @media (min-width: 1024px) {
    padding: var(--token-spacing-large);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

---

### 7. Icon Usage Pattern

**Pattern**: Always use `SalesforceIcon` component wrapper for all icons

**Example**:
```jsx
import SalesforceIcon from '../shared/SalesforceIcon';

// ✅ Correct usage
<SalesforceIcon
  category="utility"
  name="chevrondown"
  size="x-small"
  className="my-icon"
/>

// Icons come from:
// - Carbon icons (@carbon/icons-react)
// - Custom SVG paths (defined in SalesforceIcon component)

// Size prop values: 'x-small' | 'small' | 'medium' | 'large'
// Category prop values: 'utility' | 'standard' | 'custom' | 'action'
```

---

### 8. Accessibility Requirements

**Pattern**: All interactive elements must have proper ARIA labels and keyboard support

**Example**:
```jsx
// ✅ Button with aria-label
<button
  onClick={handleSave}
  aria-label="Save quote to database"
  className="slds-button slds-button_brand"
>
  Save Quote
</button>

// ✅ Input with label association
<div className="slds-form-element">
  <label htmlFor="property-value" className="slds-form-element__label">
    Property Value
  </label>
  <input
    id="property-value"
    type="text"
    className="slds-input"
    aria-describedby="property-value-help"
  />
  <div id="property-value-help" className="slds-form-element__help">
    Enter the estimated property value
  </div>
</div>

// ✅ Collapsible section with aria-expanded
<button
  onClick={onToggle}
  aria-expanded={expanded}
  aria-controls="section-content"
>
  {title}
</button>
<div id="section-content" hidden={!expanded}>
  {children}
</div>
```

---

## Architectural Constraints

### 1. No Inline Styles (Except Dynamic Values)

**Rule**: Never use inline styles unless the value is dynamic/computed

```jsx
// ❌ INCORRECT - Static inline styles
<div style={{ backgroundColor: '#262626', padding: '12px' }}>
  Content
</div>

// ✅ CORRECT - Use CSS classes
<div className="my-component">
  Content
</div>

// ✅ EXCEPTION - Dynamic computed values
<div style={{ width: `${percentage}%` }}>
  Progress bar
</div>
```

---

### 2. Component File Structure

**Rule**: Colocate component files with their styles and tests

```
components/
  calculator/
    CollapsibleSection.jsx       # Component
    CollapsibleSection.scss      # Styles (if needed beyond global)
    CollapsibleSection.test.jsx  # Tests
```

---

### 3. SLDS Class Usage

**Rule**: Use SLDS utility classes for common patterns (spacing, layout, typography)

**Common SLDS classes**:
```jsx
// Spacing
<div className="slds-p-around_medium">Padding all sides</div>
<div className="slds-m-top_large">Margin top</div>

// Layout
<div className="slds-grid slds-wrap">
  <div className="slds-col slds-size_1-of-2">Half width</div>
  <div className="slds-col slds-size_1-of-2">Half width</div>
</div>

// Typography
<p className="slds-text-heading_medium">Heading text</p>
<p className="slds-text-body_regular">Body text</p>

// Buttons
<button className="slds-button slds-button_brand">Primary</button>
<button className="slds-button slds-button_neutral">Secondary</button>
<button className="slds-button slds-button_destructive">Destructive</button>

// Forms
<div className="slds-form-element">
  <label className="slds-form-element__label">Label</label>
  <input className="slds-input" />
</div>
```

---

### 4. Modal Pattern

**Rule**: All modals must use `ModalShell` wrapper component

**Example**:
```jsx
import ModalShell from './ModalShell';

function MyModal({ isOpen, onClose }) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Modal Title"
      size="medium" // 'small' | 'medium' | 'large'
    >
      <div className="modal-content">
        {/* Modal body content */}
      </div>
      
      <div className="modal-footer">
        <button onClick={onClose} className="slds-button slds-button_neutral">
          Cancel
        </button>
        <button onClick={handleSave} className="slds-button slds-button_brand">
          Save
        </button>
      </div>
    </ModalShell>
  );
}
```

---

### 5. Component Optimization

**Rule**: Use React.memo, useMemo, useCallback for performance-critical components

**Example**:
```jsx
import React, { memo, useMemo, useCallback } from 'react';

// ✅ Memoize expensive components
const ExpensiveTable = memo(({ data, onRowClick }) => {
  // Memoize expensive computations
  const processedData = useMemo(() => {
    return data.map(row => ({
      ...row,
      computed: expensiveCalculation(row)
    }));
  }, [data]);
  
  // Memoize callbacks to prevent child re-renders
  const handleRowClick = useCallback((rowId) => {
    onRowClick(rowId);
  }, [onRowClick]);
  
  return (
    <table className="slds-table">
      {processedData.map(row => (
        <tr key={row.id} onClick={() => handleRowClick(row.id)}>
          <td>{row.computed}</td>
        </tr>
      ))}
    </table>
  );
});

ExpensiveTable.displayName = 'ExpensiveTable';
```

---

## Anti-Patterns (DO NOT DO)

### ❌ Hardcoded Colors
```jsx
// NO
<div style={{ color: '#f4f4f4', backgroundColor: '#262626' }}>Bad</div>
```

### ❌ Missing PropTypes
```jsx
// NO
function MyComponent({ title, onSave }) {
  return <div>{title}</div>;
}
// Missing PropTypes definition!
```

### ❌ No Loading State
```jsx
// NO
function DataList({ items }) {
  return items.map(item => <div>{item.name}</div>);
}
// What if items is null/undefined during loading?
```

### ❌ Class Components
```jsx
// NO - Use functional components with hooks
class MyComponent extends React.Component {
  render() {
    return <div>Old pattern</div>;
  }
}
```

---

## Summary Checklist

When creating a new UI component, ensure:

- [ ] Uses Carbon components or SLDS utility classes
- [ ] All colors/spacing use design tokens (no hardcoded values)
- [ ] Has PropTypes for all props
- [ ] Renders loading state before data
- [ ] Renders error state for failures
- [ ] Supports dark mode via token CSS variables
- [ ] Uses SalesforceIcon for all icons
- [ ] Has proper ARIA labels for accessibility
- [ ] Colocated SCSS file (if custom styles needed)
- [ ] Mobile-responsive (mobile-first approach)
- [ ] Optimized with memo/useMemo/useCallback if performance-critical
