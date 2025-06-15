import axios from 'axios';

interface AttendanceSubmission {
  workerId: string;
  classId: string;
  month: string;
  studentAttendanceDoc?: string;
  workerAttendanceDoc?: string;
  controlDoc?: string;
}

const API_URL = process.env.REACT_APP_API_URL+ "/api/attendance";

export const attendanceService = {
  geAllAttendance: async () => {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  },
  submitAttendance: async (data: AttendanceSubmission) => {
    const response = await axios.post(`${API_URL}/submit`, data);
    return response.data;
  },

  getWorkerAttendance: async (workerId: string) => {
    const response = await axios.get(`${API_URL}/${workerId}`);
    return response.data;
  },

  getClassAttendance: async (classId: string) => {
    const response = await axios.get(`${API_URL}/${classId}`);
    return response.data;
  },

  deleteAttendanceRecord: async (id: string) => {
    console.log("id", id);
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  updateAttendanceAttendanceDoc: async (attendanceId: string, docType: string, documentId: string) => {
    console.log("attendanceId, docType, documentId", attendanceId, docType, documentId);
    return axios.patch(`${API_URL}/update-attendance/${attendanceId}`,{docType, documentId});
  }
}; 