import axios from 'axios';
import { Document, DocumentStatus } from '../types/Document';

const API_URL = process.env.REACT_APP_API_URL + '/api/documents' || "https://server-manage.onrender.com/api/documents";

export const uploadDocument = async (formData: FormData): Promise<Document> => {
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000, // 60 seconds timeout
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
    }
  });
  return response.data;
};

export const fetchDocumentsByWorker = async (workerId: string): Promise<Document[]> => {
  const response = await axios.get(`${API_URL}/${workerId}`);
  return response.data;
};

export const fetchAllDocuments = async (): Promise<Document[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const updateOperatorDocuments = async (tempId: string, newOperatorId: string): Promise<Document> => {
  const response = await axios.put(`${API_URL}/operator`, { tempId, newOperatorId });
  return response.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${documentId}`);
};

export const updateDocumentStatus = async (documentId: string, status: DocumentStatus): Promise<Document> => {
  const response = await axios.patch(`${API_URL}/status/${documentId}`, { status });
  return response.data;
};

export const fetchAllPersonalDocuments = async (): Promise<Document[]> => {
  const response = await axios.get(`${API_URL}/personal`);
  return response.data;
};