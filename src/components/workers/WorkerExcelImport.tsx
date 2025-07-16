import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import ArticleIcon from '@mui/icons-material/Article';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { WorkerAfterNoon } from '../../types';
import { useAddWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';


const EXCEL_TEMPLATE = [
  {
    'תעודת זהות': '',
    'שם פרטי': '',
    'שם משפחה': '',
    'טלפון': '',
    'אימייל': '',
    'פעיל': 'כן',
    'תאריך הרשמה': new Date().toISOString().split('T')[0],
    'הערות': '',
    'שם תפקיד': '',
    'תאריך התחלה': '',
    'תאריך סיום': '',
    'סטטוס': '',

  }
];


const COLUMN_MAPPING: { [key: string]: keyof WorkerAfterNoon | string } = {
  'תעודת זהות': 'id',
  'שם פרטי': 'firstName',
  'שם משפחה': 'lastName',
  'טלפון': 'phone',
  'אימייל': 'email',
  'פעיל': 'isActive',
  'תאריך הרשמה': 'createDate',
  'הערות': 'notes',
  'שם תפקיד': 'roleName',
  'תאריך התחלה': 'startDate',
  'תאריך סיום': 'endDate',
  'סטטוס': 'status',
};

const convertRowToWorker = (row: any): WorkerAfterNoon => {
  const worker: Partial<WorkerAfterNoon> = {
    isActive: true, 
  };


  Object.entries(COLUMN_MAPPING).forEach(([excelCol, workerProp]) => {
    if (row[excelCol] === undefined) return;
    
    if (typeof workerProp === 'string') {


      if (workerProp === 'startDate') {
        const dateValue = row[excelCol];
        if (dateValue) {
          let date: Date | null = null;


          if (typeof dateValue === 'string') {
            const [day, month, year] = dateValue.trim().split('/');
            if (day && month && year) {
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }

          else if (typeof dateValue === 'number') {

            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + (dateValue * 24 * 60 * 60 * 1000));
          }
        }

      }

      if (workerProp.includes('.')) {

        const [parent, child] = workerProp.split('.');
        if (!worker[parent as keyof WorkerAfterNoon]) {
          (worker[parent as keyof WorkerAfterNoon] as any) = {};
        }
        ((worker[parent as keyof WorkerAfterNoon] as any)[child]) = row[excelCol];
      } else {
        (worker[workerProp as keyof WorkerAfterNoon] as any) = row[excelCol];
      }
    }
  }); 

  return worker as WorkerAfterNoon;
};

const WorkerExcelImport: React.FC = () => {
  const [previewData, setPreviewData] = useState<WorkerAfterNoon[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const addWorkerMutation = useAddWorkerAfterNoon();

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(EXCEL_TEMPLATE);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תבנית');


    if (!ws['!cols']) ws['!cols'] = [];
    if (!ws['!rows']) ws['!rows'] = [];


    const birthDateColIndex = Object.keys(EXCEL_TEMPLATE[0]).indexOf('תאריך לידה');
    

    if (birthDateColIndex !== -1) {
      ws['!cols'][birthDateColIndex] = { width: 15 };
    }
    
    
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
                  <TableCell>שם תפקיד</TableCell>
                  <TableCell>תאריך התחלה</TableCell>
                  <TableCell>תאריך סיום</TableCell>
                  <TableCell>סטטוס</TableCell>
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
                    <TableCell>{worker.roleName}</TableCell>
                    <TableCell>{worker.startDate.toISOString().split('T')[0]}</TableCell>
                    <TableCell>{worker.endDate.toISOString().split('T')[0]}</TableCell>
                    <TableCell>{worker.status}</TableCell>
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