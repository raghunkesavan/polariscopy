import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResetLink('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error object from backend: { success: false, error: { code: 'X', message: 'Y' } }
        const errorMessage = data.error?.message || data.error || 'Failed to request password reset';
        throw new Error(errorMessage);
      }

      setSuccess(true);
      
      // In development, show the reset link
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-wrapper">
      <div className="reset-password-card">
        <div className="text-align-center margin-bottom-2">
          <h1 className="font-size-175rem font-weight-300 text-color-heading margin-bottom-05">
            Reset Password
          </h1>
          <p className="text-color-gray font-size-14">
            Enter your email address and we'll help you reset your password
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="slds-form-element margin-bottom-1">
              <label className="slds-form-element__label" htmlFor="email">
                Email Address
              </label>
              <div className="slds-form-element__control">
                <input
                  type="email"
                  id="email"
                  className="slds-input"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-align-center">
              <Link
                to="/login"
                className="text-color-link text-decoration-none font-size-14"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div>
            <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success margin-bottom-15">
              <span className="slds-assistive-text">Success</span>
              <h2>Reset link generated successfully!</h2>
            </div>

            <p className="text-color-body margin-bottom-15 font-size-14 line-height-15">
              If an account exists with the email <strong>{email}</strong>, a password reset link has been generated.
            </p>

            {resetLink && (
              <div className="dev-mode-box">
                <p className="font-size-12 font-weight-600 text-color-warning margin-bottom-05">
                  🔧 DEVELOPMENT MODE
                </p>
                <p className="font-size-12 text-color-body margin-bottom-05">
                  Use this link to reset your password:
                </p>
                <a
                  href={resetLink}
                  className="font-size-12 text-color-link word-break-all text-decoration-underline"
                >
                  {resetLink}
                </a>
              </div>
            )}

            <div className="text-align-center">
              <Link
                to="/login"
                className="slds-button slds-button_neutral width-100"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
