import axios from 'axios';
import { Operator, WeeklySchedule } from '../types/index';

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
  gender: "בנים" | "בנות" | "גם וגם";
  educationType: "רגיל" | "מיוחד" | "גם וגם";
  regularClasses?: string[];
}) => {
  const response = await axios.post(API_URL, newOperator);
  return response.data;
};


export const deleteOperator = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const updateOperatorDetails = async ({ id, ...updatedFields }: { id: string; [key: string]: any }) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/${id}`, updatedFields, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateOperatorWeeklySchedule = async ({
  operatorId,
  weeklySchedule,
}: {
  operatorId: string;
  weeklySchedule: WeeklySchedule[];
}) => {
  const response = await axios.put(`${API_URL}/${operatorId}/weekly-schedule`, { weeklySchedule });
  return response.data;
};


export const fetchOperatorById = async (operatorId: string): Promise<Operator> => {
  const response = await axios.get(`${API_URL}/${operatorId}`);
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

