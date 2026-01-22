# Design Token System

## Overview
This project uses a **design token system** to maintain consistent styling across all components. All styles MUST use tokens instead of hardcoded values.

## Core Principle
**ALWAYS use design tokens. NEVER use hardcoded values.**

## Available Tokens

### Spacing Tokens
Use these for padding, margin, gap, etc:

```scss
$spacing-xs: var(--token-space-8);    // 8px
$spacing-sm: var(--token-space-12);   // 12px  
$spacing-md: var(--token-space-16);   // 16px
$spacing-lg: var(--token-space-24);   // 24px
```

**Example:**
```scss
// ✅ CORRECT
padding: $spacing-md;
margin-bottom: $spacing-sm;
gap: $spacing-lg;

// ❌ WRONG
padding: 16px;
margin-bottom: 12px;
gap: 24px;
```

### Color Tokens
Use these for text, backgrounds, borders:

```scss
// Text colors
$token-text-primary: var(--token-text-primary);
$token-text-secondary: var(--token-text-secondary);
$token-text-helper: var(--token-text-helper);
$token-text-error: var(--token-text-error);

// Background colors
$token-color-surface: var(--token-layer-surface);
$token-color-background: var(--token-layer-background);

// Border colors
$token-color-border-subtle: var(--token-border-subtle);
$token-color-border-strong: var(--token-border-strong);

// Interactive colors
$token-color-interactive: var(--token-interactive);
$token-color-interactive-hover: var(--token-interactive-hover);

// Status colors
$token-color-critical: var(--token-critical);
$token-warning-bg: var(--token-warning-bg);
$token-warning-text: var(--token-warning-text);

// Additional
$token-color-accent: var(--token-color-accent);
$token-focus-ring: var(--token-focus-ring);
```

**Example:**
```scss
// ✅ CORRECT
color: $token-text-primary;
background-color: $token-color-surface;
border-color: $token-color-border-subtle;

// ❌ WRONG
color: #080707;
background-color: #ffffff;
border-color: #dddbda;
```

### Border Radius Tokens
Use these for rounded corners:

```scss
$token-radius-sm: var(--token-radius-sm);   // Small radius
$token-radius-md: var(--token-radius-md);   // Medium radius
```

**Example:**
```scss
// ✅ CORRECT
border-radius: $token-radius-sm;

// ❌ WRONG
border-radius: 0.25rem;
border-radius: 4px;
```

### Shadow Tokens
Use these for box shadows:

```scss
$token-shadow-soft: var(--token-shadow-soft);
$token-shadow-strong: var(--token-shadow-strong);
$token-shadow-modal: var(--token-shadow-modal);
```

**Example:**
```scss
// ✅ CORRECT
box-shadow: $token-shadow-soft;

// ❌ WRONG
box-shadow: 0 2px 4px rgba(0,0,0,0.1);
```

### Typography Tokens
Use these for font families:

```scss
$token-font-family: var(--token-font-family-base);
```

## Usage Guidelines

### 1. In SCSS Files
Import the variables file and use the tokens:

```scss
@import '../styles/variables';

.my-component {
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
  background-color: $token-color-surface;
  border: 1px solid $token-color-border-subtle;
  border-radius: $token-radius-sm;
  color: $token-text-primary;
}
```

### 2. In React Components (Inline Styles)
When you MUST use inline styles, use CSS custom properties:

```jsx
// ✅ CORRECT
<div style={{ 
  padding: 'var(--token-space-12)',
  backgroundColor: 'var(--token-layer-surface)',
  borderRadius: 'var(--token-radius-sm)'
}}>

// ❌ WRONG
<div style={{ 
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '4px'
}}>
```

### 3. In React Components (CSS Classes)
**PREFERRED APPROACH**: Create CSS classes using tokens instead of inline styles:

```scss
// In your SCSS file
.loan-info-box {
  padding: $spacing-sm $spacing-md;
  background-color: var(--token-info-bg, #e8f4f8);
  border: 1px solid var(--token-info-border, #1589ee);
  border-radius: $token-radius-sm;
}
```

```jsx
// In your React component
<div className="loan-info-box">
  {content}
</div>
```

## Special Cases

### Custom Colors
If you need a color that doesn't have a token, define it with a CSS custom property fallback:

```scss
// Define in your component's SCSS
.custom-component {
  background-color: var(--token-info-bg, #e8f4f8);
  border-color: var(--token-info-border, #1589ee);
}
```

### Computed Values
When you need to compute spacing values, use `calc()` with tokens:

```scss
// ✅ CORRECT
padding: calc(#{$spacing-sm} + #{$spacing-xs});

// ❌ WRONG
padding: 20px;
```

## Migration Checklist

When updating existing code to use tokens:

- [ ] Replace hardcoded pixel values with spacing tokens (`$spacing-xs`, `$spacing-sm`, `$spacing-md`, `$spacing-lg`)
- [ ] Replace hex color codes with color tokens (`$token-text-primary`, `$token-color-surface`, etc.)
- [ ] Replace hardcoded border-radius with radius tokens (`$token-radius-sm`, `$token-radius-md`)
- [ ] Replace hardcoded shadows with shadow tokens
- [ ] Move inline styles to CSS classes when possible
- [ ] Test in both light and dark themes (if applicable)

## Benefits of Token System

1. **Consistency**: All components use the same spacing, colors, and styling
2. **Maintainability**: Change tokens once, updates everywhere
3. **Theming**: Easy to implement dark mode or custom themes
4. **Accessibility**: Colors and spacing follow accessibility guidelines
5. **Scalability**: Easy to add new components with consistent styling

## Token Reference Location

All tokens are defined in:
- **SCSS Variables**: `frontend/src/styles/_variables.scss`
- **CSS Custom Properties**: Set at runtime (defined in your theme provider)

## Examples

### Before (Hardcoded)
```scss
.old-component {
  padding: 16px 24px;
  margin-bottom: 12px;
  background-color: #ffffff;
  border: 1px solid #dddbda;
  border-radius: 4px;
  color: #080707;
  font-size: 14px;
  line-height: 1.5;
}
```

### After (Token-based)
```scss
.new-component {
  padding: $spacing-md $spacing-lg;
  margin-bottom: $spacing-sm;
  background-color: $token-color-surface;
  border: 1px solid $token-color-border-subtle;
  border-radius: $token-radius-sm;
  color: $token-text-primary;
  font-size: 0.875rem; // Can also be tokenized if needed
  line-height: 1.5;
}
```

## Questions?

If you need a token that doesn't exist:
1. Check if an existing token can be used
2. If not, add it to `_variables.scss` following the naming convention
3. Document it in this file
4. Use it consistently across the codebase

---

**Remember: Consistency is key. Always use tokens!**
