# Technology Stack Analysis

## Core Technology Analysis

### Programming Languages
- **JavaScript/JSX** - Primary frontend language (React 18.2.0)
- **JavaScript (Node.js)** - Backend runtime (Node >= 20.x)
- **CSS/SCSS** - Styling with Sass embedded preprocessing

### Primary Framework
- **React 18.2.0** - Component-based UI framework
- **Vite 5.0.0** - Modern build tool and dev server for frontend
- **Express 4.18.2** - Node.js web application framework for backend API

### Secondary/Tertiary Frameworks & Libraries

**Frontend UI & Styling:**
- **Carbon Design System (@carbon/react 1.96.0)** - IBM's enterprise-grade design system for UI components
- **Salesforce Lightning Design System (SLDS)** - Secondary design system for specific UI patterns
- **React Router DOM 6.30.1** - Client-side routing

**State Management:**
- **React Context API** - Primary state management approach
- Custom contexts: `SupabaseContext`, `AuthContext`, `ToastContext`
- Local state with `useState` and `useEffect` hooks

**Backend & Data:**
- **Supabase (@supabase/supabase-js 2.39.0)** - Backend-as-a-Service for database, auth, and storage
- **Express.js** - REST API server
- **PostgreSQL** - Database (via Supabase)

**Document Generation:**
- **@react-pdf/renderer 4.3.1** - PDF generation in React
- **PDFKit 0.17.2** - Server-side PDF generation
- **Docxtemplater 3.67.3** - DOCX document generation from templates

**Authentication & Security:**
- **bcrypt 5.1.1** - Password hashing
- **jsonwebtoken 9.0.2** - JWT token management
- **express-rate-limit 8.2.1** - API rate limiting
- **Joi 18.0.1** - Schema validation

**Developer Tools:**
- **Vitest 4.0.8** - Unit testing framework
- **ESLint 9.39.1** - Code linting
- **Stylelint 16.2.1** - CSS/SCSS linting
- **Husky 9.0.11** - Git hooks

## Domain Specificity Analysis

### Problem Domain
**Specialist Mortgage Calculation Platform** - This application is a professional mortgage calculator and quoting system specifically designed for specialist lending products:
- Buy-to-Let (BTL) mortgages
- Bridging loans (short-term property financing)
- Fusion products (hybrid bridge-to-BTL refinancing)

### Core Business Concepts

**Mortgage/Lending Concepts:**
- **LTV (Loan-to-Value)** - Percentage of property value that can be borrowed
- **Product Ranges** - Core vs Specialist lending products
- **Rate Tiers** - Different interest rate levels based on risk/criteria
- **Retention** - Existing mortgage balance being refinanced
- **Top Slicing** - Additional non-rental income used for affordability
- **ICR (Interest Coverage Ratio)** - Rental income vs mortgage payment ratio
- **Deferred Interest** - Interest capitalization strategies
- **Rolled Months** - Period where interest is deferred

**Bridge-Specific Concepts:**
- **Gross vs Net Loan** - Before and after fees calculation
- **First Charge** - Priority position on property title
- **Exit Strategy** - How the loan will be repaid (sale, refinance, etc.)
- **Term** - Loan duration (typically 6-24 months for bridging)
- **Commitment Fee** - Upfront fee percentage
- **Exit Fee** - Fee charged when loan is repaid

**Product Types:**
- Fixed rate products (2yr, 3yr, 5yr terms)
- Variable/Tracker products
- Stepped rates
- Multi-property portfolios

**Compliance & Documentation:**
- **DIP (Decision in Principle)** - Pre-approval document
- **Quote** - Formal mortgage offer quotation
- **UW Requirements Checklist** - Underwriting document requirements
- Asset & Liability Statements
- Proof of identity/address
- Property valuation requirements

### User Interactions

**Primary Workflows:**
1. **Rate Calculation** - Input property/loan parameters → filter and match available rates → calculate optimal loan structure
2. **Quote Issuance** - Save calculation → add borrower details → generate PDF quote
3. **DIP Creation** - Collect additional borrower information → generate formal DIP document
4. **Portfolio Management** - Save/load quotes, track quote history
5. **Admin Configuration** - Manage rates, configure product rules, set broker settings

**User Roles:**
- **Broker** - Creates quotes, issues DIPs (access levels 1-3)
- **Underwriter** - Reviews quotes in read-only mode (access level 4)
- **Admin** - Manages rates, products, system configuration

**Interaction Patterns:**
- Real-time calculation as inputs change
- Slider-based optimization (deferred interest, rolled months)
- Manual override capability for calculated values
- Multi-column fee range comparison
- Collapsible/expandable sections (accordion pattern)
- Modal-based workflows (save, issue quote, issue DIP)
- Toast notifications for feedback

### Primary Data Types & Structures

**Core Entities:**
```javascript
// Rate/Product
{
  product: string,              // e.g., "2yr Fix"
  tier: string,                 // e.g., "Tier 1", "Tier 2"
  initial_rate: number,         // e.g., 5.49
  revert: string,               // e.g., "MVR", "Tracker"
  revert_rate: number,          // e.g., 7.5
  lender_fee: number,           // £ or %
  max_ltv: number,              // e.g., 75
  min_loan: number,
  max_loan: number,
  product_scope: string         // "BTL", "Bridge", "Fusion"
}

// Quote
{
  id: uuid,
  reference_number: string,
  calculator_type: "BTL" | "Bridging",
  selected_range: "core" | "specialist",
  property_value: number,
  gross_loan: number,
  monthly_rent: number,
  borrower_name: string,
  quote_status: "Draft" | "Issued",
  // + 50+ calculation fields
}

// Multi-Property (Bridging)
{
  property_address: string,
  property_type: "Residential" | "Commercial" | "Semi-Commercial",
  property_value: number,
  charge_type: "First charge" | "Second charge",
  first_charge_amount: number,
  gross_loan: number (calculated)
}

// Broker Settings
{
  company_name: string,
  procuration_fee: number,
  packager_details: string,
  product_lists: string[],      // List of product types to show
  fee_columns: string[],        // Fee ranges to display
  market_rates: { name, value }[]
}
```

**Calculation Results Structure:**
- Per-column results for each fee range (0-2%, 2-3%, 3%+, etc.)
- Optimized values (calculated by engine)
- User overrides (manual adjustments)
- Intermediate calculations (ICR, stress test, affordability)

### Specialized Libraries & Mathematical Concepts

**Calculation Engines:**
- `btlCalculationEngine.js` - BTL loan calculations with ICR, stress tests, affordability
- `bridgeFusionCalculationEngine.js` - Bridging/Fusion loan calculations with deferred interest
- `loanCalculations.js` - Core LTV, loan size, interest calculations

**Financial Mathematics:**
- Compound interest calculations
- Amortization schedules
- Stress testing at higher interest rates
- ICR (Interest Coverage Ratio) = (Monthly Rent / Monthly Payment)
- Net loan = Gross loan - fees
- LTV = Loan / Property Value

**PDF/Document Generation:**
- React-based PDF rendering for quotes
- Template-based DOCX generation for DIPs
- Custom styling and layout engines

**Rate Filtering & Matching:**
- Tier computation based on criteria answers
- Product scope filtering (BTL/Bridge/Fusion/Core)
- LTV-based rate selection
- Multi-factor rate matching algorithm

## Application Boundaries

### Clearly Within Scope

**Features Present in Codebase:**
- BTL (Buy-to-Let) mortgage calculations
- Bridging loan calculations
- Fusion product calculations (bridge-to-BTL)
- Multi-property portfolio bridging
- Rate comparison across fee ranges
- Quote saving and management
- DIP generation
- Quote PDF generation
- UW requirements checklist management
- User authentication (email/password)
- Role-based access control (4 levels)
- Broker settings customization
- Admin rate management
- Dark mode theme
- Keyboard shortcuts
- Client detail tracking
- Export to Excel functionality

**Architectural Capabilities:**
- Real-time calculation updates
- Modal-based workflows
- Collapsible section patterns
- Custom React hooks for reusability
- Context-based state management
- Supabase integration for data/auth
- PDF generation (client & server-side)
- Rate limiting and security middleware
- Responsive design (mobile-friendly)

### Features That Would Fit the Architecture

**Natural Extensions:**
- Additional mortgage product types using existing calculator pattern
- New report/document templates following PDF generation pattern
- Additional user roles using existing RBAC system
- More calculator result customizations (row visibility, ordering, labels)
- Enhanced multi-property features
- Additional export formats (CSV, JSON)
- Audit logging for quote changes
- Email notifications for quote status
- Integration with external valuation APIs
- CRM integration for client management

**Would Align with Current Design:**
- Criteria-based rate filtering for new product types
- Custom calculation engines for new loan types
- Additional design system components (already uses Carbon + SLDS)
- More admin configuration panels
- Enhanced underwriting workflow features
- Automated rate imports from external sources

### Features Architecturally Inconsistent

**Would Conflict with Current Design:**
- **Real-time collaborative editing** - Architecture uses single-user quote editing
- **GraphQL API** - Backend is RESTful Express; would require major refactor
- **Server-side rendering (SSR)** - Vite SPA architecture, not Next.js
- **Native mobile apps** - No React Native; web-only design
- **Complex workflow engines** - Quote workflows are linear, not BPMN/state-machine based
- **Multi-tenancy at database level** - Single Supabase instance with user-level isolation
- **Real-time chat/messaging** - No WebSocket infrastructure
- **Blockchain/ledger features** - Standard RDBMS transaction model
- **Machine learning rate prediction** - Deterministic calculation engines only

### Domain Constraints

**Specialized Domain Knowledge Required:**
- UK mortgage regulation and terminology
- FCA compliance for financial calculations
- Specialist lending criteria (BTL/Bridging)
- Underwriting document requirements
- Mortgage product structures (fix, variable, tracker)

**Mathematical/Financial Constraints:**
- All calculations must be deterministic and auditable
- Interest rate precision (typically 2 decimal places)
- Currency handling (£ sterling)
- ICR must meet lender requirements (typically > 125%)
- LTV limits per product type
- Rate tier eligibility rules

**Technology Constraints:**
- Supabase as primary data layer (not easily swappable)
- React 18 concurrent features not heavily utilized
- Carbon Design System components (limited to available components)
- PDF generation limited to react-pdf and pdfkit capabilities
- No server-side caching layer (direct Supabase queries)

## Summary

This is a **specialist mortgage calculation and quoting platform** built for UK mortgage brokers dealing with BTL and Bridging products. The architecture is a modern React SPA with Express API backend and Supabase BaaS, focused on financial calculations, document generation, and workflow management for mortgage quotes and DIPs. The domain is highly specialized requiring deep knowledge of UK mortgage products, regulations, and lending criteria.

Key architectural decisions favor:
- Component-based UI with design systems (Carbon + SLDS)
- Context-driven state management (no Redux/Zustand)
- Direct Supabase integration (no ORM layer)
- Modal-heavy workflows
- Real-time calculation with manual override capability
- PDF-first document generation
- Simple RBAC with 4 access levels
