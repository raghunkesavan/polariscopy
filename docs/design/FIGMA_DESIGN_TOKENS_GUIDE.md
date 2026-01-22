# Figma Design Tokens Integration Guide

## Overview

This guide explains how design tokens from Figma are integrated into the Project Polaris codebase and how to keep them synchronized.

## Current Token System

### Token Architecture

```
Figma Variables → token-aliases.json → pull-figma-tokens.mjs → tokens.map.json → tokens.scss → Components
```

### File Structure

- **`figma.config.json`** - Figma file key and mode configuration
- **`token-aliases.json`** - Maps project CSS variables to Figma variable names (using regex patterns)
- **`pull-figma-tokens.mjs`** - Script that fetches Figma variables via API
- **`tokens.map.json`** - Generated mapping of resolved token values
- **`tokens.scss`** - CSS custom properties used throughout the app
- **`figma.variables.report.json`** - Full dump of Figma variables (for debugging)

## Current Design Token Categories

### 1. **Colors**

#### Surface & Backgrounds
```css
--token-layer-background: #f3f3f3   /* Main app background */
--token-layer-surface: #ffffff      /* Card/panel background */
--token-layer-hover: #e5e5e5        /* Hover state background */
```

#### Borders
```css
--token-border-subtle: #c9c9c9      /* Light borders */
--token-border-strong: #5c5c5c      /* Prominent borders */
```

#### Text
```css
--token-text-primary: #2e2e2e       /* Primary text (headers, body) */
--token-text-secondary: #5c5c5c     /* Secondary text (labels, hints) */
--token-text-helper: #5c5c5c        /* Helper text */
--token-text-error: #b60554         /* Error messages */
```

#### Interactive Elements
```css
--token-interactive: #0250d9        /* Primary buttons, links */
--token-interactive-hover: #022ac0  /* Hover state */
--token-focus: #0250d9              /* Focus rings */
--token-focus-ring: rgba(2, 80, 217, 0.3) /* Focus outline */
```

#### Status Colors
```css
--token-critical: #b60554           /* Critical/error state */
--token-success: #28a745            /* Success state */
--token-warning-bg: #fff4e5         /* Warning background */
--token-warning-text: #856404       /* Warning text */
--token-color-accent: #fe9339       /* Accent color */
```

### 2. **Typography**

#### Font Family
```css
--token-font-family-base: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif
```

#### Font Weights
```css
--token-font-weight-regular: 400
--token-font-weight-medium: 500
--token-font-weight-semibold: 600
```

#### Font Sizes
```css
--token-font-size-xs: 0.75rem    /* 12px */
--token-font-size-sm: 0.875rem   /* 14px */
--token-font-size-md: 1rem       /* 16px - base */
--token-font-size-lg: 1.25rem    /* 20px */
```

#### Line Heights
```css
--token-line-height-tight: 1.3   /* Tight spacing (headings) */
--token-line-height-base: 1.5    /* Normal spacing (body text) */
```

### 3. **Spacing Scale**

```css
--token-space-2: 0.125rem    /* 2px */
--token-space-4: 0.25rem     /* 4px */
--token-space-6: 0.375rem    /* 6px */
--token-space-8: 0.5rem      /* 8px */
--token-space-12: 0.75rem    /* 12px */
--token-space-16: 1rem       /* 16px */
--token-space-24: 1.5rem     /* 24px */
--token-space-32: 2rem       /* 32px */
--token-space-48: 3rem       /* 48px */
```

### 4. **Border Radius**

```css
--token-radius-sm: 0.25rem   /* 4px - small elements */
--token-radius-md: 0.5rem    /* 8px - cards, buttons */
```

### 5. **Shadows (Elevation)**

```css
--token-shadow-soft: 0 2px 6px rgba(11, 20, 26, 0.08)      /* Subtle elevation */
--token-shadow-strong: 0 6px 18px rgba(11, 20, 26, 0.14)   /* Strong elevation */
--token-shadow-modal: 0 2px 12px 0 rgba(11, 20, 26, 0.2)   /* Modal overlay */
```

## How Token Mapping Works

### Token Aliases (Regex Matching)

The `token-aliases.json` uses regex patterns to match Figma variable names:

```json
{
  "--token-layer-surface": "/surface-container[-_/]1$/i",
  "--token-interactive": "/accent[-_/]2$/i",
  "--token-space-16": "/spacing[-_/]4$/i"
}
```

**Pattern Explanation:**
- `/surface-container[-_/]1$/i` matches: `surface-container/1`, `surface_container_1`, `surface-container-1`
- Case-insensitive (`i` flag)
- Matches variable name endings (`$`)

### Figma Variable Naming Convention

Based on the aliases, Figma variables should follow this structure:

```
Category / Subcategory / Level
```

**Examples:**
- `surface-container/1` → Light surface
- `surface-container/2` → Background
- `on-surface/1` → Secondary text
- `on-surface/2` → Primary text
- `accent/2` → Interactive color
- `accent/3` → Interactive hover
- `spacing/4` → 16px spacing
- `radius-border/3` → Medium radius
```

## Syncing Figma Design Tokens

### Prerequisites

1. **Figma Personal Access Token**
   - Go to Figma → Settings → Personal Access Tokens
   - Generate a new token with "File read" permission
   - Set environment variable: `$env:FIGMA_TOKEN="your-token"`

2. **Figma File Key**
   - Already configured in `figma.config.json`: `ydwcEFORR4hRE642sMYa0l`

### Running the Sync Script

```powershell
# Set your Figma token (one-time setup)
$env:FIGMA_TOKEN="figd_your_token_here"

# Pull latest design tokens from Figma
cd frontend
node scripts/pull-figma-tokens.mjs

# Review changes
git diff src/styles/tokens.map.json
```

### What Happens During Sync

1. Script fetches all Figma variables from the file
2. Matches variable names using regex patterns in `token-aliases.json`
3. Resolves color values (rgba), numbers, and strings
4. Updates `tokens.map.json` with new values
5. Creates `figma.variables.report.json` for debugging

### Applying Updated Tokens

After syncing, manually update `tokens.scss`:

```scss
:root {
  /* Copy values from tokens.map.json */
  --token-layer-background: #f3f3f3;  /* Update if changed */
  --token-interactive: #0250d9;        /* Update if changed */
  /* ... */
}
```

**Why Manual Update?**
- Allows review of color changes before applying
- Preserves tokens not managed by Figma (shadows, font families)
- Ensures no breaking changes

## Adding New Design Tokens

### 1. Create Variable in Figma

In your Figma file, create a new variable following the naming convention:
```
Category/Level
Example: accent/4 (for a new accent color)
```

### 2. Add Alias Mapping

Edit `frontend/src/styles/token-aliases.json`:

```json
{
  "--token-interactive-disabled": "/accent[-_/]4$/i"
}
```

### 3. Run Sync Script

```powershell
cd frontend
node scripts/pull-figma-tokens.mjs
```

### 4. Add to tokens.scss

```scss
:root {
  /* Add new token */
  --token-interactive-disabled: #value-from-tokens-map-json;
}
```

### 5. Use in Components

```scss
.button:disabled {
  background-color: var(--token-interactive-disabled);
}
```

## Dark Mode Support

Currently using Carbon Design System themes:

```scss
/* Light theme (default) */
:root {
  @include theme.theme(themes.$g10);
  /* Your custom tokens */
}

/* Dark theme */
[data-carbon-theme='g90'] {
  @include theme.theme(themes.$g90);
}
```

**To add Figma dark mode tokens:**

1. Create a "Dark" mode in Figma variable collections
2. Update `figma.config.json`:
   ```json
   {
     "fileKey": "ydwcEFORR4hRE642sMYa0l",
     "mode": "Dark"
   }
   ```
3. Run sync script
4. Add dark mode overrides in `tokens.scss`:
   ```scss
   [data-carbon-theme='g90'] {
     @include theme.theme(themes.$g90);
     --token-layer-background: #161616;  /* Dark background */
     --token-layer-surface: #262626;     /* Dark surface */
     /* ... */
   }
   ```

## Troubleshooting

### Sync Script Fails

**Error: No FIGMA_TOKEN**
```powershell
# Set token in current session
$env:FIGMA_TOKEN="your-token"

# Or add to figma.config.json (not recommended for security)
{
  "fileKey": "ydwcEFORR4hRE642sMYa0l",
  "figmaToken": "your-token",
  "mode": "Default"
}
```

**Error: Figma API 403/401**
- Check token has file read permission
- Verify file key is correct
- Ensure Figma file is accessible to token owner

**No Tokens Matched**
- Check regex patterns in `token-aliases.json`
- Review `figma.variables.report.json` to see actual variable names
- Adjust regex patterns to match Figma naming

### Colors Don't Update

1. Verify token is in `tokens.map.json`
2. Manually copy value to `tokens.scss`
3. Clear browser cache
4. Check if component uses Carbon token instead of custom token

## Best Practices

### 1. **Version Control**
- ✅ Commit `token-aliases.json` (mapping logic)
- ✅ Commit `tokens.scss` (applied tokens)
- ✅ Commit `tokens.map.json` (reference)
- ❌ Don't commit `figma.variables.report.json` (debugging only)
- ❌ Don't commit Figma token in config files

### 2. **Token Naming**
- Use semantic names: `--token-interactive` not `--token-blue`
- Follow existing patterns: `--token-{category}-{variant}`
- Document token purpose in comments

### 3. **Sync Frequency**
- Sync after major design updates
- Review changes before applying
- Test in both light and dark modes
- Communicate color changes to team

### 4. **Testing After Sync**
- Visual regression testing
- Check all themes (light/dark)
- Verify accessibility (contrast ratios)
- Test embedded mode

## Current Token Usage Examples

### Components Using Tokens

```scss
/* Card background */
.app-card {
  background: var(--token-layer-surface);
  border: 1px solid var(--token-border-subtle);
  border-radius: var(--token-radius-md);
  box-shadow: var(--token-shadow-soft);
  padding: var(--token-space-24);
}

/* Primary button */
.button-primary {
  background: var(--token-interactive);
  color: white;
  font-size: var(--token-font-size-md);
  padding: var(--token-space-12) var(--token-space-24);
  border-radius: var(--token-radius-sm);
}

.button-primary:hover {
  background: var(--token-interactive-hover);
}

/* Text styles */
.heading {
  color: var(--token-text-primary);
  font-weight: var(--token-font-weight-semibold);
  line-height: var(--token-line-height-tight);
}

.helper-text {
  color: var(--token-text-helper);
  font-size: var(--token-font-size-sm);
}
```

## Quick Reference: Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Layout | `--token-layer-*` | `--token-layer-surface` |
| Borders | `--token-border-*` | `--token-border-subtle` |
| Text | `--token-text-*` | `--token-text-primary` |
| Interactive | `--token-interactive-*` | `--token-interactive-hover` |
| Status | `--token-*` | `--token-success`, `--token-critical` |
| Spacing | `--token-space-*` | `--token-space-16` |
| Typography | `--token-font-*` | `--token-font-size-md` |
| Radii | `--token-radius-*` | `--token-radius-md` |
| Shadows | `--token-shadow-*` | `--token-shadow-soft` |

## Next Steps

1. **Get Figma Access Token** and test sync script
2. **Review Figma File** (`ydwcEFORR4hRE642sMYa0l`) for any new variables
3. **Run Initial Sync** to establish baseline
4. **Document Changes** if Figma tokens differ from current values
5. **Implement Dark Mode** Figma variables (if available)
6. **Set Up CI/CD** to validate tokens after design updates

---

**Need Help?**
- Check `figma.variables.report.json` for full variable list
- Review `token-aliases.json` for mapping patterns
- Test regex patterns at https://regex101.com/
