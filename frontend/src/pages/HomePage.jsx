import { useState, useEffect } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TotalsCard from '../components/dashboard/TotalsCard';
import VolumeChart from '../components/dashboard/VolumeChart';
import VolumeFilter from '../components/dashboard/VolumeFilter';
import ConstantsRow from '../components/dashboard/ConstantsRow';
import useDashboardData from '../hooks/useDashboardData';
import '../styles/Dashboard.css';

const HomePage = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [canvasData, setCanvasData] = useState(null);

  const { loading, error, totals, btlData, bridgingData } = useDashboardData(timeRange, volumeFilter);

  // Listen for Canvas data
  useEffect(() => {
    const handleCanvasData = () => {
      if (window.canvasData && window.canvasData.isAvailable) {
        setCanvasData(window.canvasData);
      }
    };

    // Check if data already exists
    handleCanvasData();

    // Listen for future updates
    window.addEventListener('canvasDataReady', handleCanvasData);
    return () => window.removeEventListener('canvasDataReady', handleCanvasData);
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner" />
          <div className="dashboard-loading-text">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="dashboard-error">
          <strong>Error loading dashboard:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-content">
        {/* Header with time range toggle */}
        <DashboardHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

        {/* Canvas Parameters Display - Above Dashboard */}
        {canvasData && canvasData.isAvailable && (
          <div className="canvas-info-section" style={{
            padding: '16px',
            marginBottom: '20px',
            backgroundColor: '#e8f4f8',
            borderRadius: '4px',
            border: '2px solid #0066cc'
          }}>
            <h2 style={{ marginTop: 0, color: '#0066cc' }}>📱 Salesforce Canvas App Connected</h2>
            
            {/* Canvas Parameters */}
            {canvasData.parameters && Object.keys(canvasData.parameters).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '8px' }}>Canvas Parameters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {Object.entries(canvasData.parameters).map(([key, value]) => (
                    <div key={key} style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                      <strong>{key}:</strong> {String(value) || 'N/A'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Info */}
            {canvasData.user && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '8px' }}>👤 User Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    <strong>Username:</strong> {canvasData.user.userName || 'N/A'}
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    <strong>Full Name:</strong> {canvasData.user.fullName || 'N/A'}
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    <strong>Email:</strong> {canvasData.user.email || 'N/A'}
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    <strong>User ID:</strong> {canvasData.user.userId || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Organization Info */}
            {canvasData.organization && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '8px' }}>🏢 Organization Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    <strong>Org Name:</strong> {canvasData.organization.name || 'N/A'}
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    <strong>Org ID:</strong> {canvasData.organization.organizationId || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Debug Logs */}
            {canvasData.extractionLog && canvasData.extractionLog.length > 0 && (
              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📋 Canvas Extraction Logs</summary>
                <pre style={{
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  marginTop: '8px'
                }}>
                  {canvasData.extractionLog.map((log, idx) => (
                    <div key={idx}>[{log.time}] {log.message}</div>
                  ))}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Totals Section */}
        <div className="totals-section">
          <h4 className="totals-title">Totals</h4>
          <div className="totals-grid">
            <TotalsCard label="Quotes issued" value={totals.totalQuotes} />
            <TotalsCard label="DIPs issued" value={totals.totalDIPs} />
          </div>
        </div>

        {/* Volumes Section */}
        <div className="volume-section">
          <div className="volume-header">
            <h4 className="volume-title">Volumes</h4>
            <VolumeFilter value={volumeFilter} onChange={setVolumeFilter} />
          </div>

          <div className="volume-charts-grid">
            <VolumeChart
              title="Buy to Let"
              total={btlData.total}
              data={btlData.data}
              type="btl"
            />
            <VolumeChart
              title="Bridging"
              total={bridgingData.total}
              data={bridgingData.data}
              type="bridging"
            />
          </div>
        </div>

        {/* Constants Section */}
        <ConstantsRow />
      </div>
    </div>
  );
};

export default HomePage;
