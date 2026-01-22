# Results Table Migration - Summary

## Overview
Redesigned the calculated rate/fee storage to match your other project's architecture using **separate results tables** instead of adding 33 columns to the main quotes tables.

## Architecture Change

### Before (Approach 1 - Rejected)
```
quotes table: 33 new columns for ONE selected rate
bridge_quotes table: 33 new columns for ONE selected rate
```
**Problem:** Could only store one rate calculation per quote, losing all other rate options.

### After (Approach 2 - Implemented)
```
quotes table: stores quote input data
quote_results table: stores MULTIPLE calculated rates per quote (one row per rate)

bridge_quotes table: stores quote input data  
bridge_quote_results table: stores MULTIPLE calculated rates per quote (one row per rate)
```
**Benefit:** Stores ALL rate calculations, matching the UI display and your other project's pattern.

---

## Database Changes (Migration 006)

### New Tables Created

**1. `quote_results` (for BTL quotes)**
- Stores multiple rate calculation results per BTL quote
- Foreign key: `quote_id` → `quotes(id)` with CASCADE delete
- Key fields: `fee_column`, `gross_loan`, `net_loan`, `ltv_percentage`, `icr`, `initial_rate`, `pay_rate`, `product_fee_pounds`, `monthly_interest_cost`, `total_cost_to_borrower`, etc.
- 40+ calculation fields per result row
- Indexed on `quote_id` for fast lookups

**2. `bridge_quote_results` (for Bridging quotes)**
- Same structure as `quote_results` but for bridging
- Foreign key: `quote_id` → `bridge_quotes(id)` with CASCADE delete
- Additional fields: `deferred_rate`, `erc_fusion_only`
- Indexed on `quote_id`

### Key Schema Details
```sql
CREATE TABLE quote_results (
  id UUID PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  fee_column TEXT,           -- "2.00", "3.00", "6.00", etc.
  gross_loan NUMERIC,
  net_loan NUMERIC,
  ltv_percentage NUMERIC,
  icr NUMERIC,
  initial_rate NUMERIC,
  pay_rate NUMERIC,
  product_fee_pounds NUMERIC,
  monthly_interest_cost NUMERIC,
  total_cost_to_borrower NUMERIC,
  product_name TEXT,
  ... (40+ fields total)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Frontend Changes

### SaveQuoteButton.jsx
**Changed:** Instead of extracting fields from ONE `selectedRate`, now extracts ALL rates from `relevantRates` array.

**BTL Calculator:**
```javascript
// OLD: Save only selectedRate
if (calculationData.selectedRate) {
  quoteData.aprc = parseNumeric(sr.aprc);
  // ... 33 fields for ONE rate
}

// NEW: Save ALL rates as array
if (calculationData.relevantRates && Array.isArray(calculationData.relevantRates)) {
  quoteData.results = calculationData.relevantRates.map(rate => ({
    fee_column: String(rate.product_fee) || null,
    gross_loan: parseNumeric(rate.gross_loan),
    net_loan: parseNumeric(rate.net_loan),
    // ... all 40+ fields for EACH rate
  }));
}
```

**Bridging Calculator:**
- Same pattern: maps all rates from `calculationData.results` array
- Handles bridging-specific fields like `deferred_rate`, `erc_fusion_only`

### BTL_Calculator.jsx & BridgingCalculator.jsx
**No changes needed** - already passing `relevantRates` in `calculationData`

---

## Backend Changes

### routes/quotes.js

**1. POST `/api/quotes` (Create Quote)**
```javascript
// Extract results from request body
const { calculator_type, results, ...quoteData } = req.body;

// Save quote first
const { data } = await supabase.from(table).insert([dataToInsert]).select('*');
const savedQuote = data[0];

// Then save all results to results table
if (results && Array.isArray(results) && results.length > 0) {
  const resultsToInsert = results.map(result => ({
    quote_id: savedQuote.id,
    ...result
  }));
  await supabase.from(resultsTable).insert(resultsToInsert);
}
```

**2. PUT `/api/quotes/:id` (Update Quote)**
```javascript
// Delete existing results and insert new ones
await supabase.from(resultsTable).delete().eq('quote_id', id);
await supabase.from(resultsTable).insert(resultsToInsert);
```

**3. GET `/api/quotes/:id` (Fetch Quote)**
```javascript
// New query param: ?include_results=true
if (include_results === 'true') {
  const { data: resultsData } = await supabase
    .from(resultsTable)
    .select('*')
    .eq('quote_id', id);
  quote.results = resultsData;
}
```

---

## Data Flow Example

### Saving a Quote with Multiple Rates

**Frontend sends:**
```json
{
  "calculator_type": "BTL",
  "name": "John Doe Quote",
  "property_value": 1000000,
  "results": [
    {
      "fee_column": "2.00",
      "gross_loan": 750000,
      "net_loan": 684712.50,
      "ltv_percentage": 75,
      "icr": 1.25,
      "pay_rate": 6.14,
      "product_name": "2yr Fix"
    },
    {
      "fee_column": "3.00",
      "gross_loan": 750000,
      "net_loan": 683250,
      "ltv_percentage": 75,
      "icr": 1.25,
      "pay_rate": 5.76,
      "product_name": "2yr Fix"
    }
    // ... more rates
  ]
}
```

**Backend saves:**
1. One row in `quotes` table with quote ID `abc-123`
2. Multiple rows in `quote_results`:
   - Row 1: `quote_id=abc-123`, `fee_column=2.00`, `gross_loan=750000`, ...
   - Row 2: `quote_id=abc-123`, `fee_column=3.00`, `gross_loan=750000`, ...

**Frontend retrieves:**
```javascript
const response = await fetch('/api/quotes/abc-123?include_results=true');
// Returns quote with results array containing all saved calculations
```

---

## Migration Steps

### 1. Run Migration 006
**Location:** `migrations/006_add_rate_calculation_fields.sql`

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Copy entire contents of migration file
3. Execute the query
4. Verify tables created: `quote_results`, `bridge_quote_results`

### 2. Test Frontend Changes
1. Start frontend: `cd frontend; npm run dev`
2. Start backend: `cd backend; npm run dev`
3. Open a calculator (BTL or Bridging)
4. Enter data and calculate rates
5. Click "Save Quote"
6. Verify success message with reference number

### 3. Verify Data Saved
**In Supabase Dashboard:**
```sql
-- Check quote saved
SELECT * FROM quotes ORDER BY created_at DESC LIMIT 1;

-- Check results saved (replace <quote_id> with actual ID)
SELECT * FROM quote_results WHERE quote_id = '<quote_id>';
```

Should see multiple rows in `quote_results`, one for each calculated rate.

---

## Benefits of This Approach

✅ **Complete Data Preservation** - All calculated rates are saved, not just one  
✅ **Matches UI Display** - Results table structure mirrors what users see  
✅ **Historical Accuracy** - Users can see exact rate options available when quote was created  
✅ **DIP Flexibility** - When issuing DIP, user can select from ALL saved rates  
✅ **Consistency** - Matches your other project's proven architecture  
✅ **Scalability** - Easy to add new calculated fields without altering main tables  
✅ **Query Performance** - Indexed foreign keys for fast rate lookups  

---

## Next Steps

1. ✅ Run migration 006 in Supabase
2. ⏳ Test save/load flow with real quotes
3. ⏳ Update QuotesList component to optionally display saved results
4. ⏳ Update IssueDIPModal to show all saved rates for fee type selection
5. ⏳ Add API endpoint to retrieve results for comparison/reporting

---

## Comparison with Your Other Project

Your other project has:
- `cases` table (like our `quotes`)
- `case_results` table (like our `quote_results`)

Key differences:
- **Field names:** Your project uses `ltv_percentage`, `rolled_interest` - we kept similar naming
- **Fee column:** Your project stores as TEXT (e.g., "2.00", "3.00") - we do the same
- **Structure:** Both use same parent-child relationship with CASCADE delete
- **Indexing:** Both index on the foreign key (`case_id`/`quote_id`)

This redesign makes the two projects architecturally consistent! 🎉
