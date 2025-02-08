import axios from 'axios';
import { Activity } from '../types/Activity';

const API_URL = process.env.REACT_APP_API_URL+ "/api/activities";

export const fetchAllActivities = async (): Promise<Activity[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const fetchActivitiesByClass = async (classId: string): Promise<Activity[]> => {
  const response = await axios.get(`${API_URL}/class/${classId}`);
  return response.data;
};


export const fetchActivitiesByOperator = async (operatorId: string): Promise<Activity[]> => {
  const response = await axios.get(`${API_URL}/actByOp/${operatorId}`);
  return response.data;
};

export const createActivity = async (activity: Activity): Promise<Activity> => {
  console.log(activity);
  const response = await axios.post(API_URL, activity);
  return response.data;
};

export const updatePresence = async (activityId: string, presence: any): Promise<Activity> => {
  const response = await axios.put(`${API_URL}/presence`, {
    activityId,
    presence,
  });
  return response.data;
};

export const deleteActivity = async (id: string): Promise<{ operatorId: string; activityId: string }> => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

