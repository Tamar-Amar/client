// components/PDFFormActivity/PendingActivitiesDialog.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { Activity, Class, Operator } from '../../../types';
import { DateTime } from 'luxon';

interface PendingActivitiesDialogProps {
  open: boolean;
  pendingActivities: Activity[];
  classes: Class[];
  onClose: () => void;
  onConfirm: () => void;
  operators?: Operator[];
  operatorId?: string;
}

const PendingActivitiesDialog: React.FC<PendingActivitiesDialogProps> = ({
  open,
  pendingActivities,
  classes,
  onClose,
  onConfirm,
  operators = [],
  operatorId
}) => {
  const groupedByDate = pendingActivities.reduce((acc, activity) => {
    const dateStr = DateTime.fromJSDate(activity.date).toFormat('dd/MM/yyyy');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const da = DateTime.fromFormat(a, 'dd/MM/yyyy');
    const db = DateTime.fromFormat(b, 'dd/MM/yyyy');
    return da.toMillis() - db.toMillis();
  });

  const operatorName = operators.find(op => op._id === operatorId)
    ? `${operators.find(op => op._id === operatorId)!.lastName} ${operators.find(op => op._id === operatorId)!.firstName}`
    : '';

  return (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown 
        BackdropProps={{
            onClick: (e) => e.stopPropagation() 
        }}
        >
      <DialogTitle>סיכום הפעילויות לפני אישור</DialogTitle>
      <DialogContent>
        {pendingActivities.length === 0 ? (
          <Typography>אין פעילויות להצגה.</Typography>
        ) : (
          <Box>
            {sortedDates.map(dateStr => {
              const date = DateTime.fromFormat(dateStr, 'dd/MM/yyyy').setLocale('he');
              const dayOfWeek = date.toFormat('cccc');
              const activities = groupedByDate[dateStr];
              const groups = activities.map(act => {
                const classObj = classes.find(cls => cls._id === act.classId);
                const symbol = classObj?.uniqueSymbol ?? (typeof act.classId === 'string' ? act.classId : '');
                const name = classObj?.name ?? '';
                return `${symbol} ${name}`.trim();
              }).join(', ');

              return (
                <Typography key={dateStr} variant="body2" sx={{ mb: 1 }}>
                  {dateStr} ({dayOfWeek}): {groups}
                </Typography>
              );
            })}

            <Box mt={2} p={1} bgcolor="#f5f5f5" borderRadius={2}>
            <Typography variant="inherit">
                סה"כ הפעלות בחודש הנבחר למפעיל {operatorName || 'לא ידוע'}: {pendingActivities.length}
            </Typography>
            </Box>

          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>חזרה לעריכה</Button>
        <Button variant="contained" color="primary" onClick={onConfirm}>
          אישור סופי
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingActivitiesDialog;
