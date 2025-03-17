import React, { useMemo } from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText, TextField, Button } from '@mui/material';
import { exportMonthlyReportExcel, exportAnnualReportExcel, DetailInfo, getMonthlyCountForOperator, getMonthlyCountForGroup } from '../../utils/activitiesUtils';
import { Activity } from '../../types';

interface ActivityDetailsProps {
  detailInfo: DetailInfo | null;
  activities: Activity[];
  detailMonth: string;
  setDetailMonth: (value: string) => void;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ detailInfo, activities, detailMonth, setDetailMonth }) => {
  // חישוב מספר ההפעלות בהתאם לסוג שנבחר (מפעיל/קבוצה)
  const monthlyCount = useMemo(() => {
    if (!detailInfo) return 0;

    if (detailInfo.type === 'operator') {
      return getMonthlyCountForOperator(activities, detailInfo, detailMonth);
    } else if (detailInfo.type === 'group') {
      return getMonthlyCountForGroup(activities, detailInfo, detailMonth);
    }
    return 0;
  }, [activities, detailInfo, detailMonth]);

  if (!detailInfo) {
    return <Typography color="text.secondary">בחר מפעיל או קבוצה להצגת פרטים</Typography>;
  }

  return (
    <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2 }}>
      {detailInfo.type === 'operator' ? (
        <>
          <Typography variant="h6">פרטי מפעיל</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography>שם: {detailInfo.operator}</Typography>
          <Typography>סה"כ הפעלות: {detailInfo.totalActivities}</Typography>

          {/* בחירת חודש והצגת מספר ההפעלות */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="בחר חודש ספציפי"
              type="month"
              fullWidth
              value={detailMonth}
              onChange={(e) => setDetailMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            {detailMonth && (
              <Typography sx={{ mt: 1 }}>
                סך ההפעלות שהפעיל בחודש {detailMonth}: <strong>{monthlyCount}</strong>
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6">פרטי קבוצה</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography>שם: {detailInfo.groupName}</Typography>
          <Typography>סמל: {detailInfo.groupSymbol}</Typography>
          <Typography>סה"כ הפעלות: {detailInfo.totalActivities}</Typography>

          {/* בחירת חודש והצגת מספר ההפעלות */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="בחר חודש ספציפי"
              type="month"
              fullWidth
              value={detailMonth}
              onChange={(e) => setDetailMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            {detailMonth && (
              <Typography sx={{ mt: 1 }}>
                סך ההפעלות שבוצעו לקבוצה בחודש {detailMonth}: <strong>{monthlyCount}</strong>
              </Typography>
            )}
          </Box>

          {/* כפתורי יצירת דוחות */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => exportMonthlyReportExcel(activities, detailInfo, detailMonth)}
              disabled={!detailMonth} // הכפתור יושבת אם לא נבחר חודש
            >
              יצירת דוח חודשי
            </Button>
            <Button variant="contained" color="secondary" onClick={() => exportAnnualReportExcel(activities, detailInfo, "2025")}>
              יצירת דוח שנתי
            </Button>
          </Box>

          {/* רשימת מפעילים בקבוצה */}
          <Typography sx={{ mt: 2 }}>מפעילים בקבוצה זו:</Typography>
          <List>
            {detailInfo.operators?.map((op: string, index: number) => (
              <ListItem key={index} disablePadding>
                <ListItemText primary={op} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default ActivityDetails;
