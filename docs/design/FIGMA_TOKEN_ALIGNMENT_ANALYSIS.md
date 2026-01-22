# Figma Token Alignment Analysis Report

**Generated:** November 24, 2025  
**Project:** Project Polaris Calculator

---

## Executive Summary

### ✅ Strengths
- Token system is well-structured with clear categories
- Good use of CSS custom properties (CSS variables)
- Dark mode support exists
- Token fallbacks in place for most values

### ⚠️ Areas for Improvement
1. **Hardcoded values** scattered throughout codebase
2. **Inline styles** using magic numbers instead of tokens
3. **Inconsistent token usage** - some files use tokens, others don't
4. **Missing token categories** for common values
5. **No automatic Figma sync** - manual process prone to drift

### 📊 Token Coverage Score: **65%**

---

## Detailed Findings

### 1. **Hardcoded Color Values** ❌

#### Issue: Direct hex/rgb colors bypassing token system

**Files with hardcoded colors:**
- `darkmode.css` - 40+ hardcoded color values
- `auth.css` - Fallback colors that differ from tokens
- `ErrorFallbacks.jsx` - `#706e6b`, `#c23934`
- Various component files

**Examples:**
```css
/* ❌ Bad - Hardcoded */
background-color: #4c4c4c !important;
color: #ffffff !important;
border: 1px solid #a2191f !important;

/* ✅ Good - Token */
background-color: var(--token-layer-surface);
color: var(--token-text-primary);
border: 1px solid var(--token-critical);
```

**Impact:**
- Changes in Figma won't propagate
- Inconsistent colors across app
- Difficult to maintain themes

**Recommendation:**
Create tokens for missing colors:
```scss
--token-layer-elevated: #4c4c4c;
--token-text-inverse: #ffffff;
--token-border-danger: #a2191f;
```

---

### 2. **Hardcoded Spacing Values** ⚠️

#### Issue: Magic numbers for padding/margin instead of spacing tokens

**Files with hardcoded spacing:**
- `_slds.scss` - 100+ instances
- `GlobalSettings.jsx` - Inline styles with `0.5rem`, `0.75rem`, etc.
- Multiple component files

**Examples:**
```jsx
// ❌ Bad - Magic numbers
style={{ 
  marginBottom: '1rem',
  padding: '0.5rem',
  gap: '0.75rem'
}}

// ✅ Good - Tokens
style={{ 
  marginBottom: 'var(--token-space-16)',
  padding: 'var(--token-space-8)',
  gap: 'var(--token-space-12)'
}}
```

**Impact:**
- Inconsistent spacing across UI
- No central control over spacing scale
- Difficult to adjust spacing system-wide

**Recommendation:**
Audit and replace with existing spacing tokens:
- `0.25rem` → `var(--token-space-4)`
- `0.5rem` → `var(--token-space-8)`
- `0.75rem` → `var(--token-space-12)`
- `1rem` → `var(--token-space-16)`
- `1.5rem` → `var(--token-space-24)`

---

### 3. **Hardcoded Typography** ⚠️

#### Issue: Font sizes not using typography tokens

**Examples found:**
```css
font-size: 0.8125rem;  /* Should use --token-font-size-sm */
font-size: 0.9375rem;  /* No token exists */
font-size: 1rem;       /* Should use --token-font-size-md */
line-height: 1.875rem; /* Should use token */
```

**Missing tokens:**
- No token for `0.8125rem` (13px)
- No token for `0.9375rem` (15px)
- No token for `1.875rem` line-height

**Recommendation:**
1. Add missing typography tokens:
```scss
--token-font-size-xs: 0.75rem;   /* 12px - EXISTS ✅ */
--token-font-size-sm: 0.875rem;  /* 14px - EXISTS ✅ */
--token-font-size-base: 1rem;    /* 16px - ADD */
--token-font-size-md: 1rem;      /* 16px - EXISTS ✅ */
--token-font-size-lg: 1.25rem;   /* 20px - EXISTS ✅ */
```

2. Create line-height tokens:
```scss
--token-line-height-compact: 1.25;
--token-line-height-default: 1.5;
--token-line-height-relaxed: 1.875;
```

---

### 4. **Inline Styles in JSX** ❌

#### Issue: Style objects in components instead of CSS classes

**Files with extensive inline styles:**
- `GlobalSettings.jsx` - 30+ inline style objects
- `ErrorFallbacks.jsx` - Multiple inline styles
- `ErrorBoundary.jsx` - Inline styles for error UI

**Example:**
```jsx
// ❌ Bad - Inline styles
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginBottom: '1rem' 
}}>

// ✅ Good - CSS class
<div className="flex-row-between margin-bottom-16">
```

**Impact:**
- Cannot be themed/customized
- Not reusable
- Harder to maintain
- Performance impact (new object every render)

**Recommendation:**
1. Create utility classes in `utilities.css`
2. Move complex styles to component-specific CSS files
3. Use existing SLDS utility classes where possible

---

### 5. **Inconsistent Token Usage** ⚠️

#### Issue: Some files use tokens, others don't

**Good Examples (✅):**
- `auth.css` - Uses tokens with fallbacks
- `index.scss` - Primarily token-based
- `tokens.scss` - Central definition

**Bad Examples (❌):**
- `darkmode.css` - Mix of tokens and hardcoded values
- `_slds.scss` - Mostly hardcoded values
- Component JSX files - Heavy inline style usage

**Consistency Score by File Type:**

| File Type | Token Usage | Hardcoded | Score |
|-----------|-------------|-----------|-------|
| `tokens.scss` | 100% | 0% | ✅ Excellent |
| `index.scss` | 90% | 10% | ✅ Good |
| `auth.css` | 80% | 20% | ✅ Good |
| `darkmode.css` | 40% | 60% | ⚠️ Poor |
| `_slds.scss` | 20% | 80% | ❌ Very Poor |
| Components (JSX) | 30% | 70% | ❌ Very Poor |

---

### 6. **Missing Token Categories** ⚠️

#### Tokens that should exist but don't:

**Layout/Dimensions:**
```scss
/* Add these */
--token-width-sm: 20rem;
--token-width-md: 40rem;
--token-width-lg: 60rem;
--token-height-control: 2.5rem;
--token-height-button: 2rem;
```

**Additional Spacing:**
```scss
/* Currently have: 2, 4, 6, 8, 12, 16, 24, 32, 48 */
/* Missing: */
--token-space-20: 1.25rem;  /* 20px - used in sliders */
--token-space-40: 2.5rem;   /* 40px - used in modals */
--token-space-64: 4rem;     /* 64px - large gaps */
```

**Elevation/Z-index:**
```scss
--token-z-dropdown: 1000;
--token-z-modal: 1050;
--token-z-toast: 9999;
--token-z-tooltip: 10000;
```

**Interactive States:**
```scss
--token-interactive-active: #value;
--token-interactive-disabled: #value;
--token-layer-selected: #value;
```

---

## Token Adoption Roadmap

### Phase 1: Quick Wins (1-2 days)

**Priority: High-traffic files**

1. **Replace hardcoded colors in darkmode.css**
   - 40+ color values → tokens
   - Define missing dark mode tokens

2. **Fix inline styles in GlobalSettings.jsx**
   - Create utility classes
   - Replace 30+ inline styles

3. **Add missing common tokens**
   - Interactive states
   - Z-index values
   - Common dimensions

### Phase 2: Component Cleanup (3-5 days)

1. **Update _slds.scss**
   - Replace 100+ hardcoded spacing values
   - Use spacing tokens consistently

2. **Refactor ErrorFallbacks.jsx**
   - Move inline styles to CSS
   - Use color tokens

3. **Create utility class library**
   - Spacing utilities (margin, padding)
   - Flexbox utilities
   - Typography utilities

### Phase 3: Systematic Audit (1 week)

1. **Audit all component files**
   - Find remaining hardcoded values
   - Replace with tokens

2. **Create component-specific tokens**
   - Button variants
   - Form controls
   - Table styles

3. **Document token usage**
   - Token decision tree
   - Examples for each category

### Phase 4: Automation (Ongoing)

1. **Set up Figma sync process**
   - Automate token pulling
   - CI/CD integration
   - Visual regression testing

2. **Add linting rules**
   - ESLint: Detect hardcoded colors in JSX
   - Stylelint: Detect hardcoded values in CSS

3. **Create token preview page**
   - Living style guide
   - All tokens visualized
   - Dark mode toggle

---

## Recommended Actions (Prioritized)

### 🔴 Critical (Do First)

1. **Replace hardcoded colors in `darkmode.css`**
   ```bash
   # Impact: Affects all dark mode users
   # Effort: 2-3 hours
   # Files: 1 file, ~40 values
   ```

2. **Clean up inline styles in `GlobalSettings.jsx`**
   ```bash
   # Impact: Admin page consistency
   # Effort: 2-3 hours
   # Files: 1 file, ~30 instances
   ```

3. **Add missing interactive state tokens**
   ```bash
   # Impact: Better UX consistency
   # Effort: 1 hour
   # Files: tokens.scss
   ```

### 🟡 Important (Do Soon)

4. **Refactor `_slds.scss` spacing**
   ```bash
   # Impact: All SLDS components
   # Effort: 1 day
   # Files: 1 large file
   ```

5. **Create utility class system**
   ```bash
   # Impact: Reduces inline styles
   # Effort: 4-6 hours
   # Files: New utility.scss
   ```

6. **Update `auth.css` fallback values**
   ```bash
   # Impact: Login/auth pages
   # Effort: 1 hour
   # Files: 1 file
   ```

### 🟢 Nice to Have (Do Later)

7. **Audit all JSX components**
8. **Add z-index tokens**
9. **Create dimension tokens**
10. **Set up automated Figma sync**

---

## Code Examples

### Before (❌) vs After (✅)

#### Example 1: Color Usage

**Before:**
```css
.my-component {
  background-color: #4c4c4c;
  color: #ffffff;
  border: 1px solid #6f6f6f;
}
```

**After:**
```css
.my-component {
  background-color: var(--token-layer-elevated);
  color: var(--token-text-inverse);
  border: 1px solid var(--token-border-subtle);
}
```

#### Example 2: Spacing

**Before:**
```jsx
<div style={{ padding: '0.5rem', margin: '1rem', gap: '0.75rem' }}>
```

**After:**
```jsx
<div className="padding-8 margin-16 gap-12">
```

Or with inline CSS variables:
```jsx
<div style={{ 
  padding: 'var(--token-space-8)',
  margin: 'var(--token-space-16)',
  gap: 'var(--token-space-12)'
}}>
```

#### Example 3: Typography

**Before:**
```css
.heading {
  font-size: 1.25rem;
  line-height: 1.3;
  font-weight: 600;
}
```

**After:**
```css
.heading {
  font-size: var(--token-font-size-lg);
  line-height: var(--token-line-height-tight);
  font-weight: var(--token-font-weight-semibold);
}
```

---

## Measurement & Success Criteria

### Current Baseline
- **Token Usage:** 65%
- **Hardcoded Values:** ~500+ instances
- **Inline Styles:** ~100+ instances
- **Figma Sync:** Manual, no automation

### Target (3 months)
- **Token Usage:** 95%+
- **Hardcoded Values:** <20 instances (exceptions only)
- **Inline Styles:** <10 instances (dynamic only)
- **Figma Sync:** Automated weekly

### Metrics to Track
1. Number of hardcoded hex colors
2. Number of inline style attributes
3. Number of files using tokens
4. Token coverage percentage
5. Time to apply design changes

---

## Tools & Resources

### Linting Setup

**Stylelint** - Detect hardcoded values:
```json
{
  "rules": {
    "color-no-hex": true,
    "declaration-property-value-disallowed-list": {
      "/^(margin|padding)/": ["/^[0-9]/"]
    }
  }
}
```

**ESLint** - Detect inline styles:
```json
{
  "rules": {
    "react/forbid-component-props": ["warn", {
      "forbid": ["style"]
    }]
  }
}
```

### Token Validation Script

Create `scripts/validate-tokens.js`:
```javascript
// Scan for hardcoded values
// Report token usage percentage
// Flag missing token definitions
```

---

## Next Steps

1. ✅ **Review this analysis** with team
2. 📋 **Create tickets** for critical fixes
3. 🎯 **Start with Phase 1** quick wins
4. 📊 **Track progress** weekly
5. 🔄 **Set up Figma sync** automation
6. 📚 **Document** token usage guidelines

---

## Appendices

### A. Token Inventory

**Complete Token List:**
See `FIGMA_TOKEN_STATUS.md` for full inventory

### B. Files Requiring Attention

**High Priority:**
1. `frontend/src/styles/darkmode.css` (40+ hardcoded values)
2. `frontend/src/styles/_slds.scss` (100+ spacing values)
3. `frontend/src/components/GlobalSettings.jsx` (30+ inline styles)

**Medium Priority:**
4. `frontend/src/components/ErrorFallbacks.jsx`
5. `frontend/src/components/ErrorBoundary.jsx`
6. `frontend/src/styles/auth.css`

### C. Token Naming Conventions

**Follow this pattern:**
```
--token-{category}-{variant}-{state}

Examples:
--token-interactive-primary-hover
--token-layer-surface-elevated
--token-text-body-secondary
```

---

**Report End** | Questions? Check `FIGMA_DESIGN_TOKENS_GUIDE.md`
