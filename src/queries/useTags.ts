import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTags, updateWorkerTags, fetchWorkerTags } from '../services/tagService';
import { WorkerTag } from '../types';

export const useWorkerTags = (workerId: string) => {
  const queryClient = useQueryClient();

  const tags = useQuery<WorkerTag[]>({
    queryKey: ['tags'],
    queryFn: fetchAllTags
  });

  const updateTagsMutation = useMutation({
    mutationFn: (tagIds: string[]) => updateWorkerTags(workerId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
    }
  });

  const workerTags = useQuery<WorkerTag[]>({
    queryKey: ['worker-tags', workerId],
    queryFn: () => fetchWorkerTags(workerId)
  });

  return {
    workerTags: workerTags.data || [],
    availableTags: tags.data || [],
    isLoading: tags.isLoading,
    isError: tags.isError,
    error: tags.error,
    updateTags: updateTagsMutation.mutate,
    isUpdating: updateTagsMutation.isPending
  };
}; 