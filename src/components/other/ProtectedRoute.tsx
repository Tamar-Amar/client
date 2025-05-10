import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../../recoil/storeAtom';

interface ProtectedRouteProps {
  allowedRoles: string[]; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const userRole = useRecoilValue(userRoleState);
  
  if (userRole === null) {
    return <div>טוען...</div>;
  }

  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />; 
  }
  return <Outlet />; 
};

export default ProtectedRoute;
