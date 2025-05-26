import axios from 'axios';

const API_URL = '/api/documents';

export const uploadDocument = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const fetchDocumentsByOperator = async (operatorId: string) => {
  const response = await axios.get(`${API_URL}/${operatorId}`);
  return response.data;
};

export const updateOperatorDocuments = async (tempId: string, newOperatorId: string) => {
  const response = await axios.put(`${API_URL}/update-operator`, {
    tempId,
    newOperatorId,
  });
  return response.data;
};
