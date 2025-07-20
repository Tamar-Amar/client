import axios from 'axios';

interface AttendanceSubmission {
  workerId: string;
  classId: string;
  month: string;
  projectCode: number;
  studentAttendanceDoc?: string;
  workerAttendanceDoc?: string;
  controlDocs?: string[];
}

const API_URL = process.env.REACT_APP_API_URL+ "/api/attendance";

// פונקציה לקבלת הטוקן
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const attendanceService = {
  geAllAttendance: async () => {
    const response = await axios.get(`${API_URL}/`, { 
      params: { projectCode: 4 },
      headers: getAuthHeaders()
    });
    return response.data;
  },
  submitAttendance: async (data: AttendanceSubmission) => {
    const response = await axios.post(`${API_URL}/submit`, { ...data, projectCode: 4 }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getWorkerAttendance: async (workerId: string) => {
    const response = await axios.get(`${API_URL}/${workerId}`, { 
      params: { projectCode: 4 },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getClassAttendance: async (classId: string) => {
    const response = await axios.get(`${API_URL}/${classId}`, { 
      params: { projectCode: 4 },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteAttendanceRecord: async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateAttendanceAttendanceDoc: async (attendanceId: string, docType: string, documentId: string) => {
    return axios.patch(`${API_URL}/update-attendance/${attendanceId}`, { docType, documentId, projectCode: 4 }, {
      headers: getAuthHeaders()
    });
  },

  updateAttendanceAfterDocDelete: async (attendanceId: string, docType: string): Promise<any> => {
    const response = await axios.patch(`${API_URL}/update-after-doc-delete`, { attendanceId, docType, projectCode: 4 }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  uploadAttendanceDoc: async (attendanceId: string, docType: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attendanceId', attendanceId);
    formData.append('docType', docType);
    const response = await axios.post(`${API_URL}/upload-doc`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },
  uploadAttendanceDocForm: async (formData: FormData) => {
    const response = await axios.post(`${API_URL}/upload-doc`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders()
      }
    });
    return response.data.doc;
  },
  deleteAttendanceDoc: async (attendanceId: string, docType: string, docIndex?: number) => {
    const response = await axios.delete(`${API_URL}/delete-doc`, {
      data: { attendanceId, docType, docIndex },
      headers: getAuthHeaders()
    });
    return response.data;
  },
  deleteCampAttendanceDocument: async (data: { recordId: string; docType: string; docIndex?: number }) => {
    const response = await axios.delete(`${API_URL}/camp-document`, {
      data,
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteCampAttendanceRecord: async (recordId: string) => {
    const response = await axios.delete(`${API_URL}/camp/${recordId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
  uploadAttendanceDocV2: async (data: { file: File; operatorId: string; classId: string; projectCode: number; month: string; type: string; tz: string }) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('operatorId', data.operatorId);
    formData.append('classId', data.classId);
    formData.append('projectCode', String(data.projectCode));
    formData.append('month', data.month);
    formData.append('type', data.type);
    formData.append('tz', data.tz);
    const response = await axios.post(`${API_URL}/upload-attendance-doc`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },
  createCampAttendance: async (data: { projectCode: number; classId: string; coordinatorId: string; leaderId: string; month: string; workerAttendanceDoc?: string | null; studentAttendanceDoc?: string | null; controlDocs?: string[] }) => {
    const response = await axios.post(`${API_URL}/camp`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  createCampAttendanceWithFiles: async (data: { 
    projectCode: number; 
    classId: string; 
    coordinatorId: string; 
    leaderId: string; 
    month: string; 
    workerFile?: File; 
    studentFile?: File; 
    controlFiles?: File[] 
  }) => {
    const formData = new FormData();
    formData.append('projectCode', String(data.projectCode));
    formData.append('classId', data.classId);
    formData.append('coordinatorId', data.coordinatorId);
    formData.append('leaderId', data.leaderId);
    formData.append('month', data.month);
    
    if (data.workerFile) {
      formData.append('workerFile', data.workerFile);
    }
    if (data.studentFile) {
      formData.append('studentFile', data.studentFile);
    }
    if (data.controlFiles) {
      data.controlFiles.forEach(file => {
        formData.append('controlFiles', file);
      });
    }
    
    const response = await axios.post(`${API_URL}/camp-with-files`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },
  getCampAttendance: async () => {
    const response = await axios.get(`${API_URL}/camp`, {
      headers: getAuthHeaders()
    });
    console.log("response.data",response.data);
    return response.data;
  },
  updateCampAttendanceDoc: async (campAttendanceId: string, docType: string, documentId: string) => {
    const response = await axios.patch(`${API_URL}/camp/${campAttendanceId}`, { docType, documentId }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // פונקציות חדשות לתמיכה בהוקים
  getCampAttendanceReports: async () => {
    const response = await axios.get(`${API_URL}/camp`, {
      headers: getAuthHeaders()
    });
    console.log("response.data",response.data);
    return response.data;
  },

  // פונקציה לקבלת דוחות נוכחות קייטנה לפי רכז
  getCampAttendanceReportsByCoordinator: async (coordinatorId: string) => {
    const response = await axios.get(`${API_URL}/camp/coordinator/${coordinatorId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // פונקציה לקבלת כל דוחות הנוכחות של קייטנות
  getAllCampAttendanceReports: async () => {
    const response = await axios.get(`${API_URL}/camp`, {
      headers: getAuthHeaders()
    });
    console.log("response.data",response.data);
    return response.data;
  },

  getCampAttendanceReport: async (id: string) => {
    const response = await axios.get(`${API_URL}/camp/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateCampAttendance: async (id: string, data: any) => {
    const response = await axios.patch(`${API_URL}/camp/${id}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteCampAttendance: async (id: string) => {
    const response = await axios.delete(`${API_URL}/camp/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  uploadAttendanceDocument: async (recordId: string, docType: string, file: File, docIndex?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recordId', recordId);
    formData.append('docType', docType);
    if (docIndex !== undefined) {
      formData.append('docIndex', docIndex.toString());
    }
    const response = await axios.post(`${API_URL}/camp/upload-document`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },

  deleteAttendanceDocument: async (recordId: string, docType: string, docIndex?: number) => {
    const response = await axios.delete(`${API_URL}/camp/delete-document`, {
      data: { recordId, docType, docIndex },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // פונקציות לדוחות נוכחות אישיים
  getPersonalAttendanceReports: async () => {
    const response = await axios.get(`${API_URL}/personal`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getPersonalAttendanceReport: async (id: string) => {
    const response = await axios.get(`${API_URL}/personal/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  createPersonalAttendance: async (data: any) => {
    const response = await axios.post(`${API_URL}/personal`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updatePersonalAttendance: async (id: string, data: any) => {
    const response = await axios.patch(`${API_URL}/personal/${id}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deletePersonalAttendance: async (id: string) => {
    const response = await axios.delete(`${API_URL}/personal/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // פונקציה לעדכון סטטוס מסמך נוכחות קייטנה
  updateCampAttendanceDocumentStatus: async (documentId: string, newStatus: string) => {
    const response = await axios.patch(`${API_URL}/camp/document-status`, {
      documentId,
      newStatus
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getClassesByCoordinatorInstitutionCodes: async (coordinatorId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/classes/coordinator-institution-codes/${coordinatorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }
}; 