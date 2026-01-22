import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import ThemeToggle from '../ui/ThemeToggle';
import UserProfileButton from '../ui/UserProfileButton';
import SalesforceIcon from '../shared/SalesforceIcon';
import Breadcrumbs, { useBreadcrumbs } from './Breadcrumbs';
import { useTheme } from '../../contexts/ThemeContext';
import SupportPanel from '../../components/SupportPanel';
import '../../styles/salesforce-nav.scss';

/**
 * SalesforceNav - Salesforce Lightning-style horizontal navigation
 * Features:
 * - Horizontal tab navigation
 * - Dropdown menus for Products and Admin
 * - User first name display
 * - Theme toggle
 * - User profile button
 */
function SalesforceNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, canAccessAdmin, isAdmin, logout } = useAuth();
  const { user: userProfile } = useUser();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'g100';
  const breadcrumbs = useBreadcrumbs();
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showSupportPanel, setShowSupportPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user's first name
  const getUserFirstName = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ')[0];
    }
    if (authUser?.name) {
      return authUser.name.split(' ')[0];
    }
    return 'User';
  };

  // Check if user can access admin pages
  const showAdminMenu = authUser && canAccessAdmin();
  const showUserManagement = authUser && isAdmin();

  // Navigation structure
  const navItems = [
    
    {
      id: 'calculator',
      label: 'Calculators',
      type: 'dropdown',
      children: [
        { id: 'calc-btl', label: 'BTL Calculator', path: '/calculator/btl' },
        { id: 'calc-bridging', label: 'Bridging & Fusion Calculator', path: '/calculator/bridging' }
      ]
    },
    {
      id: 'quotes',
      label: 'Quotes',
      path: '/quotes',
      type: 'link'
    },

    {
      id: 'products',
      label: 'Products',
      type: 'dropdown',
      children: [
        { id: 'btl', label: 'Buy to Let', path: '/products/btl' },
        { id: 'bridging', label: 'Bridge & Fusion', path: '/products/bridging' }
      ]
    },
    ...(showAdminMenu ? [{
      id: 'admin',
      label: 'Admin',
      type: 'dropdown',
      children: [
        { id: 'admin-dashboard', label: 'Dashboard', path: '/admin' },
        { id: 'constants', label: 'Constants', path: '/admin/constants' },
        { id: 'criteria', label: 'BTL Criteria', path: '/admin/criteria' },
        { id: 'btl-rates', label: 'BTL Rates', path: '/admin/btl-rates' },
        { id: 'bridging-rates', label: 'Bridging Rates', path: '/admin/bridging-rates' },
        { id: 'global-settings', label: 'Global Settings', path: '/admin/global-settings' },
        ...(showUserManagement ? [
          { id: 'users', label: 'Users', path: '/admin/users' },
          { id: 'support-requests', label: 'Support Requests', path: '/admin/support-requests' }
        ] : []),
        { id: 'data-health', label: 'Data Health', path: '/admin/data-health' },
        { id: 'api-keys', label: 'API Keys', path: '/admin/api-keys' }
      ]
    }] : [])
  ];

  const isActive = (path) => {
    if (!path) return false;
    // Exact match only - prevents /calculator from matching /calculator/btl
    return location.pathname === path;
  };

  const isDropdownActive = (children) => {
    return children.some(child => isActive(child.path));
  };

  const handleNavClick = (path) => {
    if (path) {
      navigate(path);
      setActiveDropdown(null);
      setMobileMenuOpen(false);
    }
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.sf-nav-item')) {
      setActiveDropdown(null);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="sf-nav-container">
      {/* Mobile overlay */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Single Header Bar with Logo, Breadcrumbs, and Actions */}
      <div className="sf-global-header">
        <div className="sf-global-header__left">
          <div className="sf-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
            <img 
              src={isDarkMode ? "/assets/mfs-logo-dark.png" : "/assets/mfs-logo.png"} 
              alt="MFS Logo" 
              className="sf-brand__logo" 
            />
          </div>
          
          {/* Breadcrumbs in Header */}
          {breadcrumbs.length > 0 && (
            <div className="sf-header-breadcrumbs">
              <div>
                <Breadcrumbs items={breadcrumbs} />
                <div style={{ marginTop: '0.5rem', fontSize: 'var(--token-font-size-lg)', fontWeight: 700 }}>
                  {String(breadcrumbs[breadcrumbs.length - 1].label)}
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <div className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
        
        <div className={`sf-global-header__right ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}>
          {/* Navigation Tabs */}
          <nav className="sf-nav-tabs">
          {navItems.map(item => {
            if (item.type === 'link') {
              return (
                <button
                  key={item.id}
                  className={`sf-nav-item ${isActive(item.path) ? 'sf-nav-item--active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  {item.label}
                </button>
              );
            }
            
            if (item.type === 'button') {
              return (
                <button
                  key={item.id}
                  className="sf-nav-item"
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              );
            }
            
            if (item.type === 'dropdown') {
              const dropdownActive = isDropdownActive(item.children);
              return (
                <div key={item.id} className="sf-nav-item sf-nav-item--dropdown">
                  <button
                    className={`sf-nav-item__trigger ${dropdownActive ? 'sf-nav-item--active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(item.id);
                    }}
                  >
                    {item.label}
                    <svg className="sf-icon sf-nav-chevron" viewBox="0 0 24 24">
                      <path d="M8 10l4 4 4-4"/>
                    </svg>
                  </button>
                  
                  {activeDropdown === item.id && (
                    <div className="sf-dropdown">
                      <ul className="sf-dropdown__list">
                        {item.children.map(child => (
                          <li key={child.id}>
                            <button
                              className={`sf-dropdown__item ${isActive(child.path) ? 'sf-dropdown__item--active' : ''}`}
                              onClick={() => handleNavClick(child.path)}
                            >
                              {child.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }
            
            return null;
          })}
        </nav>
        
          {/* Support Icon Button */}
          <button
            onClick={() => setShowSupportPanel(true)}
            title="Support"
            className="flex-center radius-sm hover-bg theme-toggle-btn"
            style={{ marginLeft: '0.5rem', padding: 0 }}
          >
            <div className="feature-icon-container feature-icon-orange" style={{ width: '28px', height: '28px' }}>
              <SalesforceIcon name="question" size="x-small" />
            </div>
          </button>
          
          <ThemeToggle />
          <UserProfileButton />
        </div>
      </div>

      {/* Support Panel */}
      {showSupportPanel && (
        <SupportPanel onClose={() => setShowSupportPanel(false)} />
      )}
    </div>
  );
}

export default SalesforceNav;
