import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
import OperatorDocuments from '../components/operators/OperatorDocuments';
import { jwtDecode } from 'jwt-decode';
import PersonalDocuments from '../components/operators/PersonalDocuments';

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
<Route path="/public-report" element={<PublicReportPage />} />
      <Route path="*" element={<div>404</div>} />
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/operators" element={<OperatorsPage />} />
        <Route path="/institutions" element={<InstitutionsPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
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
