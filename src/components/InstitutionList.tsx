import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@mui/material';
import { useFetchInstitutions, useAddInstitution,useDeleteInstitution } from '../queries/institutionQueries';
import '../App.css';

const InstitutionList: React.FC = () => {
  const { data: institutions, isLoading, isError } = useFetchInstitutions();
  const [quickFilterText, setQuickFilterText] = useState('');
  const deleteMutation = useDeleteInstitution();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this institution?')) {
      deleteMutation.mutate(id);
    }
  };

  const columnDefs = useMemo(
    () => [
      { headerName: 'סמל מוסד', field: 'institutionSymbol', sortable: true, filter: true },
      { headerName: 'קוד מוסד', field: 'institutionCode', sortable: true, filter: true },
      { headerName: 'שם מוסד', field: 'name', sortable: true, filter: true },
      { headerName: 'איש קשר', field: 'coordinator.name', sortable: true, filter: true },
      { headerName: 'טלפון', field: 'coordinator.phone', sortable: true, filter: true },
      { headerName: 'כתובת מייל', field: 'coordinator.email', sortable: true, filter: true },
      {
        headerName: 'פעולות',
        cellRendererFramework: (params: any) => (
          <div>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => alert(`Editing ${params.data.name}`)}
              style={{ marginRight: '8px' }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleDelete(params.data._id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: '100vh', marginLeft:"10%", marginRight:"10%" }}>
    {/* Quick Search */}
    <div style={{ marginBottom: '10px' }}>
      <input
        type="text"
        placeholder="Quick Search..."
        onChange={(e) => setQuickFilterText(e.target.value)}
        style={{
          width: '300px',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />
    </div>
  
    <div className="ag-theme-alpine rtl" style={{ height: 600, width: '100%', direction: 'rtl' }}>
      <AgGridReact
        rowData={institutions}
        columnDefs={columnDefs}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true,
        }}
        domLayout="autoHeight"
        modules={[ClientSideRowModelModule]}
        pagination={true}
        paginationPageSize={10}
        quickFilterText={quickFilterText}
        enableRtl={true}
      />
    </div>
  </div>
  );
};

export default InstitutionList;
