import React, { useEffect } from 'react';
const LazyApiKeys = React.lazy(() => import('./components/admin/ApiKeysManagement'));
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Removed Carbon Content/Theme; using SLDS + app styles
import Calculator from './components/calculators/Calculator';
import BTLCalculator from './components/calculators/BTL_Calculator';
import BridgingCalculator from './components/calculators/BridgingCalculator';
import QuotesList from './components/calculators/QuotesList';
import Canvas from './components/Canvas';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { 
  CalculatorErrorFallback, 
  QuotesErrorFallback 
} from './components/ui/ErrorFallbacks';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ToastProvider } from './contexts/ToastContext';
import AdminPage from './pages/AdminPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import SupportRequestsPage from './pages/SupportRequestsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import CalculatorLandingPage from './pages/CalculatorLandingPage';
import AdminLandingPage from './pages/AdminLandingPage';
import Products from './pages/Products';
import ProtectedRoute from './pages/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import { isEmbeddedMode } from './utils/embedding';
import useHeaderColors from './hooks/useHeaderColors';
import useTypography from './hooks/useTypography';
import './styles/index.scss';
import './styles/accessibility.css';
import './styles/utilities.css';
import './styles/FeatureIcons.css';
import './styles/typography-inter.css'; // Inter typography (toggled via body class)
import jwtDecode from 'jwt-decode';

// AppContent component to use theme context
const AppContent = () => {
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  
  // Load and apply header colors from Supabase
  useHeaderColors();
  
  // Initialize typography system (applies body class based on localStorage)
  useTypography();
  
  // Add keyboard shortcut to clear cache (Ctrl+Shift+R or Cmd+Shift+R)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        window.location.reload(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  // Public routes that shouldn't show navigation
  const isPublicRoute = ['/login', '/forgot-password', '/reset-password'].includes(location.pathname) ||
    location.pathname.startsWith('/calculator/public/');
  
  // Check if app is embedded (hides all navigation)
  const isEmbedded = isEmbeddedMode();
  
  // Show navigation only if NOT public route AND NOT embedded
  const showNavigation = !isPublicRoute && !isEmbedded;

  // Canvas route should render standalone without AppShell
  if (location.pathname === '/canvas') {
    return (
      <div data-theme={resolvedTheme}>
        <Canvas />
      </div>
    );
  }

  return (
    <div data-theme={resolvedTheme}>
      <UserProvider>
        <ErrorBoundary title="Application Error" message="The application encountered an unexpected error.">
          <AppShell>
            <div className="app-content">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* Public calculator routes - no authentication required */}
                <Route 
                  path="/calculator/public/residential" 
                  element={
                    <ErrorBoundary fallback={CalculatorErrorFallback}>
                      <BTLCalculator publicMode={true} fixedProductScope="Residential" fixedRange="specialist" />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/calculator/public/commercial" 
                  element={
                    <ErrorBoundary fallback={CalculatorErrorFallback}>
                      <BTLCalculator publicMode={true} fixedProductScope="Commercial" fixedRange="specialist" allowedScopes={['Commercial', 'Semi-Commercial']} />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/calculator/public/core-range" 
                  element={
                    <ErrorBoundary fallback={CalculatorErrorFallback}>
                      <BTLCalculator publicMode={true} fixedProductScope="Residential" fixedRange="core" />
                    </ErrorBoundary>
                  } 
                />
                
                {/* Settings - Protected route accessible to all authenticated users */}
                <Route path="/settings" element={<ProtectedRoute requiredAccessLevel={5} />}>
                  <Route 
                    index
                    element={
                      <ErrorBoundary>
                        <SettingsPage />
                      </ErrorBoundary>
                    } 
                  />
                </Route>
                
                {/* Protected calculator routes - require authentication */}
                <Route path="/calculator" element={<ProtectedRoute requiredAccessLevel={5} />}>
                  <Route 
                    path="btl" 
                    element={
                      <ErrorBoundary fallback={CalculatorErrorFallback}>
                        <BTLCalculator />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="bridging" 
                    element={
                      <ErrorBoundary fallback={CalculatorErrorFallback}>
                        <BridgingCalculator />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    index 
                    element={
                      <ErrorBoundary>
                        <CalculatorLandingPage />
                      </ErrorBoundary>
                    } 
                  />
                </Route>
                
                {/* Protected products page - require authentication */}
                <Route path="/products" element={<ProtectedRoute requiredAccessLevel={5} />}>
                  <Route 
                    path="btl"
                    element={
                      <ErrorBoundary>
                        <Products initialTab="btl" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="bridging"
                    element={
                      <ErrorBoundary>
                        <Products initialTab="bridging" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    index
                    element={
                      <ErrorBoundary>
                        <Products />
                      </ErrorBoundary>
                    } 
                  />
                </Route>
                
                {/* Protected quotes list - require authentication */}
                <Route path="/quotes" element={<ProtectedRoute requiredAccessLevel={5} />}>
                  <Route 
                    index
                    element={
                      <ErrorBoundary fallback={QuotesErrorFallback}>
                        <QuotesList />
                      </ErrorBoundary>
                    } 
                  />
                </Route>
                
                {/* Admin section with protected route - requires access level 1-5 except 4 (Underwriter) */}
                <Route path="/admin" element={<ProtectedRoute requiredAccessLevel={5} allowedAccessLevels={[1, 2, 3, 5]} />}>
                  <Route 
                    path="constants" 
                    element={
                      <ErrorBoundary>
                        <AdminPage tab="constants" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="criteria" 
                    element={
                      <ErrorBoundary>
                        <AdminPage tab="criteria" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="btl-rates" 
                    element={
                      <ErrorBoundary>
                        <AdminPage tab="btlRates" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="bridging-rates" 
                    element={
                      <ErrorBoundary>
                        <AdminPage tab="bridgingRates" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="global-settings" 
                    element={
                      <ErrorBoundary>
                        <AdminPage tab="globalSettings" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="uw-requirements" 
                    element={
                      <ErrorBoundary>
                        <AdminPage tab="uwRequirements" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="data-health" 
                    element={
                      <ErrorBoundary>
                        <AdminPage tab="dataHealth" />
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    index 
                    element={
                      <ErrorBoundary>
                        <AdminLandingPage />
                      </ErrorBoundary>
                    } 
                  />
                </Route>
                
                {/* User management - Admin only (access level 1) */}
                <Route path="/admin/users" element={<ProtectedRoute requiredAccessLevel={1} allowedAccessLevels={[1]} />}>
                  <Route 
                    index
                    element={
                      <ErrorBoundary>
                        <UsersPage />
                      </ErrorBoundary>
                    } 
                  />
                </Route>
                
                {/* Support requests - Admin only (access level 1) */}
                <Route path="/admin/support-requests" element={<ProtectedRoute requiredAccessLevel={1} allowedAccessLevels={[1]} />}>
                  <Route 
                    index
                    element={
                      <ErrorBoundary>
                        <SupportRequestsPage />
                      </ErrorBoundary>
                    } 
                  />
                </Route>

                {/* API Keys Management - Admin only */}
                <Route path="/admin/api-keys" element={<ProtectedRoute requiredAccessLevel={1} allowedAccessLevels={[1]} />}>
                  <Route 
                    index
                    element={
                      <ErrorBoundary>
                        <React.Suspense fallback={<div className="slds-p-around_medium">Loading…</div>}>
                          <LazyApiKeys />
                        </React.Suspense>
                      </ErrorBoundary>
                    }
                  />
                </Route>
                
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute requiredAccessLevel={5}>
                      <HomePage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Products route removed */}
                
                <Route path="/" element={<Navigate to="/home" replace />} />
                </Routes>
              </div>
          </AppShell>
        </ErrorBoundary>
      </UserProvider>
    </div>
  );
};

function App() {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const canvasToken = params.get('canvasToken');

    if (canvasToken) {
      const canvasContext = jwtDecode(canvasToken);

      // Store for app usage
      localStorage.setItem('canvasContext', JSON.stringify(canvasContext));
      localStorage.setItem('canvasToken', canvasToken);

      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);


  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <AccessibilityProvider>
              <AppContent />
            </AccessibilityProvider>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}export default App;
