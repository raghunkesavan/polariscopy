# Migration 047: Table Structure Simplification

## Overview
This migration simplifies the database structure by removing redundant columns and consolidating data into JSONB fields, following the principle that each table should store only what its corresponding admin page needs.

## Problem Statement
Previous migrations (042-045) created `app_settings` table with duplicate columns:
- Had BOTH individual columns (`product_lists`, `fee_columns`, etc.) AND a `value` JSONB column
- This duplication was confusing and against JSONB best practices
- History tables tried to track individual columns, causing trigger errors

## Solution
### Tables Affected
1. **app_settings** (Constants page data)
2. **app_settings_history** (Audit trail)
3. **results_configuration** (Already correct - no changes needed)
4. **results_configuration_history** (Simplified to match pattern)

### Changes Made

#### app_settings Table
**Before:**
```sql
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE,
    value JSONB,
    product_lists JSONB,      -- ❌ Redundant
    fee_columns JSONB,         -- ❌ Redundant
    market_rates JSONB,        -- ❌ Redundant
    -- ... 10+ redundant columns
);
```

**After:**
```sql
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,      -- ✅ Single source of truth
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    description TEXT,
    is_active BOOLEAN
);
```

#### History Tables
**Before:**
- Tried to track individual columns
- Caused "record 'new' has no field 'idx'" errors

**After:**
- Store complete before/after snapshots in `changes` JSONB
- Use simplified trigger functions
- No column enumeration errors

### Data Structure

#### app_settings.value Format
```json
{
  "productLists": {
    "Core": ["2yr Fix", "3yr Fix"],
    "Commercial": ["2yr Fix", "3yr Fix"]
  },
  "feeColumns": {
    "Core": [6, 4, 3, 2],
    "Commercial": [6, 4, 2]
  },
  "flatAboveCommercialRule": {
    "enabled": true,
    "tierLtv": { "2": 65, "3": 75 }
  },
  "marketRates": {
    "STRESS_BBR": 0.0425,
    "CURRENT_MVR": 0.0859
  },
  "brokerRoutes": {
    "NETWORK": "Network"
  },
  "brokerCommissionDefaults": {
    "Network": 0.9
  },
  "brokerCommissionTolerance": 0.2,
  "fundingLinesBTL": ["Line 1", "Line 2"],
  "fundingLinesBridge": ["Line 1", "Line 2"]
}
```

#### results_configuration.config Format
Depends on `key` value:

**visibility** (boolean map):
```json
{
  "Pay Rate": true,
  "Gross Loan": true,
  "ICR": false
}
```

**row_order** (array):
```json
["Pay Rate", "Gross Loan", "Net Loan", "LTV", "ICR"]
```

**label_aliases** (string map):
```json
{
  "Pay Rate": "Interest Rate",
  "Gross Loan": "Total Loan Amount"
}
```

**header_colors** (color config):
```json
{
  "labelBg": "#f4f6f9",
  "labelText": "#181818",
  "columns": [
    { "bg": "#008891", "text": "#ffffff" },
    { "bg": "#ED8B00", "text": "#ffffff" }
  ]
}
```

## Frontend Changes

### Constants.jsx
- Changed from `app_constants` to `app_settings` table
- Removed structured column support detection
- Uses `value` JSONB column only
- Simpler save operation (single upsert)

### GlobalSettings.jsx
- Changed from `app_constants` to `results_configuration` table
- Queries by `key` and `calculator_type` (3 rows per setting type)
- Saves 3 separate rows per setting type (btl, bridge, core)
- Uses `config` JSONB column

## Migration Execution

### Prerequisites
1. Backup database
2. Verify migrations 042-045 were run
3. Test in development first

### Steps
```bash
# Run migration 047
psql -U postgres -d your_database -f database/migrations/047_simplify_table_structures.sql

# Verify structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
ORDER BY ordinal_position;

# Verify data
SELECT id, key, jsonb_pretty(value) FROM app_settings;

# Test triggers
UPDATE app_settings SET value = value || '{"test": true}'::jsonb WHERE key = 'app.constants';
SELECT * FROM app_settings_history ORDER BY changed_at DESC LIMIT 1;
```

### Rollback Plan
If issues occur:
1. Restore from backup
2. Or revert to migration 046 state
3. Frontend will fall back to old table automatically

## Benefits

### Before Migration
- ❌ 10+ redundant columns in app_settings
- ❌ Confusing which column to use
- ❌ Trigger errors with column mapping
- ❌ Hard to add new config fields
- ❌ History tables complex

### After Migration
- ✅ Single JSONB column (clean)
- ✅ Easy to add new fields (just update JSONB)
- ✅ No trigger errors
- ✅ Simpler history tracking
- ✅ Follows JSONB best practices
- ✅ Each table stores only what its page needs

## Testing Checklist

### Database Testing
- [ ] Migration runs without errors
- [ ] All data migrated to `value` column
- [ ] Redundant columns dropped
- [ ] Triggers work correctly
- [ ] History captures changes
- [ ] No orphaned data

### Constants Page Testing
- [ ] Page loads without errors
- [ ] All sections expand/collapse
- [ ] Product lists save correctly
- [ ] Fee columns save correctly
- [ ] Market rates save correctly
- [ ] Broker settings save correctly
- [ ] Funding lines save correctly
- [ ] UI preferences save correctly
- [ ] Data persists after reload
- [ ] History tracking works

### Global Settings Page Testing
- [ ] Page loads without errors
- [ ] All tabs work (visibility, order, labels, colors)
- [ ] BTL settings save correctly
- [ ] Bridge settings save correctly
- [ ] Core settings save correctly
- [ ] Data persists after reload
- [ ] History tracking works

### Calculator Testing
- [ ] BTL calculator uses constants
- [ ] Bridging calculator uses constants
- [ ] Core calculator uses constants
- [ ] Results table shows correct visibility
- [ ] Results table shows correct order
- [ ] Results table shows correct labels
- [ ] Results table shows correct colors
- [ ] PDF generation works

## Troubleshooting

### Issue: Frontend shows no data
**Cause:** Old localStorage cache  
**Solution:** Clear localStorage or hard refresh (Ctrl+Shift+R)

### Issue: Trigger errors persist
**Cause:** Migration 046 wasn't rolled back  
**Solution:**
```sql
DROP TRIGGER IF EXISTS track_app_settings_changes_trigger ON app_settings;
DROP TRIGGER IF EXISTS track_results_configuration_changes_trigger ON results_configuration;
-- Then re-run migration 047
```

### Issue: Data not in value column
**Cause:** Migration Step 1 didn't run  
**Solution:** Manually copy data:
```sql
UPDATE app_settings 
SET value = jsonb_build_object(
    'productLists', product_lists,
    'feeColumns', fee_columns,
    -- ... etc
)
WHERE value = '{}'::jsonb;
```

### Issue: History table errors
**Cause:** Old columns still exist  
**Solution:**
```sql
ALTER TABLE app_settings_history 
    DROP COLUMN IF EXISTS product_lists,
    DROP COLUMN IF EXISTS fee_columns;
-- etc.
```

## Future Improvements
1. Add validation constraints on JSONB structure
2. Add indexes on JSONB fields for common queries
3. Add database functions to validate config structure
4. Consider partitioning history tables by date

## References
- Migration 042: Created app_settings table (with redundant columns)
- Migration 043: Created results_configuration table (correct structure)
- Migration 044: Created history tables
- Migration 045: Migrated data from app_constants
- Migration 046: Fixed trigger errors (interim fix)
- Migration 047: This migration (final clean structure)
