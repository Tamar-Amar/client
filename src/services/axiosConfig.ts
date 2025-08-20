import axios from 'axios';

// פונקציה לניקוי state של המשתמש
export const clearUserState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  
  // ניקוי recoil state
  // נצטרך לייבא את זה מהקומפוננטה שמשתמשת ב-recoil
  // כרגע נשתמש ב-window.location.reload() כדי לנקות את כל ה-state
  window.location.reload();
};

// יצירת instance של axios עם הגדרות בסיסיות
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 60000, // דקה במקום 10 שניות
});

// Request interceptor - מוסיף טוקן לכל בקשה
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - מטפל בשגיאות 401
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // טוקן פג תוקף או לא תקין
      console.log('Token expired or invalid, logging out user');
      
      // ניקוי state והפניה לדף התחברות
      clearUserState();
      
      return Promise.reject(new Error('הטוקן פג תוקף. אנא התחבר מחדש.'));
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 