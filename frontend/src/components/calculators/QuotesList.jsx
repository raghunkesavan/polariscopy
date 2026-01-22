import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listQuotes, getQuote, deleteQuote } from '../../utils/quotes';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import SalesforceIcon from '../shared/SalesforceIcon';
import WelcomeHeader from '../shared/WelcomeHeader';
import NotificationModal from '../modals/NotificationModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import '../../styles/admin-tables.css';

export default function QuotesList({ calculatorType = null, onLoad = null }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const rowsPerPage = 10;

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterRef, setFilterRef] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBorrowerType, setFilterBorrowerType] = useState('');
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [showMyQuotesOnly, setShowMyQuotesOnly] = useState(false);
  
  // Advanced filters toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Get current user from auth context
  const { user } = useAuth();
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  
  // Confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, quoteId: null });
  
  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listQuotes({ calculator_type: calculatorType });
      setQuotes(res.quotes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetch(); 
    setCurrentPage(1); // Reset to first page when filter changes
  }, [calculatorType]);

  const navigate = useNavigate();

  const handleLoad = async (id) => {
    try {
      const res = await getQuote(id);
      const q = res.quote;
      if (onLoad) {
        onLoad(q);
        return;
      }
      // Default behavior: navigate to the specific calculator route (BTL or Bridging)
      // and pass the loaded quote in location state so the calculator auto-opens.
      const type = (q.calculator_type || '').toString().toLowerCase();
      let target = '/calculator/btl';
      if (type.includes('bridg') || type.includes('bridge') || type.includes('bridging')) {
        target = '/calculator/bridging';
      } else if (type.includes('btl')) {
        target = '/calculator/btl';
      }
      navigate(target, { state: { loadQuote: q } });
    } catch (e) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to load quote: ' + e.message });
    }
  };

  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, quoteId: id });
  };
  
  const confirmDelete = async () => {
    const id = deleteConfirm.quoteId;
    try {
      await deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Delete failed: ' + e.message });
    }
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (calculatorType) {
        params.append('calculator_type', calculatorType);
      }
      
      const url = `${API_BASE_URL}/api/export/quotes${params.toString() ? '?' + params.toString() : ''}`;
      
      // Use XMLHttpRequest instead of fetch to avoid potential hooks
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // Add authentication token
        const token = localStorage.getItem('auth_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result.data || []);
            } catch (e) {
              reject(new Error('Failed to parse response: ' + e.message));
            }
          } else {
            reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error. Make sure backend is running on port 3001.'));
        };
        
        xhr.send();
      });
      
      if (data.length === 0) {
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'No Data', 
          message: 'No quotes found to export' 
        });
        return;
      }
      
      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => {
        return headers.map(header => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle strings with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      });
      
      const csv = [csvHeaders, ...csvRows].join('\n');
      
      // Create download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `quotes_export_${calculatorType || 'all'}_${timestamp}.csv`;
      
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      setNotification({ 
        show: true, 
        type: 'success', 
        title: 'Success', 
        message: `Exported ${data.length} rows to ${filename}` 
      });
    } catch (e) {
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Export Error', 
        message: e.message || 'Failed to export quotes' 
      });
    } finally {
      setExporting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(quotes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentQuotes = quotes.slice(startIndex, endIndex);

  // Apply filters
  const filteredQuotes = quotes.filter(q => {
    // My Quotes Only filter - check both created_by_id and user_id
    if (showMyQuotesOnly && user) {
      const matchesCreatedById = q.created_by_id === user.id;
      const matchesUserId = q.user_id === user.id;
      if (!matchesCreatedById && !matchesUserId) {
        return false;
      }
    }
    
    // Ref # filter
    if (filterRef) {
      const ref = (q.reference_number || '').toString().toLowerCase();
      if (!ref.includes(filterRef.toLowerCase())) return false;
    }
    // Name filter
    if (filterName && !q.name.toLowerCase().includes(filterName.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType && q.calculator_type !== filterType) {
      return false;
    }

    // Applicant Type filter
    if (filterBorrowerType && q.applicant_type !== filterBorrowerType) {
      return false;
    }

    // Created date filter
    if (filterCreatedFrom || filterCreatedTo) {
      const createdDate = new Date(q.created_at);
      if (filterCreatedFrom) {
        const fromDate = new Date(filterCreatedFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (createdDate < fromDate) return false;
      }
      if (filterCreatedTo) {
        const toDate = new Date(filterCreatedTo);
        toDate.setHours(23, 59, 59, 999);
        if (createdDate > toDate) return false;
      }
    }

    // Updated date filter
    if (filterUpdatedFrom || filterUpdatedTo) {
      if (!q.updated_at) return false; // Skip quotes that have never been updated
      const updatedDate = new Date(q.updated_at);
      if (filterUpdatedFrom) {
        const fromDate = new Date(filterUpdatedFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (updatedDate < fromDate) return false;
      }
      if (filterUpdatedTo) {
        const toDate = new Date(filterUpdatedTo);
        toDate.setHours(23, 59, 59, 999);
        if (updatedDate > toDate) return false;
      }
    }

    return true;
  });
  
  // Apply sorting
  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';
    
    // Convert dates to timestamps for comparison
    if (sortField === 'created_at' || sortField === 'updated_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    // String comparison (case-insensitive)
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Apply pagination to sorted results
  const totalFilteredPages = Math.ceil(sortedQuotes.length / rowsPerPage);
  const filteredStartIndex = (currentPage - 1) * rowsPerPage;
  const filteredEndIndex = filteredStartIndex + rowsPerPage;
  const paginatedQuotes = sortedQuotes.slice(filteredStartIndex, filteredEndIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRef, filterName, filterType, filterBorrowerType, filterCreatedFrom, filterCreatedTo, filterUpdatedFrom, filterUpdatedTo, showMyQuotesOnly]);

  return (
    <div className="admin-table-container">
        <div className="table-header-stacked">
          <div className="table-title-row">
            <WelcomeHeader />
            <div className="table-actions-row">
              <button 
                className="slds-button slds-button_brand" 
                onClick={handleExport}
                disabled={exporting || loading}
              >
                {exporting ? 'Exporting...' : 'Export to CSV'}
              </button>
              <span className="total-count">Total: {sortedQuotes.length}</span>
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading quotes...</div>
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <div className="error-box">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {!loading && !error && (
          <>
            <div className="filters-section">
              {/* Primary filters row */}
              <div className="filter-field" style={{ minWidth: '140px' }}>
                <label>REF #</label>
                <input 
                  type="text"
                  placeholder="Search by ref..."
                  value={filterRef}
                  onChange={(e) => setFilterRef(e.target.value)}
                  style={{ padding: '0.625rem 0.875rem', border: '1px solid var(--token-border-medium)', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
              <div className="filter-field" style={{ minWidth: '180px' }}>
                <label>NAME</label>
                <input 
                  type="text"
                  placeholder="Search by name..."
                  value={filterName} 
                  onChange={(e) => setFilterName(e.target.value)}
                  style={{ padding: '0.625rem 0.875rem', border: '1px solid var(--token-border-medium)', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>

              <div className="filter-field">
                <label>Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="BTL">BTL</option>
                  <option value="BRIDGING">BRIDGING</option>
                </select>
              </div>

              <div className="filter-field">
                <label>Applicant Type</label>
                <select value={filterBorrowerType} onChange={(e) => setFilterBorrowerType(e.target.value)}>
                  <option value="">All</option>
                  <option value="Personal">Personal</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>

              <div className="filter-field">
                <label style={{ visibility: 'hidden' }}>Actions</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className={`slds-button ${showMyQuotesOnly ? 'slds-button_brand' : 'slds-button_neutral'}`}
                    onClick={() => setShowMyQuotesOnly(!showMyQuotesOnly)}
                    title="Show only quotes created by you"
                  >
                    {showMyQuotesOnly ? '✓ My Quotes' : 'My Quotes'}
                  </button>
                  <button 
                    className="slds-button slds-button_neutral" 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
                  </button>
                  {(filterName || filterRef || filterType || filterBorrowerType || filterCreatedFrom || filterCreatedTo || filterUpdatedFrom || filterUpdatedTo || showMyQuotesOnly) && (
                    <button 
                      className="slds-button slds-button_text-destructive" 
                      onClick={() => {
                        setFilterName('');
                        setFilterRef('');
                        setFilterType('');
                        setFilterBorrowerType('');
                        setFilterCreatedFrom('');
                        setFilterCreatedTo('');
                        setFilterUpdatedFrom('');
                        setFilterUpdatedTo('');
                        setShowMyQuotesOnly(false);
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showAdvancedFilters && (
              <div className="filters-section filters-advanced">
                <div className="filter-field-group">
                  <label className="filter-group-label">CREATED</label>
                  <div className="filter-date-range">
                    <input 
                      type="date" 
                      value={filterCreatedFrom} 
                      onChange={(e) => setFilterCreatedFrom(e.target.value)}
                      title="Created from"
                    />
                    <span className="date-separator">to</span>
                    <input 
                      type="date" 
                      value={filterCreatedTo} 
                      onChange={(e) => setFilterCreatedTo(e.target.value)}
                      title="Created to"
                    />
                  </div>
                </div>

                <div className="filter-field-group">
                  <label className="filter-group-label">UPDATED</label>
                  <div className="filter-date-range">
                    <input 
                      type="date" 
                      value={filterUpdatedFrom} 
                      onChange={(e) => setFilterUpdatedFrom(e.target.value)}
                      title="Updated from"
                    />
                    <span className="date-separator">to</span>
                    <input 
                      type="date" 
                      value={filterUpdatedTo} 
                      onChange={(e) => setFilterUpdatedTo(e.target.value)}
                      title="Updated to"
                    />
                  </div>
                </div>
              </div>
            )}

        <div className="table-wrapper">
          <table className="professional-table">
            <thead>
              <tr>
                <th 
                  className={`sortable ${sortField === 'reference_number' ? (sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                  onClick={() => handleSort('reference_number')}
                  title="Sort by Reference Number"
                >
                  Ref #
                </th>
                <th 
                  className={`sortable ${sortField === 'name' ? (sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                  onClick={() => handleSort('name')}
                  title="Sort by Quote Name"
                >
                  Quote Name
                </th>
                <th 
                  className={`sortable ${sortField === 'calculator_type' ? (sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                  onClick={() => handleSort('calculator_type')}
                  title="Sort by Type"
                >
                  Type
                </th>
                <th>Status</th>
                <th 
                  className={`sortable ${sortField === 'applicant_type' ? (sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                  onClick={() => handleSort('applicant_type')}
                  title="Sort by Applicant Type"
                >
                  Applicant Type
                </th>
                <th>Applicant/Company</th>
                <th>Created By</th>
                <th 
                  className={`sortable ${sortField === 'created_at' ? (sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                  onClick={() => handleSort('created_at')}
                  title="Sort by Created Date"
                >
                  Created
                </th>
                <th>Updated By</th>
                <th 
                  className={`sortable ${sortField === 'updated_at' ? (sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                  onClick={() => handleSort('updated_at')}
                  title="Sort by Updated Date"
                >
                  Updated
                </th>
                <th>DIP Issued</th>
                <th className="sticky-action">Actions</th>
              </tr>
            </thead>
          <tbody>
            {paginatedQuotes.length === 0 ? (
              <tr>
                <td colSpan="11">
                  <div className="quotes-empty-state">
                    <div className="quotes-empty-state__icon">📋</div>
                    <div className="quotes-empty-state__title">
                      {sortedQuotes.length === 0 && quotes.length === 0 
                        ? 'No quotes yet' 
                        : 'No quotes match your filters'}
                    </div>
                    <div className="quotes-empty-state__message">
                      {sortedQuotes.length === 0 && quotes.length === 0 
                        ? 'Create your first quote using the calculator to get started.'
                        : 'Try adjusting your filters to see more results.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedQuotes.map(q => {
              // Determine status badge
              const dipStatus = q.dip_status || 'Not Issued';
              const quoteStatus = q.quote_status || 'Not Issued';
              
              // Choose the most relevant status to display
              // Priority: DIP status > Quote status (DIP is more advanced stage)
              let statusText = 'Draft';
              let statusClass = 'slds-badge_default';
              
              if (dipStatus === 'Issued') {
                statusText = 'DIP Issued';
                statusClass = 'slds-theme_info';
              } else if (dipStatus === 'Expired') {
                statusText = 'DIP Expired';
                statusClass = 'slds-theme_warning';
              } else if (quoteStatus === 'Issued') {
                statusText = 'Quote Issued';
                statusClass = 'slds-theme_success';
              }

              return (
              <tr key={q.id}>
                <td><strong>{q.reference_number || 'N/A'}</strong></td>
                <td>{q.name}</td>
                <td>{q.calculator_type}</td>
                <td>
                  <span className={`slds-badge ${statusClass}`}>
                    {statusText}
                  </span>
                </td>
                <td>{q.applicant_type || '—'}</td>
                <td>{q.applicant_type === 'Corporate' ? q.company_name : q.borrower_name || '—'}</td>
                <td>
                  <span title={q.created_by_id ? `User ID: ${q.created_by_id}` : 'No user info'}>
                    {q.created_by || '—'}
                  </span>
                </td>
                <td>{new Date(q.created_at).toLocaleString()}</td>
                <td>
                  <span title={q.updated_by_id ? `User ID: ${q.updated_by_id}` : 'No user info'}>
                    {q.updated_by || '—'}
                  </span>
                </td>
                <td>{q.updated_at ? new Date(q.updated_at).toLocaleString() : '—'}</td>
                <td>{q.dip_issued_at ? new Date(q.dip_issued_at).toLocaleString() : '—'}</td>
                <td className="sticky-action">
                  <div className="row-actions">
                    <button className="slds-button slds-button_neutral" onClick={() => handleLoad(q.id)}>Load</button>
                    <button className="slds-button slds-button_destructive" onClick={() => handleDelete(q.id)}>Delete</button>
                  </div>
                </td>
              </tr>
              );
            })
            )}
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
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
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
      
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, quoteId: null })}
        onConfirm={confirmDelete}
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="slds-button_destructive"
      />
    </div>
  );
}
