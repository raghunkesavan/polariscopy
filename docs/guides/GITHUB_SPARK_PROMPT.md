# GitHub Spark Prompt: Mortgage Calculator Platform

Create a comprehensive mortgage calculation platform with the following specifications:

---

## 🏗️ **CORE APPLICATION STRUCTURE**

### Technology Stack
- **Frontend**: React 18.2 with Vite 5.0, React Router 6.30
- **Backend**: Node.js 20+ with Express 4
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Salesforce Lightning Design System (SLDS) + SCSS
- **Testing**: Vitest + React Testing Library
- **Authentication**: Supabase Auth with JWT tokens

### Project Architecture
```
Frontend:
├── src/components/        # React components
├── src/contexts/          # React Context providers (Auth, Supabase, Toast)
├── src/hooks/             # Custom React hooks
├── src/utils/             # Calculation engines & utilities
├── src/pages/             # Page-level components
├── src/styles/            # SCSS stylesheets
└── src/config/            # App configuration & constants

Backend:
├── routes/                # Express API routes
├── middleware/            # Auth, rate limiting, validation
├── utils/                 # Helper functions
├── config/                # Configuration
└── scripts/               # Database seed scripts
```

---

## 💼 **CALCULATOR 1: BTL (BUY-TO-LET) CALCULATOR**

### Core Functionality

#### Input Fields
1. **Client Details Section** (Collapsible, default: expanded)
   - Client Type: Direct / Broker (toggle switch)
   - Client First Name (text input)
   - Client Last Name (text input)
   - Client Email (email input)
   - Client Contact Number (tel input)
   - If Broker selected:
     - Broker Company Name
     - Broker Route (dropdown): Direct Broker, Mortgage Club, Network, Packager
     - Broker Commission % (0-100%, default: 0.75%)
     - Add Additional Fees toggle
     - Fee Calculation Type: Pound / Percentage
     - Additional Fee Amount (number input)

2. **Criteria Section** (Collapsible, default: collapsed)
   - Dynamic criteria questions loaded from database (criteria_config_flat table)
   - Questions displayed in 4-column grid (responsive)
   - Each question has dropdown with options
   - Info tooltips for helper text
   - Answers used to calculate "Tier" (1-5 based on scoring)

3. **Loan Details Section** (Collapsible, default: collapsed)
   - Property Value (£, formatted with thousand separators)
   - Monthly Rent (£, formatted)
   - Top Slicing (£, formatted)
   - Product Scope (dropdown): Whole Market, Select Panel, etc.
   - Retention Choice: Yes / No
   - If Yes: Retention LTV dropdown (65% / 75%)
   - Loan Calculation Type (dropdown):
     - Max Optimum Gross Loan
     - Specific Net Loan
     - Maximum LTV Loan
     - Specific Gross Loan
   - If Specific Net/Gross: Specific amount input field (£)
   - Product Type (dropdown): 2yr Fix, 3yr Fix, 2yr Tracker, etc. (loaded from constants)
   - Max LTV slider (0-75%, step 0.1%, real-time calculation)

4. **Range Toggle** (After loan details)
   - Two buttons: Core Range / Specialist Range
   - Filters results to show only selected range
   - Core rates typically have lower rates but stricter criteria

### Calculation Engine Logic

**BTL Calculation Engine** (`btlCalculationEngine.js`):

```javascript
Inputs:
- propertyValue: number
- monthlyRent: number
- topSlicing: number
- loanType: string (maxGross, specificNet, maxLtv, specificGross)
- specificAmount: number (if applicable)
- targetLtv: number (for maxLtv type)
- rate: object (from rates table)
- productFee: number (percentage)
- brokerSettings: object

Calculations:
1. Determine Gross Loan based on loan type:
   - Max Optimum Gross: Calculate optimal loan meeting ICR 125% & 145%
   - Specific Net: Reverse calculate from net loan
   - Max LTV: propertyValue * (targetLtv / 100)
   - Specific Gross: Use specified amount

2. Calculate Net Loan:
   netLoan = grossLoan - (grossLoan * productFee / 100)

3. Calculate LTV:
   ltv = (grossLoan / propertyValue) * 100
   netLTV = (netLoan / propertyValue) * 100

4. Calculate Monthly Interest:
   monthlyRate = (annualRate / 12) / 100
   monthlyInterest = netLoan * monthlyRate

5. Calculate ICR (Interest Coverage Ratio):
   totalIncome = monthlyRent + topSlicing
   icr = (totalIncome / monthlyInterest) * 100

6. Calculate Pay Rate, Revert Rate:
   - Pay rate: Initial promotional rate for fixed period
   - Revert rate: Standard variable rate after promo ends
   - Revert DD: Monthly payment at revert rate

7. Calculate APRC (Annual Percentage Rate of Charge):
   - Includes all fees, rates, and costs over loan term
   - Formula accounts for time value of money

8. Calculate Fees:
   - Product Fee (% of gross): productFeePounds = grossLoan * (productFee / 100)
   - Admin Fee: Fixed £X (from constants)
   - Broker Proc Fee: Gross * brokerCommission%
   - Broker Client Fee: From broker settings if "Add Fees" enabled
   - Title Insurance: Calculated based on loan amount tiers

9. Calculate Interest Breakdown:
   - Rolled Months Interest: Interest for rolled period (slider-controlled)
   - Deferred Interest: Interest deferred (slider-controlled)
   - Serviced Interest: (totalTerm - rolled - deferred) * monthlyInterest
   - Total Interest: Sum of all interest components

10. Calculate Total Cost:
    - NBP (Net Proceeds to Borrower): netLoan - allFees
    - Total Amount Repayable: grossLoan + totalInterest + exitFees
    - Total Cost to Borrower: All fees + total interest

Output object with ~40 fields including all metrics above
```

**Rate Filtering Logic**:
- Filter rates by: productScope, tier, productType, selectedRange (core/specialist)
- Match rate.min_ltv <= calculated LTV <= rate.max_ltv
- Match rate.tier === calculatedTier
- Match rate.product_scope === selectedScope
- Sort by rate ascending, pick best match per fee column

### Results Display

**Results Table** (4-column layout):
- Column Headers: Label | Fee 6% | Fee 4% | Fee 3% | Fee 2% (or custom fee columns)
- For each fee column, pick best rate matching criteria

**Interactive Rows**:
1. **Editable Rate Row**: Click to edit rate, shows original vs edited
2. **Editable Product Fee Row**: Click to edit fee %, shows original vs edited  
3. **Rolled Months Slider**: 0-24 months, per-column control
4. **Deferred Interest Slider**: 0-2% (Fusion only), per-column control

**Display Rows** (40+ metrics):
- Gross Loan (£)
- Net Loan (£)
- LTV (%)
- Net LTV (%)
- ICR (%)
- Initial Rate (%)
- Pay Rate (%)
- Revert Rate (%)
- Revert Rate DD (£)
- Full Rate (text with % + BBR if applicable)
- APRC (%)
- Product Fee % (%)
- Product Fee £ (£)
- Admin Fee (£)
- Broker Client Fee (£)
- Broker Commission Proc Fee % (%)
- Broker Commission Proc Fee £ (£)
- Commitment Fee £ (£)
- Exit Fee (£)
- ERC 1 £ (£)
- ERC 2 £ (£)
- Monthly Interest Cost (£)
- Rolled Months (X months)
- Rolled Months Interest (£)
- Deferred Interest % (%)
- Deferred Interest £ (£)
- Serviced Interest (£)
- Direct Debit (£) - with "from month X" notation
- Total Interest (£)
- Title Insurance Cost (£)
- Rent (£)
- Top Slicing (£)
- NBP (Net Proceeds to Borrower) (£)
- Total Cost to Borrower (£)
- Total Loan Term (X months)
- Total Amount Repayable (£)

**Row Visibility & Ordering**:
- Each row can be toggled visible/hidden via admin settings
- Custom row ordering via drag-and-drop admin UI
- Settings stored in localStorage + database (app_constants table)

### Actions

**Save Quote Button**:
- Opens modal to collect:
  - Quote Name (required)
  - Created By (auto-filled from logged-in user)
  - Borrower Type: Personal / Company
  - Borrower Name or Company Name
  - Product Range to Save: Core / Specialist
  - Notes (textarea)
- Generates unique Reference Number (format: BTL-YYYY-MM-DD-XXXX)
- Saves to `btl_quotes` table with all inputs + calculated results
- Saves each fee column result to `quote_results` table
- Update mode if quote already exists

**Issue DIP Button** (after quote saved):
- Opens modal to collect:
  - Fee Type Selection: Dropdown of available fee columns
  - Commercial or Main Residence: dropdown
  - Number of Applicants: number input
  - DIP Date: date picker
  - DIP Expiry Date: date picker (default: +6 months)
  - Guarantor Name: text input
  - Security Properties: textarea
  - Overpayments %: number input
  - Lender Legal Fee: £ input
  - Paying Network/Club: Yes/No
  - Funding Line: dropdown (loaded from constants)
  - DIP Status: Draft / Issued / Expired
- Generate PDF button: Creates professional DIP document
- Saves data to quote record

**Issue Quote Button** (after quote saved):
- Opens modal to collect:
  - Fee Range Selection: dropdown
  - All fields from DIP modal +
  - Quote Issuance Date
  - Quote Expiry Date
  - Additional Terms (textarea)
- Generate PDF button: Creates professional quote document
- Saves data to quote record

---

## 🌉 **CALCULATOR 2: BRIDGING & FUSION CALCULATOR**

### Core Functionality

#### Input Fields

1. **Client Details Section** (same as BTL)

2. **Criteria Section** (Collapsible, default: collapsed)
   - Similar to BTL but with bridging-specific questions
   - Charge Type question: First / Second / All
   - Multi-property question: Yes / No
   - Sub-product questions dynamically shown

3. **Multi-Property Details Section** (shown only if Multi-property = Yes)
   - Table with rows (add/delete rows)
   - Columns per row:
     - Property Address (text input)
     - Property Type: Residential / Commercial / Semi-Commercial
     - Property Value (£)
     - Charge Type: First charge / Second charge
     - First Charge Amount (£, only if Second charge)
     - Gross Loan (£, calculated: PV * maxLTV - firstCharge)
   - Totals row at bottom (sum of all properties)
   - "Use Total Gross Loan" button to populate main loan field

4. **Loan Details Section** (Collapsible, default: collapsed)
   - Property Value (£)
   - Gross Loan (£)
   - Charge Type: First / Second / All (can be set by criteria)
   - If Second: First Charge Value (£, required)
   - Monthly Rent (£, optional)
   - Top Slicing (£, optional)
   - Use Specific Net Loan: Yes / No
   - If Yes: Specific Net Loan (£)
   - Term (months): slider (dynamic range based on available rates, typically 3-18)
   - Commitment Fee (£, optional)
   - Exit Fee %: default 1%
   - Sub-product (dropdown, auto-populated from rates)

### Calculation Engine Logic

**Bridge & Fusion Calculation Engine** (`bridgeFusionCalculationEngine.js`):

```javascript
Inputs:
- propertyValue: number
- grossLoan: number
- firstChargeValue: number (for second charge)
- monthlyRent: number
- topSlicing: number
- useSpecificNet: boolean
- specificNetLoan: number
- termMonths: number
- commitmentFee: number
- exitFeePercent: number (default 1%)
- chargeType: 'First' | 'Second' | 'All'
- rate: object (from bridge_fusion_rates_full table)
- brokerSettings: object
- rolledMonthsOverride: number
- deferredRateOverride: number

Product Types:
1. Fusion (24-month term, special calculation)
2. Variable Bridge (monthly margin + BBR)
3. Fixed Bridge (monthly coupon rate)

Calculations:

1. Determine Exposure & LTV:
   For First Charge:
     exposure = grossLoan
     ltv = (grossLoan / propertyValue) * 100
   
   For Second Charge:
     exposure = grossLoan + firstChargeValue
     ltv = (exposure / propertyValue) * 100
     combinedLTV = ltv
     
   Apply LTV caps:
     - Check rate.max_ltv
     - If ltv > max_ltv: cap grossLoan to meet max_ltv
     - Recalculate all downstream values

2. Match Rate Bucket:
   - For Bridge: Match by LTV bucket (min_ltv to max_ltv)
   - For Fusion: Match by Loan Size bucket (min_loan to max_loan)
   - Select tier based on criteria answers

3. Calculate Net Loan:
   productFeePercent = rate.product_fee (or override)
   productFeePounds = grossLoan * (productFeePercent / 100)
   netLoan = grossLoan - productFeePounds
   netLTV = (netLoan / propertyValue) * 100

4. Apply Specific Net Logic (if enabled):
   If useSpecificNet && specificNetLoan provided:
     Work backwards: grossLoan = specificNetLoan / (1 - productFee/100)
     Recalculate all dependent values

5. Calculate Rate Components:
   BBR (Bank Base Rate) = 4% annual (from constants)
   
   For Fusion:
     marginAnnual = rate.rate (e.g. 2.5%)
     fullAnnualRate = marginAnnual + BBR
     couponMonthly = marginAnnual / 12
     bbrMonthly = BBR / 12
     
   For Variable Bridge:
     marginMonthly = rate.rate (e.g. 0.5%)
     fullMonthlyRate = marginMonthly + (BBR / 12)
     fullAnnualRate = fullMonthlyRate * 12
     
   For Fixed Bridge:
     couponMonthly = rate.rate (e.g. 0.6%)
     fullAnnualRate = couponMonthly * 12

6. Calculate Interest Components:
   
   Rolled Interest (Interest added to loan):
     rolledMonths = rate.min_rolled_months to rate.max_rolled_months (slider)
     For Fusion: 
       rolledIntCoupon = netLoan * couponMonthly * rolledMonths
       rolledIntBBR = netLoan * bbrMonthly * rolledMonths
       rolledInterest = rolledIntCoupon + rolledIntBBR
     For Bridge:
       rolledInterest = netLoan * fullMonthlyRate * rolledMonths
   
   Deferred Interest (Interest deferred, not added to loan):
     deferredRate = 0 to rate.max_defer_int (slider, Fusion only)
     payRate = marginAnnual - deferredRate
     deferredInterestAnnual = netLoan * (deferredRate / 100)
     For Fusion 24-month term: deferredInterest = deferredInterestAnnual * 2
   
   Serviced Interest (Interest paid monthly):
     servicedMonths = termMonths - rolledMonths
     monthlyPayment = netLoan * (payRate / 100) / 12
     servicedInterest = monthlyPayment * servicedMonths
   
   Total Interest = rolledInterest + deferredInterest + servicedInterest

7. Calculate Fees:
   - Product Fee: productFeePounds (from step 3)
   - Admin Fee: Fixed amount from rate
   - Broker Proc Fee: (grossLoan + rolledInterest) * brokerCommission%
   - Broker Client Fee: From broker settings
   - Commitment Fee: commitmentFeePounds (input)
   - Exit Fee: grossLoan * (exitFeePercent / 100)
   - Title Insurance: Based on loan tiers
   
   For Fusion only:
   - ERC 1 (Early Repayment Charge Year 1): grossLoan * 2%
   - ERC 2 (Early Repayment Charge Year 2): grossLoan * 1%

8. Calculate ICR (if rent provided):
   totalIncome = monthlyRent + topSlicing
   icr = (totalIncome / monthlyPayment) * 100

9. Calculate APRC:
   totalCost = totalInterest + allFees
   termYears = termMonths / 12
   aprcAnnual = (totalCost / netLoan) / termYears * 100
   aprcMonthly = aprcAnnual / 12

10. Calculate Final Metrics:
    NBP = netLoan - productFee - adminFee - brokerFees - commitmentFee
    totalAmountRepayable = grossLoan + totalInterest + exitFee
    directDebit = monthlyPayment (starts from month rolledMonths + 1)

Output object with ~50 fields for each product type (Fusion, Variable, Fixed)
```

**Rate Filtering**:
- For Bridge products:
  - Filter by charge type (First/Second/All)
  - Filter by sub-product (if selected)
  - Match LTV bucket: min_ltv <= ltv <= max_ltv
  - Special handling for second charge: use combined LTV
  
- For Fusion products:
  - Filter by loan size: min_loan <= netLoan <= max_loan
  - LTV checked but capped (can show results with warning)

### Results Display

**Results Table** (4-column layout):
- Column Headers: Label | Fusion | Variable Bridge | Fixed Bridge

**Interactive Rows**:
1. **Editable Rates Row**: 
   - Fusion: shows "X.XX% + BBR" (annual margin)
   - Variable: shows "X.XX% + BBR" (monthly margin)
   - Fixed: shows "X.XX%" (monthly coupon)
   - Click to edit, maintains suffix format

2. **Editable Product Fee Row**: Edit fee % per column

3. **Rolled Months Slider**: 
   - Fusion: 0-24 months (independent 24-month term)
   - Bridge: 0 to loan term months (capped by term input)

4. **Deferred Interest % Slider**:
   - Fusion only: 0 to rate.max_defer_int (typically 2%)
   - Bridge: Disabled (N/A)

**Display Rows** (50+ metrics):
- All BTL rows +
- Second Charge Cap Gross (£) - if second charge
- Second Charge Cap Applied (Yes/No)
- Net Target Met (Yes/No) - if specific net used
- Net Clipped by Cap (Yes/No)
- Bridge Primary Cap Gross (£)
- Bridge Primary Cap Applied (Yes/No)
- Fusion Cap Gross (£)
- Fusion Cap Applied (Yes/No)
- Combined LTV (%) - for second charge
- Margin Monthly (%)
- BBR Monthly (%)
- Full Coupon Rate Monthly (%)
- Rolled Int Coupon £ (£)
- Rolled Int BBR £ (£)
- Full Int Coupon £ (£)
- Full Int BBR £ (£)
- Serviced Months (X months)
- Deferred Rate (%)
- Product Name (Fusion/Variable Bridge/Fixed Bridge)
- Tier Name (from rate)

**Row Visibility & Ordering**: Same as BTL

### Actions

**Save Quote**, **Issue DIP**, **Issue Quote**: Same structure as BTL but saves to:
- `bridging_quotes` table
- `bridge_quote_results` table
- `bridge_multi_property_details` table (if multi-property)

---

## 👤 **USER MANAGEMENT SYSTEM**

### Authentication
- Login page with email/password
- Supabase Auth integration
- JWT token stored in localStorage
- Automatic token refresh
- Logout functionality

### User Roles & Permissions
```javascript
Roles (access_level):
1. Admin (level 1):
   - Full access to everything
   - Can manage users, rates, criteria, settings
   - Can edit all calculators
   - Can view all quotes

2. Manager (level 2):
   - Can manage rates and criteria
   - Can edit calculators
   - Can view all quotes
   - Cannot manage users

3. User (level 3):
   - Can use calculators
   - Can save/view own quotes
   - Cannot edit rates or criteria

4. Underwriter (level 4):
   - Read-only access to calculators
   - Can view quotes
   - Cannot edit anything
```

### User Profile
- View/Edit: Name, Email, Contact
- Change Password
- View Role and Access Level
- Dark Mode toggle
- Keyboard Shortcuts toggle
- UI Preferences

---

## 📊 **ADMIN FEATURES**

### 1. Rates Management

**BTL Rates Table** (`rates` table):
```
Columns:
- id (UUID, primary key)
- lender (text)
- product_scope (text): Whole Market, Select Panel, etc.
- product_range (text): Core, Specialist
- product_type (text): 2yr Fix, 3yr Fix, etc.
- tier (integer): 1-5
- min_ltv (decimal): e.g. 50.00
- max_ltv (decimal): e.g. 75.00
- rate (decimal): Annual percentage rate
- product_fee (decimal): Percentage
- pay_rate (decimal): Initial rate
- revert_rate (decimal): SVR rate
- erc_1 (decimal): Early repayment charge year 1
- erc_2 (decimal): Early repayment charge year 2
- min_loan (decimal): Minimum loan amount
- max_loan (decimal): Maximum loan amount
- admin_fee (decimal): Fixed admin fee
- incentives (text): Cash back, free valuation, etc.
- notes (text): Additional info
- active (boolean): Is rate currently available
- created_at, updated_at (timestamps)
```

**Bridging Rates Table** (`bridge_fusion_rates_full` table):
```
Columns: Similar to BTL rates +
- set_key (text): 'Fusion', 'Bridging_Fix', 'Bridging_Var'
- product (text): Sub-product name
- charge_type (text): First, Second
- property_type (text): Residential, Commercial, Semi-Commercial
- min_term (integer): Minimum term in months
- max_term (integer): Maximum term in months
- min_rolled_months (integer): Min months interest can be rolled
- max_rolled_months (integer): Max months interest can be rolled
- max_defer_int (decimal): Max deferred interest % (Fusion)
- commitment_fee_percent (decimal)
- exit_fee_percent (decimal)
```

**Admin UI for Rates**:
- Searchable, sortable table with pagination
- Inline editing (click to edit cells)
- Bulk import from CSV
- Bulk actions (activate/deactivate, delete)
- Filter by: lender, product scope, tier, active status
- Duplicate rate to create new variant
- Validation: LTV ranges, rate values, tier numbers

### 2. Criteria Management

**Criteria Table** (`criteria_config_flat` table):
```
Columns:
- id (UUID)
- product_scope (text)
- criteria_set (text): BTL, Bridging
- question_group (text): Grouping for related questions
- question_key (text): Unique identifier
- question_label (text): Display text
- question_type (text): dropdown, checkbox, etc.
- option_label (text): Option text
- option_value (text): Option value
- display_order (integer): Sort order
- tier_influence (integer): How much this affects tier (-2 to +2)
- info_tip (text): Tooltip help text
- helper (text): Additional guidance
- active (boolean)
```

**Admin UI for Criteria**:
- Grouped view by question
- Add/Edit/Delete questions
- Add/Edit/Delete options per question
- Drag-and-drop reordering
- Set tier influence per option
- Preview how criteria affects tier calculation
- Bulk import/export

### 3. Global Settings / Constants

**App Constants Table** (`app_constants` table):
```
Columns:
- key (text, primary key): Unique constant name
- value (jsonb): JSON value
- description (text): What this constant controls
- category (text): Group constants (rates, fees, products, etc.)
- updated_at (timestamp)
- updated_by (UUID, foreign key to users)

OR structured columns:
- product_lists (jsonb): Product types per property type
- fee_columns (jsonb): Fee columns per product range
- market_rates (jsonb): BBR, standard rates
- broker_routes (jsonb): Available broker route options
- funding_lines (jsonb): Funding line options for DIP
```

**Admin UI - Constants Page**:
- Tabbed interface:
  - **Products Tab**: Edit product lists per property type
  - **Fees Tab**: Edit fee columns per range/property
  - **Market Rates Tab**: Edit BBR, standard rates
  - **Broker Settings Tab**: Edit routes, default commission
  - **Funding Lines Tab**: Manage funding line options
  - **Results Display Tab**: Toggle row visibility, reorder rows
- Each setting has:
  - Description tooltip
  - Current value (editable)
  - Default/Reset button
  - Last updated by/date
- Save button with confirmation
- Persist to both localStorage and database
- Emit storage event to refresh all open calculator tabs

### 4. Broker Settings

**Per-Quote Broker Settings** (attached to each quote):
- Stored in quote record itself
- Overrides global defaults if quote loaded

**Global Defaults** (in app_constants):
```javascript
{
  brokerRoutes: [
    'Direct Broker',
    'Mortgage Club', 
    'Network',
    'Packager'
  ],
  defaultBrokerRoute: 'Direct Broker',
  defaultBrokerCommission: 0.75,
  minBrokerCommission: 0,
  maxBrokerCommission: 100
}
```

### 5. Results Table Customization

**Visibility Settings** (per calculator type: btl, bridge):
```javascript
{
  visibleRows: {
    'Gross Loan': true,
    'Net Loan': true,
    'LTV': true,
    'ICR': false, // hidden by default
    // ... all 50+ rows
  }
}
```

**Ordering Settings**:
```javascript
{
  rowOrder: [
    'Gross Loan',
    'Net Loan',
    'LTV',
    'Net LTV',
    'ICR',
    // ... custom order
  ]
}
```

**Admin UI**:
- Drag-and-drop table to reorder rows
- Toggle visibility switches
- Separate settings for BTL vs Bridging
- Preview changes in real-time
- Reset to defaults button

---

## 💾 **DATABASE SCHEMA**

### Core Tables

**1. users** (Managed by Supabase Auth + custom fields)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  access_level INTEGER DEFAULT 3, -- 1=Admin, 2=Manager, 3=User, 4=Underwriter
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. btl_quotes**
```sql
CREATE TABLE btl_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE, -- BTL-2025-01-15-A001
  calculator_type TEXT DEFAULT 'btl',
  status TEXT DEFAULT 'draft', -- draft, issued, expired
  
  -- Client details
  client_type TEXT, -- Direct, Broker
  client_first_name TEXT,
  client_last_name TEXT,
  client_email TEXT,
  client_contact_number TEXT,
  broker_company_name TEXT,
  broker_route TEXT,
  broker_commission_percent DECIMAL,
  
  -- Borrower details
  borrower_type TEXT, -- Personal, Company
  borrower_name TEXT,
  company_name TEXT,
  
  -- Loan inputs
  product_scope TEXT,
  retention_choice TEXT,
  retention_ltv DECIMAL,
  tier INTEGER,
  property_value DECIMAL,
  monthly_rent DECIMAL,
  top_slicing DECIMAL,
  loan_calculation_requested TEXT,
  specific_gross_loan DECIMAL,
  specific_net_loan DECIMAL,
  target_ltv DECIMAL,
  product_type TEXT,
  add_fees_toggle BOOLEAN,
  fee_calculation_type TEXT,
  additional_fee_amount DECIMAL,
  selected_range TEXT, -- core, specialist
  
  -- Criteria answers (JSON)
  criteria_answers JSONB,
  
  -- Overrides (JSON)
  rates_overrides JSONB,
  product_fee_overrides JSONB,
  rolled_months_per_column JSONB,
  deferred_interest_per_column JSONB,
  
  -- Rates and products used (JSON)
  rates_and_products JSONB,
  
  -- DIP fields
  commercial_or_main_residence TEXT,
  dip_date DATE,
  dip_expiry_date DATE,
  guarantor_name TEXT,
  lender_legal_fee DECIMAL,
  number_of_applicants INTEGER,
  overpayments_percent DECIMAL,
  paying_network_club TEXT,
  security_properties TEXT,
  fee_type_selection TEXT,
  dip_status TEXT,
  funding_line TEXT,
  
  -- Quote issuance fields
  quote_issuance_date DATE,
  quote_expiry_date DATE,
  quote_additional_terms TEXT,
  
  -- Metadata
  notes TEXT,
  created_by TEXT,
  created_by_id UUID REFERENCES users(id),
  updated_by TEXT,
  updated_by_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**3. quote_results** (BTL calculation results per fee column)
```sql
CREATE TABLE quote_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES btl_quotes(id) ON DELETE CASCADE,
  fee_column TEXT, -- '6', '4', '3', '2'
  
  -- All calculated fields (40+ columns)
  gross_loan DECIMAL,
  net_loan DECIMAL,
  ltv_percentage DECIMAL,
  net_ltv DECIMAL,
  property_value DECIMAL,
  icr DECIMAL,
  initial_rate DECIMAL,
  pay_rate DECIMAL,
  revert_rate DECIMAL,
  revert_rate_dd DECIMAL,
  full_rate TEXT,
  aprc DECIMAL,
  product_fee_percent DECIMAL,
  product_fee_pounds DECIMAL,
  admin_fee DECIMAL,
  broker_client_fee DECIMAL,
  broker_commission_proc_fee_percent DECIMAL,
  broker_commission_proc_fee_pounds DECIMAL,
  commitment_fee_pounds DECIMAL,
  exit_fee DECIMAL,
  erc_1_pounds DECIMAL,
  erc_2_pounds DECIMAL,
  monthly_interest_cost DECIMAL,
  rolled_months INTEGER,
  rolled_months_interest DECIMAL,
  deferred_interest_percent DECIMAL,
  deferred_interest_pounds DECIMAL,
  serviced_interest DECIMAL,
  direct_debit TEXT,
  erc TEXT,
  rent DECIMAL,
  top_slicing DECIMAL,
  nbp DECIMAL,
  total_cost_to_borrower DECIMAL,
  total_loan_term INTEGER,
  title_insurance_cost DECIMAL,
  product_name TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**4. bridging_quotes** (Similar structure to btl_quotes)
```sql
CREATE TABLE bridging_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE, -- BRIDGE-2025-01-15-A001
  calculator_type TEXT DEFAULT 'bridging',
  
  -- All client/borrower fields same as btl_quotes
  -- ... (omitted for brevity)
  
  -- Bridging-specific inputs
  property_value DECIMAL,
  gross_loan DECIMAL,
  first_charge_value DECIMAL,
  monthly_rent DECIMAL,
  top_slicing DECIMAL,
  use_specific_net_loan BOOLEAN,
  specific_net_loan DECIMAL,
  bridging_loan_term INTEGER,
  commitment_fee DECIMAL,
  exit_fee_percent DECIMAL,
  charge_type TEXT,
  sub_product TEXT,
  
  -- Same metadata fields as btl_quotes
  -- ...
);
```

**5. bridge_quote_results**
```sql
CREATE TABLE bridge_quote_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES bridging_quotes(id) ON DELETE CASCADE,
  product_name TEXT, -- 'Fusion', 'Variable Bridge', 'Fixed Bridge'
  
  -- All calculated fields (50+ columns)
  -- Similar to quote_results + bridging-specific fields
  gross_loan DECIMAL,
  net_loan DECIMAL,
  ltv_percentage DECIMAL,
  net_ltv DECIMAL,
  combined_ltv DECIMAL,
  second_charge_cap_gross DECIMAL,
  second_charge_cap_applied BOOLEAN,
  -- ... all other fields
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**6. bridge_multi_property_details**
```sql
CREATE TABLE bridge_multi_property_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_quote_id UUID REFERENCES bridging_quotes(id) ON DELETE CASCADE,
  property_address TEXT,
  property_type TEXT,
  property_value DECIMAL,
  charge_type TEXT,
  first_charge_amount DECIMAL,
  gross_loan DECIMAL,
  row_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**7. rates** (BTL rates - described earlier)

**8. bridge_fusion_rates_full** (Bridging rates - described earlier)

**9. criteria_config_flat** (Criteria questions - described earlier)

**10. app_constants** (Global settings - described earlier)

### Row Level Security (RLS)

Enable RLS on all tables:
- Users can only view/edit their own quotes (unless Admin/Manager)
- Admins can view/edit everything
- Rates/criteria tables readable by all, editable by Admin/Manager only
- app_constants readable by all, editable by Admin only

Example RLS policy:
```sql
-- Users can only see their own quotes
CREATE POLICY user_own_quotes ON btl_quotes
  FOR SELECT USING (auth.uid() = created_by_id);

-- Admins can see everything
CREATE POLICY admin_all_quotes ON btl_quotes
  FOR ALL USING (
    auth.jwt() ->> 'access_level' IN ('1', '2')
  );
```

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### Frontend Auth Context
```javascript
const AuthContext = {
  user: {
    id: UUID,
    email: string,
    name: string,
    access_level: number
  },
  token: JWT string,
  isAuthenticated: boolean,
  login: (email, password) => Promise,
  logout: () => void,
  canEditCalculators: () => boolean, // levels 1-3
  canManageRates: () => boolean, // levels 1-2
  canManageUsers: () => boolean, // level 1 only
  isAdmin: () => boolean, // level 1
  isUnderwriter: () => boolean // level 4
}
```

### Backend Middleware
```javascript
// Verify JWT token
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // Verify with Supabase
  // Attach user to req.user
  next();
};

// Check access level
const authorize = (minLevel) => {
  return (req, res, next) => {
    if (req.user.access_level <= minLevel) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};

// Usage:
router.post('/rates', authenticate, authorize(2), createRate);
```

---

## 🎨 **UI/UX SPECIFICATIONS**

### Design System
Use **Salesforce Lightning Design System (SLDS)**:
- Buttons: `.slds-button`, `.slds-button_brand`, `.slds-button_neutral`
- Forms: `.slds-form-element`, `.slds-input`, `.slds-select`
- Tables: `.slds-table`, `.slds-table_bordered`
- Modals: `.slds-modal`
- Notifications: Toast messages (top-right corner)
- Icons: SLDS icon set
- Colors: SLDS color palette

### Layout
- **Header**: Logo, Navigation (Home, BTL Calculator, Bridging Calculator, Quotes, Admin), User Profile dropdown
- **Sidebar**: (Optional) Quick links, Recently saved quotes
- **Main Content**: Calculator or admin interface
- **Footer**: Version, Copyright, Links

### Responsive Breakpoints
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

**Mobile Adaptations**:
- Stack form fields vertically
- Collapsible sections default to collapsed
- Results table becomes horizontally scrollable
- Hamburger menu for navigation
- Touch-friendly button sizes (min 44x44px)

### Dark Mode
- Toggle in user profile
- Persist preference in localStorage
- SCSS variables for colors:
  ```scss
  $token-color-surface: var(--slds-c-surface);
  $token-color-text: var(--slds-c-text);
  // Dark mode overrides
  [data-theme="dark"] {
    --slds-c-surface: #1a1a1a;
    --slds-c-text: #ffffff;
  }
  ```

### Keyboard Shortcuts
- `Ctrl+S` / `Cmd+S`: Save quote (when calculator active)
- `Esc`: Close modal
- `Ctrl+K` / `Cmd+K`: Open search/command palette (future feature)
- Toggle preference to enable/disable shortcuts

### Loading States
- Spinner overlay when fetching data
- Skeleton loaders for table rows
- Button disabled state during async operations
- Progress indicators for long calculations

### Error Handling
- Validation messages below form fields (red text, icon)
- Toast notifications for success/error (auto-dismiss after 5s)
- Error boundaries to catch React crashes
- Friendly error messages (not stack traces to users)

### Accessibility (WCAG 2.1 AA)
- All inputs have labels (or `aria-label`)
- Color contrast ratio ≥ 4.5:1
- Focus indicators visible
- Keyboard navigable
- Screen reader friendly (semantic HTML, ARIA attributes)
- Form validation announced to screen readers

---

## 📡 **API ENDPOINTS**

### Authentication
```
POST   /api/auth/login            # Login with email/password
POST   /api/auth/logout           # Logout (clear session)
POST   /api/auth/refresh          # Refresh JWT token
POST   /api/auth/reset-password   # Request password reset
POST   /api/auth/update-password  # Update password
```

### Users (Admin only)
```
GET    /api/users                 # List all users
GET    /api/users/:id             # Get user details
POST   /api/users                 # Create new user
PUT    /api/users/:id             # Update user
DELETE /api/users/:id             # Delete user
```

### Quotes
```
GET    /api/quotes                # List quotes (filtered by user or all for admin)
                                  # Query params: ?user_id=X&calculator_type=btl&limit=100&offset=0
GET    /api/quotes/:id            # Get quote details (includes results)
POST   /api/quotes                # Create new quote
PUT    /api/quotes/:id            # Update existing quote
DELETE /api/quotes/:id            # Delete quote
```

### DIP & Quote PDFs
```
POST   /api/dip/pdf/:quoteId      # Generate DIP PDF
POST   /api/quote/pdf/:quoteId    # Generate Quote PDF
```

### Rates (Admin/Manager)
```
GET    /api/rates                 # List BTL rates (paginated, filterable)
GET    /api/rates/:id             # Get rate details
POST   /api/rates                 # Create new rate
PUT    /api/rates/:id             # Update rate
DELETE /api/rates/:id             # Delete rate
POST   /api/rates/bulk-import     # Import CSV of rates
POST   /api/rates/bulk-activate   # Bulk activate/deactivate

GET    /api/bridge-rates          # List Bridging rates
# ... similar CRUD endpoints for bridging rates
```

### Criteria (Admin/Manager)
```
GET    /api/criteria              # List all criteria
GET    /api/criteria/:id          # Get criteria details
POST   /api/criteria              # Create new criteria question
PUT    /api/criteria/:id          # Update criteria question
DELETE /api/criteria/:id          # Delete criteria question
```

### Constants (Admin)
```
GET    /api/constants             # Get all constants
GET    /api/constants/:key        # Get specific constant
PUT    /api/constants/:key        # Update constant
POST   /api/constants/reset       # Reset all to defaults
```

### Health & Monitoring
```
GET    /api/health                # Health check endpoint
GET    /api/version               # API version info
```

---

## 🧪 **TESTING REQUIREMENTS**

### Unit Tests
- **Target Coverage**: 80%+
- **Test Framework**: Vitest + React Testing Library

**Test Categories**:

1. **Component Tests** (frontend/src/components/*.test.jsx):
   - Render tests: Component renders without crashing
   - Props tests: Correctly handles all props
   - User interaction tests: Click, type, select, toggle
   - Conditional rendering: Shows/hides based on state
   - Accessibility: ARIA attributes, keyboard navigation

2. **Hook Tests** (frontend/src/hooks/*.test.js):
   - State management: Initial state, updates
   - Side effects: API calls, localStorage
   - Error handling: Invalid inputs, failed requests
   - Integration: Multiple hooks working together

3. **Calculation Engine Tests** (frontend/src/utils/*.test.js):
   - BTL calculations:
     - Max Gross: Test all 4 loan types
     - ICR: Test 125% and 145% thresholds
     - LTV: Boundary tests (0%, 75%, 100%)
     - Fees: Product fee, broker fee, admin fee
     - APRC: Validate formula accuracy
   - Bridging calculations:
     - First charge calculations
     - Second charge with combined LTV
     - Fusion vs Bridge vs Fixed differences
     - Rolled/deferred/serviced interest
     - LTV caps and warnings
   - Edge cases:
     - Zero values
     - Very large values
     - Decimal precision
     - Negative inputs (should reject)

4. **API Tests** (backend/routes/*.test.js):
   - Authentication: Login, logout, token refresh
   - CRUD operations: Create, read, update, delete
   - Authorization: Role-based access control
   - Validation: Input validation, error responses
   - Rate limiting: Ensure limits enforced

5. **Integration Tests**:
   - Full calculator workflow: Input → Calculate → Save → Load
   - Multi-property bridging: Add rows, calculate totals
   - DIP/Quote generation: Modal → Save → PDF
   - Admin workflows: Edit rate → Recalculate affected quotes

### Test Data
```javascript
// Fixtures for consistent testing
const testRateBTL = {
  id: 'test-rate-1',
  lender: 'Test Lender',
  product_scope: 'Whole Market',
  product_range: 'Specialist',
  product_type: '2yr Fix',
  tier: 2,
  min_ltv: 50,
  max_ltv: 75,
  rate: 4.5,
  product_fee: 3,
  // ...
};

const testQuoteInputs = {
  propertyValue: 250000,
  monthlyRent: 1200,
  topSlicing: 500,
  loanType: 'maxGross',
  tier: 2,
  // ...
};
```

### Test Commands
```bash
npm test                  # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
npm run test:ui           # Open Vitest UI
```

---

## 📦 **DEPENDENCIES**

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.30.0",
    "@supabase/supabase-js": "^2.0.0",
    "@salesforce-ux/design-system": "^2.0.0",
    "prop-types": "^15.8.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^4.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "sass": "^1.69.0"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "@supabase/supabase-js": "^2.0.0",
    "dotenv": "^16.0.0",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "vitest": "^4.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

## 🚀 **DEPLOYMENT**

### Environment Variables

**Frontend (.env)**:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.yourapp.com
```

**Backend (.env)**:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
ALLOWED_ORIGINS=https://yourapp.com
```

### Build Commands
```bash
# Frontend
cd frontend
npm run build      # Creates dist/ folder

# Backend
cd backend
npm run start      # Production start (no need to build)
```

### Deployment Platforms
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend**: Render, Railway, Heroku, or AWS Lambda
- **Database**: Supabase (managed PostgreSQL)

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - # Deploy to Vercel
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - # Deploy to Render
```

---

## 🔔 **CRITICAL IMPLEMENTATION NOTES**

### 1. Calculation Accuracy
- Use `Number` type for all calculations (not strings)
- Round to 2 decimal places for display only
- Store unrounded values in database
- Test boundary conditions (0%, 100%, very large numbers)
- Validate all inputs before calculation

### 2. Performance
- Debounce calculator inputs (300ms delay before recalculating)
- Memoize expensive calculations with `useMemo`
- Virtual scrolling for large tables (100+ rates)
- Lazy load admin sections
- Code splitting by route

### 3. Security
- Never expose service role key to frontend
- Validate all API inputs on backend
- Use parameterized queries (prevent SQL injection)
- Rate limit API endpoints (100 requests/minute per IP)
- Sanitize user inputs (prevent XSS)
- HTTPS only in production
- Secure cookie settings

### 4. Data Integrity
- Unique constraint on reference numbers
- Foreign key constraints with ON DELETE CASCADE
- Validate LTV ranges (min < max)
- Validate rate values (> 0)
- Atomic transactions for quote saving

### 5. User Experience
- Auto-save drafts every 30 seconds (localStorage)
- Confirm before deleting quotes/rates
- Toast notifications for all actions
- Loading states for async operations
- Keyboard shortcuts for power users
- Responsive on all devices

### 6. Maintainability
- Comprehensive inline comments
- JSDoc comments for all functions
- README for each major module
- Changelog for database migrations
- Version numbering (semantic versioning)

---

## ✅ **ACCEPTANCE CRITERIA**

### BTL Calculator
- [ ] All 4 loan types calculate correctly
- [ ] ICR 125% and 145% thresholds enforced
- [ ] LTV slider updates results in real-time
- [ ] Core/Specialist toggle filters results
- [ ] Editable rate row persists changes
- [ ] Editable product fee row persists changes
- [ ] Rolled months slider works per column
- [ ] Deferred interest slider works (Fusion only)
- [ ] All 40+ result rows display correctly
- [ ] Row visibility toggles work
- [ ] Row reordering persists
- [ ] Save quote creates unique reference number
- [ ] Load quote restores all state
- [ ] Issue DIP modal collects all fields
- [ ] Issue DIP generates PDF
- [ ] Issue Quote modal collects all fields
- [ ] Issue Quote generates PDF

### Bridging Calculator
- [ ] First charge calculations correct
- [ ] Second charge with combined LTV correct
- [ ] Multi-property table adds/deletes rows
- [ ] Multi-property totals calculate correctly
- [ ] "Use Total Gross Loan" button works
- [ ] Term slider range adapts to available rates
- [ ] Fusion calculations separate from Bridge
- [ ] Variable Bridge uses monthly margin + BBR
- [ ] Fixed Bridge uses monthly coupon
- [ ] Rolled interest calculated per product type
- [ ] Deferred interest only for Fusion
- [ ] LTV caps applied with warnings
- [ ] All 50+ result rows display correctly
- [ ] Save/Load/DIP/Quote same as BTL

### Admin Features
- [ ] Rates table displays all rates
- [ ] Rates inline editing works
- [ ] Rates bulk import from CSV works
- [ ] Criteria questions editable
- [ ] Criteria drag-and-drop reordering works
- [ ] Constants page edits persist
- [ ] Results table visibility toggles work
- [ ] Results table row reordering works
- [ ] Broker settings save globally
- [ ] Users can be added/edited/deleted (Admin only)

### Authentication & Authorization
- [ ] Login redirects to dashboard
- [ ] Logout clears session
- [ ] Admin can access all features
- [ ] Manager can access rates/criteria
- [ ] User can only use calculators
- [ ] Underwriter has read-only access
- [ ] Token refresh works automatically
- [ ] Password reset flow works

### Testing
- [ ] 80%+ code coverage
- [ ] All calculation engines have unit tests
- [ ] All components have render tests
- [ ] All API endpoints have tests
- [ ] Integration tests pass
- [ ] No console errors in production build

### Performance
- [ ] Calculator responds in < 300ms
- [ ] Results table renders in < 500ms
- [ ] Page load < 2 seconds (3G network)
- [ ] Lighthouse score > 90 (Performance)
- [ ] Bundle size < 500KB (gzipped)

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Color contrast passes
- [ ] Focus indicators visible

---

## 📝 **ADDITIONAL NOTES**

### Future Enhancements (Out of Scope)
- Export to Excel
- Email quotes to clients
- Multi-language support
- Advanced search/filter for quotes
- Dashboard with analytics
- Batch quote processing
- Mobile app (React Native)
- Webhook integrations

### Known Limitations
- Max 100 rates per product type (pagination required)
- PDF generation server-side only (no client-side)
- Real-time collaboration not supported
- Offline mode not available

### Support & Documentation
- User guide: /docs/user-guide.pdf
- API documentation: /docs/api.md
- Admin guide: /docs/admin-guide.md
- Troubleshooting: /docs/troubleshooting.md

---

## 🎯 **IMPLEMENTATION CHECKLIST**

**Phase 1: Setup (Week 1)**
- [ ] Initialize React + Vite project
- [ ] Setup Express backend
- [ ] Configure Supabase
- [ ] Setup SLDS styling
- [ ] Create database schema
- [ ] Implement authentication

**Phase 2: BTL Calculator (Weeks 2-3)**
- [ ] Build input forms (client, criteria, loan details)
- [ ] Implement BTL calculation engine
- [ ] Build results table with interactive rows
- [ ] Implement save/load quotes
- [ ] Add DIP/Quote modals
- [ ] Write tests (80% coverage)

**Phase 3: Bridging Calculator (Weeks 4-5)**
- [ ] Build bridging input forms
- [ ] Implement Bridge/Fusion calculation engine
- [ ] Build multi-property table
- [ ] Build results table (3 columns)
- [ ] Implement save/load quotes
- [ ] Add DIP/Quote modals
- [ ] Write tests (80% coverage)

**Phase 4: Admin Features (Week 6)**
- [ ] Build rates management UI
- [ ] Build criteria management UI
- [ ] Build constants management UI
- [ ] Build results table customization UI
- [ ] Implement user management
- [ ] Write tests

**Phase 5: Polish & Deploy (Week 7)**
- [ ] Responsive design testing
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Deploy to production
- [ ] User acceptance testing

---

## 🏁 **FINAL DELIVERABLES**

1. **Source Code**
   - Frontend React app (fully functional)
   - Backend Express API (all endpoints)
   - Database schema & migrations

2. **Tests**
   - 80%+ code coverage
   - All critical paths tested
   - Test reports

3. **Documentation**
   - README.md (setup instructions)
   - API documentation
   - User guide
   - Admin guide

4. **Deployment**
   - Deployed frontend (Vercel/Netlify)
   - Deployed backend (Render/Railway)
   - Configured database (Supabase)
   - SSL certificates
   - Domain configured

5. **Credentials**
   - Admin account credentials
   - Database connection strings
   - API keys
   - Environment variables

---

**END OF SPECIFICATION**

This prompt ensures complete feature parity with your existing calculator platform. Every calculation, UI element, admin feature, and user flow is documented in detail. GitHub Spark or any AI agent following this specification will recreate your calculator exactly as it functions today.
