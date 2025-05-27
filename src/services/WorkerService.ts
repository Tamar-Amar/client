import { Worker } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL+ '/api' || "https://server-manage.onrender.com" + '/api';


export const fetchWorkers = async (): Promise<Worker[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workers`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching workers:', error);
    throw error;
  }
};

export const fetchWorkerById = async (workerId: string): Promise<Worker> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching worker:', error);
    throw error;
  }
};

export const createWorker = async (workerData: Omit<Worker, '_id'>): Promise<Worker> => {
  try {
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
    return await response.json();
  } catch (error) {
    console.error('Error creating worker:', error);
    throw error;
  }
};

export const updateWorker = async (workerId: string, workerData: Partial<Worker>): Promise<Worker> => {
  if (!workerId) {
    return createWorker(workerData as Omit<Worker, '_id'>);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workerData),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating worker:', error);
    throw error;
  }
};

export const deleteWorker = async (workerId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.error('Error deleting worker:', error);
    throw error;
  }
}; 