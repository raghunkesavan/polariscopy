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

        {/* Canvas Parameters Display - Minimal */}
        {canvasData && canvasData.isAvailable && canvasData.parameters && Object.keys(canvasData.parameters).length > 0 && (
          <div className="canvas-info-section" style={{
            padding: '12px 16px',
            marginBottom: '20px',
            backgroundColor: '#e8f4f8',
            borderRadius: '4px',
            border: '1px solid #0066cc'
          }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: '#0066cc' }}>📱 Canvas:</span>
              {Object.entries(canvasData.parameters).map(([key, value]) => (
                <span key={key} style={{ fontSize: '14px' }}>
                  <strong>{key}:</strong> <code>{String(value) || 'N/A'}</code>
                </span>
              ))}
            </div>
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
