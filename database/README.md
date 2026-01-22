# Database Documentation

This directory contains all SQL files for database schema, migrations, and utilities for the Polaris Mortgage Calculator platform.

## 📁 Directory Structure

```
database/
├── schema/                    # Initial table creation scripts
│   ├── createQuotesTable.sql
│   ├── createBridgeQuotesTable.sql
│   └── create_bridge_results_table.sql
├── migrations/                # Sequential migration scripts (001-028)
│   ├── 001_migrate_btl_quotes.sql
│   ├── 002_migrate_bridging_quotes.sql
│   ├── ...
│   └── 028_add_ui_preferences_to_app_constants.sql
├── utilities/                 # Verification and check scripts
│   └── CHECK_MIGRATION_023.sql
├── seeds/                     # (Future) Seed data scripts
└── README.md                  # This file
```

---

## 🗄️ Database Tables

### Core Tables

#### **quotes** (BTL Quotes)
Stores Buy-to-Let mortgage calculator quotes with detailed calculation parameters.

**Created by:** `schema/createQuotesTable.sql` → `migrations/001_migrate_btl_quotes.sql` (restructured)

**Key columns:**
- `id` - UUID primary key
- `user_id` - User who created the quote
- `calculator_type` - Always 'BTL'
- `payload` - JSONB containing calculation data
- `loan_amount`, `ltv` - Quick access fields
- `status` - Quote status (draft, issued, etc.)

#### **bridge_quotes** (Bridging Quotes)
Stores bridging/fusion loan calculator quotes.

**Created by:** `schema/createBridgeQuotesTable.sql` → `migrations/002_migrate_bridging_quotes.sql` (restructured)

**Key columns:**
- Similar structure to `quotes` table
- `calculator_type` - 'Bridging' or 'Fusion'

#### **bridge_quote_results**
Stores multiple calculated rate results per bridging quote (one row per fee column/rate option).

**Created by:** `schema/create_bridge_results_table.sql`

**Key columns:**
- `quote_id` - References `bridge_quotes(id)`
- `fee_column` - Fee column identifier
- `gross_loan`, `net_loan`, `ltv_percentage` - Loan calculations
- `initial_rate`, `pay_rate`, `revert_rate`, `aprc` - Rate data
- Product fees, broker fees, interest calculations
- ERC (Early Repayment Charge) fields

#### **rates**
Stores BTL rate table data for calculations.

**Modified by:** Multiple migrations (006, 008, 021, 022, 025)

**Key columns:**
- Product details, rates, LTV tiers
- Slider limits (min/max values)
- ERC columns
- Override capabilities

#### **app_constants**
Stores application configuration and settings that can be edited at runtime.

**Modified by:** Migrations 013, 019, 028

**Key columns:**
- Broker settings
- Funding lines
- UI preferences

#### **users**
Authentication and user management table.

**Created by:** `migrations/016_create_users_and_auth.sql`

**Key columns:**
- `email`, `password_hash` - Authentication
- `access_level` - Role-based access (1=Admin, 2=UW Team Lead, 3=Head of UW, 4=Underwriter, 5=Product Team)
- `is_active` - Account status

#### **password_reset_tokens**
Secure password reset functionality.

**Created by:** `migrations/018_add_password_reset_tokens.sql`

#### **bridge_multi_property_details**
Multi-property support for bridging loans.

**Created by:** `migrations/014_create_bridge_multi_property_details.sql`

---

## 🔄 Migration Guide

### Running Migrations

Migrations **must be run in sequential order** (001, 002, 003, etc.) to ensure database consistency.

#### Using Supabase SQL Editor:

1. Open your Supabase project
2. Go to **SQL Editor** → **New Query**
3. Copy the contents of the migration file
4. Run the query
5. Verify success before proceeding to the next migration

#### Using CLI (if configured):

```bash
# Run a specific migration
psql $DATABASE_URL -f database/migrations/001_migrate_btl_quotes.sql

# Run all migrations in order
for file in database/migrations/*.sql; do
  echo "Running $file..."
  psql $DATABASE_URL -f "$file"
done
```

### Migration History

| # | File | Description | Status |
|---|------|-------------|--------|
| 001 | `migrate_btl_quotes.sql` | Restructure BTL quotes from JSONB to columns | ✅ Core |
| 002 | `migrate_bridging_quotes.sql` | Create bridging quotes table structure | ✅ Core |
| 003 | `add_reference_number.sql` | Add reference number tracking | ✅ |
| 004 | `update_borrower_fields.sql` | Enhance borrower information | ✅ |
| 005 | `add_dip_fields.sql` | Decision in Principle (DIP) support | ✅ |
| 006 | `add_rate_calculation_fields.sql` | Additional rate calculation fields | ✅ |
| 007 | `add_quote_issuance_fields.sql` | Quote issuance tracking | ✅ |
| 008 | `add_product_range.sql` | Core vs Specialist product ranges | ✅ |
| 009 | `change_lender_legal_fee_to_text.sql` | Text field for legal fees | ✅ |
| 010 | `add_performance_indexes.sql` | Database performance optimization | ✅ |
| 011 | `add_user_tracking.sql` | Track created_by/updated_by users | ✅ |
| 012 | `add_client_details_fields.sql` | Client information fields | ✅ |
| 013 | `add_broker_settings_to_app_constants.sql` | Broker configuration | ✅ |
| 014 | `create_bridge_multi_property_details.sql` | Multi-property bridging support | ✅ |
| 015 | `add_broker_company_name.sql` | Broker company name field | ✅ |
| 016 | `create_users_and_auth.sql` | User authentication system | ✅ Core |
| 017 | `fix_users_rls_policies.sql` | Row Level Security fixes | ✅ |
| 018 | `add_password_reset_tokens.sql` | Password reset functionality | ✅ |
| 019 | `add_funding_lines_to_app_constants.sql` | Funding line configuration | ✅ |
| 020 | `add_title_insurance_and_row_ordering.sql` | Title insurance + row ordering | ✅ |
| 021 | `add_min_slider_limits_to_rates.sql` | Min slider limits for rates | ✅ |
| 022 | `add_overrides_and_columns.sql` | Override functionality | ✅ |
| 023 | `add_bridge_fusion_calculation_fields.sql` | Bridge/Fusion calculation fields | ✅ |
| 024 | `add_commitment_exit_fee_fields.sql` | Commitment and exit fees | ✅ |
| 025 | `add_erc_columns_to_rates.sql` | Early Repayment Charge columns | ✅ |
| 026 | `add_erc_to_bridge_quote_results.sql` | ERC in bridge results | ✅ |
| 027 | `add_full_interest_fields.sql` | Full interest calculations | ✅ |
| 028 | `add_ui_preferences_to_app_constants.sql` | UI preferences configuration | ✅ |

---

## 🛠️ Utilities

### Verification Scripts

Located in `utilities/`:

#### **CHECK_MIGRATION_023.sql**
Verifies if migration 023 has been applied by checking for new columns.

**Usage:**
```sql
-- Run in Supabase SQL Editor
-- Returns 6 rows if migration complete, 0 rows if needs to be run
```

---

## 🌱 Seeds (Future)

The `seeds/` directory is reserved for:
- Sample data for development
- Test data fixtures
- Rate table imports (currently in `../migrations/*.csv`)

**Current seed data:**
- `../migrations/bridge_fusion_rates_full.csv` - Bridge/Fusion rates
- `../migrations/btlrates.csv` - BTL rates

See `backend/SEED_README.md` for seeding instructions.

---

## 🔒 Security & RLS (Row Level Security)

### Enabled Tables
- `users` - Users can only read/update their own data
- `quotes` - (Configured via migrations 011, 016, 017)
- `bridge_quotes` - Similar to quotes

### Service Role vs Anon Key
- **Frontend** uses `VITE_SUPABASE_ANON_KEY` - Limited access via RLS
- **Backend** uses `SUPABASE_SERVICE_ROLE_KEY` - Full access, bypasses RLS

⚠️ **Never expose service role key in frontend code**

---

## 📝 Schema Creation (Fresh Install)

For a **fresh database setup**, run in this order:

1. **Create core tables:**
   ```sql
   -- Run these first
   schema/createQuotesTable.sql
   schema/createBridgeQuotesTable.sql
   schema/create_bridge_results_table.sql
   ```

2. **Run migrations sequentially:**
   ```sql
   -- Run in order 001 → 028
   migrations/001_migrate_btl_quotes.sql
   migrations/002_migrate_bridging_quotes.sql
   ...
   migrations/028_add_ui_preferences_to_app_constants.sql
   ```

3. **Seed data:**
   ```bash
   cd backend
   npm run seed:rates
   ```

---

## 🔍 Common Tasks

### Check if a column exists
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'your_table_name'
  AND column_name = 'your_column_name';
```

### List all tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### View migration history (if using migration tracking)
```sql
SELECT * FROM schema_migrations ORDER BY version;
```

---

## 🚨 Troubleshooting

### "Column already exists" error
- Migration may have been partially run
- Check with verification queries before re-running

### "Table does not exist" error
- Ensure migrations are run in order
- Check if schema creation scripts were run first

### RLS preventing access
- Check policies with: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
- Backend should use service role key to bypass RLS

---

## 📚 Related Documentation

- **Backend seeding:** `../backend/SEED_README.md`
- **Migration guides:** `../docs/architecture/database-reporting.md`
- **Results table docs:** `../docs/improvements/results-table-migration.md`

---

## 🤝 Contributing

When creating new migrations:

1. **Number sequentially:** Use next available number (e.g., `029_description.sql`)
2. **Be descriptive:** File name should explain what it does
3. **Use transactions:** Wrap in `BEGIN;` / `COMMIT;` where appropriate
4. **Add comments:** Document purpose and any complex logic
5. **Test locally:** Run on development DB before production
6. **Update this README:** Add entry to migration history table

### Migration Template

```sql
-- Migration: Brief description
-- Purpose: Detailed explanation of what this migration does
-- Date: YYYY-MM-DD

BEGIN;

-- Your changes here
ALTER TABLE your_table ADD COLUMN new_column TYPE;

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- Add comments for documentation
COMMENT ON COLUMN table.column IS 'Description of column purpose';

COMMIT;
```

---

**Last Updated:** November 18, 2025  
**Current Migration:** 028  
**Database:** Supabase (PostgreSQL)
