import axios from 'axios';
import { Invoice } from '../types/index';

const API_URL = process.env.REACT_APP_API_URL+ '/api/invoices' || "https://server-manage.onrender.com" + '/api/invoices';


export const fetchInvoices = async (): Promise<Invoice[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const fetchInvoiceById = async (id: string): Promise<Invoice> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createInvoice = async (invoice: Invoice): Promise<Invoice> => {
  const response = await axios.post(API_URL, invoice);
  return response.data;
};

export const fetchInvoicesByStore = async (storeId: string): Promise<Invoice[]> => {
    const response = await axios.get(`${API_URL}/store/${storeId}`);
    return response.data;
  };


export const updateInvoice = async ({ id, invoice }: { id: string; invoice: Partial<Invoice> }): Promise<Invoice> => {
  const response = await axios.put(`${API_URL}/${id}`, invoice);
  return response.data;
};


export const deleteInvoice = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
