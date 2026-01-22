import React from 'react';

const VolumeFilter = ({ value, onChange }) => {
  return (
    <select
      className="volume-filter-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="all">All Quotes</option>
      <option value="quotes">Quotes Only</option>
      <option value="dips">DIPs Only</option>
    </select>
  );
};

export default VolumeFilter;
