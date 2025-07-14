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
} from "@mui/material";
import { useFetchAllWorkersAfterNoon } from "../../queries/workerAfterNoonQueries";
import { useFetchAllDocuments } from "../../queries/useDocuments";
import { useFetchClasses } from "../../queries/classQueries";
import { useNavigate } from "react-router-dom";
import { Class } from '../../types';
import { WorkerAfterNoon } from '../../types';
import { DocumentStatus } from '../../types/Document';

// אייקונים
import PersonIcon from '@mui/icons-material/Person';
import ClassIcon from '@mui/icons-material/Class';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';

const REQUIRED_DOCUMENTS = ["אישור משטרה", "תעודת השכלה", "חוזה", "תעודת זהות"];

const PROJECT_OPTIONS = [
  { value: '', label: 'כל הפרויקטים' },
  { value: '1', label: 'צהרון שוטף 2025' },
  { value: '2', label: 'קייטנת חנוכה 2025' },
  { value: '3', label: 'קייטנת פסח 2025' },
  { value: '4', label: 'קייטנת קיץ 2025' },
];

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
      classItem.projectCodes && classItem.projectCodes.includes(parseInt(selectedProject))
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
        c.workers?.some(w => w.workerId === worker._id)
      );
    });
  }, [filteredWorkers, filteredClasses]);

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
      {/* סינון לפי פרויקט */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>סינון לפי פרויקט</InputLabel>
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            label="סינון לפי פרויקט"
          >
            {PROJECT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* התראות חשובות */}
      {importantAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            התראות חשובות
          </Typography>
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