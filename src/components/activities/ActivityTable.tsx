import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Box, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { AggregatedRow } from './activitiesUtils'; // שימוש בטיפוס הנכון

interface ActivityTableProps {
  filteredAggregatedData: AggregatedRow[];
  quickFilterText: string;
  setQuickFilterText: (value: string) => void;
  handleDeleteActivity: (activityId: string) => void;
}

const ActivityTable: React.FC<ActivityTableProps> = ({
  filteredAggregatedData,
  quickFilterText,
  setQuickFilterText,
  handleDeleteActivity
}) => {
  const columnDefs = useMemo(() => [
    { headerName: 'חודש', field: 'month', sortable: true, filter: true },
    { headerName: 'מפעיל', field: 'operator', sortable: true, filter: true },
    { headerName: 'סה"כ הפעלות', field: 'count', sortable: true, filter: true },
    { headerName: 'פעולות', field: 'actions', 
      cellRenderer: (params: any) => (
        <IconButton onClick={() => handleDeleteActivity(params.data._id)} color="error">
          <DeleteIcon />
        </IconButton>
      ) 
    }
  ], []);

  return (
    <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2, mb: 2 }}>
      <TextField 
        placeholder="חיפוש מהיר" 
        value={quickFilterText} 
        onChange={(e) => setQuickFilterText(e.target.value)} 
        sx={{ mb: 2, width: 300 }} 
      />
      <div className="ag-theme-alpine rtl" style={{ height: 600, width: '100%' }}>
        <AgGridReact 
          rowData={filteredAggregatedData} 
          columnDefs={columnDefs} 
          pagination={true} 
          quickFilterText={quickFilterText} 
          enableRtl={true} 
        />
      </div>
    </Box>
  );
};

export default ActivityTable;
