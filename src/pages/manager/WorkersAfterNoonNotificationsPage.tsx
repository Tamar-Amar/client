import React, { useState, useMemo } from 'react';
import {
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Alert,
  AlertTitle,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import { useFetchAllWorkersAfterNoon } from "../../queries/workerAfterNoonQueries";
import { useFetchAllDocuments } from "../../queries/useDocuments";
import { useFetchClasses } from "../../queries/classQueries";
import { useFetchAllUsers } from "../../queries/useUsers";
import { useNavigate } from "react-router-dom";
import { Class } from '../../types';
import { WorkerAfterNoon } from '../../types';
import { DocumentStatus } from '../../types/Document';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';

// אייקונים
import PersonIcon from '@mui/icons-material/Person';
import ClassIcon from '@mui/icons-material/Class';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const REQUIRED_DOCUMENTS = ["אישור משטרה", "תעודת השכלה", "חוזה", "תעודת זהות"];

const PROJECT_OPTIONS = [
  { value: '', label: 'כל הפרויקטים' },
  { value: '1', label: 'צהרון שוטף 2025' },
  { value: '2', label: 'קייטנת חנוכה 2025' },
  { value: '3', label: 'קייטנת פסח 2025' },
  { value: '4', label: 'קייטנת קיץ 2025' },
];

// קומפוננטה חדשה להורדות דוחות
interface ReportsDownloadProps {
  workers: WorkerAfterNoon[];
  documents: any[];
  classes: Class[];
  selectedProject: string;
}

const ReportsDownload: React.FC<ReportsDownloadProps> = ({ workers, documents, classes, selectedProject }) => {
  // קבלת נתוני נוכחות קייטנה
  const { data: campAttendanceData = [] } = useQuery({
    queryKey: ['campAttendanceData'],
    queryFn: () => attendanceService.getCampAttendanceReports(),
    enabled: true
  });

  // קבלת נתוני משתמשים (לרכזים)
  const { data: allUsers = [] } = useFetchAllUsers();

  const filteredWorkers = useMemo(() => {
    if (!selectedProject) return workers;
    return workers.filter(worker => 
      worker.projectCodes && worker.projectCodes.includes(parseInt(selectedProject))
    );
  }, [workers, selectedProject]);

  const filteredClasses = useMemo(() => {
    if (!selectedProject) return classes;
    return classes.filter((classItem: Class) => 
      classItem.projectCodes && classItem.projectCodes.includes(parseInt(selectedProject))
    );
  }, [classes, selectedProject]);

  const getRequiredDocumentsForWorker = (worker: WorkerAfterNoon) => {
    return REQUIRED_DOCUMENTS;
  };

  const handleDownloadClassesReport = () => {
    if (!selectedProject) {
      alert('נא לבחור פרויקט');
      return;
    }

    const projectName = PROJECT_OPTIONS.find(p => p.value === selectedProject)?.label || '';
    
    const rows = filteredClasses.map(classItem => {
      // מצא עובדים לכיתה זו
      const classWorkers = filteredWorkers.filter(worker => 
        classItem.workers?.some(w => w.workerId === worker._id)
      );
      
      // מצא רכז לפי קוד מוסד
      const coordinator = allUsers.find((user: any) => 
        user.role === 'coordinator' && 
        user.projectCodes?.some((pc: any) => pc.institutionCode === classItem.institutionCode)
      );

      // מצא חשב שכר לפי קוד מוסד
      const salaryAccount = allUsers.find((user: any) => 
        user.role === 'accountant' && 
        user.accountantInstitutionCodes?.includes(classItem.institutionCode)
      );

      // מצא דוח נוכחות קייטנה לכיתה זו
      const campAttendanceRecord = campAttendanceData.find((record: any) => 
        record.classId?._id === classItem._id
      );
      
      // יצירת עמודות דינמיות לעובדים - רק שם ותז
      const workerColumns: any = {};
      classWorkers.forEach((worker, index) => {
        workerColumns[`עובד ${index + 1} - שם`] = `${worker.firstName} ${worker.lastName}`;
        workerColumns[`עובד ${index + 1} - תעודת זהות`] = worker.id;
        workerColumns[`עובד ${index + 1} - תפקיד`] = worker.roleName;
      });

      return {
        'קוד מוסד': classItem.institutionCode,
        'שם מוסד': classItem.institutionName,
        'סמל מסגרת': classItem.uniqueSymbol,
        'שם כיתה': classItem.name,
        'כתובת': classItem.address,
        'מגדר': classItem.gender || 'לא מוגדר',
        'סוג מסגרת': classItem.type || 'לא מוגדר',
        'רכז': coordinator ? `${coordinator.firstName} ${coordinator.lastName}` : 'לא נמצא',
        'חשב שכר': salaryAccount ? `${salaryAccount.firstName} ${salaryAccount.lastName}` : 'לא נמצא',
        'סהכ עובדים למסגרת': classWorkers.length,
        'פרויקט': projectName,
        'דוח נוכחות עובדים': campAttendanceRecord?.workerAttendanceDoc ? '✓' : '✗',
        'דוח נוכחות תלמידים': campAttendanceRecord?.studentAttendanceDoc ? '✓' : '✗',
        'דוחות בקרה': campAttendanceRecord?.controlDocs?.length || '0',
        ...workerColumns
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'דוח מסגרות');
    XLSX.writeFile(wb, `classes_report_${selectedProject}.xlsx`);
  };

  const handleDownloadDocumentsReport = () => {
    if (!selectedProject) {
      alert('נא לבחור פרויקט');
      return;
    }

    const rows = filteredWorkers.map(worker => {
      const requiredDocs = getRequiredDocumentsForWorker(worker);
      const workerDocs = documents.filter(doc => doc.operatorId === worker._id);
      const projectName = PROJECT_OPTIONS.find(p => p.value === selectedProject)?.label || '';
      
      // מצא כיתה של העובד
      const workerClass = filteredClasses.find(cls => 
        cls.workers?.some(w => w.workerId === worker._id)
      );
      
      // מצא חשב שכר לפי קוד מוסד של הכיתה
      const salaryAccount = workerClass ? allUsers.find((user: any) => 
        user.role === 'accountant' && 
        user.accountantInstitutionCodes?.includes(workerClass.institutionCode)
      ) : null;
      
      const getDocStatus = (tag: string) => {
        const doc = workerDocs.find(d => d.tag === tag);
        if (!requiredDocs.includes(tag)) return '-----';
        return doc && doc.url ? '✓' : '✗';
      };

      // לוגיקה מיוחדת לוותק - רק לרכזים
      const getVeteranStatus = () => {
        if (worker.roleName === 'רכז') {
          const doc = workerDocs.find(d => d.tag === 'אישור וותק');
          return doc && doc.url ? '✓' : '✗';
        }
        return '-----';
      };

      // לוגיקה מיוחדת לתעודת השכלה - לא נדרש לסייע/סייע משלים/מד״צ
      const getEducationStatus = () => {
        const rolesNotRequiringEducation = ['סייע', 'סייע משלים', 'מד״צ'];
        if (rolesNotRequiringEducation.includes(worker.roleName)) {
          return '-----';
        }
        const doc = workerDocs.find(d => d.tag === 'תעודת השכלה');
        return doc && doc.url ? '✓' : '✗';
      };

      
      return {
        'תעודת זהות עובד': worker.id,
        'שם משפחה': worker.lastName,
        'שם פרטי': worker.firstName,
        'מספר טלפון': worker.phone || '',
        'כתובת מייל': worker.email || '',
        'תפקיד': worker.roleName,
        'שם פרויקט': projectName,
        'קוד מוסד': workerClass?.institutionCode || '',
        'סמל כיתה': workerClass?.uniqueSymbol || '',
        'שם מסגרת': workerClass?.name || '',
        'סטטוס מסמך 101': worker.is101 ? 'כן' : 'לא',
        'סטטוס תעודת זהות': getDocStatus('תעודת זהות'),
        'חוזה': getDocStatus('חוזה'),
        'אישור משטרה': getDocStatus('אישור משטרה'),
        'תעודת השכלה': getEducationStatus(),
        'אישור וותק': getVeteranStatus(),
        'חשב שכר': salaryAccount ? `${salaryAccount.firstName} ${salaryAccount.lastName}` : 'לא נמצא',
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'דוח מסמכים');
    XLSX.writeFile(wb, `documents_report_${selectedProject}.xlsx`);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          הורדות דוחות Excel
        </Typography>
        
        {!selectedProject && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>בחירת פרויקט נדרשת</AlertTitle>
            יש לבחור פרויקט מהרשימה למעלה כדי להוריד דוחות Excel
          </Alert>
        )}
        
        {selectedProject && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>פרויקט נבחר: {PROJECT_OPTIONS.find(p => p.value === selectedProject)?.label}</AlertTitle>
            ניתן להוריד דוחות Excel עבור הפרויקט הנבחר
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<InsertDriveFileIcon sx={{ color: 'green' }} />}
              onClick={handleDownloadClassesReport}
              disabled={!selectedProject}
              sx={{ 
                py: 2, 
                fontWeight: 'bold',
                borderColor: 'green.main',
                color: 'green.main',
                '&:hover': {
                  borderColor: 'green.dark',
                  backgroundColor: 'green.50'
                }
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  דוח מסגרות
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedProject ? `${filteredClasses.length} מסגרות` : 'בחר פרויקט תחילה'}
                </Typography>
              </Box>
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<InsertDriveFileIcon sx={{ color: 'green' }} />}
              onClick={handleDownloadDocumentsReport}
              disabled={!selectedProject}
              sx={{ 
                py: 2, 
                fontWeight: 'bold',
                borderColor: 'green.main',
                color: 'green.main',
                '&:hover': {
                  borderColor: 'green.dark',
                  backgroundColor: 'green.50'
                }
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  דוח מסמכים לעובד
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedProject ? `${filteredWorkers.length} עובדים` : 'בחר פרויקט תחילה'}
                </Typography>
              </Box>
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

interface ClassDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  classItem: Class | null;
  workers: WorkerAfterNoon[];
}

const ClassDetailsDialog: React.FC<ClassDetailsDialogProps> = ({ open, onClose, classItem, workers }) => {
  if (!classItem) return null;

  const worker1 = workers.find(w => w._id === classItem.workers?.[0]?.workerId);
  const worker2 = workers.find(w => w._id === classItem.workers?.[1]?.workerId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" align="right">
          פרטי כיתה - {classItem.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" align="right" gutterBottom>
            פרטי מוסד
          </Typography>
          <Typography>קוד מוסד: {classItem.institutionCode}</Typography>
          <Typography>שם מוסד: {classItem.institutionName}</Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" align="right" gutterBottom>
            פרטי קבוצה
          </Typography>
          <Typography>שם קבוצה: {classItem.name}</Typography>
          <Typography>כתובת: {classItem.address}</Typography>
          <Typography>סמל: {classItem.uniqueSymbol}</Typography>
          <Typography>תאריך פתיחת צהרון: {
            classItem.AfternoonOpenDate ? 
              typeof classItem.AfternoonOpenDate === 'string' ? 
                new Date(classItem.AfternoonOpenDate).toLocaleDateString('he-IL') :
                classItem.AfternoonOpenDate.toLocaleDateString('he-IL')
              : 'לא מוגדר'
          }</Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" align="right" gutterBottom>
            עובדי צהרון
          </Typography>
          <Box sx={{ mb: 2 }}>
            {worker1 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography>עובד 1: {worker1.firstName} {worker1.lastName}</Typography>
                <Typography>טלפון: {worker1.phone}</Typography>
              </Box>
            )}
            {worker2 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography>עובד 2: {worker2.firstName} {worker2.lastName}</Typography>
                <Typography>טלפון: {worker2.phone}</Typography>
              </Box>
            )}
            {!worker1 && !worker2 && (
              <Alert severity="warning">
                אין עובדי צהרון מוגדרים
              </Alert>
            )}
          </Box>

          {classItem.coordinatorId ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" align="right" gutterBottom>
                רכז
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography>שם: {classItem.coordinatorId}</Typography>
              </Box>
            </>
          ) : (
            <Alert severity="info">אין רכז מוגדר</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
};

const WorkersAfterNoonNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<any>(null);
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchAllWorkersAfterNoon();
  const { data: documents = [] } = useFetchAllDocuments();
  const { data: classes = [] } = useFetchClasses();

  // סינון לפי פרויקט
  const filteredWorkers = useMemo(() => {
    if (!selectedProject) return workers;
    return workers.filter(worker => 
      worker.projectCodes && worker.projectCodes.includes(parseInt(selectedProject))
    );
  }, [workers, selectedProject]);

  const filteredClasses = useMemo(() => {
    if (!selectedProject) return classes;
    return classes.filter((classItem: Class) => 
      // בדוק אם יש עובדים בכיתה עם הפרויקט הנבחר
      classItem.workers?.some(w => w.project === parseInt(selectedProject)) ||
      // או אם הכיתה עצמה מוגדרת לפרויקט
      (classItem.projectCodes && classItem.projectCodes.includes(parseInt(selectedProject)))
    );
  }, [classes, selectedProject]);

  const filteredDocuments = useMemo(() => {
    if (!selectedProject) return documents;
    const filteredWorkerIds = filteredWorkers.map(w => w._id);
    return documents.filter(doc => filteredWorkerIds.includes(doc.operatorId));
  }, [documents, filteredWorkers]);

  // חישוב סטטיסטיקות כלליות
  const statistics = useMemo(() => {
    const totalWorkers = filteredWorkers.length;
    const activeWorkers = filteredWorkers.filter(w => w.isActive).length;
    const totalClasses = filteredClasses.length;
    const classesWithWorkers = filteredClasses.filter((c: Class) => c.workers && c.workers.length > 0).length;
    
    // חישוב מסמכים
    const workersWithAllDocs = filteredWorkers.filter(worker => {
      const workerDocs = filteredDocuments.filter(doc => doc.operatorId === worker._id);
      return REQUIRED_DOCUMENTS.every(tag => 
        workerDocs.some(doc => doc.tag === tag && doc.status === DocumentStatus.APPROVED)
      );
    }).length;

    const workersWithMissingDocs = filteredWorkers.filter(worker => {
      const workerDocs = filteredDocuments.filter(doc => doc.operatorId === worker._id);
      return REQUIRED_DOCUMENTS.some(tag => !workerDocs.some(doc => doc.tag === tag));
    }).length;

    // חישוב מסמכים לפי סטטוס
    const approvedDocs = filteredDocuments.filter(doc => doc.status === DocumentStatus.APPROVED).length;
    const pendingDocs = filteredDocuments.filter(doc => doc.status === DocumentStatus.PENDING).length;
    const rejectedDocs = filteredDocuments.filter(doc => doc.status === DocumentStatus.REJECTED).length;

    return {
      totalWorkers,
      activeWorkers,
      totalClasses,
      classesWithWorkers,
      workersWithAllDocs,
      workersWithMissingDocs,
      approvedDocs,
      pendingDocs,
      rejectedDocs,
      totalDocs: filteredDocuments.length
    };
  }, [filteredWorkers, filteredClasses, filteredDocuments]);

  // עובדים עם מסמכים חסרים
  const workersWithMissingDocs = useMemo(() => {
    return filteredWorkers.filter(worker => {
      const workerDocs = filteredDocuments.filter(doc => doc.operatorId === worker._id);
      return REQUIRED_DOCUMENTS.some(tag => !workerDocs.some(doc => doc.tag === tag));
    }).map(worker => ({
      ...worker,
      missing: REQUIRED_DOCUMENTS.filter(tag => 
        !filteredDocuments.some(doc => doc.operatorId === worker._id && doc.tag === tag)
      )
    }));
  }, [filteredWorkers, filteredDocuments]);

  // כיתות ללא עובדים
  const classesWithoutWorkers = useMemo(() => {
    return filteredClasses.filter((classItem: Class) => {
      return !classItem.workers || classItem.workers.length === 0;
    });
  }, [filteredClasses]);

  // עובדים ללא כיתה
  const workersWithoutClass = useMemo(() => {
    return filteredWorkers.filter(worker => {
      return !filteredClasses.some((c: Class) => 
        c.workers?.some(w => w.workerId === worker._id && w.project === parseInt(selectedProject))
      );
    });
  }, [filteredWorkers, filteredClasses, selectedProject]);

  // התראות חשובות
  const importantAlerts = useMemo(() => {
    const alerts = [];
    
    if (statistics.workersWithMissingDocs > 0) {
      alerts.push({
        type: 'error',
        title: 'מסמכים חסרים',
        message: `${statistics.workersWithMissingDocs} עובדים חסרים להם מסמכים נדרשים`,
        icon: <ErrorIcon />,
        showNotificationButton: true,
        details: {
          workers: workersWithMissingDocs,
          missingDocs: REQUIRED_DOCUMENTS
        }
      });
    }
    
    if (classesWithoutWorkers.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'כיתות ללא עובדים',
        message: `${classesWithoutWorkers.length} כיתות ללא עובדים מעודכנים לפרויקט`,
        icon: <WarningIcon />,
        showNotificationButton: false,
        details: {
          classes: classesWithoutWorkers
        }
      });
    }
    
    if (workersWithoutClass.length > 0) {
      alerts.push({
        type: 'info',
        title: 'עובדים ללא כיתה',
        message: `${workersWithoutClass.length} עובדים לא משויכים לכיתה`,
        icon: <InfoIcon />,
        showNotificationButton: false,
        details: {
          workers: workersWithoutClass
        }
      });
    }

    return alerts;
  }, [statistics, classesWithoutWorkers, workersWithoutClass]);

  if (isLoadingWorkers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>טוען...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, mt:5 }}>
      {/* סינון לפי פרויקט - מובלט יותר */}
      <Card sx={{ 
        mb: 3, 
        bgcolor: 'primary.50', 
        border: '2px solid', 
        borderColor: 'primary.main',
        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
        '&:hover': {
          boxShadow: '0 6px 25px rgba(25, 118, 210, 0.25)',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        }
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableChartIcon />
                בחירת פרויקט להורדת דוחות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                בחר פרויקט מהרשימה כדי להוריד דוחות Excel מפורטים
              </Typography>
            </Box>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel sx={{ fontWeight: 'bold' }}>בחר פרויקט</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="בחר פרויקט"
                sx={{ 
                  fontWeight: 'bold',
                  bgcolor: 'white',
                  '& .MuiSelect-select': {
                    fontWeight: 'bold'
                  }
                }}
              >
                {PROJECT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontWeight: 'bold' }}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* התראות חשובות */}
      {importantAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            {importantAlerts.map((alert, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Alert 
                  severity={alert.type as any}
                  icon={alert.icon}
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        color="inherit" 
                        size="small" 
                        onClick={() => {
                          setSelectedAlertDetails(alert);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        פרטים
                      </Button>
                      {alert.showNotificationButton && (
                        <Button color="inherit" size="small" onClick={() => navigate('/workers-email')}>
                          לשליחת התראות
                        </Button>
                      )}
                    </Box>
                  }
                >
                  <AlertTitle>{alert.title}</AlertTitle>
                  {alert.message}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* סטטיסטיקות כלליות */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  עובדים
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {statistics.totalWorkers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statistics.activeWorkers} פעילים
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(statistics.activeWorkers / statistics.totalWorkers) * 100} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ClassIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  מסגרות
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {statistics.totalClasses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statistics.classesWithWorkers} מהקבוצות מעודכנות עם עובדים
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(statistics.classesWithWorkers / statistics.totalClasses) * 100} 
                sx={{ mt: 1 }}
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.50', border: '2px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon sx={{ color: 'warning.main', mr: 1 }} />
                              <Typography variant="h6" fontWeight="bold">
                מסמכים ממתינים
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {statistics.pendingDocs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ממתינים לאישור
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(statistics.pendingDocs / statistics.totalDocs) * 100} 
              sx={{ mt: 1 }}
              color="warning"
            />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.50', border: '2px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  שלמות
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {statistics.workersWithAllDocs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                עם כל המסמכים
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(statistics.workersWithAllDocs / statistics.totalWorkers) * 100} 
                sx={{ mt: 1 }}
                color="info"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* הורדות דוחות */}
      <ReportsDownload 
        workers={workers} 
        documents={documents} 
        classes={classes} 
        selectedProject={selectedProject} 
      />
  
      <ClassDetailsDialog 
        open={!!selectedClass} 
        onClose={() => setSelectedClass(null)} 
        classItem={selectedClass}
        workers={workers}
      />

      {/* דיאלוג פרטי התראה */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedAlertDetails(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedAlertDetails?.icon}
            <Typography variant="h6">
              {selectedAlertDetails?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAlertDetails && (
            <Box sx={{ mt: 2 }}>
              {selectedAlertDetails.type === 'error' && selectedAlertDetails.details?.workers && (
                <Box>
                  <Typography variant="h6" gutterBottom color="error">
                    עובדים עם מסמכים חסרים:
                  </Typography>
                  <List>
                    {selectedAlertDetails.details.workers.map((worker: any) => (
                      <ListItem key={worker._id} divider>
                        <ListItemIcon>
                          <PersonIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${worker.firstName} ${worker.lastName}`}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                              {worker.missing.map((doc: string) => (
                                <Chip
                                  key={doc}
                                  label={doc}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          }
                        />
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/workers/${worker._id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedAlertDetails.type === 'warning' && selectedAlertDetails.details?.classes && (
                <Box>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    כיתות ללא עובדים:
                  </Typography>
                  <List>
                    {selectedAlertDetails.details.classes.map((classItem: Class) => (
                      <ListItem key={classItem._id} divider>
                        <ListItemIcon>
                          <ClassIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={classItem.name}
                          secondary={`סמל: ${classItem.uniqueSymbol} | ${classItem.institutionName}`}
                        />
                        <IconButton 
                          size="small"
                          onClick={() => setSelectedClass(classItem)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedAlertDetails.type === 'info' && selectedAlertDetails.details?.workers && (
                <Box>
                  <Typography variant="h6" gutterBottom color="info.main">
                    עובדים ללא כיתה:
                  </Typography>
                  <List>
                    {selectedAlertDetails.details.workers.map((worker: WorkerAfterNoon) => (
                      <ListItem key={worker._id} divider>
                        <ListItemIcon>
                          <PersonIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${worker.firstName} ${worker.lastName}`}
                          secondary={`ת.ז: ${worker.id} | ${worker.email}`}
                        />
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/workers/${worker._id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDetailsDialogOpen(false);
            setSelectedAlertDetails(null);
          }}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkersAfterNoonNotificationsPage; 