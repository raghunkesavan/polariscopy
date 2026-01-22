# Figma Token Sync Status

## Current Token Status

Last synced: Unknown (run sync to update)

### Token Mapping Status

| Project Token | Figma Pattern | Current Value | Status |
|--------------|---------------|---------------|--------|
| **Colors - Surfaces** |
| `--token-layer-surface` | `/surface-container[-_/]1$/i` | `#ffffff` | ✅ Defined |
| `--token-layer-background` | `/surface-container[-_/]2$/i` | `#f3f3f3` | ✅ Defined |
| `--token-layer-hover` | `/surface-container[-_/]3$/i` | `#e5e5e5` | ✅ Defined |
| **Colors - Borders** |
| `--token-border-subtle` | `/border[-_/]1$/i` | `#c9c9c9` | ✅ Defined |
| `--token-border-strong` | `/border[-_/]2$/i` | `#5c5c5c` | ✅ Defined |
| **Colors - Text** |
| `--token-text-primary` | `/on-surface[-_/]2$/i` | `#2e2e2e` | ✅ Defined |
| `--token-text-secondary` | `/on-surface[-_/]1$/i` | `#5c5c5c` | ✅ Defined |
| `--token-text-helper` | `/on-surface[-_/]1$/i` | `#5c5c5c` | ✅ Defined |
| `--token-text-error` | `/on-error[-_/]1$/i` | `#b60554` | ✅ Defined |
| **Colors - Interactive** |
| `--token-interactive` | `/accent[-_/]2$/i` | `#0250d9` | ✅ Defined |
| `--token-interactive-hover` | `/accent[-_/]3$/i` | `#022ac0` | ✅ Defined |
| `--token-focus` | `/accent[-_/]2$/i` | `#0250d9` | ✅ Defined |
| `--token-success` | `/success$/i` | `#28a745` | ✅ Defined |
| **Spacing** |
| `--token-space-4` | `/spacing[-_/]1$/i` | `0.25rem` (4px) | ⚠️ Manual |
| `--token-space-8` | `/spacing[-_/]2$/i` | `0.5rem` (8px) | ⚠️ Manual |
| `--token-space-12` | `/spacing[-_/]3$/i` | `0.75rem` (12px) | ⚠️ Manual |
| `--token-space-16` | `/spacing[-_/]4$/i` | `1rem` (16px) | ⚠️ Manual |
| `--token-space-24` | `/spacing[-_/]6$/i` | `1.5rem` (24px) | ⚠️ Manual |
| `--token-space-48` | `/spacing[-_/]10$/i` | `3rem` (48px) | ⚠️ Manual |
| **Border Radius** |
| `--token-radius-sm` | `/radius[-_/]border[-_/]2$/i` | `0.25rem` (4px) | ⚠️ Manual |
| `--token-radius-md` | `/radius[-_/]border[-_/]3$/i` | `0.5rem` (8px) | ⚠️ Manual |
| **Typography** |
| `--token-font-size-xs` | `/font[-_/]scale[-_/]neg-1$/i` | `0.75rem` (12px) | ⚠️ Manual |
| `--token-font-size-sm` | `/font[-_/]scale[-_/]1$/i` | `0.875rem` (14px) | ⚠️ Manual |
| `--token-font-size-md` | `/font[-_/]scale[-_/]base$/i` | `1rem` (16px) | ⚠️ Manual |
| `--token-font-size-lg` | `/font[-_/]scale[-_/]2$/i` | `1.25rem` (20px) | ⚠️ Manual |
| `--token-line-height-tight` | `/(lineheight\|font).*17\\)?$/i` | `1.3` | ⚠️ Manual |
| `--token-line-height-base` | `/(lineheight\|font).*18\\)?$/i` | `1.5` | ⚠️ Manual |

### Tokens Not in Figma (Project-Specific)

| Token | Value | Purpose |
|-------|-------|---------|
| `--token-font-family-base` | IBM Plex Sans | Typography |
| `--token-font-weight-regular` | 400 | Typography |
| `--token-font-weight-medium` | 500 | Typography |
| `--token-font-weight-semibold` | 600 | Typography |
| `--token-space-2` | 0.125rem (2px) | Extra fine spacing |
| `--token-space-6` | 0.375rem (6px) | Fine spacing |
| `--token-space-32` | 2rem (32px) | Large spacing |
| `--token-shadow-soft` | 0 2px 6px rgba(...) | Elevation |
| `--token-shadow-strong` | 0 6px 18px rgba(...) | Elevation |
| `--token-shadow-modal` | 0 2px 12px rgba(...) | Elevation |
| `--token-critical` | #b60554 | Status color |
| `--token-warning-bg` | #fff4e5 | Status background |
| `--token-warning-text` | #856404 | Status text |
| `--token-color-accent` | #fe9339 | Brand accent |
| `--token-focus-ring` | rgba(2, 80, 217, 0.3) | Focus outline |

## Action Items

### To Sync with Figma:

```powershell
# 1. Set your Figma personal access token
$env:FIGMA_TOKEN="figd_your_token_here"

# 2. Run the sync script
cd frontend
node scripts/pull-figma-tokens.mjs

# 3. Review the generated files
cat src/styles/tokens.map.json
cat src/styles/figma.variables.report.json

# 4. Compare and update tokens.scss
code src/styles/tokens.scss
```

### Verification Checklist:

- [ ] Figma token set in environment
- [ ] Sync script runs without errors
- [ ] `tokens.map.json` contains expected values
- [ ] Color values match Figma design
- [ ] Spacing values match Figma design
- [ ] Typography values match Figma design
- [ ] Dark mode tokens available in Figma
- [ ] Updated `tokens.scss` with new values
- [ ] Tested in browser (light + dark mode)
- [ ] No visual regressions

## Expected Figma Variable Structure

Based on your `token-aliases.json`, Figma should have these variable collections:

### Collection: Surface Colors
- `surface-container/1` → Card backgrounds
- `surface-container/2` → Page backgrounds
- `surface-container/3` → Hover states

### Collection: On-Surface (Text)
- `on-surface/1` → Secondary text
- `on-surface/2` → Primary text

### Collection: Borders
- `border/1` → Subtle borders
- `border/2` → Strong borders

### Collection: Accents
- `accent/2` → Interactive elements
- `accent/3` → Interactive hover

### Collection: Spacing
- `spacing/1` through `spacing/10` → 4px increments

### Collection: Radius
- `radius-border/2` → Small radius
- `radius-border/3` → Medium radius

### Collection: Typography
- `font-scale/neg-1` → Extra small
- `font-scale/base` → Base size
- `font-scale/1` → Small
- `font-scale/2` → Large

## Notes

- ✅ = Token defined and ready
- ⚠️ = Manually set, not synced from Figma yet
- ❌ = Missing or needs attention

Last updated: 2025-11-24
