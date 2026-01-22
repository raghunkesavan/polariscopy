import { useState } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TotalsCard from '../components/dashboard/TotalsCard';
import VolumeChart from '../components/dashboard/VolumeChart';
import VolumeFilter from '../components/dashboard/VolumeFilter';
import ConstantsRow from '../components/dashboard/ConstantsRow';
import CanvasParameters from '../components/dashboard/CanvasParameters';
import CanvasDebug from '../components/debug/CanvasDebug';
import useDashboardData from '../hooks/useDashboardData';
import '../styles/Dashboard.css';

const HomePage = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [volumeFilter, setVolumeFilter] = useState('all');

  const { loading, error, totals, btlData, bridgingData } = useDashboardData(timeRange, volumeFilter);

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

        {/* Canvas Debug Info */}
        <CanvasDebug />

        {/* Canvas Parameters Section */}
        <CanvasParameters />

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
