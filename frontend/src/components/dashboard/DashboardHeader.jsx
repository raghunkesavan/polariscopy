import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import WelcomeHeader from '../shared/WelcomeHeader';

const DashboardHeader = ({ timeRange, onTimeRangeChange }) => {
  const { user } = useAuth();

  return (
    <div className="dashboard-header">
      <WelcomeHeader className="dashboard-welcome" />

      <div className="time-range-toggle">
        <button
          className={`slds-button time-range-btn-left ${timeRange === 'week' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => onTimeRangeChange('week')}
        >
          Week
        </button>
        <button
          className={`slds-button time-range-btn-middle ${timeRange === 'month' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => onTimeRangeChange('month')}
        >
          Month
        </button>
        <button
          className={`slds-button time-range-btn-right ${timeRange === 'year' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => onTimeRangeChange('year')}
        >
          Year
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
