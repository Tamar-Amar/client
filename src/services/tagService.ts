import axios from 'axios';
import { WorkerTag } from '../types';

const API_URL = process.env.REACT_APP_API_URL + '/api/worker-tags' || "https://server-manage.onrender.com/api";

export const fetchAllTags = async (): Promise<WorkerTag[]> => {
  const response = await axios.get(`${API_URL}`);
  return response.data;
};

export const fetchWorkerTags = async (workerId: string): Promise<WorkerTag[]> => {
  const response = await axios.get(`${API_URL}/${workerId}`);
  console.log(response.data);
  return response.data;
};

export const updateWorkerTags = async (workerId: string, tagIds: string[]): Promise<WorkerTag[]> => {
  const response = await axios.put(`${API_URL}/${workerId}`, { tagIds });
  return response.data;
}; 