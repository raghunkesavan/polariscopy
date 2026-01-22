import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import SalesforceIcon from '../shared/SalesforceIcon';
import '../../styles/help-icon.css';

/**
 * HelpIcon - Contextual help icon with custom portal tooltip (Carbon tooltip replaced)
 * Prevents cropping inside scrollable modals and stays positioned on scroll.
 *
 * @param {string} content - The help text or node to display.
 * @param {string} align - Preferred alignment: 'top' | 'bottom'. (Auto flips if needed.)
 * @param {string} label - Accessible label for the icon.
 */
export default function HelpIcon({ content, align = 'top', label = 'Help information' }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(align);
  // opacity used for fade-in once positioned
  const [style, setStyle] = useState({ top: 0, left: 0, opacity: 0 });
  const iconRef = useRef(null);
  const tooltipRef = useRef(null);
  const scrollParentRef = useRef(null);

  if (!content) return null;

  // Find nearest scrollable ancestor for reposition on internal scrolling
  const findScrollParent = (node) => {
    if (!node) return null;
    let current = node.parentElement;
    while (current) {
      const overflowY = window.getComputedStyle(current).overflowY;
      const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
      if (canScroll) return current;
      current = current.parentElement;
    }
    return window; // fallback to window scrolling
  };

  const computePosition = () => {
    const trigger = iconRef.current;
    const tip = tooltipRef.current;
    if (!trigger || !tip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const padding = 8;

    // Decide placement
    let desiredPlacement = align;
    if (align === 'top' && triggerRect.top < tipRect.height + padding) {
      desiredPlacement = 'bottom';
    } else if (align === 'bottom' && (window.innerHeight - triggerRect.bottom) < tipRect.height + padding) {
      desiredPlacement = 'top';
    }
    setPlacement(desiredPlacement);

    let top = desiredPlacement === 'top'
      ? triggerRect.top - tipRect.height - padding
      : triggerRect.bottom + padding;
    let left = triggerRect.left + (triggerRect.width / 2) - (tipRect.width / 2);

    // Clamp horizontally
    left = Math.max(padding, Math.min(left, window.innerWidth - tipRect.width - padding));

    setStyle({ top: window.scrollY + top, left: window.scrollX + left, opacity: 1 });
  };

  // Retry positioning if tooltip not yet measured (e.g., first open) using RAF chain
  const schedulePositioning = (attempt = 0) => {
    if (!open) return;
    requestAnimationFrame(() => {
      const tip = tooltipRef.current;
      if (tip) {
        computePosition();
      } else if (attempt < 3) {
        schedulePositioning(attempt + 1);
      }
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    // Position after portal mount
    computePosition();
    schedulePositioning();
    const scrollParent = findScrollParent(iconRef.current);
    scrollParentRef.current = scrollParent;

    const handler = () => computePosition();
    window.addEventListener('resize', handler);
    if (scrollParent && scrollParent !== window) scrollParent.addEventListener('scroll', handler, { passive: true });

    return () => {
      window.removeEventListener('resize', handler);
      if (scrollParent && scrollParent !== window) scrollParent.removeEventListener('scroll', handler);
    };
  }, [open, align]);

  // Open on hover/focus, close on leave/escape
  const openTooltip = () => { setOpen(true); };
  const closeTooltip = () => { setOpen(false); };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeTooltip();
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(o => !o);
      if (!open) schedulePositioning();
    }
  };

  const tooltipNode = open ? (
    ReactDOM.createPortal(
      <div ref={tooltipRef} className="app-tooltip" data-placement={placement} style={style} role="tooltip">
        <div className="app-tooltip__content">
          {content}
          <span className="app-tooltip__arrow" />
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        ref={iconRef}
        className="help-icon"
        type="button"
        aria-label={label}
        aria-expanded={open ? 'true' : 'false'}
        onMouseEnter={openTooltip}
        onFocus={openTooltip}
        onMouseLeave={closeTooltip}
        onBlur={closeTooltip}
        onMouseMove={() => { if (open) computePosition(); }}
        onKeyDown={onKeyDown}
      >
        <SalesforceIcon category="utility" name="info" size="x-small" />
      </button>
      {tooltipNode}
    </>
  );
}
