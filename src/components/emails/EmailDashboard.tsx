import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  FormGroup,
  FormControlLabel,
  RadioGroup,
  Radio,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useFetchOperators } from "../../queries/operatorQueries";

interface Operator {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EmailLog {
  _id: string;
  date: string;
  type: "pdf" | "text";
  subject?: string;
  message?: string;
  month?: string;
  operatorIds: string[];
  results: {
    operatorId: string;
    email: string;
    success: boolean;
    error?: string;
  }[];
}

const EmailDashboardMulti = () => {
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);
  const [type, setType] = useState<"pdf" | "text">("pdf");
  const [attendanceMonth, setAttendanceMonth] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "https://server-manage.onrender.com";
  const { data: operators = [], isLoading } = useFetchOperators();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/email/logs`);
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error("שגיאה בטעינת לוגים", error);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, []);

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

  const operatorMap = useMemo(() => {
  const map: Record<string, string> = {};
  operators.forEach((op: Operator) => {
    map[op._id] = `${op.firstName} ${op.lastName}`;
  });
  return map;
}, [operators]);



  const handleOpenDialog = (log: EmailLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLog(null);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        שליחת מיילים למפעילים
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={operators}
              getOptionLabel={(op) => `${op.firstName} ${op.lastName}`}
              value={operators.filter((op: Operator) => selectedOperatorIds.includes(op._id))}
              onChange={(e, newValue) => setSelectedOperatorIds(newValue.map((op) => op._id))}
              renderInput={(params) => (
                <TextField {...params} label="בחר מפעילים" margin="normal" fullWidth />
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

      <Typography variant="h6" gutterBottom>היסטוריית שליחות</Typography>
      {loadingLogs ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>תאריך שליחה</TableCell>
                <TableCell>סוג</TableCell>
                <TableCell>נושא / חודש</TableCell>
                <TableCell>כמות נמענים</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>{new Date(log.date).toLocaleString('he-IL')}</TableCell>
                  <TableCell>{log.type === 'pdf' ? 'דוח PDF' : 'מייל רגיל'}</TableCell>
                  <TableCell>{log.type === 'pdf' ? log.month : log.subject}</TableCell>
                  <TableCell>{log.operatorIds.length}</TableCell>
                  <TableCell>
                    {log.results.every((r) => r.success) ? (
                      <Chip label="הצלחה מלאה" color="success" />
                    ) : (
                      <Chip
                        label={`שגיאות: ${log.results.filter((r) => !r.success).length}`}
                        color="error"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="הצג פרטים">
                      <IconButton onClick={() => handleOpenDialog(log)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>פרטי שליחה</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography>
                <strong>תאריך:</strong> {new Date(selectedLog.date).toLocaleString('he-IL')}
              </Typography>
              <Typography>
                <strong>סוג:</strong> {selectedLog.type === "pdf" ? "דוח PDF" : "מייל רגיל"}
              </Typography>
              {selectedLog.type === "pdf" && (
                <Typography><strong>חודש:</strong> {selectedLog.month}</Typography>
              )}
              {selectedLog.type === "text" && (
                <>
                  <Typography><strong>נושא:</strong> {selectedLog.subject}</Typography>
                  <Typography sx={{ whiteSpace: "pre-line" }}><strong>תוכן:</strong> {selectedLog.message}</Typography>
                </>
              )}
              <Typography sx={{ mt: 2 }}><strong>נמענים:</strong></Typography>
              <List dense>
                {selectedLog.results.map((r) => (
                  <ListItem key={r.operatorId}>
                    <ListItemText
                      primary={`${operatorMap[r.operatorId] || '—'} (${r.email || 'אין מייל'})`}
                      secondary={r.success ? '✔ נשלח בהצלחה' : `❌ ${r.error}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EmailDashboardMulti;
