import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/breadcrumbs.css';

/**
 * Breadcrumbs - Salesforce Lightning-style breadcrumb navigation
 * Shows user's current location in app hierarchy
 * 
 * @param {Array} items - Array of breadcrumb items: [{ label: string, path: string }]
 * Last item is automatically marked as current page (no link)
 */
export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="slds-breadcrumb" aria-label="Breadcrumb">
      <ol className="slds-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isMainSection = index === 1; // Second item is the main section (Products, Calculator, Quotes, Admin)
          
          return (
            <li key={index} className="slds-breadcrumb__item">
              {isLast ? (
                <span className="slds-breadcrumb__current" aria-current="page">
                  {String(item.label)}
                </span>
              ) : (
                <Link 
                  to={item.path} 
                  className="slds-breadcrumb__link"
                >
                  {String(item.label)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Hook to automatically generate breadcrumbs based on current route
 * Returns array of breadcrumb items
 */
export function useBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  const breadcrumbs = [
    { label: 'Home', path: '/' }
  ];

  if (path.includes('/products')) {
    breadcrumbs.push({ label: 'Products', path: '/products/btl' });
    
    if (path.includes('/btl')) {
      breadcrumbs.push({ label: 'Buy to Let', path: '/products/btl' });
    } else if (path.includes('/bridging')) {
      breadcrumbs.push({ label: 'Bridge & Fusion', path: '/products/bridging' });
    }
  } else if (path.includes('/calculator')) {
    breadcrumbs.push({ label: 'Calculator', path: '/calculator/btl' });
    
    if (path.includes('/btl')) {
      breadcrumbs.push({ label: 'Buy to Let', path: '/calculator/btl' });
    } else if (path.includes('/bridging')) {
      breadcrumbs.push({ label: 'Bridging & Fusion', path: '/calculator/bridging' });
    }
  } else if (path.includes('/quotes')) {
    breadcrumbs.push({ label: 'Quotes', path: '/quotes' });
  } else if (path.includes('/admin')) {
    breadcrumbs.push({ label: 'Admin', path: '/admin' });
    
    if (path.includes('/constants')) {
      breadcrumbs.push({ label: 'Constants', path: '/admin/constants' });
    } else if (path.includes('/users')) {
      breadcrumbs.push({ label: 'Users', path: '/admin/users' });
    } else if (path.includes('/criteria')) {
      breadcrumbs.push({ label: 'BTL Criteria', path: '/admin/criteria' });
    } else if (path.includes('/btl-rates')) {
      breadcrumbs.push({ label: 'BTL Rates', path: '/admin/btl-rates' });
    } else if (path.includes('/bridging-rates')) {
      breadcrumbs.push({ label: 'Bridging Rates', path: '/admin/bridging-rates' });
    } else if (path.includes('/global-settings')) {
      breadcrumbs.push({ label: 'Global Settings', path: '/admin/global-settings' });
    } else if (path.includes('/support-requests')) {
      breadcrumbs.push({ label: 'Support Requests', path: '/admin/support-requests' });
    } else if (path.includes('/data-health')) {
      breadcrumbs.push({ label: 'Data Health', path: '/admin/data-health' });
    } else if (path.includes('/api-keys')) {
      breadcrumbs.push({ label: 'API Keys', path: '/admin/api-keys' });
    }
  } else if (path.includes('/settings')) {
    breadcrumbs.push({ label: 'Settings', path: '/settings' });
  }

  return breadcrumbs;
}
