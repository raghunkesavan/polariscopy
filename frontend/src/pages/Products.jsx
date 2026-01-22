import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import WelcomeHeader from '../components/shared/WelcomeHeader';
import ProductsTable from '../components/tables/ProductsTable';
import '../styles/Products.css';

/**
 * Products - Display BTL and Bridging product rates in tabular format
 * 
 * Fetches rates from backend API (no Supabase keys exposed on frontend)
 * Supports multiple product categories and tiers with dynamic rate display
 * 
 * @param {object} props
 * @param {string} props.initialTab - Initial tab to display ('btl' or 'bridging')
 */
const Products = ({ initialTab = 'btl' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mainTab, setMainTab] = useState(initialTab); // 'btl' or 'bridging'
  const [subTab, setSubTab] = useState(initialTab === 'btl' ? 'specialist' : 'variable');
  
  // Update mainTab when initialTab prop changes
  useEffect(() => {
    setMainTab(initialTab);
    setSubTab(initialTab === 'btl' ? 'specialist' : 'variable');
    setBridgingPropertyTab('residential');
  }, [initialTab]);
  const [bridgingPropertyTab, setBridgingPropertyTab] = useState('residential'); // 'residential' or 'commercial'
  const [ratesData, setRatesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAssetClassPanel, setShowAssetClassPanel] = useState(false);
  const [showLtvRestrictionsPanel, setShowLtvRestrictionsPanel] = useState(false);
  const [expandedLtvSection, setExpandedLtvSection] = useState(null);
  const [showSupportPanel, setShowSupportPanel] = useState(false);
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    bugType: '',
    suggestion: ''
  });
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Inline editing state (Admin only)
  const [editingCell, setEditingCell] = useState(null); // { rateId, field, value }
  const [editValue, setEditValue] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  // Check if user is admin (access_level = 1)
  const isAdmin = user?.access_level === 1;

  // Initialize support form with user data
  useEffect(() => {
    if (user) {
      setSupportForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Handle support form submission
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingSupport(true);
    
    try {
      // Use backend API URL from environment or default
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: supportForm.name,
          email: supportForm.email,
          bugType: supportForm.bugType,
          suggestion: supportForm.suggestion,
          page: 'Products'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit support request');
      }
      
      showToast({
        kind: 'success',
        title: 'Request Sent',
        subtitle: 'Your support request has been submitted successfully.'
      });
      
      setShowSupportPanel(false);
      setSupportForm(prev => ({
        ...prev,
        bugType: '',
        suggestion: ''
      }));
    } catch (err) {
      showToast({
        kind: 'error',
        title: 'Error',
        subtitle: 'Failed to submit support request. Please try again.'
      });
    } finally {
      setSubmittingSupport(false);
    }
  };

  // =============================================
  // INLINE EDITING FUNCTIONS (Admin Only)
  // =============================================

  // Start editing a rate cell
  const handleStartEdit = (rateId, field, currentValue, context) => {
    if (!isAdmin) {
      return;
    }
    if (!rateId) {
      return;
    }
    setEditingCell({ rateId, field, context });
    setEditValue(currentValue?.toString() || '');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Save edited rate
  const handleSaveRate = async () => {
    if (!editingCell || !isAdmin) return;

    const { rateId, field, context } = editingCell;
    const newValue = parseFloat(editValue);

    // Validate
    if (isNaN(newValue) || newValue < 0 || newValue > 100) {
      showToast({
        kind: 'error',
        title: 'Invalid Value',
        subtitle: 'Rate must be a number between 0 and 100'
      });
      return;
    }

    setSavingRate(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');

      // Determine table name based on current tab
      let tableName = 'rates_flat';
      if (mainTab === 'bridging') {
        tableName = 'bridge_fusion_rates_full';
      }

      const response = await fetch(`${API_BASE}/api/rates/${rateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          field,
          value: newValue,
          tableName,
          oldValue: context?.oldValue,
          context: {
            set_key: context?.set_key,
            product: context?.product,
            property: context?.property,
            min_ltv: context?.min_ltv,
            max_ltv: context?.max_ltv
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update rate');
      }

      showToast({
        kind: 'success',
        title: 'Rate Updated',
        subtitle: `${field} updated to ${newValue}%`
      });

      // Refresh rates data
      fetchRates();
      handleCancelEdit();

    } catch (err) {
      console.error('Error updating rate:', err);
      showToast({
        kind: 'error',
        title: 'Update Failed',
        subtitle: err.message || 'Failed to update rate. Please try again.'
      });
    } finally {
      setSavingRate(false);
    }
  };

  // Handle key press in edit input
  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveRate();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

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
        // Determine set_key based on sub-tab
        if (subTab === 'variable') {
          params.append('set_key', 'Bridging_Var');
        } else if (subTab === 'fixed') {
          params.append('set_key', 'Bridging_Fix');
        } else if (subTab === 'fusion') {
          params.append('set_key', 'Fusion');
        }
        
        // Add property filter based on bridging property tab
        // For Residential tab, we fetch Residential property
        // For Commercial tab, we fetch Semi-Commercial and Commercial properties
        if (bridgingPropertyTab === 'residential') {
          params.append('property', 'Residential');
        }
        // For commercial, we'll fetch all and filter client-side to get Semi-Commercial and Commercial
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
  }, [mainTab, subTab, bridgingPropertyTab]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Handle main tab change
  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setSubTab(tab === 'btl' ? 'core' : 'variable');
  };

  // Handle bridging sub-tab change (Variable, Fixed, Fusion)
  const handleBridgingSubTabChange = (tab) => {
    setSubTab(tab);
  };

  // Transform rates data into structured format for BTL


  // =============================================
  // BRIDGING RATES FUNCTIONS
  // =============================================

  // Transform bridging rates data into structured format
  const transformBridgingData = useCallback(() => {
    const structured = {};
    
    // Filter data based on property tab
    const filteredData = bridgingPropertyTab === 'residential' 
      ? ratesData.filter(r => r.property === 'Residential')
      : ratesData.filter(r => r.property === 'Semi-Commercial' || r.property === 'Commercial');

    filteredData.forEach(rate => {
      const product = rate.product || 'Unknown';
      // Parse as numbers to ensure proper comparison
      const minLtv = parseInt(rate.min_ltv, 10) || 0;
      const maxLtv = parseInt(rate.max_ltv, 10) || 0;
      const rateValue = rate.rate || 0;
      const minLoan = rate.min_loan || '';
      const maxLoan = rate.max_loan || '';
      const chargeType = rate.charge_type || 'First Charge';
      const minTerm = rate.min_term || 3;
      const maxTerm = rate.max_term || 18;
      const productFee = rate.product_fee || 2;

      if (!structured[product]) {
        structured[product] = {
          ltvRates: {},
          minLoan,
          maxLoan,
          chargeType,
          minTerm,
          maxTerm,
          productFee,
          maxLtv: 0
        };
      }

      // Track highest max LTV for this product
      if (maxLtv > structured[product].maxLtv) {
        structured[product].maxLtv = maxLtv;
      }

      // Store rate by LTV bracket (include id for editing)
      const ltvKey = `${minLtv}-${maxLtv}`;
      structured[product].ltvRates[ltvKey] = {
        id: rate.id,  // Include database ID for editing
        minLtv,
        maxLtv,
        rate: rateValue
      };
    });

    return structured;
  }, [ratesData, bridgingPropertyTab]);

  // Transform Fusion rates data into structured format
  const transformFusionData = useCallback(() => {
    const structured = {};
    
    // Filter data based on property tab
    const filteredData = bridgingPropertyTab === 'residential' 
      ? ratesData.filter(r => r.property === 'Residential')
      : ratesData.filter(r => r.property === 'Semi-Commercial' || r.property === 'Commercial');

    filteredData.forEach(rate => {
      const product = rate.product || 'Unknown';
      const rateValue = rate.rate || 0;
      const minLoan = rate.min_loan || '';
      const maxLoan = rate.max_loan || '';
      const maxLtv = rate.max_ltv || 70;
      const productFee = rate.product_fee || 2;
      const minTerm = rate.min_term || 24;
      const maxTerm = rate.max_term || 24;
      const minRolledMonths = rate.min_rolled_months || 6;
      const maxRolledMonths = rate.max_rolled_months || 12;
      const maxDeferInt = rate.max_defer_int || 2;
      const erc1 = rate.erc_1 || 3;
      const erc2 = rate.erc_2 || 1.5;

      if (!structured[product]) {
        structured[product] = {
          id: rate.id,  // Include database ID for editing
          rate: rateValue,
          minLoan,
          maxLoan,
          maxLtv,
          productFee,
          minTerm,
          maxTerm,
          minRolledMonths,
          maxRolledMonths,
          maxDeferInt,
          erc1,
          erc2
        };
      }
    });

    return structured;
  }, [ratesData, bridgingPropertyTab]);

  // Get product display order for bridging tables - dynamically from data
  const getBridgingProducts = useCallback((structured, isCommercial) => {
    // Get all products that exist in the structured data
    const availableProducts = Object.keys(structured);
    
    if (availableProducts.length === 0) {
      return [];
    }
    
    // Define preferred display order (products not in this list will be added at the end)
    const preferredOrder = isCommercial
      ? [
          'Semi-Commercial',
          'Semi-Commercial Large Loan',
          'Permitted & Light Development Finance',
          'Developer Exit Bridge (Multiple Units)',
          'Commercial',
          'Commercial Large Loan'
        ]
      : [
          'BTL Single Property Investment',
          'Large Single Property Investment',
          'BTL Portfolio Investment',
          'Developer Exit Bridge (Multiple Units)',
          'Permitted & Light Development Finance',
          'Second Charge'
        ];
    
    // Sort available products: first by preferred order, then alphabetically for any extras
    const orderedProducts = [];
    
    // Add products in preferred order if they exist
    preferredOrder.forEach(product => {
      if (availableProducts.includes(product)) {
        orderedProducts.push(product);
      }
    });
    
    // Add any remaining products not in preferred order (alphabetically)
    availableProducts
      .filter(p => !preferredOrder.includes(p))
      .sort()
      .forEach(product => {
        orderedProducts.push(product);
      });
    
    return orderedProducts;
  }, []);

  // Get Fusion product display order
  const getFusionProductOrder = () => {
    return ['Small', 'Medium', 'Large'];
  };

  // Format loan range for display
  const formatLoanRange = (minLoan, maxLoan) => {
    const formatValue = (val) => {
      if (!val) return '';
      // Clean up the value and format
      const cleaned = String(val).replace(/[£?,]/g, '');
      const num = parseInt(cleaned, 10);
      if (isNaN(num)) return val;
      if (num >= 1000000) return `£${(num / 1000000).toFixed(0)}m`;
      if (num >= 1000) return `£${(num / 1000).toFixed(0)}k`;
      return `£${num}`;
    };
    
    const min = formatValue(minLoan);
    const max = formatValue(maxLoan);
    if (max.includes('+') || maxLoan === '£10m+' || maxLoan === '10m+') {
      return `${min}+`;
    }
    return `${min} - ${max}`;
  };

  // Render Bridging rates table (Variable or Fixed)
  const renderBridgingTable = () => {
    const structured = transformBridgingData();
    const isCommercial = bridgingPropertyTab === 'commercial';
    
    // Get products dynamically from the data
    const products = getBridgingProducts(structured, isCommercial);

    if (products.length === 0) {
      return (
        <div className="slds-text-align_center slds-p-around_large">
          <p className="slds-text-body_regular">No rates available for this category</p>
        </div>
      );
    }

    // Determine header color based on tab
    const isVariable = subTab === 'variable';
    const headerStyle = isVariable 
      ? { background: 'linear-gradient(135deg, var(--token-color-brand-navy) 0%, #003d8f 100%)', color: '#ffffff' }
      : { background: 'linear-gradient(135deg, #dd7a01 0%, #fe9339 100%)', color: '#ffffff' };

    // LTV brackets to display
    const ltvBrackets = [
      { label: 'Rates: 60% LTV', key: '0-60' },
      { label: 'Rates: 70% LTV', key: '60-70' },
      { label: 'Rates: 75% LTV', key: '70-75' }
    ];

    return (
      <div className="slds-scrollable_x">
        <table className="slds-table slds-table_bordered slds-table_cell-buffer products-rates-table products-bridging-table">
          <thead>
            <tr>
              <th 
                scope="col" 
                className={`products-rates-table__label-col ${isVariable ? 'products-bridging-table__header--variable' : 'products-bridging-table__header--fixed'}`}
              >
                <div className="products-bridging-table__header-text">Our Products</div>
              </th>
              {products.map(product => (
                <th 
                  key={product} 
                  scope="col" 
                  className="slds-text-align_center products-bridging-table__product-header"
                >
                  <div className="products-bridging-table__product-name">{product}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Rate rows by LTV */}
            {ltvBrackets.map(ltv => (
              <tr key={ltv.key} className="products-rates-table__rate-row">
                <th scope="row" className="products-rates-table__label-cell">
                  <div className="slds-truncate">{ltv.label}</div>
                </th>
                {products.map(product => {
                  const productData = structured[product];
                  const rateData = productData?.ltvRates[ltv.key];
                  const rateValue = rateData?.rate;
                  // Check if this LTV bracket exceeds product's max LTV
                  const maxLtvNum = parseInt(ltv.key.split('-')[1], 10);
                  const productMaxLtv = productData?.maxLtv || 75;
                  const isNA = maxLtvNum > productMaxLtv || !rateValue;
                  
                  const rateId = rateData?.id;
                  const isEditing = editingCell?.rateId === rateId && editingCell?.field === 'rate';

                  return (
                    <td 
                      key={`${product}-${ltv.key}`} 
                      className={`slds-text-align_center ${isAdmin && !isNA ? 'products-rate-cell--editable' : ''}`}
                    >
                      {isEditing ? (
                        <div className="products-rate-cell__edit-container">
                          <input
                            type="number"
                            className="products-rate-cell__input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleEditKeyPress}
                            step="0.01"
                            min="0"
                            max="100"
                            autoFocus
                            disabled={savingRate}
                          />
                          <div className="products-rate-cell__edit-actions">
                            <button
                              type="button"
                              className="products-rate-cell__save-btn"
                              onClick={handleSaveRate}
                              disabled={savingRate}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="products-rate-cell__cancel-btn"
                              onClick={handleCancelEdit}
                              disabled={savingRate}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`slds-truncate ${isAdmin && !isNA ? 'products-rate-cell__value products-rate-cell--pointer' : 'products-rate-cell--default'}`}
                          onClick={() => {
                            if (isAdmin && !isNA && rateId) {
                              handleStartEdit(rateId, 'rate', rateValue, {
                                oldValue: rateValue,
                                set_key: subTab === 'variable' ? 'Bridging_Var' : subTab === 'fixed' ? 'Bridging_Fix' : 'Fusion',
                                product,
                                property: bridgingPropertyTab,
                                min_ltv: ltv.key.split('-')[0],
                                max_ltv: ltv.key.split('-')[1]
                              });
                            }
                          }}
                          title={isAdmin && !isNA ? 'Click to edit' : undefined}
                        >
                          {isNA ? 'N/a' : `${rateValue}%`}
                          {isAdmin && !isNA && (
                            <span className="products-rate-cell__edit-icon">✎</span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Separator row */}
            <tr className="products-table__spacer-row">
              <td colSpan={products.length + 1}></td>
            </tr>

            {/* Loan Size row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Loan Size</div>
              </th>
              {products.map(product => {
                const productData = structured[product];
                return (
                  <td key={`${product}-loan`} className="slds-text-align_center">
                    <div className="slds-truncate">
                      {formatLoanRange(productData?.minLoan, productData?.maxLoan)}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Max LTV row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Max. LTV</div>
              </th>
              {products.map((product, idx) => {
                const productData = structured[product];
                const maxLtv = productData?.maxLtv || 75;
                // Check if all products have same max LTV for colspan
                const allSame = products.every(p => (structured[p]?.maxLtv || 75) === maxLtv);
                if (idx === 0) {
                  return (
                    <td 
                      key={`${product}-maxltv`} 
                      className="slds-text-align_center"
                      colSpan={allSame ? products.length : 1}
                    >
                      <div className="slds-truncate">{maxLtv}%</div>
                    </td>
                  );
                }
                if (allSame) return null;
                return (
                  <td key={`${product}-maxltv`} className="slds-text-align_center">
                    <div className="slds-truncate">{maxLtv}%</div>
                  </td>
                );
              })}
            </tr>

            {/* Charge Type row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Charge Type</div>
              </th>
              {products.map((product, idx) => {
                const productData = structured[product];
                const chargeType = productData?.chargeType || 'First Charge';
                const displayCharge = chargeType.includes('Second') ? '2nd' : '1st';
                // Check if all products have same charge type
                const allSame = products.every(p => {
                  const ct = structured[p]?.chargeType || 'First Charge';
                  return ct === chargeType;
                });
                if (idx === 0) {
                  return (
                    <td 
                      key={`${product}-charge`} 
                      className="slds-text-align_center"
                      colSpan={allSame ? products.length : 1}
                    >
                      <div className="slds-truncate">{displayCharge}</div>
                    </td>
                  );
                }
                if (allSame) return null;
                return (
                  <td key={`${product}-charge`} className="slds-text-align_center">
                    <div className="slds-truncate">{displayCharge}</div>
                  </td>
                );
              })}
            </tr>

            {/* Term row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Term <span className="products-table__label-annotation">(months)</span></div>
              </th>
              {products.map((product, idx) => {
                const productData = structured[product];
                const minTerm = productData?.minTerm || 3;
                const maxTerm = productData?.maxTerm || 18;
                const termText = `${minTerm} - ${maxTerm}`;
                // All bridging products have same term
                if (idx === 0) {
                  return (
                    <td 
                      key={`${product}-term`} 
                      className="slds-text-align_center"
                      colSpan={products.length}
                    >
                      <div className="slds-truncate">{termText}</div>
                    </td>
                  );
                }
                return null;
              })}
            </tr>

            {/* Arrangement Fee row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Arrangement Fee <span className="products-table__label-annotation">(from)</span></div>
              </th>
              {products.map((product, idx) => {
                const productData = structured[product];
                const fee = productData?.productFee || 2;
                // All bridging products have same fee
                if (idx === 0) {
                  return (
                    <td 
                      key={`${product}-fee`} 
                      className="slds-text-align_center"
                      colSpan={products.length}
                    >
                      <div className="slds-truncate">{fee}%</div>
                    </td>
                  );
                }
                return null;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Fusion rates table
  const renderFusionTable = () => {
    const structured = transformFusionData();
    const productOrder = getFusionProductOrder();
    
    // Filter to only products that exist in data
    const products = productOrder.filter(p => structured[p]);

    if (products.length === 0) {
      return (
        <div className="slds-text-align_center slds-p-around_large">
          <p className="slds-text-body_regular">No Fusion rates available for this category</p>
        </div>
      );
    }

    // Fusion header colors - teal gradient
    const headerColors = {
      'Small': { bg: '#0d9488', letter: 'S' },
      'Medium': { bg: '#f59e0b', letter: 'M' },
      'Large': { bg: '#0d9488', letter: 'L' }
    };

    return (
      <div className="slds-scrollable_x">
        <table className="slds-table slds-table_bordered slds-table_cell-buffer products-rates-table">
          <thead>
            <tr>
              <th 
                scope="col" 
                className="products-rates-table__label-col"
              >
              </th>
              {products.map(product => {
                const colorConfig = headerColors[product] || { bg: '#0d9488', letter: product.slice(-1) };
                return (
                  <th 
                    key={product} 
                    scope="col" 
                    className="products-fusion-table__product-header"
                  >
                    <div className="products-fusion-table__product-name">
                      <span className="products-fusion-table__fusion-text">
                        Fusion
                      </span>
                      <span className={`products-fusion-table__badge ${colorConfig.bg === '#f59e0b' ? 'products-fusion-table__badge--orange' : 'products-fusion-table__badge--teal'}`}>
                        {colorConfig.letter}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Coupon Rate row */}
            <tr className="products-rates-table__rate-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Coupon Rate <span className="products-table__label-annotation">(+BBR)</span></div>
              </th>
              {products.map(product => {
                const productData = structured[product];
                const rateId = productData?.id;
                const rateValue = productData?.rate;
                const isEditing = editingCell?.rateId === rateId && editingCell?.field === 'rate';
                const hasRate = rateValue !== undefined && rateValue !== null;

                return (
                  <td 
                    key={`${product}-rate`} 
                    className={`slds-text-align_center products-fusion-table__rate-cell ${isAdmin && hasRate ? 'products-rate-cell--editable' : ''}`}
                  >
                    {isEditing ? (
                      <div className="products-rate-cell__edit-container">
                        <input
                          type="number"
                          className="products-rate-cell__input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleEditKeyPress}
                          step="0.01"
                          min="0"
                          max="100"
                          autoFocus
                          disabled={savingRate}
                        />
                        <div className="products-rate-cell__edit-actions">
                          <button
                            type="button"
                            className="products-rate-cell__save-btn"
                            onClick={handleSaveRate}
                            disabled={savingRate}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="products-rate-cell__cancel-btn"
                            onClick={handleCancelEdit}
                            disabled={savingRate}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`slds-truncate ${isAdmin && hasRate ? 'products-rate-cell__value' : ''}`}
                        style={{ fontWeight: 600, cursor: isAdmin && hasRate ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (isAdmin && hasRate && rateId) {
                            handleStartEdit(rateId, 'rate', rateValue, {
                              oldValue: rateValue,
                              set_key: 'Fusion',
                              product,
                              property: bridgingPropertyTab
                            });
                          }
                        }}
                        title={isAdmin && hasRate ? 'Click to edit' : undefined}
                      >
                        {hasRate ? `${rateValue}%` : '—'}
                        {isAdmin && hasRate && (
                          <span className="products-rate-cell__edit-icon">✎</span>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Loan Size row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Loan Size</div>
              </th>
              {products.map(product => {
                const productData = structured[product];
                return (
                  <td key={`${product}-loan`} className="slds-text-align_center products-fusion-table__rate-cell">
                    <div className="slds-truncate">
                      {formatLoanRange(productData?.minLoan, productData?.maxLoan)}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Separator */}
            <tr className="products-table__spacer-row">
              <td colSpan={products.length + 1}></td>
            </tr>

            {/* Max LTV row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Max LTV</div>
              </th>
              <td className="slds-text-align_center" colSpan={products.length}>
                <div className="slds-truncate">{structured[products[0]]?.maxLtv || 70}%</div>
              </td>
            </tr>

            {/* Arrangement Fee row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Arrangement Fee</div>
              </th>
              <td className="slds-text-align_center" colSpan={products.length}>
                <div className="slds-truncate">{structured[products[0]]?.productFee || 2}%</div>
              </td>
            </tr>

            {/* Initial Term row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Initial Term</div>
              </th>
              <td className="slds-text-align_center" colSpan={products.length}>
                <div className="products-table__cell-content--column">
                  <span>{structured[products[0]]?.minTerm || 24} months</span>
                  <span className="products-table__helper-text">(+12 month discretionary extension available)</span>
                </div>
              </td>
            </tr>

            {/* Min Rolled Interest row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Min. Rolled Interest</div>
              </th>
              <td className="slds-text-align_center" colSpan={products.length}>
                <div className="slds-truncate">{structured[products[0]]?.minRolledMonths || 6} months</div>
              </td>
            </tr>

            {/* Max Rolled Interest row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Max Rolled Interest</div>
              </th>
              <td className="slds-text-align_center" colSpan={products.length}>
                <div className="products-table__cell-content--column">
                  <span>{structured[products[0]]?.maxRolledMonths || 12} months</span>
                  <span className="products-table__helper-text">(then serviced)</span>
                </div>
              </td>
            </tr>

            {/* Deferred Interest row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">Deferred Interest</div>
              </th>
              <td className="slds-text-align_center" colSpan={products.length}>
                <div className="slds-truncate">{structured[products[0]]?.maxDeferInt || 2}%</div>
              </td>
            </tr>

            {/* Separator */}
            <tr className="products-table__spacer-row">
              <td colSpan={products.length + 1}></td>
            </tr>

            {/* ERC row */}
            <tr className="products-rates-table__info-row">
              <th scope="row" className="products-rates-table__label-cell">
                <div className="slds-truncate">ERC</div>
              </th>
              <td className="slds-text-align_center" colSpan={products.length}>
                <div className="products-table__cell-content--column">
                  <span>{structured[products[0]]?.erc1 || 3}% in year 1</span>
                  <span>{structured[products[0]]?.erc2 || 1.5}% in year 2</span>
                  <span className="products-table__helper-text" style={{ marginTop: 'var(--token-spacing-xs)' }}>25% ERC free after 6 months, no ERC after 21 months</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page-container page-container--table">
      {/* Header with actions */}
      <div className="slds-page-header">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <WelcomeHeader />
          </div>
          <div className="slds-page-header__col-actions">
            <div className="slds-page-header__controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs - Tab buttons hidden, content still visible */}
      <div className="slds-tabs_default">
        <ul className="slds-tabs_default__nav" role="tablist" style={{ display: 'none' }}>
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
          {/* BTL Sub Tabs – switch to default tabs to match Bridging */}
          <div className="slds-tabs_default">
            <ul className="slds-tabs_default__nav" role="tablist">
              <li 
                className={`slds-tabs_default__item ${subTab === 'specialist' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={subTab === 'specialist'}
                  onClick={() => setSubTab('specialist')}
                >
                  Specialist Residential
                </button>
              </li>
              <li 
                className={`slds-tabs_default__item ${subTab === 'core' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={subTab === 'core'}
                  onClick={() => setSubTab('core')}
                >
                  Core Residential
                </button>
              </li>
              <li 
                className={`slds-tabs_default__item ${subTab === 'commercial' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={subTab === 'commercial'}
                  onClick={() => setSubTab('commercial')}
                >
                  Commercial
                </button>
              </li>
              <li 
                className={`slds-tabs_default__item ${subTab === 'semi-commercial' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={subTab === 'semi-commercial'}
                  onClick={() => setSubTab('semi-commercial')}
                >
                  Semi Commercial
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
            {!loading && !error && (
              <ProductsTable
                ratesData={ratesData}
                subTab={subTab}
                isAdmin={isAdmin}
                onStartEdit={handleStartEdit}
                editingCell={editingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                onSaveRate={handleSaveRate}
                onCancelEdit={handleCancelEdit}
                savingRate={savingRate}
              />
            )}
          </div>
        </div>

        {/* Bridging Tab Content */}
        <div 
          id="bridging-panel" 
          className={`slds-tabs_default__content ${mainTab === 'bridging' ? 'slds-show' : 'slds-hide'}`}
          role="tabpanel"
        >
          {/* Residential / Commercial Property Tabs - Using slds-tabs_default__nav */}
          <div className="slds-tabs_default">
            <ul className="slds-tabs_default__nav" role="tablist">
              <li 
                className={`slds-tabs_default__item ${bridgingPropertyTab === 'residential' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={bridgingPropertyTab === 'residential'}
                  onClick={() => setBridgingPropertyTab('residential')}
                >
                  Residential
                </button>
              </li>
              <li 
                className={`slds-tabs_default__item ${bridgingPropertyTab === 'commercial' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={bridgingPropertyTab === 'commercial'}
                  onClick={() => setBridgingPropertyTab('commercial')}
                >
                  Commercial
                </button>
              </li>
            </ul>
          </div>

          {/* Bridging Sub Tabs - Using slds-tabs_default__nav */}
          <div className="slds-tabs_default">
            <ul className="slds-tabs_default__nav" role="tablist">
              <li 
                className={`slds-tabs_default__item ${subTab === 'variable' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={subTab === 'variable'}
                  onClick={() => handleBridgingSubTabChange('variable')}
                >
                  Variable
                </button>
              </li>
              <li 
                className={`slds-tabs_default__item ${subTab === 'fixed' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={subTab === 'fixed'}
                  onClick={() => handleBridgingSubTabChange('fixed')}
                >
                  Fixed
                </button>
              </li>
              <li 
                className={`slds-tabs_default__item ${subTab === 'fusion' ? 'slds-is-active' : ''}`}
                role="presentation"
              >
                <button
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={subTab === 'fusion'}
                  onClick={() => handleBridgingSubTabChange('fusion')}
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
              <>
                {/* Render appropriate table */}
                {subTab === 'fusion' ? renderFusionTable() : renderBridgingTable()}
                
                {/* Version footer */}
                <div className="slds-text-align_center slds-m-top_medium">
                  <span style={{ fontSize: 'var(--token-font-size-xs)', color: 'var(--token-text-muted)' }}>(Version 12/2025-1)</span>
                </div>
              </>
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
            <div className="slds-panel__header products-panel__header">
              <h2 className="slds-panel__header-title slds-text-heading_small slds-truncate products-panel__header-title">Asset Class LTVs</h2>
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
                      <td style={{ backgroundColor: 'var(--token-status-strong-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>75% by exception (C3 class falls under residential)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>HMOs</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C4, SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-strong-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>75% by exception (C3 class falls under residential)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Light Industrial</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B2</td>
                      <td style={{ backgroundColor: 'var(--token-status-strong-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Warehousing / Logistics</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B8</td>
                      <td style={{ backgroundColor: 'var(--token-status-strong-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Offices</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A2, B1a / E</td>
                      <td style={{ backgroundColor: 'var(--token-status-strong-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Medical Clinics</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D1 / E</td>
                      <td style={{ backgroundColor: 'var(--token-status-strong-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Education Centres</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D1 / F1</td>
                      <td style={{ backgroundColor: 'var(--token-status-strong-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Strong</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Care Homes</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C2</td>
                      <td style={{ backgroundColor: 'var(--token-status-good-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Retail</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A1 / F2, E</td>
                      <td style={{ backgroundColor: 'var(--token-status-good-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Shopping Centres</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A1 / E</td>
                      <td style={{ backgroundColor: 'var(--token-status-good-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Leisure</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D2 / E</td>
                      <td style={{ backgroundColor: 'var(--token-status-good-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>70% considered for strong borrower / tenant profile</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Hospitality Venues</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C1, D2 / E</td>
                      <td style={{ backgroundColor: 'var(--token-status-good-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Light Industrial (steel frame)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B2, B8</td>
                      <td style={{ backgroundColor: 'var(--token-status-good-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Hotels / Holiday Lets (exc. B&B - Residential)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C1</td>
                      <td style={{ backgroundColor: 'var(--token-status-good-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Good</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Pubs</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A4 / SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-limited-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Takeaways</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A5 / SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-limited-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Restaurants</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A3 / E</td>
                      <td style={{ backgroundColor: 'var(--token-status-limited-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Petrol Stations</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-limited-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Limited</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>By referral and VP & M valuation only</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>65%</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Derelict / Uninhabitable Buildings</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>All</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Heavy Industrial / Manufacturing</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>B1c / E</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Football Stadiums</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D2 / F2</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Contaminated Sites</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>All</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Waste Management</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Cash Intensive Businesses</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>e.g. nightclubs, casinos, foreign exchange, arcades</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Land (with or without planning)</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Caravan Parks</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>A / D / SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Religious Establishments</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>D1 / F1</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Prisons / Secure Establishments</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>C2a</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>—</td>
                    </tr>
                    <tr>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>Sporting Grounds</td>
                      <td style={{ wordWrap: 'break-word', overflow: 'hidden' }}>SG</td>
                      <td style={{ backgroundColor: 'var(--token-status-excluded-bg)', wordWrap: 'break-word', overflow: 'hidden' }}>Excluded</td>
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
              width: '30rem', 
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              zIndex: 9001,
              backgroundColor: '#ffffff'
            }}
          >
            <div className="slds-panel__header" style={{ height: '4rem', minHeight: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: 'var(--token-layer-background)', borderBottom: '1px solid var(--token-border-medium)' }}>
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
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
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
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Max LTV is reserved for standard property use as well as Borrowers with prior buy to let experience (not FTL / FTB)</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* HMO > 6 Beds */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
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
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Max LTV is reserved for standard property use</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* MUFB > 6 Units */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'mufb' ? null : 'mufb')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'mufb' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>MUFB &gt; 6 Units</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'mufb' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Max LTV is reserved for standard property use</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Non-Standard Construction */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'nonstandard' ? null : 'nonstandard')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'nonstandard' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Non-Standard Construction</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'nonstandard' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
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
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'flats' ? null : 'flats')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'flats' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Flats above commercial</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'flats' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Tier 2</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>60%</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Tier 3</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>65%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Development Exit */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'development' ? null : 'development')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'development' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Development Exit</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'development' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>If repaying development lender, ground up builds, conversions, heavy works conducted</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Vulnerable Tenants / SERCO Lease */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'vulnerable' ? null : 'vulnerable')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'vulnerable' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Vulnerable Tenants / SERCO Lease</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'vulnerable' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Residential product if planning usage is C3, otherwise commercial</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Long Leases / Non-standard Lease */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'longlease' ? null : 'longlease')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'longlease' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Long Leases / Non-standard Lease</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'longlease' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Leases over 3 years not let to individuals</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                  {/* Holiday Let / Services Accommodation */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'holidaylet' ? null : 'holidaylet')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'holidaylet' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Holiday Let / Services Accommodation</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'holidaylet' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>If C3 usage and can be let as either AST or Holiday let, potentially 75%</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Holiday Let with Restricted Use */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'holidayrestricted' ? null : 'holidayrestricted')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'holidayrestricted' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Holiday Let with Restricted Use</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'holidayrestricted' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>If only able to use as a holiday let</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>65%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* New Builds */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'newbuilds' ? null : 'newbuilds')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'newbuilds' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>New Builds</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'newbuilds' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>First occupation</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Retirement Property */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'retirement' ? null : 'retirement')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'retirement' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Retirement Property</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'retirement' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>Restrictions for over 55's only</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>65%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* High Exposure / Concentration in a particular building */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'highexposure' ? null : 'highexposure')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'highexposure' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>High Exposure / Concentration in a particular building</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'highexposure' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>i.e. taking 10 flats in a block of 10</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>70%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Adverse Credit (Tier 3) */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'adverse' ? null : 'adverse')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'adverse' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Adverse Credit (Tier 3)</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'adverse' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>LTV could be further restricted based on level and type of adverse</td>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>—</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Low Demand Area / Poor Condition */}
                  <section className="slds-accordion__section" style={{ borderBottom: '1px solid var(--token-border-medium)' }}>
                    <div className="slds-accordion__summary">
                      <button 
                        className="slds-button slds-button_reset slds-accordion__summary-action" 
                        style={{ width: '100%', padding: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => setExpandedLtvSection(expandedLtvSection === 'lowdemand' ? null : 'lowdemand')}
                      >
                        <span style={{ fontSize: 'var(--token-font-size-xl-minus)', minWidth: '1rem' }}>{expandedLtvSection === 'lowdemand' ? '−' : '+'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Low Demand Area / Poor Condition</span>
                      </button>
                    </div>
                    {expandedLtvSection === 'lowdemand' && (
                      <div className="slds-accordion__content" style={{ padding: '1rem' }}>
                        <table className="slds-table slds-table_bordered slds-table_cell-buffer" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '75%', borderRight: '1px solid var(--token-border-medium)' }}>Description</th>
                              <th style={{ backgroundColor: 'var(--token-layer-background)', fontWeight: 600, padding: '0.5rem', width: '25%' }}>Max LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', wordWrap: 'break-word', whiteSpace: 'normal', borderRight: '1px solid var(--token-border-medium)' }}>LTV could be further restricted</td>
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

      {/* Support Panel */}
      {showSupportPanel && (
        <>
          <div className="slds-backdrop slds-backdrop_open" onClick={() => setShowSupportPanel(false)}></div>
          <section 
            className="slds-panel slds-panel_docked slds-panel_docked-right slds-is-open" 
            style={{ 
              width: '30rem', 
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              zIndex: 9001,
              backgroundColor: '#ffffff'
            }}
          >
            <div className="slds-panel__header" style={{ height: '4rem', minHeight: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: 'var(--token-layer-background)', borderBottom: '1px solid var(--token-border-medium)' }}>
              <h2 className="slds-panel__header-title slds-text-heading_small slds-truncate" style={{ margin: 0, fontWeight: 700 }}>Support</h2>
              <button 
                className="slds-button slds-button_icon slds-button_icon-small" 
                onClick={() => setShowSupportPanel(false)}
                title="Close"
                style={{ marginLeft: 'auto' }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
                <span className="slds-assistive-text">Close</span>
              </button>
            </div>
            <div className="slds-panel__body" style={{ padding: '1.5rem', overflowY: 'auto', height: 'calc(100vh - 8rem)' }}>
              <form onSubmit={handleSupportSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--token-form-field-gap, 2rem)', marginBottom: '1.5rem' }}>
                  <div className="slds-form-element">
                    <label className="slds-form-element__label" htmlFor="support-name">
                      <abbr className="slds-required" title="required">* </abbr>Name
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="text"
                        id="support-name"
                        className="slds-input"
                        value={supportForm.name}
                        onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="slds-form-element">
                    <label className="slds-form-element__label" htmlFor="support-email">
                      <abbr className="slds-required" title="required">* </abbr>Email
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="email"
                        id="support-email"
                        className="slds-input"
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="slds-form-element slds-m-bottom_medium">
                  <label className="slds-form-element__label" htmlFor="support-bug-type">
                    Is there a bug?
                  </label>
                  <div className="slds-form-element__control">
                    <select
                      id="support-bug-type"
                      className="slds-select"
                      value={supportForm.bugType}
                      onChange={(e) => setSupportForm({ ...supportForm, bugType: e.target.value })}
                    >
                      <option value="">Please select...</option>
                      <option value="calculation">Calculation Issue</option>
                      <option value="display">Display/UI Issue</option>
                      <option value="performance">Performance Issue</option>
                      <option value="data">Data/Rate Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="slds-form-element slds-m-bottom_medium">
                  <label className="slds-form-element__label" htmlFor="support-suggestion">
                    How would you suggest to improve it?
                  </label>
                  <div className="slds-form-element__control">
                    <textarea
                      id="support-suggestion"
                      className="slds-textarea"
                      rows="5"
                      value={supportForm.suggestion}
                      onChange={(e) => setSupportForm({ ...supportForm, suggestion: e.target.value })}
                      placeholder="Describe the issue or your suggestion..."
                    />
                  </div>
                </div>
                
                <div className="slds-form-element">
                  <button
                    type="submit"
                    className="slds-button slds-button_brand"
                    
                    disabled={submittingSupport}
                  >
                    {submittingSupport ? 'Sending...' : 'Send request'}
                  </button>
                </div>
              </form>
            </div>
            <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid var(--token-border-medium)', padding: '0.75rem 1.5rem', backgroundColor: 'var(--token-layer-background)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--token-text-muted)', fontSize: 'var(--token-font-size-sm)' }}>
                <span style={{ fontSize: 'var(--token-font-size-md)' }}>ℹ️</span>
                <span>V. 2.4 - Updated Auto logout and Caching</span>
              </div>
            </footer>
          </section>
        </>
      )}
    </div>
  );
};

export default Products;



