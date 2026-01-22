import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No reset token provided');
      setValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token/${token}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        // Handle error object from backend: { success: false, error: { code: 'X', message: 'Y' } }
        const errorMessage = data.error?.message || data.error || 'Invalid or expired reset token';
        setError(errorMessage);
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setUserEmail(data.email || '');
      }
    } catch (err) {
      setError('Failed to validate reset token');
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error object from backend: { success: false, error: { code: 'X', message: 'Y' } }
        const errorMessage = data.error?.message || data.error || 'Failed to reset password';
        throw new Error(errorMessage);
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="reset-password-wrapper">
        <div className="slds-spinner_container">
          <div className="slds-spinner slds-spinner_medium" role="status">
            <span className="slds-assistive-text">Validating reset token...</span>
            <div className="slds-spinner__dot-a"></div>
            <div className="slds-spinner__dot-b"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="reset-password-wrapper">
        <div className="reset-password-card text-align-center">
          <div className="font-size-48 margin-bottom-1">⚠️</div>
          <h1 className="font-size-15rem font-weight-300 text-color-heading margin-bottom-1">
            Invalid Reset Link
          </h1>
          <p className="text-color-gray margin-bottom-2 font-size-14">
            {error || 'This password reset link is invalid or has expired.'}
          </p>
          <Link to="/forgot-password" className="slds-button slds-button_brand margin-right-05">
            Request New Link
          </Link>
          <Link to="/login" className="slds-button slds-button_neutral">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-wrapper">
      <div className="reset-password-card">
        <div className="text-align-center margin-bottom-2">
          <h1 className="font-size-175rem font-weight-300 text-color-heading margin-bottom-05">
            Set New Password
          </h1>
          {userEmail && (
            <p className="text-color-gray font-size-14">
              for {userEmail}
            </p>
          )}
        </div>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="slds-form-element margin-bottom-1">
              <label className="slds-form-element__label" htmlFor="newPassword">
                <abbr className="slds-required" title="required">* </abbr>
                New Password
              </label>
              <div className="slds-form-element__control">
                <input
                  type="password"
                  id="newPassword"
                  className="slds-input"
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="slds-form-element margin-bottom-1">
              <label className="slds-form-element__label" htmlFor="confirmPassword">
                <abbr className="slds-required" title="required">* </abbr>
                Confirm Password
              </label>
              <div className="slds-form-element__control">
                <input
                  type="password"
                  id="confirmPassword"
                  className="slds-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error margin-bottom-1">
                <span className="slds-assistive-text">Error</span>
                <h2>{error}</h2>
              </div>
            )}

            <button
              type="submit"
              className="slds-button slds-button_brand width-100 margin-bottom-1"
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div className="text-align-center">
              <Link
                to="/login"
                className="text-color-link font-size-14 text-decoration-none"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div>
            <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success margin-bottom-15">
              <span className="slds-assistive-text">Success</span>
              <h2>Password Reset Successfully!</h2>
            </div>

            <p className="text-color-body margin-bottom-15 font-size-14 line-height-15 text-align-center">
              Your password has been reset. You will be redirected to the login page in a few seconds...
            </p>

            <div className="text-align-center">
              <Link
                to="/login"
                className="slds-button slds-button_brand width-100"
              >
                Go to Login Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
