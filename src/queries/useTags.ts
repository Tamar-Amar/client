import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTags, updateWorkerTags, fetchWorkerTags, createTag, updateTag, deleteTag } from '../services/tagService';
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
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] }); // Invalidate workers as they might have this tag
    }
  });

  const workerTags = useQuery<WorkerTag[]>({
    queryKey: ['worker-tags', workerId],
    queryFn: () => fetchWorkerTags(workerId),
    enabled: workerId !== 'all' // Only fetch worker tags if we have a specific worker
  });

  return {
    workerTags: workerTags.data || [],
    availableTags: tags.data || [],
    isLoading: tags.isLoading,
    isError: tags.isError,
    error: tags.error,
    updateTags: updateTagsMutation.mutate,
    isUpdating: updateTagsMutation.isPending,
    createTag: createTagMutation.mutate,
    isCreating: createTagMutation.isPending,
    updateTag: updateTagMutation.mutate,
    isUpdatingTag: updateTagMutation.isPending,
    deleteTag: deleteTagMutation.mutate,
    isDeleting: deleteTagMutation.isPending
  };
}; 