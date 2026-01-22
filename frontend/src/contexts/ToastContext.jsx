import React, { createContext, useContext, useState } from 'react';
import '../styles/Toast.css';
// SLDS toast markup replacement for Carbon ToastNotification

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = ({ kind = 'success', title, subtitle, timeout = 5000 }) => {
    const id = Date.now();
    const toast = { id, kind, title, subtitle, timeout };
    
    setToasts(prev => [...prev, toast]);
    
    if (timeout > 0) {
      setTimeout(() => {
        removeToast(id);
      }, timeout);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Container - Fixed position at top-right */}
      <div className="toast-container">
        {toasts.map(t => {
          const kindClass = t.kind === 'error' ? 'slds-theme_error' : t.kind === 'warning' ? 'slds-theme_warning' : t.kind === 'info' ? 'slds-theme_info' : 'slds-theme_success';
          return (
            <div key={t.id} className={`slds-notify slds-notify_toast ${kindClass} toast-notification`} role="status">
              <div className="slds-notify__close">
                <button className="slds-button slds-button_icon" aria-label="Close" title="Close" onClick={() => removeToast(t.id)}>
                  <svg className="slds-button__icon" aria-hidden="true" viewBox="0 0 52 52">
                    <path d="M31 25.4l14.9-14.9c.8-.8.8-2 0-2.8L44.3 6c-.8-.8-2-.8-2.8 0L26.6 20.9 11.7 6c-.8-.8-2-.8-2.8 0L6 7.7c-.8.8-.8 2 0 2.8L20.9 25.4 6 40.3c-.8.8-.8 2 0 2.8L7.7 44c.8.8 2 .8 2.8 0l15-14.9 14.9 14.9c.8.8 2 .8 2.8 0l1.7-1.7c.8-.8.8-2 0-2.8L31 25.4z"></path>
                  </svg>
                  <span className="slds-assistive-text">Close</span>
                </button>
              </div>
              <div className="slds-notify__content">
                <h2 className="slds-text-heading_small toast-title">{t.title}</h2>
                {t.subtitle && <p className="slds-text-body_small toast-subtitle">{t.subtitle}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
