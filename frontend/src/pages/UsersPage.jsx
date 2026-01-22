import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import SalesforceIcon from '../components/shared/SalesforceIcon';
import WelcomeHeader from '../components/shared/WelcomeHeader';
import ModalShell from '../components/modals/ModalShell';
import '../styles/Modal.css';
import '../styles/admin-tables.css';
import '../styles/UsersPage.css';

const UsersPage = () => {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', access_level: 4 });
  
  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    if (!isAdmin()) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = (data && data.error && (data.error.message || (typeof data.error === 'string' && data.error))) || 'Failed to create user';
        throw new Error(message);
      }

      setSuccess('User created successfully');
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', name: '', access_level: 4 });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingUser.name,
          access_level: editingUser.access_level,
          is_active: editingUser.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = (data && data.error && (data.error.message || (typeof data.error === 'string' && data.error))) || 'Failed to update user';
        throw new Error(message);
      }

      setSuccess('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${resetUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = (data && data.error && (data.error.message || (typeof data.error === 'string' && data.error))) || 'Failed to reset password';
        throw new Error(message);
      }

      setSuccess('Password reset successfully');
      setShowResetModal(false);
      setResetUserId(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const message = (data && data.error && (data.error.message || (typeof data.error === 'string' && data.error))) || 'Failed to delete user';
        throw new Error(message);
      }

      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const getAccessLevelLabel = (level) => {
    const levels = {
      1: 'Admin',
      2: 'UW Team Lead',
      3: 'Head of UW',
      4: 'Underwriter',
      5: 'Broker'
    };
    return levels[level] || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Pagination calculations
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleResetClick = (userId) => {
    setResetUserId(userId);
    setShowResetModal(true);
  };

  const handleDeleteClick = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="slds-spinner_container position-fixed-full-height">
        <div className="slds-spinner slds-spinner_medium" role="status">
          <span className="slds-assistive-text">Loading</span>
          <div className="slds-spinner__dot-a"></div>
          <div className="slds-spinner__dot-b"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="slds-p-around_large">
      <div className="page-container page-container--table">
        <div className="table-header-stacked">
          <div className="table-title-row">
            <div className="users-page-header">
              <WelcomeHeader />
              <p>
                Manage user accounts, access levels, and permissions
              </p>
            </div>
            <div className="table-actions-row">
              <button
                className="slds-button slds-button_brand"
                onClick={() => setShowCreateModal(true)}
              >
                Create User
              </button>
              <span className="total-count">Total: {users.length}</span>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="error-state">
            <div className="error-box">
              <h3>Error</h3>
              <p>{error}</p>
              <button className="slds-button slds-button_neutral" onClick={() => setError('')}>Dismiss</button>
            </div>
          </div>
        )}

        {success && (
          <div className="success-message-box">
            <h3>Success</h3>
            <p>{success}</p>
            <button className="slds-button slds-button_neutral" onClick={() => setSuccess('')}>Dismiss</button>
          </div>
        )}

        {/* Users Table */}
        <div className="table-wrapper">
          <table className="professional-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ACCESS LEVEL</th>
                <th>STATUS</th>
                <th>LAST LOGIN</th>
                <th className="sticky-action">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`slds-badge ${user.access_level === 1 ? 'slds-theme_success' : ''}`}>
                      {getAccessLevelLabel(user.access_level)}
                    </span>
                  </td>
                  <td>
                    <span className={`slds-badge ${user.is_active ? 'slds-theme_success' : 'slds-theme_error'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(user.last_login)}</td>
                  <td className="sticky-action">
                    <div className="row-actions">
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleResetClick(user.id)}
                      >
                        Reset Password
                      </button>
                      <button
                        className="slds-button slds-button_destructive"
                        onClick={() => handleDeleteClick(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <div className="pagination-controls">
            <button 
              className="slds-button slds-button_neutral"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-info">Page {currentPage} of {totalPages}</span>
            <button 
              className="slds-button slds-button_neutral"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <div className="rows-per-page">
              <label>Rows:</label>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="slds-backdrop slds-backdrop_open">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container max-width-600">
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowCreateModal(false)}
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Create New User</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handleCreateUser}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createName">
                      <abbr className="slds-required" title="required">* </abbr>
                      Name
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="text"
                        id="createName"
                        className="slds-input"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createEmail">
                      <abbr className="slds-required" title="required">* </abbr>
                      Email
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="email"
                        id="createEmail"
                        className="slds-input"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      Password (min 8 characters)
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="createPassword"
                        className="slds-input"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createAccessLevel">
                      <abbr className="slds-required" title="required">* </abbr>
                      Access Level
                    </label>
                    <div className="slds-form-element__control">
                      <select
                        id="createAccessLevel"
                        className="slds-select"
                        value={newUser.access_level}
                        onChange={(e) => setNewUser({ ...newUser, access_level: parseInt(e.target.value) })}
                        required
                      >
                        <option value={1}>1 - Admin</option>
                        <option value={2}>2 - UW Team Lead</option>
                        <option value={3}>3 - Head of UW</option>
                        <option value={4}>4 - Underwriter</option>
                        <option value={5}>5 - Product Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="slds-modal__footer">
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="slds-button slds-button_brand">
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="slds-backdrop slds-backdrop_open">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container max-width-600">
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowEditModal(false)}
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Edit User</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handleUpdateUser}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label">Email</label>
                    <div className="slds-form-element__control">
                      <input
                        type="text"
                        className="slds-input background-gray-medium"
                        value={editingUser.email}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="editName">
                      <abbr className="slds-required" title="required">* </abbr>
                      Name
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="text"
                        id="editName"
                        className="slds-input"
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="editAccessLevel">
                      <abbr className="slds-required" title="required">* </abbr>
                      Access Level
                    </label>
                    <div className="slds-form-element__control">
                      <select
                        id="editAccessLevel"
                        className="slds-select"
                        value={editingUser.access_level}
                        onChange={(e) => setEditingUser({ ...editingUser, access_level: parseInt(e.target.value) })}
                        required
                      >
                        <option value={1}>1 - Admin</option>
                        <option value={2}>2 - UW Team Lead</option>
                        <option value={3}>3 - Head of UW</option>
                        <option value={4}>4 - Underwriter</option>
                        <option value={5}>5 - Product Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-checkbox" htmlFor="editIsActive">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={editingUser.is_active}
                        onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                      />
                      <span className="slds-checkbox_faux"></span>
                      <span className="slds-form-element__label">Active</span>
                    </label>
                  </div>

                  <div className="slds-modal__footer">
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="slds-button slds-button_brand">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-backdrop">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container max-width-500">
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowResetModal(false)}
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Reset User Password</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handleResetPassword}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="resetPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      New Password (min 8 characters)
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="resetPassword"
                        className="slds-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-modal__footer">
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowResetModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="slds-button slds-button_brand">
                      Reset Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ModalShell
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        maxWidth="500px"
        footer={(
          <>
            <button
              className="slds-button slds-button_neutral"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              className="slds-button slds-button_destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </button>
          </>
        )}
      >
        <p className="font-size-14 line-height-15 text-color-body">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
      </ModalShell>
    </div>
  );
};

export default UsersPage;
