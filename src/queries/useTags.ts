import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTags, updateWorkerTags, fetchWorkerTags, createTag, updateTag, deleteTag, bulkUpdateWorkerTags } from '../services/tagService';
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

  const bulkUpdateTagsMutation = useMutation({
    mutationFn: ({ workerIds, tagId }: { workerIds: string[], tagId: string }) => 
      bulkUpdateWorkerTags(workerIds, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });

  const updateTagMutation = useMutation<WorkerTag, Error, { id: string; name: string }>({
    mutationFn: ({ id, name }) => updateTag(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    }
  });

  const workerTags = useQuery<WorkerTag[]>({
    queryKey: ['worker-tags', workerId],
    queryFn: () => fetchWorkerTags(workerId),
    enabled: workerId !== 'all'
  });

  return {
    availableTags: tags.data || [],
    isLoading: tags.isLoading,
    isError: tags.isError,
    error: tags.error,
    updateTags: updateTagsMutation.mutate,
    bulkUpdateTags: bulkUpdateTagsMutation.mutate,
    createTag: createTagMutation.mutate,
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    isUpdating: updateTagsMutation.isPending || bulkUpdateTagsMutation.isPending,
    isCreating: createTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
    workerTags: workerTags.data || [],
    isLoadingWorkerTags: workerTags.isLoading
  };
}; 