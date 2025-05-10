import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useFetchAllInvoices } from '../../queries/invoiceQueries';

const InvoiceList: React.FC = () => {
  const { data: invoices, isLoading, isError } = useFetchAllInvoices();
  const [quickFilterText, setQuickFilterText] = useState('');

  const columnDefs = useMemo(
    () => [
      { headerName: 'מספר חשבונית', field: 'invoiceNumber', sortable: true, filter: true },
      { headerName: 'תאריך חשבונית', field: 'invoiceDate', sortable: true, filter: true },
      { headerName: 'סכום סופי', field: 'totalAmount', sortable: true, filter: true },
      { headerName: 'מעמ', field: 'typeVat', sortable: true, filter: true },
      { headerName: 'סטטוס', field: 'status', sortable: true, filter: true },
      { headerName: 'סוג חשבונית', field: 'type', sortable: true, filter: true },
    ],
    []
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading invoices.</div>;

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
          rowData={invoices}
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

export default InvoiceList;
