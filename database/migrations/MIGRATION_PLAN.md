# Database Refactoring Migration Plan

## Overview
Separating `app_constants` table into two specialized tables for better organization and maintainability.

## New Structure

### 1. `app_settings` 
- **Purpose**: Application-wide constants (Constants admin page)
- **Keys**: `app.constants`
- **Data**: Product lists, fee columns, market rates, broker settings, funding lines, UI preferences

### 2. `results_configuration`
- **Purpose**: Calculator display configuration (Global Settings page)  
- **Keys**: `row_order`, `visibility`, `label_aliases`, `header_colors`
- **Data**: Per-calculator (btl/bridge/core) display settings

### 3. History Tables
- `app_settings_history` - Tracks changes to app_settings
- `results_configuration_history` - Tracks changes to results_configuration

## Migration Order

### Phase 1: Database (Run in Supabase SQL Editor)

1. **042_create_app_settings_table.sql**
   - Creates `app_settings` table
   - Adds indexes and triggers
   - ✅ Safe to run (no data changes)

2. **043_create_results_configuration_table.sql**
   - Creates `results_configuration` table
   - Adds unique constraint on key+calculator_type
   - ✅ Safe to run (no data changes)

3. **044_create_history_tables_for_new_structure.sql**
   - Creates history tables and triggers
   - ✅ Safe to run (no data changes)

4. **045_migrate_data_to_new_tables.sql**
   - Copies data from `app_constants` to new tables
   - ⚠️ **IMPORTANT**: Backup database first!
   - Uses ON CONFLICT to safely handle re-runs
   - Does NOT delete from app_constants (keeps as backup)

### Phase 2: Frontend Updates (Code Changes)

Files to update:
1. `frontend/src/hooks/useResultsRowOrder.js` - Change table from app_constants to results_configuration
2. `frontend/src/hooks/useResultsVisibility.js` - Change table and query structure
3. `frontend/src/hooks/useResultsLabelAlias.js` - Change table and query structure
4. `frontend/src/hooks/useHeaderColors.js` - Change table and query structure
5. `frontend/src/components/admin/GlobalSettings.jsx` - Update all save/load queries
6. `frontend/src/components/admin/Constants.jsx` - Change from app_constants to app_settings

### Phase 3: Testing

1. ✅ Verify data migration
2. ✅ Test Constants page (save/load)
3. ✅ Test Global Settings page (all tabs)
4. ✅ Test calculators display correctly
5. ✅ Test PDF generation still works
6. ✅ Verify audit trail is working

### Phase 4: Cleanup (After verification)

1. Archive old timestamped rows: `DELETE FROM app_constants WHERE key LIKE 'app.constants:%';`
2. Optionally keep app_constants for rollback safety (1-2 weeks)
3. Eventually drop app_constants table and its triggers

## Rollback Plan

If something goes wrong:

```sql
-- Rollback: Frontend will still work with app_constants
-- Just update frontend to point back to app_constants table

-- Optionally delete new tables:
DROP TRIGGER IF EXISTS track_app_settings_changes_trigger ON app_settings;
DROP TRIGGER IF EXISTS track_results_configuration_changes_trigger ON results_configuration;
DROP TABLE IF EXISTS app_settings_history;
DROP TABLE IF EXISTS results_configuration_history;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS results_configuration;
```

## Benefits After Migration

✅ Clear separation of concerns  
✅ Better query performance  
✅ Easier to understand codebase  
✅ Independent scaling  
✅ Cleaner audit trails  
✅ Room for future enhancements  

## Estimated Timeline

- Database migrations: 15 minutes
- Frontend updates: 2-3 hours
- Testing: 1 hour
- **Total: ~4 hours**

## Next Steps

1. **Backup your database**
2. Run migrations 042-045 in Supabase SQL Editor
3. Verify data with test queries in migration 045
4. Update frontend files (I'll provide specific changes)
5. Test everything
6. Clean up old data after 1-2 weeks

---

Ready to proceed? Let me know when you've run the database migrations!
