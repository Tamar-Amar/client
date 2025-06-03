import axios from 'axios';
import { WorkerTag } from '../types';

const API_URL = process.env.REACT_APP_API_URL + '/api/worker-tags' || 'https://server-manage.onrender.com/api/worker-tags';

export const createWorkerTag = async (tagData: { name: string }): Promise<WorkerTag> => {
  const response = await axios.post(API_URL, tagData);
  return response.data;
};

export const fetchWorkerTags = async (): Promise<WorkerTag[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const updateWorkerTag = async (tagId: string, tagData: { name: string }): Promise<WorkerTag> => {
  const response = await axios.put(`${API_URL}/${tagId}`, tagData);
  return response.data;
};

export const deleteWorkerTag = async (tagId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${tagId}`);
}; 