import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useFetchAllWorkersAfterNoon } from "../../queries/workerAfterNoonQueries";
import {  useFetchAllPersonalDocuments } from "../../queries/useDocuments";
import { WorkerAfterNoon } from "../../types";
import SendIcon from '@mui/icons-material/Send';


const REQUIRED_TAGS = ["אישור משטרה", "תעודת השכלה", "תעודת זהות", "חוזה"];
const API_URL = process.env.REACT_APP_API_URL;

const WorkersDocumentsEmailPage: React.FC = () => {
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const { data: workers = [], isLoading } = useFetchAllWorkersAfterNoon();
  const { data: documents = [] } = useFetchAllPersonalDocuments();
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<{success: string[], failed: string[]}>({ success: [], failed: [] });
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(15);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCustomEmail, setIsCustomEmail] = useState(false);

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

  const handleSendNotificationEmails = async () => {
    const selected = selectedWorkerIds.length > 0
      ? workersMissingDocs.filter(w => selectedWorkerIds.includes(w._id))
      : workersMissingDocs;
  
    setIsSending(true);
    const results = { success: [] as string[], failed: [] as string[] };
  
    try {
      for (const worker of selected) {
        try {
          const res = await fetch(`${API_URL}/api/email/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              from: '"צוות צעירון" <noreply@noreply.co.il>',
              replyTo: '"צוות צעירון" <amtamar747@gmail.com>',
              to: worker.email,
              subject: "מסמכים חסרים",
              text: `שלום ${worker.firstName},\n\nנמצאו במסד הנתונים שלנו החסרים הבאים: ${worker.missing.join(", ")}.\n${customMessage}\n\nתודה, צוות צעירון`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ccc;">
                  <p><strong>שלום ${worker.firstName}</strong>,</p>
                  <p>במערכת חסרים המסמכים הבאים:</p>
                  <ul>
                    ${worker.missing.map(m => `<li style="color: #c62828;">${m}</li>`).join('')}
                  </ul>
                  ${customMessage ? `<p style="margin: 15px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">${customMessage}</p>` : ''}
                  <p><strong>נא להשלים אותם בהקדם דרך האזור האישי באתר.</strong></p>
                  <p style="margin-top: 20px;">בברכה,<br/><span style="color: #1565c0;">צוות צעירון</span></p>
                </div>`
            }),
          });
    
          if (!res.ok) throw new Error(`בעיה בשליחת מייל ל־${worker.firstName}`);
          results.success.push(`${worker.firstName} ${worker.lastName} (${worker.email})`);
        } catch (err) {
          console.error(err);
          results.failed.push(`${worker.firstName} ${worker.lastName} (${worker.email})`);
        }
      }
  
      setResults(results);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCustomEmails = async () => {
    const selected = selectedWorkerIds.length > 0
      ? workersMissingDocs.filter(w => selectedWorkerIds.includes(w._id))
      : workersMissingDocs;
  
    setIsSending(true);
    const results = { success: [] as string[], failed: [] as string[] };
  
    try {
      for (const worker of selected) {
        try {
          const res = await fetch(`${API_URL}/api/email/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              from: '"צוות צעירון" <noreply@noreply.co.il>',
              replyTo: '"צוות צעירון" <amtamar747@gmail.com>',
              to: worker.email,
              subject: "הודעה אישית",
              text: `שלום ${worker.firstName},\n\n${customMessage}\n\nתודה, צוות צעירון`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ccc;">
                  <p><strong>שלום ${worker.firstName}</strong>,</p>
                  <div style="margin: 15px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                    ${customMessage.split('\n').map(line => `<p>${line}</p>`).join('')}
                  </div>
                  <p style="margin-top: 20px;">בברכה,<br/><span style="color: #1565c0;">צוות צעירון</span></p>
                </div>`
            }),
          });
    
          if (!res.ok) throw new Error(`בעיה בשליחת מייל ל־${worker.firstName}`);
          results.success.push(`${worker.firstName} ${worker.lastName} (${worker.email})`);
        } catch (err) {
          console.error(err);
          results.failed.push(`${worker.firstName} ${worker.lastName} (${worker.email})`);
        }
      }
  
      setResults(results);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const paginatedWorkers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return workersMissingDocs.slice(startIndex, startIndex + rowsPerPage);
  }, [workersMissingDocs, page, rowsPerPage]);

  const getEmailPreview = (worker: any) => `
    <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ccc;">
      <p><strong>שלום <u>שם עובד</u></strong>,</p>
      <p>במערכת חסרים המסמכים הבאים:</p>
      <ul>
        <li style="color: #c62828;">מסמך חסר</li>
        <li style="color: #c62828;">מסמך חסר</li>
      </ul>
      ${customMessage ? `<p style="margin: 15px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">${customMessage}</p>` : ''}
      <p><strong>נא להשלים אותם בהקדם דרך האזור האישי באתר.</strong></p>
      <p style="margin-top: 20px;">בברכה,<br/><span style="color: # 1565c0;">צוות צעירון</span></p>
    </div>
  `;

  const getCustomEmailPreview = () => `
    <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ccc;">
      <p><strong>שלום <u>שם עובד</u></strong>,</p>
      <div style="margin: 15px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
        ${customMessage.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
      <p style="margin-top: 20px;">בברכה,<br/><span style="color: #1565c0;">צוות צעירון</span></p>
    </div>
  `;

  const handleCloseDialog = () => {
    setIsPreviewDialogOpen(false);
    setCustomMessage("");
    setResults({ success: [], failed: [] });
    setIsCustomEmail(false);
  };

  return (
    <Box sx={{ mx: "auto", mt: 4, width: '80%' }}>
      <Typography sx={{ mb: 2 }}>
        נמצאו {workersMissingDocs.length} עובדים שחסר להם לפחות מסמך אחד (שטרם אושר):
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1, border: "1px solid #ccc", borderRadius: 1, backgroundColor: 'white' }}>
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 1, fontWeight: 'bold' }}>
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
                  <TableCell sx={{ backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 1, fontWeight: 'bold' }}>שם העובד</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 1, fontWeight: 'bold' }}>ת.ז</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 1, fontWeight: 'bold' }}>מסמכים חסרים</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedWorkers.map((w) => (
                  <TableRow key={w._id} sx={{ '& td': { py: 0.5 } }}>
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
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {w.missing.map((doc) => (
                          <Chip
                            key={doc}
                            label={doc}
                            color="error"
                            size="small"
                            sx={{ 
                              backgroundColor: '#ffebee',
                              color: '#c62828',
                              '& .MuiChip-label': {
                                fontWeight: 'bold'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={workersMissingDocs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
          />
        </Box>

        <Paper sx={{ width: 300, p: 2, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            שליחת מיילים
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            סה"כ עובדים נבחרו לשליחת מייל: {selectedWorkerIds.length}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            אפשרויות שליחה:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setIsPreviewDialogOpen(true)}
              disabled={selectedWorkerIds.length === 0}
              sx={{ justifyContent: 'flex-start', textAlign: 'right' }}
            >
              התראה על מסמכים חסרים
            </Button>

            <Button
              variant="outlined"
              color="primary"
              fullWidth
              disabled={selectedWorkerIds.length === 0}
              onClick={() => {
                setIsCustomEmail(true);
                setIsPreviewDialogOpen(true);
              }}
              sx={{ justifyContent: 'flex-start', textAlign: 'right' }}
            >
              שליחת מייל בהתאמה אישית
            </Button>
          </Box>

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

      <Dialog
        open={isPreviewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {results.success.length > 0 || results.failed.length > 0 
            ? "תוצאות שליחת המיילים" 
            : isCustomEmail 
              ? "שליחת מייל מותאם אישית"
              : "תצוגה מקדימה של המייל"}
        </DialogTitle>
        <DialogContent>
          {results.success.length === 0 && results.failed.length === 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                המייל יישלח ל-{selectedWorkerIds.length} עובדים
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={isCustomEmail ? 6 : 3}
                label={isCustomEmail ? "תוכן המייל" : "הודעה אישית (אופציונלי)"}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                sx={{ mb: 3 }}
                required={isCustomEmail}
                error={isCustomEmail && !customMessage}
                helperText={isCustomEmail && !customMessage ? "חובה להזין תוכן למייל" : ""}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                תצוגה מקדימה של מייל לדוגמא:
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                border: '1px solid #ccc', 
                borderRadius: 1,
                backgroundColor: '#f9f9f9'
              }}>
                <div dangerouslySetInnerHTML={{ 
                  __html: isCustomEmail 
                    ? getCustomEmailPreview()
                    : getEmailPreview(workersMissingDocs.find(w => w._id === selectedWorkerIds[0]) || workersMissingDocs[0])
                }} />
              </Box>
            </>
          ) : (
            <Box sx={{ mt: 2 }}>
              {results.success.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" color="success.main" sx={{ mb: 1 }}>
                    נשלח בהצלחה ({results.success.length}):
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid #4caf50', 
                    borderRadius: 1,
                    backgroundColor: '#e8f5e9',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    {results.success.map((name, index) => (
                      <Typography key={index} sx={{ mb: 0.5 }}>
                        {name}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {results.failed.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" color="error.main" sx={{ mb: 1 }}>
                    נכשל בשליחה ({results.failed.length}):
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid #f44336', 
                    borderRadius: 1,
                    backgroundColor: '#ffebee',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    {results.failed.map((name, index) => (
                      <Typography key={index} sx={{ mb: 0.5 }}>
                        {name}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {results.success.length > 0 || results.failed.length > 0 ? "סגור" : "ביטול"}
          </Button>
          {results.success.length === 0 && results.failed.length === 0 && (
            <Button 
              onClick={isCustomEmail ? handleSendCustomEmails : handleSendNotificationEmails} 
              variant="contained" 
              color="primary"
              disabled={isSending || (isCustomEmail && !customMessage)}
              startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            >
              {isSending ? "שולח..." : "שלח מיילים"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkersDocumentsEmailPage;
