import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WelcomeHeader from '../shared/WelcomeHeader';
import SalesforceIcon from '../shared/SalesforceIcon';
import { API_BASE_URL } from '../../config/api';
import '../../styles/slds.css';
import '../../styles/admin-tables.css';

const DEFAULT_SET_KEYS = [
  'RATES_SPEC',
  'RATES_CORE',
  'Bridging_Var',
  'Bridging_Fix',
  'Fusion'
];

const PROPERTIES = ['All', 'Residential', 'Commercial', 'Semi-Commercial', 'Core'];

function Table({ columns, rows, emptyLabel }) {
  return (
    <div className="table-wrapper">
      <table className="professional-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-cell">{emptyLabel}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func
    })
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object),
  emptyLabel: PropTypes.string
};

export default function DataHealthReport() {
  const [setKey, setSetKey] = useState('RATES_SPEC');
  const [property, setProperty] = useState('Residential');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    exact: false,
    crossTier: true,
    anomalies: false,
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => {
      const willExpand = !prev[key];
      const collapsed = Object.keys(prev).reduce((acc, k) => { acc[k] = false; return acc; }, {});
      return { ...collapsed, [key]: willExpand };
    });
  };

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (setKey) params.set('set_key', setKey);
    if (property && property !== 'All') params.set('property', property);
    return params.toString();
  }, [setKey, property]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/admin/data-health?${queryString}`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to fetch data health');
      }
      const json = await res.json();
      setReport(json);
    } catch (e) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const stats = report?.stats;

  const exactColumns = [
    { key: 'property', label: 'Property' },
    { key: 'product', label: 'Product' },
    { key: 'fee', label: 'Fee' },
    { key: 'tier', label: 'Tier' },
    { key: 'rate', label: 'Rate' },
    { key: 'count', label: 'Count' },
    {
      key: 'sampleIds',
      label: 'Sample IDs',
      render: (v) => Array.isArray(v) ? v.join(', ') : ''
    }
  ];

  const crossTierColumns = [
    { key: 'property', label: 'Property' },
    { key: 'product', label: 'Product' },
    { key: 'fee', label: 'Fee' },
    {
      key: 'tiers',
      label: 'Tiers',
      render: (v) => Array.isArray(v) ? v.join(', ') : ''
    },
    { key: 'count', label: 'Count' },
    {
      key: 'sampleIds',
      label: 'Sample IDs',
      render: (v) => Array.isArray(v) ? v.join(', ') : ''
    }
  ];

  return (
    <div className="admin-table-container">
      <div className="table-header-stacked">
        <div className="table-title-row">
          <WelcomeHeader />
          <div className="table-actions-row">
            <div className="rows-per-page">
              <label htmlFor="setKey">Set Key</label>
              <select
                id="setKey"
                value={setKey}
                onChange={(e) => setSetKey(e.target.value)}
              >
                {DEFAULT_SET_KEYS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="rows-per-page">
              <label htmlFor="property">Property</label>
              <select
                id="property"
                value={property}
                onChange={(e) => setProperty(e.target.value)}
              >
                {PROPERTIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <button className="slds-button slds-button_brand" onClick={fetchReport} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading report…</div>
        </div>
      )}
      {error && (
        <div className="error-state">
          <div className="error-box">
            <h3>Error Loading Data Health</h3>
            <p>{error}</p>
            <button className="slds-button slds-button_brand" onClick={fetchReport}>Try Again</button>
          </div>
        </div>
      )}

      {stats && (
        <div className="filters-section filters-section--compact">
          <div className="filter-field">
            <label>Set Key</label>
            <div className="slds-text-body_regular">{stats.set_key}</div>
          </div>
          <div className="filter-field">
            <label>Property</label>
            <div className="slds-text-body_regular">{stats.property}</div>
          </div>
          <div className="filter-field">
            <label>Total Rows</label>
            <div className="slds-text-body_regular">{stats.totalRows}</div>
          </div>
          <div className="filter-field">
            <label>Exact Duplicates</label>
            <div className="slds-text-body_regular">{stats.exactDuplicateGroups}</div>
          </div>
          <div className="filter-field">
            <label>Cross-Tier Duplicates</label>
            <div className="slds-text-body_regular">{stats.crossTierDuplicateGroups}</div>
          </div>
          <div className="filter-field">
            <label>Non-numeric Fees</label>
            <div className="slds-text-body_regular">{stats.nonNumericFees}</div>
          </div>
          <div className="filter-field">
            <label>Missing max LTV</label>
            <div className="slds-text-body_regular">{stats.missingMaxLtv}</div>
          </div>
        </div>
      )}

      <div className="settings-accordion-section slds-m-bottom_large">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.exact ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('exact')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Exact Duplicates</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.exact}>
            <div className="table-wrapper section-body">
              <Table
                columns={exactColumns}
                rows={report?.exactDuplicates || []}
                emptyLabel="No exact duplicate groups found."
              />
            </div>
          </div>
        </section>
      </div>

      <div className="settings-accordion-section slds-m-bottom_large">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.crossTier ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('crossTier')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Cross-Tier Duplicates</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.crossTier}>
            <div className="table-wrapper section-body">
              <Table
                columns={crossTierColumns}
                rows={report?.crossTierDuplicates || []}
                emptyLabel="No cross-tier duplicate groups found."
              />
            </div>
          </div>
        </section>
      </div>

      <div className="settings-accordion-section">
        <section className="slds-accordion__section">
          <div 
            className={`slds-accordion__summary ${expandedSections.anomalies ? 'slds-is-open' : ''}`}
            onClick={() => toggleSection('anomalies')}
          >
            <h3 className="slds-accordion__summary-heading">
              <span className="slds-accordion__summary-content">Anomalies</span>
              <SalesforceIcon name="chevrondown" size="xx-small" className="slds-accordion__summary-action-icon" />
            </h3>
          </div>
          <div className="slds-accordion__content" hidden={!expandedSections.anomalies}>
            <div className="slds-grid slds-wrap slds-gutters section-body">
              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                <h4 className="slds-text-title_caps section-subtitle">Non-numeric Fees</h4>
                <Table
                  columns={[{ key: 'id', label: 'ID' }, { key: 'product', label: 'Product' }, { key: 'product_fee', label: 'Product Fee' }]}
                  rows={report?.anomalies?.nonNumericFees || []}
                  emptyLabel="No non-numeric fee anomalies."
                />
              </div>
              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                <h4 className="slds-text-title_caps section-subtitle">Missing max LTV</h4>
                <Table
                  columns={[{ key: 'id', label: 'ID' }, { key: 'product', label: 'Product' }, { key: 'max_ltv', label: 'Max LTV' }]}
                  rows={report?.anomalies?.missingMaxLtv || []}
                  emptyLabel="No missing max LTV anomalies."
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
