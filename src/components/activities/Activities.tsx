import React, { useMemo, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Grid, TextField, Snackbar, Alert } from '@mui/material';
import { useFetchActivities, useAddActivity, useDeleteActivity } from '../../queries/activitiesQueries';
import { Activity } from '../../types';
import { getAggregatedData, filterAggregatedData, getDetailInfo, AggregatedRow, DetailInfo } from './activitiesUtils';
import Filters from './Filters';
import ActivityTable from './ActivityTable';
import ActivityDetails from './ActivityDetails';
import AddActivity from './ActvitiesCreate';
import GeneralStats from './GeneralStats';

const Activities: React.FC = () => {
  const { data: activities = [], isLoading, isError } = useFetchActivities();
  const { mutation: addActivityMutation, errorMessage, setErrorMessage } = useAddActivity();
  const deleteActivityMutation = useDeleteActivity();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterOperator, setFilterOperator] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [detailMonth, setDetailMonth] = useState('');
  const [attendanceMonth, setAttendanceMonth] = useState<string>("");

  const handleAddClick = () => setIsDialogOpen(true);
  const handleDialogClose = () => setIsDialogOpen(false);


  const handleActivityAdded = async (newActivities: Activity[]) => {
    for (const activity of newActivities) {
      await addActivityMutation.mutateAsync(activity);
    }
    setIsDialogOpen(false);
  };

  

  const handleDeleteActivity = (activityIds: string[]) => {
    activityIds.forEach(activityId => {
      deleteActivityMutation.mutate(activityId);
    });
  };

  const downloadAttendanceReport = async () => {
    if (!attendanceMonth) return;

    const response = await fetch("http://localhost:5000/api/generate-pdf", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month: attendanceMonth }),
    });

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `דוח_נוכחות_${attendanceMonth}.pdf`;
    link.click();
  };

  const aggregatedData: AggregatedRow[] = useMemo(() => getAggregatedData(activities), [activities]);
  const filteredAggregatedData: AggregatedRow[] = useMemo(
    () => filterAggregatedData(aggregatedData, filterMonth, filterOperator, filterGroup),
    [aggregatedData, filterMonth, filterOperator, filterGroup]
  );

  const detailInfo: DetailInfo | null = useMemo(() => {
    return getDetailInfo(aggregatedData, filterOperator, filterGroup);
  }, [aggregatedData, filterOperator, filterGroup]);

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">שגיאה בטעינת הפעילויות.</Typography>;

  return (
    <Box sx={{ m: 6 }}>
      <Typography variant="h4" gutterBottom>סיכום פעילויות</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" color="primary" onClick={handleAddClick}>
          הוסף פעילות חדשה
        </Button>

        <TextField
          label="בחר חודש לדוח נוכחות"
          type="month"
          value={attendanceMonth}
          onChange={(e) => setAttendanceMonth(e.target.value)}
          sx={{ width: '200px' }}
          InputLabelProps={{ shrink: true }}
        />

        <Button
          variant="contained"
          color="secondary"
          onClick={downloadAttendanceReport}
          disabled={!attendanceMonth}
        >
          הורד דוח נוכחות (PDF)
        </Button>
      </Box>

      <Grid container spacing={2}>

        <Grid item xs={12} md={3}>
          <Filters
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            filterOperator={filterOperator} setFilterOperator={setFilterOperator}
            filterGroup={filterGroup} setFilterGroup={setFilterGroup}
            aggregatedData={aggregatedData}
          />
  
          <ActivityDetails
            detailInfo={detailInfo}
            activities={activities}
            detailMonth={detailMonth}
            setDetailMonth={setDetailMonth}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ActivityTable
            filteredAggregatedData={filteredAggregatedData}
            quickFilterText={quickFilterText}
            setQuickFilterText={setQuickFilterText}
            handleDeleteActivity={(activityIds) => handleDeleteActivity(activityIds)}
          />
        </Grid>


        <Grid item xs={12} md={3}>
          <GeneralStats activities={activities} />
        </Grid>

      </Grid>

      <AddActivity open={isDialogOpen} onClose={handleDialogClose} onAdd={handleActivityAdded} />

            {/* הוספת הודעת שגיאה מעוצבת */}
            <Snackbar
              open={!!errorMessage}
              autoHideDuration={5000}
              onClose={() => setErrorMessage(null)}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert severity="warning" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            </Snackbar>

    </Box>
  );
  
};

export default Activities;
