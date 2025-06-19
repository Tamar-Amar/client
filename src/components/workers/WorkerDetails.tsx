import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import WorkerDocuments from './WorkerDocuments';
import { WorkerAfterNoon } from '../../types';
import WorkerSchedule from './WorkerSchedule';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`worker-tabpanel-${index}`}
      aria-labelledby={`worker-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Props {
  worker: WorkerAfterNoon;
  onUpdate?: () => void;
}

const WorkerDetails: React.FC<Props> = ({ worker, onUpdate }) => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/workers/edit/${worker._id}`);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h1">
            {worker.firstName} {worker.lastName}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            ערוך עובד
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">תעודת זהות</Typography>
            <Typography variant="body1">{worker.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">טלפון</Typography>
            <Typography variant="body1">{worker.phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">אימייל</Typography>
            <Typography variant="body1">{worker.email || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="worker management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="תגיות" />
          <Tab label="מסמכים" />
        </Tabs>


        <TabPanel value={tabValue} index={1}>
          <WorkerDocuments workerId={worker._id} />
        </TabPanel>

      </Paper>

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <WorkerSchedule workerId={worker._id} />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default WorkerDetails; 