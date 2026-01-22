# Results Table Fields and Row Ordering Implementation

## Summary
This document outlines the changes made to add new fields to the BTL and Bridge results tables, along with a configurable row ordering system for administrators.

## New Fields Added

### BTL Calculator Results Table
Added the following fields:
- **Deferred Interest %** - Percentage of deferred interest
- **Deferred Interest £** - Pound value of deferred interest
- **Rolled Months** - Number of months interest is rolled
- **Rolled Months Interest** - Interest amount for rolled months
- **Serviced Interest** - Serviced interest amount
- **Title Insurance Cost** - Cost of title insurance (NEW for both BTL and Bridge)

### Bridging Calculator Results Table
Added the following field:
- **Title Insurance Cost** - Cost of title insurance (all other fields already existed)

## Database Changes

### Migration File: `migrations/020_add_title_insurance_and_row_ordering.sql`

1. **Added `title_insurance_cost` column** to both `quote_results` and `bridge_quote_results` tables
2. **Added `results_row_order` column** to `app_constants` table for storing row display order configuration
3. **Initialized default row ordering** for both BTL and Bridging calculators

## Frontend Changes

### 1. GlobalSettings Component (`frontend/src/components/GlobalSettings.jsx`)

**Enhanced with:**
- Added all new fields to `DEFAULT_BTL_ROWS` array
- Added Title Insurance Cost to `DEFAULT_BRIDGE_ROWS` array
- Added state management for row ordering (`btlRowOrder`, `bridgeRowOrder`)
- Added row ordering handlers:
  - `handleMoveRowUp(index, type)` - Move row up in display order
  - `handleMoveRowDown(index, type)` - Move row down in display order
- Enhanced `loadSettings()` to load both visibility and ordering settings from Supabase
- Enhanced `handleSave()` to save both visibility and ordering settings
- Updated `handleReset()` to reset both visibility and ordering to defaults
- **Added Row Display Order Configuration UI**:
  - Two-column layout showing BTL and Bridge row orders
  - Up/Down buttons for each row
  - Visual indication of hidden rows (grayed out with "(Hidden)" label)
  - Scrollable lists with max-height of 300px
  - Numbered rows showing current order (1, 2, 3, etc.)

### 2. Custom Hook: `useResultsRowOrder` (`frontend/src/hooks/useResultsRowOrder.js`)

**New hook created to manage row ordering:**
- Loads row order from localStorage and Supabase
- Listens for storage events to update when settings change
- Provides `getOrderedRows(rows)` function to sort rows according to configured order
- Handles both 'btl' and 'bridge' calculator types

### 3. BTL_Calculator Component (`frontend/src/components/BTL_Calculator.jsx`)

**Updates:**
- Imported `useResultsRowOrder` hook
- Added `getOrderedRows` from hook
- Updated placeholder list to include all new fields
- Modified results rendering to:
  1. Filter visible rows using `isRowVisible()`
  2. Apply ordering using `getOrderedRows()`
  3. Display rows in configured order

### 4. BridgingCalculator Component (`frontend/src/components/BridgingCalculator.jsx`)

**Updates:**
- Imported `useResultsRowOrder` hook
- Added `getOrderedRows` from hook
- Updated placeholder list to include Title Insurance Cost
- Modified results rendering to:
  1. Filter visible rows using `isRowVisible()`
  2. Apply ordering using `getOrderedRows()`
  3. Display rows in configured order

## How Row Ordering Works

### Admin Configuration Flow:
1. Admin opens GlobalSettings component
2. Navigates to "Row Display Order Configuration" section
3. Uses up/down arrow buttons (↑/↓) to reorder rows
4. Clicks "Save Settings"
5. Settings saved to:
   - Supabase `app_constants` table (key: `results_table_row_order`)
   - localStorage for immediate effect
6. Storage events dispatched to notify all open calculator instances

### Calculator Display Flow:
1. Calculator component mounts
2. `useResultsRowOrder` hook loads ordering from localStorage/Supabase
3. Results placeholders are filtered by visibility settings
4. Filtered rows are sorted using `getOrderedRows()`
5. Rows displayed in configured order
6. Hook listens for storage events to update order dynamically

## Data Structure

### app_constants.results_row_order (JSONB)
```json
{
  "btl": [
    "APRC",
    "Admin Fee",
    "Broker Client Fee",
    ...
  ],
  "bridge": [
    "APRC",
    "Admin Fee",
    "Broker Client Fee",
    ...
  ]
}
```

### localStorage keys:
- `results_table_visibility` - Visibility settings
- `results_table_row_order` - Row ordering settings

## Testing Checklist

- [ ] Run migration `020_add_title_insurance_and_row_ordering.sql` on database
- [ ] Verify `title_insurance_cost` column exists in `quote_results` table
- [ ] Verify `title_insurance_cost` column exists in `bridge_quote_results` table
- [ ] Verify `results_row_order` column exists in `app_constants` table
- [ ] Open GlobalSettings and verify all new fields appear in visibility lists
- [ ] Test row ordering UI:
  - [ ] Move rows up/down using arrow buttons
  - [ ] Verify disabled state on first row (up button) and last row (down button)
  - [ ] Verify hidden rows show grayed out with "(Hidden)" label
  - [ ] Save settings and verify persistence
- [ ] Open BTL Calculator:
  - [ ] Verify all new fields appear in results table (when visible)
  - [ ] Verify rows appear in configured order
  - [ ] Toggle visibility in GlobalSettings and verify calculator updates
  - [ ] Change row order in GlobalSettings and verify calculator updates
- [ ] Open Bridging Calculator:
  - [ ] Verify Title Insurance Cost appears in results table
  - [ ] Verify rows appear in configured order
  - [ ] Toggle visibility in GlobalSettings and verify calculator updates
  - [ ] Change row order in GlobalSettings and verify calculator updates
- [ ] Test "Reset to Defaults" button restores original order and visibility

## Implementation Notes

### Why Row Ordering?
- Provides flexibility for administrators to customize the results table display
- Allows prioritization of important fields
- Enables grouping of related fields together
- Improves user experience by showing most relevant data first

### Technical Decisions:
1. **Separate visibility and ordering** - Allows independent control of what's shown vs. how it's ordered
2. **Array-based ordering** - Simple and efficient, maintains explicit order
3. **localStorage + Supabase** - Provides immediate updates and persistence
4. **Storage events** - Enables real-time updates across multiple tabs/windows
5. **Custom hook** - Encapsulates ordering logic for reusability
6. **Up/Down buttons** - Simple, intuitive UI (considered drag-and-drop but opted for simpler approach)

### Future Enhancements:
- Add drag-and-drop support for easier reordering
- Add grouping/categories for related fields
- Add import/export of configurations
- Add per-user row ordering preferences
- Add field descriptions/tooltips in ordering UI

## Files Modified

1. `migrations/020_add_title_insurance_and_row_ordering.sql` (NEW)
2. `frontend/src/components/GlobalSettings.jsx`
3. `frontend/src/hooks/useResultsRowOrder.js` (NEW)
4. `frontend/src/components/BTL_Calculator.jsx`
5. `frontend/src/components/BridgingCalculator.jsx`

## Migration Instructions

1. **Database Migration:**
   ```bash
   # Run the migration SQL file
   psql -U your_user -d your_database -f migrations/020_add_title_insurance_and_row_ordering.sql
   ```

2. **Frontend Deployment:**
   ```bash
   cd frontend
   npm install  # In case any dependencies need updating
   npm run build
   ```

3. **Verify Installation:**
   - Log in as admin user
   - Navigate to Global Settings
   - Verify all new fields appear in visibility lists
   - Test row ordering UI
   - Verify changes persist after page refresh

## Support & Troubleshooting

### Common Issues:

**Issue:** Row order doesn't update immediately
- **Solution:** Check browser console for storage event errors. Clear localStorage and refresh.

**Issue:** New fields don't appear in GlobalSettings
- **Solution:** Verify DEFAULT_BTL_ROWS and DEFAULT_BRIDGE_ROWS arrays include new fields.

**Issue:** Row order reverts to default after save
- **Solution:** Check Supabase permissions for app_constants table. Verify results_row_order column exists.

**Issue:** Cannot move rows up/down
- **Solution:** Check that btlRowOrder/bridgeRowOrder state is properly initialized as arrays.

---

**Implementation Date:** November 14, 2025
**Version:** 1.0.0
**Status:** ✅ Completed
