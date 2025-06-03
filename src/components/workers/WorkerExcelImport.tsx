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
import ArticleIcon from '@mui/icons-material/Article';
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
    'פעיל': 'כן',
    'תאריך הרשמה': new Date().toISOString().split('T')[0],
    'הערות': '',
    // Bank Details
    'שם בנק': '',
    'מספר סניף': '',
    'מספר חשבון': '',
    'שם בעל החשבון': '',
  }
];

// Column mapping from Excel to Worker type
const COLUMN_MAPPING: { [key: string]: keyof Worker | string } = {
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
  'אופן תשלום': 'paymentMethod',
  'פעיל': 'isActive',
  'תאריך הרשמה': 'registrationDate',
  'הערות': 'notes',
  'שם בנק': 'bankDetails.bankName',
  'מספר סניף': 'bankDetails.branchNumber',
  'מספר חשבון': 'bankDetails.accountNumber',
  'שם בעל החשבון': 'bankDetails.accountOwner'
};

const convertRowToWorker = (row: any): Worker => {
  const worker: Partial<Worker> = {
    isActive: true, // Default to true
    paymentMethod: row['אופן תשלום'] || 'תלוש',
    bankDetails: {
      bankName: '',
      branchNumber: '',
      accountNumber: '',
      accountOwner: ''
    }
  };

  // Map Excel columns to Worker properties
  Object.entries(COLUMN_MAPPING).forEach(([excelCol, workerProp]) => {
    if (row[excelCol] === undefined) return;
    
    if (typeof workerProp === 'string') {
      // Special handling for isActive field
      if (workerProp === 'isActive') {
        worker.isActive = row[excelCol]?.toString().trim().toLowerCase() === 'כן';
        return;
      }

      // Special handling for birthDate field
      if (workerProp === 'birthDate') {
        const dateValue = row[excelCol];
        if (dateValue) {
          let date: Date | null = null;

          // Try to parse as DD/MM/YYYY format
          if (typeof dateValue === 'string') {
            const [day, month, year] = dateValue.trim().split('/');
            if (day && month && year) {
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }
          // Try to parse Excel's internal date number
          else if (typeof dateValue === 'number') {
            // Excel's date system starts from December 30, 1899
            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + (dateValue * 24 * 60 * 60 * 1000));
          }

          if (date && !isNaN(date.getTime())) {
            worker.birthDate = date.toISOString().split('T')[0];
            return;
          }

          // If date parsing failed, throw an error
          throw new Error(`תאריך לידה לא תקין: ${dateValue}. יש להזין בפורמט DD/MM/YYYY (לדוגמה: 15/02/2004)`);
        }
        // If no date provided, throw an error
        throw new Error(`תאריך לידה הוא שדה חובה`);
      }

      if (workerProp.includes('.')) {
        // Handle nested properties (e.g. bankDetails.bankName)
        const [parent, child] = workerProp.split('.');
        if (!worker[parent as keyof Worker]) {
          (worker[parent as keyof Worker] as any) = {};
        }
        ((worker[parent as keyof Worker] as any)[child]) = row[excelCol];
      } else {
        (worker[workerProp as keyof Worker] as any) = row[excelCol];
      }
    }
  });

  return worker as Worker;
};

const WorkerExcelImport: React.FC = () => {
  const [previewData, setPreviewData] = useState<Worker[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const addWorkerMutation = useAddWorker();

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(EXCEL_TEMPLATE);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תבנית');

    // Add data validation and comments
    if (!ws['!cols']) ws['!cols'] = [];
    if (!ws['!rows']) ws['!rows'] = [];

    // Find birthDate column index
    const birthDateColIndex = Object.keys(EXCEL_TEMPLATE[0]).indexOf('תאריך לידה');
    
    // Add column width and comments
    if (birthDateColIndex !== -1) {
      ws['!cols'][birthDateColIndex] = { width: 15 };
    }
    
    // Add comment to birthDate column
    ws['!comments'] = {
      'B1': { t: 'שדה חובה! הכנס תאריך בפורמט: DD/MM/YYYY\nלדוגמה: 15/02/2004' }
    };

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'תבנית_עובדים.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Convert Excel data to Worker objects
        const workers = jsonData.map((row, index) => {
          try {
            return convertRowToWorker(row);
          } catch (err) {
            const error = err as Error;
            throw new Error(`שגיאה בשורה ${index + 1}: ${error.message}`);
          }
        });

        setPreviewData(workers);
        setShowPreview(true);
      } catch (err) {
        const error = err as Error;
        alert(`שגיאה בקריאת הקובץ: ${error.message}`);
      }
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
          startIcon={<ArticleIcon />}
          onClick={downloadTemplate}
          variant="outlined"
          sx={{
            color: '#2e7d32',
            borderColor: '#2e7d32',
            '&:hover': {
              borderColor: '#1b5e20',
              color: '#1b5e20',
              backgroundColor: 'transparent'
            },
          }}
        >
          הורד תבנית אקסל
        </Button>
        <Button
          component="label"
          startIcon={<ArticleIcon />}
          variant="outlined"
          sx={{
            color: '#2e7d32',
            borderColor: '#2e7d32',
            '&:hover': {
              borderColor: '#1b5e20',
              color: '#1b5e20',
              backgroundColor: 'transparent'
            },
          }}
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