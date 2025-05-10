import axios from 'axios';
import { Activity } from '../types/index';

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

type ActivityResponse =
  | Activity 
  | { message: string; existingActivity: Activity };
  
  export const createActivity = async (activity: Activity): Promise<Activity | null> => {
    try {
      const localDate = new Date(activity.date); 
      const utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
      const activityToSend = {
        ...activity,
        date: utcDate.toISOString(), 
      };
  
      const response = await axios.post<ActivityResponse>(API_URL, activityToSend);
  
      if ("message" in response.data) {
        return response.data.existingActivity;
      }

      return response.data;

    } catch (error: any) {
      console.error("❌ Error adding activity:", error);
      return null;
    }
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

