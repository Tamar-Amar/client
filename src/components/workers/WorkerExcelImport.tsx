import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableViewIcon from '@mui/icons-material/TableView';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Worker } from '../../types';
import { useAddWorker } from '../../queries/workerQueries';

// Template for Excel file
const EXCEL_TEMPLATE = [
  {
    'תעודת זהות': '',
    'שם פרטי': '',
    'שם משפחה': '',
    'טלפון': '',
    'אימייל': '',
    'עיר': '',
    'רחוב': '',
    'מספר בית': '',
    'מספר דירה': '',
    'תאריך לידה': '',
    'אופן תשלום': 'תלוש',
  }
];

// Column mapping from Excel to Worker type
const COLUMN_MAPPING: { [key: string]: keyof Worker } = {
  'תעודת זהות': 'id',
  'שם פרטי': 'firstName',
  'שם משפחה': 'lastName',
  'טלפון': 'phone',
  'אימייל': 'email',
  'עיר': 'city',
  'רחוב': 'street',
  'מספר בית': 'buildingNumber',
  'מספר דירה': 'apartmentNumber',
  'תאריך לידה': 'birthDate',
  'אופן תשלום': 'paymentMethod'
};

const WorkerExcelImport: React.FC = () => {
  const [previewData, setPreviewData] = useState<Worker[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const addWorkerMutation = useAddWorker();

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(EXCEL_TEMPLATE);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תבנית');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'תבנית_עובדים.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Convert Excel data to Worker objects
      const workers: Worker[] = jsonData.map(row => {
        const worker: Partial<Worker> = {
          isActive: true,
          paymentMethod: 'תלוש'
        };

        // Map Excel columns to Worker properties
        Object.entries(COLUMN_MAPPING).forEach(([excelCol, workerProp]) => {
          if (row[excelCol] !== undefined) {
            worker[workerProp] = row[excelCol];
          }
        });

        return worker as Worker;
      });

      setPreviewData(workers);
      setShowPreview(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    try {
      for (const worker of previewData) {
        await addWorkerMutation.mutateAsync(worker);
      }
      setShowPreview(false);
      setPreviewData([]);
    } catch (error) {
      console.error('Error importing workers:', error);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          startIcon={<FileDownloadIcon />}
          onClick={downloadTemplate}
          variant="outlined"
          color="primary"
        >
          הורד תבנית אקסל
        </Button>
        <Button
          component="label"
          startIcon={<FileUploadIcon />}
          variant="outlined"
          color="primary"
        >
          העלה קובץ אקסל
          <input
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
        </Button>
      </Box>

      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>תצוגה מקדימה של העובדים</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            נמצאו {previewData.length} עובדים בקובץ האקסל. האם להוסיף אותם למערכת?
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>תעודת זהות</TableCell>
                  <TableCell>שם משפחה</TableCell>
                  <TableCell>שם פרטי</TableCell>
                  <TableCell>טלפון</TableCell>
                  <TableCell>אימייל</TableCell>
                  <TableCell>עיר</TableCell>
                  <TableCell>רחוב</TableCell>
                  <TableCell>אופן תשלום</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((worker, index) => (
                  <TableRow key={index}>
                    <TableCell>{worker.id}</TableCell>
                    <TableCell>{worker.lastName}</TableCell>
                    <TableCell>{worker.firstName}</TableCell>
                    <TableCell>{worker.phone}</TableCell>
                    <TableCell>{worker.email}</TableCell>
                    <TableCell>{worker.city}</TableCell>
                    <TableCell>{worker.street}</TableCell>
                    <TableCell>{worker.paymentMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>ביטול</Button>
          <Button onClick={handleImport} variant="contained" color="primary">
            אישור והוספה
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WorkerExcelImport; 