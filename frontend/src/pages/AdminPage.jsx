import React from 'react';
import Constants from '../components/admin/Constants';
import CriteriaTable from '../components/admin/CriteriaTable';
import RatesTable from '../components/admin/RatesTable';
import BridgeFusionRates from '../components/admin/BridgeFusionRates';
import GlobalSettings from '../components/admin/GlobalSettings';
import UWRequirementsAdmin from '../components/admin/UWRequirementsAdmin';
import DataHealthReport from '../components/admin/DataHealthReport';

const AdminPage = ({ tab = 'constants' }) => {
  return (
    <div className="padding-0">
      {tab === 'constants' && (
        <div>
          <Constants />
        </div>
      )}
      
      {tab === 'criteria' && (
        <div>
          <CriteriaTable />
        </div>
      )}
      
      {tab === 'btlRates' && (
        <div>
          <RatesTable />
        </div>
      )}
      
      {tab === 'bridgingRates' && (
        <div>
          <BridgeFusionRates />
        </div>
      )}
      
      {tab === 'globalSettings' && (
        <div>
         <GlobalSettings />
        </div>
      )}
      
      {tab === 'uwRequirements' && (
        <div>
          <UWRequirementsAdmin />
        </div>
      )}

      {tab === 'dataHealth' && (
        <div>
          <DataHealthReport />
        </div>
      )}
    </div>
  );
};

export default AdminPage;
