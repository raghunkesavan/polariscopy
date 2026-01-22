# GitHub Copilot Instructions - Polaris Specialist Mortgage Platform

## Quick Orientation for AI Coding Agents

This repository is a full-stack specialist mortgage calculation platform for UK Buy-to-Let (BTL) and Bridging loans. It uses **React + Vite frontend** with **Express backend** and **Supabase** database. The system calculates complex mortgage scenarios with regulatory compliance (FCA), multi-rate comparisons, PDF quote generation, and underwriting workflows.

---

## 🎯 Project Overview

### Big Picture
- **Frontend**: `frontend/` — React 18.2 + Vite 5.0, Carbon Design System, SLDS utilities
- **Backend**: `backend/` — Node.js 20+ + Express 4.18.2, Supabase service-role client
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Domain**: Specialist UK mortgage lending (BTL, Bridging, Fusion products)
- **Key Features**: 
  - Multi-rate calculation engines (BTL/Bridging/Fusion)
  - Quote generation with PDF export (client + DIP)
  - Admin configuration (rates, constants, broker settings)
  - Role-based access control (5 levels)
  - Dark mode support throughout

### Deployment Architecture
- **Frontend Hosting**: Vercel (https://polaristest-theta.vercel.app)
- **Backend Hosting**: Render (separate from frontend)
- **Database**: Supabase PostgreSQL (https://iwwgwwaeunyzqtkfhkid.supabase.co)
- **Email Service**: Gmail SMTP (for password resets & support tickets)
- **API Communication**: Frontend (Vercel) → Backend API (Render) → Supabase

### Environment Variables Strategy
- **Frontend (Vercel)**: Only `VITE_` prefixed vars (VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- **Backend (Render)**: All sensitive secrets (JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, SMTP credentials)
- **NEVER expose**: Backend secrets to frontend - they run on separate platforms

### Tech Stack
- **Frontend**: React 18.2, Vite 5.0, React Router DOM 6, Carbon Design 1.96, SLDS
- **State**: React Context API (AuthContext, SupabaseContext, ThemeContext, ToastContext)
- **Backend**: Express 4.18.2, Supabase 2.39.0, JWT auth, bcrypt
- **Email**: Nodemailer with Gmail SMTP (password resets + support tickets)
- **PDFs**: @react-pdf/renderer 4.3.1 (FRONTEND ONLY - all PDF generation is client-side)
- **Testing**: Vitest, @testing-library/react
- **Styling**: SCSS with design tokens, darkmode.css overrides

**CRITICAL PDF NOTE**: All PDF generation (Quotes & DIPs) uses FRONTEND React components with @react-pdf/renderer. Backend PDF routes exist but are NOT USED. Always update frontend PDF components in `frontend/src/components/pdf/`.

---

## 📁 Critical File Locations

### Essential Entry Points
- **Frontend entry**: `frontend/src/App.jsx` — Route definitions, context providers
- **Backend entry**: `backend/server.js` — API routes, middleware
- **BTL Calculator**: `frontend/src/features/btl-calculator/components/BTLCalculator.jsx`
- **Bridging Calculator**: `frontend/src/components/calculators/BridgingCalculator.jsx`
- **Calculation Engines**:
  - BTL: `frontend/src/utils/btlCalculationEngine.js`
  - Bridging/Fusion: `frontend/src/utils/bridgeFusionCalculationEngine.js`
  - Rate filtering: `frontend/src/utils/rateFiltering.js`

### Configuration & Constants
- **App constants**: `frontend/src/config/constants.js` — Runtime-editable settings
- **Design tokens**: `frontend/src/styles/slds-tokens.css`, `frontend/src/styles/tokens.scss`
- **Dark mode**: `frontend/src/styles/darkmode.css` — All dark theme overrides
- **Figma tokens**: `frontend/figma.config.json` — Token source of truth

### PDF Components (FRONTEND ONLY)
- **BTL Quote PDF**: `frontend/src/components/pdf/BTLQuotePDF.jsx`
- **BTL DIP PDF**: `frontend/src/components/pdf/BTLDIPPDF.jsx`
- **Bridging Quote PDF**: `frontend/src/components/pdf/BridgingQuotePDF.jsx`
- **Bridging DIP PDF**: `frontend/src/components/pdf/BridgingDIPPDF.jsx`
- **PDF Helpers**:
  - BTL: `frontend/src/components/pdf/utils/btlQuoteHelpers.js`, `btlDipHelpers.js`
  - Bridging: `frontend/src/components/pdf/utils/bridgingQuoteHelpers.js`, `bridgingDipHelpers.js`
- **PDF Styles**: `frontend/src/components/pdf/shared/` — Shared styles and components

**⚠️ NEVER update backend PDF routes** - they are deprecated and not used.

---

## 🏗️ Architecture Patterns

### UI Layer (MANDATORY RULES)

#### CSS & Styling (CRITICAL)
```scss
// ✅ ALWAYS use design tokens - NO hardcoded values
.my-component {
  background-color: var(--token-layer-surface);
  color: var(--token-text-primary);
  padding: var(--token-spacing-medium);
  border: 1px solid var(--token-border-subtle);
}

// ❌ NEVER use hardcoded values
.bad-component {
  background-color: #262626; /* NO */
  padding: 16px; /* NO */
}

// ✅ EXCEPTION: Inline styles ONLY for dynamic values
<div style={{ width: `${percentage}%` }}>Progress</div>
```

#### Dark Mode Support (MANDATORY)
```css
/* ✅ Support both selectors */
:root[data-carbon-theme="g100"],
.dark-mode {
  --token-layer-background: #161616;
  --token-text-primary: #f4f4f4;
}
```

#### Component Requirements
```jsx
import React from 'react';
import PropTypes from 'prop-types';

// ✅ ALWAYS include PropTypes
function MyComponent({ title, onSave, children }) {
  return <div>{children}</div>;
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  children: PropTypes.node,
};

// ✅ ALWAYS handle loading and error states
function DataComponent() {
  const { data, loading, error } = useFetchData();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;
  
  return <div>{data.map(...)}</div>;
}
```

---

### State Management

#### Context API Pattern
```jsx
import React, { createContext, useContext, useState } from 'react';

const MyContext = createContext();

// ✅ ALWAYS create custom hook
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

#### State Immutability (CRITICAL)
```jsx
// ✅ CORRECT - Functional updates with spread
setResults(prev => ({
  ...prev,
  [colKey]: {
    ...prev[colKey],
    ...newData,
  },
}));

// ❌ INCORRECT - Mutation
results[colKey] = newData; // NO
setResults(results); // NO
```

---

### Calculation Engines (CORE BUSINESS LOGIC)

#### BTL Calculation Pattern
```javascript
import { parseNumber, formatCurrency } from './calculator/numberFormatting';
import { computeBTLLoan } from './btlCalculationEngine';

// ✅ Pure functions - NO side effects
const result = computeBTLLoan({
  colKey: '2-3%',
  selectedRate: rateObject,
  propertyValue: parseNumber('£500,000'), // ALWAYS parse inputs
  monthlyRent: parseNumber('£2,500'),
  loanType: 'Max gross loan',
  productFeePercent: 2,
});
```

#### Key Business Rules
1. **ICR Formula**: `icr = (monthlyRent + topSlicing) / monthlyInterest * 100`
2. **LTV Formula**: `ltv = grossLoan / propertyValue`
3. **Net Loan**: `netLoan = grossLoan * (1 - productFeePercent / 100)`
4. **Rate Table Priority**: ALWAYS use rate table values over hardcoded defaults
5. **Per-Column Calculations**: Results keyed by fee column (0-2%, 2-3%, 3%+)

---

## ⚠️ Critical Don'ts (Anti-Patterns)

### ❌ NEVER Do These

#### 1. Hardcoded Colors/Spacing
```jsx
// NO
<div style={{ color: '#f4f4f4', backgroundColor: '#262626', padding: '16px' }}>
```

#### 2. Missing PropTypes
```jsx
// NO - Component without PropTypes
function MyComponent({ title, onSave }) {
  return <div>{title}</div>;
}
```

#### 3. No Loading/Error States
```jsx
// NO - Renders without checking data exists
function DataList({ items }) {
  return items.map(item => <div>{item.name}</div>); // Crashes if items is null!
}
```

#### 4. Mutating State
```jsx
// NO
state.results[colKey] = newValue;
setState(state);
```

#### 5. Side Effects in Calculation Engines
```jsx
// NO - Calculation engines MUST be pure
export function computeBTLLoan(params) {
  console.log('Calculating...'); // NO
  fetch('/api/save'); // NO
  return result;
}
```

---

## 🎯 Summary: Golden Rules

When building features in this codebase:

1. ✅ **Design System First**: Carbon components → SLDS utilities → Custom only if needed
2. ✅ **Design Tokens Always**: No hardcoded colors, spacing, or font sizes
3. ✅ **Dark Mode Support**: Test both light and dark themes
4. ✅ **PropTypes Required**: Every component must have PropTypes
5. ✅ **Loading/Error States**: Handle all async operations properly
6. ✅ **Pure Calculations**: Calculation engines = pure functions (no side effects)
7. ✅ **State Immutability**: Never mutate state directly
8. ✅ **Context API Only**: No Redux/Zustand/MobX
9. ✅ **Parse All Inputs**: Use `parseNumber()` for numeric inputs
10. ✅ **Format All Outputs**: Use `formatCurrency()` / `formatPercent()` for display

---

## 📞 Support

For questions about:
- **UI/Styling**: Reference `docs/CSS_STYLE_GUIDE.md` and `darkmode.css`
- **Calculations**: Review `btlCalculationEngine.js` and `bridgeFusionCalculationEngine.js`
- **Authentication**: See `contexts/AuthContext.jsx` and `backend/middleware/auth.js`
- **Database**: Check `database/migrations/` for schema and `backend/routes/` for queries
- **PDFs**: All PDF components are in `frontend/src/components/pdf/`. Examine BTL/Bridging PDF components and their helpers. Backend PDF routes are deprecated.

---

**Last Updated**: January 2026  
**Methodology**: Generated via bitovi/ai-enablement-prompts instruction-generation chain