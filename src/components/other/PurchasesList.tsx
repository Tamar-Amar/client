import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@mui/material';
import { useFetchAllPurchases } from '../../queries/purchaseQueries';
import { useFetchStores } from '../../queries/storeQueries';

const PurchaseList: React.FC = () => {
  const { data: purchases, isLoading, isError } = useFetchAllPurchases();

  const [quickFilterText, setQuickFilterText] = useState('');

  const columnDefs = useMemo(
    () => [
      { headerName: 'סמל כיתה', field: 'classId', sortable: true, filter: true },
      { headerName: 'חנות', field: 'storeName', sortable: true, filter: true },
      { headerName: 'מספר חשבונית', field: 'invoiceId', sortable: true, filter: true },
      { headerName: 'חודש רכש', field: 'purchaseDate', sortable: true, filter: true },
      { headerName: 'סכום רכישה (כולל מע"מ)', field: 'amount', sortable: true, filter: true },
      { headerName: 'ניצול בפועל', field: 'actualamount', sortable: true, filter: true },
      { headerName: 'תיאור', field: 'description', sortable: true, filter: true },
    ],
    []
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading purchases.</div>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: '100vh', marginLeft:"10%", marginRight:"10%" }}>
      <input
        type="text"
        placeholder="חיפוש מהיר"
        onChange={(e) => setQuickFilterText(e.target.value)}
        style={{ marginBottom: '10px', padding: '8px', width: '300px' }}
      />
      <div className="ag-theme-alpine rtl" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={purchases}
          columnDefs={columnDefs}
          modules={[ClientSideRowModelModule]}
          pagination={true}
          quickFilterText={quickFilterText}
          enableRtl={true}
        />
      </div>
    </div>
  );
};

export default PurchaseList;
