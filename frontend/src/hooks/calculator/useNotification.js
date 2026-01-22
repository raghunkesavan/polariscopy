import { useState } from 'react';

/**
 * Custom hook for managing notification state
 * Used for displaying success/error/info messages to users
 * 
 * @returns {Object} Notification state and helper functions
 */
export function useNotification() {
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showNotification = (type, title, message) => {
    setNotification({ show: true, type, title, message });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const showSuccess = (title, message = '') => {
    showNotification('success', title, message);
  };

  const showError = (title, message = '') => {
    showNotification('error', title, message);
  };

  const showInfo = (title, message = '') => {
    showNotification('info', title, message);
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showInfo
  };
}
