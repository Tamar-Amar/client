import React from 'react';
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
} from "@mui/material";
import { useFetchAllWorkersAfterNoon } from "../../queries/workerAfterNoonQueries";
import { useFetchAllDocuments } from "../../queries/useDocuments";
import { useFetchClasses } from "../../queries/classQueries";

import {useMemo } from "react";
import PersonIcon from '@mui/icons-material/Person';
import ClassIcon from '@mui/icons-material/Class';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';

import { useNavigate } from "react-router-dom";
import { Class } from '../../types';
import { WorkerAfterNoon } from '../../types';

const REQUIRED_TAGS = ["אישור משטרה", "תעודת הוראה"];

const WorkersAfterNoonNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchAllWorkersAfterNoon();
  const { data: documents = [] } = useFetchAllDocuments();
  const { data: classes = [] } = useFetchClasses();
  const { data: allWorkers = [] } = useFetchAllWorkersAfterNoon();

  // מסמכים חסרים לעובדים
  const workersWithMissingDocs = useMemo(() => {
    return workers.filter(worker => {
      const workerDocs = documents.filter(doc => doc.operatorId === worker._id);
      return REQUIRED_TAGS.some(tag => !workerDocs.some(doc => doc.tag === tag));
    }).map(worker => ({
      ...worker,
      missing: REQUIRED_TAGS.filter(tag => 
        !documents.some(doc => doc.operatorId === worker._id && doc.tag === tag)
      )
    }));
  }, [workers, documents]);

  // כיתות ללא עובד מעודכן
  const classesWithoutUpdatedWorker = useMemo(() => {
    return classes.filter((classItem: Class) => {
      const worker1 = allWorkers.find(w => w._id === classItem.workerAfterNoonId1);
      const worker2 = allWorkers.find(w => w._id === classItem.workerAfterNoonId2);
      return (!classItem.workerAfterNoonId1 && !classItem.workerAfterNoonId2) || 
             (!worker1 && !worker2) || 
             (!worker1?.isActive && !worker2?.isActive);
    });
  }, [classes, allWorkers]);

  // עובדים ללא כיתה
  const workersWithoutClass = useMemo(() => {
    return workers.filter(worker => {
      return !classes.some((c: Class) => 
        c.workerAfterNoonId1 === worker._id || 
        c.workerAfterNoonId2 === worker._id
      );
    });
  }, [workers, classes]);

  if (isLoadingWorkers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>טוען...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 9}}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        התראות מערכת
      </Typography>

      <Grid container spacing={2}>
        {/* התראות מסמכים חסרים */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3}
            sx={{ 
              height: '100%',
              borderTop: '4px solid #f44336',
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#f44336' }}>
                  <DescriptionIcon />
                </Avatar>
              }
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">מסמכים אישיים חסרים</Typography>
                  <Chip 
                    label={workersWithMissingDocs.length} 
                    color="error" 
                    size="small"
                  />
                </Box>
              }
              action={
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/workers-documents-email')}
                  sx={{
                    marginRight: '10px'
                  }}
                >
                  מעבר לעמוד שליחת מיילים
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <List sx={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                '& .MuiListItem-root': {
                  py: 0.5
                }
              }}>
                {workersWithMissingDocs.map((worker) => (
                  <ListItem key={worker._id} dense>
                    <ListItemIcon 
                      sx={{ 
                        minWidth: '40px',
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                      onClick={() => navigate(`/workers-documents/${worker._id}`)}
                    >
                      <PersonIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${worker.firstName} ${worker.lastName}`}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {worker.missing.map((doc) => (
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
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* התראות כיתות ללא עובד */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3}
            sx={{ 
              height: '100%',
              borderTop: '4px solid #ff9800',
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#ff9800' }}>
                  <ClassIcon />
                </Avatar>
              }
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">כיתות ללא עובד מעודכן</Typography>
                  <Chip 
                    label={classesWithoutUpdatedWorker.length} 
                    color="warning" 
                    size="small"
                  />
                </Box>
              }
            />
            <Divider />
            <CardContent>
              <List sx={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                '& .MuiListItem-root': {
                  py: 0.5
                }
              }}>
                {classesWithoutUpdatedWorker.map((classItem: Class) => (
                  <ListItem key={classItem._id} dense>
                    <ListItemIcon sx={{ minWidth: '40px' }}>
                      <ClassIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={classItem.name}
                      secondary={`סמל ${classItem.uniqueSymbol}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* התראות עובדים ללא כיתה */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3}
            sx={{ 
              height: '100%',
              borderTop: '4px solid #2196f3',
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#2196f3' }}>
                  <PersonIcon />
                </Avatar>
              }
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">עובדים ללא כיתה</Typography>
                  <Chip 
                    label={workersWithoutClass.length} 
                    color="info" 
                    size="small"
                  />
                </Box>
              }
            />
            <Divider />
            <CardContent>
              <List sx={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                '& .MuiListItem-root': {
                  py: 0.5
                }
              }}>
                {workersWithoutClass.map((worker:WorkerAfterNoon) => (
                  <ListItem key={worker._id} dense>
                    <ListItemIcon 
                      sx={{ 
                        minWidth: '40px',
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                      onClick={() => navigate(`/workers-documents/${worker._id}`)}
                    >
                      <PersonIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${worker.firstName} ${worker.lastName}`}
                      secondary={worker.email}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkersAfterNoonNotificationsPage; 