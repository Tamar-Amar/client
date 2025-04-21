import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Autocomplete,
} from "@mui/material";

interface Operator {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const EmailDashboardMulti = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);
  const [type, setType] = useState<"pdf" | "text">("pdf");
  const [attendanceMonth, setAttendanceMonth] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const API_URL = process.env.REACT_APP_API_URL || "https://server-manage.onrender.com";

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

  const handleToggleOperator = (id: string) => {
    setSelectedOperatorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperatorIds.length) return setStatus("לא נבחרו מפעילים");
    if (type === "pdf" && !attendanceMonth) return setStatus("יש לבחור חודש לדוח");
    if (type === "text" && (!subject || !message)) return setStatus("יש למלא נושא והודעה");

    try {
      const response = await fetch(`${API_URL}/api/email/send-multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorIds: selectedOperatorIds,
          type,
          month: attendanceMonth,
          subject,
          text: message,
        }),
      });

      const result = await response.json();
      setResults(result.results);
      setStatus("success");
    } catch (error) {
      console.error("שגיאה בשליחה:", error);
      setStatus("error");
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        שליחת מיילים למפעילים
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <FormGroup>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={operators}
            getOptionLabel={(op) => `${op.firstName} ${op.lastName}`}
            value={operators.filter((op) => selectedOperatorIds.includes(op._id))}
            onChange={(e, newValue) =>
              setSelectedOperatorIds(newValue.map((op) => op._id))
            }            
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר מפעילים"
                margin="normal"
                fullWidth
              />
            )}
          />

          </FormGroup>

          <RadioGroup row value={type} onChange={(e) => setType(e.target.value as any)}>
            <FormControlLabel value="pdf" control={<Radio />} label="שליחת דוח PDF" />
            <FormControlLabel value="text" control={<Radio />} label="שליחת מייל רגיל" />
          </RadioGroup>

          {type === "pdf" && (
            <TextField
              label="חודש לדוח"
              type="month"
              fullWidth
              value={attendanceMonth}
              onChange={(e) => setAttendanceMonth(e.target.value)}
              margin="normal"
              required
            />
          )}

          {type === "text" && (
            <>
              <TextField
                label="נושא"
                fullWidth
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                label="תוכן ההודעה"
                fullWidth
                multiline
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                margin="normal"
                required
              />
            </>
          )}

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            שלח מיילים
          </Button>
        </form>

        {status === "success" && (
          <Alert severity="success" sx={{ mt: 2 }}>
            השליחה הסתיימה. להלן פירוט:
            <ul>
              {results.map((r) => (
                <li key={r.operatorId}>
                  {r.email} – {r.success ? "נשלח בהצלחה" : `שגיאה: ${r.error}`}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {status === "error" && (
          <Alert severity="error" sx={{ mt: 2 }}>שגיאה בשליחת המיילים.</Alert>
        )}

        {typeof status === "string" && status !== "success" && status !== "error" && (
          <Alert severity="warning" sx={{ mt: 2 }}>{status}</Alert>
        )}
      </Paper>
    </Box>
  );
};

export default EmailDashboardMulti;
