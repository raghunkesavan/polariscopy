# Component Development Guidelines
**Polaris Test - SF Calculator**  
**Last Updated:** December 4, 2025

---

## Table of Contents
1. [Core Development Principles](#core-development-principles)
2. [Component Architecture](#component-architecture)
3. [SLDS Integration](#slds-integration)
4. [State Management](#state-management)
5. [Performance Best Practices](#performance-best-practices)
6. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
7. [Code Quality Standards](#code-quality-standards)

---

## Core Development Principles

### 1. **Think Long-Term, Not Quick-Fix**
- **DON'T** write code just to fix the immediate issue
- **DO** consider how your change affects the entire codebase
- **DON'T** duplicate existing functionality
- **DO** refactor and consolidate when you see duplication

### 2. **SLDS Framework First**
- **ALWAYS** check SLDS documentation before creating custom components
- **USE** SLDS components as the foundation
- **EXTEND** SLDS when you need customization
- **NEVER** recreate what SLDS already provides

### 3. **Design Tokens Only**
- **NEVER** hardcode colors, spacing, or font sizes
- **ALWAYS** use CSS custom properties from `tokens.scss`
- **THINK** about maintainability - tokens make theme changes easy

### 4. **Component Reusability**
- **DON'T** copy-paste component code
- **DO** create reusable components
- **DON'T** write one-off solutions
- **DO** think about where else this might be needed

---

## Component Architecture

### Component File Structure
```
src/
├── components/
│   ├── common/          # Reusable components
│   │   ├── Button/      # One component per folder
│   │   │   ├── Button.jsx
│   │   │   ├── Button.test.jsx
│   │   │   └── index.js
│   │   └── Modal/
│   │       ├── Modal.jsx
│   │       └── index.js
│   ├── calculator/      # Calculator-specific components
│   │   ├── BTLCalculator.jsx
│   │   └── BridgingCalculator.jsx
│   └── admin/           # Admin-specific components
│       ├── RatesTable.jsx
│       └── UsersTable.jsx
├── styles/
│   ├── slds.css         # Core SLDS framework
│   ├── utilities.css    # Utility classes
│   ├── Calculator.scss  # Calculator-specific styles
│   └── admin-tables.css # Admin-specific styles
```

### Component Structure Template

#### ✅ GOOD Component Structure
```jsx
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * MyComponent - Brief description of what this component does
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Title to display
 * @param {Function} props.onSave - Callback when save is clicked
 * @param {boolean} props.isLoading - Loading state
 */
const MyComponent = ({ title, onSave, isLoading = false }) => {
  // 1. State declarations
  const [localState, setLocalState] = useState('');

  // 2. Memoized values
  const processedData = useMemo(() => {
    // Expensive computation here
    return localState.toUpperCase();
  }, [localState]);

  // 3. Callbacks
  const handleSave = useCallback(() => {
    if (localState) {
      onSave(localState);
    }
  }, [localState, onSave]);

  // 4. Render
  return (
    <div className="slds-card">
      <header className="slds-card__header">
        <h2 className="slds-text-heading_medium">{title}</h2>
      </header>
      <div className="slds-card__body slds-card__body_inner">
        <div className="slds-form-element">
          <label className="slds-form-element__label" htmlFor="input-01">
            Label
          </label>
          <div className="slds-form-element__control">
            <input
              type="text"
              id="input-01"
              className="slds-input"
              value={localState}
              onChange={(e) => setLocalState(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      <footer className="slds-card__footer">
        <button
          className="slds-button slds-button_brand"
          onClick={handleSave}
          disabled={isLoading || !localState}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </footer>
    </div>
  );
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default MyComponent;
```

#### ❌ BAD Component Structure
```jsx
// ❌ DON'T DO THIS!
const MyComponent = (props) => {
  // No prop destructuring
  // No documentation
  // Inline styles
  // No prop types
  // Hardcoded values
  
  return (
    <div style={{ padding: '20px', background: '#fff' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
        {props.title}
      </h2>
      <button 
        style={{ background: '#0176d3', color: 'white', padding: '8px 16px' }}
        onClick={props.onSave}
      >
        Save
      </button>
    </div>
  );
};
```

---

## SLDS Integration

### Using SLDS Components

#### Buttons - ALWAYS Use SLDS
```jsx
// ✅ GOOD
<button className="slds-button slds-button_brand">Primary Action</button>
<button className="slds-button slds-button_neutral">Cancel</button>
<button className="slds-button slds-button_destructive">Delete</button>

// ❌ BAD
<button className="custom-button">Primary Action</button>
<button style={{ background: '#0176d3' }}>Primary Action</button>
```

#### Forms - ALWAYS Use SLDS Structure
```jsx
// ✅ GOOD
<div className="slds-form" role="list">
  <div className="slds-form__row">
    <div className="slds-form__item" role="listitem">
      <div className="slds-form-element">
        <label className="slds-form-element__label" htmlFor="firstName">
          <abbr className="slds-required" title="required">*</abbr>
          First Name
        </label>
        <div className="slds-form-element__control">
          <input
            type="text"
            id="firstName"
            className="slds-input"
            required
          />
        </div>
      </div>
    </div>
    <div className="slds-form__item" role="listitem">
      <div className="slds-form-element">
        <label className="slds-form-element__label" htmlFor="lastName">
          Last Name
        </label>
        <div className="slds-form-element__control">
          <input
            type="text"
            id="lastName"
            className="slds-input"
          />
        </div>
      </div>
    </div>
  </div>
</div>

// ❌ BAD - Don't create custom form structure
<div className="custom-form">
  <div className="form-row">
    <input type="text" placeholder="First Name" />
    <input type="text" placeholder="Last Name" />
  </div>
</div>
```

#### Modals - ALWAYS Use SLDS Modal
```jsx
// ✅ GOOD
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div>
      <div className="slds-backdrop slds-backdrop_open"></div>
      <section className="slds-modal slds-fade-in-open" role="dialog">
        <div className="slds-modal__container">
          <header className="slds-modal__header">
            <button
              className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
              onClick={onClose}
            >
              <svg className="slds-button__icon slds-button__icon_large">
                <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
              </svg>
              <span className="slds-assistive-text">Close</span>
            </button>
            <h2 className="slds-text-heading_medium">{title}</h2>
          </header>
          <div className="slds-modal__content slds-p-around_medium">
            {children}
          </div>
          <footer className="slds-modal__footer">
            <button className="slds-button slds-button_neutral" onClick={onClose}>
              Cancel
            </button>
            <button className="slds-button slds-button_brand">
              Save
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
};

// ❌ BAD - Don't create custom modal structure
<div className="modal-backdrop" onClick={onClose}>
  <div className="modal-content" style={{ width: '500px', padding: '20px' }}>
    <h2>{title}</h2>
    {children}
    <button onClick={onClose}>Close</button>
  </div>
</div>
```

#### Admin Tables - ALWAYS Use Professional Table Styling

**CRITICAL:** All admin tables (users, rates, API keys, quotes, etc.) MUST use the standardized `professional-table` styling from `admin-tables.css` for consistency across the application.

```jsx
// ✅ GOOD - Professional Admin Table
import '../../styles/admin-tables.css';

function MyAdminTable() {
  return (
    <div className="table-wrapper">
      <table className="professional-table">
        <thead>
          <tr>
            <th className="sortable sorted-asc" onClick={() => handleSort('name')}>
              Name
            </th>
            <th className="sortable" onClick={() => handleSort('created')}>
              Created
            </th>
            <th className="sticky-action">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td><strong>{item.name}</strong></td>
              <td>{formatDate(item.created_at)}</td>
              <td className="sticky-action">
                <div className="row-actions">
                  <button className="slds-button slds-button_neutral">
                    Edit
                  </button>
                  <button className="slds-button slds-button_destructive">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ❌ BAD - Using SLDS table classes directly for admin tables
<table className="slds-table slds-table_bordered">
  <thead>
    <tr className="slds-line-height_reset">
      <th scope="col">
        <div className="slds-truncate">Name</div>
      </th>
    </tr>
  </thead>
</table>
```

**Key Features of Professional Tables:**
- **Sticky Actions Column:** Use `className="sticky-action"` on the last column header and cells
- **Sortable Headers:** Add `className="sortable"` to enable sorting, plus `sorted-asc` or `sorted-desc` for active sort
- **Hover Effects:** Automatic row hover highlighting via `admin-tables.css`
- **Consistent Spacing:** All padding/margins use design tokens
- **Dark Mode Support:** Full theme compatibility through token system
- **Table Wrapper:** Always wrap tables in `<div className="table-wrapper">` for scrolling and shadow effects

**Examples in Codebase:**
- BTL Rates Table: `components/admin/RatesTable.jsx`
- API Keys Table: `components/admin/ApiKeysManagement.jsx`
- Users Table: `components/admin/UsersTable.jsx`

---

## State Management

### Local State Best Practices

#### ✅ GOOD - Clear State Management
```jsx
const Calculator = () => {
  // Group related state
  const [formData, setFormData] = useState({
    loanAmount: 0,
    ltv: 75,
    term: 12
  });
  
  const [uiState, setUiState] = useState({
    isLoading: false,
    error: null,
    results: null
  });

  // Update specific fields
  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle async operations
  const calculateRates = async () => {
    setUiState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/rates', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      const results = await response.json();
      setUiState(prev => ({ ...prev, results, isLoading: false }));
    } catch (error) {
      setUiState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  };

  return (/* JSX */);
};
```

#### ❌ BAD - Scattered State
```jsx
// ❌ DON'T DO THIS!
const Calculator = () => {
  const [loanAmount, setLoanAmount] = useState(0);
  const [ltv, setLtv] = useState(75);
  const [term, setTerm] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  // Too many individual state variables!
};
```

### Context Usage
```jsx
// ✅ GOOD - Use context for shared state
import { useSupabase } from './contexts/SupabaseContext';

const MyComponent = () => {
  const { supabase, session } = useSupabase();
  
  // Component logic
};
```

---

## Performance Best Practices

### 1. Memoization

#### Use useMemo for Expensive Computations
```jsx
// ✅ GOOD
const expensiveData = useMemo(() => {
  return processLargeDataset(rawData);
}, [rawData]);

// ❌ BAD - Recalculates every render
const expensiveData = processLargeDataset(rawData);
```

#### Use useCallback for Function Props
```jsx
// ✅ GOOD
const handleSave = useCallback((data) => {
  saveToDatabase(data);
}, []);

// ❌ BAD - Creates new function every render
const handleSave = (data) => {
  saveToDatabase(data);
};
```

### 2. Avoid Unnecessary Re-renders
```jsx
// ✅ GOOD - React.memo for pure components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex render */}</div>;
});

// ✅ GOOD - Condition rendering at top level
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

return <ActualContent />;
```

### 3. Lazy Loading
```jsx
// ✅ GOOD - Lazy load heavy components
const HeavyAdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <HeavyAdminPanel />
  </Suspense>
);
```

---

## Common Pitfalls to Avoid

### Pitfall 1: Inline Styles
```jsx
// ❌ BAD - Creates new object every render
<div style={{ display: 'flex', gap: '8px' }}>

// ✅ GOOD - Use CSS class
<div className="display-flex gap-2">
```

### Pitfall 2: Hardcoded Values
```jsx
// ❌ BAD
<button style={{ padding: '8px 16px', background: '#0176d3' }}>

// ✅ GOOD
<button className="slds-button slds-button_brand">
```

### Pitfall 3: Duplicating Existing Components
```jsx
// ❌ BAD - Creating custom table when SLDS table exists
<table className="my-custom-table">

// ✅ GOOD - Use SLDS table
<table className="slds-table slds-table_bordered">
```

### Pitfall 4: Not Handling Loading/Error States
```jsx
// ❌ BAD - No loading or error handling
const MyComponent = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData);
  }, []);
  
  return <div>{data.value}</div>; // Crashes if data is null!
};

// ✅ GOOD - Proper state handling
const MyComponent = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <div>No data available</div>;
  
  return <div>{data.value}</div>;
};
```

### Pitfall 5: Prop Drilling
```jsx
// ❌ BAD - Passing props through many levels
<GrandParent data={data}>
  <Parent data={data}>
    <Child data={data} />
  </Parent>
</GrandParent>

// ✅ GOOD - Use context for deeply nested props
const DataContext = React.createContext();

<DataContext.Provider value={data}>
  <GrandParent>
    <Parent>
      <Child /> {/* Uses useContext(DataContext) */}
    </Parent>
  </GrandParent>
</DataContext.Provider>
```

---

## Code Quality Standards

### 1. Documentation
```jsx
/**
 * CalculateRates - Fetches and calculates mortgage rates
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.loanAmount - Loan amount in GBP
 * @param {number} params.ltv - Loan-to-value ratio (0-100)
 * @param {number} params.term - Term in months
 * @returns {Promise<Array>} Array of rate objects
 */
export const calculateRates = async ({ loanAmount, ltv, term }) => {
  // Implementation
};
```

### 2. Prop Types
```jsx
MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })),
  isLoading: PropTypes.bool
};

MyComponent.defaultProps = {
  data: [],
  isLoading: false
};
```

### 3. Error Boundaries
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4. Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test Title" onSave={() => {}} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onSave when button clicked', () => {
    const onSave = jest.fn();
    render(<MyComponent title="Test" onSave={onSave} />);
    
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
```

---

## Pre-Commit Checklist

Before committing code, verify:

- [ ] No inline styles (except dynamic/PDF/SVG)
- [ ] All components use SLDS classes
- [ ] All values use design tokens
- [ ] PropTypes defined for all components
- [ ] Loading and error states handled
- [ ] No duplicate components or logic
- [ ] Responsive design works at all breakpoints
- [ ] Code is documented with JSDoc comments
- [ ] No console.log() statements left in code
- [ ] Component is reusable and maintainable

---

**Remember: We're building a professional application, not a quick prototype. Take the extra 5 minutes to do it right, and save hours of refactoring later!**
