import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import NotificationModal from '../modals/NotificationModal';
import WelcomeHeader from '../shared/WelcomeHeader';
import { LOCALSTORAGE_CONSTANTS_KEY } from '../../config/constants';
import '../../styles/GlobalSettings.css';
import SalesforceIcon from '../shared/SalesforceIcon';

// Inline icons to ensure visibility without class conflicts
const ICON_PATHS = {
  chevronup: 'M26 13.3c-.5 0-1 .2-1.4.6l-15 15c-.8.8-.8 2 0 2.8.8.8 2 .8 2.8 0L26 18.1l13.6 13.6c.8.8 2 .8 2.8 0 .8-.8.8-2 0-2.8l-15-15c-.4-.4-.9-.6-1.4-.6z',
  chevrondown: 'M26 32.7c.5 0 1-.2 1.4-.6l15-15c.8-.8.8-2 0-2.8-.8-.8-2-.8-2.8 0L26 27.9 12.4 14.3c-.8-.8-2-.8-2.8 0-.8.8-.8 2 0 2.8l15 15c.4.4.9.6 1.4.6z',
  delete: 'M32.7 9.3h-5.4V8c0-2.2-1.8-4-4-4h-6.6c-2.2 0-4 1.8-4 4v1.3H7.3c-.7 0-1.3.6-1.3 1.4v2.6c0 .7.6 1.4 1.3 1.4h1.4v25.9c0 2.2 1.7 4 3.9 4h16.7c2.2 0 4-1.8 4-4V14.7h1.4c.7 0 1.3-.7 1.3-1.4v-2.6c0-.8-.6-1.4-1.3-1.4zM16 8c0-.7.6-1.3 1.3-1.3h5.4c.7 0 1.3.6 1.3 1.3v1.3H16V8zm14.7 32.7c0 .7-.6 1.3-1.4 1.3H12.7c-.7 0-1.4-.6-1.4-1.3V14.7h19.4v26zM18 38c.7 0 1.3-.6 1.3-1.3V20c0-.7-.6-1.3-1.3-1.3s-1.3.6-1.3 1.3v16.7c0 .7.6 1.3 1.3 1.3zm8 0c.7 0 1.3-.6 1.3-1.3V20c0-.7-.6-1.3-1.3-1.3S24.7 19.3 24.7 20v16.7c0 .7.6 1.3 1.3 1.3z',
  edit: 'M37.5 28.8L24.3 15.6c-.6-.6-1.5-.6-2.1 0L8.7 29c-.2.2-.3.4-.3.7v9.4c0 .6.4 1 1 1h9.4c.3 0 .5-.1.7-.3l13.5-13.5 4.4 4.4c.6.6 1.5.6 2.1 0 .6-.6.6-1.6 0-2.2l-2-1.7zm-4.2-2.1L20.7 39.3h-7.4v-7.4l12.6-12.6 7.4 7.4z',
  check: 'M20.6 33.4l-8-8c-.8-.8-2-.8-2.8 0l-1.4 1.4c-.8.8-.8 2 0 2.8l10.1 10.1c.8.8 2 .8 2.8 0L44.7 16.3c.8-.8.8-2 0-2.8l-1.4-1.4c-.8-.8-2-.8-2.8 0L20.6 33.4z',
  refresh: 'M45.9 19.1C43.7 12.2 37.4 7.3 30 7.1c-8.7-.3-16 6.6-16.3 15.3h4.8c.3-6.1 5.3-11 11.5-11 5.1 0 9.5 3.3 11 7.9l-3.6-1c-1-.3-2 .3-2.2 1.3-.3 1 .3 2 1.3 2.2l8.2 2.3c.8.2 1.6-.3 1.8-1.1l2.3-8.2c.3-1-.3-2-1.3-2.2-1-.3-2 .3-2.2 1.3l-.9 3.2zM6.1 32.9C8.3 39.8 14.6 44.7 22 44.9c8.7.3 16-6.6 16.3-15.3h-4.8c-.3 6.1-5.3 11-11.5 11-5.1 0-9.5-3.3-11-7.9l3.6 1c1 .3 2-.3 2.2-1.3.3-1-.3-2-1.3-2.2L9.3 28c-.8-.2-1.6.3-1.8 1.1L5.2 37.3c-.3 1 .3 2 1.3 2.2 1 .3 2-.3 2.2-1.3l.9-3.2z'
};

const SimpleIcon = ({ path, color = 'currentColor', size = '0.875rem' }) => (
  <svg
    viewBox="0 0 52 52"
    aria-hidden="true"
    focusable="false"
    style={{
      width: size,
      height: size,
      fill: color,
      display: 'block',
      minWidth: size,
      minHeight: size
    }}
  >
    <path d={path} fill={color} />
  </svg>
);

// Default label aliases for BTL Calculator (28 labels)
const DEFAULT_LABEL_ALIASES_BTL = {
  'APRC': 'APRC',
  'Admin Fee': 'Admin Fee',
  'Broker Client Fee': 'Broker Client Fee',
  'Broker Commission (Proc Fee %)': 'Broker Commission (Proc Fee %)',
  'Broker Commission (Proc Fee £)': 'Broker Commission (Proc Fee £)',
  'Deferred Interest %': 'Deferred Interest %',
  'Deferred Interest £': 'Deferred Interest £',
  'Direct Debit': 'Direct Debit',
  'ERC': 'ERC',
  'Exit Fee': 'Exit Fee',
  'Full Term': 'Full Term',
  'Gross Loan': 'Gross Loan',
  'ICR': 'ICR',
  'Initial Term': 'Initial Term',
  'LTV': 'LTV',
  'Monthly Interest Cost': 'Monthly Interest Cost',
  'NBP': 'NBP',
  'Net Loan': 'Net Loan',
  'Net LTV': 'Net LTV',
  'Pay Rate': 'Pay Rate',
  'Product Fee %': 'Product Fee %',
  'Product Fee £': 'Product Fee £',
  'Revert Rate': 'Revert Rate',
  'Revert Rate DD': 'Revert Rate DD',
  'Rolled Months': 'Rolled Months',
  'Rolled Months Interest': 'Rolled Months Interest',
  'Serviced Interest': 'Serviced Interest',
  'Serviced Months': 'Serviced Months',
  'Title Insurance Cost': 'Title Insurance Cost',
  'Total Cost to Borrower': 'Total Cost to Borrower',
};

// Default label aliases for Bridging Calculator (33 labels)
const DEFAULT_LABEL_ALIASES_BRIDGE = {
  'APRC': 'APRC',
  'Admin Fee': 'Admin Fee',
  'Broker Client Fee': 'Broker Client Fee',
  'Broker Commission (Proc Fee %)': 'Broker Commission (Proc Fee %)',
  'Broker Commission (Proc Fee £)': 'Broker Commission (Proc Fee £)',
  'Commitment Fee £': 'Commitment Fee £',
  'Deferred Interest %': 'Deferred Interest %',
  'Deferred Interest £': 'Deferred Interest £',
  'Direct Debit': 'Direct Debit',
  'ERC 1 £': 'ERC 1 £',
  'ERC 2 £': 'ERC 2 £',
  'Exit Fee': 'Exit Fee',
  'Full Int BBR £': 'Full Int BBR £',
  'Full Int Coupon £': 'Full Int Coupon £',
  'Full Term': 'Full Term',
  'Gross Loan': 'Gross Loan',
  'ICR': 'ICR',
  'Initial Term': 'Initial Term',
  'LTV': 'LTV',
  'Monthly Interest Cost': 'Monthly Interest Cost',
  'NBP': 'NBP',
  'NBP LTV': 'NBP LTV',
  'Net Loan': 'Net Loan',
  'Net LTV': 'Net LTV',
  'Pay Rate': 'Pay Rate',
  'Product Fee %': 'Product Fee %',
  'Product Fee £': 'Product Fee £',
  'Rates': 'Rates',
  'Revert Rate': 'Revert Rate',
  'Revert Rate DD': 'Revert Rate DD',
  'Rolled Months': 'Rolled Months',
  'Rolled Months Interest': 'Rolled Months Interest',
  'Serviced Interest': 'Serviced Interest',
  'Serviced Months': 'Serviced Months',
  'Title Insurance Cost': 'Title Insurance Cost',
  'Total Interest': 'Total Interest',
};

// Default label aliases for Core Calculator (28 labels)
const DEFAULT_LABEL_ALIASES_CORE = {
  'APRC': 'APRC',
  'Admin Fee': 'Admin Fee',
  'Broker Client Fee': 'Broker Client Fee',
  'Broker Commission (Proc Fee %)': 'Broker Commission (Proc Fee %)',
  'Broker Commission (Proc Fee £)': 'Broker Commission (Proc Fee £)',
  'Deferred Interest %': 'Deferred Interest %',
  'Deferred Interest £': 'Deferred Interest £',
  'Direct Debit': 'Direct Debit',
  'ERC': 'ERC',
  'Exit Fee': 'Exit Fee',
  'Full Term': 'Full Term',
  'Gross Loan': 'Gross Loan',
  'ICR': 'ICR',
  'Initial Term': 'Initial Term',
  'LTV': 'LTV',
  'Monthly Interest Cost': 'Monthly Interest Cost',
  'NBP': 'NBP',
  'NBP LTV': 'NBP LTV',
  'Net Loan': 'Net Loan',
  'Net LTV': 'Net LTV',
  'Pay Rate': 'Pay Rate',
  'Product Fee %': 'Product Fee %',
  'Product Fee £': 'Product Fee £',
  'Revert Rate': 'Revert Rate',
  'Revert Rate DD': 'Revert Rate DD',
  'Rolled Months': 'Rolled Months',
  'Rolled Months Interest': 'Rolled Months Interest',
  'Serviced Interest': 'Serviced Interest',
  'Serviced Months': 'Serviced Months',
  'Title Insurance Cost': 'Title Insurance Cost',
  'Total Cost to Borrower': 'Total Cost to Borrower',
};

// Helper function to apply header colors to CSS custom properties
const applyHeaderColorsToCss = (allColors) => {
  const root = document.documentElement;
  const loanTypes = ['btl', 'bridge', 'core'];
  
  loanTypes.forEach(loanType => {
    const colors = allColors[loanType];
    if (!colors) return;
    
    const prefix = `--results-header-${loanType}`;
    
    // Apply label colors
    root.style.setProperty(`${prefix}-label-bg`, colors.labelBg || '#f4f6f9');
    root.style.setProperty(`${prefix}-label-text`, colors.labelText || '#181818');
    
    // Apply column colors
    const columns = colors.columns || [];
    columns.forEach((col, idx) => {
      root.style.setProperty(`${prefix}-col${idx + 1}-bg`, col.bg);
      root.style.setProperty(`${prefix}-col${idx + 1}-text`, col.text);
    });
  });
  
  // Also update the default (non-prefixed) colors using BTL as default
  const defaultColors = allColors.btl;
  if (defaultColors) {
    root.style.setProperty('--results-header-label-bg', defaultColors.labelBg || '#f4f6f9');
    root.style.setProperty('--results-header-label-text', defaultColors.labelText || '#181818');
    
    const columns = defaultColors.columns || [];
    columns.forEach((col, idx) => {
      root.style.setProperty(`--results-header-col${idx + 1}-bg`, col.bg);
      root.style.setProperty(`--results-header-col${idx + 1}-text`, col.text);
    });
  }
};

/**
 * GlobalSettings Component
 * Allows admins to control which rows are visible in the calculator results tables
 * and their display order
 */
export default function GlobalSettings() {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  const [activeTab, setActiveTab] = useState('btl'); // 'btl', 'bridge', or 'core'
  
  // Accordion state - track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    visibility: true,
    rowOrder: false,
    labelAliases: false,
    headerColors: false
  });

  const toggleSection = (section) => {
    setExpandedSections({
      visibility: section === 'visibility' ? !expandedSections[section] : false,
      rowOrder: section === 'rowOrder' ? !expandedSections[section] : false,
      labelAliases: section === 'labelAliases' ? !expandedSections[section] : false,
      headerColors: section === 'headerColors' ? !expandedSections[section] : false
    });
  };
  
  // Default rows for BTL Calculator
  const DEFAULT_BTL_ROWS = [
    'APRC',
    'Admin Fee',
    'Broker Client Fee',
    'Broker Commission (Proc Fee %)',
    'Broker Commission (Proc Fee £)',
    'Deferred Interest %',
    'Deferred Interest £',
    'Direct Debit',
    'ERC',
    'Exit Fee',
    'Full Term',
    'Gross Loan',
    'ICR',
    'Initial Term',
    'LTV',
    'Monthly Interest Cost',
    'NBP',
    'NBP LTV',
    'Net Loan',
    'Net LTV',
    'Pay Rate',
    'Product Fee %',
    'Product Fee £',
    'Revert Rate',
    'Revert Rate DD',
    'Rolled Months',
    'Rolled Months Interest',
    'Serviced Interest',
    'Serviced Months',
    'Title Insurance Cost',
    'Total Cost to Borrower'
  ];

  // Default rows for Bridging Calculator
  const DEFAULT_BRIDGE_ROWS = [
    'APRC',
    'Admin Fee',
    'Broker Client Fee',
    'Broker Commission (Proc Fee %)',
    'Broker Commission (Proc Fee £)',
    'Commitment Fee £',
    'Deferred Interest %',
    'Deferred Interest £',
    'Direct Debit',
    'ERC 1 £',
    'ERC 2 £',
    'Exit Fee',
    'Full Int BBR £',
    'Full Int Coupon £',
    'Full Term',
    'Gross Loan',
    'ICR',
    'Initial Term',
    'LTV',
    'Monthly Interest Cost',
    'NBP',
    'NBP LTV',
    'Net Loan',
    'Net LTV',
    'Pay Rate',
    'Product Fee %',
    'Product Fee £',
    'Revert Rate',
    'Revert Rate DD',
    'Rolled Months',
    'Rolled Months Interest',
    'Serviced Interest',
    'Serviced Months',
    'Title Insurance Cost',
    'Total Interest'
  ];

  // Default rows for Core Range Calculator
  const DEFAULT_CORE_ROWS = [
    'APRC',
    'Admin Fee',
    'Broker Client Fee',
    'Broker Commission (Proc Fee %)',
    'Broker Commission (Proc Fee £)',
    'Deferred Interest %',
    'Deferred Interest £',
    'Direct Debit',
    'ERC',
    'Exit Fee',
    'Full Term',
    'Gross Loan',
    'ICR',
    'Initial Term',
    'LTV',
    'Monthly Interest Cost',
    'NBP',
    'NBP LTV',
    'Net Loan',
    'Net LTV',
    'Pay Rate',
    'Product Fee %',
    'Product Fee £',
    'Revert Rate',
    'Revert Rate DD',
    'Rolled Months',
    'Rolled Months Interest',
    'Serviced Interest',
    'Serviced Months',
    'Title Insurance Cost',
    'Total Cost to Borrower'
  ];

  const [btlVisibleRows, setBtlVisibleRows] = useState(() => 
    DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {})
  );
  
  const [bridgeVisibleRows, setBridgeVisibleRows] = useState(() => 
    DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {})
  );

  const [coreVisibleRows, setCoreVisibleRows] = useState(() => 
    DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {})
  );

  const [btlRowOrder, setBtlRowOrder] = useState([...DEFAULT_BTL_ROWS]);
  const [bridgeRowOrder, setBridgeRowOrder] = useState([...DEFAULT_BRIDGE_ROWS]);
  const [coreRowOrder, setCoreRowOrder] = useState([...DEFAULT_CORE_ROWS]);

  // Label aliases state
  const [btlLabelAliases, setBtlLabelAliases] = useState({ ...DEFAULT_LABEL_ALIASES_BTL });
  const [bridgeLabelAliases, setBridgeLabelAliases] = useState({ ...DEFAULT_LABEL_ALIASES_BRIDGE });
  const [coreLabelAliases, setCoreLabelAliases] = useState({ ...DEFAULT_LABEL_ALIASES_CORE });
  const [editingLabel, setEditingLabel] = useState({ btl: null, bridge: null, core: null });
  const [tempLabelValue, setTempLabelValue] = useState({ btl: '', bridge: '', core: '' });

  // Header colors state - separate colors for each loan type with dynamic columns
  // Each loan type has a labelBg/labelText plus an array of column colors
  const DEFAULT_COLUMN_COLOR = { bg: '#002855', text: '#ffffff' };
  const DEFAULT_HEADER_COLORS = {
    btl: {
      labelBg: '#f4f6f9',
      labelText: '#181818',
      columns: [
        { bg: '#002855', text: '#ffffff' },  // Column 1 - navy
        { bg: '#1B3B6F', text: '#ffffff' },  // Column 2 - navy-500
        { bg: '#ED8B00', text: '#ffffff' }   // Column 3 - orange
      ]
    },
    bridge: {
      labelBg: '#f4f6f9',
      labelText: '#181818',
      columns: [
        { bg: '#002855', text: '#ffffff' },  // Column 1 - navy
        { bg: '#1B3B6F', text: '#ffffff' },  // Column 2 - navy-500
        { bg: '#ED8B00', text: '#ffffff' }   // Column 3 - orange
      ]
    },
    core: {
      labelBg: '#f4f6f9',
      labelText: '#181818',
      columns: [
        { bg: '#002855', text: '#ffffff' },  // Column 1 - navy
        { bg: '#1B3B6F', text: '#ffffff' },  // Column 2 - navy-500
        { bg: '#ED8B00', text: '#ffffff' }   // Column 3 - orange
      ]
    }
  };
  const [headerColors, setHeaderColors] = useState({ ...DEFAULT_HEADER_COLORS });

  // Load settings from Supabase
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async() => {
    try {
      setLoading(true);
      
      // Load visibility settings from results_configuration
      const { data: visibilityData, error: visibilityError } = await supabase
        .from('results_configuration')
        .select('*')
        .eq('key', 'visibility');

      if (visibilityError && visibilityError.code !== 'PGRST116') {
        throw visibilityError;
      }

      if (visibilityData && visibilityData.length > 0) {
        visibilityData.forEach(row => {
          const settings = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          
          if (row.calculator_type === 'btl') {
            const mergedBtl = { ...DEFAULT_BTL_ROWS.reduce((acc, r) => ({ ...acc, [r]: true }), {}), ...settings };
            setBtlVisibleRows(mergedBtl);
          } else if (row.calculator_type === 'bridge') {
            const mergedBridge = { ...DEFAULT_BRIDGE_ROWS.reduce((acc, r) => ({ ...acc, [r]: true }), {}), ...settings };
            setBridgeVisibleRows(mergedBridge);
          } else if (row.calculator_type === 'core') {
            const mergedCore = { ...DEFAULT_CORE_ROWS.reduce((acc, r) => ({ ...acc, [r]: true }), {}), ...settings };
            setCoreVisibleRows(mergedCore);
          }
        });
      }

      // Load row order settings from results_configuration
      const { data: orderData, error: orderError } = await supabase
        .from('results_configuration')
        .select('*')
        .eq('key', 'row_order');

      if (orderError && orderError.code !== 'PGRST116') {
        throw orderError;
      }

      if (orderData && orderData.length > 0) {
        orderData.forEach(row => {
          const settings = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          
          if (row.calculator_type === 'btl' && Array.isArray(settings)) {
            const validFields = settings.filter(r => DEFAULT_BTL_ROWS.includes(r));
            const missingBtlFields = DEFAULT_BTL_ROWS.filter(r => !validFields.includes(r));
            setBtlRowOrder([...validFields, ...missingBtlFields]);
          } else if (row.calculator_type === 'bridge' && Array.isArray(settings)) {
            const validFields = settings.filter(r => DEFAULT_BRIDGE_ROWS.includes(r));
            const missingBridgeFields = DEFAULT_BRIDGE_ROWS.filter(r => !validFields.includes(r));
            setBridgeRowOrder([...validFields, ...missingBridgeFields]);
          } else if (row.calculator_type === 'core' && Array.isArray(settings)) {
            const validFields = settings.filter(r => DEFAULT_CORE_ROWS.includes(r));
            const missingCoreFields = DEFAULT_CORE_ROWS.filter(r => !validFields.includes(r));
            setCoreRowOrder([...validFields, ...missingCoreFields]);
          }
        });
      }

      // Load label aliases from results_configuration
      const { data: labelData, error: labelError } = await supabase
        .from('results_configuration')
        .select('*')
        .eq('key', 'label_aliases');

      if (labelError && labelError.code !== 'PGRST116') {
        throw labelError;
      }

      let labelAliasesLoaded = false;
      if (labelData && labelData.length > 0) {
        labelData.forEach(row => {
          const settings = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          
          if (row.calculator_type === 'btl') {
            setBtlLabelAliases({ ...DEFAULT_LABEL_ALIASES_BTL, ...settings });
            labelAliasesLoaded = true;
          } else if (row.calculator_type === 'bridge') {
            setBridgeLabelAliases({ ...DEFAULT_LABEL_ALIASES_BRIDGE, ...settings });
            labelAliasesLoaded = true;
          } else if (row.calculator_type === 'core') {
            setCoreLabelAliases({ ...DEFAULT_LABEL_ALIASES_CORE, ...settings });
            labelAliasesLoaded = true;
          }
        });
        
        // Also update localStorage for the hook to use
        if (labelAliasesLoaded) {
          const mergedForHook = {};
          labelData.forEach(row => {
            const settings = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
            Object.assign(mergedForHook, settings);
          });
          let existingConstants = {};
          try {
            const stored = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
            if (stored) existingConstants = JSON.parse(stored);
          } catch (e) { /* ignore */ }
          
          localStorage.setItem(LOCALSTORAGE_CONSTANTS_KEY, JSON.stringify({
            ...existingConstants,
            resultsLabelAliases: mergedForHook
          }));
        }
      }

      // Fallback: Load label aliases from localStorage if not in Supabase
      if (!labelAliasesLoaded) {
        try {
          const stored = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.resultsLabelAliases && typeof parsed.resultsLabelAliases === 'object') {
              // Merge with defaults for each loan type
              setBtlLabelAliases({ ...DEFAULT_LABEL_ALIASES_BTL, ...parsed.resultsLabelAliases });
              setBridgeLabelAliases({ ...DEFAULT_LABEL_ALIASES_BRIDGE, ...parsed.resultsLabelAliases });
              setCoreLabelAliases({ ...DEFAULT_LABEL_ALIASES_CORE, ...parsed.resultsLabelAliases });
            }
          }
        } catch (labelErr) {
          console.warn('Failed to load label aliases from localStorage:', labelErr);
        }
      }

      // Load header colors from results_configuration
      const { data: headerColorData, error: headerColorError } = await supabase
        .from('results_configuration')
        .select('*')
        .eq('key', 'header_colors');

      if (headerColorError && headerColorError.code !== 'PGRST116') {
        throw headerColorError;
      }

      if (headerColorData && headerColorData.length > 0) {
        const mergedColors = { ...DEFAULT_HEADER_COLORS };
        
        headerColorData.forEach(row => {
          const colors = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          
          // Helper to migrate old format (col1Bg, col2Bg...) to new format (columns array)
          const migrateToColumnsFormat = (loanTypeColors, defaults) => {
            if (loanTypeColors?.columns) {
              // Already in new format
              return {
                labelBg: loanTypeColors.labelBg || defaults.labelBg,
                labelText: loanTypeColors.labelText || defaults.labelText,
                columns: loanTypeColors.columns
              };
            }
            // Migrate from old format
            const columns = [];
            let i = 1;
            while (loanTypeColors?.[`col${i}Bg`] !== undefined || i <= 3) {
              columns.push({
                bg: loanTypeColors?.[`col${i}Bg`] || defaults.columns[i-1]?.bg || '#002855',
                text: loanTypeColors?.[`col${i}Text`] || defaults.columns[i-1]?.text || '#ffffff'
              });
              i++;
              if (i > 10) break; // Safety limit
            }
            return {
              labelBg: loanTypeColors?.labelBg || defaults.labelBg,
              labelText: loanTypeColors?.labelText || defaults.labelText,
              columns: columns.length > 0 ? columns : defaults.columns
            };
          };
          
          if (row.calculator_type === 'btl') {
            mergedColors.btl = migrateToColumnsFormat(colors, DEFAULT_HEADER_COLORS.btl);
          } else if (row.calculator_type === 'bridge') {
            mergedColors.bridge = migrateToColumnsFormat(colors, DEFAULT_HEADER_COLORS.bridge);
          } else if (row.calculator_type === 'core') {
            mergedColors.core = migrateToColumnsFormat(colors, DEFAULT_HEADER_COLORS.core);
          }
        });
        
        setHeaderColors(mergedColors);
        
        // Save to localStorage for quick loading
        localStorage.setItem('results_table_header_colors', JSON.stringify(mergedColors));
      }
    } catch (err) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: `Failed to load settings: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save visibility settings (one row per calculator type)
      const visibilityPromises = [
        supabase.from('results_configuration').upsert({
          key: 'visibility',
          calculator_type: 'btl',
          config: btlVisibleRows,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'visibility',
          calculator_type: 'bridge',
          config: bridgeVisibleRows,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'visibility',
          calculator_type: 'core',
          config: coreVisibleRows,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' })
      ];
      
      const visibilityResults = await Promise.all(visibilityPromises);
      const visibilityError = visibilityResults.find(r => r.error)?.error;
      if (visibilityError) throw visibilityError;

      // Save row order settings (one row per calculator type)
      const orderPromises = [
        supabase.from('results_configuration').upsert({
          key: 'row_order',
          calculator_type: 'btl',
          config: btlRowOrder,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'row_order',
          calculator_type: 'bridge',
          config: bridgeRowOrder,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'row_order',
          calculator_type: 'core',
          config: coreRowOrder,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' })
      ];
      
      const orderResults = await Promise.all(orderPromises);
      const orderError = orderResults.find(r => r.error)?.error;
      if (orderError) throw orderError;

      // Save label aliases - save ALL labels, not just changes from defaults
      const btlConfig = Object.fromEntries(
        Object.entries(btlLabelAliases)
      );
      const bridgeConfig = Object.fromEntries(
        Object.entries(bridgeLabelAliases)
      );
      const coreConfig = Object.fromEntries(
        Object.entries(coreLabelAliases)
      );
      
      const labelAliasPromises = [
        supabase.from('results_configuration').upsert({
          key: 'label_aliases',
          calculator_type: 'btl',
          config: btlConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'label_aliases',
          calculator_type: 'bridge',
          config: bridgeConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'label_aliases',
          calculator_type: 'core',
          config: coreConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' })
      ];
      
      const labelResults = await Promise.all(labelAliasPromises);
      const labelError = labelResults.find(r => r.error)?.error;
      if (labelError) {
        console.error('Label alias save error:', labelError);
        throw labelError;
      }

      // Save header colors (one row per calculator type)
      const headerColorPromises = [
        supabase.from('results_configuration').upsert({
          key: 'header_colors',
          calculator_type: 'btl',
          config: headerColors.btl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'header_colors',
          calculator_type: 'bridge',
          config: headerColors.bridge,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' }),
        supabase.from('results_configuration').upsert({
          key: 'header_colors',
          calculator_type: 'core',
          config: headerColors.core,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key,calculator_type' })
      ];
      
      const headerColorResults = await Promise.all(headerColorPromises);
      const headerColorError = headerColorResults.find(r => r.error)?.error;
      if (headerColorError) throw headerColorError;

      // Save header colors to localStorage for immediate effect
      localStorage.setItem('results_table_header_colors', JSON.stringify(headerColors));
      
      // Apply header colors to CSS custom properties immediately
      applyHeaderColorsToCss(headerColors);

      setNotification({
        show: true,
        type: 'success',
        title: 'Success',
        message: 'Results table settings saved successfully!'
      });

      // Save to localStorage for immediate effect
      const visibilitySettings = { btl: btlVisibleRows, bridge: bridgeVisibleRows, core: coreVisibleRows };
      const orderSettings = { btl: btlRowOrder, bridge: bridgeRowOrder, core: coreRowOrder };
      
      localStorage.setItem('results_table_visibility', JSON.stringify(visibilitySettings));
      localStorage.setItem('results_table_row_order', JSON.stringify(orderSettings));
      
      // Save label aliases to localStorage for immediate effect
      // Store separately by calculator type to avoid conflicts
      
      // Read existing constants and merge
      let existingConstants = {};
      try {
        const stored = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
        if (stored) {
          existingConstants = JSON.parse(stored);
        }
      } catch (e) {
        // Ignore parse errors
      }
      
      const updatedConstants = {
        ...existingConstants,
        resultsLabelAliases_btl: btlLabelAliases,
        resultsLabelAliases_bridge: bridgeLabelAliases,
        resultsLabelAliases_core: coreLabelAliases
      };
      localStorage.setItem(LOCALSTORAGE_CONSTANTS_KEY, JSON.stringify(updatedConstants));
      
      // Dispatch storage events to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'results_table_visibility',
        newValue: JSON.stringify(visibilitySettings)
      }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'results_table_row_order',
        newValue: JSON.stringify(orderSettings)
      }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: LOCALSTORAGE_CONSTANTS_KEY,
        newValue: JSON.stringify(updatedConstants)
      }));
      
      // Dispatch custom event for same-tab updates (used by useResultsLabelAlias hook)
      window.dispatchEvent(new CustomEvent('constantsUpdated'));
      
    } catch (err) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save settings: ${err.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBtlRow = (row) => {
    setBtlVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };

  const handleToggleBridgeRow = (row) => {
    setBridgeVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };

  const handleToggleCoreRow = (row) => {
    setCoreVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };

  const handleMoveRowUp = (index, type) => {
    if (index === 0) return;
    
    if (type === 'btl') {
      const newOrder = [...btlRowOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setBtlRowOrder(newOrder);
    } else if (type === 'bridge') {
      const newOrder = [...bridgeRowOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setBridgeRowOrder(newOrder);
    } else if (type === 'core') {
      const newOrder = [...coreRowOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setCoreRowOrder(newOrder);
    }
  };

  const handleMoveRowDown = (index, type) => {
    const maxIndex = type === 'btl' ? btlRowOrder.length - 1 : 
                     type === 'bridge' ? bridgeRowOrder.length - 1 : 
                     coreRowOrder.length - 1;
    if (index === maxIndex) return;
    
    if (type === 'btl') {
      const newOrder = [...btlRowOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setBtlRowOrder(newOrder);
    } else if (type === 'bridge') {
      const newOrder = [...bridgeRowOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setBridgeRowOrder(newOrder);
    } else if (type === 'core') {
      const newOrder = [...coreRowOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setCoreRowOrder(newOrder);
    }
  };

  const handleSelectAllBtl = () => {
    setBtlVisibleRows(DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
  };

  const handleDeselectAllBtl = () => {
    setBtlVisibleRows(DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: false }), {}));
  };

  const handleSelectAllBridge = () => {
    setBridgeVisibleRows(DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
  };

  const handleDeselectAllBridge = () => {
    setBridgeVisibleRows(DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: false }), {}));
  };

  const handleSelectAllCore = () => {
    setCoreVisibleRows(DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
  };

  const handleDeselectAllCore = () => {
    setCoreVisibleRows(DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: false }), {}));
  };

  const handleReset = () => {
    setBtlVisibleRows(DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
    setBridgeVisibleRows(DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
    setCoreVisibleRows(DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
    setBtlRowOrder([...DEFAULT_BTL_ROWS]);
    setBridgeRowOrder([...DEFAULT_BRIDGE_ROWS]);
    setCoreRowOrder([...DEFAULT_CORE_ROWS]);
    // Reset label aliases
    setBtlLabelAliases({ ...DEFAULT_LABEL_ALIASES_BTL });
    setBridgeLabelAliases({ ...DEFAULT_LABEL_ALIASES_BRIDGE });
    setCoreLabelAliases({ ...DEFAULT_LABEL_ALIASES_CORE });
    // Reset header colors for all loan types
    setHeaderColors({ ...DEFAULT_HEADER_COLORS });
  };

  // Label alias handlers
  const handleStartEditLabel = (type, key, currentValue) => {
    setEditingLabel(prev => ({ ...prev, [type]: key }));
    setTempLabelValue(prev => ({ ...prev, [type]: currentValue }));
  };

  const handleSaveLabel = (type) => {
    const labelKey = editingLabel[type];
    if (!labelKey) return;
    
    const newValue = tempLabelValue[type];
    if (type === 'btl') {
      setBtlLabelAliases(prev => ({ ...prev, [labelKey]: newValue }));
    } else if (type === 'bridge') {
      setBridgeLabelAliases(prev => ({ ...prev, [labelKey]: newValue }));
    } else if (type === 'core') {
      setCoreLabelAliases(prev => ({ ...prev, [labelKey]: newValue }));
    }
    setEditingLabel(prev => ({ ...prev, [type]: null }));
    setTempLabelValue(prev => ({ ...prev, [type]: '' }));
  };

  const handleCancelEditLabel = (type) => {
    setEditingLabel(prev => ({ ...prev, [type]: null }));
    setTempLabelValue(prev => ({ ...prev, [type]: '' }));
  };

  const handleResetLabel = (type, key) => {
    if (type === 'btl') {
      setBtlLabelAliases(prev => ({ ...prev, [key]: DEFAULT_LABEL_ALIASES_BTL[key] }));
    } else if (type === 'bridge') {
      setBridgeLabelAliases(prev => ({ ...prev, [key]: DEFAULT_LABEL_ALIASES_BRIDGE[key] }));
    } else if (type === 'core') {
      setCoreLabelAliases(prev => ({ ...prev, [key]: DEFAULT_LABEL_ALIASES_CORE[key] }));
    }
  };

  const handleResetAllLabels = (type) => {
    if (type === 'btl') {
      setBtlLabelAliases({ ...DEFAULT_LABEL_ALIASES_BTL });
    } else if (type === 'bridge') {
      setBridgeLabelAliases({ ...DEFAULT_LABEL_ALIASES_BRIDGE });
    } else if (type === 'core') {
      setCoreLabelAliases({ ...DEFAULT_LABEL_ALIASES_CORE });
    }
  };

  // Helper function to render visibility checkboxes
  const renderVisibilitySection = (rows, visibleRows, toggleHandler, selectAllHandler, deselectAllHandler) => (
    <div className="settings-accordion-section">
      <section className="slds-accordion__section">
        <div 
          className={`slds-accordion__summary ${expandedSections.visibility ? 'slds-is-open' : ''}`}
          onClick={() => toggleSection('visibility')}
          aria-controls="accordion-visibility-content"
          aria-expanded={expandedSections.visibility}
        >
          <h3 className="slds-accordion__summary-heading">
            <span className="slds-accordion__summary-content">Row Visibility</span>
            <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
          </h3>
        </div>
        <div
          id="accordion-visibility-content"
          className="slds-accordion__content"
          hidden={!expandedSections.visibility}
        >
          <div className="visibility-actions">
            <button
              className="slds-button slds-button_brand"
              onClick={selectAllHandler}
              disabled={saving}
              type="button"
            >
              Select All
            </button>
            <button
              className="slds-button slds-button_neutral"
              onClick={deselectAllHandler}
              disabled={saving}
              type="button"
            >
              Deselect All
            </button>
          </div>
          <div className="visibility-grid">
            {rows.map(row => (
              <div key={row} className="slds-form-element">
                <div className="slds-form-element__control">
                  <div className="slds-checkbox">
                    <input
                      type="checkbox"
                      id={`${activeTab}-${row}`}
                      checked={visibleRows[row] || false}
                      onChange={() => toggleHandler(row)}
                      disabled={saving}
                    />
                    <label className="slds-checkbox__label" htmlFor={`${activeTab}-${row}`}>
                      <span className="slds-checkbox_faux"></span>
                      <span className="slds-form-element__label">{row}</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
<br />
  // Helper function to render row order section
  const renderRowOrderSection = (rowOrder, visibleRows, type) => (
    <div className="settings-accordion-section">
      <section className="slds-accordion__section">
        <div 
          className={`slds-accordion__summary ${expandedSections.rowOrder ? 'slds-is-open' : ''}`}
          onClick={() => toggleSection('rowOrder')}
          aria-controls="accordion-order-content"
          aria-expanded={expandedSections.rowOrder}
        >
          <h3 className="slds-accordion__summary-heading">
            <span className="slds-accordion__summary-content">Row Display Order</span>
            <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
          </h3>
        </div>
        <div id="accordion-order-content" className="slds-accordion__content" hidden={!expandedSections.rowOrder}>
          {(() => {
            const half = Math.ceil(rowOrder.length / 2);
            const left = rowOrder.slice(0, half);
            const right = rowOrder.slice(half);

            const renderColumn = (list, offset) => (
              <div className="row-order-container">
                {list.map((row, i) => {
                  const index = i + offset;
                  return (
                    <div
                      key={row}
                      className={`row-order-item ${visibleRows[row] === false ? 'row-order-item--hidden' : ''}`}
                    >
                      <span className="row-order-label">
                        <span className="row-order-number">{index + 1}.</span>
                        {row}
                        {visibleRows[row] === false && (
                          <span className="row-order-hidden-badge">(Hidden)</span>
                        )}
                      </span>
                      <div className="row-order-actions">
                        <button
                          className="slds-button slds-button_icon slds-button_icon-border"
                          onClick={() => handleMoveRowUp(index, type)}
                          disabled={saving || index === 0}
                          title="Move up"
                          type="button"
                        >
                          <SimpleIcon path={ICON_PATHS.chevronup} />
                          <span className="slds-assistive-text">Move up</span>
                        </button>
                        <button
                          className="slds-button slds-button_icon slds-button_icon-border"
                          onClick={() => handleMoveRowDown(index, type)}
                          disabled={saving || index === rowOrder.length - 1}
                          title="Move down"
                          type="button"
                        >
                          <SimpleIcon path={ICON_PATHS.chevrondown} />
                          <span className="slds-assistive-text">Move down</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );

            return (
              <div className="row-order-columns">
                {renderColumn(left, 0)}
                {renderColumn(right, half)}
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );

  // Helper function to render label aliases section
  const renderLabelAliasSection = (type, labelAliases, defaultAliases) => (
    <div className="settings-accordion-section">
      <section className="slds-accordion__section">
        <div 
          className={`slds-accordion__summary ${expandedSections.labelAliases ? 'slds-is-open' : ''}`}
          onClick={() => toggleSection('labelAliases')}
          aria-controls="accordion-labels-content"
          aria-expanded={expandedSections.labelAliases}
        >
          <h3 className="slds-accordion__summary-heading">
            <span className="slds-accordion__summary-content">Label Aliases</span>
            <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
          </h3>
        </div>
        <div id="accordion-labels-content" className="slds-accordion__content" hidden={!expandedSections.labelAliases}>
          <div className="label-alias-header">
            <p className="label-alias-description">
              Customize how field names appear in the results table. Click on a label to edit it.
            </p>
            <button
              className="slds-button slds-button_neutral"
              onClick={() => handleResetAllLabels(type)}
              disabled={saving}
              type="button"
            >
              Reset All Labels
            </button>
          </div>
          
          <div className="label-alias-grid">
            {Object.keys(defaultAliases).map(key => {
              const isModified = labelAliases[key] !== defaultAliases[key];
              const isEditing = editingLabel[type] === key;
              
              return (
                <div 
                  key={key} 
                  className={`label-alias-item ${isModified ? 'label-alias-item--modified' : ''}`}
                >
                  <div className="label-alias-item-header">
                    <span className="label-alias-key">{key}</span>
                    {isModified && (
                      <span className="label-alias-modified-badge">Modified</span>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="label-alias-edit-actions">
                      <input
                        type="text"
                        className="slds-input"
                        value={tempLabelValue[type]}
                        onChange={(e) => setTempLabelValue(prev => ({ ...prev, [type]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveLabel(type);
                          if (e.key === 'Escape') handleCancelEditLabel(type);
                        }}
                        autoFocus
                      />
                      <button
                        className="slds-button slds-button_icon slds-button_icon-brand"
                        onClick={() => handleSaveLabel(type)}
                        title="Save"
                        type="button"
                      >
                        <SimpleIcon path={ICON_PATHS.check} />
                        <span className="slds-assistive-text">Save</span>
                      </button>
                    </div>
                  ) : (
                    <div className="label-alias-view-actions">
                      <span className="label-alias-value">
                        {labelAliases[key]}
                      </span>
                      <button
                        className="slds-button slds-button_icon slds-button_icon-border"
                        onClick={() => handleStartEditLabel(type, key, labelAliases[key])}
                        title="Edit"
                        type="button"
                      >
                        <SimpleIcon path={ICON_PATHS.edit} />
                        <span className="slds-assistive-text">Edit</span>
                      </button>
                      {isModified && (
                        <button
                          className="slds-button slds-button_icon slds-button_icon-border"
                          onClick={() => handleResetLabel(type, key)}
                          title="Reset to default"
                          type="button"
                        >
                          <SimpleIcon path={ICON_PATHS.refresh} />
                          <span className="slds-assistive-text">Reset to default</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );

  // Helper function to render header colors section for each loan type
  const renderHeaderColorsSection = (loanType) => {
    const colors = headerColors[loanType] || DEFAULT_HEADER_COLORS[loanType];
    const columns = colors?.columns || DEFAULT_HEADER_COLORS[loanType].columns;
    
    const addColumn = () => {
      setHeaderColors(prev => ({
        ...prev,
        [loanType]: {
          ...prev[loanType],
          columns: [...(prev[loanType]?.columns || []), { bg: '#002855', text: '#ffffff' }]
        }
      }));
    };
    
    const removeColumn = (index) => {
      setHeaderColors(prev => ({
        ...prev,
        [loanType]: {
          ...prev[loanType],
          columns: prev[loanType].columns.filter((_, i) => i !== index)
        }
      }));
    };
    
    const updateColumnColor = (index, field, value) => {
      setHeaderColors(prev => ({
        ...prev,
        [loanType]: {
          ...prev[loanType],
          columns: prev[loanType].columns.map((col, i) => 
            i === index ? { ...col, [field]: value } : col
          )
        }
      }));
    };
    
    const updateLabelColor = (field, value) => {
      setHeaderColors(prev => ({
        ...prev,
        [loanType]: {
          ...prev[loanType],
          [field]: value
        }
      }));
    };
    
    const resetColors = () => {
      setHeaderColors(prev => ({
        ...prev,
        [loanType]: { ...DEFAULT_HEADER_COLORS[loanType] }
      }));
    };
    
    return (
      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.headerColors ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('headerColors')}
            aria-controls="accordion-colors-content"
            aria-expanded={expandedSections.headerColors}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Header Column Colors</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div id="accordion-colors-content" className="slds-accordion__content" hidden={!expandedSections.headerColors}>
            <div className="color-section-header">
              <p className="color-section-description">
                Customize the header colors for this calculator's results table. Add or remove columns as needed.
              </p>
              <div className="color-section-actions">
                <button
                  className="slds-button slds-button_neutral"
                  onClick={addColumn}
                  disabled={saving || columns.length >= 10}
                  type="button"
                >
                  + Add Column
                </button>
                <button
                  className="slds-button slds-button_text-destructive"
                  onClick={resetColors}
                  disabled={saving}
                  type="button"
                >
                  Reset Colors
                </button>
              </div>
            </div>
            
            {/* Preview */}
            <div className="color-preview-section">
              <h5 className="color-preview-title">Preview</h5>
              <div className="color-preview-header">
                <div 
                  className="color-preview-label"
                  style={{ 
                    backgroundColor: colors.labelBg || '#f4f6f9',
                    color: colors.labelText || '#181818'
                  }}
                >
                  Label
                </div>
                {columns.map((col, idx) => (
                  <div 
                    key={idx} 
                    className="color-preview-column"
                    style={{ 
                      backgroundColor: col.bg,
                      color: col.text
                    }}
                  >
                    Col {idx + 1}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Color Pickers */}
            <div className="color-picker-grid">
              {/* Label Column */}
              <div className="color-column-item">
                <h5 className="color-column-title">Label Column</h5>
                <div className="color-picker-row">
                  <label className="color-picker-label">BG:</label>
                  <input 
                    type="color" 
                    value={colors.labelBg || '#f4f6f9'}
                    onChange={(e) => updateLabelColor('labelBg', e.target.value)}
                    className="color-picker-input"
                  />
                  <input 
                    type="text" 
                    value={colors.labelBg || '#f4f6f9'}
                    onChange={(e) => updateLabelColor('labelBg', e.target.value)}
                    className="slds-input color-picker-text"
                  />
                </div>
                <div className="color-picker-row">
                  <label className="color-picker-label">Text:</label>
                  <input 
                    type="color" 
                    value={colors.labelText || '#181818'}
                    onChange={(e) => updateLabelColor('labelText', e.target.value)}
                    className="color-picker-input"
                  />
                  <input 
                    type="text" 
                    value={colors.labelText || '#181818'}
                    onChange={(e) => updateLabelColor('labelText', e.target.value)}
                    className="slds-input color-picker-text"
                  />
                </div>
              </div>
              
              {/* Data Columns */}
              {columns.map((col, idx) => (
                <div key={idx} className="color-column-item">
                  <div className="color-column-header">
                    <h5 className="color-column-title">Column {idx + 1}</h5>
                    {columns.length > 1 && (
                      <button
                        className="slds-button slds-button_icon slds-button_icon-border"
                        onClick={() => removeColumn(idx)}
                        title="Delete column"
                        type="button"
                      >
                        <SimpleIcon path={ICON_PATHS.delete} />
                        <span className="slds-assistive-text">Delete column</span>
                      </button>
                    )}
                  </div>
                  <div className="color-picker-row">
                    <label className="color-picker-label">BG:</label>
                    <input 
                      type="color" 
                      value={col.bg}
                      onChange={(e) => updateColumnColor(idx, 'bg', e.target.value)}
                      className="color-picker-input"
                    />
                    <input 
                      type="text" 
                      value={col.bg}
                      onChange={(e) => updateColumnColor(idx, 'bg', e.target.value)}
                      className="slds-input color-picker-text"
                    />
                  </div>
                  <div className="color-picker-row">
                    <label className="color-picker-label">Text:</label>
                    <input 
                      type="color" 
                      value={col.text}
                      onChange={(e) => updateColumnColor(idx, 'text', e.target.value)}
                      className="color-picker-input"
                    />
                    <input 
                      type="text" 
                      value={col.text}
                      onChange={(e) => updateColumnColor(idx, 'text', e.target.value)}
                      className="slds-input color-picker-text"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="page-container page-container--table global-settings-container">
      <div className="global-settings-header">
        <WelcomeHeader className="global-settings-title" />
        <p className="global-settings-subtitle">Configure calculator results table display and customize how data appears to users</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="slds-tabs_default slds-tabs_default_medium slds-m-bottom_medium">
        <ul className="slds-tabs_default__nav" role="tablist">
          <li 
            className={`slds-tabs_default__item ${activeTab === 'btl' ? 'slds-is-active' : ''}`}
            role="presentation"
          >
            <button
              className="slds-tabs_default__link"
              onClick={() => setActiveTab('btl')}
              role="tab"
              aria-selected={activeTab === 'btl'}
              type="button"
            >
              BTL Calculator
            </button>
          </li>
          <li 
            className={`slds-tabs_default__item ${activeTab === 'bridge' ? 'slds-is-active' : ''}`}
            role="presentation"
          >
            <button
              className="slds-tabs_default__link"
              onClick={() => setActiveTab('bridge')}
              role="tab"
              aria-selected={activeTab === 'bridge'}
              type="button"
            >
              Bridging Calculator
            </button>
          </li>
          <li 
            className={`slds-tabs_default__item ${activeTab === 'core' ? 'slds-is-active' : ''}`}
            role="presentation"
          >
            <button
              className="slds-tabs_default__link"
              onClick={() => setActiveTab('core')}
              role="tab"
              aria-selected={activeTab === 'core'}
              type="button"
            >
              Core Range
            </button>
          </li>
        </ul>
      </div>

      {/* BTL Tab Content */}
      {activeTab === 'btl' && (
        <div className="slds-accordion">
          {renderVisibilitySection(DEFAULT_BTL_ROWS, btlVisibleRows, handleToggleBtlRow, handleSelectAllBtl, handleDeselectAllBtl)}
          {renderRowOrderSection(btlRowOrder, btlVisibleRows, 'btl')}
          {renderLabelAliasSection('btl', btlLabelAliases, DEFAULT_LABEL_ALIASES_BTL)}
          {renderHeaderColorsSection('btl')}
        </div>
      )}

      {/* Bridge Tab Content */}
      {activeTab === 'bridge' && (
        <div className="slds-accordion">
          {renderVisibilitySection(DEFAULT_BRIDGE_ROWS, bridgeVisibleRows, handleToggleBridgeRow, handleSelectAllBridge, handleDeselectAllBridge)}
          {renderRowOrderSection(bridgeRowOrder, bridgeVisibleRows, 'bridge')}
          {renderLabelAliasSection('bridge', bridgeLabelAliases, DEFAULT_LABEL_ALIASES_BRIDGE)}
          {renderHeaderColorsSection('bridge')}
        </div>
      )}

      {/* Core Tab Content */}
      {activeTab === 'core' && (
        <div className="slds-accordion">
          {renderVisibilitySection(DEFAULT_CORE_ROWS, coreVisibleRows, handleToggleCoreRow, handleSelectAllCore, handleDeselectAllCore)}
          {renderRowOrderSection(coreRowOrder, coreVisibleRows, 'core')}
          {renderLabelAliasSection('core', coreLabelAliases, DEFAULT_LABEL_ALIASES_CORE)}
          {renderHeaderColorsSection('core')}
        </div>
      )}

      {/* Action Buttons */}
      <div className="settings-actions-footer">
        <button
          className="slds-button slds-button_neutral"
          onClick={handleReset}
          disabled={saving}
          type="button"
          style={{ display: 'none' }}
        >
          Reset to Defaults
        </button>
        <button
          className="slds-button slds-button_brand"
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Notification Modal */}
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
