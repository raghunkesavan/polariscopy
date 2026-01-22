import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

/**
 * WelcomeHeader - Personalized welcome message or quote reference display
 * Displays "Welcome back, [User Name]" based on logged-in user
 * OR displays "Quote Reference: [number]" when quoteReference is provided
 */
export default function WelcomeHeader({ className = '', quoteReference = null }) {
  const { user } = useAuth();
  
  // Get user's name (prefer full name, fallback to username)
  const userName = user?.name || user?.username || 'User';
  
  return (
    <h1 
      className={className}
      style={{ 
        fontSize: 'var(--token-font-size-sm)', 
        fontWeight: 'var(--token-font-weight-regular)', 
        marginBottom: 'var(--token-spacing-md)',
        color: 'var(--mfs-brand-navy)'
      }}
    >
      {quoteReference ? (
        <>
          Quote Reference: <strong style={{ fontWeight: 'var(--token-font-weight-semibold)' }}>{quoteReference}</strong>
        </>
      ) : (
        <>
          Welcome back, <strong style={{ fontWeight: 'var(--token-font-weight-semibold)' }}>{userName}</strong>
        </>
      )}
    </h1>
  );
}

WelcomeHeader.propTypes = {
  className: PropTypes.string,
  quoteReference: PropTypes.string,
};
