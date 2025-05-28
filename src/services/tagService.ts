import axios from 'axios';
import { WorkerTag } from '../types';

const API_URL = process.env.REACT_APP_API_URL + '/api' || "https://server-manage.onrender.com/api";

export const fetchAllTags = async (): Promise<WorkerTag[]> => {
  const response = await axios.get(`${API_URL}/worker-tags`);
  return response.data;
};

export const updateWorkerTags = async (workerId: string, tagIds: string[]): Promise<WorkerTag[]> => {
  const response = await axios.put(`${API_URL}/worker-tags/${workerId}`, { tagIds });
  return response.data;
}; 