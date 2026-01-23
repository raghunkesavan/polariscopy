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
  const [canvasParams, setCanvasParams] = useState(null);

  const { loading, error, totals, btlData, bridgingData } = useDashboardData(timeRange, volumeFilter);

  // Listen for Canvas data
  useEffect(() => {
    const handleCanvasData = () => {
      if (window.canvasData && window.canvasData.parameters) {
        setCanvasParams(window.canvasData.parameters);
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

        {/* Canvas Parameters Display */}
        {canvasParams && (
          <div className="canvas-parameters-section" style={{
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: 'var(--token-layer-surface)',
            borderRadius: '4px',
            border: '1px solid var(--token-border-subtle)'
          }}>
            <h3 style={{ marginTop: 0 }}>Canvas Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong>Record ID:</strong> {canvasParams.recordId || 'N/A'}
              </div>
              <div>
                <strong>Action:</strong> {canvasParams.action || 'N/A'}
              </div>
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
