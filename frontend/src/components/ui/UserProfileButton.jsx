import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SalesforceIcon from '../shared/SalesforceIcon';
import ModalShell from '../modals/ModalShell';
import '../../styles/Modal.css';
import '../../styles/UserProfile.css';

/**
 * UserProfileButton - Shows current user from authentication
 * 
 * Features:
 * - Displays user initials/avatar from logged-in user
 * - Dropdown menu with profile info and access level
 * - Change password option
 * - Logout option
 */
const UserProfileButton = () => {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  // Helper functions
  const getUserName = () => user?.name || 'Unknown User';
  
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    
    const parts = user.name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAccessLevelLabel = () => {
    const levels = {
      1: 'Admin',
      2: 'UW Team Lead',
      3: 'Head of UW',
      4: 'Underwriter',
      5: 'Product Team'
    };
    return levels[user?.access_level] || 'Unknown';
  };

  const handlePasswordClick = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowMenu(false);
    setShowPasswordModal(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      setSuccess('Password changed successfully');
      setTimeout(() => {
        setShowPasswordModal(false);
      }, 1500);
    } else {
      setError(result.error || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* User Avatar Button */}
      <div className="slds-dropdown-trigger slds-dropdown-trigger_click user-profile-trigger">
        <button
          className="slds-button slds-button_icon slds-button_icon-container user-avatar-btn"
          title={`Logged in as ${getUserName()}`}
          onClick={() => setShowMenu(!showMenu)}
        >
          {getUserInitials()}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div 
              className="dropdown-backdrop"
              onClick={() => setShowMenu(false)}
            />
            <div className="slds-dropdown slds-dropdown_right slds-dropdown_medium user-dropdown">
              {/* Profile Info */}
              <div className="slds-p-around_medium slds-border_bottom">
                <div className="slds-text-heading_small slds-m-bottom_xx-small user-name">
                  {getUserName()}
                </div>
                {user.email && (
                  <div className="slds-text-body_small slds-m-bottom_xx-small user-email">
                    {user.email}
                  </div>
                )}
                <div className="slds-text-body_small user-role">
                  {getAccessLevelLabel()}
                </div>
              </div>

              {/* Menu Items */}
              <ul className="slds-dropdown__list dropdown-list" role="menu">
                <li className="slds-dropdown__item dropdown-item" role="presentation">
                  <a
                    href="#"
                    className="slds-dropdown__item-link dropdown-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); setShowMenu(false); navigate('/settings'); }}
                  >
                    <span className="dropdown-link-icon">⚙️</span>
                    <span>Settings</span>
                  </a>
                </li>
                <li className="slds-dropdown__item dropdown-item" role="presentation">
                  <a
                    href="#"
                    className="slds-dropdown__item-link dropdown-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); handlePasswordClick(); }}
                  >
                    <span className="dropdown-link-icon">🔑</span>
                    <span>Change Password</span>
                  </a>
                </li>
                <li className="slds-dropdown__item dropdown-item" role="presentation">
                  <a
                    href="#"
                    className="slds-dropdown__item-link dropdown-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); handleLogout(); }}
                  >
                    <span className="dropdown-link-icon">🚪</span>
                    <span>Logout</span>
                  </a>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="slds-backdrop slds-backdrop_open">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container password-modal-container">
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowPasswordModal(false)}
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Change Password</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handlePasswordChange}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="currentPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      Current Password
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="currentPassword"
                        className="slds-input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="newPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      New Password
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="newPassword"
                        className="slds-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="confirmPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      Confirm New Password
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="confirmPassword"
                        className="slds-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success slds-m-bottom_medium">
                      {success}
                    </div>
                  )}

                  <div className="slds-m-top_medium">
                    <button type="submit" className="slds-button slds-button_brand slds-m-right_small">
                      Change Password
                    </button>
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowPasswordModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfileButton;
