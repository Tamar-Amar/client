import axios from 'axios';
import { Purchase } from '../types/Purchase';

const API_URL = process.env.REACT_APP_API_URL+ '/api/purchases' || "https://server-manage.onrender.com" + '/api/purchases';



export const fetchPurchases = async (): Promise<Purchase[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const fetchPurchaseById = async (id: string): Promise<Purchase> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Fetch purchases by class ID
export const fetchPurchasesByClass = async (classId: string): Promise<Purchase[]> => {
    const response = await axios.get(`${API_URL}/class/${classId}`);
    return response.data;
  };
  
  // Fetch purchases by store ID
  export const fetchPurchasesByStore = async (storeId: string): Promise<Purchase[]> => {
    const response = await axios.get(`${API_URL}/store/${storeId}`);
    return response.data;
  };
  

export const createPurchase = async (purchase: Purchase): Promise<Purchase> => {
  const response = await axios.post(API_URL, purchase);
  return response.data;
};

export const updatePurchase = async (id: string, purchase: Partial<Purchase>): Promise<Purchase> => {
  const response = await axios.put(`${API_URL}/${id}`, purchase);
  return response.data;
};

export const deletePurchase = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
