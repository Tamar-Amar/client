import axios from 'axios';
import { Activity } from '../types/Activity';

const API_URL = process.env.REACT_APP_API_URL+ "/api/activities";

/**
 * Fetch all activities
 */
export const fetchAllActivities = async (): Promise<Activity[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

/**
 * Fetch activities by class ID
 * @param classId - Class ID
 */
export const fetchActivitiesByClass = async (classId: string): Promise<Activity[]> => {
  const response = await axios.get(`${API_URL}/class/${classId}`);
  return response.data;
};

/**
 * Fetch activities by operator ID
 * @param operatorId - Operator ID
 */

export const fetchActivitiesByOperator = async (operatorId: string): Promise<Activity[]> => {
  const response = await axios.get(`${API_URL}/actByOp/${operatorId}`);
  return response.data;
};

/**
 * Add a new activity
 * @param activity - Activity data
 */
export const createActivity = async (activity: Activity): Promise<Activity> => {
  const response = await axios.post(API_URL, activity);
  return response.data;
};

/**
 * Update presence for an activity
 * @param activityId - Activity ID
 * @param presence - Presence data
 */
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

