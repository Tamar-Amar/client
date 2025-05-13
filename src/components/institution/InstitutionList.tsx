// components/Institution/InstitutionList.tsx
import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchInstitutions, useDeleteInstitution } from '../../queries/institutionQueries';
import { useFetchClasses } from '../../queries/classQueries';
import EditInstitutionDialog from './EditInstitutionDialog';


const InstitutionList: React.FC = () => {
  const { data: institutions, isLoading, isError } = useFetchInstitutions();
  const { data: classes } = useFetchClasses();
  const [quickFilterText, setQuickFilterText] = useState('');
  const deleteMutation = useDeleteInstitution();
  const [selectedInstitution, setSelectedInstitution] = useState<any | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('האם את/ה בטוח/ה שברצונך למחוק את המוסד?')) {
      deleteMutation.mutate(id);
    }
  };

const columnDefs = useMemo(() => [
    { headerName: 'קוד מוסד', field: 'institutionCode', sortable: true, filter: true, width: 150 },
    { headerName: 'שם מוסד', field: 'name', sortable: true, filter: true, flex: 1, minWidth: 200 },
    {
      headerName: 'מספר קבוצות',
      valueGetter: (params: any) => {
        const institutionId = params.data._id;
        return classes ? classes.filter((cls: any) => cls.institutionId === institutionId).length : 0;
      },
      sortable: true,
      filter: true,
      width: 150
    },
    {
      headerName: 'פעולות',
      width: 120,
      cellRendererFramework: (params: any) => (
        <>
          <IconButton color="primary" onClick={() => setSelectedInstitution(params.data)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.data._id)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
], [classes]);


  if (isLoading) return <p>טוען מוסדות...</p>;
  if (isError) return <p style={{ color: 'red' }}>שגיאה בטעינת מוסדות.</p>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="חיפוש מהיר..."
          onChange={(e) => setQuickFilterText(e.target.value)}
          style={{
            width: '300px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div className="ag-theme-alpine rtl" 
          style={{ 
              height: 600, 
              width: '90%', 
              maxWidth: '1400px', 
              margin: '0 auto', 
              direction: 'rtl' 
          }}>

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
          pagination
          paginationPageSize={10}
          quickFilterText={quickFilterText}
          enableRtl
        />
      </div>

      {selectedInstitution && (
        <EditInstitutionDialog
          open={!!selectedInstitution}
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
        />
      )}
    </div>
  );
};

export default InstitutionList;
