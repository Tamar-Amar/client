import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button, CircularProgress, Typography } from '@mui/material';
import { useFetchActivities, useAddActivity } from '../../queries/activitiesQueries';
import { Activity } from '../../types';
import AddActivity from './ActvitiesCreate';

const ActivitiesList: React.FC = () => {
  const { data: activities = [], isLoading, isError } = useFetchActivities();
  console.log("Fetched activities:", activities);

  const addActivityMutation = useAddActivity();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');

  const handleAddClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleActivityAdded = async (newActivities: Activity[]) => {
    for (const activity of newActivities) {
      await addActivityMutation.mutateAsync(activity);
    }
    setIsDialogOpen(false);
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'תאריך',
        field: 'date',
        sortable: true,
        filter: true,
        valueFormatter: (params: any) =>
          new Date(params.value).toLocaleDateString('he-IL'),
      },
      {
        headerName: 'שם מפעיל',
        field: 'operatorId',
        sortable: true,
        filter: true,
        valueGetter: (params: any) =>
          typeof params.data.operatorId === 'string'
            ? 'לא ידוע'
            : `${params.data.operatorId.firstName} ${params.data.operatorId.lastName}`,
      },
      {
        headerName: 'שם קבוצה',
        field: 'classId',
        sortable: true,
        filter: true,
        valueGetter: (params: any) =>
          typeof params.data.classId === 'string'
            ? 'לא ידוע'
            : params.data.classId.name,
      },
      {
        headerName: 'סמל קבוצה',
        field: 'classId',
        sortable: true,
        filter: true,
        valueGetter: (params: any) =>
          typeof params.data.classId === 'string'
            ? 'לא ידוע'
            : params.data.classId.uniqueSymbol,
      },
      {
        headerName: 'תיאור',
        field: 'description',
        sortable: true,
        filter: true,
      },
    ],
    []
  );

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">שגיאה בטעינת הפעילויות.</Typography>;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        minHeight: '100vh',
        marginLeft: '10%',
        marginRight: '10%',
      }}
    >
      <Typography variant="h4" gutterBottom>
        רשימת פעילויות
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddClick} style={{ marginBottom: '10px' }}>
        הוסף פעילות חדשה
      </Button>
      <input
        type="text"
        placeholder="חיפוש מהיר"
        onChange={(e) => setQuickFilterText(e.target.value)}
        style={{
          marginBottom: '10px',
          padding: '8px',
          width: '300px',
          borderRadius: '5px',
          border: '1px solid #ccc',
        }}
      />
      <div className="ag-theme-alpine rtl" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={activities}
          columnDefs={columnDefs}
          modules={[ClientSideRowModelModule]}
          pagination={true}
          quickFilterText={quickFilterText}
          enableRtl={true}
        />
      </div>
      <AddActivity open={isDialogOpen} onClose={handleDialogClose} onAdd={handleActivityAdded}  />
    </div>
  );
};

export default ActivitiesList;
