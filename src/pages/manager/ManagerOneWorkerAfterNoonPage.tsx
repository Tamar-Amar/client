import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import { useWorkerDocuments } from '../../queries/useDocuments';
import { useFetchWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { useAttendance } from '../../queries/useAttendance';
import { useFetchClasses } from '../../queries/classQueries';
import WorkerPersonalDocuments from '../../components/workers/documents/WorkerPersonalDocuments';
import WorkerAttendanceDocuments from '../../components/workers/documents/WorkerAttendanceDocuments';
import WorkerPersonalDetails from '../../components/workers/WorkerPersonalDetails';
import { WorkerCampReports } from '../../components/workers/WorkerCampReports';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CampIcon from '@mui/icons-material/OutdoorGrill';

const WorkerDocumentsApprovalPage: React.FC = () => {
  const { id: workerId } = useParams<{ id: string }>();
  const {
    documents,
    isLoading,
    isError,
    error,
    updateStatus,
    deleteDocument
  } = useWorkerDocuments(workerId || '');
  const { data: workerData } = useFetchWorkerAfterNoon(workerId as string);
  const { 
    workerAttendance: attendanceData, 
    isLoading: isAttendanceLoading,
  } = useAttendance(workerId || '');

  const { data: allClasses } = useFetchClasses();
  const [selectedTab, setSelectedTab] = useState<'documents' | 'personal' | 'afternoon-documents' | 'hanukah-camp' | 'passover-camp' | 'summer-camp'>('personal');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const isAfterNoonWorker = workerData?.projectCodes?.includes(1);
  const isSummerCampLeader = workerData?.roleName === 'מוביל' && workerData?.projectCodes?.includes(4) || workerData?.roleName === 'מדריך' && workerData?.projectCodes?.includes(4);

  React.useEffect(() => {
    if (!isAfterNoonWorker && selectedTab === 'afternoon-documents') {
      setSelectedTab('personal');
    }
  }, [isAfterNoonWorker, selectedTab]);

  const handleStatusUpdate = (docId: string, newStatus: any) => {
    updateStatus({ documentId: docId, status: newStatus });
  };

  const handleDelete = (docId: string) => {
    deleteDocument(docId);
  };

  return (
    <Box p={4} sx={{ bgcolor: '#f7f7fa', minHeight: '100vh' }}>
      <Box sx={{ marginLeft:'180px',  transition: 'margin 0.3s' }}>
        {selectedTab === 'documents' ? (
          <Box>
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}
              <WorkerPersonalDocuments
                documents={documents}
                handleStatusUpdate={handleStatusUpdate}
                handleDelete={handleDelete}
                is101={workerData?.is101 || false}
                workerId={workerId || ''}
                workerTz={workerData?.id || ''}
                workerRoleName={workerData?.roleName}
              />
          </Box>
        ) : selectedTab === 'personal' ? (
          <WorkerPersonalDetails workerData={workerData} classes={allClasses} />
        ) : selectedTab === 'hanukah-camp' ? (
            <Box>
                <Typography variant="h5" gutterBottom>קייטנת חנוכה</Typography>
                <Typography variant="body1" color="text.secondary">תוכן קייטנת חנוכה יוצג כאן</Typography>
            </Box>
        ) : selectedTab === 'passover-camp' ? (
            <Box>
                <Typography variant="h5" gutterBottom>קייטנת פסח</Typography>
                <Typography variant="body1" color="text.secondary">תוכן קייטנת פסח יוצג כאן</Typography>
            </Box>
        ) : selectedTab === 'summer-camp' ? (
            <WorkerCampReports workerId={workerId || ''} workerData={workerData} />
        ) : (
          <Box>
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}
              <WorkerAttendanceDocuments
                attendanceData={attendanceData}
                isAttendanceLoading={isAttendanceLoading}
                workerClasses={allClasses || []}
                workerId={workerId || ''}
              />
          </Box>
        )}
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        variant="persistent"
        sx={{
          width: '14%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: '14%',
            top: '65px',
            bgcolor: '#f7f7fa',
            borderRight: '4px solid #1976d2',
            boxShadow: 2,
          },
        }}
      >
        <List>
          <ListItem>
            <ListItemText
              primary={<Typography variant="h6" color="primary.main">{workerData?.firstName} {workerData?.lastName}</Typography>}
              secondary={<Typography variant="caption" color="text.secondary">תעודת זהות: {workerData?.id}</Typography>}
            />
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'personal'} onClick={() => setSelectedTab('personal')} sx={selectedTab === 'personal' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}>
              <PersonIcon sx={{ mr: 1 }} color={selectedTab === 'personal' ? 'primary' : 'action'} />
              <ListItemText primary="פרטים אישיים" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'documents'} onClick={() => setSelectedTab('documents')} sx={selectedTab === 'documents' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}>
              <DescriptionIcon sx={{ mr: 1 }} color={selectedTab === 'documents' ? 'primary' : 'action'} />
              <ListItemText primary="מסמכים אישיים" />
            </ListItemButton>
          </ListItem>
          {isSummerCampLeader && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'summer-camp'} onClick={() => setSelectedTab('summer-camp')} sx={selectedTab === 'summer-camp' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}>
                <WbSunnyIcon sx={{ mr: 1 }} color={selectedTab === 'summer-camp' ? 'primary' : 'action'} />
                <ListItemText primary="דוחות קייטנת קיץ" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.projectCodes?.includes(1) && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'afternoon-documents'} onClick={() => setSelectedTab('afternoon-documents')} sx={selectedTab === 'afternoon-documents' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}>
                <AssignmentIcon sx={{ mr: 1 }} color={selectedTab === 'afternoon-documents' ? 'primary' : 'action'} />
                <ListItemText primary="מסמכי צהרון" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.projectCodes?.includes(2) && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'hanukah-camp'} onClick={() => setSelectedTab('hanukah-camp')} sx={selectedTab === 'hanukah-camp' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}>
                <EventAvailableIcon sx={{ mr: 1 }} color={selectedTab === 'hanukah-camp' ? 'primary' : 'action'} />
                <ListItemText primary="קייטנת חנוכה" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.projectCodes?.includes(3) && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'passover-camp'} onClick={() => setSelectedTab('passover-camp')} sx={selectedTab === 'passover-camp' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}>
                <BeachAccessIcon sx={{ mr: 1 }} color={selectedTab === 'passover-camp' ? 'primary' : 'action'} />
                <ListItemText primary="קייטנת פסח" />
              </ListItemButton>
            </ListItem>
          )}

        </List>
      </Drawer>
    </Box>
  );
};

export default WorkerDocumentsApprovalPage;