import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  MenuItem,
} from "@mui/material";
import React from "react";

interface Operator {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const EmailDashboard = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [selectedOperatorEmail, setSelectedOperatorEmail] = useState("");
  const [attendanceMonth, setAttendanceMonth] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "">("");

  const API_URL =
    process.env.REACT_APP_API_URL || "https://server-manage.onrender.com";

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch(`${API_URL}/api/operators`);
        const data = await response.json();
        const sorted = data.sort((a: Operator, b: Operator) =>
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        setOperators(sorted);
      } catch (error) {
        console.error("שגיאה בטעינת מפעילים:", error);
      }
    };

    fetchOperators();
  }, []);

  const handleOperatorChange = (id: string) => {
    setSelectedOperatorId(id);
    const selected = operators.find((op) => op._id === id);
    setSelectedOperatorEmail(selected?.email || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Submitting form...", selectedOperatorId);
    
    e.preventDefault();

    console.log("Sending email to:", selectedOperatorEmail);
  
    if (!selectedOperatorEmail || !selectedOperatorId) {
      console.error("Missing operator email or ID");
      setStatus("error");
      return;
    }
  
    try {
      console.log("Sending email with subject:", subject);
      if (attendanceMonth) {
        const response = await fetch(`${API_URL}/api/email/send-attendance-pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operatorId: selectedOperatorId,
            month: attendanceMonth,
            to: selectedOperatorEmail,
          }),
        });
  
        if (!response.ok) throw new Error("שגיאה בשליחת דוח PDF");
      } else {
        const response = await fetch(`${API_URL}/api/email/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: selectedOperatorEmail,
            subject,
            text: message,
          }),
        });
  
        if (!response.ok) throw new Error("שגיאה בשליחת מייל רגיל");
      }
  
      setStatus("success");
      setSelectedOperatorId("");
      setSelectedOperatorEmail("");
      setSubject("");
      setMessage("");
      setAttendanceMonth("");
    } catch (error) {
      console.error("שגיאה בשליחה:", error);
      setStatus("error");
    }
  };
  
  

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        שליחת מייל למפעיל
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="בחר מפעיל"
            select
            fullWidth
            value={selectedOperatorId}
            onChange={(e) => handleOperatorChange(e.target.value)}
            required
            margin="normal"
          >
            {operators.map((op) => (
              <MenuItem key={op._id} value={op._id}>
                {op.firstName} {op.lastName}
              </MenuItem>
            ))}
          </TextField>

          {selectedOperatorEmail && (
            <TextField
              label="כתובת מייל"
              value={selectedOperatorEmail}
              fullWidth
              margin="normal"
              disabled
            />
          )}

          {/* 🆕 שדה בחירת חודש */}
          <TextField
            label="בחר חודש לדוח נוכחות"
            type="month"
            value={attendanceMonth}
            onChange={(e) => setAttendanceMonth(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="נושא"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
            margin="normal"
          />

          <TextField
            label="תוכן ההודעה"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            required
            multiline
            rows={5}
            margin="normal"
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            שלח מייל
          </Button>
        </form>

        {status === "success" && (
          <Alert severity="success" sx={{ mt: 2 }}>
            המייל נשלח בהצלחה!
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ mt: 2 }}>
            שגיאה בשליחת המייל.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default EmailDashboard;
