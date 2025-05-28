import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WorkerCreate from '../components/workers/WorkerCreate';
import WorkerDetails from '../components/workers/WorkerDetails';
import { useFetchWorker } from '../queries/workerQueries';
import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';

const WorkerDetailsWrapper = () => {
  const { id } = useParams();
  const { data: worker, isLoading } = useFetchWorker(id || '');

  if (isLoading) {
    return <Typography>טוען...</Typography>;
  }

  if (!worker) {
    return <Typography>עובד לא נמצא</Typography>;
  }

  return <WorkerDetails worker={worker} />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/workers/new" element={<WorkerCreate mode="create" />} />
      <Route path="/workers/edit/:id" element={<WorkerCreate mode="edit" />} />
      <Route path="/workers/:id" element={<WorkerDetailsWrapper />} />
      {/* ... other routes ... */}
    </Routes>
  );
};

export default AppRoutes; 