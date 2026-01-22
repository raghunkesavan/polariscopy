import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/slds.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAdmin, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    access_level: '4' // Default to Underwriter
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.name,
        parseInt(formData.access_level)
      );
      
      if (result.success) {
        // Redirect to calculator page after successful registration
        navigate('/calculator/btl');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const accessLevelOptions = [
    { value: '1', label: '1 - Admin', adminOnly: false },
    { value: '2', label: '2 - UW Team Lead', adminOnly: false },
    { value: '3', label: '3 - Head of UW', adminOnly: false },
    { value: '4', label: '4 - Underwriter', adminOnly: false },
    { value: '5', label: '5 - Product Team', adminOnly: false }
  ];

  // If user is not logged in, show limited access levels
  const availableOptions = user && isAdmin()
    ? accessLevelOptions
    : accessLevelOptions.filter(opt => opt.value === '4'); // Only Underwriter for self-registration

  return (
    <div className="slds-p-around_large auth-container-wide">
      <div className="slds-box slds-theme_default">
        <h1 className="slds-text-heading_large slds-m-bottom_medium text-align-center">
          Register New Account
        </h1>
        
        {error && (
          <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium" role="alert">
            <span className="slds-assistive-text">Error</span>
            <h2>{error}</h2>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="slds-form-element slds-m-bottom_medium">
            <label className="slds-form-element__label" htmlFor="name">
              <abbr className="slds-required" title="required">*</abbr> Full Name
            </label>
            <div className="slds-form-element__control">
              <input
                type="text"
                id="name"
                name="name"
                className="slds-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="slds-form-element slds-m-bottom_medium">
            <label className="slds-form-element__label" htmlFor="email">
              <abbr className="slds-required" title="required">*</abbr> Email
            </label>
            <div className="slds-form-element__control">
              <input
                type="email"
                id="email"
                name="email"
                className="slds-input"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="slds-form-element slds-m-bottom_medium">
            <label className="slds-form-element__label" htmlFor="password">
              <abbr className="slds-required" title="required">*</abbr> Password
            </label>
            <div className="slds-form-element__control">
              <input
                type="password"
                id="password"
                name="password"
                className="slds-input"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={8}
              />
            </div>
            <div className="slds-form-element__help">Minimum 8 characters</div>
          </div>

          <div className="slds-form-element slds-m-bottom_medium">
            <label className="slds-form-element__label" htmlFor="confirmPassword">
              <abbr className="slds-required" title="required">*</abbr> Confirm Password
            </label>
            <div className="slds-form-element__control">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="slds-input"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={8}
              />
            </div>
          </div>

          <div className="slds-form-element slds-m-bottom_medium">
            <label className="slds-form-element__label" htmlFor="access_level">
              <abbr className="slds-required" title="required">*</abbr> Access Level
            </label>
            <div className="slds-form-element__control">
              <div className="slds-select_container">
                <select
                  id="access_level"
                  name="access_level"
                  className="slds-select"
                  value={formData.access_level}
                  onChange={handleChange}
                  required
                  disabled={loading || availableOptions.length === 1}
                >
                  {availableOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!isAdmin() && (
              <div className="slds-form-element__help">
                Self-registration is limited to Underwriter access. Contact an admin for higher access levels.
              </div>
            )}
          </div>

          <div className="slds-m-top_medium">
            <button
              type="submit"
              className="slds-button slds-button_brand width-100"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="slds-m-top_medium text-align-center border-top-gray padding-top-1">
          <p className="slds-text-body_small">
            Already have an account?{' '}
            <Link to="/login" className="slds-text-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
