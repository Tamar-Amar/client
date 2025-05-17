// ActivationsDashboard.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider
} from '@mui/material';
import { Activity, Class } from '../../types';
import { useFetchClasses } from '../../queries/classQueries';
import { holidays } from '../../utils/holidays';
import { DateTime } from 'luxon';

interface Props {
  activities: Activity[];
}

const TOTAL_GROUPS = 292;
const TOTAL_WEEKS = 33;
const START_DATE = new Date('2024-11-01');

const ActivationsDashboard: React.FC<Props> = ({ activities }) => {
  const { data: classes = [] } = useFetchClasses();

  // 1️⃣ Main Dashboard Data
  const actualActivationsCount = useMemo(() => {
    return activities.filter((act) => new Date(act.date) >= START_DATE).length;
  }, [activities]);

  const totalPossibleActivations = TOTAL_WEEKS * TOTAL_GROUPS;

  // 2️⃣ Monthly Summary Data
  const monthlyCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    activities.forEach((act) => {
      const date = new Date(act.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      counts[month] = (counts[month] || 0) + 1;
    });
    return counts;
  }, [activities]);

  // 3️⃣ No Activity Groups
  const activeGroupIds = useMemo(() => {
    const ids = new Set<string>();
    activities.forEach((act) => {
      if (typeof act.classId !== 'string') {
        ids.add(act.classId._id);
      }
    });
    return ids;
  }, [activities]);

  const groupsWithoutActivities = useMemo(() => {
    return classes.filter((cls: Class) => cls._id && !activeGroupIds.has(cls._id));
  }, [classes, activeGroupIds]);

  const sortedHolidays = useMemo(() => {
    return holidays.map(h => ({
      ...h,
      dateObj: DateTime.fromISO(h.date)
    })).sort((a, b) => a.dateObj.toMillis() - b.dateObj.toMillis());
  }, []);

  return (
    <Box sx={{ m: 4 }}>
      <Typography variant="h5" gutterBottom>
        לוח בקרה לניצול הפעלות
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 ,  minHeight: 400}}>
            <Typography variant="h6">פרטים כלליים</Typography>
            <Typography>
              <strong>סה"כ שבועות:</strong> {TOTAL_WEEKS}
            </Typography>
            <Typography>
              <strong>סה"כ אפשרי (292 קבוצות):</strong> {totalPossibleActivations}
            </Typography>
            <Typography>
              <strong>סה"כ בפועל:</strong> {actualActivationsCount}
            </Typography>
            <Typography>
              <strong>אחוז ניצול:</strong> {((actualActivationsCount / totalPossibleActivations) * 100).toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2,  minHeight: 400 }}>
            <Typography variant="h6">סיכום חודשי</Typography>
            <List dense>
              {[
                '2024-11', '2024-12', '2025-01', '2025-02',
                '2025-03', '2025-04', '2025-05', '2025-06'
              ].map(month => (
                <ListItem key={month}>
                  <ListItemText
                    primary={`${month} → ${monthlyCounts[month] ?? 0} הפעלות`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, maxHeight: 400, overflowY: 'auto' }}>
            <Typography
              variant="h6"
              sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}
            >
              קבוצות ללא פעילות
            </Typography>

            <List dense>
              {groupsWithoutActivities.map((cls: Class) => (
                <ListItem key={cls._id}>
                  <ListItemText
                    primary={`[${cls.uniqueSymbol}] ${cls.name}`}
                  />
                </ListItem>
              ))}
              {groupsWithoutActivities.length === 0 && (
                <ListItem>
                  <ListItemText primary="אין קבוצות ללא פעילות ✅" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ימים ללא פעילות
          </Typography>

          <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
            <List dense>
              {sortedHolidays.map(({ dateObj, reason }, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText
                    primary={`${dateObj.toFormat('dd/MM/yyyy')} (${dateObj.setLocale('he').toFormat('cccc')}) – ${reason}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    sx={{ px: 1 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="body1">
            סה"כ ימים ללא פעילות: <strong>{sortedHolidays.length}</strong>
          </Typography>
        </Paper>

        </Grid>
      </Grid>
    </Box>
  );
};

export default ActivationsDashboard;