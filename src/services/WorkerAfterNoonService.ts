import { WorkerAfterNoon } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL+ '/api/worker-after-noon' || "https://server-manage.onrender.com" + '/api/worker-after-noon';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const fetchWorkers = async (): Promise<WorkerAfterNoon[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      headers: getHeaders()
    });
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
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const createWorker = async (workerData: Omit<WorkerAfterNoon, '_id'>): Promise<WorkerAfterNoon> => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: 'POST',
    headers: getHeaders(),
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
    headers: getHeaders(),
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
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
}; 

export const deleteAllWorkers = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
};

export const deleteMultipleWorkers = async (workerIds: string[]): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/delete-multiple`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ workerIds }),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
};

export const createMultipleWorkers = async (workersData: Omit<WorkerAfterNoon, '_id'>[]): Promise<WorkerAfterNoon[]> => {
  const response = await fetch(`${API_BASE_URL}/multiple`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ workers: workersData }),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};