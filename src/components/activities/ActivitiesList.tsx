import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Button,
  CircularProgress,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useFetchActivities, useAddActivity, useDeleteActivity } from '../../queries/activitiesQueries';
import { Activity } from '../../types';
import AddActivity from './ActvitiesCreate';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

// Import utility functions
import {
  getAggregatedData,
  getMonthOptions,
  getOperatorOptions,
  getGroupOptions,
  filterAggregatedData,
  getDetailInfo,
  getMonthlyCountForOperator,
  getMonthlyCountForGroup,
  exportMonthlyReportExcel,
  AggregatedRow,
  exportAnnualReportExcel
} from './activitiesUtils'; 

const ActivitiesList: React.FC = () => {
  const { data: activities = [], isLoading, isError } = useFetchActivities();
  const addActivityMutation = useAddActivity();
  const deleteActivityMutation = useDeleteActivity();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterOperator, setFilterOperator] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");
  const [detailMonth, setDetailMonth] = useState("");

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

  const handleDeleteActivity = (activityId: string) => {
    deleteActivityMutation.mutate(activityId);
  };

  const aggregatedData = useMemo((): AggregatedRow[] => getAggregatedData(activities), [activities]);
  const monthOptions = useMemo(() => getMonthOptions(aggregatedData), [aggregatedData]);
  const operatorOptions = useMemo(() => getOperatorOptions(aggregatedData), [aggregatedData]);
  const groupOptions = useMemo(() => getGroupOptions(aggregatedData), [aggregatedData]);
  const filteredAggregatedData = useMemo(() => filterAggregatedData(aggregatedData, filterMonth, filterOperator, filterGroup), [aggregatedData, filterMonth, filterOperator, filterGroup]);
  const detailInfo = useMemo(() => getDetailInfo(aggregatedData, filterOperator, filterGroup), [aggregatedData, filterOperator, filterGroup]);
  const monthlyCountForOperator = useMemo(() => getMonthlyCountForOperator(activities, detailInfo, detailMonth), [activities, detailInfo, detailMonth]);
  const monthlyCountForGroup = useMemo(() => getMonthlyCountForGroup(activities, detailInfo, detailMonth), [activities, detailInfo, detailMonth]);

  const columnDefs = useMemo(() => [
    {
      headerName: 'חודש',
      field: 'month',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'מפעיל',
      field: 'operator',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'קבוצה',
      valueGetter: (params: any) => `${params.data.groupSymbol} ${params.data.groupName}`,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'סה"כ הפעלות',
      field: 'count',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'פעולות',
      field: 'actions',
      cellRenderer: (params: any) => (
        <IconButton onClick={() => handleDeleteActivity(params.data._id)} color="error">
          <DeleteIcon />
        </IconButton>
      ),
      width: 100,
    },
  ], []);

  const handleMonthlyReportExport = () => {
    console.log('export');
    exportMonthlyReportExcel(activities, detailInfo, detailMonth);
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">שגיאה בטעינת הפעילויות.</Typography>;

  return (
    <Box sx={{ m: 4 }}>
      <Typography variant="h4" gutterBottom>
        סיכום פעילויות
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }} direction="row-reverse">
        {/* Left tab: Table */}
        <Grid item xs={12} md={8}>
          <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2, mb: 2 }}>
            <Button variant="contained" color="primary" onClick={handleAddClick} sx={{ mb: 2 }}>
              הוסף פעילות חדשה
            </Button>
            <TextField
              placeholder="חיפוש מהיר"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              sx={{ mb: 2, width: 300, display: 'block' }}
            />
            <div className="ag-theme-alpine rtl" style={{ height: 600, width: '100%' }}>
              <AgGridReact
                rowData={filteredAggregatedData}
                columnDefs={columnDefs}
                modules={[ClientSideRowModelModule]}
                pagination={true}
                quickFilterText={quickFilterText}
                enableRtl={true}
              />
            </div>
          </Box>
        </Grid>
        {/* Right tab: Filters and Details */}
        <Grid item xs={12} md={4}>
          <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              סינונים
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="בחר חודש"
                  select
                  fullWidth
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <MenuItem value="all">הכל</MenuItem>
                  {monthOptions.map((month, index) => (
                    <MenuItem key={index} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="בחר מפעיל"
                  select
                  fullWidth
                  value={filterOperator}
                  onChange={(e) => {
                    setFilterOperator(e.target.value);
                    setFilterGroup("all");
                  }}
                >
                  <MenuItem value="all">הכל</MenuItem>
                  {operatorOptions.map((op, index) => (
                    <MenuItem key={index} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="בחר קבוצה"
                  select
                  fullWidth
                  value={filterGroup}
                  onChange={(e) => {
                    setFilterGroup(e.target.value);
                    setFilterOperator("all");
                  }}
                >
                  <MenuItem value="all">הכל</MenuItem>
                  {groupOptions.map((grp, index) => (
                    <MenuItem key={index} value={grp}>
                      {grp}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            
          </Box>
          <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2 }}>
            {detailInfo ? (
              detailInfo.type === 'operator' ? (
                <>
                  <Typography variant="h6">פרטי מפעיל</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography>שם: {detailInfo.operator}</Typography>
                  <Typography>סה"כ הפעלות: {detailInfo.totalActivities}</Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="בחר חודש ספציפי"
                      type="month"
                      fullWidth
                      value={detailMonth}
                      onChange={(e) => setDetailMonth(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />

                  </Box>
                  {detailMonth && (
                    <Typography sx={{ mt: 1 }}>
                      סך ההפעלות בחודש {detailMonth} הוא {monthlyCountForOperator}
                    </Typography>
                  )}
                  <Typography sx={{ mt: 1 }}>פעיל בקבוצה/ות:</Typography>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    <List>
                      {(detailInfo.groups || []).map((g, idx) => (
                        <ListItem key={idx} disablePadding>
                          <ListItemText primary={`${g.symbol} - ${g.name}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="h6">פרטי קבוצה</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography>שם: {detailInfo.groupName}</Typography>
                  <Typography>סמל: {detailInfo.groupSymbol}</Typography>
                  <Typography>סה"כ הפעלות: {detailInfo.totalActivities}</Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="בחר חודש ספציפי"
                      type="month"
                      fullWidth
                      value={detailMonth}
                      onChange={(e) => setDetailMonth(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="contained" color="secondary" onClick={handleMonthlyReportExport}>
                      יצירת דוח חודשי
                    </Button>
                    <Button variant="contained" color="secondary" onClick={() => exportAnnualReportExcel(activities, detailInfo, "2025")}>
                      יצירת דוח שנתי
                    </Button>
                  </Box>
                  {detailMonth && (
                    <Typography sx={{ mt: 1 }}>
                      סך ההפעלות בחודש {detailMonth} הוא {monthlyCountForGroup}
                    </Typography>
                  )}
                  <Typography sx={{ mt: 2 }}>מפעילים בקבוצה זו:</Typography>
                  <List>
                    {detailInfo.operators?.map((op: string, index: number) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText primary={op} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )
            ) : (
              <Typography color="text.secondary">
                בחר מפעיל או קבוצה להצגת פרטים
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
      <AddActivity
        open={isDialogOpen}
        onClose={handleDialogClose}
        onAdd={handleActivityAdded}
      />
    </Box>
  );
};

export default ActivitiesList;
