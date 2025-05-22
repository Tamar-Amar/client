
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/documents' || "https://server-manage.onrender.com/api/documents";

export const uploadDocument = async (formData: FormData) => {
  const response = await axios.post(API_URL + '/upload', formData);
  return response.data;
};

export const fetchDocumentsByOperator = async (operatorId: string) => {
  const response = await axios.get(`${API_URL}/${operatorId}`);
  return response.data;
};
