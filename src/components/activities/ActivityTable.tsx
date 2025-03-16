import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Box, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AggregatedRow } from './activitiesUtils';

interface ActivityTableProps {
  filteredAggregatedData: AggregatedRow[];
  quickFilterText: string;
  setQuickFilterText: (value: string) => void;
  handleDeleteActivity: (activityIds: string[]) => void;
}

const ActivityTable: React.FC<ActivityTableProps> = ({
  filteredAggregatedData,
  quickFilterText,
  setQuickFilterText,
  handleDeleteActivity
}) => {
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<any[]>([]);

  const handleOpenDetails = (activities: any[]) => {
    setSelectedActivities(activities);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedActivities([]);
  };

  const handleDeleteSingleActivity = (activityId: string) => {
    handleDeleteActivity([activityId]);
    setSelectedActivities(prev => prev.filter(activity => activity._id !== activityId));
  };

  const columnDefs = useMemo(() => [
    { headerName: 'סמל קבוצה', field: 'groupSymbol', sortable: true, filter: true, width: 120 },
    { headerName: 'חודש', field: 'month', sortable: true, filter: true },
    { headerName: 'מפעיל', field: 'operator', sortable: true, filter: true },
    { headerName: 'סה"כ הפעלות', field: 'count', sortable: true, filter: true },
    { 
      headerName: 'פעולות', 
      field: 'actions',
      cellRenderer: (params: any) => {
        const activityIds = params.data.activities?.map((activity: any) => activity._id) || [];
        return (
          <div>
            <IconButton 
              onClick={() => handleOpenDetails(params.data.activities || [])} 
              color="primary"
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton 
              onClick={() => handleDeleteActivity(activityIds)} 
              color="error"
              disabled={activityIds.length === 0} >
              <DeleteIcon />
            </IconButton>
          </div>
        );
      } 
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
          defaultColDef={{
            flex: 1, 
            minWidth: 100, 
            resizable: true,
          }}
        />
      </div>

      <Dialog open={openDetails} onClose={handleCloseDetails} fullWidth>
        <DialogTitle>פרטי הפעלות</DialogTitle>
        <DialogContent>
          {selectedActivities.length > 0 ? (
            <List>
              {selectedActivities.map(activity => (
                <ListItem key={activity._id} sx={{ display: "flex", justifyContent: "space-between" }}>
                  <ListItemText 
                    primary={`תאריך: ${new Date(activity.date).toLocaleDateString('he-IL')}`}
                    secondary={`סמל קבוצה: ${typeof activity.classId === 'string' ? 'לא ידוע' : activity.classId.uniqueSymbol}`}
                  />
                  <IconButton 
                    onClick={() => handleDeleteSingleActivity(activity._id)} 
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>אין פעילויות להצגה.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="primary">סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivityTable;
