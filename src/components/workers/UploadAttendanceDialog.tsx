import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { format } from 'date-fns';
import { Class, WorkerAfterNoon } from '../../types';
import { useWorkerDocuments } from '../../queries/useDocuments';
import { useAttendance } from '../../queries/useAttendance';
import { useFetchWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';

interface UploadAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  workerId: string;
  workerClasses: Class[];
  attendanceData: any[];
  allWorkers?: WorkerAfterNoon[];
  onSuccess?: () => void;
}

const UploadAttendanceDialog: React.FC<UploadAttendanceDialogProps> = ({
  open,
  onClose,
  workerId,
  workerClasses,
  attendanceData,
  onSuccess
}) => {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentAttendanceFile, setStudentAttendanceFile] = useState<File | null>(null);
  const [workerAttendanceFile, setWorkerAttendanceFile] = useState<File | null>(null);
  const [controlFile, setControlFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadDocument } = useWorkerDocuments(workerId);
  const { submitAttendance } = useAttendance(workerId);
  const { data: workerData } = useFetchWorkerAfterNoon(workerId);

  const handleClose = () => {
    setSelectedMonth(null);
    setSelectedClass('');
    setStudentAttendanceFile(null);
    setWorkerAttendanceFile(null);
    setControlFile(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleFileUpload = (file: File, tag: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workerId', workerId);
      formData.append('tag', tag);
      formData.append('documentType', tag);
      formData.append('tz', workerData?.id as string);
      
      uploadDocument(formData, {
        onSuccess: (response) => resolve(response._id),
        onError: (error) => reject(error)
      });
    });
  };

  const handleSubmitAttendance = async () => {
    if (selectedMonth && selectedClass && studentAttendanceFile && workerAttendanceFile) {
      try {
        setIsSubmitting(true);
        const formattedMonth = format(selectedMonth, 'yyyy-MM');
        
        const existingRecord = attendanceData?.find((record: any) => {
          const recordMonth = format(new Date(record.month), 'yyyy-MM');
          const recordClassId = typeof record.classId === 'string' ? record.classId : record.classId._id;
          return recordMonth === formattedMonth && recordClassId === selectedClass;
        });

        if (existingRecord) {
          if (!window.confirm(`קיים כבר דיווח נוכחות לחודש ${format(selectedMonth, 'MMMM yyyy', { locale: he })} בכיתה זו. האם ברצונך להחליף אותו?`)) {
            setIsSubmitting(false);
            return;
          }
        }
        
        let studentAttendanceDocId: string | undefined;
        let workerAttendanceDocId: string | undefined;
        let controlDocId: string | undefined;

        if (studentAttendanceFile) {
          studentAttendanceDocId = await handleFileUpload(studentAttendanceFile, 'נוכחות תלמידים');
        }
        if (workerAttendanceFile) {
          workerAttendanceDocId = await handleFileUpload(workerAttendanceFile, 'נוכחות עובדים');
        }
        if (controlFile) {
          controlDocId = await handleFileUpload(controlFile, 'מסמך בקרה');
        }

        await submitAttendance({
          workerId: workerId,
          classId: selectedClass,
          month: formattedMonth,
          projectCode: 1,
          studentAttendanceDoc: studentAttendanceDocId,
          workerAttendanceDoc: workerAttendanceDocId,
          controlDoc: controlDocId,
        });

        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error submitting attendance:', error);
        alert('אירעה שגיאה בהעלאת הדיווח. אנא נסה שוב.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isFormValid = selectedMonth && selectedClass && studentAttendanceFile && workerAttendanceFile;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>דיווח נוכחות חודשית</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="בחר חודש"
                value={selectedMonth}
                onChange={(newValue) => setSelectedMonth(newValue)}
                views={['month', 'year']}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <Autocomplete<Class>
              options={workerClasses || []}
              getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
              value={workerClasses?.find((cls: Class) => cls._id === selectedClass) || null}
              onChange={(_, newValue) => setSelectedClass(newValue?._id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="בחר כיתה"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              מסמכי נוכחות
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              type="file"
              label="נוכחות תלמידים *"
              fullWidth
              required
              onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) setStudentAttendanceFile(file);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              type="file"
              label="נוכחות עובד *"
              fullWidth
              required
              onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) setWorkerAttendanceFile(file);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              type="file"
              label="מסמך בקרה (אופציונלי)"
              fullWidth
              onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) setControlFile(file);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          ביטול
        </Button>
        <Button 
          onClick={handleSubmitAttendance} 
          variant="contained" 
          disabled={!isFormValid || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting ? 'שולח...' : 'שלח דיווח'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadAttendanceDialog; 