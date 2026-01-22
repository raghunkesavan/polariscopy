# Design Token Usage Guidelines

## Overview
This project uses a comprehensive design token system to ensure consistency, maintainability, and Figma sync capability. **Always use design tokens instead of hardcoded values.**

## Token Categories

### Spacing Tokens
Use these for padding, margin, and gap properties:

```scss
// ❌ BAD - Hardcoded values
padding: 0.5rem;
margin-bottom: 1rem;
gap: 0.75rem;

// ✅ GOOD - Design tokens
padding: var(--token-spacing-sm);
margin-bottom: var(--token-spacing-lg);
gap: var(--token-spacing-md);
```

**Available spacing tokens:**
- `--token-spacing-xs`: 0.25rem (4px) - Tight spacing
- `--token-spacing-sm`: 0.5rem (8px) - Small spacing
- `--token-spacing-md`: 0.75rem (12px) - Medium spacing
- `--token-spacing-lg`: 1rem (16px) - Large spacing
- `--token-spacing-xl`: 1.5rem (24px) - Extra large spacing
- `--token-spacing-2xl`: 2rem (32px) - Double extra large spacing

### Color Tokens
Use these for color, background-color, and border-color properties:

```scss
// ❌ BAD - Hardcoded colors
color: #706e6b;
background-color: #f3f3f3;
border-color: #c9c9c9;

// ✅ GOOD - Design tokens
color: var(--token-text-muted);
background-color: var(--token-layer-background);
border-color: var(--token-border-subtle);
```

**Text colors:**
- `--token-text-primary`: Main text
- `--token-text-secondary`: Secondary text
- `--token-text-muted`: Muted/disabled text
- `--token-text-inverse`: White text on dark backgrounds
- `--token-text-error`: Error text
- `--token-ui-text-dark`: Dark UI text
- `--token-ui-text-medium`: Medium UI text
- `--token-ui-text-disabled`: Disabled UI text

**Background colors:**
- `--token-layer-background`: Page background
- `--token-layer-surface`: Card/surface background
- `--token-layer-hover`: Hover state background
- `--token-layer-elevated`: Elevated surfaces
- `--token-ui-background-subtle`: Subtle UI background
- `--token-ui-background-light`: Light UI background
- `--token-ui-background-disabled`: Disabled state background
- `--token-ui-background-neutral`: Neutral UI background

**Border colors:**
- `--token-border-subtle`: Subtle borders
- `--token-border-strong`: Strong borders
- `--token-border-danger`: Error/danger borders
- `--token-ui-border-light`: Light UI borders
- `--token-ui-border-medium`: Medium UI borders
- `--token-ui-border-subtle`: Subtle UI borders

**Interactive colors:**
- `--token-interactive`: Primary interactive color
- `--token-interactive-hover`: Interactive hover state
- `--token-interactive-disabled`: Disabled interactive elements
- `--token-brand-primary`: Primary brand color
- `--token-brand-header`: Header brand color

**Status colors:**
- `--token-success`: Success state
- `--token-success-bg`: Success background
- `--token-error`: Error state
- `--token-error-bg`: Error background
- `--token-warning`: Warning state
- `--token-warning-bg`: Warning background
- `--token-info`: Info state
- `--token-info-bg`: Info background
- `--token-critical`: Critical state
- `--token-critical-hover`: Critical hover state

### Typography Tokens
Use these for font-size, font-weight, line-height, and font-family:

```scss
// ❌ BAD - Hardcoded typography
font-size: 0.875rem;
font-weight: 600;
line-height: 1.5;

// ✅ GOOD - Design tokens
font-size: var(--token-font-size-sm);
font-weight: var(--token-font-weight-semibold);
line-height: var(--token-line-height-base);
```

**Font sizes:**
- `--token-font-size-xs`: 0.75rem
- `--token-font-size-sm`: 0.875rem
- `--token-font-size-md`: 1rem
- `--token-font-size-lg`: 1.25rem

**Font weights:**
- `--token-font-weight-regular`: 400
- `--token-font-weight-medium`: 500
- `--token-font-weight-semibold`: 600

### Shadow Tokens
Use these for box-shadow properties:

```scss
// ❌ BAD - Hardcoded shadow
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

// ✅ GOOD - Design tokens
box-shadow: var(--token-shadow-soft);
```

**Available shadows:**
- `--token-shadow-soft`: Subtle shadow
- `--token-shadow-strong`: Strong shadow
- `--token-shadow-modal`: Modal shadow

### Z-Index Tokens
Use these for z-index properties:

```scss
// ❌ BAD - Hardcoded z-index
z-index: 1000;

// ✅ GOOD - Design tokens
z-index: var(--token-z-dropdown);
```

**Z-index scale:**
- `--token-z-base`: 1
- `--token-z-dropdown`: 1000
- `--token-z-sticky`: 1020
- `--token-z-modal`: 1050
- `--token-z-popover`: 1060
- `--token-z-tooltip`: 1070
- `--token-z-toast`: 9999

## Usage in Different Contexts

### In SCSS Files
```scss
.my-component {
  padding: var(--token-spacing-md);
  color: var(--token-text-primary);
  background: var(--token-layer-surface);
  border: 1px solid var(--token-border-subtle);
  border-radius: var(--token-radius-sm);
}
```

### In JSX Inline Styles
```jsx
<div style={{
  padding: 'var(--token-spacing-lg)',
  marginBottom: 'var(--token-spacing-sm)',
  color: 'var(--token-text-primary)',
  backgroundColor: 'var(--token-layer-surface)'
}}>
  Content
</div>
```

### In Component Files
```jsx
const styles = {
  container: {
    padding: 'var(--token-spacing-md)',
    gap: 'var(--token-spacing-sm)'
  },
  text: {
    color: 'var(--token-text-secondary)',
    fontSize: 'var(--token-font-size-sm)'
  }
};
```

## Dark Mode Support

All tokens automatically adapt to dark mode. The system uses CSS custom properties that change values based on the `data-carbon-theme` attribute:

```html
<!-- Light mode -->
<html data-carbon-theme="g10">

<!-- Dark mode -->
<html data-carbon-theme="g100">
```

No additional code needed - tokens update automatically!

## Validation

### Linting
The project includes ESLint and Stylelint rules to catch hardcoded values:

```bash
# Check for token violations in SCSS/CSS
npm run stylelint

# Check for token violations in JSX
npm run eslint
```

### Pre-commit Hook
A git pre-commit hook validates token usage before commits:

```bash
# Install husky hooks
npm run prepare

# Hooks will automatically run on git commit
```

## When to Create New Tokens

If you need a value that doesn't exist as a token:

1. **Check if a similar token exists** - Can you use an existing token?
2. **Discuss with the team** - Is this value used in multiple places?
3. **Add to tokens.scss** - Add the new token with proper documentation
4. **Add to darkmode.css** - Provide a dark mode equivalent
5. **Update this guide** - Document the new token

Example:
```scss
// In tokens.scss
:root {
  --token-spacing-custom: 1.25rem; /* Custom spacing for specific use case */
}

// In darkmode.css
[data-carbon-theme='g100'] {
  --token-spacing-custom: 1.25rem; /* Same value for dark mode */
}
```

## Figma Sync

Tokens are designed to sync with Figma designs. When Figma values change:

1. Pull latest tokens: `npm run pull-figma-tokens`
2. Review changes in `tokens.scss`
3. Test the application
4. Commit the updated tokens

## Migration Strategy

When updating existing code:

1. **Search for hardcoded values**: Use grep/search to find `#hex`, `0.5rem`, etc.
2. **Replace with tokens**: Match the visual intent, not just the numeric value
3. **Test thoroughly**: Ensure no visual regressions
4. **Update in batches**: Don't try to fix everything at once

## Common Patterns

### Card Component
```scss
.card {
  background: var(--token-layer-surface);
  border: 1px solid var(--token-border-subtle);
  border-radius: var(--token-radius-sm);
  padding: var(--token-spacing-lg);
  box-shadow: var(--token-shadow-soft);
}
```

### Button Component
```scss
.button-primary {
  background: var(--token-brand-primary);
  color: var(--token-text-inverse);
  padding: var(--token-spacing-sm) var(--token-spacing-lg);
  border-radius: var(--token-radius-sm);
  
  &:hover {
    background: var(--token-interactive-hover);
  }
}
```

### Form Input
```scss
.form-input {
  padding: var(--token-spacing-sm) var(--token-spacing-md);
  border: 1px solid var(--token-border-subtle);
  border-radius: var(--token-radius-sm);
  color: var(--token-text-primary);
  background: var(--token-layer-surface);
  
  &:focus {
    border-color: var(--token-interactive);
    box-shadow: 0 0 0 3px var(--token-focus-ring);
  }
}
```

## Resources

- **Token definitions**: `frontend/src/styles/tokens.scss`
- **Dark mode values**: `frontend/src/styles/darkmode.css`
- **Figma sync script**: `frontend/scripts/pull-figma-tokens.mjs`
- **Validation config**: `.stylelintrc.json`, `.eslintrc.token-validation.json`

## Questions?

If you're unsure which token to use, check existing components for similar patterns or ask the team for guidance.

---

**Remember**: Using design tokens ensures consistency, simplifies maintenance, and enables seamless Figma synchronization. Always prefer tokens over hardcoded values!
