import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ requiredAccessLevel = 5, allowedAccessLevels = null, children }) => {
  const { user, loading, hasPermission } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="slds-p-around_large text-align-center">
        <div className="slds-spinner_container">
          <div role="status" className="slds-spinner slds-spinner_medium">
            <span className="slds-assistive-text">Loading...</span>
            <div className="slds-spinner__dot-a"></div>
            <div className="slds-spinner__dot-b"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required access level
  const isAllowedByList = Array.isArray(allowedAccessLevels)
    ? allowedAccessLevels.includes(user.access_level)
    : true;

  if (!isAllowedByList || !hasPermission(requiredAccessLevel)) {
    // User is authenticated but doesn't have sufficient permissions
    return (
      <div className="slds-p-around_large">
        <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error" role="alert">
          <span className="slds-assistive-text">Error</span>
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has sufficient permissions
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
