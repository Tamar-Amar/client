import React, { useState } from "react";
import { 
  TextField, 
  Button, 
} from "@mui/material";

import { userTokenState } from "../../recoil/storeAtom";
import { useRecoilValue } from "recoil";



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
