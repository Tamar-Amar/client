import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import OperatorsPage from '../pages/OperatorsPage';
import ClassesPage from '../pages/ClassesPage';
import ActivitiesPage from '../pages/ActivitiesPage';
import InvoicesPage from '../pages/InvoicesPage';
import PurchasesPage from '../pages/PurchasesPage';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import PersonalDetails from '../components/other/PersonalDetails';
import ActivityHistory from '../components/activities/ActivityHistory';
import ProtectedRoute from '../components/other/ProtectedRoute';
import OperatorDetails from '../components/operators/OperatorDetails';
import EmailPage from '../pages/EmailPage';
import PublicReportPage from '../components/activities/addActivity/PublicReportPage';
import { jwtDecode } from 'jwt-decode';
import PersonalDocuments from '../components/operators/PersonalDocuments';
import DocumentManagementPage from '../pages/DocumentManagementPage';
import WorkerProfilePage from '../pages/WorkerProfilePage';
import WorkersPage from '../pages/manager/WorkersPage';
import WorkerDocumentsApprovalPage from '../pages/manager/ManagerOneWorkerAfterNoonPage';
import WorkersDocumentsEmailPage from '../pages/manager/WorkersEmailPage';
import WorkerAttendancePage from '../pages/manager/WorkerAllAttendancesPage';
import WorkersAfterNoonEmailPage from '../pages/manager/WorkersEmailPage';
import WorkersAfterNoonNotificationsPage from '../pages/manager/WorkersAfterNoonNotificationsPage';
import MatsevetPage from '../pages/MatsevetPage';
import UsersManagementPage from '../pages/UsersManagementPage';
import CoordinatorDashboardPage from '../pages/CoordinatorDashboardPage';
import AccountantDashboardPage from '../pages/AccountantDashboardPage';
import MatsevetEditPage from '../pages/MatsevetEditPage';

const OperatorDocumentsWrapper = () => {
  const token = localStorage.getItem('token');
  const decodedToken: any = token ? jwtDecode(token) : null;
  const operatorId = decodedToken?.id;

  return <PersonalDocuments operatorId={operatorId} />;
};



const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/public-report" element={<PublicReportPage />} />
      <Route path="*" element={<div>404</div>} />

      <Route element={<ProtectedRoute allowedRoles={['manager_project', 'admin', 'accountant']} />}>
        <Route path="/documents" element={<DocumentManagementPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/workers/:id" element={<WorkerDocumentsApprovalPage />} />
        <Route path="/workers-email" element={<WorkersDocumentsEmailPage />} />
        <Route path="/worker-attendance" element={<WorkerAttendancePage />} />
        <Route path="/workers-after-noon-email" element={<WorkersAfterNoonEmailPage />} />
        <Route path="/workers-after-noon-notifications" element={<WorkersAfterNoonNotificationsPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/matsevet" element={<MatsevetPage />} />
        <Route path="/users" element={<UsersManagementPage />} />
        <Route path="/matsevet/edit" element={<MatsevetEditPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/operators" element={<OperatorsPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/invoices" element={<InvoicesPage/>}/>
        <Route path="/purchases" element={<PurchasesPage/>}/>
        <Route path="/operators/:id" element={<OperatorDetails />} />
        <Route path="/emails" element={<EmailPage />} />
      </Route>



      <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
        <Route path="/personal-details" element={<PersonalDetails/>} />
        <Route path="/activity-history" element={<ActivityHistory/>} />
        <Route path="/personal-documents" element={<OperatorDocumentsWrapper />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['coordinator']} />}>
        <Route path="/coordinator/dashboard" element={<CoordinatorDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
        <Route path="/accountant/dashboard" element={<AccountantDashboardPage />} />
        <Route path="/documents" element={<DocumentManagementPage />} />
        <Route path="/matsevet" element={<MatsevetPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/worker-attendance" element={<WorkerAttendancePage />} />
        <Route path="/users" element={<UsersManagementPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
        <Route path="/worker/profile" element={<WorkerProfilePage />} />
        <Route path="/worker/:id" element={<WorkerDocumentsApprovalPage />} />
      </Route>

    </Routes>
  );
};

export default AppRoutes;
