import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Products.css';

/**
 * Products - Display BTL and Bridging product rates in tabular format
 * 
 * Fetches rates from backend API (no Supabase keys exposed on frontend)
 * Supports multiple product categories and tiers with dynamic rate display
 */
const Products = () => {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState('btl'); // 'btl' or 'bridging'
  const [subTab, setSubTab] = useState('core');
  const [ratesData, setRatesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAssetClassPanel, setShowAssetClassPanel] = useState(false);
  const [showLtvRestrictionsPanel, setShowLtvRestrictionsPanel] = useState(false);
  const [expandedLtvSection, setExpandedLtvSection] = useState(null);

  // Fetch rates from backend API
  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Determine set_key and property based on selected tabs
      const params = new URLSearchParams();
      
      if (mainTab === 'btl') {
        if (subTab === 'core') {
          params.append('set_key', 'RATES_CORE');
          params.append('is_retention', 'false');
        } else if (subTab === 'specialist') {
          params.append('set_key', 'RATES_SPEC');
          params.append('property', 'Residential');
        } else if (subTab === 'commercial') {
          params.append('set_key', 'RATES_SPEC');
          params.append('property', 'Commercial');
        } else if (subTab === 'semi-commercial') {
          params.append('set_key', 'RATES_SPEC');
          params.append('property', 'Semi-Commercial');
        }
      } else if (mainTab === 'bridging') {
        if (subTab === 'variable') {
          params.append('set_key', 'Bridging_Var');
        } else if (subTab === 'fixed') {
          params.append('set_key', 'Bridging_Fix');
        } else if (subTab === 'fusion') {
          params.append('set_key', 'Fusion');
        }
      }

      const response = await fetch(`${API_BASE}/api/rates?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`);
      }

      const { rates } = await response.json();
      setRatesData(rates || []);
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mainTab, subTab]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Handle main tab change
  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setSubTab(tab === 'btl' ? 'core' : 'variable');
  };

  // Transform rates data into structured format for BTL
  const transformBTLData = useCallback(() => {
    const structured = {};

    ratesData.forEach(rate => {
      // Normalize tier format: '1' -> 'Tier 1', '2' -> 'Tier 2', etc.
      const tierNum = String(rate.tier || '1');
      const tier = tierNum.startsWith('Tier') ? tierNum : `Tier ${tierNum}`;
      const product = rate.product || 'Unknown';
      const productFee = rate.product_fee;
      const maxLtv = rate.max_ltv || 0;
      // Rates are already in percentage format (e.g., 5.79, not 0.0579)
      const rateValue = rate.rate || 0;
      const revertMargin = rate.revert_margin;
      const revertIndex = rate.revert_index || 'MVR';
      const maxDeferInt = rate.max_defer_int;
      const maxRolledMonths = rate.max_rolled_months;

      if (!structured[tier]) {
        structured[tier] = {
          products: {},
          maxDeferInt,
          maxRolledMonths
        };
      }

      if (!structured[tier].products[product]) {
        structured[tier].products[product] = {
          feeRanges: new Set(),
          ltvRates: {},
          maxDeferInt: maxDeferInt  // Store product-specific defer
        };
      }
      
      // Update defer if current product has it (tracker may have different defer)
      if (maxDeferInt !== null && maxDeferInt !== undefined) {
        structured[tier].products[product].maxDeferInt = maxDeferInt;
      }

      if (productFee !== null && productFee !== undefined) {
        structured[tier].products[product].feeRanges.add(Number(productFee));
      }

      // Group by LTV and fee
      const ltvKey = `${maxLtv}_${productFee}`;
      if (!structured[tier].products[product].ltvRates[ltvKey]) {
        structured[tier].products[product].ltvRates[ltvKey] = {
          ltv: maxLtv,
          fee: productFee,
          rate: rateValue,
          revertMargin,
          revertIndex
        };
      }
    });

    return structured;
  }, [ratesData]);

  // Render BTL rates table
  const renderBTLTable = () => {
    const structured = transformBTLData();
    const tiers = Object.keys(structured).sort();

    if (tiers.length === 0) {
      return (
        <div className="slds-text-align_center slds-p-around_large">
          <p className="slds-text-body_regular">No rates available for this product category</p>
        </div>
      );
    }

    // Get unique fee values from all tiers (to create rows for each fee)
    const allFees = new Set();
    tiers.forEach(tier => {
      const tierData = structured[tier];
      Object.values(tierData.products || {}).forEach(productData => {
        if (productData.feeRanges) {
          productData.feeRanges.forEach(fee => allFees.add(fee));
        }
      });
    });
    const feeList = Array.from(allFees).sort((a, b) => a - b); // Ascending order

    // Product types to display
    const productTypes = ['3yr Fix', '2yr Fix', '2yr Tracker'];
    
    // Check if this is Core (no defer/roll up)
    const isCore = subTab === 'core';

    return (
      <div className="slds-scrollable_x">
        <table className="slds-table slds-table_bordered slds-table_cell-buffer products-rates-table">
          <thead>
            {/* Tier headers */}
            <tr className="slds-line-height_reset">
              <th scope="col" rowSpan="2" className="products-rates-table__label-col">
                <span className="slds-assistive-text">Rate Type</span>
              </th>
              {tiers.map(tier => (
                <th 
                  key={tier} 
                  scope="col" 
                  colSpan="3" 
                  className={`slds-text-align_center products-rates-table__tier-header products-rates-table__tier-header--${tier.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="slds-truncate">{tier}</div>
                </th>
              ))}
            </tr>
            {/* Product type headers */}
            <tr className="slds-line-height_reset">
              {tiers.map(tier => (
                <React.Fragment key={`${tier}-products`}>
                  {productTypes.map(product => (
                    <th key={`${tier}-${product}`} scope="col" className="slds-text-align_center products-rates-table__product-col">
                      <div className="slds-truncate">{product}</div>
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* For each fee, show: Fee range row, Rate row, Revert rate row */}
            {feeList.map(fee => (
              <React.Fragment key={fee}>
                {/* Fee Range Row for this specific fee - merged per tier */}
                <tr className="products-rates-table__fee-row">
                  <th scope="row" className="products-rates-table__label-cell">
                    <div className="slds-truncate">Fee range</div>
                  </th>
                  {tiers.map(tier => {
                    // Check if any product in this tier has this fee
                    const tierData = structured[tier];
                    const hasAnyFee = productTypes.some(product => {
                      const productData = tierData?.products?.[product];
                      return productData?.feeRanges?.has(fee);
                    });
                    const feeText = hasAnyFee ? `${fee}% fee range` : '—';
                    
                    return (
                      <td key={`${tier}-${fee}-feerange`} colSpan="3" className="slds-text-align_center">
                        <div className="slds-truncate">{feeText}</div>
                      </td>
                    );
                  })}
                </tr>

                {/* Rate row for this fee */}
                <tr className="products-rates-table__rate-row">
                  <th scope="row" className="products-rates-table__label-cell">
                    <div className="slds-truncate">Rate</div>
                  </th>
                  {tiers.map(tier => (
                    <React.Fragment key={`${tier}-${fee}-rate`}>
                      {productTypes.map(product => {
                        const productData = structured[tier]?.products?.[product];
                        // Get rate for this specific fee
                        const rateEntry = Object.values(productData?.ltvRates || {}).find(r => Number(r.fee) === fee);
                        const rateValue = rateEntry?.rate;
                        const isTracker = product.includes('Tracker');
                        
                        let displayValue = '—';
                        if (rateValue !== undefined && rateValue !== null) {
                          // Rates are already in percentage format
                          const percentage = Number(rateValue).toFixed(2);
                          displayValue = isTracker ? `${percentage}% +BBR` : `${percentage}%`;
                        }
                        
                        return (
                          <td key={`${tier}-${product}-${fee}-rate`} className="slds-text-align_center">
                            <div className="slds-truncate">{displayValue}</div>
                          </td>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tr>
                
                {/* Revert rate row for this fee - merged per tier */}
                <tr className="products-rates-table__revert-row">
                  <th scope="row" className="products-rates-table__label-cell">
                    <div className="slds-truncate">Revert rate</div>
                  </th>
                  {tiers.map(tier => {
                    const tierData = structured[tier];
                    // Get revert margin from any product in this tier (should be same for all)
                    let revertText = 'MVR';
                    
                    // For Tier 1, always just "MVR"
                    // For other tiers, show margin if available
                    if (tier !== 'Tier 1') {
                      const anyProduct = productTypes.find(p => tierData?.products?.[p]);
                      if (anyProduct) {
                        const productData = tierData.products[anyProduct];
                        const rateEntry = Object.values(productData?.ltvRates || {}).find(r => Number(r.fee) === fee);
                        if (rateEntry?.revertMargin !== null && rateEntry?.revertMargin !== undefined) {
                          const margin = Number(rateEntry.revertMargin);
                          const sign = margin >= 0 ? '+' : '';
                          revertText = `MVR ${sign}${margin}%`;
                        }
                      }
                    }
                    
                    return (
                      <td key={`${tier}-${fee}-revert`} colSpan="3" className="slds-text-align_center">
                        <div className="slds-truncate">{revertText}</div>
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}

            {/* Defer up to - only for Specialist, Commercial, Semi-Commercial (not Core) */}
            {!isCore && (
              <tr className="products-rates-table__info-row">
                <th scope="row" className="products-rates-table__label-cell">
                  <div className="slds-truncate">Defer up to</div>
                </th>
                {tiers.map(tier => {
                  const tierData = structured[tier];
                  const defaultDefer = tierData?.maxDeferInt || '—';
                  
                  // Get defer for each product type from database
                  const fixedDefer3yr = tierData?.products?.['3yr Fix']?.maxDeferInt || defaultDefer;
                  const trackerDefer = tierData?.products?.['2yr Tracker']?.maxDeferInt || defaultDefer;
                  
                  // Use the first fixed product's defer (usually same for both)
                  const fixedDeferText = fixedDefer3yr !== '—' ? `${fixedDefer3yr}%` : '—';
                  const trackerDeferText = trackerDefer !== '—' ? `${trackerDefer}%` : '—';
                  
                  return (
                    <React.Fragment key={`${tier}-defer`}>
                      {/* Merged cell for both fixed products (3yr Fix + 2yr Fix) */}
                      <td colSpan="2" className="slds-text-align_center">
                        <div className="slds-truncate">{fixedDeferText}</div>
                      </td>
                      {/* Separate cell for tracker with database defer */}
                      <td className="slds-text-align_center">
                        <div className="slds-truncate">{trackerDeferText}</div>
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            )}

            {/* Roll up to - only for Specialist, Commercial, Semi-Commercial (not Core) */}
            {!isCore && (
              <tr className="products-rates-table__info-row">
                <th scope="row" className="products-rates-table__label-cell">
                  <div className="slds-truncate">Roll up to</div>
                </th>
                {tiers.map(tier => {
                  const tierData = structured[tier];
                  const rollMonths = tierData?.maxRolledMonths || 0;
                  const rollText = rollMonths > 0 ? `${rollMonths} months interest payments` : '—';
                  return (
                    <td key={`${tier}-roll`} colSpan="3" className="slds-text-align_center">
                      <div className="slds-truncate">{rollText}</div>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="slds-container_fluid">
      {/* Header with Products title and actions */}
      <div className="slds-page-header">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-page-header__name">
              <h1>
                <span className="slds-page-header__title slds-truncate">Products</span>
              </h1>
            </div>
          </div>
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
              {user && (
                <span className="slds-text-body_regular slds-m-right_small">Welcome back, <strong>{user.name || user.email}</strong></span>
              )}
              <button 
                className="slds-button slds-button_neutral" 
                title="Asset Class Information"
                onClick={() => setShowAssetClassPanel(true)}
              >
                ℹ️ Asset Class
              </button>
              <button 
                className="slds-button slds-button_neutral" 
                title="LTV Restrictions Information"
                onClick={() => setShowLtvRestrictionsPanel(true)}
              >
                ℹ️ LTV Restrictions
              </button>
              <button className="slds-button slds-button_neutral" title="Support">
                ℹ️ Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="slds-tabs_default">
        <ul className="slds-tabs_default__nav" role="tablist">
          <li 
            className={`slds-tabs_default__item ${mainTab === 'btl' ? 'slds-is-active' : ''}`}
            role="presentation"
          >
            <button
              className="slds-tabs_default__link"
              role="tab"
              aria-selected={mainTab === 'btl'}
              aria-controls="btl-panel"
              onClick={() => handleMainTabChange('btl')}
            >
              Buy to Let
            </button>
          </li>
          <li 
            className={`slds-tabs_default__item ${mainTab === 'bridging' ? 'slds-is-active' : ''}`}
            role="presentation"
          >
            <button
              className="slds-tabs_default__link"
              role="tab"
              aria-selected={mainTab === 'bridging'}
              aria-controls="bridging-panel"
              onClick={() => handleMainTabChange('bridging')}
            >
              Bridge & Fusion
            </button>
          </li>
        </ul>

        {/* BTL Tab Content */}
        <div 
          id="btl-panel" 
          className={`slds-tabs_default__content ${mainTab === 'btl' ? 'slds-show' : 'slds-hide'}`}
          role="tabpanel"
        >
          {/* BTL Sub Tabs */}
          <div className="slds-tabs_scoped">
            <ul className="slds-tabs_scoped__nav" role="tablist">
              <li 
                className={`slds-tabs_scoped__item ${subTab === 'core' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_scoped__link"
                  role="tab"
                  aria-selected={subTab === 'core'}
                  onClick={() => setSubTab('core')}
                >
                  Core Residential BTL
                </button>
              </li>
              <li 
                className={`slds-tabs_scoped__item ${subTab === 'specialist' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_scoped__link"
                  role="tab"
                  aria-selected={subTab === 'specialist'}
                  onClick={() => setSubTab('specialist')}
                >
                  Specialist Residential BTL
                </button>
              </li>
              <li 
                className={`slds-tabs_scoped__item ${subTab === 'commercial' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_scoped__link"
                  role="tab"
                  aria-selected={subTab === 'commercial'}
                  onClick={() => setSubTab('commercial')}
                >
                  Commercial BTL
                </button>
              </li>
              <li 
                className={`slds-tabs_scoped__item ${subTab === 'semi-commercial' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_scoped__link"
                  role="tab"
                  aria-selected={subTab === 'semi-commercial'}
                  onClick={() => setSubTab('semi-commercial')}
                >
                  Semi Commercial BTL
                </button>
              </li>
            </ul>
          </div>

          {/* BTL Content */}
          <div className="slds-p-around_medium">
            {loading && (
              <div className="slds-text-align_center slds-p-around_large">
                <div className="slds-spinner_container">
                  <div role="status" className="slds-spinner slds-spinner_medium">
                    <span className="slds-assistive-text">Loading rates...</span>
                    <div className="slds-spinner__dot-a"></div>
                    <div className="slds-spinner__dot-b"></div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="slds-notify slds-notify_alert slds-alert_error" role="alert">
                <span className="slds-assistive-text">error</span>
                <h2>Error loading rates: {error}</h2>
              </div>
            )}
            {!loading && !error && renderBTLTable()}
          </div>
        </div>

        {/* Bridging Tab Content */}
        <div 
          id="bridging-panel" 
          className={`slds-tabs_default__content ${mainTab === 'bridging' ? 'slds-show' : 'slds-hide'}`}
          role="tabpanel"
        >
          {/* Bridging Sub Tabs */}
          <div className="slds-tabs_scoped">
            <ul className="slds-tabs_scoped__nav" role="tablist">
              <li 
                className={`slds-tabs_scoped__item ${subTab === 'variable' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_scoped__link"
                  role="tab"
                  aria-selected={subTab === 'variable'}
                  onClick={() => setSubTab('variable')}
                >
                  Bridge Variable
                </button>
              </li>
              <li 
                className={`slds-tabs_scoped__item ${subTab === 'fixed' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_scoped__link"
                  role="tab"
                  aria-selected={subTab === 'fixed'}
                  onClick={() => setSubTab('fixed')}
                >
                  Bridge Fix
                </button>
              </li>
              <li 
                className={`slds-tabs_scoped__item ${subTab === 'fusion' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_scoped__link"
                  role="tab"
                  aria-selected={subTab === 'fusion'}
                  onClick={() => setSubTab('fusion')}
                >
                  Fusion
                </button>
              </li>
            </ul>
          </div>

          {/* Bridging Content */}
          <div className="slds-p-around_medium">
            {loading && (
              <div className="slds-text-align_center slds-p-around_large">
                <div className="slds-spinner_container">
                  <div role="status" className="slds-spinner slds-spinner_medium">
                    <span className="slds-assistive-text">Loading rates...</span>
                    <div className="slds-spinner__dot-a"></div>
                    <div className="slds-spinner__dot-b"></div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="slds-notify slds-notify_alert slds-alert_error" role="alert">
                <span className="slds-assistive-text">error</span>
                <h2>Error loading rates: {error}</h2>
              </div>
            )}
            {!loading && !error && (
              <div className="slds-text-align_center slds-p-around_large">
                <p className="slds-text-body_regular">Bridging rates table will be implemented here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asset Class LTVs Panel */}
      {showAssetClassPanel && (
        <>
          <div className="slds-backdrop slds-backdrop_open" onClick={() => setShowAssetClassPanel(false)}></div>
          <section 
            className="slds-panel slds-panel_docked slds-panel_docked-right slds-is-open" 
            style={{ 
              width: '75rem', 
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              zIndex: 9001,
              backgroundColor: '#ffffff'
            }}
          >
            <div className="slds-panel__header" style={{ height: '4rem !important', minHeight: '4rem !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: '#f3f3f3', borderBottom: '1px solid #dddbda' }}>
              <h2 className="slds-panel__header-title slds-text-heading_small slds-truncate" style={{ margin: 0, fontWeight: 700 }}>Asset Class LTVs</h2>
              <button 
                className="slds-button slds-button_icon slds-button_icon-small" 
                onClick={() => setShowAssetClassPanel(false)}
                title="Close"
                style={{ marginLeft: 'auto' }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
                <span className="slds-assistive-text">Close</span>
              </button>
            </div>
            <div className="slds-panel__body" style={{ padding: '1rem', overflowX: 'hidden' }}>
              <div className="slds-scrollable_y" style={{ maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto', overflowX: 'hidden' }}>
                <table className="slds-table slds-table_bordered slds-table_cell-buffer slds-table_striped" style={{ width: '100%', tableLayout: 'auto' }}>
                  <thead>
                    <tr className="slds-line-height_reset">
                      <th scope="col" style={{ minWidth: '180px', wordWrap: 'break-word' }}>Asset Class</th>
                      <th scope="col" style={{ minWidth: '100px', wordWrap: 'break-word' }}>Use Class</th>
                      <th scope="col" style={{ minWidth: '120px', wordWrap: 'break-word' }}>Lending Appetite</th>
                      <th scope="col" style={{ minWidth: '300px', wordWrap: 'break-word' }}>Description</th>
                      <th scope="col" style={{ minWidth: '80px', wordWrap: 'break-word' }}>Max LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Student Accommodation</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C2, C4</td>
                      <td style={{ backgroundColor: '#90ee90', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>75% by exception (C3 class falls under residential)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>HMOs</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C4, SG</td>
                      <td style={{ backgroundColor: '#90ee90', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>75% by exception (C3 class falls under residential)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Light Industrial</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B2</td>
                      <td style={{ backgroundColor: '#90ee90', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Warehousing / Logistics</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B8</td>
                      <td style={{ backgroundColor: '#90ee90', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Offices</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A2, B1a / E</td>
                      <td style={{ backgroundColor: '#90ee90', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Medical Clinics</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D1 / E</td>
                      <td style={{ backgroundColor: '#90ee90', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Education Centres</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D1 / F1</td>
                      <td style={{ backgroundColor: '#90ee90', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Care Homes</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C2</td>
                      <td style={{ backgroundColor: '#d4edda', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Retail</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A1 / F2, E</td>
                      <td style={{ backgroundColor: '#d4edda', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Shopping Centres</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A1 / E</td>
                      <td style={{ backgroundColor: '#d4edda', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Leisure</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D2 / E</td>
                      <td style={{ backgroundColor: '#d4edda', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Hospitality Venues</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C1, D2 / E</td>
                      <td style={{ backgroundColor: '#d4edda', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Light Industrial (steel frame)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B2, B8</td>
                      <td style={{ backgroundColor: '#d4edda', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Hotels / Holiday Lets (exc. B&B - Residential)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C1</td>
                      <td style={{ backgroundColor: '#d4edda', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Pubs</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A4 / SG</td>
                      <td style={{ backgroundColor: '#fff3cd', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Takeaways</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A5 / SG</td>
                      <td style={{ backgroundColor: '#fff3cd', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Restaurants</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A3 / E</td>
                      <td style={{ backgroundColor: '#fff3cd', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Petrol Stations</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: '#fff3cd', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Derelict / Uninhabitable Buildings</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>All</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Heavy Industrial / Manufacturing</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B1c / E</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Football Stadiums</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D2 / F2</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Contaminated Sites</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>All</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Waste Management</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Cash Intensive Businesses</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>e.g. nightclubs, casinos, foreign exchange, arcades</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Land (with or without planning)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Caravan Parks</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A / D / SG</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Religious Establishments</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D1 / F1</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Prisons / Secure Establishments</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C2a</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Sporting Grounds</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: '#d6e9f5', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {/* LTV Restrictions Panel */}
      {showLtvRestrictionsPanel && (
        <>
          <div className="slds-backdrop slds-backdrop_open" onClick={() => setShowLtvRestrictionsPanel(false)}></div>
          <section 
            className="slds-panel slds-panel_docked slds-panel_docked-right slds-is-open" 
            style={{ 
              width: '50rem', 
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              zIndex: 9001,
              backgroundColor: '#ffffff'
            }}
          >
            <div className="slds-panel__header" style={{ height: '4rem', minHeight: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: '#f3f3f3', borderBottom: '1px solid #dddbda' }}>
              <h2 className="slds-panel__header-title slds-text-heading_small slds-truncate" style={{ margin: 0, fontWeight: 700 }}>LTV Restrictions</h2>
              <button 
                className="slds-button slds-button_icon slds-button_icon-small" 
                onClick={() => setShowLtvRestrictionsPanel(false)}
                title="Close"
                style={{ marginLeft: 'auto' }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
                <span className="slds-assistive-text">Close</span>
              </button>
            </div>
            <div className="slds-panel__body" style={{ padding: '0', overflowX: 'hidden' }}>
              <div className="slds-scrollable_y" style={{ maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto', overflowX: 'hidden' }}>
                {/* Accordion sections */}
                <div className="slds-accordion">
                  {/* First Time Buyer / First Time Landlord */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'ftb' ? null : 'ftb')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'ftb' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>First Time Buyer / First Time Landlord</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'ftb' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid #dddbda' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid #dddbda' }}>Max LTV is reserved for standard property use as well as Borrowers with prior buy to let experience (not FTL / FTB)</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* HMO > 6 Beds */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'hmo' ? null : 'hmo')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'hmo' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>HMO &gt; 6 Beds</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'hmo' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid #dddbda' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid #dddbda' }}>Max LTV is reserved for standard property use</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* MUFB > 6 Units */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'mufb' ? null : 'mufb')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'mufb' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>MUFB &gt; 6 Units</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'mufb' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'mufb' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>Max LTV is reserved for standard property use</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Non-Standard Construction */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'nonstandard' ? null : 'nonstandard')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Non-Standard Construction</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'nonstandard' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'nonstandard' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>Subject to any repairs being done/appropriate warranties. Depends on other lender criteria</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>65%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Flats above commercial */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'flats' ? null : 'flats')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Flats above commercial</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'flats' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'flats' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>Tier 2</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>60%</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>Tier 3</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>65%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Development Exit */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'development' ? null : 'development')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Development Exit</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'development' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'development' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>If repaying development lender, ground up builds, conversions, heavy works conducted</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Vulnerable Tenants / SERCO Lease */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'vulnerable' ? null : 'vulnerable')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Vulnerable Tenants / SERCO Lease</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'vulnerable' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'vulnerable' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>Residential product if planning usage is C3, otherwise commercial</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Long Leases / Non-standard Lease */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'longlease' ? null : 'longlease')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Long Leases / Non-standard Lease</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'longlease' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'longlease' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>Leases over 3 years not let to individuals</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Holiday Let / Services Accommodation */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'holidaylet' ? null : 'holidaylet')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Holiday Let / Services Accommodation</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'holidaylet' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'holidaylet' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>If C3 usage and can be let as either AST or Holiday let, potentially 75%</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Holiday Let with Restricted Use */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'holidayrestricted' ? null : 'holidayrestricted')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Holiday Let with Restricted Use</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'holidayrestricted' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'holidayrestricted' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>If only able to use as a holiday let</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>65%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* New Builds */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'newbuilds' ? null : 'newbuilds')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>New Builds</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'newbuilds' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'newbuilds' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>First occupation</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Retirement Property */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'retirement' ? null : 'retirement')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Retirement Property</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'retirement' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'retirement' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>Restrictions for over 55's only</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>65%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* High Exposure / Concentration in a particular building */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'highexposure' ? null : 'highexposure')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>High Exposure / Concentration in a particular building</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'highexposure' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'highexposure' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>i.e. taking 10 flats in a block of 10</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Adverse Credit (Tier 3) */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'adverse' ? null : 'adverse')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Adverse Credit (Tier 4)</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'adverse' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'adverse' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>LTV could be further restricted based on level and type of adverse</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>—</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Low Demand Area / Poor Condition */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid #dddbda' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'lowdemand' ? null : 'lowdemand')}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Low Demand Area / Poor Condition</span>
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)' }}>{expandedLtvSection === 'lowdemand' ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'lowdemand' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '60%' }}>Description</th>
                              <th style={{ backgroundColor: '#f3f3f3', fontWeight: 600, padding: '0.5rem', width: '40%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>LTV could be further restricted</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Products;
