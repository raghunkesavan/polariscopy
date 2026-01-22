# CSS Style Guide
**Polaris Test - SF Calculator**  
**Last Updated:** December 4, 2025

---

## Table of Contents
1. [Core Principles](#core-principles)
2. [SLDS Framework Usage](#slds-framework-usage)
3. [Design Tokens](#design-tokens)
4. [Component Styling Rules](#component-styling-rules)
5. [Responsive Design](#responsive-design)
6. [Common Patterns](#common-patterns)
7. [What NOT To Do](#what-not-to-do)

---

## Core Principles

### 1. **SLDS First, Always**
- **ALWAYS** use Salesforce Lightning Design System (SLDS) classes as the foundation
- Only create custom classes when SLDS doesn't provide the needed functionality
- Extend SLDS classes when you need minor modifications

### 2. **Design Tokens Only**
- **NEVER** use hardcoded values (colors, spacing, font sizes)
- **ALWAYS** use CSS custom properties (design tokens)
- All values must reference tokens from `tokens.scss` or `_variables.scss`

### 3. **No Inline Styles**
- **NEVER** use `style={{...}}` in JSX components
- **Exception 1:** Truly dynamic values calculated at runtime
- **Exception 2:** PDF generation components
- **Exception 3:** SVG styling that must be inline

### 4. **Semantic Class Names**
- Use BEM methodology for custom classes: `.block__element--modifier`
- Prefix custom utilities with their purpose: `.display-flex`, `.margin-top-1`
- SLDS classes use double underscores: `.slds-modal__container`

---

## SLDS Framework Usage

### Button Classes

#### ✅ CORRECT - Use SLDS Button Classes
```jsx
// Primary action button
<button className="slds-button slds-button_brand">
  Save Quote
</button>

// Secondary action button
<button className="slds-button slds-button_outline-brand">
  Edit
</button>

// Destructive action button
<button className="slds-button slds-button_destructive">
  Delete
</button>

// Neutral action button
<button className="slds-button slds-button_neutral">
  Cancel
</button>

// Success/positive action button
<button className="slds-button slds-button_success">
  New Quote
</button>
```

#### ❌ INCORRECT - Don't Create Custom Button Classes
```jsx
// ❌ BAD - Don't do this!
<button className="btn-primary">Save</button>
<button className="custom-button save-btn">Save</button>
<button style={{ background: '#0176d3' }}>Save</button>
```

### Table Classes

#### ✅ CORRECT - Use SLDS Table Classes
```jsx
<table className="slds-table slds-table_bordered slds-table_cell-buffer">
  <thead>
    <tr className="slds-line-height_reset">
      <th className="sortable" scope="col">
        <div className="slds-truncate">Name</div>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="slds-hint-parent">
      <td data-label="Name">
        <div className="slds-truncate">John Doe</div>
      </td>
    </tr>
  </tbody>
</table>
```

#### ❌ INCORRECT - Don't Create Custom Table Classes
```jsx
// ❌ BAD - Don't do this!
<table className="professional-table">...</table>
<table className="rates-table">...</table>
<table className="custom-data-table">...</table>
```

### Modal Classes

#### ✅ CORRECT - Use SLDS Modal Structure
```jsx
<div className="slds-backdrop slds-backdrop_open">
  <section className="slds-modal slds-fade-in-open">
    <div className="slds-modal__container">
      <header className="slds-modal__header">
        <h2 className="slds-text-heading_medium">Modal Title</h2>
      </header>
      <div className="slds-modal__content slds-p-around_medium">
        {/* Content */}
      </div>
      <footer className="slds-modal__footer">
        <button className="slds-button slds-button_neutral">Cancel</button>
        <button className="slds-button slds-button_brand">Save</button>
      </footer>
    </div>
  </section>
</div>
```

### Form Elements

#### ✅ CORRECT - Use SLDS Form Structure
```jsx
<div className="slds-form-element">
  <label className="slds-form-element__label" htmlFor="input-01">
    <abbr className="slds-required" title="required">*</abbr>
    Label
  </label>
  <div className="slds-form-element__control">
    <input
      type="text"
      id="input-01"
      className="slds-input"
      placeholder="Enter value..."
    />
  </div>
</div>

<div className="slds-form-element">
  <label className="slds-form-element__label" htmlFor="select-01">
    Select Label
  </label>
  <div className="slds-form-element__control">
    <div className="slds-select_container">
      <select id="select-01" className="slds-select">
        <option>Option One</option>
        <option>Option Two</option>
      </select>
    </div>
  </div>
</div>
```

---

## Design Tokens

### Spacing Tokens
**ALWAYS use spacing tokens instead of hardcoded values:**

```scss
/* ✅ GOOD */
.my-component {
  padding: var(--slds-g-spacing-4);  /* 16px */
  margin-bottom: var(--slds-g-spacing-3);  /* 12px */
  gap: var(--slds-g-spacing-2);  /* 8px */
}

/* ❌ BAD */
.my-component {
  padding: 16px;  /* Don't do this! */
  margin-bottom: 12px;  /* Don't do this! */
  gap: 8px;  /* Don't do this! */
}
```

**Available Spacing Tokens:**
- `--slds-g-spacing-1` = 4px
- `--slds-g-spacing-2` = 8px
- `--slds-g-spacing-3` = 12px
- `--slds-g-spacing-4` = 16px
- `--slds-g-spacing-5` = 20px
- `--slds-g-spacing-6` = 24px
- `--slds-g-spacing-8` = 32px

### Color Tokens
**ALWAYS use color tokens:**

```scss
/* ✅ GOOD */
.my-component {
  background: var(--slds-g-color-surface-1);
  color: var(--slds-g-color-on-surface-1);
  border-color: var(--slds-g-color-border-1);
}

/* ❌ BAD */
.my-component {
  background: #ffffff;  /* Don't do this! */
  color: #181818;  /* Don't do this! */
  border-color: #e5e5e5;  /* Don't do this! */
}
```

**Common Color Tokens:**
- `--slds-g-color-accent-2` - Primary brand color
- `--slds-g-color-accent-3` - Primary hover state
- `--slds-g-color-surface-1` - Default surface/background
- `--slds-g-color-on-surface-1` - Text on default surface
- `--slds-g-color-border-1` - Default border color
- `--token-danger` - Destructive actions (#c23934)
- `--token-interactive` - Interactive elements

### Typography Tokens
```scss
/* ✅ GOOD */
.my-heading {
  font-size: var(--token-font-size-lg);
  font-weight: var(--token-font-weight-semibold);
  line-height: var(--token-line-height-heading);
}

/* ❌ BAD */
.my-heading {
  font-size: 18px;  /* Don't do this! */
  font-weight: 600;  /* Don't do this! */
  line-height: 1.5;  /* Don't do this! */
}
```

---

## Component Styling Rules

### Rule 1: Component-Specific CSS Files
- Keep component styles in dedicated files
- Use `.scss` for files that need variables/mixins
- Use `.css` for simple component styles
- Name files after the component: `Calculator.scss`, `RatesTable.css`

### Rule 2: Calculator-Specific Styles
Only `Calculator.scss` should contain calculator-specific table branding:

```scss
// ✅ GOOD - Only in Calculator.scss
.results-table-wrapper {
  .slds-table thead th {
    background: var(--token-calculator-header-bg);
    color: var(--token-calculator-header-text);
  }
}
```

### Rule 3: Utility Classes
Use existing utility classes from `utilities.css`:

```jsx
// ✅ GOOD - Use utility classes
<div className="display-flex justify-content-space-between align-items-center">
  <span className="margin-right-2">Label</span>
  <button className="slds-button slds-button_brand">Action</button>
</div>

// ❌ BAD - Don't use inline styles
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <span style={{ marginRight: '8px' }}>Label</span>
  <button>Action</button>
</div>
```

---

## Responsive Design

### Standard Breakpoints
**ALWAYS use these standard breakpoints:**

```scss
$breakpoint-mobile: 480px;   // Small phones
$breakpoint-tablet: 768px;   // Tablets and large phones  
$breakpoint-desktop: 1024px; // Desktop and laptops
$breakpoint-wide: 1440px;    // Wide desktop screens
```

### Responsive Mixins
Use the provided mixins in `_variables.scss`:

```scss
// ✅ GOOD - Use responsive mixins
.my-component {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--slds-g-spacing-4);

  @include desktop-down {
    grid-template-columns: repeat(3, 1fr);
  }

  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }

  @include mobile {
    grid-template-columns: 1fr;
  }
}

// ❌ BAD - Don't use random breakpoint values
.my-component {
  @media (max-width: 900px) { /* Don't do this! */ }
  @media (max-width: 650px) { /* Don't do this! */ }
}
```

### Mobile-First Approach
```scss
// ✅ GOOD - Mobile first
.my-component {
  padding: var(--slds-g-spacing-2);  // Mobile default

  @include tablet-up {
    padding: var(--slds-g-spacing-4);  // Tablet and up
  }

  @include desktop {
    padding: var(--slds-g-spacing-6);  // Desktop and up
  }
}
```

---

## Common Patterns

### Pattern 1: Flexbox Layouts
```scss
// ✅ GOOD - Use utility classes
<div className="display-flex justify-content-space-between align-items-center gap-3">
  <span>Label</span>
  <button className="slds-button slds-button_brand">Action</button>
</div>
```

### Pattern 2: Grid Layouts
```scss
// ✅ GOOD - Responsive grid
.product-criteria-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--slds-g-spacing-4);

  @include desktop-down {
    grid-template-columns: repeat(3, 1fr);
  }

  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }

  @include mobile {
    grid-template-columns: 1fr;
  }
}
```

### Pattern 3: Card/Container Components
```scss
// ✅ GOOD - Use design tokens
.my-card {
  background: var(--slds-g-color-surface-1);
  border: 1px solid var(--slds-g-color-border-1);
  border-radius: var(--token-radius-card);
  padding: var(--slds-g-spacing-4);
  box-shadow: var(--token-shadow-soft);
}
```

### Pattern 4: Loading States
```jsx
// ✅ GOOD - Use shared utility classes
{isLoading && (
  <div className="loading-state">
    <div className="loading-spinner"></div>
    <p>Loading data...</p>
  </div>
)}
```

### Pattern 5: Error States
```jsx
// ✅ GOOD - Use shared utility classes
{error && (
  <div className="error-state">
    <div className="error-message">
      {error}
    </div>
  </div>
)}
```

---

## What NOT To Do

### ❌ DON'T: Use Inline Styles
```jsx
// ❌ BAD
<div style={{ marginTop: '1rem', display: 'flex' }}>
<button style={{ background: '#0176d3', padding: '8px 16px' }}>
```

### ❌ DON'T: Create Custom Button Classes
```scss
// ❌ BAD
.btn-primary { ... }
.custom-save-button { ... }
.my-special-button { ... }
```

### ❌ DON'T: Hardcode Values
```scss
// ❌ BAD
.my-component {
  padding: 16px;
  color: #333333;
  font-size: 14px;
  margin-bottom: 20px;
}
```

### ❌ DON'T: Use Random Breakpoints
```scss
// ❌ BAD
@media (max-width: 900px) { ... }
@media (max-width: 650px) { ... }
@media (max-width: 1100px) { ... }
```

### ❌ DON'T: Duplicate Styles
```scss
// ❌ BAD - Don't create duplicate table classes
.my-custom-table {
  width: 100%;
  border-collapse: collapse;
  /* This duplicates .slds-table! */
}
```

### ❌ DON'T: Override SLDS Core Styles
```scss
// ❌ BAD - Don't override SLDS directly
.slds-button {
  padding: 20px !important;  /* Don't do this! */
}
```

---

## Code Review Checklist

Before submitting code, verify:

- [ ] No inline `style={{...}}` attributes (except for dynamic/PDF/SVG)
- [ ] All buttons use `.slds-button` with appropriate modifier
- [ ] All tables use `.slds-table` with appropriate modifiers
- [ ] All modals use `.slds-modal` structure
- [ ] All forms use `.slds-form-element` structure
- [ ] All spacing uses design tokens (`--slds-g-spacing-*`)
- [ ] All colors use design tokens (`--slds-g-color-*` or `--token-*`)
- [ ] All breakpoints use standard values (480/768/1024/1440)
- [ ] Component styles are in dedicated CSS file
- [ ] No duplicate CSS rules
- [ ] Responsive behavior tested at all breakpoints

---

## Questions?

If you're unsure whether your CSS follows these standards:
1. Check if SLDS provides the component you need
2. Look for similar patterns in existing code
3. Use design tokens instead of hardcoded values
4. Ask in code review if uncertain

**When in doubt, use SLDS!**
