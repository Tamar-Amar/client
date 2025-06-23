import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
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

  // בדיקה אם העובד שייך לפרויקט צהרון
  const isAfterNoonWorker = workerData?.isAfterNoon;

  // אם העובד לא שייך לפרויקט צהרון, נחזור לטאב פרטים אישיים
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
    <Box p={4}>
      <Box sx={{ marginLeft:'180px',  transition: 'margin 0.3s' }}>
        {selectedTab === 'documents' ? (
          <Box>
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}
            <Stack spacing={2} mt={3}>
              <WorkerPersonalDocuments
                documents={documents}
                handleStatusUpdate={handleStatusUpdate}
                handleDelete={handleDelete}
                is101={workerData?.is101 || false}
                workerId={workerId || ''}
                workerTz={workerData?.id || ''}
              />
            </Stack>
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
            <Box>
                <Typography variant="h5" gutterBottom>קייטנת קיץ</Typography>
                <Typography variant="body1" color="text.secondary">תוכן קייטנת קיץ יוצג כאן</Typography>
            </Box>
        ) : (
          <Box>
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}

            <Stack spacing={2} mt={3} >
              <WorkerAttendanceDocuments
                attendanceData={attendanceData}
                isAttendanceLoading={isAttendanceLoading}
                workerClasses={allClasses || []}
                workerId={workerId || ''}
              />
            </Stack>
          </Box>
        )}
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        variant="persistent"
        sx={{
          width: '10%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: '10%',
            top: '65px',
          },
        }}
      >
        <List> 
          <ListItem>
            <ListItemText 
              primary={`${workerData?.firstName} ${workerData?.lastName}`}
              secondary={`תעודת זהות: ${workerData?.id}`}
            />
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'personal'} onClick={() => setSelectedTab('personal')}>
              <ListItemText primary="פרטים אישיים" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'documents'} onClick={() => setSelectedTab('documents')}>
              <ListItemText primary="מסמכים אישיים" />
            </ListItemButton>
          </ListItem>
          {workerData?.isAfterNoon && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'afternoon-documents'} onClick={() => setSelectedTab('afternoon-documents')}>
                <ListItemText primary="מסמכי צהרון" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.isHanukaCamp && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'hanukah-camp'} onClick={() => setSelectedTab('hanukah-camp')}>
                <ListItemText primary="קייטנת חנוכה" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.isPassoverCamp && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'passover-camp'} onClick={() => setSelectedTab('passover-camp')}>
                <ListItemText primary="קייטנת פסח" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.isSummerCamp && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'summer-camp'} onClick={() => setSelectedTab('summer-camp')}>
                <ListItemText primary="קייטנת קיץ" />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Drawer>
    </Box>
  );
};

export default WorkerDocumentsApprovalPage;