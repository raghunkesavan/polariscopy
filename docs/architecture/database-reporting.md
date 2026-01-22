# Database Structure Analysis for Reporting

## Current Structure Overview

### Tables
1. **`quotes`** - Main BTL quote header table (one row per quote)
2. **`quote_results`** - BTL calculation results (3-4 rows per quote, one per fee range)
3. **`bridge_quotes`** - Main Bridging quote header table
4. **`bridge_quote_results`** - Bridging calculation results

---

## `quotes` Table Structure

### Quote Header Fields
- `id` (UUID, PK)
- `reference_number` (TEXT, UNIQUE) - e.g., "MFS001234"
- `name` (TEXT) - Quote name
- `status` (TEXT) - 'draft', 'issued', etc.
- `calculator_type` (TEXT) - 'btl', 'bridging'

### Timestamps
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### User Tracking
- `created_by` (TEXT) - User name
- `created_by_id` (TEXT) - User ID
- `updated_by` (TEXT)
- `updated_by_id` (TEXT)

### Client Information
- `client_type` (TEXT) - 'Direct' or 'Broker'
- `client_first_name` (TEXT)
- `client_last_name` (TEXT)
- `client_email` (TEXT)
- `client_contact_number` (TEXT)

### Broker Information
- `broker_company_name` (TEXT)
- `broker_route` (TEXT) - 'Direct Broker', 'Mortgage club', 'Network', 'Packager'
- `broker_commission_percent` (NUMERIC)

### Borrower Information
- `borrower_type` (TEXT) - 'Personal' or 'Company'
- `borrower_name` (TEXT) - Used when borrower_type = 'Personal'
- `company_name` (TEXT) - Used when borrower_type = 'Company'
- `notes` (TEXT)

### BTL Calculation Parameters
- `product_scope` (TEXT)
- `retention_choice` (TEXT)
- `retention_ltv` (INTEGER)
- `tier` (INTEGER)
- `property_value` (NUMERIC)
- `monthly_rent` (NUMERIC)
- `top_slicing` (NUMERIC)
- `loan_calculation_requested` (TEXT) - 'Max LTV', 'Specific Net', 'Specific Gross'
- `specific_gross_loan` (NUMERIC)
- `specific_net_loan` (NUMERIC)
- `target_ltv` (INTEGER)
- `product_type` (TEXT)
- `add_fees_toggle` (BOOLEAN)
- `fee_calculation_type` (TEXT)
- `additional_fee_amount` (NUMERIC)
- `selected_range` (TEXT) - 'core' or 'specialist'
- `funding_line` (TEXT)

### DIP (Decision in Principle) Fields
- `commercial_or_main_residence` (TEXT)
- `dip_date` (DATE)
- `dip_expiry_date` (DATE)
- `dip_status` (TEXT) - 'Not Issued', 'Issued', 'Expired'
- `guarantor_name` (TEXT)
- `lender_legal_fee` (TEXT) - Changed from NUMERIC to TEXT
- `number_of_applicants` (INTEGER)
- `overpayments_percent` (NUMERIC) - Default 10
- `paying_network_club` (TEXT)
- `security_properties` (JSONB) - Array of addresses
- `fee_type_selection` (TEXT) - Selected fee percentage

### Complex Data (JSON)
- `criteria_answers` (JSONB) - Answers to eligibility questions
- `rates_and_products` (JSONB) - ⚠️ **Deprecated** - Use quote_results instead

### **NEW: Override & Manual Settings** (Migration 022)
- `rates_overrides` (JSONB) - User-edited rates by column: `{"rate_123": "5.5"}`
- `product_fee_overrides` (JSONB) - User-edited fees: `{"rate_123": "2.0"}`
- `rolled_months_per_column` (JSONB) - Manual rolled months: `{"rate_123": 6}`
- `deferred_interest_per_column` (JSONB) - Manual deferred %: `{"rate_123": 0.45}`

---

## `quote_results` Table Structure (BTL Results)

**One row per fee range** (typically 3-4 rows per quote)

### Identifiers
- `id` (UUID, PK)
- `quote_id` (UUID, FK → quotes.id) CASCADE DELETE
- `fee_column` (TEXT) - "2.00", "3.00", "4.00", "6.00"
- `product_name` (TEXT)

### Loan Calculations
- `gross_loan` (NUMERIC)
- `net_loan` (NUMERIC)
- `ltv_percentage` (NUMERIC)
- `net_ltv` (NUMERIC)
- `property_value` (NUMERIC)

### Performance Metrics
- `icr` (NUMERIC) - Interest Coverage Ratio

### Rates
- `initial_rate` (NUMERIC)
- `pay_rate` (NUMERIC)
- `revert_rate` (NUMERIC)
- `revert_rate_dd` (NUMERIC)
- `full_rate` (NUMERIC)
- `aprc` (NUMERIC)

### Fees (Comprehensive)
- `product_fee_percent` (NUMERIC)
- `product_fee_pounds` (NUMERIC)
- `admin_fee` (NUMERIC)
- `broker_client_fee` (NUMERIC) - Additional fee from UI toggle
- `broker_commission_proc_fee_percent` (NUMERIC) - Proc fee %
- `broker_commission_proc_fee_pounds` (NUMERIC) - Proc fee £
- `commitment_fee_pounds` (NUMERIC)
- `exit_fee` (NUMERIC)

### Interest Calculations
- `monthly_interest_cost` (NUMERIC)
- `rolled_months` (NUMERIC) - Months with rolled interest
- `rolled_months_interest` (NUMERIC) - Total rolled interest amount
- `deferred_interest_percent` (NUMERIC) - Deferred rate %
- `deferred_interest_pounds` (NUMERIC) - Deferred interest amount
- `serviced_interest` (NUMERIC)

### Payment Information
- `direct_debit` (TEXT) - Formatted payment schedule
- `erc` (TEXT) - Early Repayment Charge details

### Other Calculations
- `rent` (NUMERIC)
- `top_slicing` (NUMERIC)
- `nbp` (NUMERIC) - Net Borrowing Position
- `total_cost_to_borrower` (NUMERIC)
- `total_loan_term` (NUMERIC)

### Timestamps
- `created_at` (TIMESTAMPTZ)

---

## Assessment for Reporting

### ✅ **STRENGTHS** - Very Good for Reporting

1. **Proper Normalization**
   - Header data in `quotes` (one row)
   - Results in `quote_results` (3-4 rows per quote)
   - Clean one-to-many relationship with CASCADE DELETE

2. **Comprehensive Data Capture**
   - All calculation inputs saved in `quotes`
   - All calculation outputs saved in `quote_results`
   - User tracking (who created/modified)
   - Client and broker details
   - DIP workflow tracking
   - Full audit trail via timestamps

3. **Reporting-Ready Fields**
   - `reference_number` - Unique identifier for quotes
   - `status` - Track quote lifecycle
   - `dip_status` - Track DIP workflow
   - `created_by` / `created_by_id` - User performance reports
   - `broker_route` - Channel analysis
   - `client_type` - Client segmentation
   - `fee_column` - Easy to identify which fee range

4. **Good Indexing**
   - `quote_id` index on results tables (fast joins)
   - `created_by_id` index (user reports)
   - `reference_number` unique index (lookup)
   - GIN indexes on JSONB columns (JSON queries)

5. **NEW: User Edits Tracked** (Migration 022)
   - Can distinguish default vs. user-edited values
   - Manual interventions are auditable
   - Important for compliance/review workflows

---

## ⚠️ **CONSIDERATIONS** - Areas to Monitor

### 1. **Multiple Results Per Quote**
Each quote has 3-4 fee ranges. For reporting, you need to decide:

**Question:** Which fee range represents the "selected" or "best" quote?

**Options:**
- Add a `is_selected` boolean flag to `quote_results`
- Add a `selected_fee_column` TEXT field to `quotes` table
- Always report all fee ranges and let BI tool filter
- Use the first row (lowest fee) as default

**Recommendation:**
```sql
-- Option A: Add to quote_results table
ALTER TABLE quote_results ADD COLUMN is_selected BOOLEAN DEFAULT FALSE;

-- Option B: Add to quotes table (simpler)
ALTER TABLE quotes ADD COLUMN selected_fee_column TEXT;
```

### 2. **JSON Data (criteria_answers)**
- Stored as JSONB (good for flexibility)
- Questions/answers vary by product
- Harder to report on without unpacking

**Recommendation for Reporting:**
```sql
-- Example: Extract specific criteria for reports
SELECT 
  q.reference_number,
  q.criteria_answers->>'adverse_credit' AS adverse_credit,
  q.criteria_answers->>'credit_score' AS credit_score
FROM quotes q;
```

### 3. **Security Properties (JSONB Array)**
Multiple properties per quote are in JSON array.

**Recommendation:**
Create a materialized view or separate table:
```sql
CREATE TABLE quote_security_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  property_address TEXT,
  property_postcode TEXT,
  property_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. **Fee Type Selection Ambiguity**
`fee_type_selection` can be:
- Fee percentage for BTL (e.g., "2.00%")
- Product type for Bridging (e.g., "Fusion")

**Recommendation:** Consider splitting:
```sql
ALTER TABLE quotes ADD COLUMN selected_product_type TEXT; -- For Bridge
-- Use fee_type_selection only for BTL fee %
```

### 5. **Updated_by Not Populated**
- `updated_by` and `updated_by_id` exist but may not be set
- Only `created_by` is reliably populated

**Recommendation:** Add trigger or update application code:
```sql
CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Set updated_by if available in application context
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 **REPORTING QUERIES** - Examples

### 1. Quote Volume Report
```sql
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  calculator_type,
  COUNT(*) AS quote_count,
  COUNT(CASE WHEN status = 'issued' THEN 1 END) AS issued_count,
  COUNT(CASE WHEN dip_status = 'Issued' THEN 1 END) AS dip_count
FROM quotes
WHERE created_at >= '2024-01-01'
GROUP BY month, calculator_type
ORDER BY month DESC;
```

### 2. User Performance Report
```sql
SELECT 
  created_by,
  COUNT(*) AS total_quotes,
  COUNT(CASE WHEN dip_status = 'Issued' THEN 1 END) AS dips_issued,
  AVG(CASE WHEN qr.gross_loan IS NOT NULL THEN qr.gross_loan END) AS avg_loan_size
FROM quotes q
LEFT JOIN quote_results qr ON q.id = qr.quote_id
WHERE q.created_at >= NOW() - INTERVAL '30 days'
GROUP BY created_by
ORDER BY total_quotes DESC;
```

### 3. Broker Channel Analysis
```sql
SELECT 
  broker_route,
  COUNT(DISTINCT q.id) AS quote_count,
  SUM(qr.gross_loan) AS total_loan_volume,
  AVG(qr.gross_loan) AS avg_loan_size,
  AVG(qr.initial_rate) AS avg_rate
FROM quotes q
JOIN quote_results qr ON q.id = qr.quote_id
WHERE q.client_type = 'Broker'
  AND q.created_at >= NOW() - INTERVAL '90 days'
GROUP BY broker_route;
```

### 4. Product Mix Report
```sql
SELECT 
  q.product_type,
  q.selected_range,
  qr.fee_column,
  COUNT(*) AS result_count,
  AVG(qr.gross_loan) AS avg_gross_loan,
  AVG(qr.ltv_percentage) AS avg_ltv,
  AVG(qr.icr) AS avg_icr
FROM quotes q
JOIN quote_results qr ON q.id = qr.quote_id
WHERE q.calculator_type = 'btl'
GROUP BY q.product_type, q.selected_range, qr.fee_column
ORDER BY result_count DESC;
```

### 5. DIP Pipeline Report
```sql
SELECT 
  dip_status,
  COUNT(*) AS count,
  COUNT(CASE WHEN dip_expiry_date < CURRENT_DATE THEN 1 END) AS expired_count,
  COUNT(CASE WHEN dip_expiry_date >= CURRENT_DATE THEN 1 END) AS active_count
FROM quotes
WHERE dip_status IS NOT NULL
GROUP BY dip_status;
```

### 6. User Edits Audit Report (NEW)
```sql
SELECT 
  q.reference_number,
  q.created_by,
  CASE 
    WHEN q.rates_overrides IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END AS rates_edited,
  CASE 
    WHEN q.product_fee_overrides IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END AS fees_edited,
  q.created_at
FROM quotes q
WHERE q.rates_overrides IS NOT NULL 
   OR q.product_fee_overrides IS NOT NULL
ORDER BY q.created_at DESC;
```

---

## 📊 **RECOMMENDATIONS FOR ENHANCED REPORTING**

### Priority 1: Add Selection Tracking
```sql
-- Track which fee range was selected by user
ALTER TABLE quotes ADD COLUMN selected_fee_column TEXT;

-- Or mark selected result
ALTER TABLE quote_results ADD COLUMN is_selected BOOLEAN DEFAULT FALSE;
```

### Priority 2: Add Conversion Tracking
```sql
-- Track quote → DIP → completion funnel
ALTER TABLE quotes ADD COLUMN converted_to_dip_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN converted_to_completion_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN completion_amount NUMERIC;
```

### Priority 3: Create Reporting Views
```sql
-- Simplified view for BI tools
CREATE OR REPLACE VIEW v_quotes_summary AS
SELECT 
  q.id,
  q.reference_number,
  q.name,
  q.calculator_type,
  q.status,
  q.created_at,
  q.created_by,
  q.client_type,
  q.broker_route,
  q.dip_status,
  -- Get first (lowest fee) result as representative
  (SELECT qr.gross_loan FROM quote_results qr 
   WHERE qr.quote_id = q.id ORDER BY qr.fee_column LIMIT 1) AS gross_loan,
  (SELECT qr.ltv_percentage FROM quote_results qr 
   WHERE qr.quote_id = q.id ORDER BY qr.fee_column LIMIT 1) AS ltv,
  (SELECT qr.initial_rate FROM quote_results qr 
   WHERE qr.quote_id = q.id ORDER BY qr.fee_column LIMIT 1) AS initial_rate,
  (SELECT COUNT(*) FROM quote_results qr 
   WHERE qr.quote_id = q.id) AS result_count
FROM quotes q;
```

### Priority 4: Performance Indexes
```sql
-- Add indexes for common reporting queries
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_dip_status ON quotes(dip_status);
CREATE INDEX idx_quotes_calculator_type ON quotes(calculator_type);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_broker_route ON quotes(broker_route);
CREATE INDEX idx_quote_results_fee_column ON quote_results(fee_column);
```

---

## ✅ **CONCLUSION**

Your current database structure is **VERY GOOD for reporting** with a few minor enhancements needed:

### What Works Well
✅ Proper normalization (header + results)  
✅ Comprehensive field coverage  
✅ Good indexing strategy  
✅ Audit trail (user tracking, timestamps)  
✅ Flexible JSON for variable criteria  
✅ CASCADE DELETE maintains referential integrity  
✅ **NEW:** User edits are now tracked (migration 022)

### What to Add
🔧 Selection tracking (which fee range was chosen)  
🔧 Conversion funnel tracking (quote → DIP → completion)  
🔧 Reporting views for simplified BI tool access  
🔧 Additional indexes on frequently queried fields  
🔧 Consider unpacking security_properties to separate table

### Reporting Capability: 9/10
The structure supports nearly all standard reporting needs. The one-to-many relationship with `quote_results` is the correct approach for handling multiple fee ranges per quote.
