import axios from 'axios';
import { Operator } from '../types/index';

const API_URL = process.env.REACT_APP_API_URL+ '/api/operators' || "https://server-manage.onrender.com" + '/api/operators';

export const fetchOperators = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createOperator = async (newOperator: {
  firstName: string;
  lastName: string;
  phone: string;
  id: string;
  email: string;
  password: string;
  status: string;
  address: string;
  description: string;
  paymentMethod: "חשבונית" | "תלוש" | "לא נבחר";
  businessDetails?: {
    businessId: string;
    businessName: string;
  };
  bankDetails: { 
    bankName: string;
    accountNumber: string;
    branchNumber: string;
  };
  gender: "בנים" | "בנות" | "גם וגם";
  educationType: "רגיל" | "מיוחד" | "גם וגם";
}) => {
  const response = await axios.post(API_URL, newOperator);
  return response.data;
};


export const deleteOperator = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const updateOperatorDetails = async (operator: Operator): Promise<Operator> => {
  const token = localStorage.getItem('token'); 
  const response = await axios.put(`${API_URL}/${operator._id}`, operator, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchOperatorById = async (operatorId: string): Promise<Operator> => {
  console.log('Fetching operator with id:', operatorId);
  const response = await axios.get(`${API_URL}/${operatorId}`);
  console.log("ope",response.data);
  return response.data;
};

export const fetchCurrentOperator = async (): Promise<Operator> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error("No token found. User might not be logged in.");
  }

  const response = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

