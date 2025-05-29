import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/documents' || "https://server-manage.onrender.com/api/documents";

export const uploadDocument = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000, // 60 seconds timeout
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
      console.log('Upload progress:', percentCompleted, '%');
    }
  });
  return response.data;
};

export const fetchDocumentsByWorker = async (workerId: string) => {
  const response = await axios.get(`${API_URL}/${workerId}`);
  return response.data;
};

export const updateOperatorDocuments = async (tempId: string, newOperatorId: string) => {
  const response = await axios.put(`${API_URL}/update-operator`, {
    tempId,
    newOperatorId,
  });
  return response.data;
};
export const deleteDocument = async (documentId: string) => {
  const response = await axios.delete(`${API_URL}/${documentId}`);
  return response.data;
};

