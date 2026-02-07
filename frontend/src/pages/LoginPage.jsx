import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/LoginPage.scss';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved email from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);
  //alert('Login Page Loaded');
  //alert(window.canvasData?.isAvailable);
  //alert(JSON.stringify(window));
  /*
useEffect(() => {
  // Case 1: Canvas data already loaded
  if (window.canvasData?.isAvailable) {
    const { recordId, action } = window.canvasData.parameters || {};

    if (recordId || action) {
      alert(
        `Canvas Parameters received:\n\nRecordId: ${recordId}\nAction: ${action}`
      );
    }
  }

  // Case 2: Wait for Canvas data event
  const handler = (event) => {
    const { recordId, action } = event.detail.parameters || {};

    alert(
      `Canvas Parameters received:\n\nRecordId: ${recordId}\nAction: ${action}`
    );
  };

  window.addEventListener('canvasDataReady', handler);

  return () => {
    window.removeEventListener('canvasDataReady', handler);
  };
}, []);
*/
     
  
  const resolvePostLoginRoute = async () => {
    try {
      //const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const baseUrl = 'https://polariscopy.onrender.com';
      console.log('[Raghu response Echo1] Raghu1 response Payload received:',  baseUrl);
      const response = await fetch(`${baseUrl}/api/salesforce/echo/last`);

       console.log('[Raghu response Echo] Raghu response Payload received:', response);
        console.log('[Raghu response baseUrl] Raghu response Payload received baseUrl:', baseUrl);
      if (!response.ok) return '/home';

      const data = await response.json();
      const payload = data?.payload || {};
      const quoteTypeRaw =
        payload.quoteType ||
        payload.quote_type ||
        payload.calculator_type ||
        payload.calculatorType ||
        '';
      const quoteType = quoteTypeRaw.toString().toLowerCase();
      //alert (raghu + ' Quote Type: ' + quoteType);
      
       console.log('[Raghu Echo] Raghu Payload received:', quoteType);

      if (quoteType.includes('BTL') || quoteType.includes('btl') || quoteType.includes('buy-to-let') || quoteType.includes('buy to let')) {
        return '/calculator/btl';
      }

      if (quoteType.includes('bridge') || quoteType.includes('bridging') || quoteType.includes('fusion')) {
        return '/calculator/bridging';
      }

      return '/home';
    } catch (err) {
      return '/home';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Handle Remember Me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const destination = await resolvePostLoginRoute();
        navigate(destination, { replace: true });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <div className="login-page-container">
      <div className="login-left">
        <div className="login-card">
          <div className="logo-container">
            <img
              src={isDark ? '/assets/mfs-logo-dark.png' : '/assets/mfs-logo.png'}
              alt="MFS Logo"
            />
          </div>

          <h2 className="welcome-text">Welcome to Polaris</h2>

          {(error || authError) && (
            <div className="error-message">
              {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Username</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  placeholder="email@mfsuk.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <div className="remember-me-container">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login to Portal'}
              </button>
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>

        <div className="copyright">
          © {currentYear} Market Financial Services Ltd. All rights reserved.
        </div>
      </div>

      <div className="login-right"></div>
    </div>
  );
}
