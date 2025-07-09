import axios from 'axios';
import { Class } from '../types/index';

const API_URL = (process.env.REACT_APP_API_URL || "https://server-manage.onrender.com") + '/api/classes';

export const fetchClasses = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createClass = async (classData: Class) => {
  console.log("בוא נציג את הפרמטרים שלנו", classData);
  const response = await axios.post(API_URL, classData);
  return response.data;
};

export const createMultipleClasses = async (classesData: Class[]) => {
  console.log(`שולח ${classesData.length} כיתות לשרת`);
  const response = await axios.post(`${API_URL}/bulk`, { classes: classesData });
  return response.data;
};

export const updateMultipleClasses = async (updatesData: { id: string; updatedClass: Partial<Class> }[]) => {
  console.log(`שולח ${updatesData.length} עדכונים לשרת`);
  const response = await axios.put(`${API_URL}/bulk`, { updates: updatesData });
  return response.data;
};

export const deleteClass = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const updateClass = async (id: string, updatedClass: Partial<Class>) => {
  const response = await axios.put(`${API_URL}/${id}`, updatedClass);
  return response.data;
};

export const fetchWorkerClasses = async (workerId: string) => {
  const response = await axios.get(`${API_URL}/worker/${workerId}`);
  return response.data;
};
  