import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClasses, createClass, createMultipleClasses, updateMultipleClasses, deleteClass, updateClass, fetchWorkerClasses, bulkAddWorkersToClasses } from '../services/ClassService';
import { Class } from '../types/index';
import axios from 'axios';
import { AxiosResponse } from 'axios';
const API_URL = process.env.REACT_APP_API_URL+ '/api/classes' || "https://server-manage.onrender.com" + '/api/classes';


export const useFetchClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useAddMultipleClasses = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultipleClasses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateMultipleClasses = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMultipleClasses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updatedClass }: { id: string; updatedClass: Partial<Class> }) => updateClass(id, updatedClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useWorkerClasses = (workerId: string) => {
  return useQuery({
    queryKey: ['workerClasses', workerId],
    queryFn: () => fetchWorkerClasses(workerId),
  });
};

export const useBulkAddWorkersToClasses = () => {
  return useMutation<AxiosResponse<any>, Error, Record<string, any[]>>({
    mutationFn: bulkAddWorkersToClasses
  });
};


export const updateClassWithWorker = async (classId: string, update: any) => {
  return axios.put(`${API_URL}/${classId}`, update);
};