import React from 'react';
import SalesforceIcon from '../shared/SalesforceIcon';
import '../../styles/Calculator.scss';

/**
 * Collapsible section component used throughout calculator UIs
 * Provides consistent expand/collapse behavior with chevron animation
 * 
 * @param {string} title - Section header title
 * @param {boolean} expanded - Whether section is expanded
 * @param {function} onToggle - Callback when header is clicked
 * @param {React.ReactNode} children - Section content
 */
export default function CollapsibleSection({ title, expanded, onToggle, children }) {
  return (
    <section className="collapsible-section">
      <header 
        className={`collapsible-header ${expanded ? 'expanded' : ''}`}
        onClick={onToggle}
      >
        <h2 className="header-title">{title}</h2>
        <SalesforceIcon
          category="utility"
          name={expanded ? "chevronup" : "chevrondown"}
          size="x-small"
          className="chevron-icon"
        />
      </header>
      <div className={`collapsible-body ${!expanded ? 'collapsed' : ''}`}>
        {children}
      </div>
    </section>
  );
}
