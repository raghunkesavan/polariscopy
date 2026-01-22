# Slider Limits Implementation - Per-Rate Configuration

## Overview
Slider controls for "Rolled Months" and "Deferred Interest %" now use min/max values from individual rate records in the database, rather than global constants. Each rate product can define its own limits.

## Changes Made

### 1. Frontend Calculator Updates

**BTL_Calculator.jsx:**
- Removed `SLIDER_CONFIG` import and `sliderMaxValues` state
- Added logic to extract min/max limits from rate objects per column
- Sliders now use limits from the best rate in each fee bucket column
- Column names used: `max_rolled_months`, `max_defer_int`, `min_rolled_months`, `min_defer_int`

**BridgingCalculator.jsx:**
- Removed `SLIDER_CONFIG` import and `sliderMaxValues` state  
- Added logic to extract limits from `bestFusion`, `bestVariable`, and `bestFixed` rate objects
- Each of the 3 columns (Fusion, Variable Bridge, Fixed Bridge) can have different limits
- Uses same column names as BTL calculator

### 2. Database Schema

**Migration: 021_add_min_slider_limits_to_rates.sql**
- Added `min_rolled_months` column (INTEGER, default 0) to both `rates` and `rates_flat` tables
- Added `min_defer_int` column (NUMERIC(5,2), default 0) to both tables
- Existing columns: `max_rolled_months`, `max_defer_int`

**Column Definitions:**
- `min_rolled_months`: Minimum number of months that can be rolled into the loan
- `max_rolled_months`: Maximum number of months that can be rolled into the loan  
- `min_defer_int`: Minimum percentage of interest that can be deferred (primarily for Bridge)
- `max_defer_int`: Maximum percentage of interest that can be deferred

### 3. CSV Import Script Updates

**backend/scripts/importRatesCsv.js:**
- Added parsing for `min_rolled_months` and `min_defer_int` columns from CSV
- Updated insert statement to include new columns
- Supports both underscore and hyphenated column names in CSV

### 4. Configuration Cleanup

**frontend/src/config/constants.js:**
- Removed `SLIDER_CONFIG` export (obsolete)
- Added comment noting that slider limits now come from rate records

**frontend/src/components/Constants.jsx:**
- `SLIDER_CONFIG` import still present but not actively used
- State and localStorage handling for slider config remains but won't be used by calculators
- Can be fully removed in future cleanup

## How It Works

1. **Rate Selection**: Each calculator identifies the best rate for each column based on product fee
2. **Limit Extraction**: For each column, extract `min_rolled_months`, `max_rolled_months`, `min_defer_int`, and `max_defer_int` from the best rate object
3. **Per-Column Sliders**: Each column has its own independent slider with its own min/max limits and value
   - BTL: Each fee column (e.g., "0%", "1%", "2%") has separate sliders
   - Bridge: Each product type (Fusion, Variable Bridge, Fixed Bridge) has separate sliders
4. **State Management**: Slider values are stored per-column in state objects:
   - `rolledMonthsPerColumn` - object mapping column key to rolled months value
   - `deferredInterestPerColumn` - object mapping column key to deferred interest value
5. **Fallback Values**: If rate doesn't have limits defined, defaults to 0-24 for rolled months, 0-100 for deferred interest

## CSV Format

When importing rates via CSV, include these optional columns:
```
max_rolled_months    (or max-rolled-months)
min_rolled_months    (or min-rolled-months)  
max_defer_int        (or max-defer-int)
min_defer_int        (or min-defer-int)
```

## Rate Management UI

To edit slider limits for a rate:
1. Navigate to BTL or Bridge product management page
2. Locate the rate record to edit
3. Update the slider limit columns:
   - **Max Rolled Months**: Maximum months borrower can roll (typically 9-24)
   - **Max Defer Int**: Maximum deferred interest % (typically 0-100 for Bridge, 0-1.25 for BTL)
   - **Min Rolled Months**: Minimum months (typically 0, but can be set higher)
   - **Min Defer Int**: Minimum deferred interest % (typically 0, but Bridge may have minimum)

## Example Rate Configuration

**BTL Rate:**
```
max_rolled_months: 9
min_rolled_months: 0
max_defer_int: 1.25
min_defer_int: 0
```

**Bridge Rate:**
```
max_rolled_months: 24
min_rolled_months: 0  
max_defer_int: 100
min_defer_int: 0
```

## Testing

1. Load a calculator (BTL or Bridging)
2. Select criteria that filters to specific rates
3. Verify slider min/max values match the rate's defined limits
4. Change criteria to load different rates
5. Confirm slider limits update dynamically

## Future Enhancements

- Add UI validation to ensure min <= max when editing rates
- Consider per-column slider limits (currently uses max of all columns)
- Remove obsolete `SLIDER_CONFIG` code from Constants.jsx completely
- Add database constraints to ensure min <= max
