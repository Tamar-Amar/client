import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWorker, deleteWorker, fetchWorkerById, fetchWorkers, updateWorker } from '../services/WorkerService';
import { Worker } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const useFetchWorkers = () => {
  return useQuery({
    queryKey: ['workers'],
    queryFn: fetchWorkers
  });
};

export const useFetchWorkerById = (workerId: string) => {
  return useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => fetchWorkerById(workerId),
    enabled: !!workerId
  });
};

export const useFetchWorker = (workerId: string) => {
  return useQuery({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/workers/${workerId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!workerId,
  });
};

export const useAddWorker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workerData: Omit<Worker, '_id'>) => createWorker(workerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    }
  });
};

export const useUpdateWorker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Worker> }) => 
      updateWorker(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', variables.id] });
    }
  });
};

export const useDeleteWorker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    }
  });
}; 