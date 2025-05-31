import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import OperatorsPage from '../pages/OperatorsPage';
import InstitutionsPage from '../pages/InstitutionsPage';
import ClassesPage from '../pages/ClassesPage';
import ActivitiesPage from '../pages/ActivitiesPage';
import InvoicesPage from '../pages/InvoicesPage';
import PurchasesPage from '../pages/PurchasesPage';
import LoginPage from '../pages/LoginPage';
import PersonalDetails from '../components/other/PersonalDetails';
import ActivityHistory from '../components/activities/ActivityHistory';
import ProtectedRoute from '../components/other/ProtectedRoute';
import OperatorDetails from '../components/operators/OperatorDetails';
import ContactList from '../components/other/ContactList';
import EmailPage from '../pages/EmailPage';
import PublicReportPage from '../components/activities/addActivity/PublicReportPage';
import { jwtDecode } from 'jwt-decode';
import PersonalDocuments from '../components/operators/PersonalDocuments';
import WorkersPage from '../pages/WorkersPage';
import WorkerEditPage from '../components/workers/WorkerEditPage';
import { useFetchWorker } from '../queries/workerQueries';
import WorkerDetails from '../components/workers/WorkerDetails';
import DocumentManagementPage from '../pages/DocumentManagementPage';
import TagManagement from '../components/tags/TagManagement';

const OperatorDocumentsWrapper = () => {
  const token = localStorage.getItem('token');
  const decodedToken: any = token ? jwtDecode(token) : null;
  const operatorId = decodedToken?.id;

  return <PersonalDocuments operatorId={operatorId} />;
};

const WorkerEditWrapper = () => {
  const { id } = useParams();

  return <WorkerEditPage workerId={id || ''} />;
};

const WorkerDetailsWrapper = () => {
  const { id } = useParams();
  const { data: worker, isLoading } = useFetchWorker(id || '');

  if (isLoading) {
    return <div>טוען...</div>;
  }

  if (!worker) {
    return <div>לא נמצא עובד</div>;
  }

  return <WorkerDetails worker={worker} />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/public-report" element={<PublicReportPage />} />
      <Route path="*" element={<div>404</div>} />
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/operators" element={<OperatorsPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/workers/edit/:id" element={<WorkerEditWrapper />} />
        <Route path="/institutions" element={<InstitutionsPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/documents" element={<DocumentManagementPage />} />
        <Route path="/tags" element={<TagManagement />} />
        <Route path="/invoices" element={<InvoicesPage/>}/>
        <Route path="/purchases" element={<PurchasesPage/>}/>
        <Route path="/operators/:id" element={<OperatorDetails />} />
        <Route path="/contacts" element={<ContactList />} />
        <Route path="/emails" element={<EmailPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
        <Route path="/personal-details" element={<PersonalDetails/>} />
        <Route path="/activity-history" element={<ActivityHistory/>} />
        <Route path="/personal-documents" element={<OperatorDocumentsWrapper />} />
      </Route>

    </Routes>
  );
};

export default AppRoutes;
