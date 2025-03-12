import React, { useMemo } from 'react';
import { Grid, TextField, MenuItem, Box, Typography } from '@mui/material';
import { getMonthOptions, getOperatorOptions, getGroupOptions, AggregatedRow } from './activitiesUtils';

interface FiltersProps {
  filterMonth: string;
  setFilterMonth: (value: string) => void;
  filterOperator: string;
  setFilterOperator: (value: string) => void;
  filterGroup: string;
  setFilterGroup: (value: string) => void;
  aggregatedData: AggregatedRow[];
}

const Filters: React.FC<FiltersProps> = ({
  filterMonth,
  setFilterMonth,
  filterOperator,
  setFilterOperator,
  filterGroup,
  setFilterGroup,
  aggregatedData
}) => {
  const monthOptions = useMemo(() => getMonthOptions(aggregatedData), [aggregatedData]);
  const operatorOptions = useMemo(() => getOperatorOptions(aggregatedData), [aggregatedData]);
  const groupOptions = useMemo(() => getGroupOptions(aggregatedData), [aggregatedData]);

  return (
    <Box sx={{ mb: 2, boxShadow: 3, p: 2, borderRadius: 2 }}>
      <Typography variant="h6">סינונים</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField select fullWidth label="בחר חודש" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <MenuItem value="all">הכל</MenuItem>
            {monthOptions.map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField 
            select 
            fullWidth 
            label="בחר מפעיל" 
            value={filterOperator} 
            onChange={(e) => {
              setFilterOperator(e.target.value);
              setFilterGroup("all"); // איפוס הקבוצה
            }}
          >
            <MenuItem value="all">הכל</MenuItem>
            {operatorOptions.map((op) => <MenuItem key={op} value={op}>{op}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField 
            select 
            fullWidth 
            label="בחר קבוצה" 
            value={filterGroup} 
            onChange={(e) => {
              setFilterGroup(e.target.value);
              setFilterOperator("all"); // איפוס המפעיל
            }}
          >
            <MenuItem value="all">הכל</MenuItem>
            {groupOptions.map((grp) => <MenuItem key={grp} value={grp}>{grp}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Filters;
