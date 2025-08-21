import React, { useState, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  TextField,
  CircularProgress
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { DocumentType } from '../../types/Document';
import { WorkerWithClassInfo } from '../../types';
import axios from 'axios';

interface Props {
  open: boolean;
  onClose: () => void;
  worker: WorkerWithClassInfo | null;
  allWorkerDocuments: any[];
  refetchDocuments: () => Promise<any>;
  setDialogOpen: (open: boolean) => void;
}

const UploadWorkerDocumentDialog: React.FC<Props> = ({
  open,
  onClose,
  worker,
  allWorkerDocuments,
  refetchDocuments,
  setDialogOpen
}) => {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableDocTypes = useMemo(() => {
    if (!worker) return [];
    const normalizedRole = worker.roleName?.trim().replace(/\s+/g, ' ');
    const baseDocuments = [
      DocumentType.ID,
      DocumentType.POLICE_APPROVAL,
      DocumentType.CONTRACT
    ];
    let requiredDocuments = [...baseDocuments];
    if (normalizedRole && (normalizedRole.includes('מוביל') || normalizedRole.includes('רכז') || normalizedRole.includes('סגן רכז'))) {
      requiredDocuments.push(DocumentType.TEACHING_CERTIFICATE);
    }
    if (normalizedRole && normalizedRole.includes('רכז')) {
      requiredDocuments.push('אישור וותק' as any);
    }
    if (normalizedRole && (normalizedRole.includes('רכז') || normalizedRole.includes('סגן רכז'))) {
      requiredDocuments.push(DocumentType.CAMP_ATTENDANCE_COORDINATOR);
    }
    if (normalizedRole && normalizedRole.includes('מד"צ')) {
      requiredDocuments.push(DocumentType.MEDICAL_APPROVAL);
    }
    const workerDocs = allWorkerDocuments.filter(doc => doc.operatorId === worker._id);
    const existingTags = workerDocs.map(doc => doc.tag);
    return requiredDocuments.filter(tag => !existingTags.includes(tag));
  }, [worker, allWorkerDocuments]);

  const isDocExists = useMemo(() => {
    if (!worker || !selectedDocumentType) return false;
    const workerDocs = allWorkerDocuments.filter(doc => doc.operatorId === worker._id);
    return workerDocs.some(doc => doc.tag === selectedDocumentType);
  }, [worker, selectedDocumentType, allWorkerDocuments]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !worker || !selectedDocumentType) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('workerId', worker._id);
      formData.append('documentType', selectedDocumentType);
      formData.append('tz', worker.id);
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/documents/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.status === 201) {
        await refetchDocuments();
        setDialogOpen(false);
      }
    } catch (err) {
      alert('שגיאה בהעלאת הטופס');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setSelectedDocumentType('');
      setSelectedFile(null);
      setExpiryDate('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <DescriptionIcon color="primary" />
          <Typography variant="h6">
            העלאת טופס ל{worker?.firstName} {worker?.lastName}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>סוג טופס</InputLabel>
            <Select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              label="סוג טופס"
            >
              {availableDocTypes.length === 0 ? (
                <MenuItem disabled>כל סוגי המסמכים כבר הועלו</MenuItem>
              ) : (
                availableDocTypes.map(tag => (
                  <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>


          {isDocExists && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              לא ניתן להעלות מסמך מסוג זה מפני שקיים לעובד קובץ זהה במערכת.
            </Typography>
          )}

          <Box>
            <input
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="document-file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <label htmlFor="document-file">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<DescriptionIcon />}
                disabled={isDocExists}
              >
                {selectedFile ? selectedFile.name : 'בחר קובץ'}
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                נבחר: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            label="תאריך תפוגה (אופציונלי)"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            disabled={isDocExists}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          ביטול
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          color="primary"
          disabled={!selectedFile || !selectedDocumentType || loading || isDocExists}
          startIcon={loading ? <CircularProgress size={16} /> : <DescriptionIcon />}
        >
          {loading ? 'מעלה...' : 'העלה טופס'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadWorkerDocumentDialog; 