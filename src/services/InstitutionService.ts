import axios from 'axios';
import { Institution } from '../types/Institution';

const API_URL = process.env.REACT_APP_API_URL + '/api/institutions' || "https://server-manage.onrender.com" + '/api/institutions';


export const fetchInstitutions = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
};

export const createInstitution = async (institution: Institution) => {
  try {
    const response = await axios.post(API_URL, institution);
    return response.data;
  } catch (error) {
    console.error('Error creating institution:', error);
    throw error;
  }
}

export const updateInstitution = async (id: string, institution: Institution) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, institution);
    return response.data;
  } catch (error) {
    console.error('Error updating institution:', error);
    throw error;
  }
}

export const deleteInstitution = async (id: string) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting institution:', error);
    throw error;
  }
}
