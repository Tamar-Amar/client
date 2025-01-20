import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@mui/material';
import { useFetchClasses, useDeleteClass } from '../queries/classQueries';
import { useFetchInstitutions } from '../queries/institutionQueries'; // קריאה למוסדות

const ClassList: React.FC = () => {
  const { data: classes, isLoading, isError } = useFetchClasses();
  const { data: institutions } = useFetchInstitutions(); // הבאת נתוני מוסדות
  const [quickFilterText, setQuickFilterText] = useState('');
  const deleteMutation = useDeleteClass();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      deleteMutation.mutate(id);
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'קוד מוסד',
        field: 'institutionId',
        sortable: true,
        filter: true,
        cellRendererFramework: (params: any) => {
          const institution = institutions?.find((inst: any) => inst._id === params.value);
          return institution ? institution.institutionCode : 'N/A';
        },
      },
      { headerName: 'סמל קבוצה', field: 'uniqueSymbol', sortable: true, filter: true },
      { headerName: 'שם', field: 'name', sortable: true, filter: true },
      { headerName: 'כתובת', field: 'address', sortable: true, filter: true },
      { headerName: 'סוג קבוצה', field: 'type', sortable: true, filter: true },
      { headerName: 'תקציב חודשי', field: 'monthlyBudget', sortable: true, filter: true },
      { headerName: 'חנות ניצול', field: 'chosenStore', sortable: true, filter: true },
      { headerName: 'בנים או בנות', field: 'gender', sortable: true, filter: true },
      { headerName: 'חינוך מיוחד', field: 'isSpecialEducation', sortable: true, filter: true, cellRenderer: (params: any) => (params.value ? 'כן' : 'לא') },
      {
        headerName: 'פעולות',
        cellRendererFramework: (params: any) => (
          <Button variant="outlined" color="secondary" onClick={() => handleDelete(params.data._id)}>
            מחיקה
          </Button>
        ),
      },
    ],
    [institutions]
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading classes.</div>;

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
          rowData={classes}
          columnDefs={columnDefs}
          modules={[ClientSideRowModelModule]}
          quickFilterText={quickFilterText}
          pagination={true}
          enableRtl={true}
        />
      </div>
    </div>
  );
};

export default ClassList;
