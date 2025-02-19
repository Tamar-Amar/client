import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClasses, createClass, deleteClass } from '../services/ClassService';
import { Class } from '../types/index';

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

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};
