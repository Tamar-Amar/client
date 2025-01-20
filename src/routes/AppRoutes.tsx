import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import OperatorsPage from '../pages/OperatorsPage';
import InstitutionsPage from '../pages/InstitutionsPage';
import ClassesPage from '../pages/ClassesPage';
import ActivitiesPage from '../pages/ActivitiesPage';
import InvoicesPage from '../pages/InvoicesPage';
import PurchasesPage from '../pages/PurchasesPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/operators" element={<OperatorsPage />} />
      <Route path="/institutions" element={<InstitutionsPage />} />
      <Route path="*" element={<div>404</div>} />
      <Route path="/classes" element={<ClassesPage />} />
      <Route path="/activities" element={<ActivitiesPage />} />
      <Route path="/invoices" element={<InvoicesPage/>}/>
      <Route path="/purchases" element={<PurchasesPage/>}/>
    </Routes>
  );
};

export default AppRoutes;
