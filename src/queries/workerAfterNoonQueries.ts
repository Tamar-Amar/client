import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWorker, createMultipleWorkers, deleteAllWorkers, deleteWorker, deleteMultipleWorkers, fetchWorkerById, fetchWorkers, updateWorker } from '../services/WorkerAfterNoonService';
import { WorkerAfterNoon } from '../types';

export const useFetchAllWorkersAfterNoon = () => {
  return useQuery({
    queryKey: ['workers'],
    queryFn: fetchWorkers
  });
};

export const useFetchWorkerAfterNoon = (workerId: string) => {
  return useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => fetchWorkerById(workerId),
    enabled: !!workerId
  });
};

export const useAddWorkerAfterNoon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workerData: Omit<WorkerAfterNoon, '_id'>) => createWorker(workerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    }
  });
};

export const useUpdateWorkerAfterNoon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkerAfterNoon> }) => 
      updateWorker(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', variables.id] });
    }
  });
};

export const useDeleteWorkerAfterNoon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  });
}; 

export const useDeleteAllWorkersAfterNoon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAllWorkers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  });
};

export const useAddMultipleWorkersAfterNoon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workersData: Omit<WorkerAfterNoon, '_id'>[]) => createMultipleWorkers(workersData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    }
  });
};

export const useDeleteMultipleWorkersAfterNoon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workerIds: string[]) => deleteMultipleWorkers(workerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  });
};