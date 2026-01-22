import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import WelcomeHeader from '../shared/WelcomeHeader';
import SalesforceIcon from "../shared/SalesforceIcon";
import CriteriaEditModal from './CriteriaEditModal';
import NotificationModal from '../modals/NotificationModal';
import '../../styles/slds.css';
import '../../styles/admin-tables.css';

function CriteriaTable() {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    criteriaSets: new Set(),
    productScopes: new Set(),
    questionGroups: new Set(),
  });
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    criteria_set: '',
    product_scope: '',
    question_group: '',
  });
  const [sortField, setSortField] = useState('question_key');
  const [sortDir, setSortDir] = useState('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  const { supabase } = useSupabase();

  // Exclude bookkeeping and unique identifier fields from UI and export/import
  const excluded = new Set(['created_at', 'updated_at', 'id']);

  // sanitize a record before sending to Supabase:
  // - remove id/timestamps
  // - convert empty-string values to null (Postgres integer columns cannot accept "")
  // - coerce numeric-looking values to Number for obvious numeric columns
  const sanitizeRecord = (input) => {
    const rec = { ...input };
    if ('created_at' in rec) delete rec.created_at;
    if ('updated_at' in rec) delete rec.updated_at;
    if ('id' in rec) delete rec.id;

    Object.keys(rec).forEach((k) => {
      let v = rec[k];
      if (v === undefined) { rec[k] = null; return; }
      if (typeof v === 'string') v = v.trim();
      // empty strings -> null
      if (v === '') { rec[k] = null; return; }

      // coerce obvious integers/numbers when the value is a numeric string
      if (typeof v === 'string' && /^-?\d+(?:\.\d+)?$/.test(v)) {
        const n = Number(v);
        if (Number.isFinite(n)) { rec[k] = n; return; }
      }

      // leave other values as-is
      rec[k] = v;
    });

    // Prefer explicit handling for display_order and tier (common integer fields)
    if ('display_order' in rec) {
      const dv = rec.display_order;
      if (dv === null || dv === '') rec.display_order = null;
      else {
        const pn = Number(String(dv).replace(/[^0-9-]/g, ''));
        rec.display_order = Number.isFinite(pn) ? pn : null;
      }
    }
    if ('tier' in rec) {
      const tv = rec.tier;
      if (tv === null || tv === '') rec.tier = null;
      else {
        const pn = Number(String(tv).replace(/[^0-9-]/g, ''));
        rec.tier = Number.isFinite(pn) ? pn : null;
      }
    }

    return rec;
  };

  const fetchCriteria = async () => {
    setLoading(true);
    setError(null);
    try {
      // First, fetch all data to populate filter options
      const { data: allData, error: allDataError } = await supabase
        .from('criteria_config_flat')
        .select('criteria_set, product_scope, question_group');
      
      if (allDataError) throw allDataError;

      // Update filter options
      setFilterOptions({
        criteriaSets: new Set(allData.map(c => c.criteria_set).filter(Boolean)),
        productScopes: new Set(allData.map(c => c.product_scope).filter(Boolean)),
        questionGroups: new Set(allData.map(c => c.question_group).filter(Boolean)),
      });

      // Then fetch filtered data
      let query = supabase
        .from('criteria_config_flat')
        .select('*');
      
      // Apply filters
      if (filters.criteria_set) query = query.eq('criteria_set', filters.criteria_set);
      if (filters.product_scope) query = query.eq('product_scope', filters.product_scope);
      if (filters.question_group) query = query.eq('question_group', filters.question_group);
      
      const { data, error } = await query;
      
      if (error) throw error;

      setCriteria(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
          const lines = text.split(/\r?\n/);
          const firstLine = lines[0] || '';
          const commaCount = (firstLine.match(/,/g) || []).length;
          const tabCount = (firstLine.match(/\t/g) || []).length;
          const semicolonCount = (firstLine.match(/;/g) || []).length;
          let delim = ',';
          if (tabCount > commaCount && tabCount >= semicolonCount) delim = '\t';
          else if (semicolonCount > commaCount && semicolonCount > tabCount) delim = ';';

          const rows = lines.map(row => row.split(delim));
          const rawHeaders = (rows[0] || []).map(h => (h || '').toString().trim());

          // helper: normalize header text to a safe column name (snake_case, alphanum + _)
          const normalizeHeader = (h) => {
            if (!h) return '';
            // strip BOM if present
            const noBOM = h.replace(/^\uFEFF/, '');
            return noBOM.toString().trim().toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, '');
          };

          // Map common header variants to expected DB columns
          const mapHeaderToColumn = (h) => {
            const n = normalizeHeader(h);
            if (!n) return '';
            if (n === 'scope') return 'product_scope';
            if (n === 'set' || n === 'set_key' || n === 'setkey') return 'criteria_set';
            if (n === 'question' ) return 'question_label';
            if (n === 'question_label' || n === 'questionlabel') return 'question_label';
            if (n === 'question_key' || n === 'questionkey') return 'question_key';
            if (n === 'option' || n === 'option_label' || n === 'optionlabel') return 'option_label';
            if (n === 'display_order' || n === 'displayorder') return 'display_order';
            // common DB fields keep their normalized form
            return n;
          };

          const headers = rawHeaders.map(mapHeaderToColumn);

          // Prepare records but don't upsert yet — show preview to the user for confirmation
          const records = rows.slice(1)
            .filter(row => row.some(cell => (cell || '').toString().trim()))
            .map(row => {
              const record = {};
              headers.forEach((headerKey, i) => {
                if (!headerKey) return; // skip blank/missing headers
                record[headerKey] = row[i] !== undefined && row[i] !== null ? row[i].toString().trim() : null;
              });
              // Do not mutate timestamps here; we'll remove them before actual upsert
              return record;
            });

          // compute preview headers (filtered) to avoid showing id/timestamps
          const previewHeaders = headers.filter(h => h && !excluded.has(h));

          // Build a small preview payload (first 5 rows)
          const preview = {
            headers: rawHeaders,
            previewHeaders,
            sampleRows: records.slice(0, 5),
            records
          };
        setImportPreview(preview);
        setShowImportPreview(true);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const [importLoading, setImportLoading] = useState(false);

  const confirmImport = async () => {
    if (!importPreview) return;
    setImportLoading(true);
    try {
      const { records } = importPreview;
      // sanitize records: remove created_at/updated_at and coerce display_order
      // sanitize records (remove id/timestamps, convert empty strings to null, coerce numeric strings)
      const prepared = records.map(r => sanitizeRecord(r));

      // Batch upsert: try a single upsert with ON CONFLICT first (fast),
      // but Postgres requires a unique constraint matching the conflict target.
      // If the DB doesn't have that constraint, fall back to a safe per-record
      // insert-or-update loop (slower but reliable).
      const chunkSize = 50;
      for (let i = 0; i < prepared.length; i += chunkSize) {
        const chunk = prepared.slice(i, i + chunkSize);
        try {
          const { error } = await supabase
            .from('criteria_config_flat')
            .upsert(chunk, {
              onConflict: 'criteria_set,product_scope,question_key,option_label'
            });
          if (error) throw error;
        } catch (upsertErr) {
          // Fallback: do per-record insert/update
          for (const rec of chunk) {
            const matchObj = {
              criteria_set: rec.criteria_set,
              product_scope: rec.product_scope,
              question_key: rec.question_key,
              option_label: rec.option_label
            };

            // Check if a matching row exists
            const { data: existing, error: selErr } = await supabase
              .from('criteria_config_flat')
              .select('id')
              .match(matchObj)
              .limit(1);
            if (selErr) throw selErr;

            if (existing && existing.length > 0) {
              // update
              const { error: upErr } = await supabase
                .from('criteria_config_flat')
                .update(rec)
                .match(matchObj);
              if (upErr) throw upErr;
            } else {
              const { error: insErr } = await supabase
                .from('criteria_config_flat')
                .insert(rec);
              if (insErr) throw insErr;
            }
          }
        }
      }

      // refresh - clear preview and reload criteria
      setShowImportPreview(false);
      setImportPreview(null);
      // clear the file input so user can re-select same file
      const fileEl = document.getElementById('criteria-csv-import');
      if (fileEl) fileEl.value = '';
      await fetchCriteria();
    } catch (err) {
      setError(err.message || String(err));
      // keep preview open so user can cancel or inspect
    } finally {
      setImportLoading(false);
    }
  };

  const cancelImport = () => {
    setShowImportPreview(false);
    setImportPreview(null);
    // clear the file input so user can re-select the same file if desired
    const fileEl = document.getElementById('criteria-csv-import');
    if (fileEl) fileEl.value = '';
  };

  const handleExport = () => {
    // Dynamically determine headers from all rows so CSV matches the table view
    const allKeys = new Set();
    for (const r of criteria) Object.keys(r).forEach(k => allKeys.add(k));
    // Prefer a sensible order for common fields, then append remaining keys alphabetically
    const preferred = ['id','display_order','criteria_set','product_scope','question_group','question_key','question_label','option_label','tier','property_type','helper','info_tip'];
    const keys = [
      ...preferred.filter(k => allKeys.has(k)),
      ...Array.from(allKeys).filter(k => !preferred.includes(k)).sort()
    ];

    const formatCsvValue = (v) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
      if (typeof v === 'number') return String(v);
      const s = String(v);
      if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const rows = [keys.join(',')];
    for (const r of criteria) {
      const rowValues = keys.map((h) => formatCsvValue(r[h] ?? ''));
      rows.push(rowValues.join(','));
    }

    const csvContent = '\uFEFF' + rows.join('\r\n'); // BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `criteria_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEdit = (criteria) => {
    setEditingCriteria(criteria);
  };

  // Save handler: use insert for new records, update for edits.
  // Avoids relying on ON CONFLICT which requires a DB unique constraint.
  const handleSave = async (updatedCriteria, isNew, original) => {
      try {
        const sanitized = sanitizeRecord(updatedCriteria);
        if (isNew) {
          const { error } = await supabase
            .from('criteria_config_flat')
            .insert([sanitized]);
          if (error) throw error;
        } else {
          // Prefer id-based update when available
          if (sanitized.id) {
            const { error } = await supabase
              .from('criteria_config_flat')
              .update(sanitized)
              .eq('id', sanitized.id);
            if (error) throw error;
          } else {
            // Fallback: update using composite key fields
            const matchObj = original ? {
              criteria_set: original.criteria_set,
              product_scope: original.product_scope,
              question_key: original.question_key,
              option_label: original.option_label
            } : {
              criteria_set: sanitized.criteria_set,
              product_scope: sanitized.product_scope,
              question_key: sanitized.question_key,
              option_label: sanitized.option_label
            };
            const { error } = await supabase
              .from('criteria_config_flat')
              .update(sanitized)
              .match(matchObj);
            if (error) throw error;
          }
        }

      setEditingCriteria(null);
      fetchCriteria();
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleDelete = async (criteria) => {
    if (window.confirm('Are you sure you want to delete this criteria?')) {
      try {
        const { error } = await supabase
          .from('criteria_config_flat')
          .delete()
          .eq('criteria_set', criteria.criteria_set)
          .eq('product_scope', criteria.product_scope)
          .eq('question_key', criteria.question_key)
          .eq('option_label', criteria.option_label);

        if (error) throw error;
        fetchCriteria();
        setSelectedRows(new Set());
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length === 0) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please select at least one criteria to delete' });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected criteria?`)) {
      try {
        // Get the selected criteria objects
        const selectedCriteria = getCurrentPageCriteria().filter(c => selectedRows.has(getItemKey(c)));
        
        // Delete each selected criteria
        for (const criteria of selectedCriteria) {
          const { error } = await supabase
            .from('criteria_config_flat')
            .delete()
            .eq('criteria_set', criteria.criteria_set)
            .eq('product_scope', criteria.product_scope)
            .eq('question_key', criteria.question_key)
            .eq('option_label', criteria.option_label);
          
          if (error) throw error;
        }

        fetchCriteria();
        setSelectedRows(new Set());
        setSelectAll(false);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getItemKey = (item) => {
    return `${item.criteria_set}-${item.product_scope}-${item.question_key}-${item.option_label}`;
  };

  const handleAdd = () => {
    setEditingCriteria({
      id: null,
      criteria_set: '',
      product_scope: '',
      question_group: '',
      question_key: '',
      question_label: '',
      option_label: '',
      tier: '',
      property_type: '',
      helper: '',
      info_tip: '',
      display_order: ''
    });
  };

  const getCurrentPageCriteria = () => {
    // sort criteria client-side
    const sorted = [...criteria];
    if (sortField) {
      const compareValues = (a, b) => {
        if (a === undefined || a === null) return b === undefined || b === null ? 0 : 1;
        if (b === undefined || b === null) return -1;
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

  const changeSort = (field) => {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const totalPages = Math.ceil(criteria.length / itemsPerPage);

  // Build dynamic columns list from data, preferring a sensible order for common fields.
  // Exclude DB bookkeeping timestamps (created_at/updated_at) from UI and CSV.
  const allKeysSet = new Set();
  for (const r of criteria) Object.keys(r).forEach(k => allKeysSet.add(k));
  const preferred = ['display_order','criteria_set','product_scope','question_group','question_key','question_label','option_label','tier','property_type','helper','info_tip'];
  // (excluded is declared earlier) — bookkeeping and unique identifier fields are ignored
  const columns = [
    ...preferred.filter(k => allKeysSet.has(k) && !excluded.has(k)),
    ...Array.from(allKeysSet).filter(k => !preferred.includes(k) && !excluded.has(k)).sort()
  ];

  // Friendly labels for columns (display only). Keep keys unchanged for sorting/upsert logic.
  const columnLabels = {
    display_order: 'Display Order',
    criteria_set: 'Criteria Set',
    product_scope: 'Product Scope',
    question_group: 'Question Group',
    question_key: 'Question Key',
    question_label: 'Question Label',
    option_label: 'Option Label',
    tier: 'Tier',
    property_type: 'Property Type',
    helper: 'Helper',
    info_tip: 'Info Tip'
  };

  const humanize = (s) => {
    if (!s) return '';
    return s.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading criteria...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-box">
          <h3>Error Loading Criteria</h3>
          <p>{error}</p>
          <button className="slds-button slds-button_brand" onClick={fetchCriteria}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-container--table">
      <div className="table-header-stacked">
        <div className="table-title-row">
          <WelcomeHeader />
          <div className="table-actions-row">
            <button className="slds-button slds-button_brand" onClick={handleAdd}>
              Add New Criteria
            </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            style={{ display: 'none' }}
            id="criteria-csv-import"
          />
          <button className="slds-button slds-button_neutral" 
            onClick={() => document.getElementById('criteria-csv-import').click()}>
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
            <span className="total-count">Total: {criteria.length}</span>
          </div>
        </div>
      </div>

      {showImportPreview && importPreview && (
        <>
          <div className="slds-backdrop slds-backdrop_open" />
          <div className="slds-modal slds-fade-in-open">
            <div className="slds-modal__container">
              <div className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={cancelImport}
                  title="Close"
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Import Preview</h2>
              </div>
              <div className="slds-modal__content slds-p-around_medium">
                <div className="slds-m-bottom_small">
                  <strong>Headers (raw):</strong> {importPreview.headers.join(', ')}
                </div>
                <div className="slds-m-bottom_small">
                  <strong>Headers (will be imported):</strong> {importPreview.previewHeaders.join(', ')}
                </div>
                <div className="slds-m-bottom_small">
                  <div className="slds-text-color_weak">Note: <code>created_at</code>, <code>updated_at</code> and <code>id</code> will be ignored. <code>display_order</code> will be coerced to an integer or set to null if empty/invalid.</div>
                </div>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table className="professional-table">
                    <thead>
                      <tr>
                        {importPreview.previewHeaders.map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.sampleRows.map((row, ri) => (
                        <tr key={ri}>
                          {importPreview.previewHeaders.map((h, hi) => (
                            <td key={hi}>{row[h] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="slds-modal__footer">
                <button className="slds-button slds-button_neutral" onClick={cancelImport} disabled={importLoading}>Cancel</button>
                <button className="slds-button slds-button_brand" onClick={confirmImport} disabled={importLoading}>{importLoading ? 'Importing...' : 'Import'}</button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="filters-section">
        <div className="filter-field">
          <label>Criteria Set</label>
          <select
            value={filters.criteria_set}
            onChange={(e) => handleFilterChange('criteria_set', e.target.value)}
          >
            <option value="">All Sets</option>
            {Array.from(filterOptions.criteriaSets).sort().map(set => (
              <option key={set} value={set}>{set}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Product Scope</label>
          <select
            value={filters.product_scope}
            onChange={(e) => handleFilterChange('product_scope', e.target.value)}
          >
            <option value="">All Scopes</option>
            {Array.from(filterOptions.productScopes).sort().map(scope => (
              <option key={scope} value={scope}>{scope}</option>
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
            {(filters.criteria_set || filters.product_scope || filters.question_group) && (
              <button 
                className="slds-button slds-button_text-destructive" 
                onClick={() => setFilters({ criteria_set: '', product_scope: '', question_group: '' })}
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
            <label>Question Group</label>
            <select
              value={filters.question_group}
              onChange={(e) => handleFilterChange('question_group', e.target.value)}
            >
              <option value="">All Groups</option>
              {Array.from(filterOptions.questionGroups).sort().map(group => (
                <option key={group} value={group}>{group}</option>
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
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAll(checked);
                    const currentPageItems = getCurrentPageCriteria();
                    if (checked) {
                      setSelectedRows(new Set(currentPageItems.map(getItemKey)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                />
              </th>
              {columns.map((col) => (
                <th 
                  key={col} 
                  onClick={() => changeSort(col)} 
                  className={`sortable ${sortField === col ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                >
                  {columnLabels[col] || humanize(col)}
                </th>
              ))}
              <th className="sticky-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageCriteria().map((item) => {
              const itemKey = getItemKey(item);
              return (
                <tr key={itemKey}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(itemKey)}
                      onChange={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(itemKey)) {
                          newSelected.delete(itemKey);
                        } else {
                          newSelected.add(itemKey);
                        }
                        setSelectedRows(newSelected);
                        setSelectAll(
                          getCurrentPageCriteria().every(c => 
                            newSelected.has(getItemKey(c))
                          )
                        );
                      }}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col}>{(item[col] === null || item[col] === undefined) ? '' : String(item[col])}</td>
                  ))}
                  <td className="sticky-action">
                    <div className="row-actions">
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="slds-button slds-button_destructive"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {editingCriteria && (
        <CriteriaEditModal
          criteria={editingCriteria}
          onSave={handleSave}
          onCancel={() => setEditingCriteria(null)}
          isNew={!editingCriteria.criteria_set}
        />
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

export default CriteriaTable;