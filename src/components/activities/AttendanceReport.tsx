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
  const token = useRecoilValue(userTokenState); 
  const [month, setMonth] = useState<string>("");


  const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>({});


  
  
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



      <Button
        variant="contained"
        color="secondary"
        onClick={downloadPDF}
        sx={{ marginTop: 2 , ml:3}}
      >
        הורד דוח נוכחות (PDF)
      </Button>
    </div>
  );
};

export default AttendanceReport;
