import axios from 'axios';
import { Operator } from '../types/Operator';

const API_URL = process.env.REACT_APP_API_URL+ '/api/operators' || "https://server-manage.onrender.com" + '/api/operators';
console.log(API_URL);

export const fetchOperators = async () => {
  console.log("Fetching operators from API"); 
  const response = await axios.get(API_URL);
  return response.data;
};

export const createOperator = async (operator: Operator) => {
  console.log("Sending operator to API:", operator); 
  const response = await axios.post(API_URL, operator);
  console.log("Response from API:", response.data);
  return response.data;
};

export const deleteOperator = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const updateOperatorDetails = async (operator: Operator): Promise<Operator> => {
  const token = localStorage.getItem('token'); // הוספת טוקן אם נדרש
  const response = await axios.put(`${API_URL}/${operator._id}`, operator, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchOperatorById = async (): Promise<Operator> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
