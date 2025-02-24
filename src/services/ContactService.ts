import axios from 'axios';
import { Contact } from '../types/index';

const API_URL = process.env.REACT_APP_API_URL + '/api/contacts' || "https://server-manage.onrender.com/api/contacts";

export const fetchContacts = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createContact = async (contactData: Contact) => {
    console.log('contactData:', contactData);
  const response = await axios.post(API_URL, contactData);
  console.log(response.data);
  return response.data;
};

export const updateContact = async (id: string, updatedData: Partial<Contact>) => {
  const response = await axios.put(`${API_URL}/${id}`, updatedData);
  return response.data;
};

export const deleteContact = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`);
};
