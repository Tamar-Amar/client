import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { WorkerAfterNoon } from '../../types';
import { validateDocumentFile } from '../../utils/fileValidation';

interface UploadTarget {
  workerId: string;
  workerName: string;
  workerTz: string;
  tag: string;
}

interface ManualUploadData {
  worker: WorkerAfterNoon | null;
  tag: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  uploadTarget: UploadTarget | null;
  manualUploadData: ManualUploadData;
  setManualUploadData: (data: ManualUploadData) => void;
  workers: WorkerAfterNoon[];
  onUpload: (formData: FormData) => void;
  isUploading: boolean;
}

const REQUIRED_DOC_TAGS = ['אישור משטרה', 'חוזה', 'תעודת זהות'];

const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({
  open,
  onClose,
  uploadTarget,
  manualUploadData,
  setManualUploadData,
  workers,
  onUpload,
  isUploading
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const validation = validateDocumentFile(file);
      
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    const isManual = !uploadTarget && manualUploadData.worker;
    const targetWorkerId = isManual ? manualUploadData.worker?._id : uploadTarget?.workerId;
    const targetTag = isManual ? manualUploadData.tag : uploadTarget?.tag;
    const targetTz = isManual ? manualUploadData.worker?.id : uploadTarget?.workerTz;

    if (!selectedFile || !targetWorkerId || !targetTag || !targetTz) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', targetWorkerId);
    formData.append('tag', targetTag);
    formData.append('documentType', targetTag);
    formData.append('tz', targetTz);

    if (expirationDate) {
      formData.append('expirationDate', expirationDate.toISOString());
    }

    onUpload(formData);
  };

  const handleClose = () => {
    onClose();
    setSelectedFile(null);
    setExpirationDate(null);
    setManualUploadData({ worker: null, tag: '' });
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {uploadTarget ? `העלאת מסמך: ${uploadTarget.tag}` : 'העלאת מסמך חדש'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1, minWidth: 400 }}>
          {uploadTarget ? (
            <Typography variant="body1">
              עבור: <strong>{uploadTarget.workerName}</strong>
            </Typography>
          ) : (
            <>
              <Autocomplete
                options={workers}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.id})`}
                value={manualUploadData.worker}
                onChange={(_, newValue) => setManualUploadData({ ...manualUploadData, worker: newValue })}
                renderInput={(params) => <TextField {...params} label="בחר עובד" />}
              />
              <FormControl fullWidth>
                <InputLabel>סוג מסמך</InputLabel>
                <Select
                  value={manualUploadData.tag}
                  label="סוג מסמך"
                  onChange={(e) => setManualUploadData({ ...manualUploadData, tag: e.target.value })}
                >
                  {(() => {
                    const normalizedRole = manualUploadData.worker?.roleName?.trim().replace(/\s+/g, ' ');
                    
                    let filteredDocTags = [...REQUIRED_DOC_TAGS];
                    
                    if (normalizedRole && (normalizedRole.includes('מוביל') || normalizedRole.includes('רכז'))) {
                      filteredDocTags.push('תעודת השכלה');
                    }
                    
                    if (normalizedRole && normalizedRole.includes('רכז')) {
                      filteredDocTags.push('אישור וותק');
                    }
                    
                    return filteredDocTags.map(tag => (
                      <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
            </>
          )}
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? selectedFile.name : 'בחר קובץ'}
          </Button>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <DatePicker
              label="תוקף (אופציונלי)"
              value={expirationDate}
              onChange={(newValue) => setExpirationDate(newValue)}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>ביטול</Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || (uploadTarget === null && (!manualUploadData.worker || !manualUploadData.tag))}
        >
          {isUploading ? <CircularProgress size={24} /> : 'העלה'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDocumentDialog; 