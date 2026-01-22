import React from 'react';

const TotalsCard = ({ label, value }) => {
  return (
    <div className="totals-card">
      <div className="totals-card-label">{label}</div>
      <div className="totals-card-value">{value}</div>
    </div>
  );
};

export default TotalsCard;
