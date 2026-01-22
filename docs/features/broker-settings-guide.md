# Broker Settings - Configuration Guide

## Current Status

### ✅ What's Working
- Broker settings UI in Constants admin panel
- localStorage persistence (survives page refresh)
- Cross-tab synchronization
- Export/Import via JSON
- Calculator validation with tolerance
- Decimal precision fixed

### ⚠️ What's NOT Working
- **Database persistence** - Broker settings are NOT saved to Supabase `app_constants` table
- Settings are lost if:
  - User clears browser data
  - User switches browsers/devices
  - localStorage is manually cleared

---

## Issue 1: Database Persistence

### Current Behavior
When you click "Save All to Database" in Constants UI:
- ✅ Product lists → Saved to DB
- ✅ Fee columns → Saved to DB
- ✅ Market rates → Saved to DB
- ✅ Flat-above rules → Saved to DB
- ❌ **Broker routes** → NOT saved to DB (localStorage only)
- ❌ **Broker commission defaults** → NOT saved to DB (localStorage only)
- ❌ **Broker commission tolerance** → NOT saved to DB (localStorage only)

### Why This Happens
The `saveToStorage` function in `Constants.jsx` only includes these fields in the database insert:
```javascript
const insertRow = {
  key,
  product_lists: payload.productLists || null,
  fee_columns: payload.feeColumns || null,
  flat_above_commercial_rule: payload.flatAboveCommercialRule || null,
  market_rates: payload.marketRates || null,
  // ❌ Missing: broker_routes, broker_commission_defaults, broker_commission_tolerance
};
```

### Solution Options

#### Option A: Add to JSON `value` Column (Easiest)
If your `app_constants` table has a `value` JSONB column, broker settings are already included in the fallback save. Just need to ensure the fallback is always used for broker settings.

**No code changes needed** - the `saveToSupabase(payload)` fallback already includes all broker settings in the `value` JSON column.

#### Option B: Add Dedicated Columns (Recommended)
Add structured columns to `app_constants` table for better queryability:

**SQL Migration:**
```sql
-- Add broker settings columns to app_constants table
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_routes JSONB;
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_commission_defaults JSONB;
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_commission_tolerance NUMERIC;

-- Add comments
COMMENT ON COLUMN app_constants.broker_routes IS 'Broker route display names (e.g., {"DIRECT_BROKER": "Direct Broker"})';
COMMENT ON COLUMN app_constants.broker_commission_defaults IS 'Default commission percentages by route (e.g., {"Direct Broker": 0.7})';
COMMENT ON COLUMN app_constants.broker_commission_tolerance IS 'Allowable deviation from default commission (e.g., 0.2 for ±0.2%)';
```

**Code Update in `Constants.jsx`:**
Find the `saveToStorage` function (around line 360) and update the `insertRow`:
```javascript
const insertRow = {
  key,
  product_lists: payload.productLists || null,
  fee_columns: payload.feeColumns || null,
  flat_above_commercial_rule: payload.flatAboveCommercialRule || null,
  market_rates: payload.marketRates || null,
  broker_routes: payload.brokerRoutes || null,                           // ADD THIS
  broker_commission_defaults: payload.brokerCommissionDefaults || null,   // ADD THIS
  broker_commission_tolerance: payload.brokerCommissionTolerance ?? null, // ADD THIS
};
```

Also update the `resetToDefaults` function (around line 450) upsertRow:
```javascript
const upsertRow = {
  key: 'app.constants',
  product_lists: payload.productLists,
  fee_columns: payload.feeColumns,
  flat_above_commercial_rule: payload.flatAboveCommercialRule,
  market_rates: payload.marketRates,
  broker_routes: payload.brokerRoutes,                           // ADD THIS
  broker_commission_defaults: payload.brokerCommissionDefaults,   // ADD THIS
  broker_commission_tolerance: payload.brokerCommissionTolerance, // ADD THIS
};
```

Also update the detection/load logic in the second `useEffect` (around line 250-280) to check for and load broker columns:
```javascript
if (row.product_lists || row.fee_columns || row.flat_above_commercial_rule || row.market_rates || row.broker_routes) {
  loadedData = {
    productLists: row.product_lists || DEFAULT_PRODUCT_TYPES_LIST,
    feeColumns: row.fee_columns || DEFAULT_FEE_COLUMNS,
    flatAboveCommercialRule: row.flat_above_commercial_rule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
    marketRates: row.market_rates || DEFAULT_MARKET_RATES,
    brokerRoutes: row.broker_routes || DEFAULT_BROKER_ROUTES,                             // ADD THIS
    brokerCommissionDefaults: row.broker_commission_defaults || DEFAULT_BROKER_COMMISSION_DEFAULTS, // ADD THIS
    brokerCommissionTolerance: row.broker_commission_tolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE // ADD THIS
  };
}
```

---

## Issue 2: Adding New Dropdown Values

### How to Add a New Broker Route

**Example:** Adding "Introducer" as a new broker route option

#### Step 1: Update `constants.js`
File: `frontend/src/config/constants.js`

```javascript
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  PACKAGER: 'Packager',
  INTRODUCER: 'Introducer',  // ← ADD THIS NEW ROUTE
};

export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': 0.7,
  'Mortgage club': 0.9,
  'Network': 0.9,
  'Packager': 0.9,
  'Introducer': 0.5,  // ← ADD DEFAULT COMMISSION FOR NEW ROUTE
};
```

#### Step 2: Test in Calculator
1. Save the file
2. Refresh the calculator page
3. Select "Broker" as client type
4. The "Broker Route" dropdown should now show "Introducer" as an option
5. Selecting "Introducer" will default broker commission to 0.5%
6. User can adjust within ±0.2% (0.3% to 0.7%)

#### Step 3: Update via Constants UI (Optional)
After adding to code defaults:
1. Go to `/admin` (Constants UI)
2. Scroll to "Broker Settings" section
3. Edit "INTRODUCER" route display name if needed
4. Edit default commission percentage if needed
5. Click "Save All to Database"

**Note:** If database persistence is not implemented (see Issue 1), these edits will only save to localStorage.

---

## How the System Works

### Priority Order (Highest to Lowest)
1. **Constants UI edits** → Stored in localStorage → Used by calculators
2. **Code defaults** → `constants.js` → Fallback if no localStorage

### Data Flow

```
User adds route in constants.js
         ↓
Calculator reads BROKER_ROUTES
         ↓
Dropdown populated with all routes
         ↓
User selects route in calculator
         ↓
getBrokerRoutesAndDefaults() reads localStorage OR defaults
         ↓
Default commission loaded
         ↓
User adjusts commission (validated with tolerance)
         ↓
Quote saved with broker_route + broker_commission_percent
```

### Where Values Are Stored

| Data | Storage Location | Scope |
|------|-----------------|-------|
| **Route Keys** (DIRECT_BROKER, etc.) | `constants.js` | Code-level, hardcoded |
| **Route Display Names** | `constants.js` → localStorage → DB* | Editable at runtime |
| **Commission Defaults** | `constants.js` → localStorage → DB* | Editable at runtime |
| **Tolerance** | `constants.js` → localStorage → DB* | Editable at runtime |
| **User's Quote Data** | Supabase `quotes` or `bridge_quotes` table | Per quote |

*DB = Only if you implement Option B from Issue 1

---

## Complete Example: Adding "Solicitor" Route

### 1. Update constants.js
```javascript
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  PACKAGER: 'Packager',
  SOLICITOR: 'Solicitor',  // NEW
};

export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': 0.7,
  'Mortgage club': 0.9,
  'Network': 0.9,
  'Packager': 0.9,
  'Solicitor': 0.8,  // NEW - default 0.8%
};
```

### 2. Refresh Calculator
- New dropdown option "Solicitor" appears automatically
- Default commission: 0.8%
- Adjustable range: 0.6% to 1.0% (±0.2%)

### 3. Edit in Constants UI (Optional)
- Go to `/admin`
- Find "SOLICITOR" in Broker Routes section
- Change display name from "Solicitor" to "Legal Introducer"
- Change default commission from 0.8 to 0.75
- Save

### 4. What Happens to Existing Quotes?
- **Existing quotes** retain their saved `broker_route` and `broker_commission_percent` values
- **New quotes** use the updated display name and default
- If you rename a route key (e.g., SOLICITOR → LEGAL_INTRODUCER), existing quotes will show the old route name

---

## Migration Path for Database Persistence

If you want full database persistence for broker settings:

### Step 1: Run SQL Migration
```sql
-- File: migrations/013_add_broker_settings_to_app_constants.sql
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_routes JSONB;
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_commission_defaults JSONB;
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_commission_tolerance NUMERIC;

COMMENT ON COLUMN app_constants.broker_routes IS 'Broker route display names';
COMMENT ON COLUMN app_constants.broker_commission_defaults IS 'Default commission percentages by route';
COMMENT ON COLUMN app_constants.broker_commission_tolerance IS 'Allowable deviation from default commission (±%)';
```

### Step 2: Update Constants.jsx (3 locations)
See detailed code snippets in "Solution Options → Option B" above.

### Step 3: Test
1. Edit broker settings in Constants UI
2. Click "Save All to Database"
3. Clear localStorage: `localStorage.clear()` in console
4. Refresh page
5. Verify broker settings are restored from database

---

## Quick Reference: Files to Edit

### To add a new broker route:
- **Required:** `frontend/src/config/constants.js`
  - Add to `BROKER_ROUTES`
  - Add to `BROKER_COMMISSION_DEFAULTS`

### To enable database persistence:
- **SQL:** Create migration `migrations/013_add_broker_settings_to_app_constants.sql`
- **Code:** Update `frontend/src/components/Constants.jsx`:
  - Line ~360: `saveToStorage` function
  - Line ~250-280: Second `useEffect` (load from DB)
  - Line ~450: `resetToDefaults` function

### To verify saved quote data:
- **Database:** Check `quotes.broker_route` and `quotes.broker_commission_percent`
- **Database:** Check `bridge_quotes.broker_route` and `bridge_quotes.broker_commission_percent`

---

## FAQ

**Q: Why do I need to update `constants.js` AND the Constants UI?**
- `constants.js` defines the **route keys** (code-level identifiers)
- Constants UI edits the **display names** and **default values** (runtime configuration)

**Q: Can I delete a broker route?**
- Technically yes (remove from `constants.js`), but existing quotes may reference the old route name
- Better to rename or hide it in the UI

**Q: What happens if tolerance is 0?**
- Users cannot adjust commission at all - it's locked to the default value

**Q: Can different users have different broker settings?**
- Not currently - settings are app-wide (localStorage or database)
- Would need role-based configuration system for per-user settings

**Q: How do I reset broker settings to defaults?**
- Constants UI: Click "Reset defaults" button
- Code: Delete localStorage key `app.constants.override.v1`
- Database: Delete or update `app_constants` row where `key = 'app.constants'`
