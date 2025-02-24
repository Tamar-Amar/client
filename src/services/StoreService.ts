import axios from 'axios';
import { Store } from '../types/index';

const API_URL = process.env.REACT_APP_API_URL+ '/api/stores' || "https://server-manage.onrender.com" + '/api/stores';


// Fetch all stores
export const fetchStores = async (): Promise<Store[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Add a new store
export const createStore = async (store: Store): Promise<Store> => {
  const response = await axios.post(API_URL, store);
  return response.data;
};

// Delete a store by ID
export const deleteStore = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const updateStoreDetails = async (id: string, updatedStore: Partial<Store>) => {
  const response = await axios.put(`${API_URL}/${id}`, updatedStore);
  return response.data;
}
