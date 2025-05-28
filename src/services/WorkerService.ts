import { Worker } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL+ '/api' || "https://server-manage.onrender.com" + '/api';


export const fetchWorkers = async (): Promise<Worker[]> => {
  const response = await fetch(`${API_BASE_URL}/workers`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const fetchWorkerById = async (id: string): Promise<Worker> => {
  const response = await fetch(`${API_BASE_URL}/workers/${id}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const createWorker = async (workerData: Omit<Worker, '_id'>): Promise<Worker> => {
  const response = await fetch(`${API_BASE_URL}/workers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workerData),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const updateWorker = async (id: string, data: Partial<Worker>): Promise<Worker> => {
  const response = await fetch(`${API_BASE_URL}/workers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const deleteWorker = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/workers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
}; 