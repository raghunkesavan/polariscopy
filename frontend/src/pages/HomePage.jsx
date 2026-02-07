import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TotalsCard from '../components/dashboard/TotalsCard';
import VolumeChart from '../components/dashboard/VolumeChart';
import VolumeFilter from '../components/dashboard/VolumeFilter';
import ConstantsRow from '../components/dashboard/ConstantsRow';
import useDashboardData from '../hooks/useDashboardData';
import '../styles/Dashboard.css';

const HomePage = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLastEcho = async () => {
      try {
         const baseUrl = 'https://polariscopy.onrender.com';
        //const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/salesforce/echo/last`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        const payload = data?.payload || {};
        const quoteTypeRaw =
          payload.quoteType ||
          payload.quote_type ||
          payload.calculator_type ||
          payload.calculatorType ||
          '';
        const quoteType = quoteTypeRaw.toString().toLowerCase();

        if (!isMounted || !quoteType) return;

        if (quoteType.includes('btl') || quoteType.includes('buy-to-let') || quoteType.includes('buy to let')) {
          navigate('/calculator/btl', { replace: true });
          return;
        }

        if (quoteType.includes('bridge') || quoteType.includes('bridging') || quoteType.includes('fusion')) {
          navigate('/calculator/bridging', { replace: true });
        }
      } catch (err) {
        // Ignore auto-redirect errors
      }
    };

    fetchLastEcho();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate]);

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

        {/* Canvas Parameters Display - Prominent recordId and action */}
        {canvasData && canvasData.isAvailable && canvasData.parameters && (
          <div className="canvas-info-section" style={{
            padding: '16px',
            marginBottom: '20px',
            backgroundColor: '#0066cc',
            borderRadius: '4px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {canvasData.parameters.recordId && (
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', color: 'white' }}>Record ID</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: 'white' }}>
                    {canvasData.parameters.recordId}
                  </div>
                </div>
              )}
              {canvasData.parameters.action && (
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', color: 'white' }}>Action</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                    {canvasData.parameters.action}
                  </div>
                </div>
              )}
              {/* Show other parameters inline */}
              {Object.entries(canvasData.parameters)
                .filter(([key]) => key !== 'recordId' && key !== 'action')
                .map(([key, value]) => (
                  <div key={key} style={{ fontSize: '14px', color: 'white' }}>
                    <strong>{key}:</strong> {String(value) || 'N/A'}
                  </div>
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
