import axios from 'axios';
import { Operator } from '../types/Operator';

const API_URL = process.env.REACT_APP_API_URL + '/api/operators';

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
