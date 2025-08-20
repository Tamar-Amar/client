import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../../recoil/storeAtom';
import { jwtDecode } from 'jwt-decode';
import { clearUserState } from '../../services/axiosConfig';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

interface DecodedToken {
  exp: number;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const userRole = useRecoilValue(userRoleState);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsTokenValid(false);
      return;
    }
    
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (decoded.exp < currentTime) {
        console.log('Token expired in ProtectedRoute');
        clearUserState();
        setIsTokenValid(false);
      } else {
        setIsTokenValid(true);
      }
    } catch (error) {
      console.error('Error decoding token in ProtectedRoute:', error);
      clearUserState();
      setIsTokenValid(false);
    }
  }, []);
  
  // עדיין בודקים טוקן
  if (isTokenValid === null) {
    return <div>טוען...</div>;
  }
  
  // טוקן לא תקף
  if (!isTokenValid) {
    return <Navigate to="/login" replace />;
  }
  
  // אין role או role לא מורשה
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />; 
  }

  return <Outlet />;
};

export default ProtectedRoute;
