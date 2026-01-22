import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import RateEditModal from './RateEditModal';
// Bridge & Fusion rates tab removed - keep BTL rates only
import NotificationModal from '../modals/NotificationModal';
import WelcomeHeader from '../shared/WelcomeHeader';
import '../../styles/slds.css';
import '../../styles/admin-tables.css';

function RatesTable() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  // tabs removed: always show BTL rates
  const [filterOptions, setFilterOptions] = useState({
    setKeys: new Set(),
    properties: new Set(),
    rateTypes: new Set(),
    tiers: new Set(),
    products: new Set(),
    productFees: new Set(),
    initialTerms: new Set(),
    fullTerms: new Set()
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    set_key: '',
    property: '',
    rate_type: '',
    tier: '',
    product: '',
    product_fee: '',
    initial_term: '',
    full_term: '',
    is_retention: ''
  });
  const [sortField, setSortField] = useState('set_key');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' or 'desc'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  const { supabase } = useSupabase();

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      
      // First, fetch all data to populate filter options
      const { data: allData, error: allDataError } = await supabase
        .from('rates_flat')
        .select('set_key, property, rate_type, tier, product, product_fee, initial_term, full_term');
      
      if (allDataError) throw allDataError;

      // Update filter options from all data
      setFilterOptions({
        setKeys: new Set(allData.map(r => r.set_key).filter(Boolean)),
        properties: new Set(allData.map(r => r.property).filter(Boolean)),
        rateTypes: new Set(allData.map(r => r.rate_type).filter(Boolean)),
        tiers: new Set(allData.map(r => r.tier).filter(Boolean)),
        products: new Set(allData.map(r => r.product).filter(Boolean)),
        productFees: new Set(allData.map(r => r.product_fee).filter(Boolean)),
        initialTerms: new Set(allData.map(r => r.initial_term).filter(Boolean)),
        fullTerms: new Set(allData.map(r => r.full_term).filter(Boolean))
      });

      // Then fetch filtered data
      // Use a generic select('*') so the app stays resilient if the DB is missing
      // recently-added columns (e.g. migrations haven't been applied yet).
      let query = supabase
        .from('rates_flat')
        .select('*');
      
      // Apply filters
  if (filters.set_key) query = query.eq('set_key', filters.set_key);
      if (filters.property) query = query.eq('property', filters.property);

      // Retention filter (accepts 'Yes' / 'No' / boolean-like values)
      if (filters.is_retention !== '' && filters.is_retention !== null && filters.is_retention !== undefined) {
        const v = String(filters.is_retention).toLowerCase();
        if (['yes', 'true', '1'].includes(v)) {
          query = query.eq('is_retention', true);
        } else if (['no', 'false', '0'].includes(v)) {
          query = query.eq('is_retention', false);
        }
      }

  // rate_type, tier, product_fee and term-like fields may be numeric in DB. Coerce numeric strings when filtering.
  const numericFields = ['rate_type', 'tier', 'product_fee', 'initial_term', 'full_term'];
      const applyFilter = (field) => {
        const val = filters[field];
        if (val === '' || val === null || val === undefined) return;
        if (numericFields.includes(field) && !Number.isNaN(Number(val))) {
          query = query.eq(field, Number(val));
        } else {
          query = query.eq(field, val);
        }
      };

  applyFilter('rate_type');
  applyFilter('tier');
  applyFilter('product_fee');
  applyFilter('initial_term');
  applyFilter('full_term');
      if (filters.product) query = query.eq('product', filters.product);
      
      const { data, error } = await query.order('set_key', { ascending: true });
      
      if (error) throw error;

      setRates(data);
      
      if (error) throw error;
      setRates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [filters]);

  const handleEdit = (rate) => {
    setEditingRate(rate);
  };

  const handleSave = async (updatedRate) => {
    try {
      const { error } = await supabase
        .from('rates_flat')
        .update({
          tier: updatedRate.tier || null,
          property: updatedRate.property || null,
          product: updatedRate.product || null,
          rate_type: updatedRate.rate_type || null,
          rate: updatedRate.rate,
          product_fee: updatedRate.product_fee,
          max_ltv: updatedRate.max_ltv ?? null,
          revert_index: updatedRate.revert_index || null,
          revert_margin: updatedRate.revert_margin ?? null,
          min_loan: updatedRate.min_loan ?? null,
          max_loan: updatedRate.max_loan ?? null,
          max_rolled_months: updatedRate.max_rolled_months ?? null,
          max_defer_int: updatedRate.max_defer_int ?? null,
          min_icr: updatedRate.min_icr ?? null,
          max_top_slicing: updatedRate.max_top_slicing ?? null,
          admin_fee: updatedRate.admin_fee ?? null,
          erc_1: updatedRate.erc_1 ?? null,
          erc_2: updatedRate.erc_2 ?? null,
          erc_3: updatedRate.erc_3 ?? null,
          erc_4: updatedRate.erc_4 ?? null,
          erc_5: updatedRate.erc_5 ?? null,
          status: updatedRate.status || null,
          floor_rate: updatedRate.floor_rate ?? null,
          proc_fee: updatedRate.proc_fee ?? null,
          is_tracker: updatedRate.is_tracker,
          is_retention: updatedRate.is_retention || false,
          initial_term: updatedRate.initial_term ?? null,
          full_term: updatedRate.full_term ?? null,
        })
        .eq('id', updatedRate.id);

      if (error) throw error;
      
      setEditingRate(null);
      fetchRates(); // Refresh the table
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading rates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-box">
          <h3>Error Loading Rates</h3>
          <p>{error.message || error}</p>
          <button className="slds-button slds-button_brand" onClick={() => fetchRates()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rate?')) {
      try {
        const { error } = await supabase
          .from('rates_flat')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchRates();
        setSelectedRows(new Set());
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length === 0) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please select at least one rate to delete' });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected rates?`)) {
      try {
        const { error } = await supabase
          .from('rates_flat')
          .delete()
          .in('id', selectedIds);

        if (error) throw error;
        fetchRates();
        setSelectedRows(new Set());
        setSelectAll(false);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const currentPageIds = getCurrentPageRates().map(rate => rate.id);
      setSelectedRows(new Set(currentPageIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    setSelectAll(getCurrentPageRates().every(rate => newSelected.has(rate.id)));
  };

  const getCurrentPageRates = () => {
    // Apply sorting before paging
    const sorted = [...rates];
    if (sortField) {
      const compareValues = (a, b) => {
        if (a === undefined || a === null) return b === undefined || b === null ? 0 : 1;
        if (b === undefined || b === null) return -1;
        // try numeric compare
        const na = Number(String(a).replace(/[^0-9.-]/g, ''));
        const nb = Number(String(b).replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        const sa = String(a).toLowerCase();
        const sb = String(b).toLowerCase();
        if (sa < sb) return -1;
        if (sa > sb) return 1;
        return 0;
      };
      sorted.sort((x, y) => {
        const res = compareValues(x[sortField], y[sortField]);
        return sortDir === 'asc' ? res : -res;
      });
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(rates.length / itemsPerPage);

  const handleAdd = () => {
    setEditingRate({
      id: null,
      set_key: '',
      rate_type: '',
      is_retention: false,
      property: '',
      tier: '',
      product: '',
      product_fee: 0,
      initial_term: null,
      full_term: null,
      rate: 0,
      max_ltv: 0,
      revert_index: '',
      revert_margin: 0,
      min_loan: 0,
      max_loan: 0,
      max_rolled_months: 0,
      max_defer_int: 0,
      min_icr: 0,
      is_tracker: false
    });
  };

  const changeSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Small CSV parser that handles quoted fields and CRLF
    function parseCsv(text) {
      const rows = [];
      let cur = '';
      let row = [];
      let i = 0;
      let inQuotes = false;

      while (i < text.length) {
        const ch = text[i];
        const next = text[i + 1];

        if (ch === '"') {
          if (inQuotes && next === '"') {
            // escaped quote
            cur += '"';
            i += 2;
            continue;
          }
          inQuotes = !inQuotes;
          i++;
          continue;
        }

        if (!inQuotes && (ch === ',')) {
          row.push(cur);
          cur = '';
          i++;
          continue;
        }

        if (!inQuotes && (ch === '\n' || (ch === '\r' && text[i + 1] === '\n'))) {
          // end of row
          row.push(cur);
          rows.push(row.map(c => (c === undefined ? '' : c)));
          cur = '';
          row = [];
          if (ch === '\r' && text[i + 1] === '\n') i += 2; else i++;
          continue;
        }

        cur += ch;
        i++;
      }

      // push last field/row if any
      if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row.map(c => (c === undefined ? '' : c)));
      }

      return rows;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = parseCsv(text);
        if (rows.length < 1) {
          setError('CSV appears empty');
          return;
        }

        // Normalize headers
        const rawHeaders = rows[0].map(h => (h || '').toString().trim());
        const headers = rawHeaders.map(h => h.toLowerCase().replace(/\s+/g, '_'));

        // Helper to map common header variants
        const normalizeKey = (key) => {
          if (!key) return key;
          const k = key.replace(/-/g, '_');
          if (k === 'scope') return 'property';
          // add more mappings if needed
          return k;
        };

        const dataRows = rows.slice(1).filter(r => r.some(cell => (cell || '').toString().trim() !== ''));
        const chunkSize = 200; // upsert in batches

        const toNumeric = s => {
          if (s === null || s === undefined || s === '') return null;
          const n = Number(String(s).replace(/[^0-9.-]/g, ''));
          return Number.isFinite(n) ? n : null;
        };

        const toBoolean = s => {
          if (s === null || s === undefined || s === '') return null;
          const v = String(s).toLowerCase().trim();
          if (['yes', 'true', '1'].includes(v)) return true;
          if (['no', 'false', '0'].includes(v)) return false;
          return null;
        };

        const records = dataRows.map(row => {
          const obj = {};
          for (let i = 0; i < headers.length; i++) {
            const raw = row[i] === undefined ? '' : row[i];
            const key = normalizeKey(headers[i]);
            if (!key) continue;
            // Convert common numeric fields
            if (['rate', 'product_fee', 'max_ltv', 'revert_margin', 'min_loan', 'max_loan', 'max_rolled_months', 'max_defer_int', 'min_icr', 'max_top_slicing', 'admin_fee', 'erc_1', 'erc_2', 'erc_3', 'erc_4', 'erc_5', 'floor_rate', 'proc_fee', 'term', 'initial_term', 'full_term'].includes(key)) {
              obj[key] = toNumeric(raw);
            } else if (['is_retention', 'is_tracker', 'is_margin'].includes(key)) {
              obj[key] = toBoolean(raw);
            } else {
              obj[key] = raw === undefined ? null : raw.toString().trim();
            }
          }
          return obj;
        }).filter(r => r.set_key || r.setkey || r.set_key === 0);

        // Map accidental header names
        const mappedRecords = records.map(r => {
          if (r.scope && !r.property) {
            r.property = r.scope;
            delete r.scope;
          }
          // ensure set_key exists as string
          if (!r.set_key && r.setkey) {
            r.set_key = r.setkey;
            delete r.setkey;
          }
          return r;
        });
        // Basic validation: ensure we have at least one record with required keys
        if (!mappedRecords || mappedRecords.length === 0) {
          setError('No valid records found in CSV. Ensure each row includes at least one of: set_key / setkey, property, tier, product.');
          // clear file input so user can try again
          const fileEl = document.getElementById('csv-import'); if (fileEl) fileEl.value = '';
          return;
        }

        // Remove any DB-managed fields (id, timestamps) before upsert
        const cleanedRecords = mappedRecords.map(r => {
          const rec = { ...r };
          if ('created_at' in rec) delete rec.created_at;
          if ('updated_at' in rec) delete rec.updated_at;
          if ('id' in rec) delete rec.id;

          // Infer initial_term if missing (2yr -> 24, 3yr -> 36), fallback to term/term_months
          if (rec.initial_term === null || rec.initial_term === undefined || rec.initial_term === '') {
            const productName = String(rec.product || '').toLowerCase();
            if (productName.includes('2yr')) rec.initial_term = 24;
            else if (productName.includes('3yr')) rec.initial_term = 36;
            else if (rec.term_months) rec.initial_term = Number(rec.term_months);
            else if (rec.term) rec.initial_term = Number(rec.term);
            else rec.initial_term = null;
          } else {
            rec.initial_term = Number(rec.initial_term);
          }

          // Default full_term to 120 months if missing
          if (rec.full_term === null || rec.full_term === undefined || rec.full_term === '') {
            rec.full_term = 120;
          } else {
            rec.full_term = Number(rec.full_term);
          }

          return rec;
        });

        // Upsert in chunks with onConflict to avoid duplicates
        for (let i = 0; i < cleanedRecords.length; i += chunkSize) {
          const chunk = cleanedRecords.slice(i, i + chunkSize);
          const { data, error } = await supabase
            .from('rates_flat')
            .upsert(chunk, { onConflict: 'set_key,property,tier,product,term' });

          if (error) {
            setError(error.message || JSON.stringify(error));
            return;
          }

          // Optionally log progress
        }

        // Refresh table after import
        fetchRates();
      } catch (err) {
        setError(err.message || String(err));
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  const formatCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (value === 0) return '0';
      if (!value) return '';
      return value.toString();
    }
    const stringValue = String(value);
    // If the value contains comma, quotes, or newlines, wrap it in quotes and escape existing quotes
    if (/[,"\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const formatExportField = (header, rate) => {
    if (!rate) return '';
    switch (header) {
      case 'rate':
        return formatCsvValue(rate.rate ? `${rate.rate}%` : '');
      case 'max_ltv':
        return formatCsvValue(rate.max_ltv ? `${rate.max_ltv}%` : '');
      case 'min_loan':
      case 'max_loan':
        {
          const v = rate[header];
          if (v === null || v === undefined || v === '') return '';
          try { return formatCsvValue(`£${Number(v).toLocaleString()}`); } catch (e) { return formatCsvValue(v); }
        }
      case 'is_retention':
      case 'is_tracker':
        return formatCsvValue(rate[header] ? 'Yes' : 'No');
      case 'product_fee':
      case 'proc_fee':
        return formatCsvValue(rate[header] !== null && rate[header] !== undefined && rate[header] !== '' ? `${rate[header]}%` : '');
      case 'initial_term':
      case 'full_term':
        return formatCsvValue(rate[header] !== null && rate[header] !== undefined && rate[header] !== '' ? `${rate[header]}` : '');
      case 'min_icr':
        return formatCsvValue(rate.min_icr ? `${rate.min_icr}%` : '');
      default:
        return formatCsvValue(rate[header]);
    }
  };

  const handleExport = () => {
    const headers = [
      'set_key', 'rate_type', 'is_retention', 'property', 'tier',
      'product', 'product_fee', 'initial_term', 'full_term', 'rate', 'max_ltv', 'revert_index',
      'revert_margin', 'min_loan', 'max_loan', 'max_rolled_months',
      'max_defer_int', 'min_icr', 'is_tracker',
      'max_top_slicing', 'admin_fee', 'erc_1', 'erc_2', 'erc_3', 'erc_4', 'erc_5', 'status', 'floor_rate', 'proc_fee'
    ];
    
    // Format the header row
    const headerRow = headers.map(header => formatCsvValue(header)).join(',');
    
    // Format the data rows
    const dataRows = rates.map(rate => 
      headers.map(header => formatExportField(header, rate)).join(',')
    );
    
    // Combine headers and data with Windows-style line endings
    const csvContent = [headerRow, ...dataRows].join('\r\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `rates_${date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  
  return (
    <div className="admin-table-container">
      {/* Tabs removed - always showing BTL Rates */}
      <>
      <div className="table-header-stacked">
        <div className="table-title-row">
          <WelcomeHeader />
          <div className="table-actions-row">
            <button className="slds-button slds-button_brand" onClick={handleAdd}>
              Add New Product
            </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            style={{ display: 'none' }}
            id="csv-import"
          />
          <button className="slds-button slds-button_neutral" onClick={() => document.getElementById('csv-import').click()}>
            Import CSV
          </button>
          <button className="slds-button slds-button_neutral" onClick={handleExport}>
            Export CSV
          </button>
          {selectedRows.size > 0 && (
            <button className="slds-button slds-button_destructive" onClick={handleBulkDelete}>
              Delete Selected ({selectedRows.size})
            </button>
          )}
            <span className="total-count">Total: {rates.length}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-field">
          <label>Set Key</label>
            <select
              value={filters.set_key}
              onChange={(e) => handleFilterChange('set_key', e.target.value)}
            >
              <option value="">All Set Keys</option>
              {Array.from(filterOptions.setKeys).sort().map(sk => (
                <option key={sk} value={sk}>{sk}</option>
              ))}
            </select>
          </div>

        <div className="filter-field">
          <label>Property</label>
          <select 
            value={filters.property}
            onChange={(e) => handleFilterChange('property', e.target.value)}
          >
            <option value="">All Properties</option>
            {Array.from(filterOptions.properties).sort().map(prop => (
              <option key={prop} value={prop}>{prop}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Rate Type</label>
          <select
            value={filters.rate_type}
            onChange={(e) => handleFilterChange('rate_type', e.target.value)}
          >
            <option value="">All Rate Types</option>
            {Array.from(filterOptions.rateTypes).sort().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label style={{ visibility: 'hidden' }}>Actions</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="slds-button slds-button_neutral" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
            </button>
            {(filters.set_key || filters.property || filters.rate_type || filters.is_retention || filters.tier || filters.product || filters.product_fee || filters.initial_term) && (
              <button 
                className="slds-button slds-button_text-destructive" 
                onClick={() => setFilters({ set_key: '', property: '', rate_type: '', tier: '', product: '', product_fee: '', initial_term: '', full_term: '', is_retention: '' })}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="filters-section filters-advanced">
          <div className="filter-field">
            <label>Retention</label>
            <select
              value={filters.is_retention}
              onChange={(e) => handleFilterChange('is_retention', e.target.value)}
            >
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="filter-field">
            <label>Tier</label>
            <select
              value={filters.tier}
              onChange={(e) => handleFilterChange('tier', e.target.value)}
            >
              <option value="">All Tiers</option>
              {Array.from(filterOptions.tiers).sort().map(tier => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Product</label>
            <select
              value={filters.product}
              onChange={(e) => handleFilterChange('product', e.target.value)}
            >
              <option value="">All Products</option>
              {Array.from(filterOptions.products).sort().map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Product Fee</label>
            <select
              value={filters.product_fee}
              onChange={(e) => handleFilterChange('product_fee', e.target.value)}
            >
              <option value="">All Product Fees</option>
              {Array.from(filterOptions.productFees).sort((a, b) => a - b).map(fee => (
                <option key={fee} value={fee}>{fee}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Initial Term (months)</label>
            <select
              value={filters.initial_term}
              onChange={(e) => handleFilterChange('initial_term', e.target.value)}
            >
              <option value="">All</option>
              {Array.from(filterOptions.initialTerms).sort((a, b) => a - b).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="professional-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th onClick={() => changeSort('set_key')} className={`sortable ${sortField === 'set_key' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Set Key</th>
              <th onClick={() => changeSort('rate_type')} className={`sortable ${sortField === 'rate_type' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Rate Type</th>
              <th>Retention?</th>
              <th onClick={() => changeSort('property')} className={`sortable ${sortField === 'property' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Property</th>
              <th onClick={() => changeSort('tier')} className={`sortable ${sortField === 'tier' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Tier</th>
              <th onClick={() => changeSort('product')} className={`sortable ${sortField === 'product' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Product</th>
              <th>Product Fee</th>
              <th onClick={() => changeSort('initial_term')} className={`sortable ${sortField === 'initial_term' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Initial Term</th>
              <th onClick={() => changeSort('full_term')} className={`sortable ${sortField === 'full_term' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Full Term</th>
              <th onClick={() => changeSort('rate')} className={`sortable ${sortField === 'rate' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Rate (%)</th>
              <th onClick={() => changeSort('max_ltv')} className={`sortable ${sortField === 'max_ltv' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Max LTV</th>
              <th>Revert Index</th>
              <th>Revert Margin</th>
              <th>Min Loan</th>
              <th>Max Loan</th>
              <th>Max Rolled Months</th>
              <th>Max Defer Int</th>
              <th>Min ICR</th>
              <th>Tracker?</th>
              <th>Max Top Slicing</th>
              <th>Admin Fee</th>
              <th>ERC 1</th>
              <th>ERC 2</th>
              <th>ERC 3</th>
              <th>ERC 4</th>
              <th>ERC 5</th>
              <th>Status</th>
              <th>Floor Rate</th>
              <th>Proc Fee</th>
              <th className="sticky-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageRates().map(rate => (
              <tr key={rate.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rate.id)}
                    onChange={() => toggleSelectRow(rate.id)}
                  />
                </td>
                <td>{rate.set_key}</td>
                <td>{rate.rate_type}</td>
                <td>{rate.is_retention ? 'Yes' : 'No'}</td>
                <td>{rate.property}</td>
                <td>{rate.tier}</td>
                <td>{rate.product}</td>
                <td>{rate.product_fee}</td>
                <td>{rate.initial_term ?? ''}</td>
                <td>{rate.full_term ?? ''}</td>
                <td>{rate.rate}%</td>
                <td>{rate.max_ltv}%</td>
                <td>{rate.revert_index}</td>
                <td>{rate.revert_margin}</td>
                <td>£{rate.min_loan?.toLocaleString()}</td>
                <td>£{rate.max_loan?.toLocaleString()}</td>
                <td>{rate.max_rolled_months}</td>
                <td>{rate.max_defer_int}</td>
                <td>{rate.min_icr}%</td>
                <td>{rate.is_tracker ? 'Yes' : 'No'}</td>
                <td>{rate.max_top_slicing ?? ''}</td>
                <td>{rate.admin_fee ?? ''}</td>
                <td>{rate.erc_1 ?? ''}</td>
                <td>{rate.erc_2 ?? ''}</td>
                <td>{rate.erc_3 ?? ''}</td>
                <td>{rate.erc_4 ?? ''}</td>
                <td>{rate.erc_5 ?? ''}</td>
                <td>{rate.status ?? ''}</td>
                <td>{rate.floor_rate ?? ''}</td>
                <td>{rate.proc_fee ?? ''}</td>
                <td className="sticky-action">
                  <div className="row-actions">
                    <button className="slds-button slds-button_neutral" onClick={() => handleEdit(rate)}>
                      Edit
                    </button>
                    <button className="slds-button slds-button_destructive" onClick={() => handleDelete(rate.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <div className="pagination-controls">
          <button 
            className="slds-button slds-button_neutral"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button 
            className="slds-button slds-button_neutral"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <div className="rows-per-page">
            <label>Rows:</label>
            <select value={itemsPerPage} onChange={(e) => { const v = Number(e.target.value); setItemsPerPage(v); setCurrentPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {editingRate && (
        <RateEditModal
          rate={editingRate}
          onSave={handleSave}
          onCancel={() => setEditingRate(null)}
          isNew={!editingRate.id}
        />
      )}
      
      <NotificationModal
        isOpen={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
      </>
    </div>
  );
}

export default RatesTable;