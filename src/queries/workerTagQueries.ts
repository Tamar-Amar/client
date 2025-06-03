import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWorkerTag, deleteWorkerTag, fetchWorkerTags, updateWorkerTag } from '../services/WorkerTagService';
import { WorkerTag } from '../types';

export const useFetchWorkerTags = () => {
  return useQuery({
    queryKey: ['workerTags'],
    queryFn: fetchWorkerTags
  });
};

export const useAddWorkerTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tagData: { name: string }) => createWorkerTag(tagData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerTags'] });
    }
  });
};

export const useUpdateWorkerTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) => 
      updateWorkerTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerTags'] });
    }
  });
};

export const useDeleteWorkerTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteWorkerTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerTags'] });
    }
  });
}; 