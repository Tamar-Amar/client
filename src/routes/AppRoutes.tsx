import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import OperatorsPage from '../pages/OperatorsPage';
import InstitutionsPage from '../pages/InstitutionsPage';
import ClassesPage from '../pages/ClassesPage';
import ActivitiesPage from '../pages/ActivitiesPage';
import InvoicesPage from '../pages/InvoicesPage';
import PurchasesPage from '../pages/PurchasesPage';
import AttendancePage from '../pages/CalendarPage';
import LoginPage from '../pages/LoginPage';
import PersonalDetails from '../components/PersonalDetails';
import ActivityHistory from '../components/ActivityHistory';
import ProtectedRoute from '../components/ProtectedRoute';
import ReportPdfPage from '../pages/ReportPdfPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* נתיבים לכולם */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="*" element={<div>404</div>} />
      <Route path="/report-pdf" element={<ReportPdfPage/>} />
      
      {/* נתיבים למנהל */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/operators" element={<OperatorsPage />} />
        <Route path="/institutions" element={<InstitutionsPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/invoices" element={<InvoicesPage/>}/>
        <Route path="/purchases" element={<PurchasesPage/>}/>
        <Route path="/attendance" element={<AttendancePage/>}/>
        <Route path="/report-pdf" element={<ReportPdfPage/>} />
      </Route>

      {/* נתיבים למפעיל */}
      <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
        <Route path="/personal-details" element={<PersonalDetails/>} />
        <Route path="/activity-history" element={<ActivityHistory/>} />
      </Route>

    </Routes>
  );
};

export default AppRoutes;
