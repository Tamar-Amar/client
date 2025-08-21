import React, { useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as XLSX from 'xlsx';
import { WorkerAfterNoon, Class } from '../../types';
import { Document as PersonalDocument } from '../../types/Document';

interface Props {
  open: boolean;
  onClose: () => void;
  workers: WorkerAfterNoon[];
  documents: PersonalDocument[];
  classes: Class[];
  getRequiredDocumentsForWorker: (worker: WorkerAfterNoon) => string[];
}

const PROJECT_OPTIONS = [
  { value: '1', label: 'צהרון שוטף 2025' },
  { value: '2', label: 'קייטנת חנוכה 2025' },
  { value: '3', label: 'קייטנת פסח 2025' },
  { value: '4', label: 'קייטנת קיץ 2025' },
];

const DownloadReportDialog: React.FC<Props> = ({ open, onClose, workers, documents, classes, getRequiredDocumentsForWorker }) => {
  const [selectedProject, setSelectedProject] = useState('');

  const filteredWorkers = useMemo(() => {
    if (!selectedProject) return workers;
    return workers.filter(worker => 
      worker.projectCodes && worker.projectCodes.includes(parseInt(selectedProject))
    );
  }, [workers, selectedProject]);

  const getWorkerClassInfo = (worker: WorkerAfterNoon) => {
    const workerClasses = classes.filter(cls => 
      Array.isArray(cls.workers) && cls.workers.some(w => w.workerId === worker._id)
    );
    
    const projectClass = workerClasses.find(cls => 
      cls.projectCodes && cls.projectCodes.includes(parseInt(selectedProject))
    );
    
    return {
      className: projectClass?.name || '',
      classSymbol: projectClass?.uniqueSymbol || '',
    };
  };

  const handleDownload = () => {
    if (!selectedProject) {
      alert('נא לבחור פרויקט');
      return;
    }

    const rows = filteredWorkers.map(worker => {
      const requiredDocs = getRequiredDocumentsForWorker(worker);
      const workerDocs = documents.filter(doc => doc.operatorId === worker._id);
      const { className, classSymbol } = getWorkerClassInfo(worker);
      const projectName = PROJECT_OPTIONS.find(p => p.value === selectedProject)?.label || '';
      
      const getDocStatus = (tag: string) => {
        const doc = workerDocs.find(d => d.tag === tag);
        if (!requiredDocs.includes(tag)) return '-----';
        return doc && doc.url ? '✓' : '✗';
      };
      
      return {
        'תעודת זהות': worker.id,
        'שם משפחה': worker.lastName,
        'שם פרטי': worker.firstName,
        'כתובת מייל': worker.email || '',
        'תפקיד': worker.roleName,
        'שם פרויקט': projectName,
        'סמל ': classSymbol,
        'סטטוס מסמך 101': worker.is101 ? 'כן' : 'לא',
        ' תעודת זהות': getDocStatus('תעודת זהות'),
        ' חוזה': getDocStatus('חוזה'),
        ' אישור משטרה': getDocStatus('אישור משטרה'),
        ' תעודת השכלה': getDocStatus('תעודת השכלה'),
        ' אישור וותק': getDocStatus('אישור וותק'),
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'דוח מסמכים');
    XLSX.writeFile(wb, `documents_report_${selectedProject}.xlsx`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>הורדת דוח מסמכים</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          בחר פרויקט להורדת הדוח:
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>פרויקט</InputLabel>
          <Select
            value={selectedProject}
            label="פרויקט"
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {PROJECT_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedProject && (
          <Typography variant="body2" color="text.secondary">
            יורדו {filteredWorkers.length} עובדים מהפרויקט הנבחר
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
        <Button 
          variant="contained" 
          onClick={handleDownload}
          disabled={!selectedProject}
        >
          הורד דוח
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadReportDialog; 