# Design Tokens Reference
**Polaris Test - SF Calculator**  
**Last Updated:** December 4, 2025

---

## Table of Contents
1. [What Are Design Tokens?](#what-are-design-tokens)
2. [Token Categories](#token-categories)
3. [Spacing Tokens](#spacing-tokens)
4. [Color Tokens](#color-tokens)
5. [Typography Tokens](#typography-tokens)
6. [Shadow & Border Tokens](#shadow--border-tokens)
7. [Usage Guidelines](#usage-guidelines)
8. [Migration from Hardcoded Values](#migration-from-hardcoded-values)

---

## What Are Design Tokens?

Design tokens are **named CSS custom properties** that store design decisions (colors, spacing, fonts, etc.). They provide:

- **Consistency** - Same spacing/colors across the entire app
- **Maintainability** - Change once, update everywhere
- **Theming** - Switch between themes (light/dark) easily
- **Scalability** - Add new components without inventing new values

### Token Structure
```
--{category}-{property}-{variant}-{scale}
  │        │           │         └─ Scale (sm, md, lg, 1, 2, 3, etc.)
  │        │           └─────────── Variant (primary, secondary, border, etc.)
  │        └─────────────────────── Property (color, spacing, font, etc.)
  └──────────────────────────────── Category (slds-g, token, brand, etc.)
```

**Examples:**
- `--slds-g-spacing-3` → Global spacing, level 3 (12px)
- `--token-color-primary` → Primary brand color
- `--slds-c-button-brand-color-background` → Button brand background color

---

## Token Categories

### SLDS Tokens (Salesforce Lightning Design System)
**Prefix:** `--slds-g-*`, `--slds-c-*`  
**Source:** Core SLDS framework  
**Usage:** Default for all components

```css
/* Global tokens (--slds-g-*) */
--slds-g-spacing-1: 4px;
--slds-g-spacing-2: 8px;
--slds-g-color-brand-base-10: #0176d3;

/* Component-specific tokens (--slds-c-*) */
--slds-c-button-brand-color-background: #0176d3;
--slds-c-input-color-border: #c9c9c9;
```

### Custom Tokens
**Prefix:** `--token-*`  
**Source:** `frontend/src/styles/_variables.scss`, `tokens.scss`  
**Usage:** Project-specific values

```css
/* Custom spacing */
--token-spacing-xs: 0.25rem;   /* 4px */
--token-spacing-sm: 0.5rem;    /* 8px */
--token-spacing-md: 1rem;      /* 16px */

/* Custom colors */
--token-color-primary: #0176d3;
--token-color-success: #4bca81;
--token-color-error: #ea001e;
```

---

## Spacing Tokens

### SLDS Global Spacing Scale
**Purpose:** Margin, padding, gap  
**Scale:** 1-12 (4px increments)

| Token | Value | Use Case |
|-------|-------|----------|
| `--slds-g-spacing-1` | 4px | Tight spacing, icon margins |
| `--slds-g-spacing-2` | 8px | Small gaps, button padding |
| `--slds-g-spacing-3` | 12px | Default gaps, card padding |
| `--slds-g-spacing-4` | 16px | Section spacing |
| `--slds-g-spacing-5` | 20px | Large gaps |
| `--slds-g-spacing-6` | 24px | Extra large gaps |
| `--slds-g-spacing-7` | 28px | Component separation |
| `--slds-g-spacing-8` | 32px | Section headers |
| `--slds-g-spacing-9` | 36px | Major sections |
| `--slds-g-spacing-10` | 40px | Page-level spacing |
| `--slds-g-spacing-11` | 44px | Large page sections |
| `--slds-g-spacing-12` | 48px | Maximum spacing |

### Custom Spacing Tokens
```scss
// _variables.scss
$spacing-unit: 0.25rem; // 4px base

// tokens.scss
--token-spacing-xs: #{$spacing-unit};      // 4px
--token-spacing-sm: #{$spacing-unit * 2};  // 8px
--token-spacing-md: #{$spacing-unit * 4};  // 16px
--token-spacing-lg: #{$spacing-unit * 6};  // 24px
--token-spacing-xl: #{$spacing-unit * 8};  // 32px
--token-spacing-2xl: #{$spacing-unit * 12}; // 48px
```

### Usage Examples
```css
/* ✅ GOOD - Use spacing tokens */
.card {
  padding: var(--slds-g-spacing-4);
  margin-bottom: var(--slds-g-spacing-3);
  gap: var(--slds-g-spacing-2);
}

.section {
  margin-top: var(--token-spacing-xl);
  padding: var(--token-spacing-md);
}

/* ❌ BAD - Hardcoded values */
.card {
  padding: 16px;
  margin-bottom: 12px;
  gap: 8px;
}
```

---

## Color Tokens

### SLDS Brand Colors
**Purpose:** Primary actions, links, focus states

| Token | Value | Use Case |
|-------|-------|----------|
| `--slds-g-color-brand-base-10` | #0176d3 | Primary buttons, links |
| `--slds-g-color-brand-base-20` | #014486 | Hover states |
| `--slds-g-color-brand-base-30` | #001639 | Active/pressed states |

### SLDS Semantic Colors
**Purpose:** Success, warning, error, info states

| Token | Value | Use Case |
|-------|-------|----------|
| `--slds-g-color-success-base-50` | #45c65a | Success messages, checkmarks |
| `--slds-g-color-warning-base-40` | #ffb75d | Warning states |
| `--slds-g-color-error-base-40` | #ea001e | Error messages |
| `--slds-g-color-info-base-40` | #0176d3 | Info messages |

### SLDS Neutral Colors
**Purpose:** Text, borders, backgrounds

| Token | Value | Use Case |
|-------|-------|----------|
| `--slds-g-color-neutral-base-100` | #ffffff | White background |
| `--slds-g-color-neutral-base-95` | #f3f3f3 | Light gray background |
| `--slds-g-color-neutral-base-80` | #c9c9c9 | Borders |
| `--slds-g-color-neutral-base-50` | #706e6b | Secondary text |
| `--slds-g-color-neutral-base-10` | #181818 | Primary text |

### Custom Color Tokens
```scss
// tokens.scss
:root {
  /* Brand colors */
  --token-color-primary: #0176d3;
  --token-color-primary-dark: #014486;
  --token-color-primary-light: #e3f3ff;
  
  /* Semantic colors */
  --token-color-success: #4bca81;
  --token-color-success-light: #e8f7ed;
  --token-color-warning: #ffb75d;
  --token-color-warning-light: #fff6e8;
  --token-color-error: #ea001e;
  --token-color-error-light: #fde6e9;
  
  /* Neutral colors */
  --token-color-background: #ffffff;
  --token-color-background-alt: #f3f3f3;
  --token-color-text-primary: #181818;
  --token-color-text-secondary: #706e6b;
  --token-color-border: #c9c9c9;
  --token-color-border-light: #e5e5e5;
}
```

### Usage Examples
```css
/* ✅ GOOD - Use color tokens */
.button-primary {
  background-color: var(--slds-g-color-brand-base-10);
  color: var(--slds-g-color-neutral-base-100);
}

.button-primary:hover {
  background-color: var(--slds-g-color-brand-base-20);
}

.success-message {
  color: var(--token-color-success);
  background-color: var(--token-color-success-light);
  border-color: var(--token-color-success);
}

/* ❌ BAD - Hardcoded colors */
.button-primary {
  background-color: #0176d3;
  color: #ffffff;
}

.button-primary:hover {
  background-color: #014486;
}
```

---

## Typography Tokens

### SLDS Font Sizes
**Purpose:** Headings, body text, small text

| Token | Value | Use Case |
|-------|-------|----------|
| `--slds-g-font-size-1` | 0.625rem (10px) | Fine print, captions |
| `--slds-g-font-size-2` | 0.75rem (12px) | Small text, labels |
| `--slds-g-font-size-3` | 0.8125rem (13px) | Default body text |
| `--slds-g-font-size-4` | 0.875rem (14px) | Large body text |
| `--slds-g-font-size-5` | 1rem (16px) | Small headings |
| `--slds-g-font-size-6` | 1.125rem (18px) | Medium headings |
| `--slds-g-font-size-7` | 1.25rem (20px) | Large headings |
| `--slds-g-font-size-8` | 1.5rem (24px) | Extra large headings |
| `--slds-g-font-size-9` | 1.75rem (28px) | Page titles |
| `--slds-g-font-size-10` | 2rem (32px) | Hero text |

### SLDS Font Weights
```css
--slds-g-font-weight-light: 300;
--slds-g-font-weight-regular: 400;
--slds-g-font-weight-bold: 700;
```

### Custom Typography Tokens
```scss
// tokens.scss
:root {
  /* Font families */
  --token-font-family-base: 'Salesforce Sans', Arial, sans-serif;
  --token-font-family-monospace: 'Courier New', monospace;
  
  /* Font sizes */
  --token-font-size-xs: 0.75rem;   /* 12px */
  --token-font-size-sm: 0.875rem;  /* 14px */
  --token-font-size-base: 1rem;    /* 16px */
  --token-font-size-lg: 1.125rem;  /* 18px */
  --token-font-size-xl: 1.25rem;   /* 20px */
  --token-font-size-2xl: 1.5rem;   /* 24px */
  
  /* Line heights */
  --token-line-height-tight: 1.2;
  --token-line-height-base: 1.5;
  --token-line-height-loose: 1.75;
  
  /* Letter spacing */
  --token-letter-spacing-tight: -0.01em;
  --token-letter-spacing-base: 0;
  --token-letter-spacing-wide: 0.025em;
}
```

### Usage Examples
```css
/* ✅ GOOD - Use typography tokens */
h1 {
  font-size: var(--slds-g-font-size-9);
  font-weight: var(--slds-g-font-weight-bold);
  line-height: var(--token-line-height-tight);
}

p {
  font-size: var(--slds-g-font-size-3);
  line-height: var(--token-line-height-base);
}

.small-text {
  font-size: var(--token-font-size-xs);
  color: var(--token-color-text-secondary);
}

/* ❌ BAD - Hardcoded typography */
h1 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
```

---

## Shadow & Border Tokens

### SLDS Shadow Tokens
**Purpose:** Elevation, depth, focus states

| Token | Value | Use Case |
|-------|-------|----------|
| `--slds-g-shadow-1` | Small shadow | Cards, dropdowns |
| `--slds-g-shadow-2` | Medium shadow | Modals, popovers |
| `--slds-g-shadow-3` | Large shadow | Overlays |

```css
/* Actual values (SLDS) */
--slds-g-shadow-1: 0 2px 2px 0 rgba(0, 0, 0, 0.1);
--slds-g-shadow-2: 0 2px 4px 0 rgba(0, 0, 0, 0.15);
--slds-g-shadow-3: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
```

### Custom Shadow Tokens
```scss
// tokens.scss
:root {
  --token-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --token-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --token-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --token-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

### Border Radius Tokens
```scss
// tokens.scss
:root {
  --token-border-radius-sm: 0.125rem;  /* 2px */
  --token-border-radius-md: 0.25rem;   /* 4px */
  --token-border-radius-lg: 0.5rem;    /* 8px */
  --token-border-radius-xl: 1rem;      /* 16px */
  --token-border-radius-full: 9999px;  /* Fully rounded */
}
```

### Usage Examples
```css
/* ✅ GOOD - Use shadow/border tokens */
.card {
  box-shadow: var(--slds-g-shadow-1);
  border-radius: var(--token-border-radius-md);
  border: 1px solid var(--token-color-border);
}

.modal {
  box-shadow: var(--slds-g-shadow-2);
  border-radius: var(--token-border-radius-lg);
}

/* ❌ BAD - Hardcoded shadows/borders */
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: 1px solid #ccc;
}
```

---

## Usage Guidelines

### When to Use Which Token System

#### Use SLDS Tokens (`--slds-g-*`, `--slds-c-*`) When:
- ✅ Building standard UI components (buttons, forms, tables, modals)
- ✅ Following SLDS component patterns
- ✅ Need to match Salesforce design language
- ✅ Want automatic theme compatibility

#### Use Custom Tokens (`--token-*`) When:
- ✅ Building project-specific components (calculators, charts)
- ✅ SLDS doesn't provide the exact value needed
- ✅ Creating brand-specific styling
- ✅ Need more granular control

#### Never Do This:
- ❌ Hardcode values (`padding: 16px`, `color: #0176d3`)
- ❌ Use magic numbers (`margin: 17px`, `font-size: 15px`)
- ❌ Create inline styles (except for dynamic values like `width: ${percentage}%`)

### Token Selection Decision Tree
```
Need spacing?
├─ Standard component? → --slds-g-spacing-*
└─ Custom component? → --token-spacing-*

Need color?
├─ Button/Link/Form? → --slds-c-*
├─ Success/Error/Warning? → --slds-g-color-*-base-*
└─ Brand-specific? → --token-color-*

Need typography?
├─ Heading/Body text? → --slds-g-font-size-*
└─ Custom sizing? → --token-font-size-*

Need shadow/border?
├─ Card/Modal? → --slds-g-shadow-*
└─ Custom depth? → --token-shadow-*
```

---

## Migration from Hardcoded Values

### Step 1: Identify Hardcoded Values
```css
/* ❌ BEFORE - Hardcoded values */
.my-component {
  padding: 16px;
  margin-bottom: 12px;
  background-color: #0176d3;
  color: #ffffff;
  font-size: 14px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Step 2: Find Equivalent Tokens
- `16px` → `--slds-g-spacing-4` (16px)
- `12px` → `--slds-g-spacing-3` (12px)
- `#0176d3` → `--slds-g-color-brand-base-10`
- `#ffffff` → `--slds-g-color-neutral-base-100`
- `14px` → `--slds-g-font-size-4` (14px)
- `4px radius` → `--token-border-radius-md`
- `shadow` → `--slds-g-shadow-1`

### Step 3: Replace with Tokens
```css
/* ✅ AFTER - Using tokens */
.my-component {
  padding: var(--slds-g-spacing-4);
  margin-bottom: var(--slds-g-spacing-3);
  background-color: var(--slds-g-color-brand-base-10);
  color: var(--slds-g-color-neutral-base-100);
  font-size: var(--slds-g-font-size-4);
  border-radius: var(--token-border-radius-md);
  box-shadow: var(--slds-g-shadow-1);
}
```

### Common Migration Patterns

#### Spacing Migration
```css
/* ❌ BEFORE */
padding: 8px 16px;
margin: 12px 0;
gap: 8px;

/* ✅ AFTER */
padding: var(--slds-g-spacing-2) var(--slds-g-spacing-4);
margin: var(--slds-g-spacing-3) 0;
gap: var(--slds-g-spacing-2);
```

#### Color Migration
```css
/* ❌ BEFORE */
background: #0176d3;
color: #fff;
border: 1px solid #c9c9c9;

/* ✅ AFTER */
background: var(--slds-g-color-brand-base-10);
color: var(--slds-g-color-neutral-base-100);
border: 1px solid var(--token-color-border);
```

#### Typography Migration
```css
/* ❌ BEFORE */
font-size: 16px;
font-weight: 700;
line-height: 1.5;

/* ✅ AFTER */
font-size: var(--slds-g-font-size-5);
font-weight: var(--slds-g-font-weight-bold);
line-height: var(--token-line-height-base);
```

---

## Quick Reference Card

### Most Common Tokens (80/20 Rule)

#### Spacing (Use these 90% of the time)
```css
--slds-g-spacing-2: 8px   /* Small gaps, button padding */
--slds-g-spacing-3: 12px  /* Default gaps */
--slds-g-spacing-4: 16px  /* Section spacing */
--slds-g-spacing-6: 24px  /* Large gaps */
```

#### Colors (Use these 90% of the time)
```css
--slds-g-color-brand-base-10: #0176d3     /* Primary actions */
--slds-g-color-neutral-base-100: #ffffff  /* White */
--slds-g-color-neutral-base-95: #f3f3f3   /* Light gray background */
--slds-g-color-neutral-base-10: #181818   /* Text */
--token-color-border: #c9c9c9             /* Borders */
```

#### Typography (Use these 90% of the time)
```css
--slds-g-font-size-3: 13px  /* Body text */
--slds-g-font-size-5: 16px  /* Large text */
--slds-g-font-size-7: 20px  /* Headings */
```

---

## Token Browser DevTool

Want to see all available tokens? Open DevTools Console and run:

```javascript
// List all SLDS tokens
Array.from(document.styleSheets)
  .flatMap(sheet => Array.from(sheet.cssRules || []))
  .flatMap(rule => Array.from(rule.style || []))
  .filter(prop => prop.startsWith('--slds'))
  .forEach(prop => console.log(prop, getComputedStyle(document.documentElement).getPropertyValue(prop)));

// List all custom tokens
Array.from(document.styleSheets)
  .flatMap(sheet => Array.from(sheet.cssRules || []))
  .flatMap(rule => Array.from(rule.style || []))
  .filter(prop => prop.startsWith('--token'))
  .forEach(prop => console.log(prop, getComputedStyle(document.documentElement).getPropertyValue(prop)));
```

---

**Remember: Tokens are your friends! They make your code maintainable, themeable, and professional. Always use tokens, never hardcode values.**
