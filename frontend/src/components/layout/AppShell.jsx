import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SalesforceNav from './SalesforceNav';
import { isEmbeddedMode, sendMessageToHost } from '../../utils/embedding';
import '../../styles/app-shell.scss';

/**
 * AppShell - Main layout wrapper component
 *
 * This component provides the main layout structure and conditionally
 * renders navigation based on whether the app is embedded in Salesforce.
 *
 * When embedded (iframe + ?embedded=1 param):
 * - Navigation is hidden
 * - Salesforce host controls navigation
 * - Layout adjusts to fill available space
 *
 * When standalone:
 * - Full navigation is shown
 * - Standard layout with header and sidebar
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Main content area
 */
function AppShell({ children }) {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check embedding status on mount
    const embedded = isEmbeddedMode();
    setIsEmbedded(embedded);

    // Notify host that app is ready (if embedded)
    if (embedded) {
      sendMessageToHost('app-ready', {
        version: '1.0.0',
        features: ['btl-calculator', 'bridging-calculator', 'quotes']
      });
    }
  }, []);

  // Public routes that shouldn't show navigation
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname) || 
    location.pathname.startsWith('/calculator/public/');

  // Show navigation only if NOT public route AND NOT embedded
  const showNavigation = !isPublicRoute && !isEmbedded;

  return (
    <div className="app-shell">
      {showNavigation && <SalesforceNav />}
      {children}
    </div>
  );
}

export default AppShell;
