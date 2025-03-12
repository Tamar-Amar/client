import React, { useMemo, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Grid } from '@mui/material';
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
  const addActivityMutation = useAddActivity();
  const deleteActivityMutation = useDeleteActivity();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterOperator, setFilterOperator] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [detailMonth, setDetailMonth] = useState('');

  const handleAddClick = () => setIsDialogOpen(true);
  const handleDialogClose = () => setIsDialogOpen(false);

  const handleActivityAdded = async (newActivities: Activity[]) => {
    for (const activity of newActivities) {
      await addActivityMutation.mutateAsync(activity);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    deleteActivityMutation.mutate(activityId);
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
    <Box sx={{ m: 4 }}>
      <Typography variant="h4" gutterBottom>סיכום פעילויות</Typography>
      <Button variant="contained" color="primary" onClick={handleAddClick} sx={{ mb: 2 }}>
        הוסף פעילות חדשה
      </Button>
  
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
            handleDeleteActivity={handleDeleteActivity}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <GeneralStats activities={activities} />
        </Grid>

      </Grid>

      <AddActivity open={isDialogOpen} onClose={handleDialogClose} onAdd={handleActivityAdded} />
    </Box>
  );
  
};

export default Activities;
