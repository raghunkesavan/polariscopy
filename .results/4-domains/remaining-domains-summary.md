# Remaining Domains - Condensed Summary

## Routing Domain

### Pattern: React Router DOM v6
- Flat route structure (no nested routes)
- Protected routes use `<ProtectedRoute>` component with `requiredAccessLevel` prop
- Navigation state via `location.state` for passing data between routes
- Route paths: `/btl`, `/bridging`, `/quotes`, `/admin`, `/settings`, `/login`

### Example:
```jsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/btl" element={<ProtectedRoute requiredAccessLevel={4} />}>
    <Route index element={<BTLCalculator />} />
  </Route>
</Routes>
```

---

## Data Layer Domain

### Pattern: Supabase for database, Express backend for additional services
- Frontend uses Supabase client from `SupabaseContext`
- Backend uses service role key for privileged operations
- No React Query or SWR - direct Supabase queries with useEffect
- Error handling via try-catch with toast notifications

### Example:
```javascript
const { supabase } = useSupabase();
const [quotes, setQuotes] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setQuotes(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load quotes', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  fetchQuotes();
}, [supabase]);
```

---

## Authentication Domain

### Pattern: Supabase Auth + JWT + RBAC
- 5-level access system: 1=Admin, 2=UW Team Lead, 3=Head of UW, 4=Underwriter, 5=Product Team
- AuthContext provides: `user`, `token`, `canEditCalculators()`, `isAdmin()`, etc.
- Token stored in localStorage (`auth_token`)
- Backend endpoints protected with JWT middleware

### Example:
```jsx
const { user, canEditCalculators, isAdmin } = useAuth();

if (!canEditCalculators()) {
  return <ReadOnlyView />;
}

if (isAdmin()) {
  return <AdminPanel />;
}
```

---

## PDF Generation Domain

### Pattern: @react-pdf/renderer (client-side), PDFKit (server-side)
- Client PDFs: Quote PDFs use `@react-pdf/renderer` components
- Server PDFs: DIP PDFs use PDFKit on backend (require server-side logic)
- Shared style files: `BTLQuoteStyles.js`, `BTLDIPStyles.js`
- PDF components: Modular sections (BrokerFeeSection, TitleInsuranceSection)

### Example:
```jsx
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';

const BTLQuotePDF = ({ quote, brokerSettings }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>{quote.client_name}</Text>
      </View>
      <View style={styles.body}>
        {/* Quote content */}
      </View>
    </Page>
  </Document>
);
```

---

## Admin Configuration Domain

### Pattern: Runtime-editable settings via admin panels
- Settings stored in `app_constants` table and localStorage
- Components: `Constants.jsx` (app settings), `RatesTable.jsx` (rate CRUD)
- Broker settings: Company name, proc fee, product lists, fee columns
- Settings reactivity via localStorage 'storage' events

### Example:
```jsx
const STORAGE_KEY = 'app.constants.override.v1';

const saveSettings = (newSettings) => {
  // Save to localStorage (immediate)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  
  // Save to Supabase (sync)
  await supabase.from('app_constants').upsert({
    category: 'broker_settings',
    product_lists: newSettings.productLists,
    fee_columns: newSettings.feeColumns,
  });
  
  // Trigger storage event for reactivity
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: JSON.stringify(newSettings),
  }));
};
```

---

## Testing Domain

### Pattern: Vitest + Testing Library
- Unit tests in `__tests__` directories
- Vitest for test runner (vitest.config.js)
- @testing-library/react for component tests
- Extensive calculation engine tests (>80% coverage)

### Example:
```javascript
import { describe, it, expect } from 'vitest';
import { computeBTLLoan } from '../btlCalculationEngine';

describe('BTL Calculation Engine', () => {
  it('should calculate gross loan from max LTV', () => {
    const result = computeBTLLoan({
      propertyValue: 500000,
      maxLtvInput: 75,
      loanType: 'Max gross loan',
      // ...
    });
    
    expect(result.grossLoan).toBe(375000);
    expect(result.ltv).toBe(0.75);
  });
});
```

---

## Design System Domain

### Pattern: Dual design system (Carbon + SLDS)
- Primary: Carbon Design System (@carbon/react)
- Secondary: SLDS utility classes (slds-button, slds-table, etc.)
- Design tokens sourced from Figma (figma.config.json)
- Token values pulled via scripts (pull-figma-tokens.mjs)

### Token System:
```css
/* All values use design tokens */
:root {
  --token-layer-background: #ffffff;
  --token-layer-surface: #f4f4f4;
  --token-text-primary: #161616;
  --token-spacing-small: 8px;
  --token-font-size-body: 14px;
}

[data-carbon-theme="g100"] {
  --token-layer-background: #161616;
  --token-layer-surface: #262626;
  --token-text-primary: #f4f4f4;
}

/* Use tokens in all CSS */
.my-component {
  background: var(--token-layer-surface);
  color: var(--token-text-primary);
  padding: var(--token-spacing-small);
}
```
