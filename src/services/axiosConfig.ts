import axios from 'axios';

export const clearUserState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  
  window.location.reload();
};

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 60000, // דקה במקום 10 שניות
});

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

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, logging out user');
      
      clearUserState();
      
      return Promise.reject(new Error('הטוקן פג תוקף. אנא התחבר מחדש.'));
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 