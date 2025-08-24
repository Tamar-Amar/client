import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { WorkerAssignment } from '../types';

const API_URL = process.env.REACT_APP_API_URL;

// Fetch all worker assignments
export const useFetchAllWorkerAssignments = () => {
  return useQuery({
    queryKey: ['worker-assignments'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/worker-assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    }
  });
};

// Fetch worker assignments by class
export const useFetchClassAssignments = (classId: string) => {
  return useQuery({
    queryKey: ['class-assignments', classId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/worker-assignments/class/${classId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!classId
  });
};

// Fetch worker assignments by project
export const useFetchProjectAssignments = (projectCode: number) => {
  return useQuery({
    queryKey: ['project-assignments', projectCode],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/worker-assignments/project/${projectCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!projectCode
  });
};

// Fetch worker assignments by worker
export const useFetchWorkerAssignments = (workerId: string) => {
  return useQuery({
    queryKey: ['worker-assignments', workerId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/worker-assignments/worker/${workerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!workerId
  });
};

// Create new assignment
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assignment: Omit<WorkerAssignment, '_id' | 'createDate' | 'updateDate'>) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/worker-assignments`, assignment, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['class-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
    }
  });
};

// Update assignment
export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assignmentId, updates }: { assignmentId: string; updates: Partial<WorkerAssignment> }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/worker-assignments/${assignmentId}`, updates, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['class-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
    }
  });
};

// Delete assignment
export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/worker-assignments/${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['class-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
    }
  });
};

// Create multiple assignments (for import)
export const useCreateMultipleAssignments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assignments: Array<Omit<WorkerAssignment, '_id' | 'createDate' | 'updateDate'>>) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/worker-assignments/bulk`, { assignments }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['class-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
    }
  });
};

// Check if assignment exists
export const useCheckAssignmentExists = () => {
  return useMutation({
    mutationFn: async ({ workerId, classId, projectCode }: { workerId: string; classId: string; projectCode: number }) => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/worker-assignments/exists`, {
        params: { workerId, classId, projectCode },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.exists;
    }
  });
};
