# Export Feature Documentation

## Overview
Added export functionality to export all quotes data to CSV format, including results from the results tables.

## How It Works

### Data Structure
Each quote can have multiple rate calculation results. The export handles this by creating **one CSV row per result**, with the quote information repeated on each row.

### CSV Row Structure
- **Quote columns**: reference_number, quote_name, calculator_type, status, loan_amount, ltv, borrower info, dates
- **Result tracking**: result_number (1, 2, 3...), total_results (how many results for this quote)
- **Result columns**: All fields from quote_results or bridge_quote_results tables

### Example
If Quote "ABC123" has 3 results, the CSV will contain:
```
Row 1: ABC123 data + result_number=1 + first result data
Row 2: ABC123 data + result_number=2 + second result data  
Row 3: ABC123 data + result_number=3 + third result data
```

Quotes without results will have one row with result_number=0 and total_results=0.

## Backend Implementation

### New Route: `/api/export/quotes`
**File**: `backend/routes/export.js`

**Query Parameters**:
- `calculator_type` (optional): Filter by 'BTL' or 'BRIDGING'. If omitted, exports all quotes.

**Process**:
1. Fetches quotes from `quotes` and/or `bridge_quotes` tables
2. For each quote, fetches results from `quote_results` or `bridge_quote_results`
3. Creates one row per result (or one row for quotes without results)
4. Returns JSON array of flattened data

**Fields Exported**:

#### Quote Fields
- reference_number
- quote_name
- calculator_type
- status
- loan_amount
- ltv
- borrower_type
- borrower_name
- company_name
- created_at
- updated_at

#### Result Tracking
- result_number (1-based index of this result)
- total_results (total number of results for this quote)

#### BTL Result Fields
- fee_column, product_name
- gross_loan, net_loan, ltv_percentage, net_ltv, property_value
- icr
- initial_rate, pay_rate, revert_rate, revert_rate_dd, full_rate, aprc
- product_fee_percent, product_fee_pounds, admin_fee
- broker_client_fee, broker_commission_proc_fee_percent, broker_commission_proc_fee_pounds
- commitment_fee_pounds, exit_fee
- monthly_interest_cost, rolled_months, rolled_months_interest
- deferred_interest_percent, deferred_interest_pounds, serviced_interest
- direct_debit, erc
- rent, top_slicing, nbp, total_cost_to_borrower, total_loan_term

#### Bridge-Specific Additional Fields
- deferred_rate
- erc_fusion_only

## Frontend Implementation

### Export Button
**Location**: `frontend/src/components/QuotesList.jsx`

**Features**:
- Button with download icon at top-right of quotes list
- Shows "Exporting..." state while processing
- Respects current calculator_type filter (BTL/BRIDGING/All)
- Generates timestamped filename: `quotes_export_{type}_{timestamp}.csv`

### CSV Generation
- Converts JSON to CSV format
- Properly escapes values with commas, quotes, or newlines
- Handles null/undefined values as empty strings
- Uses all columns from first data row as headers

### User Notifications
- Success: Shows count of exported rows
- Warning: No data to export
- Error: Displays error message

## Usage

### From Quotes Page
1. Navigate to Quotes list (BTL, Bridging, or All)
2. Apply filters if desired (name, type, dates, etc.)
3. Click "Export to CSV" button at top-right
4. CSV file downloads automatically with all matching quotes and their results

### Data Analysis
The exported CSV can be opened in Excel, Google Sheets, or any spreadsheet software:
- **Filter by result_number=1** to see only the first result for each quote
- **Pivot on reference_number** to analyze multiple results per quote
- **Filter total_results > 1** to find quotes with multiple rate options

## File Locations

### Backend
- Route: `backend/routes/export.js` (NEW)
- Server config: `backend/server.js` (MODIFIED - added export route)

### Frontend
- Component: `frontend/src/components/QuotesList.jsx` (MODIFIED - added export functionality)

## Testing

### Start Backend (if not running)
```powershell
cd backend
$env:SUPABASE_URL = 'your-url'
$env:SUPABASE_SERVICE_ROLE_KEY = 'your-key'
$env:PORT = '3001'
npm run dev
```

### Test Export
1. Open frontend (http://localhost:3000)
2. Navigate to Quotes page
3. Create some test quotes with results
4. Click "Export to CSV"
5. Open downloaded CSV to verify data

### API Testing (Direct)
```powershell
# Export all quotes
curl http://localhost:3001/api/export/quotes

# Export BTL only
curl http://localhost:3001/api/export/quotes?calculator_type=BTL

# Export Bridging only
curl http://localhost:3001/api/export/quotes?calculator_type=BRIDGING
```

## Notes

- Export includes ALL quotes matching the filter, not just the current page
- Results are ordered by quote created_at (newest first)
- Each result row repeats the quote information for easy analysis
- Empty/null values appear as blank cells in the CSV
- Timestamps are in ISO format (can be formatted in Excel)
