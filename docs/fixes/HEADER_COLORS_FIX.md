# Header Column Colors Fix - Technical Summary

## Problem
Custom header column colors configured in the Global Settings admin page were not being applied to the Bridge calculator (and other calculators). The admin interface allowed setting colors like:
- Column 1 (Fusion): Orange `#ED8B00`
- Column 2 (Variable Bridge): Dark Blue `#002855`  
- Column 3 (Fixed Bridge): Green `#27723e`

However, these colors were not displaying in the actual calculator - it showed the default colors instead.

## Root Cause
There was a **database table mismatch** between where colors were being saved and where they were being read:

**Saving (GlobalSettings.jsx):**
- Table: `results_configuration`
- Key: `'header_colors'`
- Structure: One row per calculator_type (btl, bridge, core)

**Loading (useHeaderColors.js hook):**
- Table: `app_constants` ❌ **WRONG TABLE**
- Key: `'results_table_header_colors'`
- Structure: Expected single row with all calculator types

## Solution
Fixed the `useHeaderColors` hook to read from the correct database table:

### Changes Made

**File: `frontend/src/hooks/useHeaderColors.js`**
- Changed database query from `app_constants` table to `results_configuration` table
- Updated to handle the multi-row structure (one row per calculator_type)
- Maintained the same localStorage key for consistency
- Now correctly reconstructs the complete color configuration from multiple database rows

**File: `frontend/src/utils/colorDiagnostic.js` (NEW)**
- Created diagnostic utilities for debugging color issues
- Added browser console functions:
  - `window.diagnoseHeaderColors()` - Check what colors are stored and applied
  - `window.forceApplyHeaderColors()` - Force re-apply colors from localStorage
  - `window.resetHeaderColors()` - Clear color settings and reload defaults

**File: `frontend/src/App.jsx`**
- Added import for color diagnostic utilities to make them available globally

## How It Works Now

### Save Flow (Admin):
1. User configures colors in Global Settings admin page
2. Colors saved to `results_configuration` table:
   - Row 1: key='header_colors', calculator_type='btl', config={labelBg, labelText, columns[]}
   - Row 2: key='header_colors', calculator_type='bridge', config={...}
   - Row 3: key='header_colors', calculator_type='core', config={...}
3. Colors also saved to localStorage as `results_table_header_colors` JSON
4. `applyHeaderColorsToCss()` called immediately for instant preview
5. CSS custom properties updated (e.g., `--results-header-bridge-col1-bg: #ED8B00`)

### Load Flow (Calculator):
1. App starts, `useHeaderColors()` hook runs
2. First checks localStorage for fast initial load
3. Then queries Supabase `results_configuration` table for authoritative data
4. Merges all calculator_type rows into complete color configuration
5. Applies colors to CSS custom properties via `applyAllHeaderColors()`
6. Updates localStorage with latest values
7. Calculator headers now display with custom colors ✅

## CSS Architecture
Colors are applied via CSS custom properties with fallbacks:

```jsx
<th style={{ 
  backgroundColor: 'var(--results-header-bridge-col1-bg, var(--results-header-col1-bg))',
  color: 'var(--results-header-bridge-col1-text, var(--results-header-col1-text))'
}}>
```

**Default values** (in tokens.scss):
```scss
--results-header-bridge-col1-bg: var(--mfs-brand-navy); // #002855
--results-header-bridge-col2-bg: var(--mfs-brand-navy-500); // #1B3B6F
--results-header-bridge-col3-bg: var(--mfs-brand-orange); // #ED8B00
```

**Custom values** (applied by useHeaderColors hook):
```javascript
root.style.setProperty('--results-header-bridge-col1-bg', '#ED8B00'); // Orange
root.style.setProperty('--results-header-bridge-col2-bg', '#002855'); // Dark Blue
root.style.setProperty('--results-header-bridge-col3-bg', '#27723e'); // Green
```

## Testing the Fix

### Verify the Fix:
1. Open browser DevTools console
2. Run: `window.diagnoseHeaderColors()`
3. Check output:
   - ✅ "Custom colors ARE applied (found hex values)" = Working
   - ⚠️ "Custom colors NOT applied (still using token variables)" = Issue

### Force Refresh (if needed):
```javascript
window.forceApplyHeaderColors()
```

### Reset to Defaults (if needed):
```javascript
window.resetHeaderColors()
// Then reload the page
```

## Database Schema Reference

**Table: `results_configuration`**
```sql
CREATE TABLE results_configuration (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  calculator_type TEXT NOT NULL, -- 'btl', 'bridge', or 'core'
  config JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(key, calculator_type)
);
```

**Example Data:**
```json
// Row 1: calculator_type = 'bridge'
{
  "labelBg": "#f4f6f9",
  "labelText": "#181818",
  "columns": [
    { "bg": "#ED8B00", "text": "#ffffff" },  // Fusion column
    { "bg": "#002855", "text": "#ffffff" },  // Variable Bridge column
    { "bg": "#27723e", "text": "#ffffff" }   // Fixed Bridge column
  ]
}
```

## Files Modified
1. ✅ `frontend/src/hooks/useHeaderColors.js` - Fixed database table mismatch
2. ✅ `frontend/src/utils/colorDiagnostic.js` - New diagnostic utilities
3. ✅ `frontend/src/App.jsx` - Import diagnostics for global availability

## Build Status
✅ Build successful - no errors
⚠️ Minor CSS warning (pre-existing, unrelated to changes)

## Next Steps
1. Deploy the updated code to production
2. Clear browser cache if needed (hard refresh: Ctrl+Shift+R / Cmd+Shift+R)
3. Test by configuring colors in admin and viewing calculator
4. If issues persist, use diagnostic utilities to troubleshoot

## Related Files (No Changes Needed)
- `frontend/src/components/admin/GlobalSettings.jsx` - Save logic is correct
- `frontend/src/components/calculators/BridgingCalculator.jsx` - CSS variables correctly referenced
- `frontend/src/styles/tokens.scss` - Default color tokens correct
