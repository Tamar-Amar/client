import { WorkerAfterNoon } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL+ '/api/worker-after-noon' || "https://server-manage.onrender.com" + '/api/worker-after-noon';


export const fetchWorkers = async (): Promise<WorkerAfterNoon[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching workers:', error);
    throw error;
  }
};

export const fetchWorkerById = async (id: string): Promise<WorkerAfterNoon> => {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const createWorker = async (workerData: Omit<WorkerAfterNoon, '_id'>): Promise<WorkerAfterNoon> => {
  console.log("workerData", workerData);
  const response = await fetch(`${API_BASE_URL}`, {
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

export const updateWorker = async (id: string, data: Partial<WorkerAfterNoon>): Promise<WorkerAfterNoon > => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
}; 