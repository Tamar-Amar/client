import axios from 'axios';
import { Class } from '../types/index';
import { AxiosResponse } from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || "https://server-manage.onrender.com") + '/api/classes';

export const fetchClasses = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createClass = async (classData: Class) => {
  const response = await axios.post(API_URL, classData);
  return response.data;
};

export const createMultipleClasses = async (classesData: Class[]) => {
  const response = await axios.post(`${API_URL}/bulk`, { classes: classesData });
  return response.data;
};

export const updateMultipleClasses = async (updatesData: { id: string; updatedClass: Partial<Class> }[]) => {
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

export const bulkAddWorkersToClasses = (classToWorkersMap: Record<string, any[]>): Promise<AxiosResponse<any>> => {
  return axios.post(`${API_URL}/bulk-add-workers`, { classToWorkersMap });
};

export const getCoordinatorClasses = async (coordinatorId: string) => {
  const response = await axios.get(`${API_URL}/coordinator/${coordinatorId}`);
  return response.data;
};
  