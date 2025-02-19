import React, { useState } from "react";
import { 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel 
} from "@mui/material";
import dayjs from "dayjs";
import { useFetchCurrentOperator, useFetchOperators } from "../../queries/operatorQueries";
import { useFetchClasses } from "../../queries/classQueries";
import { Class } from '../../types';
import { Operator } from '../../types';
import { useRecoilValue } from "recoil";
import { userRoleState, userTokenState } from "../../recoil/storeAtom";
import { useAddActivity } from "../../queries/activitiesQueries";

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
  const role = useRecoilValue(userRoleState);
  const token = useRecoilValue(userTokenState); 
  const { data: operators = [] } = useFetchOperators();
  const { data: classes = [] } = useFetchClasses();
  const addActivityMutation = useAddActivity();
  const { data: currentOperator } = useFetchCurrentOperator(); 

  const [month, setMonth] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<string>(
    role === "admin" ? "" : token ? "currentUser" : "" 
  );
  const operatorId =
  selectedOperator === "currentUser"
    ? currentOperator?._id || ""
    : selectedOperator;

  const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>({});

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
        date: gregorianDate,
        dayOfWeekHebrew,
        attendance: attendanceData[gregorianDate] || "",
      });

      currentDate = currentDate.add(1, "day");
    }

    return reportData;
  };

  const report = month ? generateReport() : [];

  const handleAttendanceChange = (date: string, value: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [date]: value,
    }));
  };

  const saveAttendance = async () => {
    if (!selectedOperator) {
      alert("יש לבחור מפעיל לפני השמירה!");
      return;
    }
  
    const operatorId = selectedOperator === "currentUser" ? currentOperator?._id : selectedOperator;  
    if (!operatorId) {
      alert("לא נמצא מזהה מפעיל. נסה שוב.");
      return;
    }
  
    if (!month) {
      alert("יש לבחור חודש דיווח!");
      return;
    }
  
    const entries = Object.entries(attendanceData).filter(([_, classId]) => classId);
    if (entries.length === 0) {
      alert("אין נתונים לשמור.");
      return;
    }
  
    try {
      await Promise.all(
        entries.map(async ([dateString, classId]) => {
          const dateS = new Date(dateString);
          console.log("📤 שולח לשרת:", { operatorId, classId, dateS, dateString });
          await addActivityMutation.mutateAsync({
            operatorId, 
            classId, 
            date: new Date(dateString), 
            description: " ",
          });
        })
      );
  
      alert("הנוכחות נשמרה בהצלחה!");
    } catch (error) {
      console.error("שגיאה בשמירת הנתונים:", error);
      alert("אירעה שגיאה במהלך השמירה. נסה שוב.");
    }
  };
  
  
  
  const downloadPDF = async () => {
    const response = await fetch("http://localhost:5000/api/generate-pdf", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ month, attendance: attendanceData }),
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

      {role === "admin" && (
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel>בחר מפעיל</InputLabel>
          <Select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
          >
            {operators.map((operator: Operator) => (
              <MenuItem key={operator._id} value={operator._id}>
                {operator.firstName} {operator.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

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
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.dayOfWeekHebrew}</TableCell>
                <TableCell>
                  <Select
                    value={row.attendance}
                    onChange={(e) => handleAttendanceChange(row.date, e.target.value)}
                    displayEmpty
                    fullWidth
                  >
                    <MenuItem value="">-- בחר סמל --</MenuItem>
                    {classes.map((cls: Class) => (
                      <MenuItem key={cls._id} value={cls.uniqueSymbol}>
                        {cls.name} ({cls.uniqueSymbol})
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={saveAttendance}
        sx={{ marginTop: 2, marginRight: 2 }}
      >
        שמור נוכחות
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={downloadPDF}
        sx={{ marginTop: 2 }}
      >
        הורד דוח נוכחות (PDF)
      </Button>
    </div>
  );
};

export default AttendanceReport;
