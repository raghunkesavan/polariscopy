# Error Boundary Implementation

## Overview
Comprehensive error handling has been implemented using React Error Boundaries to prevent entire page crashes when component errors occur.

## Architecture

### 1. Enhanced ErrorBoundary Component
**Location**: `frontend/src/components/ErrorBoundary.jsx`

**Features**:
- ✅ Catches JavaScript errors in child components
- ✅ Logs errors to console (development) and can send to error tracking services (production)
- ✅ Provides "Try Again" and "Reload Page" buttons
- ✅ Shows detailed error stack in development mode only
- ✅ Supports custom fallback components via props
- ✅ Styled with Salesforce Lightning Design System (SLDS)

**Props**:
- `fallback` - Custom fallback UI (component or function)
- `title` - Custom error title
- `message` - Custom error message
- `children` - Components to wrap

**Usage**:
```jsx
<ErrorBoundary title="Custom Error" message="Something went wrong">
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// With function fallback
<ErrorBoundary fallback={({ error, reset }) => <CustomUI error={error} onReset={reset} />}>
  <YourComponent />
</ErrorBoundary>
```

### 2. Specialized Fallback Components
**Location**: `frontend/src/components/ErrorFallbacks.jsx`

#### CalculatorErrorFallback
- Used for calculator pages (BTL, Bridging)
- User-friendly message about data safety
- Options: Try Again, Go Home, Reload Page
- Shows illustration and detailed error in dev mode

#### RatesErrorFallback
- Used for Rates and Criteria admin pages
- Alert notification style
- Options: Retry, Reload Page
- Emphasizes connection/data format issues

#### QuotesErrorFallback
- Used for Quotes List page
- Media object layout with warning icon
- Options: Try Again, Create New Quote
- Helpful for connection failures

#### InlineErrorFallback
- Lightweight error for small components
- Warning notification style
- Minimal UI footprint

## Implementation in App.jsx

### Multi-Level Error Boundaries

```jsx
<ErrorBoundary title="Application Error">           {/* Root level */}
  <div className="app-shell">
    <ErrorBoundary>                                 {/* Navigation level */}
      <Navigation />
    </ErrorBoundary>
    
    <Content>
      <Routes>
        <Route path="/calculator" element={
          <ErrorBoundary fallback={CalculatorErrorFallback}>  {/* Route level */}
            <Calculator />
          </ErrorBoundary>
        } />
        
        <Route path="/rates" element={
          <ErrorBoundary fallback={<RatesErrorFallback />}>
            <RatesTable />
          </ErrorBoundary>
        } />
        
        {/* Other routes... */}
      </Routes>
    </Content>
  </div>
</ErrorBoundary>
```

### Protection Layers

1. **Root Boundary** (App level)
   - Catches catastrophic errors
   - Prevents white screen of death
   - Shows generic error message

2. **Navigation Boundary**
   - Keeps navigation functional even if it errors
   - Allows user to navigate away from broken page

3. **Route Boundaries** (Page level)
   - Page-specific error handling
   - Custom fallback UIs per page type
   - Other pages remain functional

## What Error Boundaries Catch

✅ **Will Catch**:
- Render errors in components
- Errors in lifecycle methods
- Errors in constructors
- Errors in React event handlers (since React 17)

❌ **Won't Catch**:
- Errors in async code (use try/catch)
- Errors in event handlers (use try/catch)
- Server-side rendering errors
- Errors in the error boundary itself

## Testing Error Boundaries

### Manual Testing
Create a test component that throws an error:

```jsx
// TestError.jsx
import { useState } from 'react';

export function TestError() {
  const [shouldError, setShouldError] = useState(false);
  
  if (shouldError) {
    throw new Error('Test error for Error Boundary');
  }
  
  return (
    <div>
      <h2>Test Error Component</h2>
      <button onClick={() => setShouldError(true)}>
        Trigger Error
      </button>
    </div>
  );
}

// Use it:
<ErrorBoundary fallback={CalculatorErrorFallback}>
  <TestError />
</ErrorBoundary>
```

### Development Testing
1. Open any page (e.g., Calculator)
2. Open Browser DevTools Console
3. Paste and run:
   ```javascript
   throw new Error('Test error');
   ```
4. Error boundary should catch and display fallback UI

## Production Error Logging

To send errors to a tracking service (Sentry, LogRocket, etc.):

```jsx
// In ErrorBoundary.jsx componentDidCatch method
componentDidCatch(error, info) {
  console.error('ErrorBoundary caught an error:', error, info);
  
  this.setState({ error, info });
  
  // Send to error tracking service in production
  if (import.meta.env.PROD) {
    // Example: Sentry
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: info.componentStack
    //     }
    //   }
    // });
    
    // Example: LogRocket
    // LogRocket.captureException(error, {
    //   tags: { source: 'error-boundary' },
    //   extra: { componentStack: info.componentStack }
    // });
  }
}
```

## Best Practices

### 1. Granular Boundaries
Place error boundaries at multiple levels for better isolation:
- **Root**: Prevents total app crash
- **Page**: Isolates page-level errors
- **Section**: Protects critical sections (e.g., payment forms)
- **Component**: Wraps complex/risky components

### 2. User-Friendly Messages
- ✅ "Your data is safe"
- ✅ "Try again" or "Reload" options
- ✅ Alternative actions (e.g., "Go to Home")
- ❌ Avoid technical jargon in production

### 3. Development vs Production
- **Dev**: Show full error stack and component trace
- **Prod**: Hide technical details, show user-friendly message

### 4. Recovery Actions
Always provide at least two recovery options:
1. **Try Again** - Reset error boundary state
2. **Reload Page** - Fresh start
3. **Navigate Away** - Alternative action

### 5. Complementary Error Handling
Error boundaries don't replace:
- Try/catch for async operations
- `.catch()` for promises
- Error handling in event handlers

```jsx
// Still need try/catch for async
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    setError(error.message);
  }
}

// Still need try/catch in event handlers
function handleClick() {
  try {
    riskyOperation();
  } catch (error) {
    console.error('Click handler error:', error);
  }
}
```

## Future Enhancements

### 1. Error Reporting Dashboard
Track error frequency and patterns:
```jsx
// Send errors to backend analytics
await fetch('/api/errors/report', {
  method: 'POST',
  body: JSON.stringify({
    error: error.toString(),
    componentStack: info.componentStack,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  })
});
```

### 2. User Feedback
Allow users to report what they were doing:
```jsx
<ErrorBoundary fallback={({ error, reset }) => (
  <div>
    <h2>Error occurred</h2>
    <textarea placeholder="What were you trying to do?"></textarea>
    <button onClick={submitFeedback}>Send Feedback</button>
  </div>
)}>
```

### 3. Retry with Exponential Backoff
For network-related errors:
```jsx
const [retryCount, setRetryCount] = useState(0);

function handleRetry() {
  if (retryCount < 3) {
    setTimeout(() => {
      reset();
      setRetryCount(prev => prev + 1);
    }, Math.pow(2, retryCount) * 1000); // 1s, 2s, 4s
  }
}
```

## Troubleshooting

### Error Boundary Not Catching Errors
**Problem**: Error boundary doesn't catch the error

**Solutions**:
1. Check if error is in async code (not caught by error boundaries)
2. Verify error boundary is ancestor of erroring component
3. Check if error is in event handler (needs try/catch)

### Error Loop
**Problem**: Error boundary itself causes errors

**Solution**: Ensure fallback UI is simple and doesn't depend on broken state

### Development Mode Shows Two Errors
**Problem**: React shows error twice in dev console

**Reason**: React intentionally shows errors in dev mode even when caught by error boundary

**Solution**: This is expected behavior in development

## Summary

✅ **Implemented**:
- Enhanced ErrorBoundary with reset functionality
- 4 specialized fallback components
- Multi-level error boundaries in App.jsx
- Development vs production error display
- User-friendly recovery options

✅ **Benefits**:
- App doesn't crash from component errors
- Users get clear recovery options
- Errors are logged for debugging
- Better user experience
- Easier to maintain and debug

✅ **Next Steps**:
- Add error tracking service (Sentry/LogRocket)
- Implement error reporting dashboard
- Add user feedback mechanism
- Monitor error patterns in production
