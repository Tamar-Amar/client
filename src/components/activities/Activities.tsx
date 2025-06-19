import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Grid, TextField, Snackbar, Alert, Autocomplete } from '@mui/material';
import { useFetchActivities, useAddActivity, useDeleteActivity } from '../../queries/activitiesQueries';
import { Activity, Operator } from '../../types';
import { getAggregatedData, filterAggregatedData, getDetailInfo, AggregatedRow, DetailInfo } from '../../utils/activitiesUtils';
import Filters from './Filters';
import ActivityTable from './ActivityTable';
import ActivityDetails from './ActivityDetails';
import AttendanceReport from './AttendanceReport';

import GeneralStats from './GeneralStats';
import ActivationsDashboard from './ActivationsDashboard';
import { useFetchOperatorById, useFetchOperators } from '../../queries/operatorQueries';
import AddActivity from './addActivity/AddActivity';
import ExportToSheetsButton from './ExportButton';

const Activities: React.FC = () => {
  const { data: activities = [], isLoading, isError } = useFetchActivities();
  const { mutation: addActivityMutation, errorMessage, setErrorMessage } = useAddActivity();
  const deleteActivityMutation = useDeleteActivity();
  const [showDashboard, setShowDashboard] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterOperator, setFilterOperator] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [detailMonth, setDetailMonth] = useState('');
  const [attendanceMonth, setAttendanceMonth] = useState<string>("");
  const [operatorId, setOperatorId] = useState<string>('');
  const { data: operators = [], isLoading: operatorsLoading } = useFetchOperators();
  const { data: operator, isLoading: operatorLoading } = useFetchOperatorById(operatorId);
  const handleAddClick = () => setIsDialogOpen(true);
  const handleDialogClose = () => setIsDialogOpen(false);


  useEffect(() => {
  fetch(`${API_URL}/api/activities/last-google-update`)
    .then(res => res.json())
    .then(data => {
      if (data.updatedAt) {
        setLastUpdated(data.updatedAt);
      }
    })
    .catch(err => {
      console.error('שגיאה בהבאת תאריך עדכון', err);
    });
}, []);


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

  const API_URL = process.env.REACT_APP_API_URL || "https://server-manage.onrender.com";

  const handleDownloadAttendanceReport = async () => {
    if (!attendanceMonth) return;
  
    const url = operatorId
      ? API_URL+"/api/generate-pdf-by-op"
      : API_URL+"/api/generate-pdf";
  
    const body = operatorId
      ? { month: attendanceMonth, operatorId }
      : { month: attendanceMonth };
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const namePart = operator
      ? `_${operator.firstName}_${operator.lastName}`
      : "";

    link.download = `דוח_נוכחות_${attendanceMonth}${namePart}.pdf`;
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

  if (isLoading || operatorsLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">שגיאה בטעינת הפעילויות.</Typography>;

  return (
    <Box sx={{ m: 6 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
        variant="outlined"
        onClick={() => setShowDashboard(!showDashboard)}
      >
        {showDashboard ? 'חזור לסיכום רגיל' : 'הצג לוח בקרה'}
      </Button>

        <Button variant="contained" color="primary" onClick={handleAddClick}>
          הוסף פעילות חדשה
        </Button>

        <ExportToSheetsButton onSuccess={() => setLastUpdated(new Date().toISOString())} />
          {lastUpdated && (
            <Typography variant="body2" sx={{ alignSelf: 'center', color: 'gray' }}>
              עודכן לאחרונה: {new Date(lastUpdated).toLocaleString('he-IL')}
            </Typography>
          )}

      </Box>

      {showDashboard ? (
  <ActivationsDashboard activities={activities} />
) : (
  <>
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
            <AttendanceReport
      attendanceMonth={attendanceMonth}
      setAttendanceMonth={setAttendanceMonth}
      operatorId={operatorId}
      setOperatorId={setOperatorId}
      handleDownloadAttendanceReport={handleDownloadAttendanceReport}
      operators={operators}
    />
        <GeneralStats activities={activities} />
      </Grid>
    </Grid>

    <AddActivity open={isDialogOpen} onClose={handleDialogClose} onAdd={handleActivityAdded} />
  </>
)}
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
