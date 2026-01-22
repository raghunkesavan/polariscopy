# AI Agent Instructions for Polaris Test Project

## CRITICAL: Read This First

This document contains **MANDATORY** instructions for all AI agents working on this project. Following these rules ensures code quality, maintainability, and prevents technical debt.

---

## 1. Project Structure & File Organization

### Documentation Files Location

**RULE**: ALL documentation files MUST be placed in the `/docs` directory, NOT in the root directory.

```
✅ CORRECT:
docs/
  ├── architecture/
  ├── features/
  ├── guides/
  └── implementation/

❌ WRONG:
root/
  ├── SOME_FEATURE_GUIDE.md
  ├── IMPLEMENTATION_SUMMARY.md
  └── ... (cluttering root directory)
```

**Exceptions** (only these can be in root):
- `README.md` - Project overview
- `TOKEN_SYSTEM.md` - Design token reference
- `DEPLOYMENT.md` - Deployment instructions
- `.github/` directory files

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── calculator/        # Calculator-specific components
│   │   │   ├── btl/          # BTL-specific components
│   │   │   ├── bridging/     # Bridging-specific components
│   │   │   └── shared/       # Shared calculator components
│   │   ├── modals/           # Modal components
│   │   ├── pdf/              # PDF generation components
│   │   │   ├── shared/       # Shared PDF components
│   │   │   ├── sections/     # PDF section components
│   │   │   └── utils/        # PDF utilities
│   │   ├── layout/           # Layout components (AppShell, Nav, Breadcrumbs)
│   │   ├── shared/           # Shared components (Icons, Headers)
│   │   ├── tables/           # Table components
│   │   └── ui/               # Generic UI components
│   ├── pages/                # Page-level components
│   │   ├── AdminLandingPage.jsx
│   │   ├── AdminPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── ... (other pages)
│   ├── features/             # Feature-specific components
│   │   └── btl-calculator/
│   ├── styles/
│   │   ├── slds-tokens.css   # Design token definitions
│   │   ├── slds.css          # Salesforce Lightning styles
│   │   ├── darkmode.css      # Dark mode overrides
│   │   ├── accessibility.css # Accessibility styles
│   │   └── ... (component styles)
│   ├── utils/                # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts
│   └── config/               # Configuration files
```

### Backend Structure

```
backend/
├── routes/              # API routes
├── middleware/          # Express middleware
├── utils/              # Utility functions
├── scripts/            # Database seeds and migrations
└── __tests__/          # Backend tests
```

---

## 2. Design Token System (MANDATORY)

### Core Rule
**ALWAYS use design tokens. NEVER use hardcoded values.**

### Available Tokens

#### Spacing Tokens
```scss
$spacing-xs: var(--token-space-8);    // 8px
$spacing-sm: var(--token-space-12);   // 12px  
$spacing-md: var(--token-space-16);   // 16px
$spacing-lg: var(--token-space-24);   // 24px
```

#### Color Tokens
```scss
// Text
$token-text-primary
$token-text-secondary
$token-text-helper
$token-text-error

// Backgrounds
$token-color-surface
$token-color-background

// Borders
$token-color-border-subtle
$token-color-border-strong

// Interactive
$token-color-interactive
$token-color-interactive-hover
```

#### Border & Layout Tokens
```scss
$token-radius-sm          // Border radius small (4px)
$token-radius-md          // Border radius medium (8px)
$token-shadow-soft        // Box shadow
$token-layer-surface      // Surface background
$token-layer-hover        // Hover state background
```

#### Typography Tokens
```scss
$token-font-family        // Salesforce Sans font family
$token-font-size-xs       // Extra small text (0.75rem)
$token-font-size-sm       // Small text (0.875rem)
$token-font-size-md       // Medium text (1rem)
$token-font-size-lg-minus // Large minus text
$token-font-weight-semibold // 600
```

#### Spacing Tokens (Granular)
```scss
$token-spacing-2          // 2px
$token-spacing-3          // 3px
$token-spacing-8          // 8px
$token-spacing-12         // 12px
$token-spacing-16         // 16px
```

#### Interactive Tokens
```scss
$token-interactive        // Interactive element color
$token-interactive-hover  // Interactive hover state
$token-focus-ring         // Focus ring color
$token-critical           // Error/critical state
$token-success            // Success state
```

### Examples

**✅ CORRECT:**
```scss
.my-component {
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  background-color: $token-color-surface;
  border: 1px solid $token-color-border-subtle;
  border-radius: $token-radius-sm;
  color: $token-text-primary;
}
```

**❌ WRONG:**
```scss
.my-component {
  padding: 16px;
  margin-bottom: 12px;
  background-color: #ffffff;
  border: 1px solid #dddbda;
  border-radius: 4px;
  color: #080707;
}
```

### In React Components

**PREFERRED: Use CSS Classes**
```jsx
// In SCSS file
.info-box {
  padding: $spacing-sm;
  background-color: $token-color-surface;
}

// In JSX
<div className="info-box">{content}</div>
```

**If inline styles are necessary:**
```jsx
<div style={{ 
  padding: 'var(--token-space-12)',
  backgroundColor: 'var(--token-layer-surface)'
}}>
```

---

## 3. Component Development Rules

### Component Structure

```jsx
// 1. Imports (grouped)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { utilityFunction } from '../../utils/helpers';

// 2. Component definition with clear JSDoc
/**
 * ComponentName - Brief description
 * 
 * @param {string} prop1 - Description
 * @param {function} prop2 - Description
 */
const ComponentName = ({ prop1, prop2 }) => {
  // 3. State declarations
  const [state, setState] = useState(null);

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 5. Event handlers
  const handleEvent = () => {
    // Handler logic
  };

  // 6. Render
  return (
    <div className="component-name">
      {/* Component JSX */}
    </div>
  );
};

// 7. PropTypes
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func
};

// 8. Export
export default ComponentName;
```

### Styling Rules

1. **Create CSS classes, not inline styles**
2. **Use design tokens exclusively**
3. **Follow BEM-like naming**: `.component-name__element--modifier`
4. **Keep styles in component-specific SCSS files or main Calculator.scss**

### Component Placement

**Calculator Components:**
- **Calculator components** → `frontend/src/components/calculator/`
- **BTL-specific** → `frontend/src/components/calculator/btl/`
- **Bridging-specific** → `frontend/src/components/calculator/bridging/`
- **Shared calculator** → `frontend/src/components/calculator/shared/`

**UI Components:**
- **Generic UI** → `frontend/src/components/ui/` (Buttons, Inputs, Spinners)
- **Modals** → `frontend/src/components/modals/` (Modal dialogs)
- **Tables** → `frontend/src/components/tables/` (Data tables)

**Layout Components:**
- **Layout** → `frontend/src/components/layout/`
  - `AppShell.jsx` - Main app wrapper
  - `SalesforceNav.jsx` - Navigation header
  - `Breadcrumbs.jsx` - Breadcrumb navigation
  - `AppNav.jsx` - ⚠️ DEPRECATED (use SalesforceNav)

**Shared Components:**
- **Shared** → `frontend/src/components/shared/`
  - `SalesforceIcon.jsx` - Icon component
  - `WelcomeHeader.jsx` - Page header with user greeting
  - `UWRequirementsChecklist.jsx` - Underwriting checklist

**Other:**
- **PDF components** → `frontend/src/components/pdf/`
- **Page components** → `frontend/src/pages/` (Full page components)
- **Feature components** → `frontend/src/features/[feature-name]/components/`

---

## 4. State Management

### Available Context Providers

The app uses React Context API for global state. **ALWAYS** use these contexts instead of prop drilling:

```jsx
// Available Contexts (frontend/src/contexts/)
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

// Usage in components
const { user, token, permissions, login, logout } = useAuth();
const { supabase } = useSupabase();
const { showToast, removeToast } = useToast();
const { themeMode, setThemeMode, isDark } = useTheme();
const { settings, updateSetting } = useAccessibility();
```

#### Context Details

**AuthContext** - Authentication and session management
- `user` - Current user object
- `token` - JWT token
- `permissions` - User permissions object
- `login()`, `logout()`, `register()` - Auth functions
- Permission checks: `canViewAdminPanel`, `canEditRates`, etc.

**SupabaseContext** - Database client
- `supabase` - Supabase client instance
- Used for direct database queries

**ToastContext** - Toast notifications
- `showToast({ kind, title, subtitle })` - Display notification
- `removeToast(id)` - Remove notification
- Kinds: `'success'`, `'error'`, `'warning'`, `'info'`

**ThemeContext** - Theme management
- `themeMode` - `'light'`, `'dark'`, or `'system'`
- `setThemeMode(mode)` - Update theme
- `isDark` - Boolean for dark mode state

**AccessibilityContext** - Accessibility preferences
- `settings` - All accessibility settings
- `updateSetting(key, value)` - Update setting
- `resetSettings()` - Reset to defaults

### Use Custom Hooks

For complex state logic, create custom hooks:

```jsx
// ✅ CORRECT: frontend/src/hooks/calculator/useBrokerSettings.js
export default function useBrokerSettings(initialQuote) {
  const [settings, setSettings] = useState({});
  
  return {
    settings,
    updateSettings,
    resetSettings
  };
}
```

#### Available Custom Hooks

**Calculator Hooks** (`frontend/src/hooks/calculator/`):
- `useBrokerSettings` - Broker commission settings
- `useResultsLabelAlias` - Customize result labels
- `useResultsRowOrder` - Result row ordering
- `useResultsVisibility` - Show/hide result rows

**General Hooks** (`frontend/src/hooks/`):
- `useDashboardData` - Dashboard metrics
- `useHeaderColors` - Dynamic header colors
- `useKeyboardShortcut` - Keyboard shortcuts
- `useTypography` - Typography preferences
- `useUiPreferences` - UI customization
- `useUWRequirements` - Underwriting requirements

### Don't Prop Drill

Use React Context for deeply nested state:

```jsx
// frontend/src/contexts/CalculatorContext.jsx
export const CalculatorContext = createContext();
```

---

## 5. Utility Functions

### Location
All utility functions go in `frontend/src/utils/`

### Organization
```
utils/
├── calculator/
│   ├── numberFormatting.js
│   ├── rateFiltering.js
│   └── calculations.js
├── pdf/
│   └── dipHelpers.js
├── validation.js
└── formatters.js
```

### Pure Functions
```jsx
// ✅ CORRECT: Pure function
export const formatCurrency = (value) => {
  return Number(value).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP'
  });
};

// ❌ WRONG: Side effects
export const formatCurrency = (value) => {
  console.log('Formatting:', value); // Side effect!
  return formatted;
};
```

---

## 6. Documentation Requirements

### When to Create Documentation

**DO create docs for:**
- New features (in `docs/features/`)
- Implementation guides (in `docs/guides/`)
- Architecture decisions (in `docs/architecture/`)
- API documentation (in `docs/api/`)

**DO NOT create docs for:**
- Small bug fixes
- Minor UI tweaks
- Code cleanup
- Single-component changes

### Documentation Template

```markdown
# Feature Name

## Overview
Brief description (2-3 sentences)

## Implementation
- Key changes made
- Files modified
- New components added

## Usage
How to use the feature

## Technical Details
- State management approach
- Data flow
- Integration points

## Testing
How to test the feature

## Related Files
- `path/to/file1.jsx`
- `path/to/file2.scss`
```

### Naming Convention
```
✅ CORRECT:
docs/features/broker-commission-validation.md
docs/guides/adding-new-calculator-field.md
docs/architecture/pdf-generation-system.md

❌ WRONG:
BROKER_COMMISSION_IMPLEMENTATION_SUMMARY.md (root)
CALCULATOR_FIELD_GUIDE_COMPLETE.md (root)
```

---

## 7. Code Quality Standards

### Naming Conventions

```jsx
// Components: PascalCase
const BrokerCommissionField = () => {};

// Functions: camelCase
const calculateCommission = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_COMMISSION_PERCENT = 2.5;

// CSS Classes: kebab-case with BEM
.broker-commission-field
.broker-commission-field__label
.broker-commission-field__input--disabled
```

### Comments

```jsx
// ✅ GOOD: Explains WHY
// Use absolute positioning to overlay the validation icon
// because relative positioning breaks the grid layout
position: absolute;

// ❌ BAD: Explains WHAT (obvious from code)
// Set position to absolute
position: absolute;
```

### Error Handling

```jsx
// ✅ CORRECT: Proper error handling
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  showToast({ 
    kind: 'error', 
    title: 'Failed to load data', 
    subtitle: error.message 
  });
  console.error('Data fetch error:', error);
}

// ❌ WRONG: Silent failure
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  // Nothing
}
```

---

## 8. Testing Requirements

### Unit Tests Location
```
backend/__tests__/         # Backend tests
frontend/src/**/*.test.js  # Component tests (co-located)
```

### What to Test
- Utility functions (all)
- Complex calculations (all)
- API routes (all)
- Critical user flows
- Edge cases

### What NOT to Test
- Simple presentational components
- Third-party library wrappers
- Obvious getters/setters

---

## 9. Git Commit Standards

### Commit Message Format
```
type(scope): brief description

Detailed explanation of what and why (not how)

Related: #issue-number
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `style`: CSS/formatting changes
- `docs`: Documentation only
- `test`: Test additions/changes
- `chore`: Build/tooling changes

### Examples
```
✅ GOOD:
feat(calculator): add broker commission validation
fix(btl): correct LTV calculation for retention loans
refactor(pdf): extract DIP helpers into utility file

❌ BAD:
Updated files
Fixed bug
Changes
```

---

## 10. Common Pitfalls to Avoid

### ❌ DON'T:
1. Create MD files in root directory
2. Use hardcoded colors, spacing, or sizes
3. Use inline styles without design tokens
4. Create components without PropTypes
5. Leave console.logs in production code
6. Copy-paste code without refactoring
7. Mix business logic in UI components
8. Skip error handling
9. Forget to clean up useEffect hooks
10. Use `any` or suppress TypeScript errors

### ✅ DO:
1. Place docs in `/docs` directory
2. Use design tokens exclusively
3. Create CSS classes with tokens
4. Document component props
5. Use proper logging (backend) or toast notifications (frontend)
6. Extract reusable logic into utilities/hooks
7. Separate concerns (UI vs logic)
8. Handle all error cases
9. Return cleanup functions from useEffects
10. Fix type issues properly

---

## 11. Performance Guidelines

### React Components

```jsx
// ✅ GOOD: Memoized expensive calculation
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ GOOD: Memoized callback
const handleChange = useCallback((value) => {
  updateValue(value);
}, [updateValue]);

// ❌ BAD: Inline function in render
<Component onChange={(val) => updateValue(val)} />
```

### State Updates

```jsx
// ✅ GOOD: Batch related updates
setState(prev => ({
  ...prev,
  field1: value1,
  field2: value2
}));

// ❌ BAD: Multiple separate updates
setField1(value1);
setField2(value2);
```

---

## 12. Accessibility Requirements

### Required for ALL interactive elements:

```jsx
// ✅ CORRECT
<button 
  aria-label="Close modal"
  onClick={handleClose}
>
  <CloseIcon />
</button>

<input 
  id="commission-input"
  aria-describedby="commission-help"
  aria-invalid={hasError}
/>
<span id="commission-help">Enter percentage</span>
```

### Form Fields
- Always associate labels with inputs
- Provide helper text with `aria-describedby`
- Show error states with `aria-invalid`
- Use semantic HTML elements

---

## 13. Project-Specific Context

### This is a Calculator Application

**Purpose**: Buy-to-Let (BTL) and Bridging loan calculators with quote generation.

**Key Features**:
- Multi-step calculator forms
- Rate comparison tables
- PDF generation (Quote and DIP documents)
- Broker commission management
- Client details management
- Supabase backend integration

### Key Technologies
- **Frontend**: React, SCSS, Salesforce Lightning Design System
- **Backend**: Node.js, Express, Supabase
- **PDF**: @react-pdf/renderer
- **State**: React hooks + custom hooks
- **Styling**: Design tokens + SCSS

### Business Logic Location
- Calculator engines: `frontend/src/utils/calculator/`
- BTL calculations: `btlCalculationEngine.js`
- Bridging calculations: `bridgingCalculationEngine.js`
- PDF helpers: `frontend/src/components/pdf/utils/`

---

## 14. Quick Reference Checklist

Before submitting any code change:

- [ ] All documentation in `/docs` directory (not root)
- [ ] All styles use design tokens (no hardcoded values)
- [ ] CSS classes created instead of inline styles
- [ ] Component has PropTypes defined
- [ ] Utility functions are pure (no side effects)
- [ ] Error handling implemented
- [ ] useEffect cleanup functions added where needed
- [ ] Console.logs removed
- [ ] Accessibility attributes added
- [ ] Code follows naming conventions
- [ ] No duplicate code (DRY principle)
- [ ] Commit message follows format

---

## 15. Navigation System

### Primary Navigation

**Component**: `SalesforceNav.jsx` (main header)

**Structure**:
- Left: Logo + Dropdowns (Calculators, Admin)
- Right: My Quotes link + User Profile button

**Usage**:
```jsx
import SalesforceNav from './components/layout/SalesforceNav';

<SalesforceNav />
```

**Dropdowns**:
- **Calculators**: BTL, Bridging, Products
- **Admin** (permission-based): Dashboard, Users, Rates, Support

### Route Protection

```jsx
import ProtectedRoute from './pages/ProtectedRoute';

<Route path="/admin" element={
  <ProtectedRoute requiredPermission="viewAdminPanel">
    <AdminPage />
  </ProtectedRoute>
} />
```

**Available Permissions**:
- `viewAdminPanel` - Access admin section
- `editRates` - Modify rate tables
- `manageUsers` - User management
- `viewReports` - Access reporting
- `editCalculators` - Modify calculator settings

---

## 16. User Settings & Preferences

### Settings Page Features

Location: `/settings` (`SettingsPage.jsx`)

**Theme Settings**:
- Light mode
- Dark mode
- System preference

**Accessibility Options**:
- ✅ Reduced motion (disable animations)
- ✅ High contrast mode
- ✅ Enhanced focus indicators
- ✅ Font size adjustment (small/medium/large/x-large)
- ✅ Increased text spacing
- ✅ Always underline links

### Implementation

**Storage**: localStorage keys
- `app.theme.mode` - Theme preference
- `app.accessibility.settings` - Accessibility settings

**Context**: `AccessibilityContext.jsx`

**CSS Classes**:
```scss
// Applied to <html> element
.reduced-motion     // Disables animations
.high-contrast      // Enhanced contrast
.focus-indicators   // Enhanced focus rings
.text-spacing       // Increased spacing
.link-underlines    // Always underline links
.font-size-[size]   // Font size override
```

---

## 17. Admin Section

### Admin Pages Structure

```
/admin                    → AdminLandingPage.jsx (Dashboard)
/admin/users              → UsersPage.jsx (User management)
/admin/rates              → AdminPage.jsx (Rate configuration)
/admin/support            → SupportRequestsPage.jsx (Support tickets)
```

### Dashboard Features (AdminLandingPage)

**System Metrics Cards**:
- Total users
- Active brokers
- Quotes this month
- Support requests

**Admin Tools**:
- User management
- Rate management
- Constants management
- Support requests
- API keys
- System reports

### Standard Admin Page Container

```jsx
// ✅ CORRECT: Use page-container class
<div className="page-container">
  <h1>Page Title</h1>
  {/* content */}
</div>

// For tables, add modifier
<div className="page-container page-container--table">
```

### Admin Component Styling

**Table Containers**: Use `admin-tables.css`
- `.admin-table-container` - Standard table wrapper
- Border radius: `var(--token-radius-md)`
- Background: `var(--token-layer-surface)`

---

## 18. Quotes System

### Overview

Location: `/quotes` (QuotesList component)

**Features**:
- View all saved quotes (BTL & Bridging)
- Filter by product type
- "My Quotes" filter (user-specific)
- Search by reference, client name
- Sort by date, type, client
- Export to PDF (Client Quote + DIP)
- Issue DIP from quote

### Database Schema

**Tables**: `quotes` (BTL), `bridge_quotes` (Bridging)

**Key Fields**:
```sql
user_id          UUID       -- Auth user ID (current)
created_by_id    TEXT       -- User identifier (backwards compat)
reference_number TEXT       -- Quote reference (e.g., POL-12345)
client_name      TEXT       -- Client/borrower name
product_type     TEXT       -- 'btl' or 'bridging'
created_at       TIMESTAMP  -- Creation date
quote_data       JSONB      -- Full calculation data
```

### Filtering Logic

```jsx
// "My Quotes" checks both user_id and created_by_id
const myQuotes = quotes.filter(q => 
  q.user_id === user.id || q.created_by_id === user.id
);
```

### Quote Actions

- **View** - Open quote details
- **Export PDF** - Generate client quote PDF
- **Issue DIP** - Create DIP document
- **Delete** - Remove quote

---

## 19. When in Doubt

1. **Check existing code** for similar patterns
2. **Look in `/docs`** for implementation guides
3. **Review `TOKEN_SYSTEM.md`** for styling
4. **Check `frontend/src/components/calculator/`** for component examples
5. **Review contexts** in `frontend/src/contexts/` for available state
6. **Check custom hooks** in `frontend/src/hooks/` for existing utilities
7. **Ask before creating new patterns** that differ from existing code

---

## 20. Final Note

Following these guidelines ensures:
- ✅ Consistent code quality
- ✅ Easy maintenance
- ✅ Clear project structure
- ✅ Minimal technical debt
- ✅ Happy developers

**When you follow these rules, you won't need cleanup every 2 days!**
