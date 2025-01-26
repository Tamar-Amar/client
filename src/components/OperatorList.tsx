import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@mui/material';
import { useFetchOperators, useDeleteOperator } from '../queries/operatorQueries';

const OperatorList: React.FC = () => {
  const { data: operators, isLoading, isError } = useFetchOperators();
  const [quickFilterText, setQuickFilterText] = useState('');
  const deleteMutation = useDeleteOperator();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      deleteMutation.mutate(id);
    }
  };

  const columnDefs = useMemo(
    () => [
      {headerName: 'מספר ת"ז', field: 'id', sortable: true, filter: true  },
      { headerName: 'שם פרטי', field: 'firstName', sortable: true, filter: true },
      { headerName: 'שם משפחה', field: 'lastName', sortable: true, filter: true },
      { headerName: 'כתובת מגורים', field: 'address', sortable: true, filter: true },
      { headerName: 'טלפון', field: 'phone', sortable: true, filter: true },
      { headerName: 'תיאור', field: 'description', sortable: true, filter: true },
      { headerName: 'סטטוס', field:'status', sortable: true, filter: true},
      { headerName: 'סיסמא', field: 'password', sortable: true, filter: true },
      { headerName: 'כתובת אימייל', field: 'email', sortable: true, filter: true },
      {headerName: 'תאריך הרשמה', field: 'signDate', sortable: true, filter: true },
      {
        headerName: 'פעולות',
        cellRendererFramework: (params: any) => (
          <Button variant="outlined" color="secondary" onClick={() => handleDelete(params.data._id)}>
            מחיקה
          </Button>
        ),
      },
    ],
    []
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading operators.</div>;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      marginLeft:"10%", 
      marginRight:"10%" }}>
      <input
        type="text"
        placeholder="חיפוש מהיר"
        onChange={(e) => setQuickFilterText(e.target.value)}
        style={{ 
          marginBottom: '10px', 
          padding: '8px', 
          width: '300px',
          borderRadius: '5px',
          border: '1px solid #ccc',}}
      />
      <div className="ag-theme-alpine rtl" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={operators}
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

export default OperatorList;
