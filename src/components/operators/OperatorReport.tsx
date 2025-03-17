import React, { useState } from "react";
import { Paper, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import dayjs from "dayjs";
import { useFetchActivitiesByOperator } from "../../queries/activitiesQueries";
import { PaymentMethodChoicesEnum } from "../../types";
import AddActivity from "../activities/ActvitiesCreate";


const getMonthLabel = (date: Date) => {
  const day = dayjs(date);
  const startOfMonth = day.date() < 26 ? day.subtract(1, "month") : day;
  return startOfMonth.format("MMMM YYYY");
};

const OperatorReport: React.FC<{ operator: any }> = ({ operator }) => {
  const { data: activities = [] } = useFetchActivitiesByOperator(operator._id);
  const [openDialog, setOpenDialog] = useState(false);

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
      {/* כפתור הוספת פעילות */}
      <Button variant="contained" color="primary" onClick={handleOpenDialog} sx={{ mb: 2 }}>
        הוסף דיווח פעילות
      </Button>

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
