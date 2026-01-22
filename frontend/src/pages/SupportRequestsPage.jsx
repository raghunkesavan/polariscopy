import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import WelcomeHeader from '../components/shared/WelcomeHeader';
import '../styles/admin-tables.css';

/**
 * SupportRequestsPage - Admin view for managing support requests
 * Shows all support requests with filtering, status updates, and notification badge for unread
 */
const SupportRequestsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch support requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('limit', rowsPerPage);
      params.append('offset', (currentPage - 1) * rowsPerPage);
      if (filterStatus) params.append('status', filterStatus);
      if (filterRead) params.append('is_read', filterRead);

      const response = await fetch(`${API_BASE}/api/support?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch support requests');
      }

      const { data, total } = await response.json();
      setRequests(data || []);
      setTotalCount(total || 0);
    } catch (err) {
      console.error('Error fetching support requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, currentPage, rowsPerPage, filterStatus, filterRead]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/support/unread-count`);
      if (response.ok) {
        const { unreadCount: count } = await response.json();
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchRequests();
    fetchUnreadCount();
  }, [fetchRequests, fetchUnreadCount]);

  // Mark request as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      });

      if (response.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Update request status
  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_BASE}/api/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          resolved_by: status === 'resolved' ? user?.id : null
        })
      });

      if (response.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        showToast({
          kind: 'success',
          title: 'Status Updated',
          subtitle: `Request marked as ${status}`
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast({
        kind: 'error',
        title: 'Error',
        subtitle: 'Failed to update status'
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/support/mark-all-read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setRequests(prev => prev.map(r => ({ ...r, is_read: true })));
        setUnreadCount(0);
        showToast({
          kind: 'success',
          title: 'All Read',
          subtitle: 'All requests marked as read'
        });
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete request
  const deleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/support/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
        setTotalCount(prev => prev - 1);
        if (selectedRequest?.id === id) {
          setShowDetailPanel(false);
          setSelectedRequest(null);
        }
        showToast({
          kind: 'success',
          title: 'Deleted',
          subtitle: 'Support request deleted'
        });
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      showToast({
        kind: 'error',
        title: 'Error',
        subtitle: 'Failed to delete request'
      });
    }
  };

  // View request details
  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailPanel(true);
    if (!request.is_read) {
      markAsRead(request.id);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'slds-badge slds-badge_warning';
      case 'in_progress': return 'slds-badge slds-badge_info';
      case 'resolved': return 'slds-badge slds-badge_success';
      case 'closed': return 'slds-badge slds-badge_inverse';
      default: return 'slds-badge';
    }
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <div>
      <div className="page-container page-container--table">
        <div className="table-header-stacked">
          <div className="table-title-row">
            <div>
              <WelcomeHeader />
              {unreadCount > 0 && (
                <span 
                  className="slds-badge slds-badge_error slds-m-left_small"
                  style={{ fontSize: 'var(--token-font-size-xs)', verticalAlign: 'middle' }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="table-actions-row">
              {unreadCount > 0 && (
                <button 
                  className="slds-button slds-button_neutral"
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </button>
              )}
              <span className="total-count">Total: {totalCount}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-field">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="filter-field">
            <label>Read Status</label>
            <select value={filterRead} onChange={(e) => { setFilterRead(e.target.value); setCurrentPage(1); }}>
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading requests...</div>
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
            <div className="table-wrapper">
              <table className="professional-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th className="sortable">Date</th>
                  <th className="sortable">Name</th>
                  <th>Email</th>
                  <th>Bug Type</th>
                  <th>Status</th>
                  <th>Page</th>
                  <th style={{ width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--token-spacing-xl)' }}>
                      No support requests found
                    </td>
                  </tr>
                ) : (
                  requests.map(request => (
                    <tr 
                      key={request.id}
                      style={{ 
                        backgroundColor: !request.is_read ? 'rgba(1, 118, 211, 0.05)' : 'inherit',
                        fontWeight: !request.is_read ? '500' : 'normal'
                      }}
                    >
                      <td>
                        {!request.is_read && (
                          <span 
                            style={{ 
                              display: 'inline-block', 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--token-info)' 
                            }}
                            title="Unread"
                          />
                        )}
                      </td>
                      <td>{formatDate(request.created_at)}</td>
                      <td>{request.name}</td>
                      <td>
                        <a href={`mailto:${request.email}`}>{request.email}</a>
                      </td>
                      <td>{request.bug_type || '-'}</td>
                      <td>
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </td>
                      <td>{request.page || '-'}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="slds-button slds-button_neutral"
                            onClick={() => viewDetails(request)}
                          >
                            View
                          </button>
                          <select
                            className="slds-select"
                            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: 'var(--token-font-size-xs)' }}
                            value={request.status || 'pending'}
                            onChange={(e) => updateStatus(request.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
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
              <span className="pagination-info">Page {currentPage} of {totalPages || 1}</span>
              <button 
                className="slds-button slds-button_neutral"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
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
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedRequest && (
        <>
          <div className="slds-backdrop slds-backdrop_open" onClick={() => setShowDetailPanel(false)}></div>
          <section 
            className="slds-panel slds-panel_docked slds-panel_docked-right slds-is-open" 
            style={{ 
              width: '35rem', 
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              zIndex: 9001,
              backgroundColor: 'var(--token-color-white)'
            }}
          >
            <div className="slds-panel__header" style={{ height: '4rem', minHeight: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: 'var(--token-ui-background-subtle)', borderBottom: '1px solid var(--token-border-medium)' }}>
              <h2 className="slds-panel__header-title slds-text-heading_small slds-truncate" style={{ margin: 0, fontWeight: 700 }}>Support Request Details</h2>
              <button 
                className="slds-button slds-button_icon slds-button_icon-small" 
                onClick={() => setShowDetailPanel(false)}
                title="Close"
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
                <span className="slds-assistive-text">Close</span>
              </button>
            </div>
            <div className="slds-panel__body" style={{ padding: '1.5rem', overflowY: 'auto', height: 'calc(100vh - 8rem)' }}>
              <dl className="slds-dl_horizontal">
                <dt className="slds-dl_horizontal__label" style={{ fontWeight: 600 }}>From:</dt>
                <dd className="slds-dl_horizontal__detail slds-m-bottom_small">
                  {selectedRequest.name}<br />
                  <a href={`mailto:${selectedRequest.email}`}>{selectedRequest.email}</a>
                </dd>

                <dt className="slds-dl_horizontal__label" style={{ fontWeight: 600 }}>Submitted:</dt>
                <dd className="slds-dl_horizontal__detail slds-m-bottom_small">
                  {formatDate(selectedRequest.created_at)}
                </dd>

                <dt className="slds-dl_horizontal__label" style={{ fontWeight: 600 }}>Page:</dt>
                <dd className="slds-dl_horizontal__detail slds-m-bottom_small">
                  {selectedRequest.page || '-'}
                </dd>

                <dt className="slds-dl_horizontal__label" style={{ fontWeight: 600 }}>Bug Type:</dt>
                <dd className="slds-dl_horizontal__detail slds-m-bottom_small">
                  {selectedRequest.bug_type || 'Not specified'}
                </dd>

                <dt className="slds-dl_horizontal__label" style={{ fontWeight: 600 }}>Status:</dt>
                <dd className="slds-dl_horizontal__detail slds-m-bottom_medium">
                  <span className={getStatusBadgeClass(selectedRequest.status)}>
                    {selectedRequest.status?.replace('_', ' ') || 'pending'}
                  </span>
                </dd>
              </dl>

              <div className="slds-m-top_medium">
                <h3 className="slds-text-heading_small slds-m-bottom_small" style={{ fontWeight: 600 }}>
                  Suggestion / Description:
                </h3>
                <div 
                  style={{ 
                    backgroundColor: 'var(--token-ui-background-subtle)', 
                    padding: '1rem', 
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    minHeight: '100px'
                  }}
                >
                  {selectedRequest.suggestion || 'No description provided'}
                </div>
              </div>

              <div className="slds-m-top_large" style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="slds-button slds-button_brand"
                  onClick={() => window.location.href = `mailto:${selectedRequest.email}?subject=Re: Support Request`}
                >
                  Reply via Email
                </button>
                <button
                  className="slds-button slds-button_destructive"
                  onClick={() => deleteRequest(selectedRequest.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default SupportRequestsPage;
