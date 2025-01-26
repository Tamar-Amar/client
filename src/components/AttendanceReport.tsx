import React, { useState } from "react";
import { TextField, Table, TableBody, TableCell, TableHead, TableRow, Button } from "@mui/material";
import dayjs from "dayjs";

const daysOfWeekHebrew: { [key: string]: string } = {
  Sunday: "ראשון",
  Monday: "שני",
  Tuesday: "שלישי",
  Wednesday: "רביעי",
  Thursday: "חמישי",
  Friday: "שישי",
  Saturday: "שבת",
};

const AttendanceReport: React.FC = () => {
  const [month, setMonth] = useState<string>("");

  const generateReport = () => {
    const selectedDate = dayjs(month);
    const startDate = selectedDate.subtract(1, "month").date(26);
    const endDate = selectedDate.date(25);

    const reportData = [];
    let currentDate = startDate;

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      const gregorianDate = currentDate.format("DD/MM/YYYY");
      const dayOfWeekEnglish = currentDate.format("dddd");
      const dayOfWeekHebrew = daysOfWeekHebrew[dayOfWeekEnglish];

      reportData.push({
        gregorianDate,
        dayOfWeekHebrew,
        attendance: "",
      });

      currentDate = currentDate.add(1, "day");
    }

    return reportData;
  };

  const report = month ? generateReport() : [];

  const downloadPDF = async () => {
    const response = await fetch("http://localhost:5000/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ report , month}),
    });

    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "attendance_report.pdf";
    link.click();
  };

  return (
    <div>
      <h1>דוח נוכחות</h1>
      <TextField
        label="בחר חודש"
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        sx={{ marginBottom: 2 }}
      />
      {report.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>תאריך לועזי</TableCell>
              <TableCell>יום בשבוע</TableCell>
              <TableCell>נוכחות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.gregorianDate}</TableCell>
                <TableCell>{row.dayOfWeekHebrew}</TableCell>
                <TableCell>{row.attendance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Button variant="contained" color="primary" onClick={downloadPDF} sx={{ marginTop: 2 }}>
        הורד דוח נוכחות
      </Button>
    </div>
  );
};

export default AttendanceReport;
