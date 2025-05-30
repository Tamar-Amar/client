import axios from 'axios';
import { WorkerTag } from '../types';

const API_URL = process.env.REACT_APP_API_URL + '/api/tags' || "https://server-manage.onrender.com/api/tags";

export const fetchAllTags = async (): Promise<WorkerTag[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const fetchWorkerTags = async (workerId: string): Promise<WorkerTag[]> => {
  const response = await axios.get(`${API_URL}/worker/${workerId}`);
  return response.data;
};

export const updateWorkerTags = async (workerId: string, tagIds: string[]): Promise<void> => {
  await axios.put(`${API_URL}/worker/${workerId}`, { tagIds });
};

export const createTag = async (name: string): Promise<WorkerTag> => {
  const response = await axios.post(API_URL, { name });
  return response.data;
};

export const updateTag = async ({ id, name }: { id: string; name: string }): Promise<WorkerTag> => {
  const response = await axios.put(`${API_URL}/${id}`, { name });
  return response.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
}; 