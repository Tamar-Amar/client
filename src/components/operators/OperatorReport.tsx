import React, { useState } from "react";
import { Paper, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Autocomplete, TextField, Box } from "@mui/material";
import dayjs from "dayjs";
import { useFetchActivitiesByOperator } from "../../queries/activitiesQueries";
import { Class, Operator, PaymentMethodChoicesEnum } from "../../types";
import AddActivity from "../activities/ActvitiesCreate";
import { useFetchClasses } from "../../queries/classQueries";
import { useFetchOperators, useUpdateOperatorWeeklySchedule } from "../../queries/operatorQueries";


const getMonthLabel = (date: Date) => {
  const day = dayjs(date);
  const startOfMonth = day.date() < 26 ? day.subtract(1, "month") : day;
  return startOfMonth.format("MMMM YYYY");
};

const OperatorReport: React.FC<{ operator: any }> = ({ operator }) => {
  const { data: activities = [] } = useFetchActivitiesByOperator(operator._id);
  const [openDialog, setOpenDialog] = useState(false);
  const [operatorState, setOperatorState] = useState(operator);
  const { data: classes = [] } = useFetchClasses();
  const { mutate: updateWeeklySchedule } = useUpdateOperatorWeeklySchedule();
  const { data: allOperators = [] } = useFetchOperators();
  const assignedClasses = new Set(
    allOperators.flatMap((op: Operator) =>
      op.weeklySchedule ? op.weeklySchedule.flatMap((schedule) => schedule.classes) : []
    )
  );

  const availableClasses = classes.filter((cls: Class) => !assignedClasses.has(cls._id));

const handleAddClassToDay = (day: string, classId: string | undefined) => {
  if (!classId) return;

  const updatedSchedule = operatorState.weeklySchedule.map((schedule: { day: string; classes: string[] }) =>
    schedule.day === day && schedule.classes.length < 4
      ? { ...schedule, classes: [...schedule.classes, classId] }
      : schedule
  );

  setOperatorState({ ...operatorState, weeklySchedule: updatedSchedule });

  updateWeeklySchedule({
    operatorId: operatorState._id,
    weeklySchedule: updatedSchedule,
  });
};

const handleRemoveClassFromDay = (day: string, classId: string) => {
  const updatedSchedule = operatorState.weeklySchedule.map((schedule: { day: string; classes: string[] }) =>
    schedule.day === day
      ? { ...schedule, classes: schedule.classes.filter(id => id !== classId) }
      : schedule
  );

  setOperatorState({ ...operatorState, weeklySchedule: updatedSchedule });

  updateWeeklySchedule({
    operatorId: operatorState._id,
    weeklySchedule: updatedSchedule,
  });
};


  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const activitySummary = activities.reduce(
    (acc: Record<string, { count: number; totalPayment: number }>, activity: any) => {
      const monthLabel = getMonthLabel(activity.date);
      const paymentRate = operator.paymentMethod === PaymentMethodChoicesEnum.TLUSH ? 80 : 95;

      if (!acc[monthLabel]) {
        acc[monthLabel] = { count: 0, totalPayment: 0 };
      }

      acc[monthLabel].count += 1;
      acc[monthLabel].totalPayment += paymentRate;

      return acc;
    },
    {}
  );


  const totalActivities = Object.values(activitySummary).reduce((sum, row) => sum + row.count, 0);
  const totalPayment = Object.values(activitySummary).reduce((sum, row) => sum + row.totalPayment, 0);

  return (
    <Paper sx={{ p: 3, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
      <Button variant="contained" color="primary" onClick={handleOpenDialog} sx={{ mb: 2 }}>
        הוסף דיווח פעילות
      </Button>

<Typography variant="h6" sx={{ mb: 2 }}>מערכת שבועית</Typography>
<TableContainer component={Paper} sx={{ maxWidth: 600, mx: "auto", mb: 2 }}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell><strong>יום</strong></TableCell>
        <TableCell><strong>סמלים</strong></TableCell>
        <TableCell><strong>הוספת סמל</strong></TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {operatorState.weeklySchedule && operatorState.weeklySchedule.length > 0 ? (
        operatorState.weeklySchedule.map((schedule: { day: string; classes: string[] }) => {
          const selectedClass = null; // לאתחל ערך ברירת מחדל לבחירת סמל חדש
          return (
            <TableRow key={schedule.day}>
              {/* יום בשבוע */}
              <TableCell>{schedule.day}</TableCell>

              {/* סמלים קיימים */}
              <TableCell>
                <Box display="flex" flexDirection="column" gap={1}>
                  {schedule.classes.length > 0 ? (
                    schedule.classes.map((classId: string, index: number) => {
                      const classObj = classes.find((cls: Class) => cls._id === classId);
                      return (
                        <Box key={index} display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">
                            {classObj ? `${classObj.name} (${classObj.uniqueSymbol})` : "כיתה לא נמצאה"}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveClassFromDay(schedule.day, classId)}
                          >
                            ❌
                          </Button>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary">אין סמלים</Typography>
                  )}
                </Box>
              </TableCell>

              {/* הוספת סמל חדש */}
              <TableCell>
                <Autocomplete
                  options={availableClasses} // שימוש ברשימת סמלים שלא נמצאים במערכת של אף מפעיל
                  getOptionLabel={(option: Class) => `${option.name} (${option.uniqueSymbol})`}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleAddClassToDay(schedule.day, newValue._id);
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="בחר סמל להוספה" size="small" />}
                  fullWidth
                  disabled={schedule.classes.length >= 4} // מניעת הוספה אם הגיע ל-4 סמלים
                />
              </TableCell>
            </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableCell colSpan={3} align="center">אין מערכת שבועית מוגדרת</TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</TableContainer>





      <Typography variant="h6" sx={{ mb: 2 }}>סיכום הפעלות חודשי</Typography>
      <Divider sx={{ mb: 2 }} />

      <TableContainer component={Paper} sx={{ maxWidth: 600, mx: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>חודש</strong></TableCell>
              <TableCell><strong>מספר הפעלות</strong></TableCell>
              <TableCell><strong>לתשלום (₪)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(activitySummary)
              .sort(([monthA], [monthB]) => dayjs(monthB, "MMMM YYYY").diff(dayjs(monthA, "MMMM YYYY")))
              .map(([month, data]) => (
                <TableRow key={month}>
                  <TableCell>{month}</TableCell>
                  <TableCell>{data.count}</TableCell>
                  <TableCell>{data.totalPayment.toLocaleString()}</TableCell>
                </TableRow>
              ))}

            <TableRow sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold" }}>
              <TableCell><strong>סה"כ</strong></TableCell>
              <TableCell><strong>{totalActivities}</strong></TableCell>
              <TableCell><strong>{totalPayment.toLocaleString()} ₪</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* דיאלוג הוספת פעילות עם המפעיל הנוכחי כברירת מחדל */}
      <AddActivity open={openDialog} onClose={handleCloseDialog} onAdd={() => {}} defaultOperatorId={operator._id} />
    </Paper>
  );
};

export default OperatorReport;
