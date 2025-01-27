import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { userRoleState, userTokenState } from '../recoil/storeAtom';

const API_URL = process.env.REACT_APP_API_URL+ "/api/auth";

const LoginPage: React.FC = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useRecoilState(userRoleState);
  const [userToken, setUserToken] = useRecoilState(userTokenState);

  const handleLogin = async () => {
    console.log('Logging in:', id, password); 
    try {
      const response = await axios.post(API_URL, { id, password });
      const { role, token } = response.data;
      console.log('Logged in as:', role, token);

      // שמירה ב-Recoil
      setUserRole(role);
      setUserToken(token);

      // שמירה ב-LocalStorage למקרה של טעינה מחדש
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      console.log("User Role: ", userRole); // null
      console.log("User Token: ", userToken); // null


      // הפניה לדשבורד
      //window.location.href = '/';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <input type="text" placeholder="תעודת זהות" value={id} onChange={(e) => setId(e.target.value)} />
      <input type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>כניסה</button>
    </div>
  );
};

export default LoginPage;