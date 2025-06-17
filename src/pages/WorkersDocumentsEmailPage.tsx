import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

import { useFetchAllDocuments } from "../queries/useDocuments";
import { WorkerAfterNoon } from "../types";
import { useFetchAllWorkersAfterNoon } from '../queries/workerAfterNoonQueries';

const REQUIRED_TAGS = ["אישור משטרה", "תעודת הוראה"];
const API_URL = process.env.REACT_APP_API_URL;

const WorkersDocumentsEmailPage: React.FC = () => {
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const { data: workers = [], isLoading } = useFetchAllWorkersAfterNoon();
  const { data: documents = [] } = useFetchAllDocuments();
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const documentsByWorkerId = useMemo(() => {
    const map = new Map<string, { tag: string; status: string }[]>();
    documents.forEach((doc) => {
      if (!map.has(doc.operatorId)) map.set(doc.operatorId, []);
      map.get(doc.operatorId)?.push({ tag: doc.tag, status: doc.status });
    });
    return map;
  }, [documents]);

  const workersMissingDocs = useMemo(() => {
    return workers.map((worker:WorkerAfterNoon) => {
      const workerDocs = documentsByWorkerId.get(worker._id) || [];
      const approvedTags = workerDocs.filter(d => d.status === "מאושר").map(d => d.tag);
      const missing = REQUIRED_TAGS.filter((tag) => !approvedTags.includes(tag));
      return { ...worker, missing };
    }).filter((w) => w.missing.length);
  }, [workers, documentsByWorkerId]);

  const handleSendEmails = async () => {
    const selected = selectedWorkerIds.length > 0
      ? workersMissingDocs.filter(w => selectedWorkerIds.includes(w._id))
      : workersMissingDocs;
  
    try {
      for (const worker of selected) {
        const res = await fetch(`${API_URL}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: worker.email,
            subject: "מסמכים חסרים",
            text: `שלום ${worker.firstName},\n\nנמצאו במסד הנתונים שלנו החסרים הבאים: ${worker.missing.join(", ")}.\nנא להשלים אותם בהקדם.\n\nתודה, צוות צעירון`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ccc;">
                <p><strong>שלום ${worker.firstName}</strong>,</p>
                <p>במערכת חסרים המסמכים הבאים:</p>
                <ul>
                  ${worker.missing.map(m => `<li style="color: #c62828;">${m}</li>`).join('')}
                </ul>
                <p><strong">נא להשלים אותם בהקדם דרך האזור האישי באתר.</strong></p>
                <p style="margin-top: 20px;">בברכה,<br/><span style="color: #1565c0;">צוות צעירון</span></p>
              </div>`
          }),
        });
  
        if (!res.ok) throw new Error(`בעיה בשליחת מייל ל־${worker.firstName}`);
      }
  
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };
  

  const handleSendToSingleWorker = async (workerId: string) => {
    const worker = workersMissingDocs.find(w => w._id === workerId);
    if (!worker) return;

    try {
      const res = await fetch(`${API_URL}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: worker.email,
          subject: "מסמכים חסרים",
          text: `שלום ${worker.firstName},\n\nנמצאו במסד הנתונים שלנו החסרים הבאים: ${worker.missing.join(", " )}.\nנא להשלים אותם בהקדם.\n\nתודה, צוות צעירון`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ccc;">
              <p>שלום <strong style="color: #2e7d32;">${worker.firstName}</strong>,</p>
              <p style="color: #c62828;">במערכת שלנו מופיעים המסמכים החסרים הבאים:</p>
              <ul>
                ${worker.missing.map(m => `<li style="color: #c62828;">${m}</li>`).join('')}
              </ul>
              <p><strong style="color: #1976d2;">נא להשלים אותם בהקדם דרך האזור האישי באתר.</strong></p>
              <p style="margin-top: 20px;">בברכה,<br/><span style="color: #1565c0;">צוות צעירון</span></p>
            </div>`
        })
      });
      const data = await res.json();
      setResults(data.results);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        שליחת מיילים לגבי מסמכים חסרים
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography sx={{ mb: 2 }}>
          נמצאו {workersMissingDocs.length} עובדים שחסר להם לפחות מסמך אחד (שטרם אושר):
        </Typography>

        <Box sx={{ maxHeight: 400, overflow: "auto", border: "1px solid #ccc", borderRadius: 1 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedWorkerIds.length === workersMissingDocs.length}
                      onChange={(e) => {
                        setSelectedWorkerIds(
                          e.target.checked
                            ? workersMissingDocs.map((w) => w._id)
                            : []
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell>שם העובד</TableCell>
                  <TableCell>ת.ז</TableCell>
                  <TableCell>מסמכים חסרים</TableCell>
                  <TableCell>פעולה</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workersMissingDocs.map((w) => (
                  <TableRow key={w._id}>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedWorkerIds.includes(w._id)}
                        onChange={(e) => {
                          setSelectedWorkerIds(prev =>
                            e.target.checked
                              ? [...prev, w._id]
                              : prev.filter(id => id !== w._id)
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>{w.firstName} {w.lastName}</TableCell>
                    <TableCell>{w.id}</TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => handleSendToSingleWorker(w._id)}>
                        שלח מייל לעובד
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Button variant="contained" color="primary" fullWidth sx={{ mt: 3 }} onClick={handleSendEmails}>
          שלח מייל לעובדים הנבחרים
        </Button>

        {status === "success" && (
          <Alert severity="success" sx={{ mt: 2 }}>
            המיילים נשלחו בהצלחה.
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ mt: 2 }}>
            שגיאה בשליחת המיילים.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default WorkersDocumentsEmailPage;
