import { useEffect, useState } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import NotificationModal from '../modals/NotificationModal';
import {
  PRODUCT_TYPES_LIST as DEFAULT_PRODUCT_TYPES_LIST,
  FEE_COLUMNS as DEFAULT_FEE_COLUMNS,
  FLAT_ABOVE_COMMERCIAL_RULE as DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
  MARKET_RATES as DEFAULT_MARKET_RATES,
  BROKER_ROUTES as DEFAULT_BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS as DEFAULT_BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE as DEFAULT_BROKER_COMMISSION_TOLERANCE,
  FUNDING_LINES_BTL,
  FUNDING_LINES_BRIDGE,
  UI_PREFERENCES as DEFAULT_UI_PREFERENCES,
  LOCALSTORAGE_CONSTANTS_KEY,
} from '../../config/constants';
import useTypography from '../../hooks/useTypography';
import '../../styles/slds.css';
import '../../styles/GlobalSettings.css';
import SalesforceIcon from '../shared/SalesforceIcon';
import WelcomeHeader from '../shared/WelcomeHeader';

function readOverrides() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeOverrides(obj) {
  localStorage.setItem(LOCALSTORAGE_CONSTANTS_KEY, JSON.stringify(obj));
}

export default function Constants() {
  const [productLists, setProductLists] = useState(DEFAULT_PRODUCT_TYPES_LIST);
  const [feeColumns, setFeeColumns] = useState(DEFAULT_FEE_COLUMNS);
  const [flatAboveCommercialRule, setFlatAboveCommercialRule] = useState(DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
  const [marketRates, setMarketRates] = useState(DEFAULT_MARKET_RATES);
  const [brokerRoutes, setBrokerRoutes] = useState(DEFAULT_BROKER_ROUTES);
  const [brokerCommissionDefaults, setBrokerCommissionDefaults] = useState(DEFAULT_BROKER_COMMISSION_DEFAULTS);
  const [brokerCommissionTolerance, setBrokerCommissionTolerance] = useState(DEFAULT_BROKER_COMMISSION_TOLERANCE);
  const [fundingLinesBTL, setFundingLinesBTL] = useState([]);
  const [fundingLinesBridge, setFundingLinesBridge] = useState([]);
  const [message, setMessage] = useState('');
  const { supabase } = useSupabase();
  const [saving, setSaving] = useState(false);
  // per-field editing state and temporary values
  const [editingFields, setEditingFields] = useState({});
  const [tempValues, setTempValues] = useState({});
  
  // Typography toggle
  const { enabled: typographyEnabled, toggle: toggleTypography } = useTypography();
  
  // Broker route add/delete state
  const [showAddRouteForm, setShowAddRouteForm] = useState(false);
  const [newRouteKey, setNewRouteKey] = useState('');
  const [newRouteDisplayName, setNewRouteDisplayName] = useState('');
  const [newRouteCommission, setNewRouteCommission] = useState('0.9');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, routeKey: '', displayName: '' });
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  // Accordion state
  const [expandedSections, setExpandedSections] = useState({
    productLists: true,
    feeColumns: false,
    flatAbove: false,
    marketRates: false,
    brokerSettings: false,
    fundingLines: false,
    typography: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const willExpand = !prev[section];
      // collapse all, then expand only the selected if toggling on
      const allCollapsed = Object.keys(prev).reduce((acc, key) => { acc[key] = false; return acc; }, {});
      return { ...allCollapsed, [section]: willExpand };
    });
  };

  // defensive: if someone saved an invalid shape to localStorage or constants,
  // ensure rendering doesn't throw. Treat non-object productLists/feeColumns as missing.
  const safeProductLists = (productLists && typeof productLists === 'object' && !Array.isArray(productLists)) ? productLists : DEFAULT_PRODUCT_TYPES_LIST;
  const safeFeeColumns = (feeColumns && typeof feeColumns === 'object' && !Array.isArray(feeColumns)) ? feeColumns : DEFAULT_FEE_COLUMNS;
  const safeFundingLinesBTL = Array.isArray(fundingLinesBTL) && fundingLinesBTL.length ? fundingLinesBTL : FUNDING_LINES_BTL;
  const safeFundingLinesBridge = Array.isArray(fundingLinesBridge) && fundingLinesBridge.length ? fundingLinesBridge : FUNDING_LINES_BRIDGE;

  // Warn user before leaving page if there are unsaved changes
  useEffect(() => {
    const hasUnsavedChanges = Object.keys(editingFields).some(key => editingFields[key]);
    
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editingFields]);

  useEffect(() => {
    const overrides = readOverrides();
    if (overrides) {
      setProductLists(overrides.productLists || DEFAULT_PRODUCT_TYPES_LIST);
      setFeeColumns(overrides.feeColumns || DEFAULT_FEE_COLUMNS);
      setFlatAboveCommercialRule(overrides.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
      setMarketRates(overrides.marketRates || DEFAULT_MARKET_RATES);
      setBrokerRoutes(overrides.brokerRoutes || DEFAULT_BROKER_ROUTES);
      setBrokerCommissionDefaults(overrides.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS);
      setBrokerCommissionTolerance(overrides.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
      setFundingLinesBTL(overrides.fundingLinesBTL || FUNDING_LINES_BTL);
      setFundingLinesBridge(overrides.fundingLinesBridge || FUNDING_LINES_BRIDGE);
      // initialize temp values
      const tv = {};
      // product lists: tolerate malformed overrides (strings/arrays) and fall back to defaults per key
      const opl = overrides.productLists;
      const plSource = (opl && typeof opl === 'object' && !Array.isArray(opl)) ? opl : DEFAULT_PRODUCT_TYPES_LIST;
      Object.keys(plSource).forEach((pt) => {
        const raw = opl && opl[pt];
        let v = '';
        if (Array.isArray(raw)) v = raw.join(', ');
        else if (raw == null) v = (DEFAULT_PRODUCT_TYPES_LIST[pt] || []).join(', ');
        else v = String(raw);
        tv[`productLists:${pt}`] = v;
      });

      // fee columns: ensure we stringify arrays of numbers or fall back
      const ofc = overrides.feeColumns;
      const fcSource = (ofc && typeof ofc === 'object' && !Array.isArray(ofc)) ? ofc : DEFAULT_FEE_COLUMNS;
      Object.keys(fcSource).forEach((k) => {
        const raw = ofc && ofc[k];
        let v = '';
        if (Array.isArray(raw)) v = raw.join(', ');
        else if (raw == null) v = (DEFAULT_FEE_COLUMNS[k] || []).join(', ');
        else v = String(raw);
        tv[`feeColumns:${k}`] = v;
      });

      Object.keys(overrides.marketRates || DEFAULT_MARKET_RATES).forEach(k => { const v = ((overrides.marketRates?.[k] ?? 0) * 100).toFixed(2); tv[`marketRates:${k}`] = v; });
      tv['flatAbove:scopeMatcher'] = overrides.flatAboveCommercialRule?.scopeMatcher || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.scopeMatcher || '';
      tv['flatAbove:tier2'] = String(overrides.flatAboveCommercialRule?.tierLtv?.['2'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2'] ?? '');
      tv['flatAbove:tier3'] = String(overrides.flatAboveCommercialRule?.tierLtv?.['3'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3'] ?? '');
      
      // broker settings
      Object.keys(overrides.brokerRoutes || DEFAULT_BROKER_ROUTES).forEach(k => { tv[`brokerRoutes:${k}`] = (overrides.brokerRoutes?.[k] ?? DEFAULT_BROKER_ROUTES[k]); });
      Object.keys(overrides.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS).forEach(k => { 
        const val = overrides.brokerCommissionDefaults?.[k] ?? DEFAULT_BROKER_COMMISSION_DEFAULTS[k];
        if (typeof val === 'object' && val !== null) {
          tv[`brokerCommission:${k}:btl`] = String(val.btl ?? 0.9);
          tv[`brokerCommission:${k}:bridge`] = String(val.bridge ?? 0.9);
        } else {
          tv[`brokerCommission:${k}`] = String(val);
        }
      });
      tv['brokerTolerance'] = String(overrides.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
      tv['fundingLinesBTL'] = (overrides.fundingLinesBTL || FUNDING_LINES_BTL).join(', ');
      tv['fundingLinesBridge'] = (overrides.fundingLinesBridge || FUNDING_LINES_BRIDGE).join(', ');
      
      setTempValues(tv);
    }

    // listen for external localStorage changes (e.g. calculator updates overrides)
    const onStorage = (e) => {
      if (e.key !== LOCALSTORAGE_CONSTANTS_KEY) return;
      try {
        const newVal = e.newValue ? JSON.parse(e.newValue) : null;
        if (!newVal) return;
        setProductLists(newVal.productLists || DEFAULT_PRODUCT_TYPES_LIST);
        setFeeColumns(newVal.feeColumns || DEFAULT_FEE_COLUMNS);
        setFlatAboveCommercialRule(newVal.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
        setMarketRates(newVal.marketRates || DEFAULT_MARKET_RATES);
        setBrokerRoutes(newVal.brokerRoutes || DEFAULT_BROKER_ROUTES);
        setBrokerCommissionDefaults(newVal.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS);
        setBrokerCommissionTolerance(newVal.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
        setFundingLinesBTL(newVal.fundingLinesBTL || FUNDING_LINES_BTL);
        setFundingLinesBridge(newVal.fundingLinesBridge || FUNDING_LINES_BRIDGE);
        // re-seed temp values similarly to initial load
        const tv2 = {};
        Object.keys(newVal.productLists || DEFAULT_PRODUCT_TYPES_LIST).forEach(pt => { tv2[`productLists:${pt}`] = (newVal.productLists?.[pt] || DEFAULT_PRODUCT_TYPES_LIST[pt] || []).join(', '); });
        Object.keys(newVal.feeColumns || DEFAULT_FEE_COLUMNS).forEach(k => { tv2[`feeColumns:${k}`] = (newVal.feeColumns?.[k] || DEFAULT_FEE_COLUMNS[k] || []).join(', '); });
        Object.keys(newVal.marketRates || DEFAULT_MARKET_RATES).forEach(k => { const v = ((newVal.marketRates?.[k] ?? 0) * 100).toFixed(2); tv2[`marketRates:${k}`] = v; });
        tv2['flatAbove:scopeMatcher'] = newVal.flatAboveCommercialRule?.scopeMatcher || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.scopeMatcher || '';
        tv2['flatAbove:tier2'] = String(newVal.flatAboveCommercialRule?.tierLtv?.['2'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2'] ?? '');
        tv2['flatAbove:tier3'] = String(newVal.flatAboveCommercialRule?.tierLtv?.['3'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3'] ?? '');
        Object.keys(newVal.brokerRoutes || DEFAULT_BROKER_ROUTES).forEach(k => { tv2[`brokerRoutes:${k}`] = (newVal.brokerRoutes?.[k] ?? DEFAULT_BROKER_ROUTES[k]); });
        Object.keys(newVal.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS).forEach(k => { 
          const val = newVal.brokerCommissionDefaults?.[k] ?? DEFAULT_BROKER_COMMISSION_DEFAULTS[k];
          if (typeof val === 'object' && val !== null) {
            tv2[`brokerCommission:${k}:btl`] = String(val.btl ?? 0.9);
            tv2[`brokerCommission:${k}:bridge`] = String(val.bridge ?? 0.9);
          } else {
            tv2[`brokerCommission:${k}`] = String(val);
          }
        });
        tv2['brokerTolerance'] = String(newVal.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
        tv2['fundingLinesBTL'] = (newVal.fundingLinesBTL || FUNDING_LINES_BTL).join(', ');
        tv2['fundingLinesBridge'] = (newVal.fundingLinesBridge || FUNDING_LINES_BRIDGE).join(', ');
        setTempValues(tv2);
      } catch (err) {
        // Ignored storage event error
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // helpers to start/save/cancel per-field edits
  const startEdit = (key, initial) => {
    setEditingFields(prev => ({ ...prev, [key]: true }));
    setTempValues(prev => ({ ...prev, [key]: initial }));
  };

  const cancelEdit = (key, refreshFromState) => {
    setEditingFields(prev => ({ ...prev, [key]: false }));
    // reset temp to current state values if requested
    if (refreshFromState) {
      setTempValues(prev => ({ ...prev, [key]: prev[key] }));
    }
  };

  const saveEdit = async (key) => {
    // dispatch based on key prefix
    try {
      if (key.startsWith('productLists:')) {
        const pt = key.split(':')[1];
        await updateProductList(pt, tempValues[key] || '');
      } else if (key.startsWith('feeColumns:')) {
        const k = key.split(':')[1];
        await updateFeeColumn(k, tempValues[key] || '');
      } else if (key.startsWith('marketRates:')) {
        const field = key.split(':')[1];
        const n = Number(tempValues[key]);
        await updateMarketRate(field, tempValues[key]);
      } else if (key === 'flatAbove:scopeMatcher') {
        await updateFlatAbove('scopeMatcher', tempValues[key] || '');
      } else if (key === 'flatAbove:tier2') {
        await updateFlatAbove('tier2', tempValues[key] || '');
      } else if (key === 'flatAbove:tier3') {
        await updateFlatAbove('tier3', tempValues[key] || '');
      } else if (key.startsWith('brokerRoutes:')) {
        const routeKey = key.split(':')[1];
        await updateBrokerRoute(routeKey, tempValues[key] || '');
      } else if (key.startsWith('brokerCommission:')) {
        const parts = key.split(':');
        const route = parts[1];
        const calcType = parts[2]; // 'btl' or 'bridge' or undefined for legacy
        const n = Number(tempValues[key]);
        await updateBrokerCommission(route, n, calcType);
      } else if (key === 'brokerTolerance') {
        const n = Number(tempValues[key]);
        await updateBrokerTolerance(n);
      } else if (key === 'fundingLinesBTL') {
        await updateFundingLines('btl', tempValues[key] || '');
      } else if (key === 'fundingLinesBridge') {
        await updateFundingLines('bridge', tempValues[key] || '');
      }
    } catch (e) {
      // Failed to save field
    } finally {
      setEditingFields(prev => ({ ...prev, [key]: false }));
    }
  };

  // Persist to database. Uses app_settings table with separate rows per setting type.
  const saveToSupabase = async (payload) => {
    if (!supabase) return { error: 'Database client unavailable' };
    try {
      const timestamp = new Date().toISOString();
      
      // Create separate rows for each setting type
      const rows = [
        { key: 'product_lists', value: payload.productLists, updated_at: timestamp },
        { key: 'fee_columns', value: payload.feeColumns, updated_at: timestamp },
        { key: 'flat_above_commercial_rule', value: payload.flatAboveCommercialRule, updated_at: timestamp },
        { key: 'market_rates', value: payload.marketRates, updated_at: timestamp },
        { key: 'broker_routes', value: payload.brokerRoutes, updated_at: timestamp },
        { key: 'broker_commission_defaults', value: payload.brokerCommissionDefaults, updated_at: timestamp },
        { key: 'broker_commission_tolerance', value: payload.brokerCommissionTolerance, updated_at: timestamp },
        { key: 'funding_lines_btl', value: payload.fundingLinesBTL, updated_at: timestamp },
        { key: 'funding_lines_bridge', value: payload.fundingLinesBridge, updated_at: timestamp },
        { key: 'ui_preferences', value: payload.uiPreferences || {}, updated_at: timestamp },
      ];
      
      const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  useEffect(() => {
    let mounted = true;
    // Load constants from database
    (async () => {
      if (!supabase) return;
      try {
        // Fetch all setting rows from app_settings
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .in('key', [
            'product_lists',
            'fee_columns',
            'flat_above_commercial_rule',
            'market_rates',
            'broker_routes',
            'broker_commission_defaults',
            'broker_commission_tolerance',
            'funding_lines_btl',
            'funding_lines_bridge',
            'ui_preferences'
          ]);
        
        if (!error && data && data.length && mounted) {
          // Convert array of rows into single object
          const loadedData = {};
          data.forEach(row => {
            switch (row.key) {
              case 'product_lists':
                loadedData.productLists = row.value || DEFAULT_PRODUCT_TYPES_LIST;
                break;
              case 'fee_columns':
                loadedData.feeColumns = row.value || DEFAULT_FEE_COLUMNS;
                break;
              case 'flat_above_commercial_rule':
                loadedData.flatAboveCommercialRule = row.value || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE;
                break;
              case 'market_rates':
                loadedData.marketRates = row.value || DEFAULT_MARKET_RATES;
                break;
              case 'broker_routes':
                loadedData.brokerRoutes = row.value || DEFAULT_BROKER_ROUTES;
                break;
              case 'broker_commission_defaults':
                loadedData.brokerCommissionDefaults = row.value || DEFAULT_BROKER_COMMISSION_DEFAULTS;
                break;
              case 'broker_commission_tolerance':
                loadedData.brokerCommissionTolerance = row.value ?? DEFAULT_BROKER_COMMISSION_TOLERANCE;
                break;
              case 'funding_lines_btl':
                loadedData.fundingLinesBTL = row.value || FUNDING_LINES_BTL;
                break;
              case 'funding_lines_bridge':
                loadedData.fundingLinesBridge = row.value || FUNDING_LINES_BRIDGE;
                break;
              case 'ui_preferences':
                loadedData.uiPreferences = row.value || DEFAULT_UI_PREFERENCES;
                break;
              default:
                break;
            }
          });
          
          // Apply defaults for any missing keys
          loadedData.productLists = loadedData.productLists || DEFAULT_PRODUCT_TYPES_LIST;
          loadedData.feeColumns = loadedData.feeColumns || DEFAULT_FEE_COLUMNS;
          loadedData.flatAboveCommercialRule = loadedData.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE;
          loadedData.marketRates = loadedData.marketRates || DEFAULT_MARKET_RATES;
          loadedData.brokerRoutes = loadedData.brokerRoutes || DEFAULT_BROKER_ROUTES;
          loadedData.brokerCommissionDefaults = loadedData.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS;
          loadedData.brokerCommissionTolerance = loadedData.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE;
          loadedData.fundingLinesBTL = loadedData.fundingLinesBTL || FUNDING_LINES_BTL;
          loadedData.fundingLinesBridge = loadedData.fundingLinesBridge || FUNDING_LINES_BRIDGE;
          loadedData.uiPreferences = loadedData.uiPreferences || DEFAULT_UI_PREFERENCES;
          
          // Update state
          setProductLists(loadedData.productLists);
          setFeeColumns(loadedData.feeColumns);
          setFlatAboveCommercialRule(loadedData.flatAboveCommercialRule);
          setMarketRates(loadedData.marketRates);
          setBrokerRoutes(loadedData.brokerRoutes);
          setBrokerCommissionDefaults(loadedData.brokerCommissionDefaults);
          setBrokerCommissionTolerance(loadedData.brokerCommissionTolerance);
          setFundingLinesBTL(loadedData.fundingLinesBTL);
          setFundingLinesBridge(loadedData.fundingLinesBridge);
          
          // Update localStorage to match
          writeOverrides(loadedData);
          
          // Update tempValues to reflect loaded data
          const tv = {};
          Object.keys(loadedData.productLists).forEach((pt) => {
            const arr = loadedData.productLists[pt];
            tv[`productLists:${pt}`] = Array.isArray(arr) ? arr.join(', ') : String(arr || '');
          });
          Object.keys(loadedData.feeColumns).forEach((k) => {
            const arr = loadedData.feeColumns[k];
            tv[`feeColumns:${k}`] = Array.isArray(arr) ? arr.join(', ') : String(arr || '');
          });
          Object.keys(loadedData.marketRates).forEach(k => {
            tv[`marketRates:${k}`] = ((loadedData.marketRates[k] ?? 0) * 100).toFixed(2);
          });
          tv['flatAbove:scopeMatcher'] = loadedData.flatAboveCommercialRule?.scopeMatcher || '';
          tv['flatAbove:tier2'] = String(loadedData.flatAboveCommercialRule?.tierLtv?.['2'] ?? '');
          tv['flatAbove:tier3'] = String(loadedData.flatAboveCommercialRule?.tierLtv?.['3'] ?? '');
          Object.keys(loadedData.brokerRoutes).forEach(k => {
            tv[`brokerRoutes:${k}`] = loadedData.brokerRoutes[k];
          });
          Object.keys(loadedData.brokerCommissionDefaults).forEach(k => {
            const val = loadedData.brokerCommissionDefaults[k];
            if (typeof val === 'object' && val !== null) {
              tv[`brokerCommission:${k}:btl`] = String(val.btl ?? 0.9);
              tv[`brokerCommission:${k}:bridge`] = String(val.bridge ?? 0.9);
            } else {
              tv[`brokerCommission:${k}`] = String(val);
            }
          });
          tv['brokerTolerance'] = String(loadedData.brokerCommissionTolerance);
          tv['fundingLinesBTL'] = (loadedData.fundingLinesBTL || FUNDING_LINES_BTL).join(', ');
          tv['fundingLinesBridge'] = (loadedData.fundingLinesBridge || FUNDING_LINES_BRIDGE).join(', ');
          setTempValues(tv);
        }
      } catch (e) {
        console.error('Error loading constants:', e);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const saveToStorage = async () => {
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    writeOverrides(payload);
    setMessage('Saved to localStorage. This will take effect for open calculator tabs.');
    setSaving(true);

    try {
      // Save to database using separate rows per setting
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        setMessage('Saved locally, but failed to persist to database. See console.');
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setMessage('Saved to localStorage and database successfully.');
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Constants saved successfully!' 
        });
        
        // Dispatch event so other components update immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setMessage('Saved locally, but an unexpected error occurred while persisting to database. See console.');
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const resetToDefaults = async () => {
    setProductLists(DEFAULT_PRODUCT_TYPES_LIST);
    setFeeColumns(DEFAULT_FEE_COLUMNS);
    setFlatAboveCommercialRule(DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
    setMarketRates(DEFAULT_MARKET_RATES);
    setBrokerRoutes(DEFAULT_BROKER_ROUTES);
    setBrokerCommissionDefaults(DEFAULT_BROKER_COMMISSION_DEFAULTS);
    setBrokerCommissionTolerance(DEFAULT_BROKER_COMMISSION_TOLERANCE);
    setFundingLinesBTL(FUNDING_LINES_BTL);
    setFundingLinesBridge(FUNDING_LINES_BRIDGE);
    const payload = { 
      productLists: DEFAULT_PRODUCT_TYPES_LIST, 
      feeColumns: DEFAULT_FEE_COLUMNS, 
      flatAboveCommercialRule: DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE, 
      marketRates: DEFAULT_MARKET_RATES,
      brokerRoutes: DEFAULT_BROKER_ROUTES,
      brokerCommissionDefaults: DEFAULT_BROKER_COMMISSION_DEFAULTS,
      brokerCommissionTolerance: DEFAULT_BROKER_COMMISSION_TOLERANCE,
      fundingLinesBTL: FUNDING_LINES_BTL,
      fundingLinesBridge: FUNDING_LINES_BRIDGE
    };
    setMessage('Reset to defaults and removed overrides from localStorage.');
    localStorage.removeItem(LOCALSTORAGE_CONSTANTS_KEY);
    // Dispatch events
    window.dispatchEvent(new StorageEvent('storage', {
      key: LOCALSTORAGE_CONSTANTS_KEY,
      newValue: null,
      url: window.location.href,
      storageArea: localStorage
    }));
    setSaving(true);

    try {
      // Save defaults to database
      await saveToSupabase(payload);
      setSaving(false);
      setNotification({ 
        show: true, 
        type: 'success', 
        title: 'Success', 
        message: 'Reset to defaults successfully!' 
      });
    } catch (e) {
      setSaving(false);
      console.error('Reset to defaults error:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Failed to reset: ' + (e.message || 'Unknown error') 
      });
    }
  };

  // helpers for editing product lists and fee columns (called by saveEdit)
  const updateProductList = async (propType, csv) => {
    const arr = csv.split(',').map((s) => s.trim()).filter(Boolean);
    const newProductLists = { ...(productLists || {}), [propType]: arr };
    setProductLists(newProductLists);
    
    // Update tempValues to reflect the saved value
    setTempValues(prev => ({ ...prev, [`productLists:${propType}`]: arr.join(', ') }));
    
    // Create payload with NEW productLists value
    const payload = { 
      productLists: newProductLists, // Use the NEW value
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Product list saved successfully!' 
        });
        
        // Dispatch event so other components update immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const updateFeeColumn = async (feeKey, csv) => {
    const arr = csv.split(',').map((s) => s.trim()).filter(Boolean);
    const newFeeColumns = { ...(feeColumns || {}), [feeKey]: arr };
    setFeeColumns(newFeeColumns);
    
    // Update tempValues to reflect the saved value
    setTempValues(prev => ({ ...prev, [`feeColumns:${feeKey}`]: arr.join(', ') }));
    
    // Update the payload with current values BEFORE saving
    const payload = { 
      productLists, 
      feeColumns: newFeeColumns, // Use the NEW value
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Fee column saved successfully!' 
        });
        
        // Dispatch event so other components update immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const updateMarketRate = async (rateKey, pctValue) => {
    const decimal = parseFloat(pctValue) / 100;
    if (isNaN(decimal)) return;
    const newMarketRates = { ...(marketRates || {}), [rateKey]: decimal };
    setMarketRates(newMarketRates);
    
    // Update tempValues to reflect the saved value
    setTempValues(prev => ({ ...prev, [`marketRates:${rateKey}`]: pctValue }));
    
    // Update the payload with current values BEFORE saving
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates: newMarketRates, // Use the NEW value
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Market rate saved successfully!' 
        });
        
        // Dispatch event so other components update immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const updateFlatAbove = async (field, value) => {
    let updated = { ...flatAboveCommercialRule };
    if (field === 'scopeMatcher') {
      updated.scopeMatcher = value;
    } else if (field === 'tier2' || field === 'tier3') {
      updated.tierLtv = updated.tierLtv || {};
      updated.tierLtv[field === 'tier2' ? '2' : '3'] = parseInt(value, 10) || 0;
    }
    setFlatAboveCommercialRule(updated);
    
    // Update tempValues to reflect the saved value
    setTempValues(prev => ({ ...prev, [`flatAbove:${field}`]: value }));
    
    // Create payload with NEW flatAboveCommercialRule value
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule: updated, // Use the NEW value
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Setting saved successfully!' 
        });
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const updateBrokerRoute = async (routeKey, displayName) => {
    const updated = { ...(brokerRoutes || {}), [routeKey]: displayName };
    setBrokerRoutes(updated);
    
    // Update tempValues to reflect the saved value
    setTempValues(prev => ({ ...prev, [`brokerRoutes:${routeKey}`]: displayName }));
    
    // Create payload with NEW brokerRoutes value
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes: updated, // Use the NEW value
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Broker route saved successfully!' 
        });
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const updateBrokerCommission = async (key, value, calcType) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    
    // Handle separate BTL and Bridge proc fees
    let updated;
    if (calcType) {
      // Update specific calculator type (btl or bridge)
      const currentVal = brokerCommissionDefaults[key] || { btl: 0.9, bridge: 0.9 };
      // Ensure we preserve the structure and only update the specific calculator type
      const newVal = typeof currentVal === 'object' && currentVal !== null
        ? { ...currentVal, [calcType]: num }
        : { btl: calcType === 'btl' ? num : 0.9, bridge: calcType === 'bridge' ? num : 0.9 };
      updated = { 
        ...(brokerCommissionDefaults || {}), 
        [key]: newVal
      };
    } else {
      // Legacy single value support
      updated = { ...(brokerCommissionDefaults || {}), [key]: num };
    }
    setBrokerCommissionDefaults(updated);
    
    // Update tempValues to reflect the saved value
    const tempKey = calcType ? `brokerCommission:${key}:${calcType}` : `brokerCommission:${key}`;
    setTempValues(prev => ({ ...prev, [tempKey]: value }));
    
    // Create payload with NEW brokerCommissionDefaults value
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults: updated, // Use the NEW value
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Broker commission saved successfully!' 
        });
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const updateBrokerTolerance = async (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setBrokerCommissionTolerance(num);
    
    // Update tempValues to reflect the saved value
    setTempValues(prev => ({ ...prev, ['brokerTolerance']: value }));
    
    // Create payload with NEW brokerCommissionTolerance value
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance: num, // Use the NEW value
      fundingLinesBTL,
      fundingLinesBridge,
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Broker tolerance saved successfully!' 
        });
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  const updateFundingLines = async (type, csv) => {
    const arr = csv.split(',').map((s) => s.trim()).filter(Boolean);
    const newFundingLinesBTL = type === 'btl' ? arr : fundingLinesBTL;
    const newFundingLinesBridge = type === 'bridge' ? arr : fundingLinesBridge;
    
    if (type === 'btl') {
      setFundingLinesBTL(arr);
    } else {
      setFundingLinesBridge(arr);
    }
    
    // Update tempValues to reflect the saved value
    setTempValues(prev => ({ ...prev, [`fundingLines${type === 'btl' ? 'BTL' : 'Bridge'}`]: arr.join(', ') }));
    
    // Create payload with NEW funding lines values
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL: newFundingLinesBTL, // Use the NEW value
      fundingLinesBridge: newFundingLinesBridge, // Use the NEW value
      uiPreferences: DEFAULT_UI_PREFERENCES
    };
    
    writeOverrides(payload);
    setSaving(true);

    try {
      const { error: saveErr } = await saveToSupabase(payload);
      setSaving(false);
      
      if (saveErr) {
        console.error('Failed to save to database:', saveErr);
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'Warning', 
          message: 'Saved locally but database sync failed: ' + (saveErr.message || 'Unknown error') 
        });
      } else {
        setNotification({ 
          show: true, 
          type: 'success', 
          title: 'Success', 
          message: 'Funding lines saved successfully!' 
        });
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCALSTORAGE_CONSTANTS_KEY,
          newValue: JSON.stringify(payload),
          url: window.location.href,
          storageArea: localStorage
        }));
      }
    } catch (e) {
      setSaving(false);
      console.error('Save exception:', e);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Unexpected error: ' + (e.message || 'Unknown error') 
      });
    }
  };

  // Add new broker route
  const addBrokerRoute = async () => {
    // Validate inputs
    if (!newRouteKey.trim()) {
      setMessage('Error: Route key cannot be empty');
      return;
    }
    if (!newRouteDisplayName.trim()) {
      setMessage('Error: Display name cannot be empty');
      return;
    }
    
    // Convert key to uppercase and replace spaces with underscores
    const formattedKey = newRouteKey.trim().toUpperCase().replace(/\s+/g, '_');
    
    // Check if key already exists
    if (brokerRoutes[formattedKey]) {
      setMessage(`Error: Route key "${formattedKey}" already exists`);
      return;
    }
    
    // Add to broker routes
    const newRoutes = { ...brokerRoutes, [formattedKey]: newRouteDisplayName.trim() };
    setBrokerRoutes(newRoutes);
    
    // Add to commission defaults with separate BTL and Bridge fees
    const commission = parseFloat(newRouteCommission) || 0.9;
    const newDefaults = { ...brokerCommissionDefaults, [newRouteDisplayName.trim()]: { btl: commission, bridge: commission } };
    setBrokerCommissionDefaults(newDefaults);
    
    // Save to localStorage
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: newRoutes,
      brokerCommissionDefaults: newDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance,
      fundingLinesBTL: fundingLinesBTL,
      fundingLinesBridge: fundingLinesBridge
    };
    writeOverrides(currentOverrides);
    
    // Reset form and close
    setNewRouteKey('');
    setNewRouteDisplayName('');
    setNewRouteCommission('0.9');
    setShowAddRouteForm(false);
    setMessage(`Added new broker route: ${formattedKey} (${newRouteDisplayName.trim()})`);
  };

  // Delete broker route
  const deleteBrokerRoute = async (routeKey) => {
    // Show modal instead of confirm dialog
    const displayName = brokerRoutes[routeKey];
    setDeleteConfirmation({ show: true, routeKey, displayName });
  };

  // Confirm deletion from modal
  const confirmDeleteBrokerRoute = async () => {
    const { routeKey, displayName } = deleteConfirmation;
    
    // Remove from broker routes
    const newRoutes = { ...brokerRoutes };
    delete newRoutes[routeKey];
    setBrokerRoutes(newRoutes);
    
    // Remove from commission defaults
    const newDefaults = { ...brokerCommissionDefaults };
    delete newDefaults[displayName];
    setBrokerCommissionDefaults(newDefaults);
    
    // Save to localStorage
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: newRoutes,
      brokerCommissionDefaults: newDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance,
      fundingLinesBTL: fundingLinesBTL,
      fundingLinesBridge: fundingLinesBridge
    };
    writeOverrides(currentOverrides);
    
    setMessage(`Deleted broker route: ${routeKey}`);
    setDeleteConfirmation({ show: false, routeKey: '', displayName: '' });
  };

  // Cancel deletion from modal
  const cancelDeleteBrokerRoute = () => {
    setDeleteConfirmation({ show: false, routeKey: '', displayName: '' });
  };

  

  return (
    <div className="page-container page-container--table">
      <WelcomeHeader />
      <p className="helper-text">Edit product lists, fee columns and LTV thresholds.</p>
      <div className="slds-actions">
        <button className="slds-button slds-button_destructive" onClick={resetToDefaults} style={{ display: 'none' }}>Reset defaults</button>
        <button className="slds-button slds-button_brand" onClick={saveToStorage} disabled={saving}>
          {saving ? 'Saving...' : 'Save All to Database'}
        </button>
      </div>

      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.productLists ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('productLists')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Product lists per property type</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.productLists}>
            <div className="grid-auto-fit">
              {Object.keys(safeProductLists).map((pt) => {
                const key = `productLists:${pt}`;
                return (
                  <div key={pt} className="slds-form-element">
                    <label className="slds-form-element__label">{pt}</label>
                    <div className="slds-form-element__control form-control-inline">
                      <input
                        className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                        value={editingFields[key] ? (tempValues[key] ?? '') : String(Array.isArray(productLists[pt]) ? productLists[pt].join(', ') : (productLists[pt] ?? ''))}
                        onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={!editingFields[key]}
                      />
                      {!editingFields[key] ? (
                        <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, (Array.isArray(safeProductLists[pt]) ? safeProductLists[pt].join(', ') : String(safeProductLists[pt] ?? '')))}>Edit</button>
                      ) : (
                        <>
                          <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                          <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                        </>
                      )}
                    </div>
                    {/*<div className="helper-text">Comma-separated list of product names shown in the calculator product select.</div>*/}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.feeColumns ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('feeColumns')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Fee columns</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.feeColumns}>
            <div className="grid-auto-fit">
              {Object.keys(safeFeeColumns).map((k) => {
                const key = `feeColumns:${k}`;
                return (
                  <div key={k} className="slds-form-element">
                    <label className="slds-form-element__label">{k}</label>
                    <div className="slds-form-element__control form-control-inline">
                      <input
                        className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                        value={editingFields[key] ? (tempValues[key] ?? '') : String(Array.isArray(feeColumns[k]) ? feeColumns[k].join(', ') : (feeColumns[k] ?? ''))}
                        onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={!editingFields[key]}
                      />
                      {!editingFields[key] ? (
                        <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, (Array.isArray(safeFeeColumns[k]) ? safeFeeColumns[k].join(', ') : String(safeFeeColumns[k] ?? '')))}>Edit</button>
                      ) : (
                        <>
                          <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                          <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                        </>
                      )}
                    </div>
                    {/*<div className="helper-text">Comma-separated numbers used to render fee columns in results for this key.</div>*/}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Max LTV by Tier removed from Constants per user request; values are maintained in the rates table. */}

      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.flatAbove ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('flatAbove')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Flat-above-commercial override</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.flatAbove}>
            <div className="grid-3-col">
              <div className="slds-form-element">
                <label className="slds-form-element__label">Scope matcher</label>
                <div className="slds-form-element__control form-control-inline">
                  {(() => {
                    const key = 'flatAbove:scopeMatcher';
                    return (
                      <>
                        <input className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`} value={editingFields[key] ? (tempValues[key] ?? '') : (flatAboveCommercialRule.scopeMatcher || '')} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} />
                        {!editingFields[key] ? (
                          <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, flatAboveCommercialRule.scopeMatcher || '')}>Edit</button>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="helper-text">Comma-separated tokens or phrase used to detect the product scope (case-insensitive). Example: "flat,commercial"</div>
              </div>

              <div>
                <label className="slds-form-element__label">Tier 2 (Effective max LTV)</label>
                <div className="slds-form-element__control form-control-inline">
                  {(() => {
                    const key = 'flatAbove:tier2';
                    return (
                      <>
                        <input className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`} value={editingFields[key] ? (tempValues[key] ?? '') : (String(flatAboveCommercialRule.tierLtv?.['2'] ?? ''))} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} />
                        {!editingFields[key] ? (
                          <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, String(flatAboveCommercialRule.tierLtv?.['2'] ?? ''))}>Edit</button>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="slds-form-element__label">Tier 3 (Effective max LTV)</label>
                <div className="slds-form-element__control form-control-inline">
                  {(() => {
                    const key = 'flatAbove:tier3';
                    return (
                      <>
                        <input className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`} value={editingFields[key] ? (tempValues[key] ?? '') : (String(flatAboveCommercialRule.tierLtv?.['3'] ?? ''))} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} />
                        {!editingFields[key] ? (
                          <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, String(flatAboveCommercialRule.tierLtv?.['3'] ?? ''))}>Edit</button>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.marketRates ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('marketRates')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Market / Base Rates</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.marketRates}>
            <p className="helper-text"></p>

            <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1">
              <div className="slds-col min-width-260">
                <label className="slds-form-element__label">Standard BBR</label>
                <div className="slds-form-element__control slds-grid grid-align-center-gap">
                  {(() => {
                    const key = 'marketRates:STANDARD_BBR';
                    return (
                      <>
                        <input
                          className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.STANDARD_BBR ?? 0) * 100).toFixed(2)}
                          onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={!editingFields[key]}
                        />
                        <div className="percent-unit">%</div>
                        {!editingFields[key] ? (
                          <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, ((marketRates?.STANDARD_BBR ?? 0) * 100).toFixed(2))}>Edit</button>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="helper-text">Standard Bank Base Rate used in loan calculations (showing as percent).</div>
              </div>

              <div className="slds-col min-width-260">
                <label className="slds-form-element__label">Stress BBR</label>
                <div className="slds-form-element__control slds-grid grid-align-center-gap">
                  {(() => {
                    const key = 'marketRates:STRESS_BBR';
                    return (
                      <>
                        <input
                          className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.STRESS_BBR ?? 0) * 100).toFixed(2)}
                          onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={!editingFields[key]}
                        />
                        <div className="percent-unit">%</div>
                        {!editingFields[key] ? (
                          <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, ((marketRates?.STRESS_BBR ?? 0) * 100).toFixed(2))}>Edit</button>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="helper-text">Stress BBR value used for stress-testing assumptions.</div>
              </div>

              <div className="slds-col min-width-260">
                <label className="slds-form-element__label">Current MVR</label>
                <div className="slds-form-element__control slds-grid grid-align-center-gap">
                  {(() => {
                    const key = 'marketRates:CURRENT_MVR';
                    return (
                      <>
                        <input
                          className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.CURRENT_MVR ?? 0) * 100).toFixed(2)}
                          onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={!editingFields[key]}
                        />
                        <div className="percent-unit">%</div>
                        {!editingFields[key] ? (
                          <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, ((marketRates?.CURRENT_MVR ?? 0) * 100).toFixed(2))}>Edit</button>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="helper-text">Current Mortgage Valuation Rate (shown as percent).</div>
              </div>
            </div>

            {/* Preview removed as requested */}
          </div>
        </section>
      </div>

      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.brokerSettings ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('brokerSettings')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Broker Settings</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.brokerSettings}>
            <p className="helper-text">Configure broker routes, commission defaults, and tolerance settings.</p>
<br></br>
            <div className="slds-m-bottom_medium">
              <div className="display-flex justify-content-space-between align-items-center margin-bottom-1">
                
                <h5>Broker Routes</h5>
                <button 
                  className="slds-button slds-button_brand" 
                  onClick={() => setShowAddRouteForm(!showAddRouteForm)}
                >
                  {showAddRouteForm ? 'Cancel' : 'Add New Route'}
                </button>
              </div>

              {showAddRouteForm && (
                <div className="slds-box slds-box_small slds-m-bottom_small padding-1 background-gray-light">
                  <h5 className="margin-bottom-1">Add New Broker Route</h5>
                  <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1 margin-bottom-1">
                    <div className="slds-col min-width-200">
                      <label className="slds-form-element__label">Route Key (e.g., SOLICITOR)</label>
                      <input
                        className="slds-input"
                        type="text"
                        placeholder="SOLICITOR"
                        value={newRouteKey}
                        onChange={(e) => setNewRouteKey(e.target.value)}
                      />
                      <div className="helper-text">Uppercase, underscores for spaces</div>
                    </div>
                    <div className="slds-col min-width-200">
                      <label className="slds-form-element__label">Display Name</label>
                      <input
                        className="slds-input"
                        type="text"
                        placeholder="Solicitor"
                        value={newRouteDisplayName}
                        onChange={(e) => setNewRouteDisplayName(e.target.value)}
                      />
                      <div className="helper-text">Name shown in dropdown</div>
                    </div>
                    <div className="slds-col min-width-150">
                      <label className="slds-form-element__label">Default Commission (%)</label>
                      <input
                        className="slds-input"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0.9"
                        value={newRouteCommission}
                        onChange={(e) => setNewRouteCommission(e.target.value)}
                      />
                      <div className="helper-text">Default percentage</div>
                    </div>
                  </div>
                  <div className="slds-button-group">
                    <button className="slds-button slds-button_brand" onClick={addBrokerRoute}>
                      Add Route
                    </button>
                    <button className="slds-button slds-button_neutral" onClick={() => {
                      setShowAddRouteForm(false);
                      setNewRouteKey('');
                      setNewRouteDisplayName('');
                      setNewRouteCommission('0.9');
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1">
                {Object.keys(brokerRoutes || DEFAULT_BROKER_ROUTES).map(routeKey => {
                  const key = `brokerRoutes:${routeKey}`;
                  return (
                    <div key={routeKey} className="slds-col min-width-260">
                      <label className="slds-form-element__label">{routeKey}</label>
                      <div className="slds-form-element__control slds-grid align-items-center flex-gap-05">
                        <input
                          className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                          type="text"
                          value={editingFields[key] ? (tempValues[key] ?? '') : (brokerRoutes[routeKey] ?? DEFAULT_BROKER_ROUTES[routeKey])}
                          onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={!editingFields[key]}
                        />
                        {!editingFields[key] ? (
                          <>
                            <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, brokerRoutes[routeKey] ?? DEFAULT_BROKER_ROUTES[routeKey])}>Edit</button>
                            <button className="slds-button slds-button_destructive" onClick={() => deleteBrokerRoute(routeKey)}>Delete</button>
                          </>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </div>
                      {/*<div className="helper-text">Display name for {routeKey} broker route.</div>*/}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="slds-m-bottom_medium">
              <br/>
              <h5>Broker Commission Defaults (%) - Proc Fees</h5>
              <p className="helper-text">Each broker route has separate proc fee percentages for BTL and Bridge calculators.</p>
              <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1">
                {Object.keys(brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS).map(route => {
                  const routeValue = brokerCommissionDefaults[route] ?? DEFAULT_BROKER_COMMISSION_DEFAULTS[route];
                  const hasSeparateFees = typeof routeValue === 'object' && routeValue !== null;
                  const btlValue = hasSeparateFees ? routeValue.btl : routeValue;
                  const bridgeValue = hasSeparateFees ? routeValue.bridge : routeValue;
                  
                  const btlKey = `brokerCommission:${route}:btl`;
                  const bridgeKey = `brokerCommission:${route}:bridge`;
                  
                  return (
                    <div key={route} className="slds-col min-width-260" style={{ marginBottom: '1rem' }}>
                      <label className="slds-form-element__label" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{route}</label>
                      
                      {/* BTL Proc Fee */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>BTL Proc Fee</label>
                        <div className="slds-form-element__control slds-grid align-items-center flex-gap-05">
                          <input
                            className={`slds-input ${!editingFields[btlKey] ? 'constants-disabled' : ''}`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editingFields[btlKey] ? (tempValues[btlKey] ?? '') : (btlValue ?? 0.9)}
                            onChange={(e) => setTempValues(prev => ({ ...prev, [btlKey]: e.target.value }))}
                            disabled={!editingFields[btlKey]}
                          />
                          <div className="percent-unit">%</div>
                          {!editingFields[btlKey] ? (
                            <button className="slds-button slds-button_neutral" onClick={() => startEdit(btlKey, String(btlValue ?? 0.9))}>Edit</button>
                          ) : (
                            <>
                              <button className="slds-button slds-button_brand" onClick={() => saveEdit(btlKey)}>Save</button>
                              <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(btlKey, true)}>Cancel</button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Bridge Proc Fee */}
                      <div>
                        <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Bridge Proc Fee</label>
                        <div className="slds-form-element__control slds-grid align-items-center flex-gap-05">
                          <input
                            className={`slds-input ${!editingFields[bridgeKey] ? 'constants-disabled' : ''}`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editingFields[bridgeKey] ? (tempValues[bridgeKey] ?? '') : (bridgeValue ?? 0.9)}
                            onChange={(e) => setTempValues(prev => ({ ...prev, [bridgeKey]: e.target.value }))}
                            disabled={!editingFields[bridgeKey]}
                          />
                          <div className="percent-unit">%</div>
                          {!editingFields[bridgeKey] ? (
                            <button className="slds-button slds-button_neutral" onClick={() => startEdit(bridgeKey, String(bridgeValue ?? 0.9))}>Edit</button>
                          ) : (
                            <>
                              <button className="slds-button slds-button_brand" onClick={() => saveEdit(bridgeKey)}>Save</button>
                              <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(bridgeKey, true)}>Cancel</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h5>Commission Tolerance</h5>
              <div className="slds-col min-width-260 max-width-400">
                <label className="slds-form-element__label">Tolerance (±%)</label>
                <div className="slds-form-element__control slds-grid align-items-center flex-gap-05">
                  {(() => {
                    const key = 'brokerTolerance';
                    return (
                      <>
                        <input
                          className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={editingFields[key] ? (tempValues[key] ?? '') : (brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE)}
                          onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={!editingFields[key]}
                        />
                        <div className="percent-unit">%</div>
                        {!editingFields[key] ? (
                          <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, String(brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE))}>Edit</button>
                        ) : (
                          <>
                            <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                            <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="helper-text">Allowable deviation from default commission (e.g., 0.2 means ±0.2%).</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.fundingLines ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('fundingLines')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Funding Lines</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.fundingLines}>
            <p className="helper-text">Configure funding line options available in DIP issuance.</p>
            
            <div className="slds-form-element slds-m-bottom_small">
              <label className="slds-form-element__label">BTL Funding Lines (comma-separated)</label>
              <div className="slds-form-element__control form-control-inline">
                {(() => {
                  const key = 'fundingLinesBTL';
                  return (
                    <>
                      <input
                        className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                        value={editingFields[key] ? (tempValues[key] ?? '') : (Array.isArray(fundingLinesBTL) ? fundingLinesBTL.join(', ') : '')}
                        onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={!editingFields[key]}
                      />
                      {!editingFields[key] ? (
                        <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, Array.isArray(fundingLinesBTL) ? fundingLinesBTL.join(', ') : '')}>Edit</button>
                      ) : (
                        <>
                          <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                          <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="helper-text">Update options used in the BTL DIP "Funding Line" dropdown.</div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Bridge Funding Lines (comma-separated)</label>
              <div className="slds-form-element__control form-control-inline">
                {(() => {
                  const key = 'fundingLinesBridge';
                  return (
                    <>
                      <input
                        className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                        value={editingFields[key] ? (tempValues[key] ?? '') : (Array.isArray(fundingLinesBridge) ? fundingLinesBridge.join(', ') : '')}
                        onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={!editingFields[key]}
                      />
                      {!editingFields[key] ? (
                        <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, Array.isArray(fundingLinesBridge) ? fundingLinesBridge.join(', ') : '')}>Edit</button>
                      ) : (
                        <>
                          <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                          <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="helper-text">Update options used in the Bridge DIP "Funding Line" dropdown.</div>
            </div>
          </div>
        </section>
      </div>

      {/* Typography Settings */}
      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.typography ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('typography')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Typography Settings</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.typography}>
            <div className="slds-form-element">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label className="slds-checkbox_toggle slds-grid">
                  <span className="slds-form-element__label slds-assistive-text">Inter Typography</span>
                  <input
                    type="checkbox"
                    checked={typographyEnabled}
                    onChange={() => toggleTypography()}
                    aria-describedby="typography-toggle-desc"
                  />
                  <span className="slds-checkbox_faux_container" aria-live="assertive">
                    <span className="slds-checkbox_faux"></span>
                    <span className="slds-checkbox_on">On</span>
                    <span className="slds-checkbox_off">Off</span>
                  </span>
                </label>
                <div>
                  <span style={{ fontWeight: '500' }}>Use Inter Font</span>
                  <p id="typography-toggle-desc" className="helper-text" style={{ margin: 0 }}>
                    Switch from Salesforce Sans to Inter font with a modern modular scale typography system.
                  </p>
                </div>
              </div>
              
              {/* Typography Preview */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: 'var(--token-ui-background-subtle, #f4f6f9)', 
                borderRadius: '4px',
                border: '1px solid var(--token-ui-border-light, #e5e5e5)'
              }}>
                <p style={{ fontSize: 'var(--token-font-size-xs)', color: 'var(--token-text-secondary, #666)', marginBottom: '0.5rem', fontWeight: '500' }}>
                  PREVIEW ({typographyEnabled ? 'Inter' : 'Salesforce Sans'})
                </p>
                <div style={{ fontFamily: typographyEnabled ? '"Inter", sans-serif' : 'inherit', color: 'var(--token-text-primary, #181818)' }}>
                  <h4 style={{ 
                    fontSize: typographyEnabled ? '1.728rem' : '1.25rem', 
                    fontWeight: '600', 
                    margin: '0 0 0.25rem 0',
                    fontFamily: typographyEnabled ? '"Inter", sans-serif' : 'inherit',
                    color: 'inherit'
                  }}>
                    Heading Example
                  </h4>
                  <p style={{ 
                    fontSize: typographyEnabled ? '1rem' : '0.875rem', 
                    lineHeight: typographyEnabled ? '1.6' : '1.5',
                    margin: 0,
                    fontFamily: typographyEnabled ? '"Inter", sans-serif' : 'inherit',
                    color: 'inherit'
                  }}>
                    Body text example showing the {typographyEnabled ? 'Inter' : 'Salesforce Sans'} font family.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Flat-above-commercial override removed — rule is now hard-coded in calculator logic per user request. */}

      <div className="slds-actions">
        <button className="slds-button slds-button_destructive" onClick={resetToDefaults} style={{ display: 'none' }}>Reset defaults</button>
        <button className="slds-button slds-button_brand" onClick={saveToStorage} disabled={saving}>
          {saving ? 'Saving...' : 'Save All to Database'}
        </button>
      </div>

      {message && <div className="slds-text-title_caps slds-m-top_small">{message}</div>}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <>
          <div 
            className="slds-backdrop slds-backdrop_open" 
            style={{ zIndex: 9000, pointerEvents: 'auto' }}
            onClick={cancelDeleteBrokerRoute}
          ></div>
          <div 
            className="slds-modal slds-fade-in-open" 
            role="dialog" 
            aria-modal="true"
            style={{ zIndex: 9001, pointerEvents: 'none' }}
          >
            <div className="slds-modal__container" style={{ pointerEvents: 'auto' }}>
              <header className="slds-modal__header">
                <h2 className="slds-text-heading_medium">Confirm Deletion</h2>
              </header>
              <div className="slds-modal__content slds-p-around_medium">
                <p className="margin-bottom-1">
                  Are you sure you want to delete the route <strong>"{deleteConfirmation.routeKey}"</strong>?
                </p>
                <div className="slds-notify slds-notify_alert slds-alert_warning margin-top-1" role="alert">
                  <span className="slds-assistive-text">warning</span>
                  <h4 className="subsection-header">
                    Warning
                  </h4>
                  <div className="slds-notify__content">
                    <p>Existing quotes using this route will still reference it in the database. The route will simply not appear in the dropdown for new quotes.</p>
                  </div>
                </div>
              </div>
              <footer className="slds-modal__footer">
                <button className="slds-button slds-button_neutral" onClick={cancelDeleteBrokerRoute}>
                  Cancel
                </button>
                <button className="slds-button slds-button_destructive" onClick={confirmDeleteBrokerRoute}>
                  Delete Route
                </button>
              </footer>
            </div>
          </div>
        </>
      )}

      <NotificationModal
        isOpen={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}

