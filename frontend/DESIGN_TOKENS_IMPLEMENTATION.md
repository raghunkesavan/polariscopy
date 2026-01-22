# Design Tokens Implementation Guide

## Overview
This project now uses a **three-layer token architecture** that bridges your Figma POC design with the codebase through SLDS (Salesforce Lightning Design System) tokens.

---

## Architecture

### Layer 1: SLDS Primitive Tokens
**File:** `src/styles/slds-tokens.css`

These are the foundational design tokens that match your Figma POC. They use the official SLDS naming convention (`--slds-g-*`).

**Example:**
```css
--slds-g-spacing-2: 0.5rem;      /* 8px */
--slds-g-color-surface-container-3: #e5e5e5;
--slds-g-radius-border-3: 0.75rem;
```

✅ **Benefits:**
- Direct mapping to Figma design
- Official SLDS naming
- Easy to update from design changes

---

### Layer 2: Semantic Token Aliases
**File:** `src/styles/tokens.scss`

These map your existing `--token-*` variables to SLDS primitives, creating human-readable semantic names.

**Example:**
```scss
--token-spacing-sm: var(--slds-g-spacing-2);
--token-layer-hover: var(--slds-g-color-neutral-base-90);
--token-interactive: var(--slds-g-color-accent-2);
```

✅ **Benefits:**
- Readable code (`--token-spacing-sm` vs `--slds-g-spacing-2`)
- Maintains backward compatibility with existing components
- Easy theming (change once, updates everywhere)

---

### Layer 3: Component Styles
**Files:** `src/styles/Calculator.scss`, component files, etc.

Components can now use **either**:
1. SLDS tokens directly (recommended for new Figma-matched components)
2. Semantic aliases (for existing components)

**Example (SLDS direct):**
```scss
.collapsible-header {
  height: var(--slds-g-sizing-10);
  padding: var(--slds-g-spacing-2) var(--slds-g-spacing-3);
  border-radius: var(--slds-g-radius-border-3);
  background: var(--slds-g-color-surface-container-3);
}
```

**Example (Semantic alias):**
```scss
.some-component {
  padding: var(--token-spacing-md);
  background: var(--token-layer-surface);
}
```

---

## What Changed

### ✅ Files Created
- `src/styles/slds-tokens.css` - SLDS primitive tokens from Figma

### ✅ Files Updated
- `src/styles/tokens.scss` - Aliased existing tokens to SLDS
- `src/styles/Calculator.scss` - Updated `.collapsible-header` to use SLDS tokens
- `src/styles/transitions.css` - Updated collapsible header transitions
- `src/styles/darkmode.css` - Updated dark mode overrides

### ✅ Proof-of-Concept Component
**`.collapsible-header`** now implements the exact Figma design:
- Height: `48px` (via `--slds-g-sizing-10`)
- Padding: `8px 12px` (via `--slds-g-spacing-2` / `--slds-g-spacing-3`)
- Border radius: `12px` (via `--slds-g-radius-border-3`)
- Background: `#e5e5e5` (via `--slds-g-color-surface-container-3`)
- Border: `1px solid #c9c9c9` (via `--slds-g-color-border-1`)
- Gap: `8px` (via `--slds-g-spacing-2`)

---

## How to Use

### For New Components (Figma POC Match)
Use SLDS tokens directly:
```scss
.my-new-component {
  padding: var(--slds-g-spacing-3);
  background: var(--slds-g-color-surface-container-1);
  border-radius: var(--slds-g-radius-border-2);
}
```

### For Existing Components
Continue using semantic aliases (they now point to SLDS):
```scss
.existing-component {
  padding: var(--token-spacing-md);
  background: var(--token-layer-surface);
}
```

### To Update a Component to Match Figma
1. Open the component SCSS file
2. Replace `--token-*` with equivalent `--slds-g-*` tokens
3. Check the visual match in browser

---

## Available SLDS Tokens

### Spacing
```
--slds-g-spacing-0: 0
--slds-g-spacing-1: 0.25rem  (4px)
--slds-g-spacing-2: 0.5rem   (8px)
--slds-g-spacing-3: 0.75rem  (12px)
--slds-g-spacing-4: 1rem     (16px)
--slds-g-spacing-6: 1.5rem   (24px)
--slds-g-spacing-10: 3rem    (48px)
```

### Sizing
```
--slds-g-sizing-5: 1rem      (16px)
--slds-g-sizing-7: 1.5rem    (24px)
--slds-g-sizing-9: 2rem      (32px)
--slds-g-sizing-10: 3rem     (48px)
```

### Border Radius
```
--slds-g-radius-border-2: 0.5rem   (8px)
--slds-g-radius-border-3: 0.75rem  (12px)
--slds-g-radius-border-4: 1.25rem  (20px)
--slds-g-radius-border-circle: 9999px
```

### Colors - Surface
```
--slds-g-color-surface-container-1: #ffffff
--slds-g-color-surface-container-2: #f3f3f3
--slds-g-color-surface-container-3: #e5e5e5
```

### Colors - Neutral
```
--slds-g-color-neutral-base-100: #ffffff
--slds-g-color-neutral-base-95: #f3f3f3
--slds-g-color-neutral-base-90: #e5e5e5
--slds-g-color-neutral-base-80: #c9c9c9
--slds-g-color-neutral-base-40: #5c5c5c
--slds-g-color-neutral-base-30: #2e2e2e
```

### Colors - Accent (Brand)
```
--slds-g-color-accent-2: #0250d9
--slds-g-color-accent-3: #022ac0
```

### Colors - Border
```
--slds-g-color-border-1: #c9c9c9
--slds-g-color-border-2: #5c5c5c
```

---

## Migration Strategy

### Phase 1: Foundation ✅ COMPLETE
- Created `slds-tokens.css`
- Aliased existing `--token-*` to SLDS
- Updated `.collapsible-header` as proof-of-concept

### Phase 2: Incremental Component Updates (In Progress)
Recommended order:
1. **High-visibility components** (headers, buttons, cards)
2. **Form elements** (inputs, selects, toggles)
3. **Layout components** (containers, grids)
4. **Utility classes**

### Phase 3: Validation
- Visual comparison with Figma
- Dark mode testing
- Accessibility validation

---

## Important Notes

### ⚠️ Backward Compatibility
All existing `--token-*` variables still work! They now reference SLDS tokens internally, so:
- No breaking changes
- Existing components unchanged
- Can migrate incrementally

### ⚠️ Dark Mode
Dark mode overrides in `darkmode.css` now also use SLDS tokens where appropriate. Test dark theme after component updates.

### ⚠️ Token Priority
When both exist, SLDS tokens take precedence for Figma accuracy:
```scss
/* ✅ Preferred for Figma match */
padding: var(--slds-g-spacing-3);

/* ✅ Also works (aliased) */
padding: var(--token-spacing-md);
```

---

## NPM Packages Installed

- `@salesforce-ux/design-system@3.0.0-alpha.12` (SLDS2 - alpha)
- `@salesforce-ux/sds-metadata@1.2.1` (Token metadata)

---

## Questions?

**Q: Should I use SLDS or token aliases?**
A: For new components matching Figma, use SLDS directly. For existing components, token aliases are fine.

**Q: How do I find the right SLDS token?**
A: Check `slds-tokens.css` or refer to the "Available SLDS Tokens" section above.

**Q: Will this break anything?**
A: No! Existing code still works. SLDS tokens are additive and aliased through existing tokens.

**Q: How do I update more components?**
A: Follow the pattern used in `.collapsible-header` - replace direct values and `--token-*` with `--slds-g-*` equivalents.
